"""Zustandsdateien des lokalen Teststacks atomar veröffentlichen und entfernen."""

from __future__ import annotations

import json
import os
import tempfile
from pathlib import Path
from typing import Any


class OwnedStateFile:
    """Entfernt nur den Zustand, den diese Instanz selbst veröffentlicht hat."""

    def __init__(self, path: Path) -> None:
        self.path = path
        self._inode: tuple[int, int] | None = None
        self._content: str | None = None

    def publish(self, state: dict[str, Any]) -> None:
        """Bindet vollständiges JSON exklusiv an den endgültigen Namen."""
        content = json.dumps(state)
        with tempfile.NamedTemporaryFile(mode="w", dir=self.path.parent, prefix=f"{self.path.name}.") as state_file:
            state_file.write(content)
            state_file.flush()
            file_stat = os.fstat(state_file.fileno())
            self._inode = (file_stat.st_dev, file_stat.st_ino)
            self._content = content
            os.link(state_file.name, self.path)

    def remove(self) -> None:
        """Löscht die eigene Datei, ohne ihren Inhalt als JSON lesen zu müssen.

        Eigen ist sie nur, wenn Inode und Inhalt noch dieselben sind: Linux
        vergibt die Inode einer gelöschten Datei sofort neu, eine fremde Datei
        gleichen Namens kann also dieselbe Inode tragen (T-137).
        """
        if self._inode is None:
            return
        try:
            current_stat = self.path.stat()
        except FileNotFoundError:
            return
        if (current_stat.st_dev, current_stat.st_ino) != self._inode:
            return
        try:
            unchanged = self.path.read_text() == self._content
        except (OSError, UnicodeError):
            return
        if unchanged:
            self.path.unlink()
