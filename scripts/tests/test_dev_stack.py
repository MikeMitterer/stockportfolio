"""Dev-Stack: Wahl des StockInfo über DEV_STOCKINFO und STOCKINFO_API_URL (T-148)."""

import os
import subprocess
from pathlib import Path

import pytest

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
DEV_STACK = PROJECT_ROOT / "scripts/dev-stack.sh"


def run_address(source: str, url: str) -> subprocess.CompletedProcess[str]:
    """--address wie make dev-up: Werte kommen über die Umgebung, so wie make sie aus .env übernimmt."""
    return subprocess.run(
        [str(DEV_STACK), "--address", "dashboard"],
        capture_output=True,
        text=True,
        check=False,
        timeout=30,
        cwd=PROJECT_ROOT,
        env={
            **os.environ,
            "PATH": f"{PROJECT_ROOT / '.tools/bin'}:{os.environ['PATH']}",
            "NO_COLOR": "1",
            "DEV_STOCKINFO": source,
            "STOCKINFO_API_URL": url,
        },
    )


@pytest.mark.parametrize(
    ("source", "url"),
    [
        ("remote", "https://stockinfo.example.invalid/"),
        ('"remote"', '"https://stockinfo.example.invalid/"'),
        ("'remote'", "'https://stockinfo.example.invalid'"),
    ],
)
def test_remote_address_accepts_quoted_values(source: str, url: str) -> None:
    """make übernimmt Anführungszeichen aus .env unverändert; dotenv akzeptiert sie auch."""
    result = run_address(source, url)

    assert result.returncode == 0, result.stderr
    assert result.stdout == "https://stockinfo.example.invalid\n"


def test_unknown_source_names_the_allowed_values() -> None:
    """Ein Tippfehler startet nicht still das lokale StockInfo."""
    result = run_address('"remot"', "https://stockinfo.example.invalid")

    assert result.returncode == 1
    assert "DEV_STOCKINFO=remot ist unbekannt" in result.stderr
    assert result.stdout == ""
