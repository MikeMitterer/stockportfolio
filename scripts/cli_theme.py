"""Optionale ProjectTools-Gestaltung für die lokale Testserver-CLI."""

from __future__ import annotations

import argparse
import sys
from typing import TextIO

try:
    from projecttools.ui.colors import HelpFormatter, Theme
except ModuleNotFoundError as error:
    if error.name not in {"projecttools", "projecttools.ui", "projecttools.ui.colors"}:
        raise
    HelpFormatter = argparse.RawDescriptionHelpFormatter
    Theme = None


def has_theme() -> bool:
    """Meldet, ob das installierte ProjectTools-Paket verfügbar ist."""
    return Theme is not None


def print_message(message: str, role: str = "VALUE", stream: TextIO | None = None) -> None:
    """Zeigt eine übersetzte Meldung mit Theme, bei fehlendem Paket schlicht an."""
    output = stream or sys.stdout
    if Theme is None:
        print(message, file=output)
        return
    theme = Theme()
    indent = theme.indent_group if output.isatty() else ""
    print(indent + theme.style(message, role, output), file=output)
