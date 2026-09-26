# T-48 · Asset-Typen dynamisch aus StockInfo übernehmen

Ausgangsproblem: Die Link-Einstellungen begrenzten Asset-Typen auf stock und etf.
StockInfo liefert bereits etc, fund, crypto und bond; der Vertrag ist offen
für weitere Typen. Die lokale Einschränkung verwarf Angaben beim Anlegen,
Nachladen und Sicherungsimport und blendete sie in der Detailansicht aus.

**Auftrag von Mike, 2026-09-26:** Mögliche Typen über die REST-API aus dem
dynamischen Plugin-Angebot laden. Keine feste Ersatzliste und keine Ableitung
nur aus vorhandenen Instrumenten. Depotgruppen bleiben eine eigene Zuordnung.

**Stand:** Am 2026-09-26 durch Mike abgeschlossen: „OK, damit ist T-48 erledigt“.
Claude hat die Umsetzung in Runde 1 (`2aac1e9`) technisch freigegeben.
Der anschließende Beschriftungsnachtrag (`3b63788`) ist durch Codex geprüft
und von Mikes Abschluss umfasst; der noch offene Kurzreview in Runde 2
wird mit dieser Entscheidung beendet. Keine technische Runde-2-Freigabe behauptet.

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

## Reviewer-Prüfung (Claude, Runde 1, Fassung `2aac1e9`)

**Technische Freigabe.** `make test` (60 Dateien, 764 Tests), `make lint` und
`make typecheck` selbst gegen die Übergabefassung ausgeführt — alle drei ohne
Befund, deckungsgleich mit der Übergabeangabe. Seit dem Handoff-Commit betraf
der Folgecommit ausschließlich Board-Dateien; der Produktstand war während
der Prüfung stabil.

**Diff vollständig gelesen** (35 Dateien): API-Vertrag
(`client.ts`/`types.ts`/`normalizers.ts`/`mappers.ts`), neuer Store
`instrumentTypes.ts`, `ExternalLinkEditor.vue`, Domain (`links.ts`,
`positionIdentity.ts`, `backup.ts`, `assetGroup.ts`), `portfolio.ts`
(`backfillKinds` → `syncKinds`) und `App.vue`.

- **Normalizer** prüft Pflichtform streng (`instrument_types: string[]`,
  `complete: boolean`, `sources[]` mit `name`/`role`/`instrument_types`/`status`),
  dedupliziert über `Set` und verwirft Kennungen mit Rand-Whitespace. Additive
  Antwortfelder werden implizit ignoriert (nur bekannte Felder extrahiert) —
  passend zur Projektkonvention.
- **`instrumentTypes`-Store** übernimmt exakt das bereits geprüfte Muster aus
  dem `fields`-Store (T-40): `sequence`/`pending` verhindern verspätete
  Antworten nach Adresswechsel und doppelte parallele Abrufe; Katalogfehler
  räumen den Katalog statt eine Rückfallliste zu zeigen.
- **`resolveKind`** wurde tatsächlich umgedreht: vorher gewann `position.kind`
  vor dem aktuellen Kurs, jetzt gewinnt der aktuelle Kurs
  (`quoteType?.trim() || position.kind?.trim() || null`) — deckt sich mit der
  expliziten Anforderung „Neuere Angaben aus StockInfo werden nicht von einer
  veralteten lokalen Kopie verdeckt". `positionType()` delegiert jetzt an
  `resolveKind`, eine einzige Auflösung für Anzeige und Linkfilter.
- **`syncKinds`** (vormals `backfillKinds`) schreibt Typänderungen nicht mehr
  nur bei fehlendem `kind`, sondern bei jeder Abweichung vom aktuellen
  Kurstyp — und lässt die Depotgruppe dabei unverändert (die alte
  `stocks`→`etfs`-Automigration ist entfernt, passend zu „Depotgruppen bleiben
  eine eigene Zuordnung"). Der neue `watch` in `App.vue`
  (`[quotesStore.quotes, portfolioStore.portfolio?.id]`) löst bei jeder
  Kursaktualisierung aus; `quotesStore.quotes` ist ein `shallowRef`, dessen
  `.value` bei jeder Änderung komplett ersetzt wird (nie mutiert), der Watch
  reagiert also zuverlässig. `syncKinds` ist selbstbegrenzend: ein zweiter
  Aufruf mit unveränderten Typen liefert `changed = 0`, kein Persistenzsturm —
  durch den neuen Store-Test `store.syncKinds(quotes)` zweimal hintereinander
  (1, dann 0) bestätigt.
- **`backup.ts`**: feste `KINDS`-Liste entfernt, `kind` akzeptiert jede
  nicht-leere getrimmte Zeichenkette — offene Kennungen überstehen Export/Import.

**Live im Browser** (Testdienst Port 8899, App `:5189`, Desktop) alle vier vom
Ticket geforderten Katalogzustände durchgespielt, nicht nur den dokumentierten
Erfolgsfall:

- `types-future` (`future-type`, `stock`; `etf` nicht mehr enthalten,
  `complete: true`): Dropdown zeigt `future-type`/`stock` dynamisch, das
  gespeicherte `etf` bleibt als „etf (nicht im aktuellen Katalog)" auswählbar
  und markiert — nichts geht still verloren.
- `types-empty` (`complete: true`, leer): Statuszeile „StockInfo bietet
  derzeit keine Asset-Typen an. Gespeicherte Filter bleiben erhalten."; alle
  drei bestehenden Verweise zeigen weiterhin ihre Typen mit
  „nicht im aktuellen Katalog".
- `types-incomplete` (`complete: false`): Statuszeile „Die Typauskunft ist
  unvollständig …"; dieselben Filter zeigen jetzt „(gespeichert, derzeit
  unbestätigt)" statt „nicht im aktuellen Katalog" — die vom Code
  unterschiedene Formulierung (`complete` steuert `absentLabel`) live bestätigt,
  nicht nur im Test gelesen.
- `types-down` (HTTP 503): Statuszeile „Asset-Typen konnten nicht geladen
  werden: Typkatalog im Testszenario nicht verfügbar (HTTP 503). Gespeicherte
  Filter bleiben erhalten." — der tatsächliche Serverfehlertext erscheint,
  keine feste Ersatzliste, keine stille Löschung.
- Zurück auf `normal` und „Typen neu laden" geklickt: alle sechs Katalogtypen
  wieder verfügbar, ursprüngliche Filter (`etf`/`stock`/`etf`) unverändert.
  IndexedDB-Kontrolle vor und nach der Probe bestätigt: `links`-Array in
  `settings` byteidentisch, keine Testreste. Dashboard nach der Probe
  unverändert (5 Positionen, gleiche Gruppenwerte, Typ-Icons weiterhin sichtbar).

**Befund ohne Nacharbeitsbedarf:** Die alten festen Optionen `links.etf`
(„ETF / Fonds" → „ETF") und `links.stock` sind seit dieser Änderung nirgends
mehr referenziert (`kindOptions()` verwendet jetzt die rohen Katalogwerte als
Label) und damit tote i18n-Schlüssel. Der bestehende Katalogtest
(`tests/i18n/catalogues.spec.ts`) prüft nur Schlüsselgleichheit zwischen
DE/EN, keine Verwendung — deckt das nicht auf. Kein Funktionsfehler, geringes
Gewicht; wird nicht zur Bedingung für diese Freigabe gemacht.

**Ergebnis:** Fassung `2aac1e9` technisch freigegeben. Kein `changes_requested`.
Mikes Abschlussentscheidung für T-48 bleibt offen.

## Nachtrag · Deutsche Bezeichnung „Links“ · 2026-09-26

Mike: „Bei den Einstellungen steht Verweise - ändre das auch im Deutschen zu Links“
(sinngemäß; Auftrag im Codex-Chat).

Deutscher Tab heißt jetzt „Links“, Überschrift „Externe Links“. Zugehörige
Aktionen, Hinweise, Standardname und Bestätigungen verwenden ebenfalls
„Link/Links“. Bestehenden Komponententest auf die neue Beschriftung angepasst;
keine Verhaltensänderung, keine neuen Tests.

Nachweise: `make test` 764 Tests / 60 Dateien, `make lint` und `make typecheck`
erfolgreich. Browser auf Desktop: Tab „Links“, Überschrift „Externe Links“,
„Link aktiv“ und „Link hinzufügen“ sichtbar. Testdaten unverändert.
Doku-Abgleich: README verwendet bereits „Links“; keine Anleitung oder
Konfiguration betroffen. Schlüssel und englische Übersetzungen bleiben gleich.

## Abschluss · Mike · 2026-09-26

„OK, damit ist T-48 erledigt“ (direkt im Codex-Chat nach dem Links-Nachtrag).
Ticket nach `40-done/` verschoben; Status und Board-Einstieg abgeglichen.
Letzter abgeschlossener unabhängiger Review bleibt Runde 1, Fassung `2aac1e9`.
Der für `3b63788` vorbereitete Kurzreview wird durch Mikes ausdrücklichen
Abschluss beendet. Seine Coder-Prüfnachweise stehen im Nachtrag oben.
Historische Aussagen zur damals offenen Abschlussentscheidung bleiben auf
ihren jeweiligen Reviewzeitpunkt bezogen. Keine Produktänderung beim Abschluss.
