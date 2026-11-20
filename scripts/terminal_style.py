"""Optionale CLITheme-Gestaltung für die lokale Testserver-CLI.

Farben, Abstände und die argparse-Hilfe kommen aus dem Paket cli_theme (mmit-clitheme,
make setup); das Skript liest keine Theme-Datei selbst. Fehlt das Paket, laufen die
Skripte ohne Farben weiter.
"""

from __future__ import annotations

import argparse
import sys
from typing import TextIO

try:
    from cli_theme import HelpFormatter, Output
    from rich.text import Text
except ModuleNotFoundError as error:
    if error.name not in {"cli_theme", "rich", "rich.text"}:
        raise
    HelpFormatter = argparse.RawDescriptionHelpFormatter
    Output = None

# Rollen der Meldungen in den Skripten, abgebildet auf die Rollen von CLITheme.
ROLES = {"VALUE": "val", "SUCCESS": "ok", "WARNING": "warn", "DANGER": "err"}


def has_theme() -> bool:
    """Meldet, ob das Paket cli_theme verfügbar ist."""
    return Output is not None


def print_message(message: str, role: str = "VALUE", stream: TextIO | None = None) -> None:
    """Zeigt eine übersetzte Meldung mit Theme, bei fehlendem Paket schlicht an."""
    target = stream or sys.stdout
    if Output is None:
        print(message, file=target)
        return
    output = Output(stream=target, error_stream=target)
    indent = output.indent("i_head") if target.isatty() else ""
    output.write(Text(indent) + Text(message, style=output.styles[ROLES[role]]), hang=len(indent))
