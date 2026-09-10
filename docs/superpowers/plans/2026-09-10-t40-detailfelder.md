# T-40: Dynamische Detailfelder — Implementation Plan

> Ausführung im bestehenden Chat mit `superpowers:executing-plans`.
> Der unabhängige Review erfolgt durch die im Board zugeordnete Instanz Claude.

**Goal:** Zusätzliche Kennzahlen aus StockInfo automatisch und ohne Dopplung mit
sichtbaren Hauptspalten anzeigen.

**Architecture:** Die gemeinsame Clientgrenze erhält `details` einschließlich
Metadaten. `/fields` liefert die Definitionen an einen nicht persistierten
Sitzungsstore. Eine reine Projektion erzeugt beschriftete Anzeigefelder aus
Definitionen, Werten und den Feldschlüsseln der tatsächlich gerenderten Spalten.
TER und Volatilität verwenden dieselbe Darstellung. Gültige Core-Kurse bleiben
bei fehlendem Feldkatalog verfügbar.

**Tech Stack:** Vue 3, Naive UI, Pinia, TypeScript, Vitest, fake-indexeddb.
Keine neue Abhängigkeit und keine Änderung am StockInfo-Produktcode.

**Spec:** [T-40](../../../_tickets/30-doing/T-40-detailanzeige-aus-feldkatalog.md),
[gewählte Darstellung](../../stockinfo-integration-proposal.md#gewählt-automatische-zusatzanzeige-in-der-detailansicht).
Der Vorschlag und Mikes Antworten sind die bereits bestätigte Entwurfsgrundlage.

## Globale Grenzen

- Branch `t-40-detailanzeige-aus-feldkatalog`, Grundlage T-39 `2cbfbf0`.
- Fremde Änderungen erhalten und getrennt von der Übergabefassung prüfen.
- Englisch für Bezeichner, Deutsch für Kommentare, sichtbare Texte über i18n.
- Anzeige verändert keine Depotberechnung, Originalwerte oder Kurswährungen.
- Kein Spalteneditor und kein Migrationspfad für alte Entwicklungsdaten.
- Der Sitzungskatalog gehört zur Clientadresse und enthält generation_id,
  core_version und details_version; keine generationensichere Profilumschaltung
  vor T-35 behaupten.

## 1. Detailvertrag und Speicherung

Dateien: `src/api/types.ts`, `src/api/normalizers.ts`, `src/api/client.ts`,
`src/api/mappers.ts`, neue `src/types/details.ts`, `src/types/portfolio.ts`.
Tests: `tests/api/details.spec.ts`, `tests/stores/detailCache.spec.ts`.

Schnittstellen: `StockInfoClient.getFields(): Promise<FieldsResponse>` und
`normalizeFields(input: unknown, url: string): FieldsResponse`. Quote und
InstrumentSummary erhalten optionale Detailwerte; der Mapper überführt
Metadaten wie `as_of` und `manual_value` in Domain-Schreibweise. Fehlender
Detailblock bleibt als nicht geladen unterscheidbar von einer leeren Map.

- [ ] Rote Tests für Quote, Refresh, Katalog und Persistenz schreiben:
  ```ts
  const response = await client.getQuoteByIsin('IE00B4L5Y983')
  expect(response.details?.['risk-a.score']?.value).toBe(0)
  expect(response.details?.['risk-a.flag']?.value).toBe(false)
  expect(response.details?.['risk-a.score']?.manual_value).toBe(7)
  ```
- [ ] `npm test -- --run tests/api/details.spec.ts` ausführen und Verlust der
  neuen Werte beziehungsweise fehlenden Clientweg belegen.
- [ ] `/fields` und Details an derselben API-Grenze prüfen. Unbekannte additive
  Felder ignorieren. Ungültige Zusatzwerte dürfen gültige Core-Kurse nicht
  unbrauchbar machen; keine Ersatzwährung verwenden.
- [ ] Mapper erhalten sämtliche gültigen Wertmetadaten. Speichern, Einzel- und
  Sammelrefresh sowie erneutes Laden mit fake-indexeddb prüfen. Ein fehlender
  Detailblock erzwingt keine Datenmigration und wird nicht als leer behauptet.

## 2. Projektion und Sitzungskatalog

Neue Dateien: `src/domain/detailFields.ts`, `src/stores/fields.ts`.
Tests: `tests/domain/detailFields.spec.ts`, `tests/stores/fields.spec.ts`.

`projectDetailFields(quote, definitions, visibleKeys, locale)` liefert
Feldschlüssel, Label, formatierten Wert und Herkunft. Der Store lädt den
Katalog beim Öffnen und nach einer neuen Kursantwort; gleichzeitige Anfragen
werden zusammengefasst. Ein Adresswechsel verwirft die alte Zuordnung, ein
Fehler betrifft ausschließlich Zusatzinformationen.

- [ ] Rote Projektionstests: 0, false, null, zwei gleich beschriftete Namespaces,
  Typ-/Identitätsanwendbarkeit, Labelrückfälle, wirksamer versus manueller Wert,
  Prozentmaßstab und Betrag mit eigener Währung.
  ```ts
  expect(projectDetailFields(quote, definitions, ['risk-a.score'], 'de')
    .map(field => field.key)).not.toContain('risk-a.score')
  ```
- [ ] Nur definierte, anwendbare Felder darstellen; vollständige Feldnamen
  erhalten. TER und Volatilität mit derselben Projektion darstellen, bei
  fehlendem Katalog mit ihren bekannten Core-Definitionen.
- [ ] Sitzungsspeicher, Fehlerfall, paralleles Öffnen und Adresswechsel prüfen.
  Keine Definitionen in IndexedDB und keine FX-Anfrage durch die Darstellung.

## 3. Oberfläche, Sichtprüfung und Übergabe

Neue Komponente: `src/components/PositionDetailFields.vue`.
Änderungen: `src/components/PositionsTable.vue`, `PositionDrilldown.vue`,
gegebenenfalls `PositionCard.vue`, `src/i18n/de.ts`, `src/i18n/en.ts`.
Tests: `tests/components/detailFields.spec.ts`.

- [ ] Rote Komponententests für die tatsächliche Tabellen-/Drilldown-Verbindung.
  Die Spaltenkonfiguration trägt kanonische Feldschlüssel; ihre gerenderten
  Spalten erzeugen die Ausschlussmenge. Eine optionale programmatische
  `detailColumns`-Konfiguration erlaubt die Gegenprobe mit dynamischen Spalten,
  ohne einen Benutzereditor einzuführen.
- [ ] Dynamisches Feld zur Hauptzeile hinzufügen und entfernen; nur tatsächlich
  dargestellte Felder ausschließen. Kern-TER/-Volatilität nicht doppelt zeigen.
- [ ] Alle Werte ausschließlich als Text darstellen. Fehlender Katalog und noch
  nicht geladene Detailwerte bekommen verständliche Hinweise; bestehende
  Kernanzeige und Rechnung bleiben verfügbar.
- [ ] Die StockInfo-Testumgebung aus T-39 mit echten Felddefinitionen und
  Detailwerten erweitern; ihre Produktdateien unverändert lassen. Browserprüfung
  mit mindestens einem neuen Pluginfeld und einem 100-USD-Wert bei EUR-Kurs.
- [ ] `make test`, `make lint`, `make typecheck`, `git diff --check` und
  Doku-Abgleich ausführen. Eigene Übergabefassung getrennt vom gemeinsamen
  Arbeitsbaum prüfen, committen und im Board an Claude übergeben.
