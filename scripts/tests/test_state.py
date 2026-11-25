"""Zustandsdatei des Teststacks: atomar veröffentlichen, nur Eigenes entfernen."""

from __future__ import annotations

import json
from pathlib import Path

import pytest

from teststack.state import OwnedStateFile


def test_publishes_complete_json_without_temporary_leftovers(tmp_path: Path) -> None:
    """Veröffentlicht vollständiges JSON ohne temporäre Reste."""
    state_path = tmp_path / "stack.json"

    OwnedStateFile(state_path).publish({"pid": 4711, "children": {"api": {"pid": 4712}}})

    assert json.loads(state_path.read_text()) == {"pid": 4711, "children": {"api": {"pid": 4712}}}
    assert [entry.name for entry in tmp_path.iterdir()] == ["stack.json"]


def test_never_overwrites_existing_state(tmp_path: Path) -> None:
    """Überschreibt keinen vorhandenen Zustand."""
    state_path = tmp_path / "stack.json"
    state_path.write_text('{"pid": 1}')

    with pytest.raises(FileExistsError):
        OwnedStateFile(state_path).publish({"pid": 2})

    assert json.loads(state_path.read_text()) == {"pid": 1}
    assert [entry.name for entry in tmp_path.iterdir()] == ["stack.json"]


def test_removes_own_published_file(tmp_path: Path) -> None:
    """Entfernt die selbst veröffentlichte Datei."""
    state_path = tmp_path / "stack.json"
    owned = OwnedStateFile(state_path)
    owned.publish({"pid": 1})

    owned.remove()

    assert not state_path.exists()


def test_keeps_foreign_file_with_same_name(tmp_path: Path) -> None:
    """Lässt eine fremde Datei gleichen Namens stehen."""
    state_path = tmp_path / "stack.json"
    owned = OwnedStateFile(state_path)
    owned.publish({"pid": 1})
    state_path.unlink()
    state_path.write_text('{"pid": 2}')

    owned.remove()

    assert json.loads(state_path.read_text()) == {"pid": 2}


def test_keeps_foreign_state_in_reused_inode(tmp_path: Path) -> None:
    """Bekommt eine fremde Datei dieselbe Inode, bleibt sie stehen.

    Linux (ext4) vergibt die Inode einer gelöschten Datei sofort neu. Eine
    fremde Zustandsdatei gleichen Namens kann so dieselbe Inode tragen wie die
    eigene; die Inode allein beweist dann kein Eigentum. Nachgestellt durch
    Überschreiben an Ort und Stelle, das die Inode behält.
    """
    state_path = tmp_path / "stack.json"
    owned = OwnedStateFile(state_path)
    owned.publish({"pid": 1})
    own_inode = state_path.stat().st_ino
    state_path.write_text('{"pid": 2}')
    assert state_path.stat().st_ino == own_inode

    owned.remove()

    assert json.loads(state_path.read_text()) == {"pid": 2}


def test_removes_nothing_without_own_publish(tmp_path: Path) -> None:
    """Entfernt ohne eigene Veröffentlichung nichts."""
    state_path = tmp_path / "stack.json"
    state_path.write_text('{"pid": 3}')

    OwnedStateFile(state_path).remove()

    assert state_path.exists()


def test_removing_already_deleted_file_is_no_error(tmp_path: Path) -> None:
    """Das Entfernen einer schon gelöschten Datei ist kein Fehler."""
    state_path = tmp_path / "stack.json"
    owned = OwnedStateFile(state_path)
    owned.publish({"pid": 1})
    state_path.unlink()

    owned.remove()

    assert not state_path.exists()
