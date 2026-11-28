"""make setup: eine tote .venv gilt als veraltet und wird neu gebaut (T-153).

Die Tests laufen gegen eine Kopie des Makefiles in einem leeren Ordner. Statt des echten
devtools steht ein Ersatz im PATH, der seine Aufrufe nur mitschreibt: Es geht um die
Entscheidung von make und den Neubau der .venv, nicht um die Paketinstallation über das Netz.
"""

import os
import re
import shutil
import subprocess
import sys
from pathlib import Path

import pytest

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
COPIED = ("Makefile", "pyproject.toml", "requirements-dev.txt", ".dev-tools.conf.sh")
STAMP = ".venv/.installed"
# Ein Zeitpunkt vor jedem Python auf dem Rechner: Die Quelldateien sind älter als Stempel und
# Interpreter, der Stempel gilt also nur dann als veraltet, wenn der Interpreter fehlt.
LONG_AGO = 946_684_800  # 2000-01-01


@pytest.fixture
def checkout(tmp_path: Path) -> Path:
    """Makefile samt Einrichtungsdateien und ein devtools-Ersatz, der Aufrufe mitschreibt."""
    for name in COPIED:
        shutil.copy2(PROJECT_ROOT / name, tmp_path / name)
        os.utime(tmp_path / name, (LONG_AGO, LONG_AGO))
    fake_bin = tmp_path / "fake-bin"
    fake_bin.mkdir()
    devtools = fake_bin / "devtools"
    devtools.write_text('#!/usr/bin/env bash\necho "$*" >> "${DEVTOOLS_LOG}"\n')
    devtools.chmod(0o755)
    return tmp_path


def make(checkout: Path, *args: str) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        ["make", "--no-print-directory", *args],
        capture_output=True,
        text=True,
        check=False,
        timeout=120,
        cwd=checkout,
        env={
            **os.environ,
            "PATH": f"{checkout / 'fake-bin'}:{os.environ['PATH']}",
            "DEVTOOLS_LOG": str(checkout / "devtools.log"),
            # Unabhängig von der PATH-Reihenfolge des Rechners (python3 von macOS ist 3.9).
            "PYTHON_BOOTSTRAP": sys.executable,
        },
    )


def stale_venv(checkout: Path, interpreter: str) -> None:
    """Eingerichtete .venv mit aktuellem Stempel, deren Interpreter tot oder weg ist."""
    venv_bin = checkout / ".venv/bin"
    venv_bin.mkdir(parents=True)
    if interpreter == "dead link":
        (venv_bin / "python").symlink_to("/nonexistent/python3.99")
    (checkout / STAMP).touch()


@pytest.mark.parametrize("interpreter", ["dead link", "missing"])
def test_dead_venv_is_stale_and_setup_rebuilds_it(checkout: Path, interpreter: str) -> None:
    """Toter oder fehlender .venv/bin/python bei aktuellem Stempel: veraltet, ein Lauf baut neu."""
    stale_venv(checkout, interpreter)

    # So fragt require-setup: Ein Exit ungleich 0 löst make setup aus.
    assert make(checkout, "--question", STAMP).returncode != 0

    result = make(checkout, STAMP)

    assert result.returncode == 0, result.stdout + result.stderr
    rebuilt = subprocess.run(
        [str(checkout / ".venv/bin/python"), "-c", "import sys; print(sys.prefix)"],
        capture_output=True,
        text=True,
        check=True,
    )
    assert Path(rebuilt.stdout.strip()) == (checkout / ".venv").resolve()
    assert "exec -- .venv/bin/python -m pip install" in (checkout / "devtools.log").read_text()
    assert make(checkout, "--question", STAMP).returncode == 0


def test_too_old_python_stops_setup_before_creating_a_venv(checkout: Path) -> None:
    """Erfüllt der Interpreter requires-python nicht, nennt setup Mindestversion und Fund."""
    pyproject = checkout / "pyproject.toml"
    pyproject.write_text(re.sub(r"(?m)^requires-python = .*$", 'requires-python = ">=99.0"', pyproject.read_text()))

    result = make(checkout, STAMP)

    assert result.returncode != 0
    found = f"{sys.version_info.major}.{sys.version_info.minor}"
    assert f"Python 99.0 oder neuer nötig, {sys.executable} ist {found}" in result.stderr
    assert not (checkout / ".venv").exists()
