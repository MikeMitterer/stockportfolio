#!/usr/bin/env python3
# ------------------------------------------------------------------------------
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
#   -D | --demo-details     Lesbare Instrumente und Detailwerte verwenden
#   -h | --help             Diese Hilfe anzeigen; auch ohne Argumente
# ------------------------------------------------------------------------------
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
die StockInfo-Weiterleitung der Konto-API; StockInfo läuft dort ohne CORS für
den Browser. --stack --stop entfernt eigene Prozesse und temporäre Kontodaten. Ohne
--stack beendet --stop nur den StockInfo-Testserver, während Konto-API und Vite
weiterlaufen können. Port, PID, Prozessstart und Scriptpfad werden im
temporären Benutzerverzeichnis vermerkt. Ein fremder Portbesitzer wird niemals
gesucht oder beendet. Das Script benötigt ps für die Prozessidentität.
"""

from __future__ import annotations

import argparse
import atexit
import json
import os
import shutil
import signal
import sys
import tempfile
import time
from pathlib import Path
from types import FrameType
from typing import Any

from local_test_stack import process_identity, run_stack_cli, translate
from terminal_style import HelpFormatter, has_theme, print_message
from test_state import OwnedStateFile


class ScriptArgumentParser(argparse.ArgumentParser):
    """Gestaltet Fehler nach dem CLITheme, falls cli_theme installiert ist."""

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
        epilog="\n".join(
            (
                translate("Examples:"),
                "  --stack --run --stockinfo-root ../StockInfo",
                "  --stack --run --demo-accounts --stockinfo-root ../StockInfo",
                "  --stack --status",
                "  --stack --stop",
                "  --run --stockinfo-root ../StockInfo --port 8899",
            )
        ),
        formatter_class=HelpFormatter,
        add_help=False,
    )
    actions = parser.add_argument_group(translate("Actions")).add_mutually_exclusive_group(required=True)
    actions.add_argument("-r", "--run", action="store_true", help=translate("Start the test server or the full stack."))
    actions.add_argument(
        "-s", "--status", action="store_true", help=translate("Check registered processes and endpoints.")
    )
    actions.add_argument("-t", "--stop", action="store_true", help=translate("Stop only registered processes."))
    options = parser.add_argument_group(translate("Options"))
    options.add_argument(
        "-S", "--stack", action="store_true", help=translate("Manage StockInfo, the account API, and Vite together.")
    )
    options.add_argument(
        "-i",
        "--stockinfo-root",
        type=Path,
        help=translate("StockInfo repository path (required for a single-server start)."),
    )
    options.add_argument(
        "-d",
        "--demo-accounts",
        action="store_true",
        help=translate("Create synthetic accounts in the temporary stack."),
    )
    options.add_argument("-p", "--port", type=int, default=8899, help=translate("StockInfo test port (default: 8899)."))
    options.add_argument("-o", "--origin", help=translate("Allowed browser origin for CORS."))
    options.add_argument("-f", "--detail-fixtures", type=Path, help=translate("Directory with detail fixtures."))
    options.add_argument(
        "-D",
        "--demo-details",
        action="store_true",
        help=translate("Use readable instruments and detail values for browser checks."),
    )
    options.add_argument("-h", "--help", action="help", help=translate("Show this help and exit."))
    args = parser.parse_args(argv or ["--help"])
    if not 1 <= args.port <= 65535:
        parser.error(translate("--port must be between 1 and 65535."))
    if args.demo_accounts and not (args.stack and args.run):
        parser.error(translate("--demo-accounts requires --stack --run."))
    return args, parser


def read_owned_state(
    state_path: Path, script_path: Path, port: int, parser: argparse.ArgumentParser
) -> dict[str, Any] | None:
    """Zustand des eigenen Testservers; ein verwaister Eintrag wird entfernt."""
    if not state_path.exists():
        return None
    try:
        state = json.loads(state_path.read_text())
        if not isinstance(state, dict):
            raise ValueError("State file must contain an object")
    except OSError, UnicodeError, ValueError:
        parser.error(
            translate("The state file is unreadable: {path}. Check the server before removing it.").format(
                path=state_path,
            )
        )
    if state.get("script") != str(script_path) or state.get("port") != port:
        parser.error(translate("The state file does not belong to this test server: {path}").format(path=state_path))
    pid = state.get("pid")
    if not isinstance(pid, int) or pid <= 1:
        parser.error(translate("The state file has an invalid process ID."))
    identity = process_identity(pid)
    if not identity or identity != state.get("identity") or script_path.name not in identity:
        state_path.unlink()
        return None
    return state


def report_server_status(existing_state: dict[str, Any] | None, port: int) -> int:
    if not existing_state:
        print_message(translate("No own test server is registered on port {port}.").format(port=port), "WARNING")
        return 1
    print_message(
        translate("StockInfo test server: {url} (PID {pid})").format(
            url=f"http://127.0.0.1:{port}",
            pid=existing_state["pid"],
        )
    )
    return 0


def stop_server(
    existing_state: dict[str, Any] | None, state_path: Path, port: int, parser: argparse.ArgumentParser
) -> int:
    """Beendet nur den eigenen Testserver und wartet, bis er weg ist; nie mit SIGKILL."""
    if not existing_state:
        print_message(translate("No own test server is registered on port {port}.").format(port=port), "WARNING")
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
    print_message(
        translate("Own test server on port {port} stopped (PID {pid}).").format(port=port, pid=pid), "SUCCESS"
    )
    return 0


def start_server(args: argparse.Namespace, script_path: Path, state_path: Path) -> int:
    """Startet StockInfo mit temporärer Datenbank und bleibt bis zum Ende im Vordergrund."""
    stockinfo_root = args.stockinfo_root.resolve()
    detail_fixtures = args.detail_fixtures.resolve() if args.detail_fixtures else None

    # Der Stack kann das Kind bereits während des Imports beenden. Dann ist
    # noch keine Zustandsdatei vorhanden, die das normale finally erreicht.
    def exit_on_termination(_signal_number: int, _frame: FrameType | None) -> None:
        raise SystemExit(0)

    termination_requested = False

    def request_termination(_signal_number: int, _frame: FrameType | None) -> None:
        nonlocal termination_requested
        termination_requested = True

    previous_sigterm = signal.signal(signal.SIGTERM, request_termination)
    data_dir = Path(tempfile.mkdtemp(prefix="stockportfolio-t39-server-"))
    atexit.register(shutil.rmtree, data_dir, ignore_errors=True)
    signal.signal(signal.SIGTERM, exit_on_termination)
    if termination_requested:
        raise SystemExit(0)
    origin = args.origin or "http://127.0.0.1:5189"
    os.environ["DATABASE_PATH"] = str(data_dir / "stockinfo.db")
    os.environ["CORS_ORIGINS"] = json.dumps([origin])
    os.chdir(data_dir)
    sys.path.insert(0, str(stockinfo_root))

    # Erst jetzt: Beide Importe laden StockInfos App samt Einstellungen.
    import uvicorn
    from stockinfo_fixture_app import FixtureConfig, create_fixture_app

    app = create_fixture_app(FixtureConfig(data_dir, origin, args.demo_details, detail_fixtures))

    # Exklusiv anlegen: ein zweiter Start darf die erste Prozesskennung nicht ersetzen.
    process_state = {
        "script": str(script_path),
        "port": args.port,
        "pid": os.getpid(),
        "identity": process_identity(os.getpid()),
    }
    owned_state = OwnedStateFile(state_path)
    try:
        owned_state.publish(process_state)
        uvicorn.run(app, host="127.0.0.1", port=args.port, log_level="info")
    finally:
        try:
            owned_state.remove()
        finally:
            try:
                shutil.rmtree(data_dir)
            finally:
                signal.signal(signal.SIGTERM, previous_sigterm)

    return 0


def run_single_server(args: argparse.Namespace, script_path: Path, parser: argparse.ArgumentParser) -> int:
    """Startet oder verwaltet den isolierten StockInfo-Testserver."""
    state_path = Path(tempfile.gettempdir()) / f"stockportfolio-test-server-{args.port}.json"
    existing_state = read_owned_state(state_path, script_path, args.port, parser)
    if args.status:
        return report_server_status(existing_state, args.port)
    if args.stop:
        return stop_server(existing_state, state_path, args.port, parser)
    if existing_state:
        parser.error(
            translate("An own test server is already running on port {port}; run --stop first.").format(
                port=args.port,
            )
        )
    if not args.stockinfo_root:
        parser.error(translate("A single-server start requires --stockinfo-root."))
    return start_server(args, script_path, state_path)


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
