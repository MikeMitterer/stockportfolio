"""Echter StockInfo-Server mit temporärer Datenbank und lokaler Testquelle.

Start mit StockInfos Python-Umgebung aus einem leeren temporären Arbeitsordner.
Die App-Routen, QuoteService, CachedQuoteService und SQLite-Persistenz bleiben
unverändert. Nur externe Quellen und der produktive Start-Scheduler werden
für die reproduzierbare Browserprüfung ersetzt. Fehlantworten werden getrennt
über eine ausdrücklich bezeichnete Test-Middleware eingespeist.
"""

import argparse
from collections.abc import AsyncIterator, Awaitable, Callable
from contextlib import asynccontextmanager
from datetime import datetime, timedelta, timezone
import json
import os
from pathlib import Path
import sys
import tempfile
from typing import Any

sys.dont_write_bytecode = True
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("--stockinfo-root", type=Path, required=True)
parser.add_argument("--port", type=int, default=8899)
args = parser.parse_args()
stockinfo_root = args.stockinfo_root.resolve()
data_dir = Path(tempfile.mkdtemp(prefix="stockportfolio-t39-server-"))
os.environ["DATABASE_PATH"] = str(data_dir / "stockinfo.db")
os.environ["CORS_ORIGINS"] = '["http://127.0.0.1:5189"]'
os.chdir(data_dir)
sys.path.insert(0, str(stockinfo_root))

import uvicorn
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse, Response
from app.container import get_cached_quote_service, get_daily_history_service
from app.db import init_db
from app.main import app
from app.models import QuoteResponse
from app.providers.base import RawQuote, SourceAnswer
from app.repository import QuoteRepository
from app.routers.migration import get_gate
from app.services.daily_history import DailyHistoryService
from app.services.daily_sync import DailyCloseSync
from app.services.quote_cache import CachedQuoteService
from app.services.quote_service import QuoteService
from stockinfo_plugin.types import NotFound
from tests.boundaries import EmptyEtfEnricher

BASE = {
    "identity": {"kind": "listed", "ticker": "EUNL", "mic": "XETR", "isin": "IE00B4L5Y983"},
    "symbol": "EUNL.DE", "name": "T39 Listed mit ISIN", "type": "etf",
    "price": 128.7, "currency": "EUR", "ter": 0.2, "accumulating": False,
}
SEEDS = [
    BASE,
    {**BASE, "identity": {"kind": "listed", "ticker": "NOSI", "mic": "XETR"}, "symbol": "NOSI.DE", "name": "T39 Listed ohne ISIN", "type": "stock", "price": 42.5},
    {**BASE, "identity": {"kind": "pair", "base": "BTC", "quote_currency": "EUR"}, "symbol": "BTC-EUR", "name": "T39 Kryptopaar", "type": "crypto", "price": 50000},
    {**BASE, "identity": {"kind": "isin_only", "isin": "DE0001135275"}, "symbol": "DE0001135275", "name": "T39 OTC Anleihe", "type": "bond", "price": 99.5},
    {**BASE, "identity": {"kind": "listed", "ticker": "VTI", "mic": "ARCX", "isin": "US9229087690"}, "symbol": "VTI", "name": "T39 USD Listing", "currency": "USD", "price": 291.4},
    {**BASE, "identity": {"kind": "listed", "ticker": "PEN", "mic": "XLON"}, "symbol": "PEN.L", "name": "T39 Pence Listing", "currency": "GBp", "price": 1234.5},
    *[{**BASE, "identity": {"kind": "listed", "ticker": "DUAL", "mic": mic}, "symbol": "DUAL", "name": f"T39 Mehrdeutig {mic}", "type": "stock", "currency": "USD"} for mic in ["XNAS", "XNYS"]],
]
state = {"mode": "normal", "symbol": "NOSI.DE"}


class LocalQuotes:
    """Liefert beim echten Refresh einen sichtbar anderen Preis ohne Netz."""

    def fetch_quote(self, instrument: Any) -> RawQuote:
        seed = next(item for item in SEEDS if item["symbol"] == instrument.symbol)
        return RawQuote(
            symbol=instrument.symbol, price=seed["price"] + 1,
            quote_time=datetime.now(timezone.utc).isoformat(),
            currency=seed["currency"], name=seed["name"], type=seed["type"],
            isin=seed["identity"].get("isin"), source="t39-local-test-source",
        )


class LocalResolver:
    """Alle Testinstrumente sind vorab im echten Repository angelegt."""

    def handles(self, isin: str) -> bool:
        return False

    def resolve_isin(self, isin: str) -> NotFound:
        return NotFound()

    def resolve_symbol(self, symbol: str) -> NotFound:
        return NotFound()


class LocalDaily:
    """Definierte Tagesreihe für die echte History-/Diagrammkette."""

    def fetch_daily_closes(self, symbol: str, start: str | None = None, *, identity: Any = None, instrument_type: str | None = None) -> SourceAnswer:
        seed = next(item for item in SEEDS if item["symbol"] == symbol)
        today = datetime.now(timezone.utc).date()
        return SourceAnswer([
            {"date": (today - timedelta(days=day)).isoformat(), "close": seed["price"] * (1 - day / 1000), "currency": seed["currency"]}
            for day in range(60, -1, -1)
            if start is None or (today - timedelta(days=day)).isoformat() >= start
        ])


@asynccontextmanager
async def test_lifespan(application: FastAPI) -> AsyncIterator[None]:
    database = str(data_dir / "stockinfo.db")
    init_db(database)
    repository = QuoteRepository(database)
    now = datetime.now(timezone.utc).isoformat()
    for seed in SEEDS:
        repository.save_quote(QuoteResponse(**seed, quote_time=now, fetched_at=now))
    daily = LocalDaily()
    service = CachedQuoteService(QuoteService(LocalQuotes(), EmptyEtfEnricher(), LocalResolver()), repository, 6, DailyCloseSync(repository, daily))
    application.dependency_overrides[get_cached_quote_service] = lambda: service
    history = DailyHistoryService(repository, daily, service)
    application.dependency_overrides[get_daily_history_service] = lambda: history
    get_gate().start()
    print(json.dumps({"test_database": database, "symbols": [item["symbol"] for item in SEEDS]}), flush=True)
    yield


app.router.lifespan_context = test_lifespan


@app.middleware("http")
async def test_faults(request: Request, call_next: Callable[[Request], Awaitable[Response]]) -> Response:
    if request.url.path == "/__test/scenario" and request.method == "POST":
        changes = await request.json()
        if changes.get("mode") not in {"normal", "invalid-quote", "invalid-catalog", "unknown-identity"}:
            return JSONResponse({"error": "unknown test mode"}, status_code=400)
        state.update({key: changes[key] for key in ("mode", "symbol") if key in changes})
        return JSONResponse(state, headers={"Access-Control-Allow-Origin": "http://127.0.0.1:5189"})
    response = await call_next(request)
    if response.status_code != 200 or state["mode"] == "normal":
        return response
    is_quote = request.url.path.startswith(("/quote", "/refresh"))
    is_catalog = request.url.path == "/instruments"
    if not (is_quote or is_catalog):
        return response
    content = b"".join([part async for part in response.body_iterator])
    body = json.loads(content)
    if isinstance(body, dict) and body.get("symbol") == state["symbol"]:
        if state["mode"] == "invalid-quote":
            body.pop("currency", None)
        elif state["mode"] == "unknown-identity":
            body["identity"] = {"kind": "future-kind"}
    if is_catalog and state["mode"] == "invalid-catalog":
        for item in body:
            if item["symbol"] == state["symbol"]:
                item["latest_currency"] = None
    headers = dict(response.headers)
    headers.pop("content-length", None)
    return Response(json.dumps(body), status_code=200, headers=headers, media_type="application/json")


uvicorn.run(app, host="127.0.0.1", port=args.port, log_level="info")
