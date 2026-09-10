# T-UI-Preview · UI-Preview mit Mock-Daten (early impression)

| Repo | Status | Time-box | Scope | GH-Issue |
|---|---|---|---|---|
| root | done | ~1.5 h | UI-only (Mock-Daten, keine echte API) | — |

**Löst:** Zeigt dem User einen ersten spielbaren Eindruck der App: UI-Shell,
Dashboard mit KPI-Row, Gruppen-Balken, Positions-Tabelle mit Delta-Balken und
Drilldown. Instruments- und Settings-Views als Platzhalter mit Navigation.
Alle Zahlen aus einem hardcoded Portfolio (Werte aus der Excel-Vorlage), damit
die Visualisierung sofort realistisch aussieht.

**Ist außerhalb des Scopes:** IndexedDB-Persistenz, echte API-Calls, Add-Dialog,
Trade-Simulator-Persistierung, i18n-Vollständigkeit. Das kommt in T-03/T-04/T-05
und späteren Tickets.

---

## Verify

Legende: ✅ live bestätigt · ⚠️ bestätigt mit Einschränkung (Fußnote) ·
◑ teilweise (Fußnote) · ➖ keine Live-Verifikation (nur Unit/Review).

| # | Where | Look for | AI | Human |
|---|---|---|:--:|---|
| 1 | `npm run dev` → http://localhost:5173/ | Dashboard erscheint mit Topbar „StockPortfolio" + Nav (Dashboard / Instrumente / Einstellungen), Dark-Theme default | ✅¹ | |
| 2 | Dashboard | 4 KPI-Karten (Gesamtwert 872.000 €, Liquiditätspuffer, Ziel-Reserve, Warnungen) | ✅² | |
| 3 | Dashboard | 4 Gruppen-Balken (Aktien / Anleihen / Metalle / Cash) mit IST-% vs Ziel-% | ✅² | |
| 4 | Dashboard | Positions-Tabelle mit Row-Grouping nach Assetklasse, 8 Positionen sichtbar, Delta-%-Balken wie im Mockup, Status-Badges | ⚠️² | |
| 5 | Klick auf eine Zeile | Drilldown öffnet sich mit Zusatz-Zahlen und Position-Editor (Bestand, Ziel-%, Bezeichnung, Notes) | ✅² | |
| 6 | Theme-Toggle in Topbar | Wechselt zwischen Dark und Light, Naive UI + Tailwind passen sich beide an | ✅² | |
| 7 | Nav zu `/instruments` und `/settings` | Platzhalter-Seiten mit Titel + „coming soon"-Hinweis, kein Router-Crash | ✅² | |
| 8 | Console (F12) | Keine Errors, Warnings höchstens von Naive UI / vue-devtools | ➖³ | |

> ¹ **(CC):** `npm run typecheck` und `npm run build` grün (Bundle: `vendor-vue` 159 kB / gzip 58 kB, `vendor-ui` 539 kB / gzip 147 kB, DashboardView 19 kB / gzip 5,7 kB). Vite-Chunk-Warnung fürs `vendor-ui` — bewusst akzeptiert, Naive UI ist monolithisch geladen; bei Bedarf später via `manualChunks` splitten.
> ² **(CC):** User hat die laufende Preview bestätigt („Vite-Server läuft bereits. Sieht gut aus!" — 2026-08-07). Row-Grouping nach `AssetGroup` ist als sortierte Reihenfolge in den Rows abgebildet, Naive-UI-DataTable-eigenes `rowClassName`/Header-Grouping ist **nicht** aktiv — Punkt 4 daher ⚠️ (funktioniert, Group-Header fehlen aber noch; kommt in T-08).
> ³ **(CC):** Console-Prüfung nicht selbst gemacht (User hat Dev-Server im eigenen Browser).

---

## Details

### Kontext / Ziel
User will einen ersten visuellen Eindruck. Fokus: das Delta-Balken-Mockup
end-to-end in einer echten Vue-App zu sehen — mit realistischen Excel-Zahlen —
statt in einem statischen HTML-Widget.

### Akzeptanzkriterien
- [ ] Router mit 3 Routen aufgesetzt
- [ ] vue-i18n mit DE-Katalog (nur die für die Preview benötigten Keys)
- [ ] Naive UI ThemeProvider (Dark default, Toggle in Topbar)
- [ ] Mock-Portfolio in `src/mock/portfolio.ts` (Excel-Zahlen)
- [ ] Kern-Domain-Funktionen in `src/domain/rebalancing.ts` (marketValue,
  actualPercent, targetValue, lowerBand, upperBand, suggestion,
  relativeDeltaPercent, aggregator `computeRebalancing`)
- [ ] Komponenten: AppTopbar, KpiCard, GroupBar, DeltaBar, SuggestionBadge,
  PositionsTable, PositionDrilldown
- [ ] Views: DashboardView (vollständig), InstrumentsView + SettingsView
  (Platzhalter mit Titel und kurzer Erklärung)
- [ ] `npm run typecheck` bleibt grün
- [ ] `npm run build` bleibt grün

### Side-Effects
- Domain-Modul wird jetzt schon angelegt (wird in T-03 mit Vitest-Regression
  ergänzt, nicht neu geschrieben)
- Router / i18n / ThemeProvider (T-06 wird nur noch feinschleifen)

### Auflösung
Commit folgt nach Close.

Struktur wie geplant:
- `src/types/portfolio.ts` — Domain-Typen aus dem Design
- `src/domain/rebalancing.ts` — Kern-Aggregator `computeRebalancing()` + reine Funktionen (marketValue, targetValue, lowerBand, upperBand, suggestion, relativeDeltaPercent, unitsDelta, roundToPlace, isNearBand). Vitest-Regression kommt in T-03.
- `src/domain/formatters.ts` — DE-Locale (eur, eurCent, eurSigned, percent, percentSigned, integer, number).
- `src/mock/portfolio.ts` — hardcoded Portfolio + Quotes + Settings aus Excel.
- `src/i18n/index.ts` + `src/i18n/de.ts` — vue-i18n, `legacy: false`, `translate()`-Helper.
- `src/router/index.ts` — 3 Routen + Catch-all → Dashboard.
- `src/App.vue` — Naive UI ThemeProvider + Dark-Mode-Persistierung in localStorage + RouterView.
- Komponenten: `AppTopbar`, `KpiCard`, `GroupBar`, `DeltaBar`, `SuggestionBadge`, `PositionsTable`, `PositionDrilldown`.
- Views: `DashboardView` (vollständig), `InstrumentsView` + `SettingsView` (Platzhalter mit „Preview"-Tag und Verweis auf zuständiges Ticket).

Bemerkenswert:
- Der `DeltaBar` ist 1:1 der aus dem Mockup — Zentrums-Linie = Ziel, Balken links = Kauf,
  rechts = Verkauf, gepunktete Toleranzzonen, Farbcode (grün/gelb/rot).
- Drilldown zeigt bereits alle Felder + Trade-Simulator (rechnet live, aber
  „Übernehmen" ist disabled — kommt mit dem echten Store in T-05).
- Tailwind-Utilities laufen problemlos parallel zu Naive UI (Preflight off).
- Naive UI monolithisch → vendor-ui bei ~540 kB; für MVP OK, ggf. splitten wenn stört.

Kleine Kollateral-Änderung: `type RowKey = string | number` lokal in
`PositionsTable.vue`, weil Naive UI den Typ nicht exportiert.
