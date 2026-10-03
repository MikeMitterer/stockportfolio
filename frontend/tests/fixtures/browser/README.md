# Wiederverwendbares Browser-Testdepot

[`valid-portfolio.backup.json`](valid-portfolio.backup.json) ist ein reguläres
StockPortfolio-Backup. Es enthält fünf Positionen mit zusammen 100 % Ziel:
MSCI World ETF (EUNL.DE), US Total Market ETF (VTI), Apple (AAPL), eine Bundesanleihe
(DE0001135275) und 500 EUR Cash. Alle vier Wertpapiere haben im lokalen
StockInfo-Testserver einen gültigen Kurs. Die Kurse selbst stehen nicht im
Backup und werden beim Öffnen frisch geladen.

1. Den Teststack vom StockPortfolio-Repo aus starten. Er startet den
   StockInfo-Testdienst, die Konto-API und Vite; der Browser fragt StockInfo
   über die Konto-API ab:

   ```bash
   .venv/bin/python scripts/stockinfo-test-server.py --stack --run \
     --stockinfo-root ../StockInfo --demo-accounts \
     --detail-fixtures frontend/tests/fixtures/stockinfo --demo-details
   ```

2. In einem frischen Browserkontext `http://127.0.0.1:5175/` öffnen und mit
   einem Konto aus der gemeldeten `demo-accounts.json` anmelden.

3. Unter **Einstellungen → Backup → Backup einspielen** die JSON-Datei wählen
   und das Ersetzen bestätigen. Der Import ersetzt das aktive Depot dieses
   Kontos.

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

Den Teststack mit demselben Skript und `--stack --stop` beenden.

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

Der Container fragt StockInfo selbst ab, nicht der Browser. `127.0.0.1` wäre
im Container der Container selbst; der Testdienst auf dem Mac ist dort unter
`host.docker.internal` erreichbar. Mit dem laufenden Teststack erhält der
Container `STOCKINFO_API_URL=http://host.docker.internal:8899`,
`STOCKPORTFOLIO_PUBLIC_ORIGIN=http://127.0.0.1:18091` und die Portzuordnung
`127.0.0.1:18091:8080`. So laufen Vite-Probe und Container-Probe nebeneinander
mit getrennten Konten. Den Setup-Code nennt `docker logs`; danach dasselbe
Backup oben importieren und den Container wieder entfernen.
