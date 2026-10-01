#!/usr/bin/env python3
"""Liest Board, Dateistände und Git-HEAD für den lokalen Observer.

Ausgabe: ein JSON-Snapshot; keine Dateiänderungen und kein eigener Timer.
Der Projektpfad folgt aus der Ablage unter .agents/bin/.
"""

import hashlib
import json
import os
import re
import subprocess
from pathlib import Path


def collect_snapshot(root: Path) -> dict[str, object]:
    """Erfasst den aktuellen Stand; der Scheduler vergleicht die Snapshots."""
    status = (root / "_tickets/STATUS.md").read_text(encoding="utf-8")
    fields = dict(re.findall(r"^- `([^`]+)`: `([^`]+)`", status, re.MULTILINE))
    paths: list[Path] = []
    ignored_folders = {"node_modules", "dist", "coverage", ".vite", "logs", "preview", "__pycache__"}
    for folder in ("_tickets", ".agents", "frontend", "api", "docker", "docs", "unraid", "scripts"):
        directory = root / folder
        if directory.exists():
            for current, folders, files in os.walk(directory):
                folders[:] = [name for name in folders if name not in ignored_folders]
                paths.extend(
                    path for name in files
                    if (path := Path(current) / name).is_file() and not path.is_symlink()
                )
    for name in ("AGENTS.md", "README.md", "Makefile", "package.json", "package-lock.json", "eslint.config.js", ".env.example", ".dockerignore"):
        path = root / name
        if path.is_file():
            paths.append(path)

    hashes: dict[str, str] = {}
    for path in sorted(paths):
        name = str(path.relative_to(root))
        try:
            hashes[name] = hashlib.sha256(path.read_bytes()).hexdigest()
        except OSError:
            hashes[name] = "unreadable"

    head = subprocess.check_output(
        ["git", "rev-parse", "HEAD"], cwd=root, text=True,
    ).strip()
    return {"fields": fields, "hashes": hashes, "head": head}


if __name__ == "__main__":
    print(json.dumps(collect_snapshot(Path(__file__).resolve().parents[2])))
