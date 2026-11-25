"""Temporäre Konto-API und Vite für den StockInfo-Testserver verwalten."""

from __future__ import annotations

import gettext
import hashlib
import json
import os
import re
import secrets
import shutil
import signal
import socket
import subprocess
import sys
import tempfile
import time
import tomllib
from argparse import Namespace
from collections.abc import Callable
from dataclasses import dataclass
from pathlib import Path
from types import FrameType
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from teststack.state import OwnedStateFile
from teststack.terminal_style import print_message

# Einzige Quelle der Teststack-Ports, auch für die Prüfskripte unter
# frontend/scripts/ und docker/browser-check.sh. Sie unterscheiden sich von
# denen aus make dev-up, damit beide Stacks nebeneinander laufen (T-150).
PORTS = json.loads((Path(__file__).resolve().parent / "ports.json").read_text())
API_PORT: int = PORTS["api"]
FRONTEND_PORT: int = PORTS["frontend"]
STOCKINFO_PORT: int = PORTS["stockinfo"]
FRONTEND_ORIGIN = f"http://127.0.0.1:{FRONTEND_PORT}"
# StockInfo erlaubt im Stack bewusst eine fremde Herkunft: Der Browser fragt
# StockInfo seit T-82 über den eigenen Server ab und braucht kein CORS dort.
STOCKINFO_CORS_ORIGIN = "http://cors-not-used.invalid"
QUOTE_PATH = "/quote/IE00B4L5Y983"
# Devisenweg der USD-Positionen; brach unbemerkt mit StockInfo T-94.
FX_PATH = "/fx?base=USD&quote=EUR"
PYPROJECT = Path(__file__).resolve().parents[2] / "pyproject.toml"


def minimum_python(pyproject: Path) -> tuple[int, ...]:
    """Mindestversion aus `requires-python = ">=X.Y"`, der einzigen Quelle im Projekt."""
    with pyproject.open("rb") as file:
        requirement = tomllib.load(file)["project"]["requires-python"]
    match = re.fullmatch(r">=(\d+(?:\.\d+)*)", requirement.strip())
    if not match:
        raise RuntimeError(f'requires-python must have the form ">=X.Y": {requirement}')
    return tuple(int(part) for part in match[1].split("."))


# Gilt auch für StockInfos .venv: Der StockInfo-Kindprozess lädt Skripte aus scripts/.
MINIMUM_PYTHON = minimum_python(PYPROJECT)
translate = gettext.translation(
    "stockportfolio-test-stack",
    localedir=Path(__file__).parent / "locale",
    fallback=True,
).gettext


def process_identity(pid: int) -> str:
    """Startzeit und Kommando eines Prozesses; PID allein wird wiederverwendet.

    `lstart` folgt der Spracheinstellung. Ohne festes `LC_ALL=C` erkennt ein
    Aufruf aus einer anderen Shell-Sprache den eigenen Prozess nicht wieder.
    """
    try:
        result = subprocess.run(
            ["ps", "-p", str(pid), "-o", "stat=", "-o", "lstart=", "-o", "command="],
            capture_output=True,
            text=True,
            check=False,
            env={**os.environ, "LC_ALL": "C"},
        )
    except OSError as error:
        raise RuntimeError(translate("Process inspection requires ps access: {error}").format(error=error)) from error
    if result.stderr.strip():
        raise RuntimeError(
            translate("Process inspection requires ps access: {error}").format(
                error=result.stderr.strip(),
            )
        )
    identity = result.stdout.strip()
    if result.returncode or not identity or identity.startswith("Z"):
        return ""
    return identity.split(None, 1)[1]


def require_free_port(port: int) -> None:
    with socket.socket() as probe:
        try:
            probe.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
            probe.bind(("127.0.0.1", port))
        except OSError as error:
            raise RuntimeError(
                translate("Port {port} is already in use; no process was stopped").format(
                    port=port,
                )
            ) from error


def require_minimum_python(interpreter: Path) -> None:
    """Bricht ab, wenn der Interpreter älter als MINIMUM_PYTHON ist.

    Ohne diese Prüfung endete eine veraltete StockInfo-.venv erst im Kindprozess
    mit einem SyntaxError statt mit dem nächsten Schritt.
    """
    check = f"import sys; sys.exit(0 if sys.version_info >= {MINIMUM_PYTHON} else 1)"
    if subprocess.run([str(interpreter), "-c", check], check=False).returncode != 0:  # nosec B603
        raise RuntimeError(
            translate(
                "StockInfo Python environment needs Python {version} or newer: {path}; run make setup in StockInfo"
            ).format(version=".".join(map(str, MINIMUM_PYTHON)), path=interpreter)
        )


def preflight(project_root: Path, stockinfo_root: Path, stockinfo_port: int) -> Path:
    if not process_identity(os.getpid()):
        raise RuntimeError(translate("ps cannot identify this process"))
    for port in (stockinfo_port, API_PORT, FRONTEND_PORT):
        require_free_port(port)
    stockinfo_python = stockinfo_root / ".venv/bin/python"
    if not stockinfo_python.is_file():
        raise RuntimeError(
            translate("Missing StockInfo Python environment: {path}").format(
                path=stockinfo_python,
            )
        )
    require_minimum_python(stockinfo_python)
    for executable in (
        project_root / "api/node_modules/.bin/tsx",
        project_root / "frontend/node_modules/vite/bin/vite.js",
    ):
        if not executable.is_file():
            raise RuntimeError(
                translate("Missing {path}; install the declared npm packages first").format(
                    path=executable,
                )
            )
    if not shutil.which("node"):
        raise RuntimeError(translate("Missing Node.js in PATH"))
    return stockinfo_python


@dataclass(frozen=True)
class StackPlan:
    """Was ein Stackstart festlegt: Orte, Port und Testdaten-Optionen."""

    project_root: Path
    script_path: Path
    stockinfo_root: Path
    stockinfo_python: Path
    data_dir: Path
    stockinfo_port: int
    demo_details: bool = False
    detail_fixtures: Path | None = None


def child_commands(plan: StackPlan) -> dict[str, list[str]]:
    """Befehle der drei Kindprozesse; StockInfo läuft mit StockInfos Python."""
    stockinfo_command = [
        str(plan.stockinfo_python),
        "-B",
        str(plan.script_path),
        "--run",
        "--stockinfo-root",
        str(plan.stockinfo_root),
        "--port",
        str(plan.stockinfo_port),
        "--origin",
        STOCKINFO_CORS_ORIGIN,
    ]
    if plan.demo_details:
        stockinfo_command.append("--demo-details")
    if plan.detail_fixtures:
        stockinfo_command.extend(("--detail-fixtures", str(plan.detail_fixtures.resolve())))
    node = shutil.which("node") or "node"
    return {
        "stockinfo": stockinfo_command,
        "api": [node, "--import", "tsx", "src/index.ts"],
        "frontend": [
            node,
            str(plan.project_root / "frontend/node_modules/vite/bin/vite.js"),
            "--config",
            str(plan.project_root / "frontend/vite.config.ts"),
            "--host",
            "127.0.0.1",
            "--port",
            str(FRONTEND_PORT),
            "--strictPort",
        ],
    }


def child_environments(plan: StackPlan) -> dict[str, dict[str, str]]:
    return {
        "stockinfo": {},
        "api": {
            "PORT": str(API_PORT),
            "STOCKPORTFOLIO_DATA_DIR": str(plan.data_dir / "accounts"),
            "STOCKPORTFOLIO_PUBLIC_ORIGIN": FRONTEND_ORIGIN,
            "STOCKPORTFOLIO_SECURE_COOKIES": "false",
            "STOCKINFO_API_URL": f"http://127.0.0.1:{plan.stockinfo_port}",
        },
        # Proxy-Ziel der Vite-Konfiguration: die Konto-API dieses Stacks.
        "frontend": {"VITE_DEV_API_TARGET": f"http://127.0.0.1:{API_PORT}"},
    }


def start_children(
    plan: StackPlan,
    children: dict[str, dict[str, object]],
    check_cancelled: Callable[[], None] | None = None,
) -> None:
    project_root, data_dir = plan.project_root, plan.data_dir
    environments = child_environments(plan)
    for name, command in child_commands(plan).items():
        log_path = data_dir / f"{name}.log"
        process: subprocess.Popen[bytes] | None = None
        try:
            with log_path.open("ab") as log_file:
                process = subprocess.Popen(
                    command,
                    cwd=project_root / name if name in {"api", "frontend"} else project_root,
                    env={**os.environ, **environments[name]},
                    stdin=subprocess.DEVNULL,
                    stdout=log_file,
                    stderr=subprocess.STDOUT,
                    start_new_session=True,
                )
            time.sleep(0.1)
            identity = process_identity(process.pid)
            if not identity:
                raise RuntimeError(
                    translate("{name} exited during startup; see {path}").format(
                        name=name,
                        path=log_path,
                    )
                )
            children[name] = {"pid": process.pid, "identity": identity, "log": str(log_path)}
            if check_cancelled is not None:
                check_cancelled()
        except Exception, KeyboardInterrupt, SystemExit:
            if process is not None and name not in children and process.poll() is None:
                os.killpg(process.pid, signal.SIGTERM)
                process.wait(timeout=10)
            raise


def stop_children(children: dict[str, dict[str, object]]) -> None:
    errors: list[str] = []
    for name in reversed(tuple(children)):
        child = children[name]
        try:
            pid = int(child["pid"])
            current_identity = process_identity(pid)
            if not current_identity:
                continue
            if current_identity != child["identity"]:
                raise RuntimeError(
                    translate("Refusing to stop {name}: its process identity changed").format(
                        name=name,
                    )
                )
            if os.getpgid(pid) != pid:
                raise RuntimeError(
                    translate("Refusing to stop {name}: its process group changed").format(
                        name=name,
                    )
                )
            os.killpg(pid, signal.SIGTERM)
            deadline = time.monotonic() + 10
            while process_identity(pid) == child["identity"] and time.monotonic() < deadline:
                time.sleep(0.1)
            if process_identity(pid) == child["identity"]:
                raise RuntimeError(translate("{name} did not stop; see {path}").format(name=name, path=child["log"]))
        except (OSError, RuntimeError) as error:
            errors.append(str(error))
    if errors:
        raise RuntimeError("; ".join(errors))


def remove_data(data_dir: Path) -> None:
    temporary_root = Path(tempfile.gettempdir()).resolve()
    resolved = data_dir.resolve()
    if resolved.parent != temporary_root or not resolved.name.startswith("stockportfolio-t63-"):
        raise RuntimeError(
            translate("Refusing to remove unexpected test directory: {path}").format(
                path=data_dir,
            )
        )
    if resolved.exists():
        shutil.rmtree(resolved)


def request(
    url: str, origin: str | None = None, body: dict[str, str] | None = None, cookie: str | None = None
) -> tuple[int, dict[str, str], bytes]:
    headers = {"Origin": origin} if origin else {}
    if body is not None:
        headers["Content-Type"] = "application/json"
    if cookie:
        headers["Cookie"] = cookie
    # Nur HTTP(S): urlopen öffnete sonst auch file:-Adressen (bandit B310).
    if not url.startswith(("http://", "https://")):
        raise ValueError(f"Only http(s) URLs are allowed: {url}")
    http_request = Request(url, data=json.dumps(body).encode() if body is not None else None, headers=headers)
    try:
        with urlopen(http_request, timeout=2) as response:  # nosec B310
            return response.status, {key.lower(): value for key, value in response.headers.items()}, response.read()
    except HTTPError as error:
        raise RuntimeError(
            translate("{url} returned HTTP {status}").format(
                url=url,
                status=error.code,
            )
        ) from error


def check_stack(stockinfo_port: int, demo_accounts: bool = False) -> None:
    stockinfo_url = f"http://127.0.0.1:{stockinfo_port}"
    for path in ("/health", QUOTE_PATH, FX_PATH):
        status, _, payload = request(stockinfo_url + path)
        if status != 200:
            raise RuntimeError(translate("StockInfo {path} has the wrong response").format(path=path))
        if path == QUOTE_PATH and json.loads(payload).get("price") != 128.7:
            raise RuntimeError(translate("The known StockInfo test quote is missing"))
        if path == FX_PATH and json.loads(payload).get("rate") != 0.8:
            raise RuntimeError(translate("The known StockInfo test exchange rate is missing"))
    status, _, _ = request(f"http://127.0.0.1:{API_PORT}/healthz")
    if status != 200:
        raise RuntimeError(translate("The account API health check failed"))
    status, _, payload = request(f"http://127.0.0.1:{API_PORT}/api/setup/status")
    if status != 200 or json.loads(payload).get("required") != (not demo_accounts):
        raise RuntimeError(translate("The account API has unexpected setup state"))
    # Vite leitet /api an die Konto-API weiter; ohne Sitzung antwortet die
    # StockInfo-Weiterleitung mit 401, nicht mit 404.
    try:
        request(FRONTEND_ORIGIN + "/api/stockinfo/health")
    except RuntimeError as error:
        if "HTTP 401" not in str(error):
            raise RuntimeError(translate("Vite does not forward the StockInfo route to the account API")) from error
    else:
        raise RuntimeError(translate("The StockInfo route answers without a session"))


def wait_ready(
    stockinfo_port: int, demo_accounts: bool = False, check_cancelled: Callable[[], None] | None = None
) -> None:
    deadline = time.monotonic() + 30
    last_error: Exception | None = None
    while time.monotonic() < deadline:
        if check_cancelled is not None:
            check_cancelled()
        try:
            check_stack(stockinfo_port, demo_accounts)
            if check_cancelled is not None:
                check_cancelled()
            return
        except (RuntimeError, URLError, TimeoutError) as error:
            last_error = error
            time.sleep(0.25)
    raise RuntimeError(
        translate("The local test stack did not become ready: {error}").format(
            error=last_error,
        )
    )


def seed_accounts(data_dir: Path) -> Path:
    api_log = (data_dir / "api.log").read_text()
    code_match = re.search(r"StockPortfolio setup code: ([A-Za-z0-9_-]+)", api_log)
    if not code_match:
        raise RuntimeError(translate("No setup code in the isolated API log"))
    api_url = f"http://127.0.0.1:{API_PORT}"
    admin_password = f"Aa1!{secrets.token_urlsafe(18)}"
    user_password = f"Aa1!{secrets.token_urlsafe(18)}"
    setup = {"code": code_match.group(1), "username": "test-admin", "password": admin_password}
    status, _, _ = request(api_url + "/api/setup", FRONTEND_ORIGIN, setup)
    if status != 201:
        raise RuntimeError(translate("Creating the synthetic admin failed"))
    status, headers, _ = request(
        api_url + "/api/auth/login", FRONTEND_ORIGIN, {"username": "test-admin", "password": admin_password}
    )
    if status != 200:
        raise RuntimeError(translate("Signing in the synthetic admin failed"))
    cookie = headers.get("set-cookie", "").split(";", 1)[0]
    status, _, _ = request(
        api_url + "/api/admin/users",
        FRONTEND_ORIGIN,
        {"username": "test-user", "password": user_password, "role": "user"},
        cookie,
    )
    if status != 201:
        raise RuntimeError(translate("Creating the synthetic user failed"))
    credentials_path = data_dir / "demo-accounts.json"
    descriptor = os.open(credentials_path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(descriptor, "w") as credentials_file:
        json.dump(
            {
                "admin": {"username": "test-admin", "password": admin_password},
                "user": {"username": "test-user", "password": user_password},
            },
            credentials_file,
        )
    return credentials_path


def describe_stack(state: dict[str, object]) -> None:
    stockinfo_port = int(state["port"])
    print_message(translate("Frontend: {origin}").format(origin=FRONTEND_ORIGIN))
    print_message(translate("Account API: {url}").format(url=f"http://127.0.0.1:{API_PORT}"))
    print_message(translate("StockInfo fixtures: {url}").format(url=f"http://127.0.0.1:{stockinfo_port}"))
    print_message(translate("Browser origin / API origin: {origin}").format(origin=FRONTEND_ORIGIN))
    print_message(translate("StockInfo for the account API: {url}").format(url=f"http://127.0.0.1:{stockinfo_port}"))
    if state.get("demo_accounts"):
        print_message(
            translate("Synthetic account credentials: {path}").format(path=f"{state['data_dir']}/demo-accounts.json")
        )
    else:
        print_message(translate("One-time setup code: {path}").format(path=f"{state['data_dir']}/api.log"))
    print_message(translate("Temporary files: {path}").format(path=state["data_dir"]))
    for name, child in dict(state["children"]).items():
        alive = process_identity(int(child["pid"])) == child["identity"]
        state_text = translate("running") if alive else translate("stopped")
        print_message(
            translate("{name}: {state} (PID {pid})").format(name=name, state=state_text, pid=child["pid"]),
            "SUCCESS" if alive else "WARNING",
        )


def require_owned_processes(state: dict[str, object]) -> None:
    for name, child in dict(state["children"]).items():
        if process_identity(int(child["pid"])) != child["identity"]:
            raise RuntimeError(translate("The registered {name} process is not running").format(name=name))


def stack_state_path(project_root: Path) -> Path:
    state_suffix = hashlib.sha256(str(project_root).encode()).hexdigest()[:12]
    return Path(tempfile.gettempdir()) / f"stockportfolio-t63-stack-{state_suffix}.json"


def read_stack_state(state_path: Path, project_root: Path) -> dict[str, object] | None:
    """Registrierter Stack dieses Projekts; eine unlesbare Datei bleibt liegen."""
    try:
        state = json.loads(state_path.read_text()) if state_path.exists() else None
        if state is not None and not isinstance(state, dict):
            raise ValueError("Stack state file must contain an object")
    except (OSError, UnicodeError, ValueError) as error:
        raise RuntimeError(
            translate("The stack state file is unreadable: {path}. Check the processes before removing it.").format(
                path=state_path,
            )
        ) from error
    if state and state.get("project_root") != str(project_root):
        raise RuntimeError(translate("The state file belongs to another project: {path}").format(path=state_path))
    return state


def report_stack_status(state: dict[str, object] | None) -> int:
    if not state:
        print_message(translate("No local test stack is registered"), "WARNING")
        return 1
    describe_stack(state)
    try:
        require_owned_processes(state)
        check_stack(int(state["port"]), bool(state["demo_accounts"]))
    except (RuntimeError, URLError, TimeoutError, ValueError) as error:
        print_message(translate("Stack is not ready: {error}").format(error=error), "DANGER", sys.stderr)
        return 1
    print_message(translate("All local endpoints passed"), "SUCCESS")
    return 0


def stop_stack(state: dict[str, object] | None, state_path: Path) -> int:
    if not state:
        print_message(translate("No local test stack is registered"), "WARNING")
        return 0
    stop_children(dict(state["children"]))
    remove_data(Path(state["data_dir"]))
    state_path.unlink()
    print_message(translate("Own local test stack stopped; temporary account data removed"), "SUCCESS")
    return 0


class Cancellation:
    """Merkt sich SIGTERM während des Starts; beendet wird an der nächsten Prüfstelle."""

    def __init__(self) -> None:
        self.requested = False

    def request(self, _signal_number: int, _frame: FrameType | None) -> None:
        self.requested = True

    def check(self) -> None:
        if self.requested:
            raise SystemExit(143)


def bring_up_stack(
    plan: StackPlan,
    args: Namespace,
    children: dict[str, dict[str, object]],
    owned_state: OwnedStateFile,
    check_cancelled: Callable[[], None],
) -> None:
    """Startet die Kindprozesse, vermerkt sie und wartet, bis alle Endpunkte stimmen."""
    start_children(plan, children, check_cancelled)
    check_cancelled()
    state = {
        "project_root": str(plan.project_root),
        "port": plan.stockinfo_port,
        "data_dir": str(plan.data_dir),
        "demo_accounts": args.demo_accounts,
        "children": children,
    }
    owned_state.publish(state)
    check_cancelled()
    wait_ready(plan.stockinfo_port, check_cancelled=check_cancelled)
    if args.demo_accounts:
        seed_accounts(plan.data_dir)
        check_cancelled()
        wait_ready(plan.stockinfo_port, demo_accounts=True, check_cancelled=check_cancelled)
    require_owned_processes(state)
    check_cancelled()
    describe_stack(state)
    print_message(translate("All local endpoints passed"), "SUCCESS")
    check_cancelled()


def start_stack(args: Namespace, script_path: Path, stockinfo_root: Path, state_path: Path) -> int:
    """Startet den Stack; bei Abbruch oder Fehler räumt er eigene Prozesse und Daten weg."""
    project_root = script_path.parent.parent
    stockinfo_python = preflight(project_root, stockinfo_root, args.port)
    data_dir: Path | None = None
    children: dict[str, dict[str, object]] = {}
    owned_state = OwnedStateFile(state_path)
    cancellation = Cancellation()
    previous_sigterm = signal.getsignal(signal.SIGTERM)
    try:
        signal.signal(signal.SIGTERM, cancellation.request)
        data_dir = Path(tempfile.mkdtemp(prefix="stockportfolio-t63-"))
        cancellation.check()
        plan = StackPlan(
            project_root,
            script_path,
            stockinfo_root,
            stockinfo_python,
            data_dir,
            args.port,
            args.demo_details,
            args.detail_fixtures,
        )
        bring_up_stack(plan, args, children, owned_state, cancellation.check)
        return 0
    except (Exception, KeyboardInterrupt, SystemExit) as error:
        stop_children(children)
        try:
            owned_state.remove()
        finally:
            if data_dir is not None:
                remove_data(data_dir)
        if isinstance(error, SystemExit) and cancellation.requested:
            print_message(
                translate("Local test stack start cancelled; own processes and data removed"), "WARNING", sys.stderr
            )
        raise
    finally:
        signal.signal(signal.SIGTERM, previous_sigterm)


def run_stack_cli(args: Namespace, script_path: Path) -> int:
    project_root = script_path.parent.parent
    stockinfo_root = (args.stockinfo_root or project_root.parent / "StockInfo").resolve()
    state_path = stack_state_path(project_root)
    state = read_stack_state(state_path, project_root)
    if args.status:
        return report_stack_status(state)
    if args.stop:
        return stop_stack(state, state_path)
    if state:
        raise RuntimeError(
            translate("A local test stack is already registered; use --stack --stop before starting again")
        )
    if args.origin and args.origin != FRONTEND_ORIGIN:
        raise RuntimeError(
            translate("The full stack requires --origin {origin}").format(
                origin=FRONTEND_ORIGIN,
            )
        )
    return start_stack(args, script_path, stockinfo_root, state_path)
