# T-76 · Bash-Wrapper startet den Teststack mit der richtigen Python

**Verworfen am 2026-10-01** durch Mike: „Du kannst stockinfo-test-server.sh doch wieder löschen“ Die Umsetzung `b1e58cb` ist mit `9707e58` zurückgenommen, bevor die Prüfung begann; der dokumentierte Aufruf bleibt `.venv/bin/python scripts/stockinfo-test-server.py …`. Die folgenden Abschnitte beschreiben den Stand vor der Entscheidung.

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

**Stand:** Umgesetzt in `b1e58cb` und an `codex-verifier` übergeben.

Für dich steht jetzt nichts an.

## Umsetzung und technische Nachweise

| Repo | Time-box | Scope | GH-Issue |
|---|---|---|---|
| root | 1–2 h | neues `scripts/stockinfo-test-server.sh`, Doku, Aufrufer | — |

**Umfang (Mike, 2026-10-01: „Dieses Bash-Script kann sehr einfach gehalten
sein - ein Einzeiler ist in dem Fall OK“):**

1. Neues `scripts/stockinfo-test-server.sh` mit Kopfkommentar und einer
   Befehlszeile: `exec "<root>/.venv/bin/python" -B
   "<root>/scripts/stockinfo-test-server.py" "$@"`, Pfade aus dem Ort des
   Skripts, damit es aus jedem Ordner funktioniert.
2. Für Stack, Status, Stopp und Hilfe. Der Einzelserver ohne `--stack` bleibt
   beim dokumentierten Aufruf über `../StockInfo/.venv/bin/python`, weil er
   StockInfos `app` im selben Prozess lädt.
3. README, `AGENTS.md`, der Kopf des Python-Skripts sowie die Aufrufkommentare
   in `frontend/scripts/capture-screenshots.mjs` und
   `frontend/scripts/live-sync-smoke.mjs` nennen den Wrapper für den Stack.

### Verify

| # | Lauf | Handgriff | Nachweis | woher | AI |
|---|:--:|---|---|---|:--:|
| 1 | <a id="pruefpunkt-1"></a>Lokal | `./scripts/stockinfo-test-server.sh --help` und `--stack --status` in einem echten Terminal | farbige Ausgabe, Interpreter = Projekt-`.venv` | Mike | ✅ `--help` 21 Farbzeilen, `--stack --status` farbig (Pseudo-TTY) |
| 2 | <a id="pruefpunkt-2"></a>Lokal | Aufruf aus einem anderen Ordner (`cd /tmp && …/stockinfo-test-server.sh --stack --status`) | gleiches Ergebnis | Umfang 1 | ✅ aus `/tmp` gleiches Ergebnis |
| 3 | <a id="pruefpunkt-3"></a>Teststack | `--stack --run --demo-accounts`, `--status`, `--stop` über den Wrapper | Stack startet und stoppt wie bisher | Mike | ✅ `--run --demo-accounts`: alle Endpunkte und CORS ok; `--status` drei Prozesse; `--stop` räumt ab, Ports frei |
| 4 | <a id="pruefpunkt-4"></a>Lokal | `bash -n` und ShellCheck | ohne Befund | Konvention | ✅ `bash -n` und ShellCheck ohne Befund |

### Akzeptanzkriterien

- [x] Der Wrapper startet das Skript mit der Projekt-`.venv`, aus jedem Ordner.
- [x] README und `AGENTS.md` nennen den Wrapper als Standardaufruf für den Stack.

### Side-Effects

Keine Änderung am Verhalten des Python-Skripts; bisherige Aufrufe über
`.venv/bin/python` funktionieren weiter.

## Coder-Übergabe · Runde 1 · claude-coder · 2026-10-01

**Prüfstand:** `b1e58cbd6dc69fcce4f3e832e1895c08d7bf996d` gegen `fdcd64d`, Branch `t-76-teststack-wrapper`.

**Änderung:** neues ausführbares `scripts/stockinfo-test-server.sh`: Kopfblock
und eine Zeile `exec "<scriptdir>/../.venv/bin/python" -B
"<scriptdir>/stockinfo-test-server.py" "$@"` (Pfade über `BASH_SOURCE`). README
(Setup) und `AGENTS.md` (Bauen und prüfen) zeigen die drei Stack-Aufrufe über
den Wrapper und erklären in einem Satz, warum der direkte `.py`-Aufruf ohne
Farben bleibt. Kopf von `stockinfo-test-server.py` sowie die Aufrufkommentare
in `capture-screenshots.mjs` und `live-sync-smoke.mjs` nennen den Wrapper.
Einzelserver-Aufrufe (README Zeile 424, `frontend/tests/fixtures/browser/README.md`)
bleiben bei StockInfos Python.

**Belege:** siehe Verify 1–4. `make test` 852 Frontend- und 20 API-Tests grün;
Lint und Typecheck ohne Befund. Teststack danach gestoppt.

**Doku-Abgleich:** `README.md`, `AGENTS.md` und die beiden Skriptkommentare
wie oben; `docker/README.md`, `unraid/README.md` und `docs/` beschreiben den
Teststack nicht.

**Lessons:** keine Befunde, keine neue Lesson.

## Verworfen · 2026-10-01

Mike: „Du kannst stockinfo-test-server.sh doch wieder löschen“
Zurückgenommen mit `9707e58` (Revert von `b1e58cb`); `codex-verifier` hatte
die Prüfung noch nicht begonnen. Kein Rest im Code.
