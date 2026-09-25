# T-43 Positionsdetails Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eine geöffnete Position zeigt jeweils Bewertung, Kursverlauf, Informationen oder Zusatzinformationen; Bearbeiten öffnet einen Dialog.

**Architecture:** `PositionReadDetails.vue` enthält die vier Lesebereiche und verwendet `PositionDetailFields.vue` aus T-40. `PositionDrilldown.vue` behält Desktop-Aktionen und öffnet das Bearbeitungsformular in einem Dialog; `PositionCard.vue` nutzt dieselben Lesebereiche mobil. Der große `PriceChart` wird nur im gewählten Kursverlauf gemountet. Die kleine Tabellenlinie bleibt davon unabhängig.

**Tech Stack:** Vue 3, TypeScript, Naive UI, vue-i18n, Vitest.

**Spec:** `_tickets/30-doing/T-43-positionsdetails-ordnen.md`.

## Global Constraints

- Nur T-43 ist aktiv; T-44 folgt später.
- T-40-Feldprojektion, Originalwährung, Metadaten und Dublettenabgleich bleiben erhalten.
- Keine neue StockInfo-Route, Berechnung, Speicherung oder mobile Bearbeitung.
- Alle sichtbaren Texte stehen in `src/i18n/de.ts` und `src/i18n/en.ts`.
- Die bestehende Tabellenlinie darf ihre kurzen Verlaufsdaten weiter laden; der große Chart und sein `3m`-Abruf kommen erst im Bereich „Kursverlauf“.

## Review Focus

- Eine Cash-Position bietet keinen leeren Kursverlauf.
- Eine Position ohne Kurs zeigt den Kursfehler im Kopf und keinen falsch beschrifteten Chart.
- Zusatzwerte bleiben bei dynamischen Hauptspalten ausgeschlossen und erscheinen mobil mit Originalwährung.
- Das Bearbeitungsformular speichert mit „Speichern“; Abbrechen und X verwerfen den Entwurf. Löschen verlangt eine Bestätigung.
- Bereichswechsel ändern weder Position noch Kurs und laden den großen Chart erst bei Bedarf.

### Task 1: Lesebereiche am Desktop

**Files:** `src/components/PositionReadDetails.vue` (neu), `src/components/PositionDrilldown.vue`, `src/i18n/de.ts`, `src/i18n/en.ts`, `tests/components/positionReadDetails.spec.ts` (neu), `tests/components/detailFields.spec.ts`.

**Interfaces:** `PositionReadDetails` erhält `row: PositionResult`, `links: ExternalLink[]`, `visibleStockInfoFields?: readonly string[]` und nutzt `PriceChart` und `PositionDetailFields` unverändert.

- [x] Test: Bewertung ist zuerst sichtbar, Wechsel zeigt genau einen Bereich, Cash bietet keinen Verlauf.
- [x] Red: `npx vitest run tests/components/positionReadDetails.spec.ts` scheitert am fehlenden Bereich.
- [x] Implementierung: Lesebereiche und Katalogtexte; `PriceChart` nur bei gewähltem Verlauf mounten.
- [x] Green: betroffene Komponententests bestehen.
- [x] Gegenprobe: dynamische Hauptspalte unterdrückt dasselbe Detailfeld weiterhin.

### Task 2: Bearbeiten vom Lesen trennen

**Files:** `src/components/PositionDrilldown.vue`, `tests/components/positionDrilldownRefresh.spec.ts`, `tests/components/positionReadDetails.spec.ts`.

**Interfaces:** Bestehende `update`, `remove`, `refresh`-Events und `refreshing`-Prop bleiben erhalten. Das Formular öffnet als Dialog über „Position bearbeiten“ und meldet den Entwurf erst mit „Speichern“ als ein Update.

- [x] Test: Formular ist zunächst geschlossen; Abbrechen verwirft, Speichern übernimmt; Neuladen bleibt am Kurs, Löschen bestätigt.
- [x] Red: gezielte Tests scheitern an der bisherigen immer sichtbaren Form.
- [x] Implementierung: kompakter Kopf, Auswahl darunter und Bearbeitungsdialog.
- [x] Green: gezielte Tests und bestehende Refresh-Tests bestehen.

### Task 3: Mobile Lesebereiche und Dokumentation

**Files:** `src/components/PositionCard.vue`, `src/components/PositionCardList.vue` falls für Verweise nötig, `src/views/DashboardView.vue` falls für Props nötig, `tests/components/detailFields.spec.ts`, `tests/components/quoteContract.spec.ts`, `README.md`, `docs/images/drilldown.png`, T-43-Ticket.

**Interfaces:** Die mobile Positionskarte verwendet dieselben `PositionReadDetails`-Bereiche; Bearbeiten bleibt Desktop-Sache.

- [x] Test: Mobile Bereiche sind erreichbar; Zusatzwerte und Originalwährung bleiben unter „Zusatzinformationen“ sichtbar.
- [x] Red: gezielter Test scheitert am bisherigen einzelnen Zusatzknopf.
- [x] Implementierung: Karte mit Lesebereichen verbinden; Verweise bei Bedarf vom Dashboard durchreichen.
- [x] Green: betroffene Komponententests bestehen.
- [x] Doku: README-Abschnitte „Position information“, „Price history“ und „Mobile“ aktualisieren; veraltetes Drilldown-Bild aus dem README entfernen.
- [x] Übergabe: `make test`, `make lint`, `make typecheck`; Ergebnisse, Browserbefund, Lessons und Doku-Abgleich im Ticket festhalten.
