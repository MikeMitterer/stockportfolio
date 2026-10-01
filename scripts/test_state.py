"""Zustandsdateien des lokalen Teststacks atomar veröffentlichen und entfernen."""

from __future__ import annotations

import json
import os
from pathlib import Path
import tempfile
from typing import Any


class OwnedStateFile:
    """Entfernt nur den Zustand, den diese Instanz selbst veröffentlicht hat."""

    def __init__(self, path: Path) -> None:
        self.path = path
        self._inode: tuple[int, int] | None = None

    def publish(self, state: dict[str, Any]) -> None:
        """Bindet vollständiges JSON exklusiv an den endgültigen Namen."""
        with tempfile.NamedTemporaryFile(mode="w", dir=self.path.parent, prefix=f"{self.path.name}.") as state_file:
            json.dump(state, state_file)
            state_file.flush()
            file_stat = os.fstat(state_file.fileno())
            self._inode = (file_stat.st_dev, file_stat.st_ino)
            os.link(state_file.name, self.path)

    def remove(self) -> None:
        """Löscht die eigene Datei auch ohne lesbaren JSON-Inhalt."""
        if self._inode is None:
            return
        try:
            current_stat = self.path.stat()
        except FileNotFoundError:
            return
        if (current_stat.st_dev, current_stat.st_ino) == self._inode:
            self.path.unlink()
