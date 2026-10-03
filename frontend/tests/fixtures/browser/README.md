# Wiederverwendbares Browser-Testdepot

[`valid-portfolio.backup.json`](valid-portfolio.backup.json) ist ein reguläres
StockPortfolio-Backup. Es enthält fünf Positionen mit zusammen 100 % Ziel:
MSCI World ETF (EUNL.DE), US Total Market ETF (VTI), Apple (AAPL), eine Bundesanleihe
(DE0001135275) und 500 EUR Cash. Alle vier Wertpapiere haben im lokalen
StockInfo-Testserver einen gültigen Kurs. Die Kurse selbst stehen nicht im
Backup und werden beim Öffnen frisch geladen.

1. Den lokalen Dienst vom StockPortfolio-Repo aus starten:

   ```bash
   ../StockInfo/.venv/bin/python scripts/stockinfo-test-server.py --run \
     --stockinfo-root ../StockInfo \
     --detail-fixtures frontend/tests/fixtures/stockinfo --demo-details
   ```

2. Die App mit diesem Dienst starten:

   ```bash
   VITE_STOCKINFO_API_URL=http://127.0.0.1:8899 npm run dev --prefix frontend -- \
     --host 127.0.0.1 --port 5189 --strictPort
   ```

3. In einem frischen Browserkontext `http://127.0.0.1:5189/` öffnen. Unter
   **Einstellungen → Backup → Backup einspielen** die JSON-Datei wählen
   und das Ersetzen bestätigen. Der Import ersetzt das aktive Depot und die
   Einstellungen dieses Browserkontexts.

Nach dem Laden zeigt das Dashboard **Browser-Testdepot, 5 Positionen** und
**Datenlage: Vollständig**. VTI prüft die USD/EUR-Umrechnung. Der Testdienst
liefert keine historischen Devisenkurse; deshalb kann der Rückblick des
Gesamtwert-Charts einen entsprechenden Hinweis zeigen. Das ist kein fehlender
Positionskurs.

EUNL.DE enthält eine mehrzeilige Positionsnotiz zum Prüfen der Anzeige direkt
unter der Detail-Button-Leiste; die anderen Positionen bleiben ohne Notiz.

Mit `--demo-details` tragen alle Instrumente lesbare Namen und eigene
Detailwerte (`scripts/fixtures/demo-details.json`); die Anleihe heißt dort
„Bundesanleihe 2037“. `--detail-fixtures` liefert dann nur noch die
Typkatalog-Szenarien unten.

Den eigenen Testdienst mit demselben Skript und `--stop --port 8899` beenden.

## Demo-Detailwerte prüfen

[`demo-details.backup.json`](demo-details.backup.json) ist ein zweites
Backup für den Teststack mit `--demo-details`. Es enthält jedes Demo-Instrument
mit Detailwerten als Position: die fünf Papiere des Beispiel-Depots,
iShares Core MSCI World, Vanguard Total Stock Market (manuelle Fondsgröße in
USD), Apple und den DWS Vermögensbildungsfonds I, dazu 1.000 EUR Cash.
`frontend/scripts/demo-data-check.mjs` spielt es selbst ein und prüft danach
Assets-Übersicht und Zusatzinformationen; ein Vitest-Wächter hält Backup und
`scripts/fixtures/demo-details.json` deckungsgleich.


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

In **Einstellungen → Links → Typen neu laden** die Auswahl prüfen. Einen
neuen Typ auswählen, Seite neu laden, dann leeren oder gestörten Katalog wählen:
Der Filter bleibt erhalten und ist entsprechend markiert. Eine Auswahl darf
nicht still zu „alle Typen“ werden. Nach der Probe vorübergehende Filter entfernen
und das Szenario mit `{"mode":"normal"}` wiederherstellen. Vorhandene Depotdaten
können für alle Fälle weiterverwendet werden.

## Container unabhängig prüfen

Für eine andere Browser-Adresse `--origin` setzen, beispielsweise
`--port 8901 --origin http://127.0.0.1:55095`. Der Container erhält dazu
`STOCKINFO_API_URL=http://127.0.0.1:8901` und die Portzuordnung
`127.0.0.1:55095:8080`. So können Vite-Probe und Container-Probe nebeneinander
mit getrennten Testservern und Browserbeständen laufen. Dasselbe Backup
oben importieren. Nur den eigenen Testserver mit `--stop --port 8901` beenden.
