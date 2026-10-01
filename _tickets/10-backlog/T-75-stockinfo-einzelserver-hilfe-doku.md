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

**Stand:** Backlog, nicht aktiviert. Für Mike steht nichts an.

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
| 1 | Nach StockInfos `make setup` den Einzelserver mit `--help` starten | Gemeinsame CLI-Hilfe, kein Dienst gestartet | ➖ |
| 2 | `README.md` und `AGENTS.md` lesen | Beide beschreiben die Hilfe des Einzelservers gleich | ➖ |

### Akzeptanzkriterien

- [ ] README und AGENTS nennen den aktuellen Stand der Einzelserver-Hilfe.

### Auflösung

Offen. Angelegt von StockInfos Coder `claude` als Folge von StockInfo T-82,
Befund B1 des Verifiers; StockInfo selbst ändert hier nichts.
