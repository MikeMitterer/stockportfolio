"""check-files.sh: versionierte Dateien sicher an ein Prüfwerkzeug übergeben (T-99, T-152)."""

import os
import subprocess
from pathlib import Path

import pytest

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
CHECK_FILES = PROJECT_ROOT / "scripts/check-files.sh"


def run(args: list[str], cwd: Path) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        [str(CHECK_FILES), *args],
        capture_output=True,
        text=True,
        check=False,
        timeout=30,
        cwd=cwd,
        env={**os.environ, "PATH": f"{PROJECT_ROOT / '.tools/bin'}:{os.environ['PATH']}", "NO_COLOR": "1"},
    )


@pytest.fixture
def repo(tmp_path: Path) -> Path:
    """Git-Repository mit heiklen Dateinamen; eine Datei ist nicht versioniert."""
    for name in ("a.py", "with space.py", "-dash.py", "tool.sh", ".githooks/pre-commit"):
        path = tmp_path / name
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text("")
    subprocess.run(["git", "init", "-q"], cwd=tmp_path, check=True)
    subprocess.run(["git", "add", "--", "."], cwd=tmp_path, check=True)
    (tmp_path / "untracked.py").write_text("")
    return tmp_path


@pytest.mark.parametrize("args", [[], ["-h"], ["--help"]])
def test_help_explains_options_with_examples(args: list[str], tmp_path: Path) -> None:
    """Ohne Argument und mit -h/--help: Hilfe mit Kurz-/Langform und Beispielen, Leerzeile am Ende."""
    result = run(args, tmp_path)

    assert result.returncode == 0, result.stderr
    for option in ("-p | --python", "-s | --shell", "-e | --each", "-h | --help", "Hints"):
        assert option in result.stdout
    assert "check-files.sh --python -- " in result.stdout
    assert result.stdout.endswith("\n\n")


def test_python_files_reach_the_command_as_separate_arguments(repo: Path) -> None:
    """Jeder versionierte Pfad ein eigenes Argument mit ./, auch mit Leerzeichen oder Bindestrich."""
    result = run(["--python", "--", "printf", "<%s>\n"], repo)

    assert result.returncode == 0, result.stderr
    assert result.stdout.splitlines() == ["<./-dash.py>", "<./a.py>", "<./with space.py>"]


def test_each_calls_the_command_once_per_shell_file(repo: Path) -> None:
    """--each ruft den Befehl je Datei auf; Shell umfasst den versionierten Git-Hook."""
    result = run(["-s", "-e", "--", "echo", "call"], repo)

    assert result.returncode == 0, result.stderr
    assert result.stdout.splitlines() == ["call ./.githooks/pre-commit", "call ./tool.sh"]


def test_git_failure_stops_with_its_exit_code(tmp_path: Path) -> None:
    """Ohne Repository kein falsches Grün mit leerer Liste: git's Exit-Code kommt durch."""
    result = run(["--python", "--", "echo", "never"], tmp_path)

    assert result.returncode == 128
    assert "never" not in result.stdout


@pytest.mark.parametrize(
    ("args", "message"),
    [
        (["--nope"], "--nope"),
        (["--", "echo"], "--python"),
        (["--python", "--shell", "--", "echo"], "--python"),
        (["--python"], "--python -- .venv/bin/ruff check"),
        (["--shell"], "--shell -- shellcheck"),
    ],
)
def test_wrong_call_names_the_next_step(args: list[str], message: str, repo: Path) -> None:
    """Falscher Aufruf: Exit 1, Meldung auf stderr mit Hinweis, Leerzeile am Ende."""
    result = run(args, repo)

    assert result.returncode == 1
    assert message in result.stderr
    assert "--help" in result.stderr
    assert result.stderr.endswith("\n\n")


def test_each_checks_every_file_and_fails_at_the_end(repo: Path) -> None:
    """--each bricht nicht bei der ersten Fundstelle ab: alle Dateien laufen, danach Exit 1."""
    # Die kaputte Datei steht vorn: Ein Abbruch nach der ersten Fundstelle ließe tool.sh aus.
    (repo / ".githooks/pre-commit").write_text("if\n")

    result = run(["--shell", "--each", "--", "bash", "-c", 'echo "checked $0"; bash -n "$0"'], repo)

    assert result.returncode == 1
    assert result.stdout.splitlines() == ["checked ./.githooks/pre-commit", "checked ./tool.sh"]
