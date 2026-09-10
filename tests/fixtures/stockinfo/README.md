StockInfo-Vertragsfixtures, Core 4.3.0, übernommen aus Commit
`778e449296e92bb46c0b430d9f0f9365442bf4b6`. HTTP-Umschläge bleiben erhalten.
Tests lesen nur diese lokalen Kopien und verwenden injiziertes Fetch.

`detail-catalog.json` und `detail-values.json` sind synthetische T-40-Fälle
nach `DetailDefinition`, `DetailValue` und dem Unit-Vertrag desselben
StockInfo-Produktstands. Sie sind keine aufgezeichneteten HTTP-Antworten.
Die optionale Detailvorbereitung im T-39-Testserver verwendet diese Daten
für echte REST-Antworten aus einer separaten SQLite-Datenbank.
Die Textprobe enthält absichtlich HTML-Zeichen; sie darf nur als Text erscheinen.
