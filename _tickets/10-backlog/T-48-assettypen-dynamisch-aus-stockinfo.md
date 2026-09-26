# T-48 · Asset-Typen dynamisch aus StockInfo übernehmen

Die Link-Einstellungen begrenzen Asset-Typen bisher auf stock und etf.
StockInfo liefert bereits etc, fund, crypto und bond; der Vertrag ist offen
für weitere Typen. Die lokale Einschränkung verwirft Angaben beim Anlegen,
Nachladen und Sicherungsimport und blendet sie in der Detailansicht aus.

**Auftrag von Mike, 2026-09-26:** Mögliche Typen über die REST-API aus dem
dynamischen Plugin-Angebot laden. Keine feste Ersatzliste und keine Ableitung
nur aus vorhandenen Instrumenten. Depotgruppen bleiben eine eigene Zuordnung.

**Stand:** Analyse abgeschlossen, noch nicht aktiviert. T-46 setzt inzwischen
den beauftragten Anzeigeanteil um: gemeinsame Typauflösung aus aktuellem
quote.type, unbekannte Kennungen in Desktop-Basiszeile und Mobile sichtbar,
keine Typwiederholung im Informationstab. StockInfo benötigt für die Auswahl eine
vollständige REST-Typauskunft; Konsumentenanfrage
[T-73](/Volumes/DevLocal/DevWeb/Production/StockInfo/_tickets/10-backlog/T-73-plugin-assettypen-per-rest-bereitstellen.md)
ist im StockInfo-Backlog abgelegt. Dort wurde keine Umsetzung aktiviert.

## Befund

- src/types/portfolio.ts: InstrumentKind ist eine geschlossene Union stock/etf.
- ExternalLinkEditor.vue: feste Auswahl aus genau diesen beiden Werten.
- DashboardView.vue, stores/portfolio.ts und domain/links.ts: andere Typen
  werden zu null oder nicht berücksichtigt; gespeicherter Typ wird selbst vor
  einer neueren StockInfo-Angabe bevorzugt.
- domain/backup.ts: KINDS-Liste verwirft weitere Positions-Typen beim Import.
- PositionReadDetails.vue: Darstellung nur für stock/etf.
  Dieser Anzeigebefund ist durch den T-46-Nachtrag behoben; die Angaben stehen
  jetzt gemeinsam über positionType/AssetTypeHint in der Basiszeile.
- API-Normalisierung erhält type bereits als String. Die Einschränkung liegt
  überwiegend danach im Konsumenten, nicht im API-Response-Typ.
- Gehostete API 1.0.0/Core 4.3.0 geprüft: /sources ohne Typmenge,
  /fields nur feldabhängige Typ-Scopes (etc/etf/fund). Beides stellt derzeit
  keinen vollständigen verfügbaren Plugin-Typkatalog dar.

## Gewünschtes Verhalten

Offen bleiben REST-Typkatalog, dynamische Link-Auswahl, vollständige Speicherung
und Sicherungsimport. Die bereits in T-46 umgesetzte Typanzeige wird weiterverwendet.

- API-Typkatalog über src/api/client.ts laden und normalisieren; Auswahl
  reagiert auf dessen Werte, einschließlich bisher unbekannter Kennungen.
- StockInfo-Typen unverändert erhalten, anzeigen und für Links verwenden.
  ETF und fund sind getrennte Kennungen, keine Zusammenfassung durch Umbenennung.
- Neue Quelle/neuer Typ erfordert kein StockPortfolio-Release. Ladefehler und
  Leerzustand sind sichtbar, keine feste Rückfallliste.
- Bereits gespeicherte Filter bleiben erhalten, auch wenn ein Typ momentan
  nicht angeboten wird; Umgang damit sichtbar machen.
- Positionsdaten, Linkfilter und Sicherungsimport erhalten offene Typkennungen.
- Neuere Angaben aus StockInfo werden nicht von einer veralteten lokalen Kopie
  verdeckt. Keine erneute Bearbeitung dieser Angaben in StockPortfolio.

## Verify

| Prüfung | Erwartung | AI |
|---|---|:--:|
| REST-Katalog mit etc/fund/crypto und unbekanntem neuen Typ | Alle dynamisch auswählbar | ➖ |
| Kein Instrument des neuen Typs im Depot | Typ trotzdem auswählbar | ➖ |
| Linkfilter plus Depotgruppe | Beide Einschränkungen korrekt kombiniert | ➖ |
| Neuer Typ in Position, Kurs und Details | Unverändert erhalten und angezeigt | ➖ |
| Sicherung exportieren/importieren | Typen und Filter bleiben erhalten | ➖ |
| Katalog leer/gestört/geändert | Kein stiller Datenverlust oder feste Ersatzliste | ➖ |
| Browser Desktop/Mobile, DE/EN | Auswahl und Links bedienbar, keine Schlüsseltexte | ➖ |
| Tests, Lint, Typecheck und Doku | Erfolgreich und abgeglichen | ➖ |

## Doku-Abgleich

README „Six portfolio groups“/Linkfilter und API-Vertragsbeschreibung sind bei
Umsetzung anzupassen. Noch keine Produktänderung; bestehende Beschreibung der
zwei Typen ist als aktueller Mangel erfasst. Allgemeine Skill-Übernahme bleibt
unverändert offen (lokal activity-feed, Skill lessons-follow-through).

## Für Mike

Keine Rückfrage zum gewünschten Verhalten. Umsetzung wartet auf Aktivierung
nach dem laufenden Review und die dokumentierte REST-Auskunft von StockInfo.
