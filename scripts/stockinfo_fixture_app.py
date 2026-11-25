"""StockInfos echte App mit Testkursen, Testquellen und Fehlerszenarien (T-129).

Nur im StockInfo-Kindprozess importieren, nachdem `test-stack.py`
StockInfos Repository auf `sys.path` gesetzt und `DATABASE_PATH` und
`CORS_ORIGINS` gesetzt hat: Die Importe unten laden StockInfos `app` samt
Einstellungen.

Die App-Routen, QuoteService, CachedQuoteService und SQLite-Persistenz bleiben
unverändert. Ersetzt werden nur externe Quellen und der produktive
Start-Scheduler; Fehlantworten speist eine ausdrücklich bezeichnete
Test-Middleware ein.
"""

from __future__ import annotations

import json
from collections.abc import AsyncIterator, Awaitable, Callable
from contextlib import asynccontextmanager
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from pathlib import Path
from typing import Any

from app.container import get_cached_quote_service, get_daily_history_service, get_fx_service
from app.detail_models import DetailDefinition, DetailInput
from app.main import app
from app.models import QuoteResponse
from app.persistence.db import init_db
from app.persistence.repository import QuoteRepository
from app.providers.base import FxQuote, RawQuote, SourceAnswer
from app.routers.migration import get_gate
from app.services.daily_history import DailyHistoryService
from app.services.daily_sync import DailyCloseSync
from app.services.fx_service import CachedFxService
from app.services.quote_cache import CachedQuoteService
from app.services.quote_service import QuoteService
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse, Response
from stockinfo_plugin.types import NotFound
from tests.boundaries import EmptyEtfEnricher

FIXTURES = Path(__file__).resolve().parent / "fixtures"

BASE = {
    "identity": {"kind": "listed", "ticker": "EUNL", "mic": "XETR", "isin": "IE00B4L5Y983"},
    "symbol": "EUNL.DE",
    "name": "T39 Listed mit ISIN",
    "type": "etf",
    "price": 128.7,
    "currency": "EUR",
    "ter": 0.2,
    "accumulating": False,
}
EDGE_CASE_SEEDS = [
    BASE,
    {
        **BASE,
        "identity": {"kind": "listed", "ticker": "NOSI", "mic": "XETR"},
        "symbol": "NOSI.DE",
        "name": "T39 Listed ohne ISIN",
        "type": "stock",
        "price": 42.5,
    },
    {
        **BASE,
        "identity": {"kind": "pair", "base": "BTC", "quote_currency": "EUR"},
        "symbol": "BTC-EUR",
        "name": "T39 Kryptopaar",
        "type": "crypto",
        "price": 50000,
    },
    {
        **BASE,
        "identity": {"kind": "isin_only", "isin": "DE0001135275"},
        "symbol": "DE0001135275",
        "name": "T39 OTC Anleihe",
        "type": "bond",
        "price": 99.5,
    },
    {
        **BASE,
        "identity": {"kind": "listed", "ticker": "VTI", "mic": "ARCX", "isin": "US9229087690"},
        "symbol": "VTI",
        "name": "T39 USD Listing",
        "currency": "USD",
        "price": 291.4,
    },
    {
        **BASE,
        "identity": {"kind": "listed", "ticker": "AAPL", "mic": "XNAS", "isin": "US0378331005"},
        "symbol": "AAPL",
        "name": "Apple Inc.",
        "type": "stock",
        "currency": "USD",
        "price": 225.0,
        "ter": None,
        "accumulating": None,
    },
    {
        **BASE,
        "identity": {"kind": "listed", "ticker": "PEN", "mic": "XLON"},
        "symbol": "PEN.L",
        "name": "T39 Pence Listing",
        "currency": "GBp",
        "price": 1234.5,
    },
    {
        **BASE,
        "identity": {"kind": "listed", "ticker": "847652", "mic": "XFRA", "isin": "DE0008476524"},
        "symbol": "847652.F",
        "name": "DWS Vermögensbildungsfonds I",
        "type": "fund",
        "price": 210.5,
        "ter": None,
        "accumulating": None,
    },
    *[
        {
            **BASE,
            "identity": {"kind": "listed", "ticker": "DUAL", "mic": mic},
            "symbol": "DUAL",
            "name": f"T39 Mehrdeutig {mic}",
            "type": "stock",
            "currency": "USD",
        }
        for mic in ["XNAS", "XNYS"]
    ],
]

SCENARIO_MODES = {
    "normal",
    "invalid-quote",
    "invalid-catalog",
    "unknown-identity",
    "fields-down",
    "fx-stale",
    "fx-missing",
    "fx-invalid",
    "types-empty",
    "types-incomplete",
    "types-future",
    "types-down",
}
TYPE_FIXTURES = {
    "types-empty": "instrument-types-200-empty.json",
    "types-incomplete": "instrument-types-200-incomplete.json",
    "types-future": "instrument-types-200.json",
}


@dataclass(frozen=True)
class FixtureConfig:
    """Was der Start des Testservers festlegt."""

    data_dir: Path
    origin: str
    demo_details: bool
    detail_fixtures: Path | None


def load_seeds(demo: dict[str, Any], demo_details: bool) -> list[dict[str, Any]]:
    """Testkurse: Randfälle und Beispieldepot, mit `--demo-details` nur lesbare Instrumente.

    Das versionierte Fixture demo-quotes.json deckt das Beispieldepot ab; der
    Frontend-Test prüft die Übereinstimmung bei späteren Änderungen der
    Positionen. --demo-details zeigt nur verständliche Instrumente: echte
    Namen, keine Dubletten, je Instrument eigene Werte. demo-details.json ist
    dafür die einzige Quelle für Gattung und Detailwerte; der Vitest-Wächter
    demoDetails.spec.ts liest dieselbe Datei. Die Randfälle (Kryptopaar,
    OTC-Anleihe ohne Listing, mehrdeutiges Symbol, Pence-Listing, Listing ohne
    ISIN) bleiben dem normalen Start vorbehalten.
    """
    seeds = [
        *EDGE_CASE_SEEDS,
        *[{**BASE, **item} for item in json.loads((FIXTURES / "demo-quotes.json").read_text())],
    ]
    if not demo_details:
        return seeds
    missing = sorted(set(demo["instruments"]) - {seed["symbol"] for seed in seeds})
    if missing:
        raise SystemExit(f"demo-details.json nennt Instrumente ohne Testkurs: {', '.join(missing)}")
    return [
        {
            **seed,
            "name": demo["names"].get(seed["symbol"], seed["name"]),
            "type": demo["instruments"][seed["symbol"]]["type"],
            "ter": demo["instruments"][seed["symbol"]].get("ter"),
            "accumulating": demo["instruments"][seed["symbol"]].get("accumulating"),
        }
        for seed in seeds
        if seed["symbol"] in demo["instruments"]
    ]


def demo_detail_definitions(fund_source: str, metric_source: str) -> list[DetailDefinition]:
    """Deklarationen wie in StockInfo selbst.

    Gattungen, Identitätsarten und Beschriftungen folgen StockInfos
    justETF-Plugin (`app/plugins/justetf_metadata.py`: ETF und ETC, nur
    Listings) und der berechneten Volatilität (`app/calculated_metrics.py`,
    StockInfo T-89: alle Gattungen, Listings und Paare, keine reinen ISINs).
    Die Fondsgröße steht in Millionen mit Währung (StockInfo T-88).
    """
    fund_scope = {"source": fund_source, "instrument_types": ["etf", "etc"], "identity_kinds": ["listed"]}
    metric_scope = {
        "source": metric_source,
        "instrument_types": ["stock", "etf", "etc", "fund", "crypto", "bond"],
        "identity_kinds": ["listed", "pair"],
    }
    return [
        DetailDefinition(
            name="ter",
            kind="number",
            unit="percent",
            label_en="Total expense ratio (TER)",
            label_de="Gesamtkostenquote (TER)",
            sources=[fund_source],
            scopes=[fund_scope],
            minimum=0,
            maximum=5,
        ),
        DetailDefinition(
            name="volatility",
            kind="number",
            unit="percent",
            label_en="Volatility (1y)",
            label_de="Volatilität (1 Jahr)",
            sources=[metric_source],
            scopes=[metric_scope],
            minimum=0,
            maximum=500,
        ),
        DetailDefinition(
            name="fund_size",
            kind="number",
            unit="millions",
            label_en="Fund size",
            label_de="Fondsvolumen",
            sources=[fund_source],
            scopes=[fund_scope],
            minimum=0,
            maximum=2_000_000,
            currency_required=True,
        ),
        DetailDefinition(
            name="provider",
            kind="text",
            label_en="Fund provider",
            label_de="Anbieter",
            sources=[fund_source],
            scopes=[fund_scope],
        ),
        DetailDefinition(
            name="accumulating",
            kind="boolean",
            label_en="Accumulating",
            label_de="Thesaurierend",
            sources=[fund_source],
            scopes=[fund_scope],
        ),
    ]


def demo_detail_entry(name: str, value: Any, fund_source: str, metric_source: str) -> dict[str, Any]:
    """Ein Detailwert aus demo-details.json in StockInfos Form."""
    if name == "manual_fund_size":
        return {"manual_value": value["value"], "manual_currency": value["currency"]}
    entry: dict[str, Any] = {
        "value": value,
        "origin": "provider",
        "source": metric_source if name == "volatility" else fund_source,
    }
    if name == "fund_size":
        entry.update(unit="millions", currency="EUR")
    elif name in {"ter", "volatility"}:
        entry["unit"] = "percent"
    return entry


def prepare_demo_details(
    repository: QuoteRepository, demo: dict[str, Any]
) -> tuple[list[DetailDefinition], dict[str, dict[str, Any]]]:
    """Lesbare Detailwerte je Instrument, deklariert wie in StockInfo selbst."""
    fund_source, metric_source = "justETF (Demo)", "StockInfo (Demo)"
    definitions = demo_detail_definitions(fund_source, metric_source)
    repository.detail_catalog(definitions)
    values = {
        symbol: {
            ("fund_size" if name == "manual_fund_size" else name): demo_detail_entry(
                name, value, fund_source, metric_source
            )
            for name, value in entries.items()
            if name != "type"
        }
        for symbol, entries in demo["instruments"].items()
    }
    return definitions, values


def prepare_details(
    repository: QuoteRepository, detail_fixtures: Path | None
) -> tuple[list[DetailDefinition], dict[str, Any]]:
    """T-40 verwendet dieselbe Testumgebung mit offen deklarierten Zusatzfeldern."""
    if detail_fixtures is None:
        return [], {}
    catalog = json.loads((detail_fixtures / "detail-catalog.json").read_text())
    values = json.loads((detail_fixtures / "detail-values.json").read_text())
    definitions = [DetailDefinition.model_validate(entry) for entry in catalog["details"]]
    core_source = "t40-core"
    scope = {"source": core_source, "instrument_types": ["etf"], "identity_kinds": ["listed"]}
    for name, label_en, label_de, value in [
        ("ter", "TER", "TER", 0.2),
        ("volatility", "Volatility", "Volatilität", 11.4),
    ]:
        definitions.append(
            DetailDefinition(
                name=name,
                kind="number",
                unit="percent",
                label_en=label_en,
                label_de=label_de,
                sources=[core_source],
                scopes=[scope],
            )
        )
        values[name] = {"value": value, "origin": "provider", "source": core_source}
    repository.detail_catalog(definitions)
    return definitions, values


def seed_by_symbol(seeds: list[dict[str, Any]], symbol: str) -> dict[str, Any]:
    return next(item for item in seeds if item["symbol"] == symbol)


class LocalQuotes:
    """Liefert beim echten Refresh einen sichtbar anderen Preis ohne Netz."""

    def __init__(self, seeds: list[dict[str, Any]]) -> None:
        self.seeds = seeds

    def fetch_quote(self, instrument: Any) -> RawQuote:
        seed = seed_by_symbol(self.seeds, instrument.symbol)
        return RawQuote(
            symbol=instrument.symbol,
            price=seed["price"] + 1,
            quote_time=datetime.now(UTC).isoformat(),
            currency=seed["currency"],
            name=seed["name"],
            type=seed["type"],
            isin=seed["identity"].get("isin"),
            source="t39-local-test-source",
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

    def __init__(self, seeds: list[dict[str, Any]]) -> None:
        self.seeds = seeds

    def fetch_daily_closes(
        self, symbol: str, start: str | None = None, *, identity: Any = None, instrument_type: str | None = None
    ) -> SourceAnswer:
        seed = seed_by_symbol(self.seeds, symbol)
        today = datetime.now(UTC).date()
        return SourceAnswer(
            [
                {
                    "date": (today - timedelta(days=day)).isoformat(),
                    "close": seed["price"] * (1 - day / 1000),
                    "currency": seed["currency"],
                }
                for day in range(60, -1, -1)
                if start is None or (today - timedelta(days=day)).isoformat() >= start
            ]
        )


class LocalFx:
    """Kontrollierte Devisenquelle hinter StockInfos echtem FX-Service."""

    name = "t38-local-fx"

    def fetch_fx_rate(self, base: str, quote: str) -> SourceAnswer[FxQuote]:
        # Seit StockInfo T-94 nennt eine Quelle Kurs und Zeitpunkt.
        rates = {"EUR": 1.0, "USD": 1.25, "GBP": 1 / 1.2, "CAD": 1.5}
        if base not in rates or quote not in rates:
            return SourceAnswer(None)
        return SourceAnswer(FxQuote(rate=rates[quote] / rates[base], quote_time=datetime.now(UTC).isoformat()))


def save_seed(
    repository: QuoteRepository,
    seed: dict[str, Any],
    definitions: list[DetailDefinition],
    details: dict[str, Any],
    now: str,
) -> None:
    """Speichert einen Testkurs mit den Detailwerten, die für ihn deklariert sind."""
    applicable = {
        definition.name for definition in definitions if definition.applies(seed["type"], seed["identity"]["kind"])
    }
    readings: dict[str, dict[str, Any]] = {}
    for name, entry in details.items():
        if name in applicable and entry.get("origin") == "provider":
            readings.setdefault(entry["source"], {})[name] = entry
    saved = repository.save_quote(QuoteResponse(**seed, quote_time=now, fetched_at=now, detail_readings=readings))
    manual = {
        name: DetailInput(value=entry["manual_value"], currency=entry.get("manual_currency"))
        for name, entry in details.items()
        if name in applicable and entry.get("manual_value") is not None
    }
    if manual:
        repository.set_detail_overrides(saved.instrument_id, manual, now)


def install_local_sources(application: FastAPI, repository: QuoteRepository, seeds: list[dict[str, Any]]) -> None:
    """Ersetzt die externen Quellen hinter StockInfos echten Services."""
    daily = LocalDaily(seeds)
    service = CachedQuoteService(
        QuoteService(LocalQuotes(seeds), EmptyEtfEnricher(), LocalResolver()),
        repository,
        6,
        DailyCloseSync(repository, daily),
    )
    application.dependency_overrides[get_cached_quote_service] = lambda: service
    history = DailyHistoryService(repository, daily, service)
    application.dependency_overrides[get_daily_history_service] = lambda: history
    application.dependency_overrides[get_fx_service] = lambda: CachedFxService(LocalFx(), repository, 6)


def make_lifespan(config: FixtureConfig, seeds: list[dict[str, Any]], demo: dict[str, Any]) -> Callable[[FastAPI], Any]:
    """Legt Datenbank, Testkurse und Detailwerte an und ersetzt den Start-Scheduler."""

    @asynccontextmanager
    async def test_lifespan(application: FastAPI) -> AsyncIterator[None]:
        database = str(config.data_dir / "stockinfo.db")
        init_db(database)
        repository = QuoteRepository(database)
        if config.demo_details:
            definitions, demo_values = prepare_demo_details(repository, demo)

            def details_for(symbol: str) -> dict[str, Any]:
                return demo_values[symbol]

        else:
            definitions, details = prepare_details(repository, config.detail_fixtures)

            def details_for(_symbol: str) -> dict[str, Any]:
                return details

        now = datetime.now(UTC).isoformat()
        for seed in seeds:
            save_seed(repository, seed, definitions, details_for(seed["symbol"]), now)
        install_local_sources(application, repository, seeds)
        get_gate().start()
        print(json.dumps({"test_database": database, "symbols": [item["symbol"] for item in seeds]}), flush=True)
        yield

    return test_lifespan


class FaultScenarios:
    """Test-Middleware: speist auf Wunsch Fehlantworten ein (`POST /__test/scenario`)."""

    def __init__(self, origin: str, detail_fixtures: Path | None) -> None:
        self.origin = origin
        self.detail_fixtures = detail_fixtures
        self.state = {"mode": "normal", "symbol": "NOSI.DE"}

    @property
    def mode(self) -> str:
        return self.state["mode"]

    def cors(self) -> dict[str, str]:
        return {"Access-Control-Allow-Origin": self.origin}

    async def dispatch(self, request: Request, call_next: Callable[[Request], Awaitable[Response]]) -> Response:
        path = request.url.path
        if path == "/__test/scenario" and request.method == "POST":
            return await self.change_scenario(request)
        fault = self.fault_without_stockinfo(path)
        if fault is not None:
            return fault
        response = await call_next(request)
        if path == "/fx" and response.status_code == 200 and self.mode in {"fx-stale", "fx-invalid"}:
            return await self.rewrite_fx(response)
        return await self.rewrite_listing(path, response)

    async def change_scenario(self, request: Request) -> Response:
        changes = await request.json()
        if changes.get("mode") not in SCENARIO_MODES:
            return JSONResponse({"error": "unknown test mode"}, status_code=400)
        self.state.update({key: changes[key] for key in ("mode", "symbol") if key in changes})
        return JSONResponse(self.state, headers=self.cors())

    def fault_without_stockinfo(self, path: str) -> Response | None:
        """Antworten, die StockInfo gar nicht erst erreichen."""
        if path == "/instrument-types" and self.mode.startswith("types-"):
            return self.instrument_types_response()
        if path == "/fx" and self.mode == "fx-missing":
            return JSONResponse({"code": "fx_source_unavailable"}, status_code=502, headers=self.cors())
        if path == "/fields" and self.mode == "fields-down":
            return JSONResponse({"code": "t40_test_fields_unavailable"}, status_code=503, headers=self.cors())
        return None

    def instrument_types_response(self) -> Response:
        headers = {**self.cors(), "Cache-Control": "no-store"}
        if self.mode == "types-down":
            return JSONResponse(
                {"detail": "Typkatalog im Testszenario nicht verfügbar"}, status_code=503, headers=headers
            )
        if self.detail_fixtures is None:
            return JSONResponse({"detail": "--detail-fixtures fehlt"}, status_code=500, headers=headers)
        fixture = json.loads((self.detail_fixtures / TYPE_FIXTURES[self.mode]).read_text())
        return JSONResponse(fixture["response"]["body"], headers=headers)

    async def rewrite_fx(self, response: Response) -> Response:
        body = json.loads(b"".join([chunk async for chunk in response.body_iterator]))
        if self.mode == "fx-invalid":
            body["rate"] = 0
        else:
            body.update(stale=True, cached=True, quote_time="2026-09-01T10:00:00Z")
        return JSONResponse(body, headers=self.cors())

    async def rewrite_listing(self, path: str, response: Response) -> Response:
        """Bricht Kurs- und Katalogantworten für das gewählte Symbol."""
        if response.status_code != 200 or self.mode == "normal":
            return response
        is_quote = path.startswith(("/quote", "/refresh"))
        is_catalog = path == "/instruments"
        if not (is_quote or is_catalog):
            return response
        body = json.loads(b"".join([part async for part in response.body_iterator]))
        if isinstance(body, dict) and body.get("symbol") == self.state["symbol"]:
            if self.mode == "invalid-quote":
                body.pop("currency", None)
            elif self.mode == "unknown-identity":
                body["identity"] = {"kind": "future-kind"}
        if is_catalog and self.mode == "invalid-catalog":
            for item in body:
                if item["symbol"] == self.state["symbol"]:
                    item["latest_currency"] = None
        headers = dict(response.headers)
        headers.pop("content-length", None)
        return Response(json.dumps(body), status_code=200, headers=headers, media_type="application/json")


def create_fixture_app(config: FixtureConfig) -> FastAPI:
    """StockInfos App mit Testkursen, lokalen Quellen und Fehlerszenarien."""
    demo = json.loads((FIXTURES / "demo-details.json").read_text())
    seeds = load_seeds(demo, config.demo_details)
    app.router.lifespan_context = make_lifespan(config, seeds, demo)
    app.middleware("http")(FaultScenarios(config.origin, config.detail_fixtures).dispatch)
    return app
