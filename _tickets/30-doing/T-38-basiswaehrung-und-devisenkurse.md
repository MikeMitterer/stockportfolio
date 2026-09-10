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
`rate`, `quote_time`, `fetched_at`, `cached`, `stale` und optional `source` — also die
Alterskennzeichnung, ohne die ein stiller alter Kurs jede Prozentzahl dieser App
verzerren würde. StockPortfolio ruft den Endpunkt bis heute nicht auf.

Die Wahl der Notierung ist ein eigener Vorgang. Welche Notierung eines
Papiers man bekommt, wählt man nicht pro Abfrage. StockInfo führt genau
ein aktives Listing je ISIN; Börse und Währung entscheiden sich bei der Aufnahme
über `POST /instruments/intake` mit `check_exchange` und `confirmed_listing`.
Einen `?currency=`- oder `?exchange=`-Parameter am Quote-Endpunkt gibt es nicht.

**Notierungswährung und Depot-Basiswährung sind unabhängig.** Ein CAD-Depot
kann EUR- oder USD-notierte Wertpapiere halten und deren Werte nach CAD
umrechnen. Dafür muss das benötigte Devisenpaar verfügbar sein; eine Notierung
in CAD ist keine Voraussetzung. Die Auswahl eines anderen Listings ist ein
anderer Vorgang und bleibt bei StockInfo.

## Für dich

Entschieden sind die Basiswährung je Depot und das Weiterrechnen bei
veralteten Devisenkursen mit sichtbarer Warnung. Die technische Umsetzung
wird als zusammenhängende Funktion geplant; Teilaufgaben erhalten getrennte
Prüfpunkte.

Die Umsetzung erfolgt zusammenhängend in diesem Ticket: FX-Anbindung,
Bewertung und Depotwahl brauchen dieselbe Rechengrundlage. Dafür ist keine
weitere Umfangsentscheidung erforderlich.

### Bisherige Antworten

**A · Basiswährung — Mike, 2026-09-10:** „Zu T-38 - ein Depot hat eine vom User konfigurierbare Basiswährung“.

Damit gehört die Wahl zum jeweiligen Depot. Eine einzige globale Einstellung
für alle Depots würde diesen Auftrag nicht erfüllen. Die Notierungswährung
der Wertpapiere bleibt erhalten; die Bewertung wird in die Depotwährung
umgerechnet.

**B · Veralteter Devisenkurs — Mike, 2026-09-10:** „Weiterrechnen mit sichtbarer Warnung“.

Ein verwendbarer, aber als `stale` gekennzeichneter FX-Kurs bleibt Grundlage
der Umrechnung. Die Warnung nennt betroffene Währungspaare und den Kursstand.
Ein fehlender oder ungültiger FX-Kurs ist weiterhin kein verwendbarer Kurs.

**Bedienort — Mike, 2026-09-10:** „Wählbar - allerdings frage ich mich ob das ein UI-Setting ist oder ein .env-Setting“.

Entwurfsentscheidung: UI-Einstellung am jeweiligen Depot, bei der
Depotanlage mit Vorgabe EUR. Speicherung und Export führen die Depotwährung
mit. Eine installationsweite Einstellung wäre keine Wahl je Depot.

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

Dieses Ticket ist die vollständige Arbeitsgrundlage für Umsetzung und Review.
Der historische Integrationsvorschlag ist keine zusätzliche Spezifikation.
Ausführungsentscheidungen und Nachweise werden hier ergänzt.

Status: am 2026-09-10 nach technischer Freigabe von T-39 und T-40
zur Umsetzung durch `codex` aktiviert. Repo:
StockPortfolio, betroffene Fremdschnittstelle: StockInfo. Zeitbudget noch
nicht geschätzt. Der aktive Auftrag steht ausschließlich in STATUS.

Mike, 2026-09-10: „T-37 und T-38 sind die nächsten Tickets die du abarbeiten sollst“.
Basiswährung je Depot und Umgang mit veralteten Kursen sind geklärt.

**Voraussetzung ist [T-39](T-39-identitaet-normalisieren.md).** Dort werden
Identität und Core-Pflichtfelder einschließlich Kurswährung geprüft und die
geratenen Ersatzwährungen entfernt. T-38 verwendet diese Prüfung weiter.
Der Generationsauftrag aus T-35 bleibt separat im Backlog.

**[T-40](T-40-detailanzeige-aus-feldkatalog.md) liefert zuvor die
Detailanzeige.** T-38 ergänzt die Bewertung je Depot und den FX-Abruf.
Originalkurse und Plugin-Detailbeträge behalten im gemeinsamen Cache ihre
Währung; daraus abgeleitete Depotwerte gehören zur gewählten Basiswährung.
Ein Detailbetrag von 100 USD bleibt auch in einem EUR-Depot als 100 USD
sichtbar. Beliebige Plugin-Kennzahlen werden nicht automatisch umgerechnet.

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
- Für alte StockPortfolio-Versionen wird kein Migrationspfad gebaut
  (Mike, 2026-09-10, siehe `AGENTS.md`). Einfache Übernahmen sind zulässig;
  inkompatible Depots, Einstellungen oder Tageswerte dürfen zurückgesetzt
  und neu angelegt werden. Eine Basiswährungsänderung innerhalb der neuen
  Funktion darf Beträge dennoch nicht unbemerkt umetikettieren. Eine einfache
  Neueinrichtung ist einer aufwendigen automatischen Überführung vorzuziehen.
- Umrechnungsrichtung: `GET /fx?base=USD&quote=CAD` liefert CAD je USD.
  Ein USD-Marktwert wird mit diesem Kurs multipliziert. Die originale Quote
  bleibt in USD; Summen, Bänder, Liquidität, Stückvorschläge und der
  Handelssimulator müssen denselben umgerechneten Stückpreis verwenden.
- `GBp` bezeichnet Pence und ist nicht `GBP`. Vor einem FX-Abruf ist der
  Betrag durch 100 in GBP umzusetzen; Großschreiben allein wäre falsch.
- Die Pflichtfeldprüfung einschließlich `currency` und `latest_currency`
  kommt aus T-39. T-38 ergänzt die Prüfung des FX-Vertrags und verwendet
  dieselben Kursmodelle und Mapper weiter; es entsteht keine zweite
  Kursvalidierung.
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
| 1 | `/fx` gegen eine laufende StockInfo-Instanz aufrufen | Antwort erfüllt den FX-Vertrag; `source` wird übernommen, wenn vorhanden, ist aber kein Pflichtfeld | ➖ |
| 2 | Unbekannte Zielwährung anfragen | klarer Fehlerstatus statt stiller Ersatzwährung | ➖ |
| 3 | Position in Fremdwährung im Depot | Marktwert zählt umgerechnet in die Summe; der Kurs bleibt in seiner Originalwährung sichtbar | ➖ |
| 4 | Devisenkurs mit `stale: true` | Auswirkung gemäß Entscheidung B, im UI erkennbar | ➖ |
| 5 | Dieselbe USD-Position samt Plugin-Detailbetrag in einem EUR- und einem USD-Depot bewerten | Depotwerte folgen ihrer Basiswährung; Originalkurs und Detailbetrag bleiben im gemeinsamen Cache unverändert, die Detailanzeige löst keine zusätzliche Umrechnung aus | ➖ |

Durchgehend ➖: Die Bearbeitung ist eingeplant; eine Umsetzung und deren
Verifikation liegen noch nicht vor.

**Doku-Abgleich · Zuschnitt vom 2026-09-10:** Reihenfolge und Abhängigkeiten
mit T-39, T-40, T-35, STATUS, Boardübersicht, README und Integrationsvorschlag
abgeglichen. Gemeinsame Kursprüfung liegt bei T-39, reine Detailanzeige bei
T-40, Depotbewertung und FX hier. Die Funktion ist noch nicht verfügbar.

```bash
curl -s "http://localhost:8000/fx?base=EUR&quote=USD"                                    # #1 Erfolgsfall
curl -s -o /dev/null -w "%{http_code}\n" "http://localhost:8000/fx?base=EUR&quote=ZZZ"   # #2 unbekannte Währung
```

### Ausführungsentscheidungen und Plan · Codex · 2026-09-10

Die technische Grundlage T-39/T-40 ist unabhängig freigegeben. Dieses Ticket
bleibt die einzige vollständige Spezifikation; es entsteht kein paralleler Plan.

1. **Depotwahl und Beträge:** `baseCurrency` wird beim Anlegen im UI gewählt,
   Vorgabe EUR, Auswahl gültiger ISO-Währungen einschließlich USD/CAD. Keine
   Standorterkennung und keine Installationseinstellung. Cash ist ein Betrag
   dieser Währung. Die Währung darf nur bei einem leeren Depot ohne Cashbetrag,
   Betragsgrenzen oder Tageswerte geändert werden; sonst zeigt die UI die
   Neueinrichtung eines Depots als Weg. Keine automatische Umbuchung.
   Sicherheitspuffer und Mindesthandelsbetrag werden je Depot gespeichert.
   Bestehende EUR-Depots können die bisher globalen Werte direkt übernehmen;
   daraus entsteht keine allgemeine Datenmigration.
2. **FX-Vertrag:** Clientmethode für `GET /fx?base=...&quote=...`, gemeinsame
   Normalisierer-Hilfen für endliche positive Zahl, ISO-Währungen, vollständige
   Zeitpunkte und boolesche Cacheflags. Antwortpaar muss dem angefragten Paar
   entsprechen; `source` ist optional. Kein erratener Kurs, kein automatisches
   Invertieren einer falschen Antwort. Gleiches Währungspaar braucht keinen
   Abruf. GBp wird zuerst durch 100 in GBP umgerechnet.
3. **Sitzung und Aktualisierung:** Ein FX-Store hält Werte je gerichtetes Paar
   und API-Adresse. Nur tatsächlich benötigte Paare laden, parallele Abrufe
   teilen. Nach Quote-Refresh und beim Depotwechsel prüfen; eine explizite
   Wiederholung ist möglich. Bei fehlgeschlagenem Abruf darf ein zuvor gültiger
   Wert nur als veraltet weiterverwendet werden. Neue Adresse verwirft alte
   Werte; verspätete Antworten überschreiben sie nicht. Keine FX-Werte in
   Nutzersicherungen; StockInfo besitzt bereits den dauerhaften FX-Cache.
4. **Gemeinsame Bewertung:** Originalquote und Pluginbeträge unverändert
   erhalten. Eine reine Funktion liefert den umgerechneten Stückpreis und
   Marktwert. Summen, Gruppen, Liquidität, Bänder, Stückvorschläge und
   Handelssimulator verwenden genau diese Werte. Fehlendes/ungültiges FX
   schließt die Position sichtbar aus allen abgeleiteten Rechnungen aus.
   Ein verwendeter veralteter Kurs bleibt mit Paar und Kursstand dauerhaft
   sichtbar gewarnt, unabhängig vom Ausblenden anderer Meldungen.
5. **Oberfläche:** Alle Depotbeträge und Achsen verwenden die aktive
   Basiswährung. Originalkurse behalten ihre Währung; zusätzlich ist die
   Umrechnung nachvollziehbar. Depotverwaltung und Sicherungsübersicht nennen
   die Währung. Betragsgrenzen werden in der aktiven Depotwährung eingegeben.
6. **Tageswerte und Rückblick:** Neue Tageswerte führen ihre Währung mit;
   Laden/Import mischt keine Währungen. Unvollständige Bewertungen werden nicht
   als vollständiger Tageswert gespeichert. Tageswerte ohne Währungsangabe
   werden verworfen. Der Rückblick wird bei benötigtem historischen FX mit
   sichtbarer Erklärung ausgelassen; aktuelle FX-Werte ersetzen keine
   historischen Kurse. GBp→GBP ist lediglich die konstante Einheitenskalierung.
7. **Prüfung:** Rote Tests für Richtung, EUR/USD/CAD, GBp, identische Währung,
   falsches Paar, fehlende Pflichtfelder, 0/negative/ungültige Raten, veralteten
   Rückfall, Adress- und Depotwechsel. Rechnungs- und Handelstests müssen
   denselben Stückpreis beweisen. Persistenz/Backup prüfen Depotwährung,
   Betragsgrenzen und getrennte Tageswerte. Erste Browserprüfung durch Codex
   mit dem vorhandenen echten StockInfo-Testserver und kontrollierter FX-Quelle.
   Abschließend isolierte eigene Fassung: `make test`, `make lint`,
   `make typecheck`, Bezeichnerinventar und unabhängiger Review durch Claude.

- [ ] Depotdaten und FX-Vertrag mit roten Gegenproben
- [ ] Gemeinsame Umrechnung, Store und Rechenwege
- [ ] UI, Sicherung und währungsgetrennte Tageswerte
- [ ] Sichtprüfung, isolierte Gesamtprüfung und Reviewübergabe
