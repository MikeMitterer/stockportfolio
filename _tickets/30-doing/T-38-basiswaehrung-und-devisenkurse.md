# T-38 · Basiswährung außer EUR — StockInfo liefert inzwischen Devisenkurse

StockPortfolio soll **Depots in ihrer jeweils konfigurierten Basiswährung
richtig berechnen**. Jedes Depot hat eine eigene, vom Nutzer wählbare
Basiswährung (Mike, 2026-09-10).

**Umgesetzt durch Codex am 2026-09-10; unabhängiger Review und menschliche
Abschlussabnahme stehen noch aus.** Nach Mikes Korrektur im Review bietet die UI
den bestätigten Währungswechsel auch bei bestehenden Depots an. Cash und
absolute Geldschwellen werden umgerechnet; Wertpapierstückzahlen bleiben gleich.
Fremd notierte Positionen werden über StockInfo-FX umgerechnet. Ein brauchbarer
veralteter Kurs bleibt mit dauerhafter Warnung verwendbar; fehlt ein gültiger
Kurs, wird die Position aus Bewertung und Handelsvorschlägen ausgeschlossen.

Ausgangsproblem: Seit T-22 blieben fremd notierte Positionen zwar sichtbar,
zählten aber nicht in Summen. Ein CAD-Depot mit USD-Papieren wurde dadurch
unvollständig bewertet. Die neue Bewertung erhält Originalkurse und verwendet
für alle Depotbeträge denselben umgerechneten Stückpreis.

## Was sich geändert hat

**StockInfo hat den Devisenkurs gebaut.** `GET /fx?base=EUR&quote=USD` liefert
`rate`, `quote_time`, `fetched_at`, `cached`, `stale` und optional `source` — also die
Alterskennzeichnung, ohne die ein stiller alter Kurs jede Prozentzahl dieser App
verzerren würde. StockPortfolio verwendet diesen Endpunkt jetzt für benötigte Währungspaare.

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
veralteten Devisenkursen mit sichtbarer Warnung. Die zusammenhängende Funktion
ist umgesetzt; die Prüfpunkte und Belege stehen unten.

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

Status: am 2026-09-10 nach technischer Freigabe von T-39 und T-40 durch
`codex` umgesetzt und selbst geprüft. Repo: StockPortfolio, Fremdschnittstelle:
StockInfo. Der aktive Owner und die Reviewfassung stehen ausschließlich in STATUS.

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

### Ausgangsbefunde vor der Umsetzung

- `GET /fx` ist im StockInfo-Vertrag beschrieben (`contract/core-contract.json`,
  Abschnitte `endpoints.fx` und `core.fx`) und in `app/routers/fx.py`
  implementiert; Query-Parameter `base` und `quote`. Die spätere Live-Prüfung steht unten; zum Zeitpunkt dieser Vorprüfung
  lag sie noch nicht vor.
- Vor Beginn gab es in `src/` keinen `/fx`-Aufruf.
- Die Ausgabe ist bereits währungsfähig: `money(value, currency)` in
  `src/domain/formatters.ts` formatiert jeden ISO-Code. Fest auf Euro steht der
  Rest der Rechnung, nicht die Anzeige.
- Die frühere Anfrage `docs/stockinfo-currency-request.md` (Stand 2026-08-11,
  angelegt mit Commit `84cc208`) ist überholt und wurde entfernt: Ihre Stufe 2
  ist gebaut, Stufe 1 anders gelöst, Stufe 3 blieb bewusst weg. Nachlesbar in
  der Git-Historie.

### Technische Abgrenzung nach der Depot-Entscheidung (Vorprüfung)

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
| 1 | `/fx` gegen eine laufende StockInfo-Instanz aufrufen | Antwort erfüllt den FX-Vertrag; `source` wird übernommen, wenn vorhanden, ist aber kein Pflichtfeld | ✅ |
| 2 | Unbekannte Zielwährung anfragen | klarer Fehlerstatus statt stiller Ersatzwährung | ✅ |
| 3 | Position in Fremdwährung im Depot | Marktwert zählt umgerechnet in die Summe; der Kurs bleibt in seiner Originalwährung sichtbar | ✅ |
| 4 | Devisenkurs mit `stale: true` | Auswirkung gemäß Entscheidung B, im UI erkennbar | ✅ |
| 5 | Dieselbe USD-Position samt Plugin-Detailbetrag in einem EUR- und einem USD-Depot bewerten | Depotwerte folgen ihrer Basiswährung; Originalkurs und Detailbetrag bleiben im gemeinsamen Cache unverändert, die Detailanzeige löst keine zusätzliche Umrechnung aus | ✅ |

Alle fünf Punkte wurden von Codex an der laufenden Testinstanz geprüft.
Die Kurse stammen aus einer kontrollierten lokalen Quelle, nicht aus einem
externen Devisenprovider. Details und zusätzliche UI-Fälle stehen unten.

**Doku-Abgleich · Zuschnitt vom 2026-09-10:** Reihenfolge und Abhängigkeiten
mit T-39, T-40, T-35, STATUS, Boardübersicht und README abgeglichen. Gemeinsame Kursprüfung liegt bei T-39, reine Detailanzeige bei
T-40, Depotbewertung und FX hier. Die Umsetzung und ihre Nachweise sind unten ergänzt.

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
   dieser Währung. **Aktualisierte Entscheidung nach Review 1:** Die Währung
   darf auch bei bestehenden Depots gewechselt werden. Ein Bestätigungsdialog
   nennt Umrechnung und Kursstand. Cash und absolute Grenzen werden mit einem
   gültigen Kurs umgerechnet; Stückzahlen und Prozentgrenzen bleiben erhalten.
   Fehlt der benötigte Kurs, wird keine Änderung gespeichert.
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

- [x] Depotdaten und FX-Vertrag mit roten Gegenproben
- [x] Gemeinsame Umrechnung, Store und Rechenwege
- [x] UI, Sicherung und währungsgetrennte Tageswerte
- [x] Sichtprüfung, isolierte Gesamtprüfung und Reviewübergabe


### Umsetzung · Runde 1 · Codex · 2026-09-10

- `Portfolio.baseCurrency` und `amountSettings` gehören zum Depot. Neue Depots
  haben EUR als UI-Vorgabe, keine Geldschwellen und eine leere Cashzeile. Bereits
  vorhandene EUR-Depots übernehmen passende Einstellungen direkt. Es gibt keine
  allgemeine Migration; der alte numerische `saveAssetGrenze`-Sonderweg entfällt.
- `normalizeFx` prüft das angefragte gerichtete Währungspaar, positive endliche
  Rate, vollständige Zeitpunkte und Cacheflags. Der Store teilt parallele
  Anfragen, trennt API-Adressen und verwirft verspätete alte Antworten. Bei einem
  Fehler wird nur ein bereits geprüfter Kurs als veraltet weiterverwendet.
- `convertedPrice` erhält den Originalkurs und liefert den Depotpreis. Dieser
  trägt Positionen, Gruppen, Gesamtwert, Liquidität, Bänder, Stückvorschläge und
  Handelssimulator. GBp wird vor GBP-FX durch 100 geteilt. Originale Pluginbeträge
  aus T-40 bleiben unverändert.
- `usePortfolioValuation` verbindet Dashboard, Rebalancing und Einstellungen mit
  demselben Rechenweg. `FxNotice` zeigt benötigte fehlende/veraltete Paare dauerhaft,
  samt Kursstand und Wiederholung. Depotbeträge und Wertdiagramm folgen der
  gewählten Währung; originale Aktienkurse bleiben separat erkennbar.
- Snapshot-Datensätze führen ihre Währung mit. Unpassende oder unbeschriftete
  alte Werte werden beim Laden/Import verworfen; unvollständige Bewertungen
  überschreiben keinen bestehenden Tageswert. Historische FX-Backtests werden
  mangels historischer Devisenkurse mit Erklärung ausgelassen. Die konstante
  GBp→GBP-Skalierung ist auch für die Preishistorie zulässig.
- Backupformat 3 erhält Depotwährung und Geldschwellen. Fehlerhafte vorhandene
  Geldschwellen werden abgelehnt, statt sie still durch null zu ersetzen.

### Eigene UI-Prüfung · Runde 1 · Codex · 2026-09-10

Mike: „T-38 natürlich auch UI-Tests von dir“. Die folgenden Handgriffe wurden
von Codex selbst im isolierten Chrome-Kontext `stockportfolio-t39` ausgeführt.
Vite: `http://127.0.0.1:5189`; StockInfo: `http://127.0.0.1:8899`.
Es wurden nur selbst angelegte Testdepots verwendet. Die Testdatenbank des
Servers entstand beim Start neu; der Browserkontext wurde aus T-39/T-40
weiterverwendet, also kein behaupteter kompletter Browser-Frischstart.

StockInfos tatsächliche FastAPI-Routen, `CachedFxService`, QuoteService und
SQLite-Repository laufen mit kontrollierten lokalen Quellen. Der bestehende
[T-39-Testserver](../../scripts/stockinfo-test-server.py) wurde um `LocalFx` erweitert:
USD/EUR = 0,8; EUR/USD = 1,25; GBP/EUR = 1,2. Fehlerantworten werden ausdrücklich
als Testfälle eingespeist. StockInfo-Produktdateien wurden nicht verändert.

| Handgriff | Beobachtetes Ergebnis |
|---|---|
| USD-Depot über Einstellungen → Daten anlegen | `T38 USA USD` mit USD angelegt, neue Betragsgrenzen 0; EUR-Depot bleibt separat erhalten. |
| VTI mit 10 Stück und EUNL mit 10 Stück über den Assetdialog hinzufügen | Im USD-Depot VTI 292,40 USD → 2.924 USD; EUNL 129,70 EUR × 1,25 → 162,125 USD/Stück und 1.621,25 USD Marktwert. Originalkurs bleibt EUR. |
| Zum EUR-Depot wechseln | VTI mit 2 Stück → 467,84 EUR; PEN.L mit 2 × 1.234,5 GBp → 29,628 EUR. Originalkurse USD/GBp bleiben erhalten. |
| Dieselbe VTI-Quote mit Detailbetrag im EUR-/USD-Depot betrachten | Originalquote und `risk-a.amount = 100 USD` bleiben unverändert; nur die Depotbewertung wechselt. |
| `fx-stale`, dann Aktualisieren | EUR/USD wird mit Datum 01.09.2026 12:00 als veraltet gewarnt; EUNL bleibt aktiv und mit 1.621,25 USD bewertet. |
| `fx-missing`, Wiederholung bei vorhandenem Kurs | Zuletzt gültiger Kurs bleibt als veraltet verwendbar und sichtbar gewarnt. |
| Seite bei `fx-missing` neu laden, Sitzungskurs fehlt | EUNL bleibt sichtbar, ist mit fehlendem FX ausgeschlossen; VTI zählt weiter. Datenstatus unvollständig; EUNL fehlt in Handelsvorschlägen. |
| Ungültige Rate 0 ohne früheren Sitzungskurs | Keine Ersatzrate und kein Trade für EUNL; weiterhin ausgeschlossen. |
| Fehlendes FX bei vorhandenem vollständigem Tageswert | Der USD-Tageswert 5.000 USD bleibt erhalten; der unvollständige Zwischenwert ersetzt ihn nicht. IDB-Prüfung bestätigt getrennten EUR-Tageswert. |
| `normal`, FX wiederholen; im Handel 2 EUNL-Stück eingeben | Stückpreis intern 162,125 USD; Ausgabe 324,25 USD und Cashflow −324,25 USD. UI zeigt den auf zwei Stellen gerundeten Stückpreis 162,13 USD. |
| Leeres CAD-Depot anlegen und UI-Währung auf GBP ändern | GBP bleibt nach Neuladen erhalten. USD-/EUR-Depots mit Beständen bieten keinen Währungswechsel an. |
| USD-Mindesthandelsbetrag auf 20 setzen | Feld nennt USD; 20 USD bleiben je Depot erhalten. EUR-/GBP-Depots behalten Grenze 0. |
| USD-Sicherung herunterladen und wieder einspielen | Die tatsächliche Download-Blob enthält Schema 3, USD, 20 USD Mindesthandel und USD-Tageswert. Vorschau zeigt USD; Bestätigen und Neuladen erhalten diese Daten. |
| Wertdiagramm öffnen | Achsen zeigen USD; gemessener Tageswert vorhanden, kein erfundener historischer FX-Rückblick. |
| Desktop 1440×1000 und schmal 500×1000 ansehen, DE/EN wechseln | Warnung, Werte und Depotwahl lesbar. Ein bei der Prüfung gefundener Überlauf der Depotverwaltung wurde behoben und erneut per Screenshot geprüft. |
| `/fx?base=EUR&quote=ZZZ` anfragen | HTTP 404 mit `fx_pair_not_found`, keine Ersatzwährung. |

Die Backup-Datei wurde über den echten Downloadknopf erzeugt. Für den Import
wurde diese Datei per `DataTransfer` an das Dateiinput übergeben; Vorschau und
Bestätigungsdialog liefen normal. Betragseingaben erfolgten über die UI;
zusätzliche DOM-/Komponenten- und IndexedDB-Leseprüfungen belegten ungerundete
Rechenwerte. Screenshots wurden direkt angesehen, nicht als Dateien abgelegt.
Der Browserlauf verwendete den gemeinsamen Arbeitsbaum; die anschließenden
Gesamtprüfungen liefen ausschließlich auf der isolierten eigenen Fassung.

**Testserver starten** (aus StockPortfolio, vorhandene StockInfo-Umgebung):

```bash
/Volumes/DevLocal/DevWeb/Production/StockInfo/.venv/bin/python \
  scripts/stockinfo-test-server.py \
  --stockinfo-root /Volumes/DevLocal/DevWeb/Production/StockInfo \
  --detail-fixtures tests/fixtures/stockinfo --port 8899
```

`POST /__test/scenario` mit `{"mode":"fx-stale"}`, `fx-missing`, `fx-invalid`
oder `normal` steuert die FX-Fälle. Diese Route gehört ausschließlich zum
lokalen Testharness. Nach der Prüfung wurde `normal` wiederhergestellt.

### Automatische Prüfung und Doku-Abgleich

- Rote Gegenproben für FX-Vertrag, Store, Depotwährung, Tageswerte und ungültige
  Backup-Geldschwellen wurden vor der jeweiligen Korrektur ausgeführt.
- Die isolierte eigene Fassung besteht aus HEAD plus ausschließlich vorgemerkten
  T-38-Änderungen. Fremde Health-/Meldungsänderungen und Lessons-Dateien sind
  ausgeschlossen; die beiden gemeinsam bearbeiteten Views sind hunkweise getrennt.
- `VITE_STOCKINFO_API_URL=https://contract.test make test`: **52 Dateien,
  711 Tests erfolgreich**. Die öffentliche Testadresse erfüllt die bestehende
  Build-URL-Gegenprobe; kein Testzugriff auf einen externen Provider.
- `make lint`, `make typecheck` und `git diff --cached --check`: erfolgreich.
- **163 Produkt-, Test- und Konfigurationsdateien** der geprüften Kopie byteweise
  mit dem Git-Index verglichen: keine Abweichung. Kopie:
  `/var/folders/1g/t8rp3mj157z2kfc6ch_t3nw40000gn/T/stockportfolio-t38-review-bd85c34v`.
  Logs: `/tmp/stockportfolio-t38-isolated-{test,lint,typecheck}.log`.
- Bezeichnerinventar per TypeScript-Compiler-API für **50 berührte TS-/Vue-Dateien**
  und Python-AST für den Testserver. Vorgefundene deutsche lokale Namen in
  ohnehin berührten Dateien wurden übersetzt; keine deutsche Bezeichneraltlast
  im geprüften Inventar. Fachliche Währungskürzel und bestehende Themennamen bleiben.
- Gemeinsamer Arbeitsbaum vor der abschließenden Bezeichnerbereinigung:
  53 Dateien/719 Tests erfolgreich. Das ist Zusatzbeleg, keine Ersatzprüfung
  der eigenen Fassung; die Differenz stammt aus fremden Änderungen.

**Doku-Abgleich:** README beschreibt unter „Portfolio base currency“ die
Bedienung, Umrechnung, Warnung und Historiengrenze; alte „One currency“- und
Nicht-verfügbar-Aussagen sind entfernt. Boardübersicht und STATUS werden mit
der Übergabe nachgezogen. Der Designentwurf vom 06.08. ist als damalige
0.1.0-Fassung gekennzeichnet; T-39/T-40-Pläne bleiben historische Nachweise.
Das historische Integrationspapier wurde für T-38 weder gelesen noch geändert.
Unraid-Konfiguration bleibt passend, da die Basiswährung eine Depotentscheidung
im Browser ist und keine Containeroption. Methodentexte in DE/EN sind aktualisiert.

**Lessons angewandt:** „Entscheidungen in allen aktuellen Aussagen nachziehen“
über den vorstehenden Doku-Abgleich; SI-CX-01 über frische fake-indexeddb-Tests,
neu gestartete Serverdatenbank und ausdrücklich benannte Browser-Vorbereitung;
SI-R-02 über einfache EUR-Übernahme ohne allgemeine Migration. Die technische
Freigabe wird ausschließlich beim zugeordneten Verifier `claude` angefragt.

**Grenzen der Runde 1:** Kein Live-Devisenprovider geprüft; deterministische
Testkurse. Kein historischer FX-Endpunkt verfügbar. Die damalige Beschränkung
auf leere Depots wurde im anschließenden Review verworfen und in Runde 2 entfernt.
Die eigene UI-Prüfung ersetzt nicht Mikes Abschlussabnahme.


### Übergabe · Runde 1

- **Coder:** `codex`; **Verifier:** `claude`.
- **Produktfassung:** `674b3705c07220c19613c5a88b1a02d3512d0699`.
- **Prüfauftrag:** Depotwahl und Schutz bestehender Beträge, FX-Vertrag und
  Richtung einschließlich GBp, gemeinsamer Stückpreis in allen Rechenwegen,
  sichtbare Stale-/Fehlkursbehandlung, Snapshot-/Backup-Währungszuordnung.
- **Nachweise:** Eigene UI-Matrix oben; isoliert 52 Dateien/711 Tests, Lint und
  Typecheck erfolgreich. Keine fremden Produktänderungen Bestandteil der Fassung.
- **Offen:** unabhängiger Review dieser Fassung und Mikes Abschlussabnahme.
  T-39/T-40 sind technisch freigegeben, ihre menschlichen Abnahmen bleiben offen.

### Gemeinsame Ablage des Testservers · Entscheidung nach Übergabe

Mike, 2026-09-10 im Observer-Chat: „Ich teile deine Einschätzung zur gemeinsamen
Ablage. Dieses Script werden wir noch öfter benötigen“.

Der StockInfo-Testserver wird bereits von T-39, T-40 und T-38 verwendet.
Sein derzeitiger Ort unter `30-doing/` bindet die gemeinsame Prüfumgebung an
das Archivieren von T-39. Als offene Nacharbeit den vorhandenen Helfer nach
`scripts/stockinfo-test-server.py` im Projekt verschieben und die aktuellen
Links und Startbefehle in allen drei Tickets auf diesen Ort umstellen.
Keine zweite Scriptkopie anlegen; historische Prüffassungen bleiben erhalten.

Der zuständige Coder führt die Verschiebung nach Verarbeitung des laufenden
Reviews durch und belegt, dass die bisherigen Detail- und FX-Szenarien vom
neuen Ort starten. Dabei alle Verweise auf den bisherigen Pfad inventarisieren
und aktuelle Benutzungsanweisungen korrigieren. Dieser Nachtrag ändert weder
die übergebene Produktfassung noch den bestehenden Prüfauftrag. Umsetzung und Nachweis sind unten bei Runde 2 ergänzt.

### Review Runde 1 · Verifier `claude` · 2026-09-10

Geprüfte Fassung `674b3705c07220c19613c5a88b1a02d3512d0699` gegen `a1da528`.
**Urteil: `changes_requested`.** Ein blockierender Punkt, und der liegt nicht
an der Umsetzung: Mike hat die im Ticket festgehaltene Entscheidung zur
gesperrten Basiswährung während dieses Reviews ausdrücklich verworfen.

Die Rechenmechanik selbst ist geprüft und stimmt. Eigene Ausfertigung des
Commits (`git archive`, nur geteilte Abhängigkeiten), `src/` und `tests/`
byteweise gleich: **52 Dateien / 711 Tests grün**, Lint und Typprüfung Exit 0 —
dieselben Zahlen wie in der Übergabe.

#### Blockierend · Die Basiswährung muss sich im laufenden Betrieb ändern lassen

Mike, 2026-09-10, während dieses Reviews:

> Das ist ein Schmarren - die Basiswährung muss sich auch im laufenden Betrieb
> ändern lassen.

Damit entfällt die Grundlage von Umsetzungsentscheidung 1 oben („Die Währung
darf nur bei einem leeren Depot … geändert werden"). Die Umsetzung folgt dieser
Entscheidung korrekt — die Entscheidung selbst gilt nicht mehr. Betroffen ist
genau eine Stelle: `src/stores/portfolio.ts:116` in `setBaseCurrency` wirft
`fx.currencyLocked`, sobald `hasAmounts(entry)` zutrifft oder ein Tageswert
aufgezeichnet ist. Dazu gehören die Meldung `fx.currencyLocked` in beiden
Sprachen und der Prüffall „USD-/EUR-Depots mit Beständen bieten keinen
Währungswechsel an".

#### Aufwandsabschätzung des Wechsels

Mike hat um eine Einschätzung gebeten, ob der Wechsel teuer wird. **Er wird es
nicht.** Zwei der drei erwarteten Problemfelder sind in dieser Fassung bereits
gelöst:

- **Wertpapiere brauchen nichts.** Sie werden bei jeder Berechnung aus dem
  unveränderten Originalkurs neu bewertet. Meine Gegenprobe zeigt dasselbe
  Papier gleichzeitig als 100 EUR im EUR-Depot und 200 USD im USD-Depot. Es
  gibt nichts zu migrieren.
- **Die Tageswerte tragen ihre Währung schon.** `record(portfolioId, total,
  currency, …)` schreibt sie mit, `load(portfolioId, currency)` filtert
  `entries.filter(entry => entry.currency === currency)`. Nach einem Wechsel
  zeigt der Verlauf also automatisch nur die Reihe der neuen Währung; die alten
  Einträge bleiben unverändert erhalten und laufen weiter, falls jemand
  zurückwechselt. Keine erfundene Historie, keine historischen Devisenkurse
  nötig — genau der Grund, warum die Sperre für Tageswerte nicht gebraucht wird.

Zu tun bleibt damit:

1. **Sperre entfernen** — `setBaseCurrency` ohne `hasAmounts`/Snapshot-Riegel,
   `fx.currencyLocked` durch einen Bestätigungstext ersetzen.
2. **Beträge umrechnen**, die in der alten Währung gespeichert sind: Cash-`units`
   sowie `securityBuffer` und `minTradeSize` im Absolutmodus. Der Kurs kommt
   aus dem vorhandenen FX-Store; fehlt er, wird der Wechsel mit klarer Meldung
   abgelehnt statt still falsch gerechnet.
3. **Bestätigung im UI**, die benennt, was umgerechnet wird und dass der
   Verlauf ab jetzt eine neue Reihe führt.
4. Prüffälle dazu; der bisherige Sperrfall wird ersetzt.

Das ist ein kleines Ticket — deutlich kleiner als T-38 selbst, weil weder
Umrechnung noch Verlauf angefasst werden müssen.

**Zur Rückfallidee, die Währung in die Umgebungsdatei zu legen:** Sie löst das
Problem nicht, sie versteckt es. Dieselben Cashbeträge und Geldschwellen stehen
nach einer geänderten Umgebungsvariable genauso in der alten Währung da — nur
ohne Dialog, ohne Kurs zur Hand und ohne dass jemand gefragt wird. Zusätzlich
fiele die Wahl je Depot weg, die in dieser Fassung bereits funktioniert und die
Mike am 2026-09-10 ausdrücklich so festgelegt hat. Empfehlung: die vier Punkte
oben umsetzen.

**Mikes Rückfallregel, 2026-09-10:**

> Bzw. wenn der Aufwand oder die Probleme die durch die Dynamik entstehen nicht
> im Verhältnis zum Benefit stehen dann muss bei Start der Applikation, wenn
> noch keine Daten erfasst sind bzw. das Depot leer ist. Sehr prominent die
> Währungsauswahl kommuniziert werden.

Nach der Abschätzung oben greift die Bedingung nicht: Der Aufwand steht sehr
wohl im Verhältnis, weil Umrechnung und Verlauf bereits tragen. Die Regel bleibt
trotzdem hier festgehalten — sollte Mike den Aufwand anders gewichten, ist die
prominente Währungswahl beim ersten Start mit leerem Depot der beschlossene
Ersatz. Unabhängig davon ist eine gut sichtbare Wahl bei der Depotanlage auch
neben dem Wechsel sinnvoll; das ist eine eigene, kleine Entscheidung und kein
Ersatz für die entfernte Sperre.

#### Geprüft und in Ordnung

Zwölf eigene Zusicherungen gegen `convertedPrice` und `computeRebalancing`,
unabhängig von den mitgelieferten Tests formuliert, alle erfüllt:

- **Die Umrechnungsrichtung folgt dem Vertrag.** `GET /fx?base=X&quote=Y`
  bedeutet „1 X = rate Y"; der Client multipliziert den Originalkurs damit.
  Ein Kurs, dessen `base`/`quote` nicht zur Anfrage passt, wird verworfen.
- **Pence werden korrekt skaliert.** `GBp` läuft über `GBP` mit Faktor 0,01:
  1.234,5 GBp bei GBP/EUR 1,2 ergeben 14,814 EUR je Stück. Das ist die Stelle,
  an der eine Währungsumrechnung typischerweise um Faktor 100 daneben liegt.
- **Unbrauchbare Kurse zählen nicht:** Rate 0, negative Rate und fehlender Kurs
  führen zum sichtbaren Ausschluss. Die Beschriftung wurde mitgezogen —
  „Devisenkurs fehlt" statt des früheren „fremde Währung".
- **Ein veralteter Kurs wird weiterverwendet**, `stale` bleibt am Ergebnis
  erhalten; `fx.stalePair` nennt Paar und Stand. Das entspricht Entscheidung B.
- **Die Depotwährung wirkt je Depot**, nicht global; Cash gilt als Betrag der
  Depotwährung; der Originalmarktwert bleibt neben dem Depotwert erhalten, es
  wird also nicht doppelt umgerechnet.
- Depots ohne Angabe gelten weiterhin als EUR-Depots.

Der FX-Store ist wie der Feldkatalog gebaut: an die API-Adresse gebunden,
Mehrfachabrufe zusammengefasst, Generationszähler gegen veraltete Antworten,
und bei einem Fehlschlag bleibt der vorherige Kurs als `stale`/`cached`
erhalten — konsistent zur Vertragsinvariante aus T-39.

#### Weitere Befunde ohne Blockierung

- **Die Commit-Sprache ist gewechselt.** `674b370`, `dcd384b`, `a1da528` und
  `97b5aba` sind englisch betitelt, `674b370` hat zusätzlich gar keinen Body —
  bei 54 Dateien. `AGENTS.md` verlangt Deutsch für Commit-Bodies, und alle
  Commits bis `2cbfbf0` waren deutsch. Ab `71a4ff8` ist die Linie gekippt.
- **Ein Kurs von 0 wird uneinheitlich behandelt.** Notiert das Papier in der
  Depotwährung, ergibt `convertedPrice` einen Wert von 0 und die Position zählt
  mit; in fremder Währung greift `price > 0` und die Position wird
  ausgeschlossen. Praktisch irrelevant, weil StockInfo keinen Nullkurs liefert,
  aber beide Wege sollten dieselbe Antwort geben.


### Nacharbeit · Runde 2 · Codex · 2026-09-10

**Review 1 verarbeitet:** Der Währungswechsel ist für bestehende Depots
freigeschaltet. Ein Dialog nennt alte/neue Währung, umzurechnende Beträge,
Kurs und Kursstand, bei veraltetem Kurs zusätzlich die Warnung. Abbrechen
verändert nichts. Cash und absolute Sicherheits-/Mindesthandelsbeträge werden
mit derselben Rate in einer gemeinsamen Depotänderung gespeichert. Stückzahlen
und Prozentgrenzen bleiben erhalten. Fehlender, unpassender oder ungültiger
Kurs verhindert die Änderung; ebenso ein nicht endliches Umrechnungsergebnis.

Die Historie war noch nicht vollständig gegen laufende Währungswechsel
abgesichert: Der bisherige Schlüssel enthielt nur Depot und Datum. Eine rote
Gegenprobe zeigte, dass USD/EUR-Tageswerte desselben Tages sich überschrieben.
Der Schlüssel enthält jetzt auch die Währung. Der Dashboard-Watcher lädt bei
Änderung der Basiswährung die passende Reihe. Sicherungen erhalten sämtliche
gekennzeichneten Währungsreihen, die Anzeige filtert weiterhin auf die aktuelle
Währung. Mehrere Einträge am selben Datum zählen in der Backup-Vorschau als
**ein Tag**. Alte unbeschriftete Werte werden weiter nicht übernommen.

Auch der nicht blockierende Nullkursbefund ist korrigiert: Ungültige
Originalpreise werden mit und ohne FX gleich ausgeschlossen. Weitere
Rechenwege bleiben auf der freigeprüften gemeinsamen Bewertung aufgebaut.

**Erneute eigene Browserprüfung, bestehende Testdepots:**

| Fall | Ergebnis |
|---|---|
| 100 USD Cash, 20 USD Mindesthandel; USD → EUR bestätigen | 80 EUR Cash, 16 EUR Mindesthandel; jeweils 10 VTI-/EUNL-Stück bleiben erhalten. Originalkurse unverändert. |
| Wechsel EUR → GBP bei `fx-missing`, ohne früheren Kurs für das Paar | Verständliche Fehlermeldung; EUR und gespeicherte Beträge bleiben erhalten. |
| Wechsel EUR → USD bei `fx-stale` vorbereiten und abbrechen | Dialog zeigt Rate 1,25, Kursdatum 01.09.2026 und Stale-Warnung. Nach Abbrechen weiterhin EUR. |
| Denselben Wechsel bestätigen | Cash wieder 100 USD, Mindesthandel 20 USD. USD-Tagesreihe sichtbar; EUR-Reihe bleibt gespeichert. |
| Dialog bei 500×1000 ansehen | Text, Kursstand, Warnung und beide Aktionen lesbar; Screenshot direkt geprüft. |
| Backup nach Wechsel herunterladen, wieder einspielen und neu laden | Enthält und erhält 5.000 USD und 4.000 EUR für dasselbe Datum, jeweils mit Währung; aktuelles Depot USD, Mindesthandel 20 USD. Vorschau zählt korrekt einen Tag. |

**Gemeinsamer Testserver:** Nach `scripts/stockinfo-test-server.py` verschoben.
Aktuelle Links und Startbefehle in T-39, T-40 und T-38 zeigen auf denselben
Helfer. Start vom neuen Ort mit neuer temporärer Datenbank geprüft: `/quote`
liefert VTI samt sieben Detailfeldern, `/fields` Core 4.3.0 und `/fx` USD/EUR 0,8.
Die FX-Fälle `normal`, `fx-missing` und `fx-stale` wurden im Browser durchlaufen.

Mike ergänzte im Codex-Chat: Das Script soll Port/Prozess behalten und eine
Option zum sauberen Beenden seines eigenen Servers anbieten; kein eigenes
Ticket nötig. Das ist im selben Helfer umgesetzt:

```bash
# Start mit Portvorgabe 8899 (andere Ports über --port)
/Volumes/DevLocal/DevWeb/Production/StockInfo/.venv/bin/python \
  scripts/stockinfo-test-server.py \
  --stockinfo-root /Volumes/DevLocal/DevWeb/Production/StockInfo \
  --detail-fixtures tests/fixtures/stockinfo

# Eigenen registrierten Server sauber beenden
/Volumes/DevLocal/DevWeb/Production/StockInfo/.venv/bin/python \
  scripts/stockinfo-test-server.py --stop --port 8899
```

Der Start vermerkt Scriptpfad, Port, PID, Prozessstart und Kommando im temporären
Benutzerverzeichnis. `--stop` braucht weder StockInfo-Konfiguration noch dessen
Imports, prüft die Prozessidentität und sendet nur diesem Prozess SIGTERM.
Es sucht und beendet **keinen beliebigen Portbesitzer**. Veraltete Einträge
werden ohne Signal entfernt. Ein Doppelstart überschreibt keinen laufenden
Nachweis. Der Prozess räumt seine Zustandsdatei beim regulären Ende auf.

Lifecycle-Prüfung separat auf Port 8897: Start und echter FX-Aufruf 200; `--stop`
liefert Erfolg, Uvicorn meldet abgeschlossenen Shutdown; wiederholtes Stoppen
bleibt wirkungslos. Ein absichtlich falscher Identitätsnachweis für den anderen
laufenden Testserver beendet ihn nicht (dessen `/health` danach 200). Erneuter
Start funktioniert, ein Doppelstart wird mit Exit 2 abgelehnt; anschließend
regulär gestoppt. Die konkrete Script-Aufrufpräfix-Freigabe ist eingerichtet,
sodass künftige Stopps keine wechselnden `kill <PID>`-Freigaben benötigen.


**Gesamtprüfung Runde 2:** Isolierte eigene Fassung, **52 Dateien / 712 Tests
erfolgreich**, `make lint` und `make typecheck` Exit 0. Prüfkopie:
`/var/folders/1g/t8rp3mj157z2kfc6ch_t3nw40000gn/T/stockportfolio-t38-r2-review-ddn0syyc`.
Logs: `/tmp/stockportfolio-t38-r2-isolated-{test,lint,typecheck}.log`.
164 Produkt-/Test-/Konfigurationsdateien einschließlich Testserver mit dem
Index verglichen, keine Abweichung. Nach dem Lauf nur den erläuternden
Kommentar zum Snapshot-Schlüssel ergänzt; keine Verhaltensänderung.
TS-/Vue-Bezeichnerinventar der 14 geänderten Implementierungs-/Testdateien
sowie Python-AST-Inventar des Helfers: englische Bezeichner. Der zusätzliche
Schema-Edit betrifft ausschließlich den Kommentar.

**Doku-Abgleich Runde 2:** README und aktuelle Ausführungsentscheidung beschreiben
den laufenden bestätigten Währungswechsel. Runde-1-Belege sind als historisch
gekennzeichnet; Reviewzitate bleiben erhalten. Historienimport/-export beschreibt
alle Währungsreihen. Die drei Tickets verweisen auf den einen Helfer unter
`scripts/`; seine Stop-Option ist im Script und in den Tickets dokumentiert.
Kein neues Ticket und kein zusätzlicher Prozessmanager eingeführt.

**Lessons Runde 2:** SI-R-01/SI-T-66 praktisch angewandt: Die Reviewaussage,
die Historie sei bereits vollständig vorbereitet, wurde durch die Gegenprobe
für zwei Währungen am selben Tag geprüft und korrigiert. Der notwendige Umfang
ist Schlüssel, Neuladen und Sicherung der vorhandenen Reihen; keine historischen
FX-Abfragen und keine allgemeine Migration. Der Helfer nutzt SIGTERM und eine
einfache Zustandsdatei, keine zusätzliche Laufzeit.


### Übergabe · Runde 2

- **Coder:** `codex`; **Verifier:** `claude`.
- **Produktfassung:** `983b33bffec1b52fd26e233dcca98d8acffdf997`.
- Review-1-Nacharbeit umgesetzt: laufender bestätigter Währungswechsel, Cash und
  absolute Grenzen umrechnen, gleiche Datumseinträge verschiedener Währungen
  erhalten, alle Reihen sichern/importieren. Nullkursbefund ebenfalls behoben.
- Beauftragter gemeinsamer Testserver unter `scripts/` mit eigenem `--stop`,
  Prozessidentitätsprüfung und dokumentierter Lifecycle-Gegenprobe.
- Eigene UI-Fälle und isolierte **52 Dateien / 712 Tests**, Lint/Typprüfung
  erfolgreich; 164 Dateien mit dem Index abgeglichen.
- Bitte die neue Entscheidung samt Historien-/Backup-Wechsel und die
  beauftragte Start-/Stop-Ergänzung unabhängig prüfen. Mikes Abnahme bleibt offen.

### Review Runde 2 · Verifier `claude` · 2026-09-10

Geprüfte Fassung `983b33bffec1b52fd26e233dcca98d8acffdf997` gegen `674b370`.
**Urteil: technisch freigegeben (`approved`).** Der blockierende Punkt aus
Runde 1 ist erledigt, beide Nebenbefunde ebenfalls. Mikes Abnahme steht aus.

Eigene Ausfertigung des Commits, `src/` byteweise gleich. Der Lauf enthielt
zusätzlich meine zwölf Zusicherungen aus Runde 1: **53 Dateien / 724 Tests
grün** — das sind genau die gemeldeten 52/712 plus meine Probe. Die
Umrechnungsmechanik ist also unverändert korrekt, es gibt keinen Rückschritt.

**Der Währungswechsel im laufenden Betrieb ist umgesetzt.** Sieben eigene
Zusicherungen gegen den Portfolio-Store, alle erfüllt:

- Ein Depot mit Beständen wechselt, und **nur Geldbeträge werden umgerechnet**:
  Cash 1.000 → 1.100 bei Kurs 1,1, absoluter Sicherheitspuffer 500 → 550.
  Stückzahlen, Ziel-Prozente und eine prozentuale Geldschwelle bleiben
  unverändert — richtig, denn sie sind nicht in Währung ausgedrückt.
- **Ohne Kurs bleibt das Depot unangetastet.** Kein Kurs, falsche Richtung
  (`USD/EUR` statt `EUR/USD`) und eine Rate von 0 werden abgewiesen; Währung,
  Cashbetrag und Puffer stehen danach unverändert da. Der Wurf erfolgt vor
  jedem Schreibvorgang.
- Ein Depot ohne gespeicherten Geldbetrag wechselt ohne Kurs.
- Die Verwaltungsliste meldet `hasCurrencyAmounts` korrekt.
- **Zwei Währungsreihen desselben Tages bleiben getrennt**, und die Sicherung
  enthält beide.

Der letzte Punkt geht auf einen Fehler zurück, den der Coder selbst mit einer
roten Gegenprobe gefunden hat: Der Tageswert-Schlüssel enthielt die Währung
nicht, ein zweiter Eintrag desselben Tages hätte den ersten überschrieben. Der
Schlüssel lautet jetzt `<portfolioId>::<currency>::<date>`, und
`findByPortfolio` entdoppelt zusätzlich nach Datum und Währung — damit
überleben auch Einträge im alten Schlüsselformat unbeschadet. Das ist der
Fund, den dieser Auftrag eigentlich erst möglich gemacht hat.

Im Aufrufer holt `PortfolioManager` den gerichteten Kurs `alt → neu`, bevor der
Bestätigungsdialog erscheint, nennt Kurs und Stand und warnt bei `stale`.
Ohne Kurs erscheint kein Dialog, sondern eine Fehlermeldung.

Beide Nebenbefunde aus Runde 1 sind erledigt: `convertedPrice` weist einen
Kurs von 0 jetzt auf **beiden** Wegen ab, und die Commit-Sprache ist mit
`983b33b` wieder deutsch.

Der gemeinsame Testserver unter `scripts/` beendet mit `--stop` ausschließlich
den eigenen Prozess: gespeicherte PID plus Identitätsvergleich über Status,
Startzeit und Kommando vor `os.kill`. Kein Zugriff auf fremde Portbesitzer.

**Grenze dieses Reviews:** kein Browserlauf. Die UI-Prüfung lag beim Coder und
ist im Ticket dokumentiert.

#### Befund ohne Nacharbeitsbedarf

- **Ein Hin- und Rückwechsel stellt den Ausgangsbetrag nicht exakt wieder her.**
  1.000 EUR → USD → EUR ergibt bei nicht reziproken Kursen etwa 999,90 EUR.
  Das ist Arithmetik, kein Fehler; im Bestätigungsdialog wäre ein Satz dazu
  ehrlicher als die stillschweigende Annahme, der Weg sei umkehrbar.
