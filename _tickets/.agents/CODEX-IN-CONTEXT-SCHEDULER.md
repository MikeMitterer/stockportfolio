# Codex-In-Context-Scheduler · StockPortfolio

**Diese Datei ist ein kurzer Einstieg.** Der gemeinsame Vertrag für den
Codex-Scheduler liegt im installierten Paket:
`${XDG_DATA_HOME:-$HOME/.local/share}/agent-workflow/current/templates/board/.agents/CODEX-IN-CONTEXT-SCHEDULER.md`.
Vor jedem fachlichen Durchlauf `current/VERSION` prüfen und den Vertrag nach
einer Änderung neu lesen. Fehlt das Paket, das melden. Kennungen und
Startzeilen für StockPortfolio stehen in der
[Aktivierung](AGENT-ACTIVATION.md#codex-scheduler); Rollen in
[STATUS](../STATUS.md).

## Start und Rollenprüfung

Paket: gleichnamiger Abschnitt. Lokal: Die Kennung im Startauftrag muss exakt
dem STATUS-Feld entsprechen (`codex-verifier` beziehungsweise
`codex-observer`), nicht der Standardkennung `codex` eines Shortcuts.

### Lokaler Filecheck

Der Observer verwendet den abgelegten
[Filecheck](../../.agents/bin/observer-filecheck.py). Aus dem Projektverzeichnis:

```bash
python3 -B .agents/bin/observer-filecheck.py
```

Der Aufruf liefert Rollenfelder, Datei-Hashes und Git-HEAD als JSON und schreibt
keine Dateien. Der bestehende Scheduler vergleicht die Snapshots und prüft die
Observer-Zuordnung. Den Quelltext nicht bei jedem Durchlauf erneut als Befehl
übertragen oder generieren. Änderungen am Check erfolgen an dieser einen Datei.
Die Ablage ist vorläufig projektspezifisch; über eine allgemein wiederverwendbare
Fassung entscheidet Mike später. Es entsteht kein zusätzlicher Timer.

## App mit ausführbarer In-Context-Zelle

Paket: gleichnamiger Abschnitt. Keine lokale Abweichung.

## Codex-CLI mit Shell-Prozesswerkzeugen

Paket: gleichnamiger Abschnitt. Keine lokale Abweichung.

## Fällige Durchläufe

Paket: gleichnamiger Abschnitt. Lokal: Der Takt beträgt fünf Minuten.

## Stoppen, Compaction und Wiederanlauf

Paket: gleichnamiger Abschnitt. Keine lokale Abweichung.
