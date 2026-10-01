# T-74 · `requirements.txt` in `requirements-dev.txt` umbenennen

**Warum dieses Ticket:** Die Datei `requirements.txt` im Projekt-Root enthält
nur Werkzeuge für die Entwicklung (das verlinkte ProjectTools-Paket für
`MAKE_THEME` und den Teststack), keine Laufzeitabhängigkeit der App. Der Name
`requirements.txt` legt das Gegenteil nahe: Python-Werkzeuge und Leser halten
sie für die Abhängigkeiten des Produkts. Mike, 2026-10-01: „Erstelle ein
Ticket das requirements.txt auf requirements-dev.txt umbenennt die
Folgewirkungen überprüft und richtigstellt. make setup muss danach natürlich
wieder funktionieren“.

**Beispiel:** Heute: `requirements.txt` mit `-e ./.libs/ProjectTools`.
Danach: `requirements-dev.txt` mit demselben Inhalt; `make setup` installiert
daraus wie bisher.

**Stand:** In Umsetzung durch `claude-coder` auf `t-74-requirements-dev`
(Mike, 2026-10-01: „Erledige es gleich nach t-72“).

Für dich steht jetzt nichts an.

## Umsetzung und technische Nachweise

| Repo | Time-box | Scope | GH-Issue |
|---|---|---|---|
| root | 0,5–1 h | Umbenennung, Makefile, Doku | — |

**Inventar (claude-coder, 2026-10-01, `git grep requirements`):**

| Fundstelle | Art | Folge |
|---|---|---|
| `requirements.txt` | Datei | per `git mv` umbenennen |
| `Makefile:119` (`setup`) | `pip install -r requirements.txt` | auf `requirements-dev.txt` umstellen |
| `AGENTS.md:249` (Bauen und prüfen) | Beschreibung von `make setup` | Dateinamen nachziehen |
| `README.md:360` (Setup) | Beschreibung von `make setup` | Dateinamen nachziehen |
| `_tickets/40-done/T-63-…` | Historie | unverändert lassen |
| `.libs/ProjectTools/src/python/py-run.py` | eigene `<name>.requirements.txt` | nicht betroffen |

Die übrigen Treffer meinen das englische Wort „requirements“ (Lizenztexte,
Passwortregeln) und sind nicht betroffen. `.dockerignore`, Dockerfile,
Skripte und Tests verweisen nicht auf die Datei. Vor der Umsetzung das
Inventar auf dem dann aktuellen Stand wiederholen.

### Verify

| # | Lauf | Handgriff | Nachweis | woher | AI |
|---|:--:|---|---|---|:--:|
| 1 | <a id="pruefpunkt-1"></a>Lokal | Inventar wiederholen (`git grep -n "requirements\.txt"`) | Keine aktuelle Fundstelle mehr auf den alten Namen außer archivierten Tickets | Mike | ➖ |
| 2 | <a id="pruefpunkt-2"></a>Lokal | `make setup` mit vorhandener `.venv` | läuft ohne Fehler durch | Mike | ➖ |
| 3 | <a id="pruefpunkt-3"></a>Lokal | `make setup` mit frischer `.venv` (alte beiseitegelegt, danach wiederhergestellt) | installiert ProjectTools aus `requirements-dev.txt`; `projecttools.ui.colors` importierbar | Mike | ➖ |
| 4 | <a id="pruefpunkt-4"></a>Lokal | Teststack `--stack --status` und farbige Make-Ausgabe | funktionieren mit der neu eingerichteten `.venv` | Folgewirkung | ➖ |

### Akzeptanzkriterien

- [ ] Die Datei heißt `requirements-dev.txt`; `requirements.txt` gibt es nicht mehr.
- [ ] `make setup` funktioniert mit vorhandener und mit frischer `.venv`.
- [ ] `Makefile`, `AGENTS.md` und `README.md` nennen den neuen Namen; der Doku-Abgleich nennt jede Fundstelle.

### Side-Effects

Wer eine eigene Kopie des Befehls `pip install -r requirements.txt` nutzt,
muss den Namen anpassen. Keine Auswirkung auf Image, App oder Tests.
