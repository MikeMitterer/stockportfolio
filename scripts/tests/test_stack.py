"""Teststack: belegte Ports, eigene und fremde Prozesse, Testdaten, Zustandsdatei."""

from __future__ import annotations

import os
import socket
import subprocess
import sys
import tempfile
from pathlib import Path

import pytest

from teststack import stack
from teststack.stack import (
    process_identity,
    remove_data,
    request,
    require_free_port,
    stack_state_path,
    stop_children,
)

SCRIPTS = Path(__file__).resolve().parent.parent
SERVER_SCRIPT = SCRIPTS / "test-stack.py"


def is_running(process: subprocess.Popen[bytes]) -> bool:
    return process.poll() is None


def test_occupied_port_aborts_and_leaves_occupant_alone() -> None:
    """Ein belegter Port bricht ab und lässt den belegenden Prozess in Ruhe."""
    with socket.socket() as occupant:
        occupant.bind(("127.0.0.1", 0))
        occupant.listen()
        port = occupant.getsockname()[1]

        with pytest.raises(RuntimeError, match=str(port)):
            require_free_port(port)

        # Der Belegende nimmt weiter Verbindungen an.
        with socket.create_connection(("127.0.0.1", port), timeout=2):
            pass


def test_free_port_is_accepted() -> None:
    """Ein freier Port wird akzeptiert."""
    with socket.socket() as probe:
        probe.bind(("127.0.0.1", 0))
        port = probe.getsockname()[1]

    require_free_port(port)


def test_outdated_stockinfo_python_is_rejected_before_start(tmp_path: Path) -> None:
    """Eine StockInfo-.venv unter der Mindestversion bricht mit dem nächsten Schritt ab."""
    outdated = tmp_path / "python"
    outdated.write_text("#!/bin/sh\nexit 1\n")
    outdated.chmod(0o755)

    with pytest.raises(RuntimeError, match="make setup"):
        stack.require_minimum_python(outdated)

    stack.require_minimum_python(Path(sys.executable))


def test_stops_own_child_process(own_process: subprocess.Popen[bytes]) -> None:
    """Beendet den eigenen Kindprozess."""
    identity = process_identity(own_process.pid)
    assert identity

    stop_children({"api": {"pid": own_process.pid, "identity": identity, "log": "api.log"}})

    own_process.wait(timeout=5)
    assert not is_running(own_process)


def test_never_stops_process_with_foreign_identity(own_process: subprocess.Popen[bytes]) -> None:
    """Beendet keinen Prozess mit fremder Identität."""
    with pytest.raises(RuntimeError, match="api"):
        stop_children({"api": {"pid": own_process.pid, "identity": "anderes Kommando", "log": "api.log"}})

    assert is_running(own_process)


def test_never_stops_process_outside_its_group() -> None:
    """Beendet keinen Prozess außerhalb seiner Prozessgruppe."""
    # Ohne eigene Sitzung gehört das Kind zur Gruppe des Tests; killpg träfe sie mit.
    foreign = subprocess.Popen(["sleep", "30"])
    try:
        identity = process_identity(foreign.pid)
        with pytest.raises(RuntimeError, match="api"):
            stop_children({"api": {"pid": foreign.pid, "identity": identity, "log": "api.log"}})
        assert is_running(foreign)
    finally:
        foreign.kill()
        foreign.wait(timeout=5)


def test_removes_only_own_test_directory(tmp_path: Path) -> None:
    """Entfernt nur das eigene Testverzeichnis."""
    unexpected = tmp_path / "stockportfolio-t63-falscher-ort"
    unexpected.mkdir()
    with pytest.raises(RuntimeError):
        remove_data(unexpected)
    assert unexpected.exists()

    foreign_dir = Path(tempfile.mkdtemp(prefix="anderes-projekt-"))
    try:
        with pytest.raises(RuntimeError):
            remove_data(foreign_dir)
        assert foreign_dir.exists()
    finally:
        foreign_dir.rmdir()

    own = Path(tempfile.mkdtemp(prefix="stockportfolio-t63-"))
    (own / "demo-accounts.json").write_text("{}")
    remove_data(own)
    assert not own.exists()


def run_status(temp_dir: Path) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        [sys.executable, str(SERVER_SCRIPT), "--stack", "--status"],
        capture_output=True,
        text=True,
        check=False,
        timeout=30,
        env={**os.environ, "TMPDIR": str(temp_dir), "NO_COLOR": "1"},
    )


def test_status_without_registered_stack_exits_one(tmp_path: Path) -> None:
    """Status ohne registrierten Stack endet mit 1 und legt nichts an."""
    result = run_status(tmp_path)

    assert result.returncode == 1
    assert list(tmp_path.iterdir()) == []


def test_unreadable_state_file_is_reported_and_kept(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    """Eine unlesbare Zustandsdatei wird gemeldet und nicht entfernt."""
    # Derselbe Temp-Ordner wie für den Statusaufruf unten (TMPDIR).
    monkeypatch.setattr(tempfile, "tempdir", str(tmp_path))
    state_path = stack_state_path(SERVER_SCRIPT.parent.parent)
    state_path.write_text("{kein json")

    result = run_status(tmp_path)

    assert result.returncode == 2
    assert str(state_path) in result.stderr
    assert state_path.read_text() == "{kein json"


@pytest.mark.parametrize("url", ["file:///etc/passwd", "ftp://127.0.0.1/", "127.0.0.1:8080/healthz"])
def test_request_refuses_non_http_urls_without_opening_them(url: str, monkeypatch: pytest.MonkeyPatch) -> None:
    """request() lehnt alles außer http(s) ab, bevor eine Verbindung entsteht (bandit B310)."""
    opened: list[object] = []
    monkeypatch.setattr(stack, "urlopen", lambda *args, **kwargs: opened.append(args))

    with pytest.raises(ValueError, match="Only http"):
        request(url)

    assert opened == []


def test_script_runs_directly_with_the_project_venv(tmp_path: Path) -> None:
    """Direkt aus einem fremden Ordner aufrufbar, ohne ein Python aus PATH (T-148)."""
    # /usr/bin/python3 ist unter macOS 3.9 und könnte das Skript nicht einmal parsen.
    result = subprocess.run(
        [str(SERVER_SCRIPT), "--help"],
        capture_output=True,
        text=True,
        check=False,
        timeout=30,
        cwd=tmp_path,
        env={"PATH": "/usr/bin:/bin", "NO_COLOR": "1", "TMPDIR": str(tmp_path)},
    )

    assert result.returncode == 0, result.stderr
    assert "--stack" in result.stdout
