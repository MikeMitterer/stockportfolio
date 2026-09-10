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

Die **erste Bewertung liegt vor**. Dieses Ticket konkretisiert den benötigten
Konsumentenvertrag und entscheidet, ob eine zusätzliche serverseitige
Leseansicht sinnvoll ist. Noch keine Implementierung, keine Live-Abnahme.

## Für dich

Zu entscheiden ist, **welche zusätzlichen Felder StockPortfolio verwenden soll**:
konkret benannte Kennzahlen oder beliebige neue Plugin-Felder in einer
zusätzlichen Anzeige. Für Berechnungen müssen Bedeutung und Einheit feststehen.

| Frage | Deine Entscheidung |
|---|---|
| A · Welche zusätzlichen Kennzahlen möchtest du sehen oder auswerten? Ein Beispiel genügt für den ersten Zuschnitt. | |
| B · Sollen unbekannte Plugin-Felder automatisch als Zusatzinformationen erscheinen oder nur ausdrücklich ausgewählte Felder? | |

Kein manueller REST- oder Browser-Test durch dich erforderlich, bevor der
Umfang geklärt und eine passende Testumgebung vorbereitet ist.

### Bisheriger Auftrag

Mike, 2026-09-08: „Kannst du die Bewertung als Ticket in StockPortfolio definieren“.

Mike, 2026-09-10: „T-37 und T-38 sind die nächsten Tickets die du abarbeiten sollst“.
T-37 ist damit vor T-38 zur Bearbeitung aktiviert. Die Vertragsprüfung läuft;
die offenen Feldentscheidungen werden im Chat abgefragt.

## Umsetzung und technische Nachweise

### Ergebnis und Grenzen

Ergebnis dieses Tickets ist ein abgestimmter, prüfbarer Integrationsvorschlag:
aktueller Identitätsvertrag, benötigte Zusatzfelder, Umgang mit Metadaten und
Entscheidung zwischen bestehender Antwort mit Client-Normalisierung oder
zusätzlicher StockInfo-Projektionsroute. Die Umsetzung wird danach gesondert
zugeschnitten; keine neue Route allein durch dieses Ticket beauftragt.

Repo: StockPortfolio. Betroffene Fremdschnittstelle: StockInfo.
Zeitbudget: nicht beziffert. Status: aktiv, Bewertung wird vervollständigt.

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

Legende: ◑ teilweise belegt · ➖ noch nicht nachgewiesen.
Die Matrix bewertet den Abschluss dieser Bewertung, nicht eine bereits
implementierte Integration. Menschliche Entscheidungen stehen oben.

| # | Prüfung / Handgriff | Erwarteter Nachweis | AI |
|---|---|---|:--:|
| 1 | Aktuelle StockInfo-Antwortmodelle und Portfolio-Mapper gegenüberstellen; synthetische Antworten durch den echten Mapper schicken | Identitätsformen `listed`, `pair`, `isin_only` und optionale ISIN korrekt im Integrationsvorschlag behandelt; erste Mapper-Lücke bereits reproduziert | ◑ |
| 2 | Antworten von Quote, Refresh und Instrumentkatalog bis Cache und UI verfolgen | Vollständige betroffene Abruf- und Verbraucherwege; erste Codeinventur liegt vor, kein Live-Ende-zu-Ende-Nachweis | ◑ |
| 3 | Mikes Antworten A/B in konkrete Felder und Anwendungsfälle übersetzen | Benötigte Kennzahlen, reine Anzeige versus Berechnung und Cache-Anforderungen eindeutig festgelegt | ➖ |
| 4 | Verschachtelte Antwort plus Mapper mit zusätzlicher flacher Route vergleichen | Begründete Empfehlung samt Beispielantwort, Aufwandstreibern und Folgen für alle relevanten Abrufwege | ◑ |
| 5 | Gegenfälle im empfohlenen Vertrag durchgehen | `0`, `false`, `null`, fehlendes Feld, Namenskollision, Quellen-/manueller Wert, Einheit und Betragswährung eindeutig geregelt | ➖ |
| 6 | Empfehlung und offene Restarbeit unabhängig prüfen | Freigegebener Integrationsvorschlag und getrennt zugeschnittene Umsetzung; keine fälschlich behauptete Route oder Produktfreigabe | ➖ |

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

Offen. Ausgangsbewertung übernommen; Feldbedarf und endgültiger Integrationsweg
noch nicht entschieden. Keine unabhängige Freigabe und keine Implementierung.
