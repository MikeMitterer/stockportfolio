# T-38 · Basiswährung außer EUR — StockInfo liefert inzwischen Devisenkurse

StockPortfolio soll **Depots in ihrer jeweils konfigurierten Basiswährung
richtig berechnen**. Jedes Depot hat eine eigene, vom Nutzer wählbare
Basiswährung (Mike, 2026-09-10).

Heute ist Euro fest verdrahtet: Die App summiert Marktwerte und leitet daraus
Anteile, Bänder und Handelsvorschläge ab. Diese Summe stimmt nur, wenn alle
Beträge dieselbe Währung haben — 10.000 USD plus 10.000 EUR ergibt keine 20.000
von irgendetwas.

Fremd notierte Positionen bleiben deshalb seit [T-22](../40-done/T-22-currency.md)
sichtbar, zählen aber in keine Summe. Das war die ehrliche Antwort, solange der
Dienst nichts anderes anbot.

Beispiel: Ein Kanadier hält ein CAD-notiertes Papier an der TSX. Die App zeigt
es an und nimmt es aus jeder Summe — seine Prozentanteile beziehen sich damit
auf ein Depot, das kleiner ist als seines.

## Was sich geändert hat

**StockInfo hat den Devisenkurs gebaut.** `GET /fx?base=EUR&quote=USD` liefert
`rate`, `quote_time`, `fetched_at`, `cached`, `stale` und `source` — also die
Alterskennzeichnung, ohne die ein stiller alter Kurs jede Prozentzahl dieser App
verzerren würde. StockPortfolio ruft den Endpunkt bis heute nicht auf.

Die zweite Hälfte des Problems ist damit **nicht** gelöst: Welche Notierung
eines Papiers man bekommt, wählt man nicht pro Abfrage. StockInfo führt genau
ein aktives Listing je ISIN; Börse und Währung entscheiden sich bei der Aufnahme
über `POST /instruments/intake` mit `check_exchange` und `confirmed_listing`.
Einen `?currency=`- oder `?exchange=`-Parameter am Quote-Endpunkt gibt es nicht.

**Notierungswährung und Depot-Basiswährung sind unabhängig.** Ein CAD-Depot
kann EUR- oder USD-notierte Wertpapiere halten und deren Werte nach CAD
umrechnen. Dafür muss das benötigte Devisenpaar verfügbar sein; eine Notierung
in CAD ist keine Voraussetzung. Die Auswahl eines anderen Listings ist ein
anderer Vorgang und bleibt bei StockInfo.

## Für dich

Die Basiswährung je Depot ist entschieden. Offen sind der Umgang mit
veralteten Devisenkursen und der Zuschnitt der Umsetzung. Dafür ist noch kein
manueller Test nötig.

| Frage | Deine Entscheidung |
|---|---|
| B · Wie soll ein veralteter Devisenkurs (`stale: true`) wirken — Summe mit sichtbarer Warnung, oder Position wie heute ausschließen? | |
| C · Groß genug zum Aufteilen? Naheliegender Schnitt: (1) `/fx` anbinden und umrechnen, (2) Basiswährung konfigurierbar machen. | |

### Bisherige Antworten

**A · Basiswährung — Mike, 2026-09-10:** „Zu T-38 - ein Depot hat eine vom User konfigurierbare Basiswährung“.

Damit gehört die Wahl zum jeweiligen Depot. Eine einzige globale Einstellung
für alle Depots würde diesen Auftrag nicht erfüllen. Die Notierungswährung
der Wertpapiere bleibt erhalten; die Bewertung wird in die Depotwährung
umgerechnet.

**Präzisierung — Mike, 2026-09-10:** „Annahme für die Währung ist, dass ein User aus Europa als Basiswährung EUR wählt und ein User aus den USA USD - du kannst du Annahmen nochmal gegenprüfen“.

Gegenprüfung: Als Produktannahme ist die Wahl der heimischen Währung
plausibel. Für EUR ist der Euroraum die genaue geografische Bezeichnung;
beispielsweise Polen, Schweden und Dänemark gehören laut
[EZB](https://www.ecb.europa.eu/euro/intro/html/index.en.html) nicht dazu.
Die Quellenlage bestätigt die Währungsräume; sie ist keine Erhebung der
persönlichen Depotpräferenzen. Maßgeblich bleibt die ausdrückliche Wahl.

Der Entwurf konzentriert sich auf das Depot mit gewählter Basiswährung:
EUR für den typischen Nutzer im Euroraum, USD für den typischen Nutzer in
den USA. Fremd notierte Positionen werden in diese Währung umgerechnet.
Automatische Standorterkennung und eine zusätzliche Historie häufiger
Basiswährungswechsel sind daraus nicht beauftragt. Anforderungen an die
Unversehrtheit vorhandener Beträge gelten für einen angebotenen Wechsel
weiterhin; sie rechtfertigen keinen pauschalen Ausbau der Datenmigration.

## Umsetzung und technische Nachweise

Status: am 2026-09-10 nach T-37 eingeplant. Repo: StockPortfolio, betroffene
Fremdschnittstelle: StockInfo. Zeitbudget noch nicht geschätzt.

Mike, 2026-09-10: „T-37 und T-38 sind die nächsten Tickets die du abarbeiten sollst“.
Die Basiswährung je Depot ist geklärt; die Antwort zu veralteten Kursen steht aus.

**Hängt an [T-35](../10-backlog/T-35-stockinfo-generation-und-waehrung.md).** Solange eine
fehlende Kurswährung als EUR geraten wird, kann keine Umrechnung stimmen; T-35
entfernt diesen Ersatzwert.

### Vorliegende Befunde

- `GET /fx` ist im StockInfo-Vertrag beschrieben (`contract/core-contract.json`,
  Abschnitte `endpoints.fx` und `core.fx`) und in `app/routers/fx.py`
  implementiert; Query-Parameter `base` und `quote`. Gegen eine laufende Instanz
  wurde das hier nicht geprüft.
- In `src/` gibt es keinen Aufruf von `/fx`. Der API-Client kennt den Endpunkt
  nicht.
- Die Ausgabe ist bereits währungsfähig: `money(value, currency)` in
  `src/domain/formatters.ts` formatiert jeden ISO-Code. Fest auf Euro steht der
  Rest der Rechnung, nicht die Anzeige.
- Die frühere Anfrage `docs/stockinfo-currency-request.md` (Stand 2026-08-11,
  angelegt mit Commit `84cc208`) ist überholt und wurde entfernt: Ihre Stufe 2
  ist gebaut, Stufe 1 anders gelöst, Stufe 3 blieb bewusst weg. Nachlesbar in
  der Git-Historie.

### Technische Abgrenzung nach der Depot-Entscheidung

Vorprüfung vom 2026-09-10, noch keine Umsetzung:

- `Portfolio` benötigt die Basiswährung als eigenes Feld; `Settings.currency`
  ist heute global und fest auf EUR typisiert. Depotanlage, Depotwechsel,
  Persistenz sowie Export/Import müssen die neue Angabe erhalten.
- Die bisherigen Depots und gespeicherten Beträge waren EUR. Ein Wechsel der
  Basiswährung darf bestehendes Cash, absolute Grenzbeträge und Tageswerte
  nicht bloß mit einem anderen Währungssymbol versehen. Ihre Ursprungswährung
  muss bekannt bleiben oder beim ausdrücklich ausgeführten Wechsel korrekt
  umgerechnet werden. Die konkrete Bedienung wird im Entwurf festgelegt.
- Umrechnungsrichtung: `GET /fx?base=USD&quote=CAD` liefert CAD je USD.
  Ein USD-Marktwert wird mit diesem Kurs multipliziert. Die originale Quote
  bleibt in USD; Summen, Bänder, Liquidität, Stückvorschläge und der
  Handelssimulator müssen denselben umgerechneten Stückpreis verwenden.
- `GBp` bezeichnet Pence und ist nicht `GBP`. Vor einem FX-Abruf ist der
  Betrag durch 100 in GBP umzusetzen; Großschreiben allein wäre falsch.
- Fehlende Kurswährung wird an der API-Grenze abgelehnt. Beim Katalog ist
  `latest_currency` maßgeblich; `instrument.currency` ist kein Ersatz dafür.
  Dies ist der notwendige Währungsanteil aus T-35, nicht dessen gesamter
  Generationsauftrag.
- `ValueSnapshot` und `ValueSnapshotEntry` speichern bisher keine Währung.
  Tageswerte verschiedener Basiswährungen dürfen nicht in einer Linie
  zusammengerechnet werden. Der historische Rückblick benötigt außerdem
  historische FX-Werte für eine echte Umrechnung vergangener Tage; der hier
  geprüfte `/fx`-Vertrag liefert nur einen aktuellen beziehungsweise alten
  gecachten Kurs. Heutige FX-Werte dürfen nicht als historische ausgegeben
  werden.

Betroffene Einstiegspunkte: `src/types/portfolio.ts`, `src/stores/portfolio.ts`,
`src/stores/settings.ts`, `src/domain/rebalancing.ts`, `src/domain/tradePlan.ts`,
`src/domain/portfolioHistory.ts`, `src/domain/backup.ts`, `src/db/schema.ts`,
`src/db/repository.ts`, API-Client, Dashboard, Rebalancing und Depotverwaltung.

### Verify-Matrix

Legende: ✅ live bestätigt · ⚠️ mit Einschränkung · ◑ teilweise · ➖ keine Live-Verifikation.

| # | Handgriff | Nachweis | AI |
|---|---|---|---|
| 1 | `/fx` gegen eine laufende StockInfo-Instanz aufrufen | Antwort enthält `rate`, `quote_time`, `stale` und `source` | ➖ |
| 2 | Unbekannte Zielwährung anfragen | klarer Fehlerstatus statt stiller Ersatzwährung | ➖ |
| 3 | Position in Fremdwährung im Depot | Marktwert zählt umgerechnet in die Summe; der Kurs bleibt in seiner Originalwährung sichtbar | ➖ |
| 4 | Devisenkurs mit `stale: true` | Auswirkung gemäß Entscheidung B, im UI erkennbar | ➖ |

Durchgehend ➖: Die Bearbeitung ist eingeplant; eine Umsetzung und deren
Verifikation liegen noch nicht vor.

```bash
curl -s "http://localhost:8000/fx?base=EUR&quote=USD"                                    # #1 Erfolgsfall
curl -s -o /dev/null -w "%{http_code}\n" "http://localhost:8000/fx?base=EUR&quote=ZZZ"   # #2 unbekannte Währung
```
