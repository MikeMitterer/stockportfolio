"""Echter StockInfo-Server mit temporärer Datenbank und lokaler Testquelle.

Start mit StockInfos Python-Umgebung aus einem leeren temporären Arbeitsordner.
Die App-Routen, QuoteService, CachedQuoteService und SQLite-Persistenz bleiben
unverändert. Nur externe Quellen und der produktive Start-Scheduler werden
für die reproduzierbare Browserprüfung ersetzt. Fehlantworten werden getrennt
über eine ausdrücklich bezeichnete Test-Middleware eingespeist.

Start: StockInfos Python, --stockinfo-root PFAD, optional --port (Vorgabe 8899).
Stop:  python scripts/stockinfo-test-server.py --stop [--port 8899]
Port, PID, Prozessstart und Scriptpfad werden im temporären Benutzerverzeichnis
vermerkt. --stop beendet ausschließlich den damit identifizierten eigenen
Prozess über SIGTERM; ein fremder Portbesitzer wird niemals gesucht oder beendet.
"""

from __future__ import annotations

import argparse
from collections.abc import AsyncIterator, Awaitable, Callable
from contextlib import asynccontextmanager
from datetime import datetime, timedelta, timezone
import json
import os
import signal
import subprocess
from pathlib import Path
import sys
import tempfile
import time
from typing import Any

sys.dont_write_bytecode = True
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("--stockinfo-root", type=Path)
parser.add_argument("--stop", action="store_true", help="Den eigenen Server auf --port sauber beenden")
parser.add_argument("--port", type=int, default=8899)
parser.add_argument("--detail-fixtures", type=Path)
args = parser.parse_args()
if not 1 <= args.port <= 65535:
    parser.error("--port muss zwischen 1 und 65535 liegen")
script_path = Path(__file__).resolve()
state_path = Path(tempfile.gettempdir()) / f"stockportfolio-test-server-{args.port}.json"


def process_identity(pid: int) -> str:
    """PID allein reicht wegen Wiederverwendung nicht; Startzeit und Kommando prüfen."""
    result = subprocess.run(["ps", "-p", str(pid), "-o", "stat=", "-o", "lstart=", "-o", "command="],
                            capture_output=True, text=True, check=False)
    if result.stderr.strip():
        raise RuntimeError(f"Prozessprüfung fehlgeschlagen: {result.stderr.strip()}")
    identity = result.stdout.strip()
    if result.returncode or not identity or identity.startswith("Z"):
        return ""
    # Der Prozessstatus ändert sich laufend, Startzeit und Kommando bleiben gleich.
    return identity.split(None, 1)[1]


def read_owned_state() -> dict[str, Any] | None:
    if not state_path.exists():
        return None
    state = json.loads(state_path.read_text())
    if state.get("script") != str(script_path) or state.get("port") != args.port:
        parser.error(f"Die Zustandsdatei {state_path} gehört nicht zu diesem Testserver")
    pid = state.get("pid")
    if not isinstance(pid, int) or pid <= 1:
        parser.error("Ungültige Prozesskennung in der Zustandsdatei")
    identity = process_identity(pid)
    if not identity or identity != state.get("identity") or script_path.name not in identity:
        state_path.unlink()
        return None
    return state


existing_state = read_owned_state()
if args.stop:
    if not existing_state:
        print(f"Kein eigener Testserver auf Port {args.port} registriert.")
        sys.exit(0)
    pid = existing_state["pid"]
    os.kill(pid, signal.SIGTERM)
    deadline = time.monotonic() + 10
    while process_identity(pid) == existing_state["identity"] and time.monotonic() < deadline:
        time.sleep(0.1)
    if process_identity(pid) == existing_state["identity"]:
        parser.error("Server beendet sich noch; kein erzwungenes Beenden. --stop erneut aufrufen.")
    # Der Server räumt selbst auf; nur seinen unveränderten Rest entfernen.
    if state_path.exists() and json.loads(state_path.read_text()).get("pid") == pid:
        state_path.unlink()
    print(f"Eigener Testserver auf Port {args.port} sauber beendet (PID {pid}).")
    sys.exit(0)
if existing_state:
    parser.error(f"Eigener Testserver läuft bereits auf Port {args.port}; zuerst --stop aufrufen")
if not args.stockinfo_root:
    parser.error("Zum Starten ist --stockinfo-root erforderlich")
stockinfo_root = args.stockinfo_root.resolve()
detail_fixtures = args.detail_fixtures.resolve() if args.detail_fixtures else None
data_dir = Path(tempfile.mkdtemp(prefix="stockportfolio-t39-server-"))
os.environ["DATABASE_PATH"] = str(data_dir / "stockinfo.db")
os.environ["CORS_ORIGINS"] = '["http://127.0.0.1:5189"]'
os.chdir(data_dir)
sys.path.insert(0, str(stockinfo_root))

import uvicorn
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse, Response
from app.container import get_cached_quote_service, get_daily_history_service, get_fx_service
from app.db import init_db
from app.detail_models import DetailDefinition, DetailInput
from app.main import app
from app.models import QuoteResponse
from app.providers.base import RawQuote, SourceAnswer
from app.repository import QuoteRepository
from app.routers.migration import get_gate
from app.services.daily_history import DailyHistoryService
from app.services.daily_sync import DailyCloseSync
from app.services.quote_cache import CachedQuoteService
from app.services.quote_service import QuoteService
from app.services.fx_service import CachedFxService
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


def prepare_details(repository: QuoteRepository) -> tuple[list[DetailDefinition], dict[str, Any]]:
    """T-40 verwendet dieselbe Testumgebung mit offen deklarierten Zusatzfeldern."""
    if detail_fixtures is None:
        return [], {}
    catalog = json.loads((detail_fixtures / "detail-catalog.json").read_text())
    values = json.loads((detail_fixtures / "detail-values.json").read_text())
    definitions = [DetailDefinition.model_validate(entry) for entry in catalog["details"]]
    scope = {"source": "t40-core", "instrument_types": ["etf"], "identity_kinds": ["listed"]}
    for name, label_en, label_de, value in [("ter", "TER", "TER", 0.2), ("volatility", "Volatility", "Volatilität", 11.4)]:
        definitions.append(DetailDefinition(name=name, kind="number", unit="percent", label_en=label_en, label_de=label_de,
                                            sources=["t40-core"], scopes=[scope]))
        values[name] = {"value": value, "origin": "provider", "source": "t40-core"}
    repository.detail_catalog(definitions)
    return definitions, values


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


class LocalFx:
    """Kontrollierte Devisenquelle hinter StockInfos echtem FX-Service."""

    name = "t38-local-fx"

    def fetch_fx_rate(self, base: str, quote: str) -> SourceAnswer[float]:
        rates = {"EUR": 1.0, "USD": 1.25, "GBP": 1 / 1.2, "CAD": 1.5}
        if base not in rates or quote not in rates:
            return SourceAnswer(None)
        return SourceAnswer(rates[quote] / rates[base])


@asynccontextmanager
async def test_lifespan(application: FastAPI) -> AsyncIterator[None]:
    database = str(data_dir / "stockinfo.db")
    init_db(database)
    repository = QuoteRepository(database)
    definitions, details = prepare_details(repository)
    now = datetime.now(timezone.utc).isoformat()
    for seed in SEEDS:
        applicable = {definition.name for definition in definitions if definition.applies(seed["type"], seed["identity"]["kind"])}
        readings: dict[str, dict[str, Any]] = {}
        for name, entry in details.items():
            if name in applicable and entry.get("origin") == "provider":
                readings.setdefault(entry["source"], {})[name] = entry
        saved = repository.save_quote(QuoteResponse(**seed, quote_time=now, fetched_at=now, detail_readings=readings))
        manual = {name: DetailInput(value=entry["manual_value"], currency=entry.get("manual_currency"))
                  for name, entry in details.items() if name in applicable and entry.get("manual_value") is not None}
        if manual:
            repository.set_detail_overrides(saved.instrument_id, manual, now)
    daily = LocalDaily()
    service = CachedQuoteService(QuoteService(LocalQuotes(), EmptyEtfEnricher(), LocalResolver()), repository, 6, DailyCloseSync(repository, daily))
    application.dependency_overrides[get_cached_quote_service] = lambda: service
    history = DailyHistoryService(repository, daily, service)
    application.dependency_overrides[get_daily_history_service] = lambda: history
    application.dependency_overrides[get_fx_service] = lambda: CachedFxService(LocalFx(), repository, 6)
    get_gate().start()
    print(json.dumps({"test_database": database, "symbols": [item["symbol"] for item in SEEDS]}), flush=True)
    yield


app.router.lifespan_context = test_lifespan


@app.middleware("http")
async def test_faults(request: Request, call_next: Callable[[Request], Awaitable[Response]]) -> Response:
    if request.url.path == "/__test/scenario" and request.method == "POST":
        changes = await request.json()
        if changes.get("mode") not in {"normal", "invalid-quote", "invalid-catalog", "unknown-identity", "fields-down", "fx-stale", "fx-missing", "fx-invalid"}:
            return JSONResponse({"error": "unknown test mode"}, status_code=400)
        state.update({key: changes[key] for key in ("mode", "symbol") if key in changes})
        return JSONResponse(state, headers={"Access-Control-Allow-Origin": "http://127.0.0.1:5189"})
    if request.url.path == "/fx" and state["mode"] == "fx-missing":
        return JSONResponse({"code": "fx_source_unavailable"}, status_code=502,
                            headers={"Access-Control-Allow-Origin": "http://127.0.0.1:5189"})
    if request.url.path == "/fields" and state["mode"] == "fields-down":
        return JSONResponse({"code": "t40_test_fields_unavailable"}, status_code=503,
                            headers={"Access-Control-Allow-Origin": "http://127.0.0.1:5189"})
    response = await call_next(request)
    if request.url.path == "/fx" and response.status_code == 200 and state["mode"] in {"fx-stale", "fx-invalid"}:
        body = json.loads(b"".join([chunk async for chunk in response.body_iterator]))
        if state["mode"] == "fx-invalid":
            body["rate"] = 0
        else:
            body.update(stale=True, cached=True, quote_time="2026-09-01T10:00:00Z")
        return JSONResponse(body, headers={"Access-Control-Allow-Origin": "http://127.0.0.1:5189"})
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


# Exklusiv anlegen: ein zweiter Start darf die erste Prozesskennung nicht ersetzen.
process_state = {"script": str(script_path), "port": args.port, "pid": os.getpid(), "identity": process_identity(os.getpid())}
with state_path.open("x") as state_file:
    json.dump(process_state, state_file)
try:
    uvicorn.run(app, host="127.0.0.1", port=args.port, log_level="info")
finally:
    if state_path.exists() and json.loads(state_path.read_text()).get("pid") == os.getpid():
        state_path.unlink()
