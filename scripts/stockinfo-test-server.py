#!/usr/bin/env python3
#------------------------------------------------------------------------------
# stockinfo-test-server.py — StockInfo-Testkurse und lokalen Browserstack starten
#
# Der Stack läuft mit StockPortfolios Python-Umgebung und temporären Daten;
# sein StockInfo-Kindprozess verwendet StockInfos Python-Umgebung. Ohne
# --stack benötigt der Einzelserver direkt StockInfos Python-Umgebung.
#
# Verwendung:
#   .venv/bin/python scripts/stockinfo-test-server.py --stack --run
#   .venv/bin/python scripts/stockinfo-test-server.py --stack --status
#   .venv/bin/python scripts/stockinfo-test-server.py --stack --stop
#
# Optionen:
#   -r | --run              Testserver beziehungsweise Stack starten
#   -s | --status           Registrierte Prozesse und Endpunkte prüfen
#   -t | --stop             Nur registrierte eigene Prozesse beenden
#   -S | --stack            Konto-API und Vite ebenfalls verwalten
#   -i | --stockinfo-root   StockInfo-Repository angeben
#   -d | --demo-accounts    Synthetische Konten im Stack anlegen
#   -p | --port             StockInfo-Testport angeben
#   -o | --origin           Erlaubte Browser-Herkunft angeben
#   -f | --detail-fixtures  Detail-Fixtures angeben
#   -D | --demo-details     Lesbare Quelldaten verwenden
#   -h | --help             Diese Hilfe anzeigen; auch ohne Argumente
#------------------------------------------------------------------------------
"""Echter StockInfo-Server mit temporärer Datenbank und lokaler Testquelle.

Der Stack startet mit StockPortfolios Python-Umgebung. Sein StockInfo-
Kindprozess nutzt StockInfos Python-Umgebung und einen temporären Arbeitsordner.
Die App-Routen, QuoteService, CachedQuoteService und SQLite-Persistenz bleiben
unverändert. Nur externe Quellen und der produktive Start-Scheduler werden
für die reproduzierbare Browserprüfung ersetzt. Fehlantworten werden getrennt
über eine ausdrücklich bezeichnete Test-Middleware eingespeist.

StockInfo-only: direkt StockInfos Python, --stockinfo-root PFAD und optional --port.
Ganzer Stack: zusätzlich --stack; --demo-accounts legt auf Wunsch zwei
synthetische Konten an. --stack --status prüft Prozesse, Endpunkte, Kurs und
CORS; --stack --stop entfernt eigene Prozesse und temporäre Kontodaten. Ohne
--stack beendet --stop nur den StockInfo-Testserver, während Konto-API und Vite
weiterlaufen können. Port, PID, Prozessstart und Scriptpfad werden im
temporären Benutzerverzeichnis vermerkt. Ein fremder Portbesitzer wird niemals
gesucht oder beendet. Das Script benötigt ps für die Prozessidentität.
"""

from __future__ import annotations

import argparse
from collections.abc import AsyncIterator, Awaitable, Callable
from contextlib import asynccontextmanager
from datetime import datetime, timedelta, timezone
import json
import os
import signal
import shutil
import subprocess
from pathlib import Path
import sys
import tempfile
import time
from typing import Any

from cli_theme import HelpFormatter, has_theme, print_message
from local_test_stack import run_stack_cli, translate


class ScriptArgumentParser(argparse.ArgumentParser):
    """Gestaltet Fehler wie die ProjectTools-CLI, falls sie installiert ist."""

    def error(self, message: str) -> None:
        if not has_theme():
            super().error(message)
        self.print_usage(sys.stderr)
        print_message("✗ " + message, "DANGER", sys.stderr)
        self.exit(2)


def parse_args(argv: list[str]) -> tuple[argparse.Namespace, argparse.ArgumentParser]:
    """Parst die CLI, ohne beim Import einen Server zu starten."""
    parser = ScriptArgumentParser(
        prog=Path(__file__).name,
        description=translate("Run the local StockInfo fixture server and optional browser stack."),
        epilog="\n".join((
            translate("Examples:"),
            "  --stack --run --stockinfo-root ../StockInfo",
            "  --stack --run --demo-accounts --stockinfo-root ../StockInfo",
            "  --stack --status",
            "  --stack --stop",
            "  --run --stockinfo-root ../StockInfo --port 8899",
        )),
        formatter_class=HelpFormatter,
        add_help=False,
    )
    actions = parser.add_argument_group(translate("Actions")).add_mutually_exclusive_group(required=True)
    actions.add_argument("-r", "--run", action="store_true", help=translate("Start the test server or the full stack."))
    actions.add_argument("-s", "--status", action="store_true", help=translate("Check registered processes and endpoints."))
    actions.add_argument("-t", "--stop", action="store_true", help=translate("Stop only registered processes."))
    options = parser.add_argument_group(translate("Options"))
    options.add_argument("-S", "--stack", action="store_true", help=translate("Manage StockInfo, the account API, and Vite together."))
    options.add_argument("-i", "--stockinfo-root", type=Path, help=translate("StockInfo repository path (required for a single-server start)."))
    options.add_argument("-d", "--demo-accounts", action="store_true", help=translate("Create synthetic accounts in the temporary stack."))
    options.add_argument("-p", "--port", type=int, default=8899, help=translate("StockInfo test port (default: 8899)."))
    options.add_argument("-o", "--origin", help=translate("Allowed browser origin for CORS."))
    options.add_argument("-f", "--detail-fixtures", type=Path, help=translate("Directory with detail fixtures."))
    options.add_argument("-D", "--demo-details", action="store_true", help=translate("Use readable sources and notes for browser checks."))
    options.add_argument("-h", "--help", action="help", help=translate("Show this help and exit."))
    args = parser.parse_args(argv or ["--help"])
    if not 1 <= args.port <= 65535:
        parser.error(translate("--port must be between 1 and 65535."))
    if args.demo_accounts and not (args.stack and args.run):
        parser.error(translate("--demo-accounts requires --stack --run."))
    return args, parser


def run_single_server(args: argparse.Namespace, script_path: Path, parser: argparse.ArgumentParser) -> int:
    """Startet oder verwaltet den isolierten StockInfo-Testserver."""
    origin = args.origin or "http://127.0.0.1:5189"
    state_path = Path(tempfile.gettempdir()) / f"stockportfolio-test-server-{args.port}.json"


    def process_identity(pid: int) -> str:
        """PID allein reicht wegen Wiederverwendung nicht; Startzeit und Kommando prüfen."""
        result = subprocess.run(["ps", "-p", str(pid), "-o", "stat=", "-o", "lstart=", "-o", "command="],
                                capture_output=True, text=True, check=False)
        if result.stderr.strip():
            raise RuntimeError(
                translate("Process inspection failed: {error}").format(error=result.stderr.strip())
            )
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
            parser.error(translate("The state file does not belong to this test server: {path}").format(path=state_path))
        pid = state.get("pid")
        if not isinstance(pid, int) or pid <= 1:
            parser.error(translate("The state file has an invalid process ID."))
        identity = process_identity(pid)
        if not identity or identity != state.get("identity") or script_path.name not in identity:
            state_path.unlink()
            return None
        return state


    existing_state = read_owned_state()
    if args.status:
        if not existing_state:
            print_message(translate("No own test server is registered on port {port}.").format(port=args.port), "WARNING")
            return 1
        print_message(translate("StockInfo test server: {url} (PID {pid})").format(
            url=f"http://127.0.0.1:{args.port}", pid=existing_state["pid"],
        ))
        return 0
    if args.stop:
        if not existing_state:
            print_message(translate("No own test server is registered on port {port}.").format(port=args.port), "WARNING")
            return 0
        pid = existing_state["pid"]
        os.kill(pid, signal.SIGTERM)
        deadline = time.monotonic() + 10
        while process_identity(pid) == existing_state["identity"] and time.monotonic() < deadline:
            time.sleep(0.1)
        if process_identity(pid) == existing_state["identity"]:
            parser.error(translate("The server is still stopping; run --stop again. It was not killed."))
        # Der Server räumt selbst auf; nur seinen unveränderten Rest entfernen.
        if state_path.exists() and json.loads(state_path.read_text()).get("pid") == pid:
            state_path.unlink()
        print_message(translate("Own test server on port {port} stopped (PID {pid}).").format(port=args.port, pid=pid), "SUCCESS")
        return 0
    if existing_state:
        parser.error(translate("An own test server is already running on port {port}; run --stop first.").format(
            port=args.port,
        ))
    if not args.stockinfo_root:
        parser.error(translate("A single-server start requires --stockinfo-root."))
    stockinfo_root = args.stockinfo_root.resolve()
    detail_fixtures = args.detail_fixtures.resolve() if args.detail_fixtures else None
    data_dir = Path(tempfile.mkdtemp(prefix="stockportfolio-t39-server-"))
    os.environ["DATABASE_PATH"] = str(data_dir / "stockinfo.db")
    os.environ["CORS_ORIGINS"] = json.dumps([origin])
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
        {**BASE, "identity": {"kind": "listed", "ticker": "AAPL", "mic": "XNAS", "isin": "US0378331005"}, "symbol": "AAPL", "name": "Apple Inc.", "type": "stock", "currency": "USD", "price": 225.0, "ter": None, "accumulating": None},
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
        if args.demo_details:
            source_labels = {"risk-a": "Demo Source A", "risk-b": "Demo Source B"}
            for definition in catalog["details"]:
                definition["sources"] = [source_labels.get(source, source) for source in definition["sources"]]
                for item in definition["scopes"]:
                    item["source"] = source_labels.get(item["source"], item["source"])
            for detail in values.values():
                if detail.get("source") in source_labels:
                    detail["source"] = source_labels[detail["source"]]
            values["risk-a.note"]["value"] = "Beispielnotiz für die Detailansicht."
            values["risk-a.note"]["manual_value"] = values["risk-a.note"]["value"]
        definitions = [DetailDefinition.model_validate(entry) for entry in catalog["details"]]
        core_source = "StockInfo Demo" if args.demo_details else "t40-core"
        scope = {"source": core_source, "instrument_types": ["etf"], "identity_kinds": ["listed"]}
        for name, label_en, label_de, value in [("ter", "TER", "TER", 0.2), ("volatility", "Volatility", "Volatilität", 11.4)]:
            definitions.append(DetailDefinition(name=name, kind="number", unit="percent", label_en=label_en, label_de=label_de,
                                                sources=[core_source], scopes=[scope]))
            values[name] = {"value": value, "origin": "provider", "source": core_source}
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
            if changes.get("mode") not in {"normal", "invalid-quote", "invalid-catalog", "unknown-identity", "fields-down", "fx-stale", "fx-missing", "fx-invalid", "types-empty", "types-incomplete", "types-future", "types-down"}:
                return JSONResponse({"error": "unknown test mode"}, status_code=400)
            state.update({key: changes[key] for key in ("mode", "symbol") if key in changes})
            return JSONResponse(state, headers={"Access-Control-Allow-Origin": origin})
        if request.url.path == "/instrument-types" and state["mode"].startswith("types-"):
            headers = {"Access-Control-Allow-Origin": origin, "Cache-Control": "no-store"}
            if state["mode"] == "types-down":
                return JSONResponse({"detail": "Typkatalog im Testszenario nicht verfügbar"}, status_code=503, headers=headers)
            if detail_fixtures is None:
                return JSONResponse({"detail": "--detail-fixtures fehlt"}, status_code=500, headers=headers)
            fixture_name = {"types-empty": "instrument-types-200-empty.json",
                            "types-incomplete": "instrument-types-200-incomplete.json",
                            "types-future": "instrument-types-200.json"}[state["mode"]]
            fixture = json.loads((detail_fixtures / fixture_name).read_text())
            return JSONResponse(fixture["response"]["body"], headers=headers)
        if request.url.path == "/fx" and state["mode"] == "fx-missing":
            return JSONResponse({"code": "fx_source_unavailable"}, status_code=502,
                                headers={"Access-Control-Allow-Origin": origin})
        if request.url.path == "/fields" and state["mode"] == "fields-down":
            return JSONResponse({"code": "t40_test_fields_unavailable"}, status_code=503,
                                headers={"Access-Control-Allow-Origin": origin})
        response = await call_next(request)
        if request.url.path == "/fx" and response.status_code == 200 and state["mode"] in {"fx-stale", "fx-invalid"}:
            body = json.loads(b"".join([chunk async for chunk in response.body_iterator]))
            if state["mode"] == "fx-invalid":
                body["rate"] = 0
            else:
                body.update(stale=True, cached=True, quote_time="2026-09-01T10:00:00Z")
            return JSONResponse(body, headers={"Access-Control-Allow-Origin": origin})
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
    # Uvicorn löst SIGTERM nach dem Herunterfahren erneut aus. Ohne eigenen
    # Handler beendet das Signal den Prozess vor dem Aufräumen im finally.
    previous_sigterm = signal.signal(signal.SIGTERM, signal.SIG_IGN)
    try:
        uvicorn.run(app, host="127.0.0.1", port=args.port, log_level="info")
    finally:
        try:
            if state_path.exists() and json.loads(state_path.read_text()).get("pid") == os.getpid():
                state_path.unlink()
            shutil.rmtree(data_dir)
        finally:
            signal.signal(signal.SIGTERM, previous_sigterm)

    return 0


def main(argv: list[str]) -> int:
    """Wählt Einzelserver oder den vollständigen lokalen Stack."""
    args, parser = parse_args(argv)
    script_path = Path(__file__).resolve()
    if args.stack:
        try:
            return run_stack_cli(args, script_path)
        except RuntimeError as error:
            parser.error(str(error))
    return run_single_server(args, script_path, parser)


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
