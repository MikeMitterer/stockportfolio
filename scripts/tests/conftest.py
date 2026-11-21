"""Gemeinsame Einstellungen für die Tests der Teststack-Skripte (T-101)."""

from __future__ import annotations

import subprocess
import sys
from collections.abc import Iterator
from pathlib import Path

import pytest

SCRIPTS = Path(__file__).resolve().parent.parent
# Die Skripte importieren sich gegenseitig über ihren Ordner, nicht als Paket.
sys.path.insert(0, str(SCRIPTS))


@pytest.fixture
def own_process() -> Iterator[subprocess.Popen[bytes]]:
    """Harmloser Kindprozess in eigener Prozessgruppe, wie ihn der Stack startet.

    Wird am Ende in jedem Fall beendet und eingesammelt — auch wenn ein Test
    absichtlich zeigt, dass der Stack ihn nicht anfasst.
    """
    process = subprocess.Popen(["sleep", "30"], start_new_session=True)
    try:
        yield process
    finally:
        if process.poll() is None:
            process.kill()
        process.wait(timeout=5)
