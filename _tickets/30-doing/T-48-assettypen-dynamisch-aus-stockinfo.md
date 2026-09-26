# T-48 · Asset-Typen dynamisch aus StockInfo übernehmen

Ausgangsproblem: Die Link-Einstellungen begrenzten Asset-Typen auf stock und etf.
StockInfo liefert bereits etc, fund, crypto und bond; der Vertrag ist offen
für weitere Typen. Die lokale Einschränkung verwarf Angaben beim Anlegen,
Nachladen und Sicherungsimport und blendete sie in der Detailansicht aus.

**Auftrag von Mike, 2026-09-26:** Mögliche Typen über die REST-API aus dem
dynamischen Plugin-Angebot laden. Keine feste Ersatzliste und keine Ableitung
nur aus vorhandenen Instrumenten. Depotgruppen bleiben eine eigene Zuordnung.

**Stand:** Mike hat T-48 am 2026-09-26 aktiviert. Der neue StockInfo-Endpunkt
`GET /instrument-types` ist live verfügbar: sechs Typkennungen, `complete`
und Quelldiagnosen. Die T-46-Typanzeige ist abgeschlossen und wird weiterverwendet.
Die frühere API-Abhängigkeit (StockInfo T-73) ist erfüllt. Umsetzung und
Coder-Prüfung sind abgeschlossen; unabhängiger Review und Mikes Abschluss
stehen aus.

## Ausgangsbefund vor Umsetzung

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

Der Auftrag umfasst REST-Typkatalog, dynamische Link-Auswahl, vollständige
Speicherung und Sicherungsimport. Die bereits in T-46 umgesetzte Typanzeige wird weiterverwendet.

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
| REST-Katalog mit etc/fund/crypto und unbekanntem neuen Typ | Alle dynamisch auswählbar | ✅ |
| Kein Instrument des neuen Typs im Depot | Typ trotzdem auswählbar | ✅ |
| Linkfilter plus Depotgruppe | Beide Einschränkungen korrekt kombiniert | ✅ |
| Neuer Typ in Position, Kurs und Details | Unverändert erhalten und angezeigt | ✅ |
| Sicherung exportieren/importieren | Typen und Filter bleiben erhalten | ✅ |
| Katalog leer/gestört/geändert | Kein stiller Datenverlust oder feste Ersatzliste | ✅ |
| Browser Desktop/Mobile, DE/EN | Auswahl und Links bedienbar, keine Schlüsseltexte | ✅ |
| Tests, Lint, Typecheck und Doku | Erfolgreich und abgeglichen | ✅ |

## Doku-Abgleich

- `README.md`, „Six portfolio groups“: REST-Typkatalog, Laden/Neuladen,
  getrennte Kennungen, erhaltene Filter bei Fehlern, Vorrang aktueller Kurse
  und Speicherung ohne Änderung der Depotgruppe beschrieben.
- `tests/fixtures/stockinfo/README.md`: Herkunft der drei HTTP-Fixtures aus
  StockInfo `8b0f547c699a8bb1bde62e054f652f6fabfe3204` festgehalten.
- `tests/fixtures/browser/README.md`: wiederholbare Katalogszenarien und
  Rückkehr zum normalen Testzustand beschrieben. Bestehendes Testdepot bleibt.
- Inventar von `docs/` und `unraid/` abgeglichen: historische T-37-Bewertung
  bleibt historisch; Installation und Containerkonfiguration ändern sich nicht.
- Keine Board- oder Lessons-Konvention geändert; daher keine Skill-Anpassung.
  Allgemeine Übernahme bleibt sichtbar offen: lokal `activity-feed`, Skill
  `lessons-follow-through`. Bestehende Schreibgrenzen bleiben maßgeblich.

## Für Mike

Typen bei Links kommen ebenfalls aus dem gemeinsamen REST-Katalog. Eine
zusätzliche feste Typenliste gibt es nicht. Linkfilter und Typanzeige verwenden
beide `resolveKind`: aktueller StockInfo-Typ vor gespeicherter Offline-Kopie.
Die sechs bekannten SVG-Zuordnungen betreffen ausschließlich die Darstellung;
weitere Typen erhalten das vorhandene neutrale Symbol.

## Umsetzungsschritte · Codex

1. REST-Typkatalog am gemeinsamen API-Client normalisieren, sitzungsbezogen
   laden; vollständig/teilweise/leer/Fehler getrennt anzeigen.
2. Offene Typkennungen durch Positionen, aktuelle Kurse, Linkauflösung und
   Backup erhalten; gemeinsame Typauflösung bevorzugt aktuelle StockInfo-Daten.
3. Link-Auswahl aus REST-Katalog; gespeicherte fehlende Filter sichtbar erhalten.
4. Vertrags-/Store-/Komponentengrenzen sowie Desktop/Mobile DE/EN prüfen,
   Dokumentation abgleichen und an Claude übergeben.

## Umsetzung und Coder-Prüfung · 2026-09-26

### Gemeinsame Datenquelle und Speicherung

`StockInfoClient.getInstrumentTypes` → Normalizer → Mapper → Pinia-Store
`instrumentTypes` liefert den Katalog für den Linkeditor. Der Store bündelt
parallele Aufrufe und verwirft verspätete Antworten einer vorherigen API-Adresse.
Laden, vollständig leer, unvollständig und Fehler sind getrennt sichtbar.
Vorhandene nicht bestätigte Filter bleiben ausschließlich bei ihrem Link
als markierte Auswahl erhalten; daraus entsteht kein Ersatzkatalog.

`resolveKind` wird von Linkauflösung und `positionType` gemeinsam verwendet.
Neue Positionen übernehmen den validierten aktuellen Kurstyp; `syncKinds`
speichert spätere Änderungen auch bei Aktualisierung außerhalb des Dashboards.
Depotgruppen bleiben unverändert. Positionen und Sicherungen erlauben offene
Typkennungen; `etf` und `fund` bleiben verschiedene Werte.

Live-Antwort von `/instrument-types` geprüft: bond, crypto, etc, etf, fund,
stock sowie `complete` und `sources`. `complete` bezeichnet die Vollständigkeit
der Plugin-Deklarationen. Eine nicht erreichbare Quelle kann ihre Typen trotzdem
vollständig deklarieren. Additive Antwortfelder werden ignoriert.

### Automatisierte Nachweise

- `make test`: **764 Tests in 60 Dateien bestanden**.
- `make lint` und `make typecheck`: Exit 0; `git diff --check` sauber.
- API-Tests: versionierte vollständige/leere/unvollständige Antworten,
  zukünftige Kennung, additive Felder und ungültige Pflichtfelder.
- Store-Tests: paralleles Laden, Neuladen, Fehler, Wiederherstellung und
  verspätete Antwort nach API-Wechsel.
- Linkeditor DE/EN: dynamische Optionen, erhaltene eigene Filter,
  Katalogzustände und Auswahlereignis bei unveränderter Depotgruppe.
- Domain-Tests: aktueller Kurstyp gewinnt, offene Kennungen und kombinierte
  Typ-/Gruppenfilter. Backup-Rundlauf erhält zukünftige Positionstypen und Filter.
- Fake-IndexedDB: geänderten Typ speichern und erneut laden; fehlender Kurs
  erhält den gespeicherten Typ. Gruppen bleiben gleich.
- Bezeichnerinventar mit TypeScript-Compiler-API für angefasste TS/Vue-Dateien
  und Python-AST für den Testserver; deutsche lokale Variable im berührten
  Linktest in `allLinks` umbenannt.

### Browsernachweise

Bestehender Browser-Testbestand auf `127.0.0.1:5189`, Test-API `:8899`;
Desktop 1440 × 1000 und Mobile 390 × 844, DE und EN.

1. Normaler StockInfo-Endpunkt bietet alle sechs deklarierten Typen an.
2. Szenario `types-future`: `future-type` ohne entsprechende Depotposition
   auswählbar. Vorhandenes `etf` sichtbar als nicht im aktuellen Katalog.
   Zukünftigen Filter ausgewählt; Neuladen erhält beide Filter.
3. `types-empty`, `types-incomplete`, `types-down`: unterschiedliche Hinweise;
   gespeicherte Auswahl bleibt erhalten, kein stilles Leeren und keine feste Liste.
4. Lange markierte Auswahl auf Mobile geprüft. Eine zu breite Grid-Spalte
   auf `minmax(0, 1fr)` korrigiert; Feld und Auswahl danach jeweils 310 px,
   kein horizontaler Seitenüberlauf. DE/EN bedienbar und ohne Schlüsseltexte.
5. Rückkehr zu `normal`, nur temporären `future-type`-Filter entfernt,
   Sprache Deutsch und Desktop wiederhergestellt. Persistenten Bestand geprüft:
   EUNL.DE/VTI `etf`, AAPL `stock`, DE0001135275 `bond`, Cash ohne Typ;
   fünf Positionen und bestehende Gruppen erhalten.

Grenze der Nachweise: Neue zukünftige Positionstypen und Backup-Rundlauf sind
in automatisierten Tests geprüft. Im Browser wurden Katalogauswahl,
Filterspeicherung und bestehende Positionen geprüft; kein zusätzlicher
Sicherungsdownload und keine neue fiktive Depotposition angelegt.

### Lessons-Abgleich

Lokale Sammlung vor Übergabe erneut gelesen, Formatfassung 1.
SP-CX-02: aktuelle Aussagen in README, Ticket und STATUS gemeinsam nachgezogen.
SP-CX-04: vorhandenen Helfer unter `scripts/` erweitert und reproduzierbare
Szenarien unter `tests/fixtures/` dokumentiert. SP-R-01 als einschlägige
Gegenprobe: Datenerhalt durch Schreiben und erneutes Laden sowie Backup-Rundlauf
geprüft. Kein neues belegtes Wiederholungsmuster; keine globale Lessons-Pflege.
