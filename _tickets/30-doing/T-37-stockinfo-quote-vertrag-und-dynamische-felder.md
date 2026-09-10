# T-37 · StockInfo-Vertrag und zusätzliche Kennzahlen für StockPortfolio klären

StockPortfolio soll die **aktuelle StockInfo-Antwort korrekt verstehen** und
gewünschte zusätzliche Plugin-Kennzahlen nutzen können. Der heutige Client
basiert noch auf einem älteren Vertrag und übernimmt nur eine feste Feldliste.

Beispiel: StockInfo liefert einen zusätzlichen Risikoscore als
`details["risk-demo.score"].value`. StockPortfolio verwirft ihn im Mapper.
Auch ein flaches Feld `"risk-demo.score": 7` würde dort derzeit nicht übernommen.

Daneben erwartet der Mapper `isin` auf oberster Ebene. Im aktuellen
StockInfo-Vertrag liegt eine ISIN innerhalb der passenden `identity`-Form.
Eine neue Route für flache Details allein würde diese Lücke nicht beheben.

Der [aktualisierte Integrationsvorschlag](../../docs/stockinfo-integration-proposal.md)
liegt vor. Empfehlung: bestehende Antworten im Client normalisieren; eine neue
flache Route ist für den belegten Bedarf nicht nötig. Dieses Ticket konkretisiert den benötigten
Konsumentenvertrag und entscheidet, ob eine zusätzliche serverseitige
Leseansicht sinnvoll ist. Noch keine Implementierung, keine Live-Abnahme.

## Für dich

**Entschieden: zusätzliche Plugin-Felder automatisch in der Detailansicht
anzeigen.** Felder, die bereits in der aktuellen Haupt-Info-Zeile erscheinen,
werden dort nicht wiederholt. Die Hauptzeile kann selbst dynamische Felder
enthalten; entscheidend sind die tatsächlich dargestellten Feldschlüssel.

### Bisherige Antworten

**A/B · Feldbedarf und Anzeige — Mike, 2026-09-10:**

> Ja, in der Detail-View wenn sie nicht sowieso Teil der aktuellen "Haupt-Info-Zeile" sein - theoretisch könnten das auch teilweise dynamische Felder sein, berücksichtige das

Der Bedarf ist eine generische Anzeige, keine feste Wunschliste zusätzlicher
Berechnungsfelder. Neue Kennzahlen ändern dadurch keine Portfolioformeln.

Für die Bewertung ist kein manueller REST- oder Browser-Test erforderlich.
Der unabhängige Reviewer prüft den Integrationsvorschlag gegen Vertrag und
belegte Anforderungen.

### Bisheriger Auftrag

Mike, 2026-09-08: „Kannst du die Bewertung als Ticket in StockPortfolio definieren“.

Mike, 2026-09-10: „T-37 und T-38 sind die nächsten Tickets die du abarbeiten sollst“.
T-37 ist damit vor T-38 zur Bearbeitung aktiviert. Die Feldentscheidungen sind
oben dokumentiert und in den Integrationsvorschlag übernommen.

## Umsetzung und technische Nachweise

### Ergebnis und Grenzen

Ergebnis dieses Tickets ist ein abgestimmter, prüfbarer Integrationsvorschlag:
aktueller Identitätsvertrag, benötigte Zusatzfelder, Umgang mit Metadaten und
Entscheidung zwischen bestehender Antwort mit Client-Normalisierung oder
zusätzlicher StockInfo-Projektionsroute. Die Umsetzung wird danach gesondert
zugeschnitten; keine neue Route allein durch dieses Ticket beauftragt.

Repo: StockPortfolio. Betroffene Fremdschnittstelle: StockInfo.
Zeitbudget: nicht beziffert. Status: technische Bewertung und Feldbedarf
dokumentiert; unabhängiger Review wird vorbereitet.

### Vorliegende Befunde

- Bekannte Felder `ter`, `volatility` und `accumulating` liefert StockInfo
  weiterhin auf oberster Ebene. Der Portfolio-Mapper übernimmt diese Werte.
- `toQuoteCacheEntry` und `QuoteCacheEntry` bilden keine beliebigen Details ab.
  Der API-Client lädt keinen Feldkatalog über `/fields`.
- Der Quote-Store verwendet vier Wege: normale Abfrage und erzwungener Refresh,
  jeweils per ISIN oder Symbol. Zusätzlich verwenden Katalog und UI
  `GET /instruments`. Nur einen GET-Endpunkt umzustellen genügt nicht.
- Eine isolierte Ausführung des echten transpilierten Mappers mit einer
  synthetischen Antwort im aktuellen Identitätsformat liefert
  `isin === undefined`. Ein zusätzliches Plugin-Feld bleibt sowohl als
  Detailobjekt als auch auf oberster Ebene unberücksichtigt.

Die erste Untersuchung inventarisierte 69 TypeScript-/Vue-Quelldateien mit
Compiler-API und SFC-Parser. Kein Live-Kursabruf, Browserlauf oder vollständiger
Integrationstest. Die Befunde gelten für die am 2026-09-08 gelesenen lokalen
Arbeitsstände und müssen vor Umsetzung gegen den dann gültigen Vertrag geprüft
werden. Vorhandene fremde Änderungen wurden nicht verändert.

### Verify · einzige aktuelle Matrix

Legende: ✅ Bewertungsprüfung ausgeführt · ◑ teilweise belegt · ➖ noch nicht nachgewiesen.
Die Matrix bewertet den Abschluss dieser Bewertung, nicht eine bereits
implementierte Integration. Menschliche Entscheidungen stehen oben.

| # | Prüfung / Handgriff | Erwarteter Nachweis | AI |
|---|---|---|:--:|
| 1 | Aktuelle StockInfo-Antwortmodelle und Portfolio-Mapper gegenüberstellen; synthetische Antworten durch den echten Mapper schicken | Alle drei Identitätsformen und `listed` ohne ISIN geprüft; Quote- und Katalogmapper liefern jeweils `undefined`. Zielzuordnung und Grenzen im Vorschlag dokumentiert | ✅ |
| 2 | Antworten von Quote, Refresh und Instrumentkatalog bis Cache und UI verfolgen | Vier Quote-/Refreshwege, Katalog, Auswahl, Cache und Hauptzeile/Detailansicht am Quellcode zugeordnet; keine Live-Ende-zu-Ende-Prüfung | ✅ |
| 3 | Mikes Antworten A/B in konkrete Felder und Anwendungsfälle übersetzen | Automatische Detailanzeige; tatsächliche Hauptzeilen-Feldschlüssel einschließlich dynamischer Felder ausschließen; Anzeige ohne neue Berechnungen und Cacheanforderungen im Vorschlag festgelegt | ✅ |
| 4 | Verschachtelte Antwort plus Mapper mit zusätzlicher flacher Route vergleichen | Vergleich und Empfehlung samt synthetischem Antwortausschnitt, vier Quote-/Refreshwegen und direkt konsumiertem Katalog dokumentiert | ✅ |
| 5 | Gegenfälle im empfohlenen Vertrag durchgehen | Regeln für `0`, `false`, `null`, fehlendes Feld, Kollision, wirksamen/manuellen Wert, Einheit und Betragswährung dokumentiert; keine Produktumsetzung behauptet | ✅ |
| 6 | Empfehlung und offene Restarbeit unabhängig prüfen | Freigegebener Integrationsvorschlag und getrennt zugeschnittene Umsetzung; keine fälschlich behauptete Route oder Produktfreigabe | ➖ |

**Nachweise 2026-09-10:**
[Integrationsvorschlag](../../docs/stockinfo-integration-proposal.md), Abschnitte
„Der aktuelle Vertrag“, „Werte und Metadaten zusammenhalten“, „Vergleich mit
einer flachen Serverroute“ und „Was tatsächlich geprüft wurde“. `✅` bezeichnet
hier die ausgeführte Bewertungsprüfung, keine Live-Integration. Die frühere
Untersuchung vom 2026-09-08 bleibt als Ausgangsbefund erhalten.

**Doku-Abgleich:** README (One currency, Not there yet), ursprüngliche
MVP-Spec (API, Datenmodell, Rebalancing, Nicht im MVP), Board und Projektregeln
inventarisiert. Planungsstand und Links aktualisiert; Produktanleitungen
behaupten keine implementierte Integration. Die Antworten A/B sind verarbeitet;
unabhängiger Review und erforderliche Abschlussbestätigung bleiben offen.

### Prüfstand vor der Bewertungsübergabe · 2026-09-10

Die Projektprüfungen liefen im vorgefundenen Arbeitsbaum einschließlich der
bereits vorhandenen fremden Produktänderungen. Die Übergabe selbst enthält
ausschließlich die dokumentierte Bewertung, Projektregel und Ticketpflege;
sie gibt jene Produktänderungen nicht frei.

| Befehl im Projektverzeichnis | Ergebnis |
|---|---|
| `make test` | 39 Testdateien, 589 Tests bestanden; `/tmp/stockportfolio-t37-test.log` |
| `make lint` | Exit 0; `/tmp/stockportfolio-t37-lint.log` |
| `make typecheck` | Exit 0; `/tmp/stockportfolio-t37-typecheck.log` |
| `git diff --check` | Keine Whitespace-Fehler |

Der kopierbare Mapperaufruf im Integrationsvorschlag wurde ausgeführt. Die
lokalen Links in acht betroffenen Dokumenten und die aktive Ticket-/Prioritäts-
Zuordnung wurden geprüft. Browser und Live-API sind für diese Bewertung
nicht als durchgeführt angegeben. Die neuen Darstellungsregeln sind
Akzeptanzfälle der folgenden Umsetzung, keine bereits bestandenen UI-Tests.

### Regeln für die mögliche Projektion

Nur die bereits wirksamen Werte aus dem vorhandenen Quote-/Cache-Service
projizieren; keine zweite Beschaffungs- oder Vorranglogik. Qualifizierte
Plugin-Namen erhalten, Core-Felder nicht überschreiben. Typen, Einheiten und
wertabhängige Währungen dürfen nicht verloren gehen. Für generische Darstellung
bleibt der Feldkatalog relevant. Dynamische Schlüssel werden durch Abflachen
nicht zu statisch garantierten OpenAPI-Feldern.

### Einstieg in die betroffenen Dateien

- [API-Client](../../src/api/client.ts) und [API-Typen](../../src/api/types.ts)
- [Mapper](../../src/api/mappers.ts) und [Cachetypen](../../src/types/portfolio.ts)
- [Quote-Store](../../src/stores/quotes.ts) und [Instrument-Store](../../src/stores/instruments.ts)
- [Instrumentliste](../../src/views/InstrumentsView.vue) und [Positionsdetail](../../src/components/PositionDrilldown.vue)
- [Ausführliche Ausgangsbewertung in StockInfo](../../../StockInfo/docs/stockportfolio-quote-projection-review.md)

Die Ausgangsbewertung liefert Belege, ist keine zweite gepflegte Ticketkopie.
Die weitere Entscheidung und ihr Stand werden hier festgehalten.

### Abgrenzung zu T-35

[T-35](../10-backlog/T-35-stockinfo-generation-und-waehrung.md) behandelt Generation und
Währung. Dieses Ticket behandelt Antwortstruktur, Identitätszuordnung und
zusätzliche Kennzahlen. Währungsmetadaten berücksichtigen, aber keine neue
Währungsumrechnung oder Generationserkennung parallel zu T-35 entwerfen.

### Side-Effects

Nur Bewertungs- und Dokumentationsauftrag. Keine API-Umschaltung, Cachemigration,
Änderung von Portfolio-Daten oder Produktimplementierung. Eine spätere Änderung
muss vorhandene IndexedDB-Caches, ISIN-/Symbolzuordnung und alle Refresh-Wege
berücksichtigen. Zusätzliche StockInfo-Arbeit erhält nach der Entscheidung
gegebenenfalls ein verlinktes Umsetzungsticket.

### Auflösung

Offen. Der Integrationsvorschlag vom 2026-09-10 empfiehlt die bestehende
Antwort mit Client-Normalisierung. Identitätsformen, Abrufwege, Metadaten und
Gegenfälle sind dokumentiert. Feldbedarf und Auswahlverhalten A/B sind
entschieden: automatische Detailanzeige ohne Wiederholung tatsächlich in der
Hauptzeile dargestellter Felder, einschließlich dynamischer Schlüssel.
Keine unabhängige Freigabe und keine Implementierung; Review wird vorbereitet.
