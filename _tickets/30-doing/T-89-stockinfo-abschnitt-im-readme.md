# T-89 · Eigener README-Abschnitt zu StockInfo

**Warum dieses Ticket:** Die READMEs nennen StockInfo nur als Kursquelle in
einem Nebensatz. Sie erklären nicht, wie die beiden Apps zusammengehören.
StockInfo hat dafür seit 2026-10-03 einen eigenen Abschnitt
„StockPortfolio: the companion app“ (StockInfo `10807c6`). StockPortfolio
braucht das Gegenstück.

**Stand:** Angelegt am 2026-10-03 von Claude auf Mikes Auftrag. Umsetzung
nach T-82 auf einem eigenen Branch von `master`, weil T-82 gerade in Prüfung
ist.

## Aussage (Mike, 2026-10-03)

- StockInfo läuft unabhängig von StockPortfolio.
- StockPortfolio ist als sinnvolle Ergänzung zu StockInfo entwickelt und
  braucht StockInfo für Kurse, Devisenkurse und Fondskennzahlen.

## Umfang

1. `README.md`: eigene Überschrift nach dem Screenshot, vor
   „What it does“. Gleiche Position wie in StockInfo (nach dem Screenshot,
   vor den Release-Highlights).
2. `docker/README.md`: eigene Überschrift nach dem Screenshot, vor
   „Features“. Inhalt: StockInfo-Container zuerst starten,
   `STOCKINFO_API_URL` setzen, Link auf `mangolila/stockinfo`.
3. `unraid/README.md`: kurzer Hinweis mit Link auf den Abschnitt im
   Root-README.

## Textvorschlag (README.md)

```markdown
### StockInfo: where the prices come from

StockPortfolio was built as a companion to
[StockInfo](https://github.com/MikeMitterer/stockinfo). StockInfo supplies
prices, exchange rates and fund metrics; StockPortfolio turns them into
portfolio values and rebalancing trades. StockPortfolio does not work
without a StockInfo instance.

StockInfo also works on its own, for example for scripts or spreadsheets.

|  | StockInfo | StockPortfolio |
|---|---|---|
| Purpose | Quotes, price history, ETF metrics | Portfolios, valuation, rebalancing |
| Runs without the other app | Yes | No, it needs StockInfo for prices |
| Docker image | [`mangolila/stockinfo`](https://hub.docker.com/r/mangolila/stockinfo) | [`mangolila/stockportfolio`](https://hub.docker.com/r/mangolila/stockportfolio) |

Set up StockInfo first, then point StockPortfolio at it with
`STOCKINFO_API_URL` (see [Setup](#setup)).
```

Die Tabelle stimmt wörtlich mit StockInfos README überein. Ändert sich eine
Seite, zieht die andere mit.

### Akzeptanzkriterien

- [ ] `README.md` und `docker/README.md` haben je eine eigene Überschrift zu
      StockInfo an der genannten Stelle.
- [ ] Beide sagen: StockInfo läuft allein, StockPortfolio braucht StockInfo
      und ist als Ergänzung dafür entwickelt.
- [ ] Die Tabelle stimmt mit StockInfos README überein.
- [ ] `unraid/README.md` verweist auf den Abschnitt.
- [ ] Docker-Hub-Vorschau unter 25.000 Bytes.
