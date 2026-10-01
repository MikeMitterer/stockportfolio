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

**Stand:** In Umsetzung durch `claude-coder` auf `t-76-teststack-wrapper`.

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
| 1 | <a id="pruefpunkt-1"></a>Lokal | `./scripts/stockinfo-test-server.sh --help` und `--stack --status` in einem echten Terminal | farbige Ausgabe, Interpreter = Projekt-`.venv` | Mike | ➖ |
| 2 | <a id="pruefpunkt-2"></a>Lokal | Aufruf aus einem anderen Ordner (`cd /tmp && …/stockinfo-test-server.sh --stack --status`) | gleiches Ergebnis | Umfang 1 | ➖ |
| 3 | <a id="pruefpunkt-3"></a>Teststack | `--stack --run --demo-accounts`, `--status`, `--stop` über den Wrapper | Stack startet und stoppt wie bisher | Mike | ➖ |
| 4 | <a id="pruefpunkt-4"></a>Lokal | `bash -n` und ShellCheck | ohne Befund | Konvention | ➖ |

### Akzeptanzkriterien

- [ ] Der Wrapper startet das Skript mit der Projekt-`.venv`, aus jedem Ordner.
- [ ] README und `AGENTS.md` nennen den Wrapper als Standardaufruf für den Stack.

### Side-Effects

Keine Änderung am Verhalten des Python-Skripts; bisherige Aufrufe über
`.venv/bin/python` funktionieren weiter.
