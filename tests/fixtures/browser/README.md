# Wiederverwendbares Browser-Testdepot

[`valid-portfolio.backup.json`](valid-portfolio.backup.json) ist eine reguläre
StockPortfolio-Sicherung. Sie enthält fünf Positionen mit zusammen 100 % Ziel:
MSCI World ETF (EUNL.DE), US Total Market ETF (VTI), Apple (AAPL), eine Bundesanleihe
(DE0001135275) und 500 EUR Cash. Alle vier Wertpapiere haben im lokalen
StockInfo-Testserver einen gültigen Kurs. Die Kurse selbst stehen nicht in der
Sicherung und werden beim Öffnen frisch geladen.

1. Den lokalen Dienst vom StockPortfolio-Repo aus starten:

   ```bash
   /Volumes/DevLocal/DevWeb/Production/StockInfo/.venv/bin/python scripts/stockinfo-test-server.py \
     --stockinfo-root /Volumes/DevLocal/DevWeb/Production/StockInfo \
     --detail-fixtures tests/fixtures/stockinfo --demo-details
   ```

2. Die App mit diesem Dienst starten:

   ```bash
   VITE_STOCKINFO_API_URL=http://127.0.0.1:8899 npm run dev -- \
     --host 127.0.0.1 --port 5189 --strictPort
   ```

3. In einem frischen Browserkontext `http://127.0.0.1:5189/` öffnen. Unter
   **Einstellungen → Sicherung → Sicherung einspielen** die JSON-Datei wählen
   und das Ersetzen bestätigen. Der Import ersetzt das aktive Depot und die
   Einstellungen dieses Browserkontexts.

Nach dem Laden zeigt das Dashboard **Browser-Testdepot, 5 Positionen** und
**Datenlage: Vollständig**. VTI prüft die USD/EUR-Umrechnung. Der Testdienst
liefert keine historischen Devisenkurse; deshalb kann der Rückblick des
Gesamtwert-Charts einen entsprechenden Hinweis zeigen. Das ist kein fehlender
Positionskurs.

EUNL.DE enthält eine mehrzeilige Positionsnotiz zum Prüfen der Anzeige direkt
unter der Detail-Button-Leiste; die anderen Positionen bleiben ohne Notiz.

Den eigenen Testdienst mit demselben Skript und `--stop --port 8899` beenden.


## Dynamische Typauswahl prüfen

Der Testserver bietet den echten `/instrument-types`-Endpunkt aus dem
StockInfo-Checkout. Für gezielte Katalogfälle lassen sich folgende Szenarien
über `POST /__test/scenario` wählen: `types-future` (neuer Typ ohne Bestand),
`types-empty` (bekannter Leerstand), `types-incomplete` (unvollständig) und
`types-down` (HTTP 503). Die ersten drei verwenden die versionierten
`instrument-types-200*.json` unter `tests/fixtures/stockinfo/`.

```bash
curl -X POST http://127.0.0.1:8899/__test/scenario \
  -H 'Content-Type: application/json' -d '{"mode":"types-future"}'
```

In **Einstellungen → Verweise → Typen neu laden** die Auswahl prüfen. Einen
neuen Typ auswählen, Seite neu laden, dann leeren oder gestörten Katalog wählen:
Der Filter bleibt erhalten und ist entsprechend markiert. Eine Auswahl darf
nicht still zu „alle Typen“ werden. Nach der Probe vorübergehende Filter entfernen
und das Szenario mit `{"mode":"normal"}` wiederherstellen. Vorhandene Depotdaten
können für alle Fälle weiterverwendet werden.
