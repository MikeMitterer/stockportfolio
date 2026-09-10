# T-39: StockInfo-Vertrag — Implementation Plan

> Ausführung im bestehenden Codex-Chat mit `superpowers:executing-plans`,
> testweise pro Arbeitsschritt. Der unabhängige Review erfolgt durch die
> im Board zugeordnete Instanz `claude`.

**Goal:** Identität und Kurs-Pflichtfelder einmal an der API-Grenze prüfen;
alle Abrufwege und Verbraucher erhalten dieselben normalisierten Daten.

**Architecture:** Der HTTP-Client übergibt JSON als `unknown` an Normalisierer
in `src/api/normalizers.ts`. Diese liefern die bisherigen konsumierbaren
Felder einschließlich einer aus `identity` abgeleiteten ISIN und erhalten
die vollständige Identität. Mapper übernehmen ausschließlich geprüfte
Kurswährungen. Ungültige Antworten werden als verständliche API-Fehler
sichtbar; vorhandene Kurse bleiben beim Abruffehler höchstens veraltet.

**Tech Stack:** Vue 3, TypeScript, Pinia, Vitest, injiziertes Fetch,
fake-indexeddb. Keine neue Laufzeitabhängigkeit.

**Spec:** [T-39](../../../_tickets/30-doing/T-39-identitaet-normalisieren.md)
und [Integrationsvorschlag](../../stockinfo-integration-proposal.md).

## Grenzen

- Branch `t-39-identitaet-normalisieren`; vorgefundene fremde Änderungen erhalten.
- Kein Zugriff auf echte Depotdaten; Tests verwenden isolierte IndexedDB.
- StockInfo nur lesend als Vertragsquelle; Test-Fixtures im eigenen Repository.
- Keine Migration alter Versionsdaten. Alte Kurscaches dürfen neu aufgebaut werden.
- Sichtbare Fehlertexte DE/EN über bestehendes i18n.
- T-40 übernimmt die Detailanzeige, T-38 Depotwährung und FX, T-35 Generation.

## 1. Vertragsprüfung und gemeinsame Client-Antworten

Dateien: `src/api/types.ts`, neue `src/api/normalizers.ts`, `src/api/client.ts`,
`src/api/mappers.ts`, `src/types/portfolio.ts`, `src/i18n/de.ts`, `src/i18n/en.ts`.
Tests: neue `tests/api/contract.spec.ts`, `tests/fixtures/stockinfo/`, bestehende
`tests/api/client.spec.ts`, `tests/api/mappers.spec.ts`.

Schnittstellen: `normalizeQuote(input: unknown, url: string): QuoteResponse`
und `normalizeInstruments(input: unknown, url: string): InstrumentSummary[]`.
Alle vier Quote-/Refreshmethoden verwenden `normalizeQuote`; der Katalog
verwendet `normalizeInstruments` vor Übergabe an den Instrument-Store.

- [x] Vertragsfixtures für Quote und Katalog aus geprüftem StockInfo-Stand kopieren.
- [x] Failing Tests: `listed`, `listed` ohne ISIN, `pair`, `isin_only` durch
  echte Clientmethoden schicken und Cache-Ergebnis prüfen:

  ```ts
  const response = await client.getQuoteBySymbol('EUNL.DE')
  expect(toQuoteCacheEntry(response).isin).toBe('IE00B4L5Y983')
  expect(response.identity).toEqual(payload.identity)
  ```

- [x] `npm test -- tests/api/contract.spec.ts` ausführen; fehlende
  Normalisierung und akzeptierte ungültige Antworten als rote Fälle belegen.
- [x] Pflichtfelder anhand Core 4.3.0 prüfen: Identität, Symbol, Name, offener
  Typ, endlicher Preis, Kurswährung, Zeitstempel, boolesche Altersflags;
  Katalog zusätzlich Listingkennung, Historienanzahl und Herkunftslisten.
  Optionale bekannte Felder auf passenden Typ oder `null` normalisieren.
  Unbekannte Zusatzfelder beeinflussen die Kernantwort nicht.
- [x] Alle drei Identitätsformen erhalten; unbekannte Formen mit i18n-Fehler
  abweisen. Quote benötigt keine Listingkennung. `409` bleibt erhalten.
- [x] Bei vorhandenem Katalogpreis `latest_currency` verlangen; `GBp`
  unverändert erhalten. EUR-/Instrumentwährungsersatz entfernen.
- [x] Bestehende Testantworten an den neuen Vertrag anpassen und gezielt prüfen.

## 2. Persistenz und Fehlerfolgen

Dateien: `src/db/schema.ts`, `src/stores/quotes.ts`,
`src/domain/rebalancing.ts`; Tests in `tests/stores/quotes.spec.ts`,
`tests/db/repository.spec.ts`, `tests/domain/rebalancing.spec.ts`.

- [x] Failing Test für Einzelrefresh nach gültigem Kurs, gefolgt von
  ungültiger Kursantwort:

  ```ts
  await store.refreshOne(client, position)
  expect(store.quotes.get(position.isin!)?.stale).toBe(true)
  expect((await repository.loadAll()).get(position.isin!)?.stale).toBe(true)
  expect(store.failures[0]?.reason).toContain('currency')
  ```

- [x] Gezielten Testlauf ausführen; bisherigen frischen Altwert nachweisen.
- [x] Fehlerbehandlung setzt vorhandenen Kurs auf `cached: true, stale: true`
  und persistiert ihn. Ohne gültigen Kurs bleibt die Position ausgeschlossen
  und erzeugt keinen Handelsvorschlag.
- [x] Cacheformat erhält vollständige Identität. Alten Quote-Cache beim
  Schemawechsel leeren; Depotpositionen und andere passende Daten erhalten.
- [x] Speichern/Neuladen und Schemawechsel mit fake-indexeddb prüfen.

## 3. Anzeige, Verbraucher und Übergabe

Dateien: `src/components/PositionDrilldown.vue`, gegebenenfalls
`src/components/PositionsTable.vue`, bestehende Anzeige- und Katalogtests,
`README.md`, Ticket und Board.

- [x] Failing Anzeigeprüfung: ohne gültige Kurswährung kein als EUR
  beschriftetes Diagramm; vorhandene Originalwährung bleibt sichtbar.
- [x] Detaildiagramm nur mit bekannter Kurswährung anzeigen; fehlenden Kurs
  verständlich kennzeichnen. Katalogauswahl und Dublettenprüfung mit echtem
  normalisiertem Client-Ergebnis prüfen.
- [x] `make test`, `make lint`, `make typecheck`, `git diff --check` ausführen.
- [x] Prüfnachweise und Cache-Neuaufbau im Ticket dokumentieren, Produktdiff
  getrennt von vorgefundenen fremden Änderungen committen und an `claude`
  zur unabhängigen Prüfung übergeben.

## Ergänzung aus Mikes Sichtprüfung

- [x] Eine neue Depotposition erst nach erfolgreichem eindeutigen Kursabruf
  anlegen. Fehler halten den Dialog offen; bestehende Positionen dürfen bei
  späteren Fehlern weiterhin sichtbar bleiben.
- [x] Börsenlistings im Dialog über die Katalog-Listingkennung unterscheiden.
  Das ändert den Quote-Vertrag nicht; mehrdeutige Symbolabrufe bleiben gesperrt.
- [x] Fehler pro Position dauerhaft anzeigen, veraltete Werte kenntlich machen
  und Fremdwährungswerte auch in Detailansicht und Mobilkarte richtig beschriften.
- [x] Erste Browserprüfung selbst durchführen: echter lokaler StockInfo-Server,
  temporäre Datenbank und kontrollierte Testquelle. Aufbau und Einschränkungen
  stehen in T-39.
