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

**Stand:** Umgesetzt in `2e0a52a` auf `t-74-requirements-dev` und an
`codex-verifier` übergeben (Mike, 2026-10-01: „Erledige es gleich nach t-72“).
Mike hat den Abschluss vorab erteilt: „Wenn der verifier T-74 abgenommen hat
ist es für mich auch erledigt“ (2026-10-01). Nach der technischen Freigabe
schließt der Coder ab, merged und pusht.

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
| 1 | <a id="pruefpunkt-1"></a>Lokal | Inventar wiederholen (`git grep -n "requirements\.txt"`) | Keine aktuelle Fundstelle mehr auf den alten Namen außer archivierten Tickets | Mike | ✅ nur noch archivierte Tickets und dieses Ticket |
| 2 | <a id="pruefpunkt-2"></a>Lokal | `make setup` mit vorhandener `.venv` | läuft ohne Fehler durch | Mike | ✅ exit 0 |
| 3 | <a id="pruefpunkt-3"></a>Lokal | `make setup` mit frischer `.venv` (alte beiseitegelegt, danach wiederhergestellt) | installiert ProjectTools aus `requirements-dev.txt`; `projecttools.ui.colors` importierbar | Mike | ✅ exit 0; „Obtaining … (from -r requirements-dev.txt)“, `mmit-projecttools 0.1.0`, `colors ok` |
| 4 | <a id="pruefpunkt-4"></a>Lokal | Teststack `--stack --status` und farbige Make-Ausgabe | funktionieren mit der neu eingerichteten `.venv` | Folgewirkung | ✅ `--stack --status` exit 0, `make help` farbig |

### Akzeptanzkriterien

- [x] Die Datei heißt `requirements-dev.txt`; `requirements.txt` gibt es nicht mehr.
- [x] `make setup` funktioniert mit vorhandener und mit frischer `.venv`.
- [x] `Makefile`, `AGENTS.md` und `README.md` nennen den neuen Namen; der Doku-Abgleich nennt jede Fundstelle.

### Side-Effects

Wer eine eigene Kopie des Befehls `pip install -r requirements.txt` nutzt,
muss den Namen anpassen. Keine Auswirkung auf Image, App oder Tests.

## Coder-Übergabe · Runde 1 · claude-coder · 2026-10-01

**Prüfstand:** `2e0a52a6902a4542f86e40d17e2d3464c926ef9c` gegen `b6a01b2`, Branch `t-74-requirements-dev`.

**Änderung:** `git mv requirements.txt requirements-dev.txt`; Kopfkommentar
sagt jetzt, dass die Datei nur Entwicklungswerkzeuge für `make setup` enthält
und das Image sie nicht nutzt. `Makefile` (`setup`), `AGENTS.md` (Bauen und
prüfen) und `README.md` (Setup) nennen den neuen Namen.

**Inventar wiederholt:** `git grep -n "requirements\.txt"` findet außerhalb
von `_tickets/` nichts mehr; `py-run` aus ProjectTools nutzt eigene
`<name>.requirements.txt` und bleibt unberührt.

**`make setup`:** mit vorhandener `.venv` exit 0. Mit frischer `.venv` (alte
nach `.venv-t74-backup` verschoben) exit 0; pip meldet „Obtaining
file:///…/.libs/ProjectTools (from -r requirements-dev.txt (line 3))“ und
„Successfully installed mmit-projecttools-0.1.0“; `projecttools.ui.colors`
importierbar. Mit dieser `.venv` liefen `scripts/stockinfo-test-server.py
--stack --status` (exit 0) und `make help` mit Farbe. Danach frische `.venv`
entfernt und die alte zurückgelegt, Import erneut geprüft. `make setup`
führt auch `npm ci` aus; vorher war kein StockPortfolio-Dev-Server aktiv.

**Belege:** `make test` 852 Frontend- und 20 API-Tests grün; Lint und
Typecheck ohne Befund.

**Doku-Abgleich:** `README.md` (Setup) und `AGENTS.md` (Bauen und prüfen)
nachgezogen. `docker/README.md`, `unraid/README.md`, `docs/` und das Image
nennen die Datei nicht; unverändert.

**Lessons:** SI-P-02/12 (Inventar vor und nach der Änderung). Keine neue Lesson.
