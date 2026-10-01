# T-75 · README: StockInfo-Einzelserver zeigt die gemeinsame CLI-Hilfe

**Warum dieses Ticket:** `README.md` (Abschnitt zum lokalen Teststack, Zeile
426–427) sagt, der StockInfo-Einzelserver nutze mit StockInfos Python-Umgebung
eine schlichte Hilfe („uses plain help“). Seit StockInfo T-82 installiert
StockInfos `make setup` das ProjectTools-Paket in dessen `.venv`; die Hilfe
nutzt dort das gemeinsame CLI-Theme (`has_theme() == True`, von StockInfos
Verifier unabhängig gemessen). Die Aussage ist damit veraltet. Mike,
2026-10-01: als StockPortfolio-Ticket führen, damit der laufende T-72-Review
nicht berührt wird.

**Beispiel:** Wer `../StockInfo/.venv/bin/python scripts/stockinfo-test-server.py --help`
aufruft, sieht die farbige gemeinsame Hilfe, nicht die schlichte.

**Stand:** Umgesetzt in `8b6358d` und an `codex-verifier` übergeben (Mike,
2026-10-01: „danach gleich t-75“). Für Mike steht nichts an.

## Gewünschte Änderung

Zeile 426–427 in `README.md` ersetzen, Vorschlag:

> That single-server mode imports StockInfo in the same process. StockInfo's
> `make setup` installs the shared ProjectTools package into its `.venv`, so the
> help uses the common CLI theme there as well.

`AGENTS.md` (Abschnitt zum StockInfo-Testserver) auf dieselbe Aussage
abgleichen.

## Verify

| # | Handgriff | Erwarteter Nachweis | AI |
|---|---|---|:--:|
| 1 | Nach StockInfos `make setup` den Einzelserver mit `--help` starten | Gemeinsame CLI-Hilfe, kein Dienst gestartet | ✅ 21 von 28 Zeilen farbig (Pseudo-TTY), Port 8899 danach frei |
| 2 | `README.md` und `AGENTS.md` lesen | Beide beschreiben die Hilfe des Einzelservers gleich | ✅ README (Setup) und AGENTS (Bauen und prüfen) |

### Akzeptanzkriterien

- [x] README und AGENTS nennen den aktuellen Stand der Einzelserver-Hilfe.

### Auflösung

Offen. Angelegt von StockInfos Coder `claude` als Folge von StockInfo T-82,
Befund B1 des Verifiers; StockInfo selbst ändert hier nichts.

## Coder-Übergabe · Runde 1 · claude-coder · 2026-10-01

**Prüfstand:** `8b6358d8aa53bdcad283f5e0a700e975d8382b8a` gegen `66e289e` (`master` mit T-74), Branch
`t-75-einzelserver-hilfe-doku`.

**Änderung:** `README.md` (Setup, Absatz nach dem Einzelserver-Aufruf) mit dem
Wortlaut aus dem Ticket; `AGENTS.md` (Bauen und prüfen) sagt dasselbe auf
Deutsch: StockInfos `make setup` installiert ProjectTools in dessen `.venv`,
die Hilfe nutzt dort das gemeinsame CLI-Theme.

**Belege:** `../StockInfo/.venv/bin/python -B scripts/stockinfo-test-server.py
--help` in einem Pseudo-TTY (`script -q /dev/null …`): 21 von 28 Zeilen mit
ANSI-Farbcode; StockInfos `.venv` meldet `mmit-projecttools 0.1.0`; Port 8899
danach frei, kein Dienst gestartet. `git grep` nach „plain help“, „bleibt mit
dessen“, „derzeitiger Umgebung“ außerhalb von `_tickets/` ohne Treffer.
`make test` 852 Frontend- und 20 API-Tests grün; Lint und Typecheck ohne Befund.

**Nebenbefund (nicht Teil dieses Tickets):** Ein direkter Aufruf
`./scripts/stockinfo-test-server.py` oder `python3 scripts/…` läuft über den
Shebang `#!/usr/bin/env python3` mit der System-Python ohne ProjectTools und
bleibt deshalb ungefärbt (0 Farbzeilen). Mike hat danach gefragt; ein
Folgeticket ist vorgeschlagen, noch nicht angelegt.

**Doku-Abgleich:** nur `README.md` und `AGENTS.md` betroffen; `docker/README.md`,
`unraid/README.md` und `docs/` beschreiben den Teststack nicht.

**Lessons:** keine Befunde, keine neue Lesson.
