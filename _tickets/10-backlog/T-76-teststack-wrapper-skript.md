# T-76 · Bash-Wrapper startet den Teststack mit der richtigen Python

**Warum dieses Ticket:** `scripts/stockinfo-test-server.py` ist ausführbar und
beginnt mit `#!/usr/bin/env python3`. Wer es direkt aufruft
(`./scripts/stockinfo-test-server.py …` oder `python3 …`), bekommt die
System-Python ohne ProjectTools: keine Farben, und für den Einzelserver fehlt
StockInfos `app`. Richtig ist heute nur der lange Aufruf über
`.venv/bin/python` beziehungsweise `../StockInfo/.venv/bin/python`. Mike,
2026-10-01: „Baue in bashscript dass den Aufruf des Script korrekt ausführt“.

**Beispiel:** Heute: `./scripts/stockinfo-test-server.py --stack --status`
läuft ungefärbt mit `/usr/bin/python3`. Danach:
`./scripts/stockinfo-test-server.sh --stack --status` wählt selbst die
Projekt-`.venv` und zeigt die farbige Ausgabe.

**Stand:** Im Backlog, eingeplant direkt nach T-75 (Root steht während der
T-75-Prüfung auf dessen Branch).

Für dich steht jetzt nichts an.

## Umsetzung und technische Nachweise

| Repo | Time-box | Scope | GH-Issue |
|---|---|---|---|
| root | 1–2 h | neues `scripts/stockinfo-test-server.sh`, Doku, Aufrufer | — |

**Entwurf (claude-coder, 2026-10-01):**

1. Neues `scripts/stockinfo-test-server.sh` (Bash, Konventionen wie
   `scripts/setup-libs.sh`: Kopfblock, `set -euo pipefail`, Bezeichner
   englisch, Kommentare deutsch). Reicht alle Argumente unverändert an das
   Python-Skript durch (`exec … -B scripts/stockinfo-test-server.py "$@"`).
2. **Interpreter-Wahl:** mit `--stack` (oder `-S`) die Projekt-`.venv`
   (`<root>/.venv/bin/python`); ohne `--stack` den Einzelserver mit
   StockInfos `.venv` aus `--stockinfo-root`/`-i` (Vorgabe `../StockInfo`,
   relativ zum Projekt-Root aufgelöst). Funktioniert aus jedem Arbeitsordner.
3. **Fehlt die passende `.venv`:** klare Meldung mit dem nötigen Schritt
   (`make setup` im jeweiligen Repo), Exit ≠ 0 — kein stiller Rückfall auf
   die System-Python.
4. `--help` ohne weitere Argumente zeigt die Hilfe über die Projekt-`.venv`.
5. Der direkte Python-Aufruf bleibt möglich; README, `AGENTS.md`, der Kopf des
   Python-Skripts sowie die Aufrufkommentare in
   `frontend/scripts/capture-screenshots.mjs` und
   `frontend/scripts/live-sync-smoke.mjs` nennen künftig den Wrapper.

### Verify

| # | Lauf | Handgriff | Nachweis | woher | AI |
|---|:--:|---|---|---|:--:|
| 1 | <a id="pruefpunkt-1"></a>Lokal | `./scripts/stockinfo-test-server.sh --help` und `--stack --status` in einem echten Terminal | farbige Ausgabe, Interpreter = Projekt-`.venv` | Mike | ➖ |
| 2 | <a id="pruefpunkt-2"></a>Lokal | Aufruf aus einem anderen Ordner (`cd /tmp && …/stockinfo-test-server.sh --stack --status`) | gleiches Ergebnis | Entwurf 2 | ➖ |
| 3 | <a id="pruefpunkt-3"></a>Teststack | `--stack --run --demo-accounts`, `--status`, `--stop` über den Wrapper | Stack startet und stoppt wie bisher | Mike | ➖ |
| 4 | <a id="pruefpunkt-4"></a>Lokal | Einzelserver `--run --stockinfo-root ../StockInfo --port <frei>` über den Wrapper | läuft mit StockInfos `.venv`, Health 200 | Entwurf 2 | ➖ |
| 5 | <a id="pruefpunkt-5"></a>Lokal | fehlende `.venv` simulieren (`--stockinfo-root` auf einen Ordner ohne `.venv`) | klare Meldung, Exit ≠ 0 | Entwurf 3 | ➖ |
| 6 | <a id="pruefpunkt-6"></a>Lokal | `bash -n` und ShellCheck | ohne Befund | Konvention | ➖ |

### Akzeptanzkriterien

- [ ] Ein Aufruf des Wrappers wählt ohne Zutun die richtige Python für Stack und Einzelserver.
- [ ] Fehlende Umgebungen enden mit klarer Meldung statt stiller schlichter Ausgabe.
- [ ] README und `AGENTS.md` nennen den Wrapper als Standardaufruf.

### Side-Effects

Keine Änderung am Verhalten des Python-Skripts; bisherige Aufrufe über
`.venv/bin/python` funktionieren weiter.
