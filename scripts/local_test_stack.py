"""Temporäre Konto-API und Vite für den StockInfo-Testserver verwalten."""

from __future__ import annotations

import json
import gettext
import hashlib
import os
from pathlib import Path
import re
import secrets
import shutil
import signal
import socket
import subprocess
import sys
import tempfile
import time
from argparse import Namespace
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from cli_theme import print_message

API_PORT = 8080
FRONTEND_PORT = 5175
FRONTEND_ORIGIN = f"http://127.0.0.1:{FRONTEND_PORT}"
QUOTE_PATH = "/quote/IE00B4L5Y983"
translate = gettext.translation(
    "stockportfolio-test-stack", localedir=Path(__file__).parent / "locale", fallback=True,
).gettext


def process_identity(pid: int) -> str:
    try:
        result = subprocess.run(
            ["ps", "-p", str(pid), "-o", "stat=", "-o", "lstart=", "-o", "command="],
            capture_output=True, text=True, check=False,
        )
    except OSError as error:
        raise RuntimeError(translate("Process inspection requires ps access: {error}").format(error=error)) from error
    if result.stderr.strip():
        raise RuntimeError(translate("Process inspection requires ps access: {error}").format(
            error=result.stderr.strip(),
        ))
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
            raise RuntimeError(translate("Port {port} is already in use; no process was stopped").format(
                port=port,
            )) from error


def preflight(project_root: Path, stockinfo_root: Path, stockinfo_port: int) -> Path:
    if not process_identity(os.getpid()):
        raise RuntimeError(translate("ps cannot identify this process"))
    for port in (stockinfo_port, API_PORT, FRONTEND_PORT):
        require_free_port(port)
    stockinfo_python = stockinfo_root / ".venv/bin/python"
    if not stockinfo_python.is_file():
        raise RuntimeError(translate("Missing StockInfo Python environment: {path}").format(
            path=stockinfo_python,
        ))
    for executable in (
        project_root / "api/node_modules/.bin/tsx",
        project_root / "frontend/node_modules/.bin/vite",
    ):
        if not executable.is_file():
            raise RuntimeError(translate("Missing {path}; install the declared npm packages first").format(
                path=executable,
            ))
    if not shutil.which("node"):
        raise RuntimeError(translate("Missing Node.js in PATH"))
    return stockinfo_python


def start_children(project_root: Path, script_path: Path, stockinfo_root: Path,
                   stockinfo_python: Path, data_dir: Path, stockinfo_port: int,
                   demo_details: bool = False, detail_fixtures: Path | None = None) -> dict[str, dict[str, object]]:
    stockinfo_url = f"http://127.0.0.1:{stockinfo_port}"
    stockinfo_command = [str(stockinfo_python), "-B", str(script_path), "--run", "--stockinfo-root", str(stockinfo_root),
                         "--port", str(stockinfo_port), "--origin", FRONTEND_ORIGIN]
    if demo_details:
        stockinfo_command.append("--demo-details")
    if detail_fixtures:
        stockinfo_command.extend(("--detail-fixtures", str(detail_fixtures.resolve())))
    commands = {
        "stockinfo": stockinfo_command,
        "api": [shutil.which("node") or "node", "--import", "tsx", "src/index.ts"],
        "frontend": [str(project_root / "frontend/node_modules/.bin/vite"), "--config", str(project_root / "frontend/vite.config.ts"),
                     "--host", "127.0.0.1", "--port", str(FRONTEND_PORT), "--strictPort"],
    }
    environments = {
        "stockinfo": {},
        "api": {"PORT": str(API_PORT), "STOCKPORTFOLIO_DATA_DIR": str(data_dir / "accounts"),
                "STOCKPORTFOLIO_PUBLIC_ORIGIN": FRONTEND_ORIGIN, "STOCKPORTFOLIO_SECURE_COOKIES": "false"},
        "frontend": {"VITE_STOCKINFO_API_URL": stockinfo_url},
    }
    children: dict[str, dict[str, object]] = {}
    try:
        for name, command in commands.items():
            log_path = data_dir / f"{name}.log"
            with log_path.open("ab") as log_file:
                process = subprocess.Popen(
                    command, cwd=project_root / name if name in {"api", "frontend"} else project_root,
                    env={**os.environ, **environments[name]},
                    stdin=subprocess.DEVNULL, stdout=log_file, stderr=subprocess.STDOUT,
                    start_new_session=True,
                )
            try:
                time.sleep(0.1)
                identity = process_identity(process.pid)
                if not identity:
                    raise RuntimeError(translate("{name} exited during startup; see {path}").format(
                        name=name, path=log_path,
                    ))
            except (Exception, KeyboardInterrupt):
                if process.poll() is None:
                    os.killpg(process.pid, signal.SIGTERM)
                    process.wait(timeout=10)
                raise
            children[name] = {"pid": process.pid, "identity": identity, "log": str(log_path)}
    except (Exception, KeyboardInterrupt):
        stop_children(children)
        raise
    return children


def stop_children(children: dict[str, dict[str, object]]) -> None:
    for name in reversed(tuple(children)):
        child = children[name]
        pid = int(child["pid"])
        current_identity = process_identity(pid)
        if not current_identity:
            continue
        if current_identity != child["identity"]:
            raise RuntimeError(translate("Refusing to stop {name}: its process identity changed").format(
                name=name,
            ))
        if os.getpgid(pid) != pid:
            raise RuntimeError(translate("Refusing to stop {name}: its process group changed").format(
                name=name,
            ))
        os.killpg(pid, signal.SIGTERM)
        deadline = time.monotonic() + 10
        while process_identity(pid) == child["identity"] and time.monotonic() < deadline:
            time.sleep(0.1)
        if process_identity(pid) == child["identity"]:
            raise RuntimeError(translate("{name} did not stop; see {path}").format(name=name, path=child["log"]))


def remove_data(data_dir: Path) -> None:
    temporary_root = Path(tempfile.gettempdir()).resolve()
    resolved = data_dir.resolve()
    if resolved.parent != temporary_root or not resolved.name.startswith("stockportfolio-t63-"):
        raise RuntimeError(translate("Refusing to remove unexpected test directory: {path}").format(
            path=data_dir,
        ))
    shutil.rmtree(resolved)


def request(url: str, origin: str | None = None, body: dict[str, str] | None = None,
            cookie: str | None = None) -> tuple[int, dict[str, str], bytes]:
    headers = {"Origin": origin} if origin else {}
    if body is not None:
        headers["Content-Type"] = "application/json"
    if cookie:
        headers["Cookie"] = cookie
    http_request = Request(url, data=json.dumps(body).encode() if body is not None else None, headers=headers)
    try:
        with urlopen(http_request, timeout=2) as response:
            return response.status, {key.lower(): value for key, value in response.headers.items()}, response.read()
    except HTTPError as error:
        raise RuntimeError(translate("{url} returned HTTP {status}").format(
            url=url, status=error.code,
        )) from error


def check_stack(stockinfo_port: int, demo_accounts: bool = False) -> None:
    stockinfo_url = f"http://127.0.0.1:{stockinfo_port}"
    for path in ("/health", QUOTE_PATH):
        status, headers, payload = request(stockinfo_url + path, FRONTEND_ORIGIN)
        if status != 200 or headers.get("access-control-allow-origin") != FRONTEND_ORIGIN:
            raise RuntimeError(translate("StockInfo {path} has the wrong response or CORS origin").format(
                path=path,
            ))
        if path == QUOTE_PATH and json.loads(payload).get("price") != 128.7:
            raise RuntimeError(translate("The known StockInfo test quote is missing"))
    status, _, _ = request(f"http://127.0.0.1:{API_PORT}/healthz")
    if status != 200:
        raise RuntimeError(translate("The account API health check failed"))
    status, _, payload = request(f"http://127.0.0.1:{API_PORT}/api/setup/status")
    if status != 200 or json.loads(payload).get("required") != (not demo_accounts):
        raise RuntimeError(translate("The account API has unexpected setup state"))
    status, _, module = request(FRONTEND_ORIGIN + "/src/api/client.ts")
    if status != 200 or stockinfo_url.encode() not in module:
        raise RuntimeError(translate("Vite is not serving the selected StockInfo endpoint"))
    status, _, runtime_config = request(FRONTEND_ORIGIN + "/config.js")
    if status != 200 or b"apiUrl: ''" not in runtime_config:
        raise RuntimeError(translate("Vite runtime configuration overrides the selected StockInfo endpoint"))


def wait_ready(stockinfo_port: int, demo_accounts: bool = False) -> None:
    deadline = time.monotonic() + 30
    last_error: Exception | None = None
    while time.monotonic() < deadline:
        try:
            check_stack(stockinfo_port, demo_accounts)
            return
        except (RuntimeError, URLError, TimeoutError) as error:
            last_error = error
            time.sleep(0.25)
    raise RuntimeError(translate("The local test stack did not become ready: {error}").format(
        error=last_error,
    ))


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
    status, headers, _ = request(api_url + "/api/auth/login", FRONTEND_ORIGIN,
                                 {"username": "test-admin", "password": admin_password})
    if status != 200:
        raise RuntimeError(translate("Signing in the synthetic admin failed"))
    cookie = headers.get("set-cookie", "").split(";", 1)[0]
    status, _, _ = request(api_url + "/api/admin/users", FRONTEND_ORIGIN,
                           {"username": "test-user", "password": user_password, "role": "user"}, cookie)
    if status != 201:
        raise RuntimeError(translate("Creating the synthetic user failed"))
    credentials_path = data_dir / "demo-accounts.json"
    descriptor = os.open(credentials_path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(descriptor, "w") as credentials_file:
        json.dump({"admin": {"username": "test-admin", "password": admin_password},
                   "user": {"username": "test-user", "password": user_password}}, credentials_file)
    return credentials_path


def describe_stack(state: dict[str, object]) -> None:
    stockinfo_port = int(state["port"])
    print_message(translate("Frontend: {origin}").format(origin=FRONTEND_ORIGIN))
    print_message(translate("Account API: {url}").format(url=f"http://127.0.0.1:{API_PORT}"))
    print_message(translate("StockInfo fixtures: {url}").format(url=f"http://127.0.0.1:{stockinfo_port}"))
    print_message(translate("Browser origin / API origin: {origin}").format(origin=FRONTEND_ORIGIN))
    print_message(translate("Effective StockInfo endpoint: {url}").format(url=f"http://127.0.0.1:{stockinfo_port}"))
    if state.get("demo_accounts"):
        print_message(translate("Synthetic account credentials: {path}").format(path=f"{state['data_dir']}/demo-accounts.json"))
    else:
        print_message(translate("One-time setup code: {path}").format(path=f"{state['data_dir']}/api.log"))
    print_message(translate("Temporary files: {path}").format(path=state["data_dir"]))
    for name, child in dict(state["children"]).items():
        alive = process_identity(int(child["pid"])) == child["identity"]
        state_text = translate("running") if alive else translate("stopped")
        print_message(translate("{name}: {state} (PID {pid})").format(name=name, state=state_text, pid=child["pid"]),
                      "SUCCESS" if alive else "WARNING")


def require_owned_processes(state: dict[str, object]) -> None:
    for name, child in dict(state["children"]).items():
        if process_identity(int(child["pid"])) != child["identity"]:
            raise RuntimeError(translate("The registered {name} process is not running").format(name=name))


def run_stack_cli(args: Namespace, script_path: Path) -> int:
    project_root = script_path.parent.parent
    stockinfo_root = (args.stockinfo_root or project_root.parent / "StockInfo").resolve()
    state_suffix = hashlib.sha256(str(project_root).encode()).hexdigest()[:12]
    state_path = Path(tempfile.gettempdir()) / f"stockportfolio-t63-stack-{state_suffix}.json"
    state = json.loads(state_path.read_text()) if state_path.exists() else None
    if state and state.get("project_root") != str(project_root):
        raise RuntimeError(translate("The state file belongs to another project: {path}").format(path=state_path))

    if args.status:
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
        print_message(translate("All local endpoints and CORS checks passed"), "SUCCESS")
        return 0

    if args.stop:
        if not state:
            print_message(translate("No local test stack is registered"), "WARNING")
            return 0
        stop_children(dict(state["children"]))
        remove_data(Path(state["data_dir"]))
        state_path.unlink()
        print_message(translate("Own local test stack stopped; temporary account data removed"), "SUCCESS")
        return 0

    if state:
        raise RuntimeError(translate("A local test stack is already registered; use --stack --stop before starting again"))
    if args.origin and args.origin != FRONTEND_ORIGIN:
        raise RuntimeError(translate("The full stack requires --origin {origin}").format(
            origin=FRONTEND_ORIGIN,
        ))
    stockinfo_python = preflight(project_root, stockinfo_root, args.port)
    data_dir = Path(tempfile.mkdtemp(prefix="stockportfolio-t63-"))
    children: dict[str, dict[str, object]] = {}
    try:
        children = start_children(project_root, script_path, stockinfo_root, stockinfo_python, data_dir, args.port,
                                  args.demo_details, args.detail_fixtures)
        state = {"project_root": str(project_root), "port": args.port, "data_dir": str(data_dir),
                 "demo_accounts": args.demo_accounts, "children": children}
        descriptor = os.open(state_path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
        with os.fdopen(descriptor, "w") as state_file:
            json.dump(state, state_file)
        wait_ready(args.port)
        if args.demo_accounts:
            seed_accounts(data_dir)
            wait_ready(args.port, demo_accounts=True)
        require_owned_processes(state)
        describe_stack(state)
        print_message(translate("All local endpoints and CORS checks passed"), "SUCCESS")
        return 0
    except (Exception, KeyboardInterrupt):
        stop_children(children)
        if state_path.exists():
            state_path.unlink()
        remove_data(data_dir)
        raise
