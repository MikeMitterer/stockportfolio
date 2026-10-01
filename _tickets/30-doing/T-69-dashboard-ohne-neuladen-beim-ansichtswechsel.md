# T-69 · Dashboard ohne Neuladen beim Ansichtswechsel

**Warum dieses Ticket:** Wer vom Dashboard zu Rebalancing und wieder zurück
wechselt, wartet jedes Mal, bis die Tabelle wieder erscheint. Kurse, Depot und
Einstellungen sind zu diesem Zeitpunkt längst geladen; der Wechsel zwischen
Ansichten soll sofort den vorhandenen Stand zeigen.

**Beispiel:** Dashboard öffnen, auf Rebalancing klicken, zurück auf Dashboard.
Bisher: Ladeanzeige, bis Depot, Einstellungen, Health-Check und Devisenkurse
erneut über das Netz beantwortet sind. Danach: Die Tabelle steht sofort mit
den zwischengespeicherten Werten; eine Aktualisierung läuft nur, wenn die
eingestellte Schonfrist abgelaufen ist, und dann im Hintergrund.

**Stand:** Umgesetzt in `f8bbe20` auf `t-69-dashboard-ohne-neuladen` und an
`codex-verifier` zur Prüfung übergeben. Beim Zurückwechseln stellt das Dashboard
im sichtbaren Browsertest keine Anfrage mehr an Konto-API oder StockInfo.
Mike, 2026-10-01: „Kurse können gecached werden.“

Für dich steht jetzt nichts an. Nach der technischen Freigabe kannst du den
Wechsel mit deinem `make dev` gegen die gehostete StockInfo-Instanz prüfen
([Prüfpunkt 1](#pruefpunkt-1)).

## Ursache (Codeanalyse, 2026-10-01)

Die Kurse selbst sind schon zwischengespeichert: `quotesStore.hydrate()` liest
den Cache, `loadQuotesIfStale` lädt nur nach Ablauf der Schonfrist. Gewartet
wird an anderer Stelle. `DashboardView.vue` setzt `initialLoading` erst am
Ende von `onMounted` zurück und blendet bis dahin die Tabelle aus (`ready`).
Davor wartet die Ansicht bei jedem Aufbau auf:

1. `portfolioStore.load()` — immer, auch wenn `loaded` schon gilt; seit T-61
   ein REST-Abruf beim Konto-API, dazu ein zweiter Abruf der Einstellungen.
2. `settingsStore.load()` — immer, ebenfalls REST.
3. `loadFx()` — `fxStore.load` fragt StockInfo bei jedem Aufruf neu, auch wenn
   der Kurs in dieser Sitzung schon vorliegt.

`RebalancingView.vue` prüft dagegen `loaded` vor dem Laden. Der Health-Check
(`ensureChecked` mit Schonfrist) ist bereits gecacht.

Bei der Umsetzung kamen zwei weitere Ursachen dazu:

4. `valueHistory.load()` leerte bei jedem Aufbau die Tageswerte und holte
   `/api/data/snapshots/…` neu (im Hintergrund, das Diagramm lud neu).
5. `loadQuotesIfStale` lud innerhalb der Schonfrist **alle** Kurse neu, sobald
   auch nur einer Position der Kurs fehlte — etwa einem Papier, dessen Abruf
   dauerhaft scheitert. Das passt genau zu „Kurse werden wieder geladen“ und
   blockierte die Tabelle bis zum Ende des Durchgangs.

## Umsetzung und technische Nachweise

| Repo | Time-box | Scope | GH-Issue |
|---|---|---|---|
| root (`frontend/`) | 2–3 h | Dashboard-Aufbau, `fx`-Store, Tests | — |

### Verify

Lauf „Teststack“: `scripts/stockinfo-test-server.py --stack --run --demo-accounts`
aus dem Root, sichtbares Chrome (80 px links, 50:50), Skript
`t69-switch.mjs` (siehe unten). Lauf „Unit“: `make test`.

Legende: ✅ live bestätigt · ⚠️ bestätigt mit Einschränkung (Fußnote) ·
◑ teilweise (Fußnote) · ➖ keine Live-Verifikation (nur Unit/Review).

| # | Lauf | Handgriff | Nachweis | woher | AI |
|---|:--:|---|---|---|:--:|
| 1 | Teststack | <a id="pruefpunkt-1"></a>Dashboard → Rebalancing → Dashboard innerhalb der Schonfrist, drei Runden | Tabelle sichtbar nach 274–293 ms (inkl. 200 ms `slowMo`); **keine** Anfrage an `/api/data/*` oder StockInfo. Vorher je Runde 3× `portfolio`, 2× `settings/current`, 1× `snapshots` | Mike | ⚠️¹ |
| 2 | Unit | <a id="pruefpunkt-2"></a>Abgelaufene Schonfrist bzw. ein fehlender Kurs, Abruf hängt | Tabelle steht mit gecachten Werten, Abruf läuft dahinter; innerhalb der Frist nur der fehlende Kurs | Schonfrist T-33 | ➖² |
| 3 | Unit | <a id="pruefpunkt-3"></a>Zweiter Aufbau, FX-Wiederverwendung, Tageswerte, fehlende Kurse | Kein erneuter Repository-, `getFx`- oder Kursabruf bei gültigem Stand; Gegenprobe ohne Änderung rot | Ursache 1–5 | ✅ |
| 4 | Teststack | <a id="pruefpunkt-4"></a>Zweites Fenster benennt das Verrechnungskonto um, während das erste auf Rebalancing steht | Nach Rückkehr zeigt das erste Dashboard den neuen Namen (SSE aus T-62) | T-62 | ✅ |

¹ Lokal antworten Konto-API und Teststack sofort; die alte Fassung brauchte im
selben Lauf ebenfalls nur 259–263 ms. Der Gewinn liegt in den entfallenen
Anfragen; die spürbare Zeit bei gehosteter StockInfo und Devisenkursen misst
erst Mikes Prüfung. Das Testdepot ist in EUR, ein FX-Abruf kommt darin nicht vor.
² Im Browser nicht nachgestellt (Schonfrist 60 min); abgedeckt durch
`dashboardRemount.spec.ts` und `quotes.spec.ts`.

### Akzeptanzkriterien

- [x] Der Ansichtswechsel lädt Depot, Einstellungen und Tageswerte nicht neu, wenn sie geladen sind.
- [x] Devisenkurse werden zum selben Kursstand wiederverwendet; neue Kurse oder „Erneut versuchen“ holen sie neu.
- [x] Netzabrufe nach der Schonfrist oder für einzelne fehlende Kurse blockieren die Anzeige nicht, sobald Kurse im Cache liegen.
- [x] Live-Abgleich über SSE liefert weiterhin den aktuellen Stand; Depotwechsel lädt die Tageswerte des neuen Depots.

### Side-Effects

Depotwechsel, Kontowechsel und SSE-Benachrichtigungen setzen den Stand neu;
diese Wege müssen den Cache weiterhin ersetzen. StockInfo bleibt unverändert.

## Coder-Übergabe · Runde 1 · claude-coder · 2026-10-01

**Prüfstand:** `f8bbe2040d771f150a307cfa4ed88d82fcd33396` gegen `1b6a49e`
(`master` mit T-66 und T-67), Branch `t-69-dashboard-ohne-neuladen`.

**Änderung:**

- `DashboardView.vue`: Depot und Einstellungen nur laden, wenn `loaded` fehlt
  (wie Rebalancing, Einstellungen, Assets). An- und Abmelden laden die Seite
  neu (`AuthRoot.vue`, `App.vue`), die Stores beginnen dann leer. Liegt für
  eine Depotposition ein Kurs im Cache, wird die Tabelle vor Health-Check und
  Kursabruf sichtbar; die Reihenfolge für den Tageswert bleibt.
- `stores/fx.ts`: optionaler `sourceStamp`; ein fehlerfreier Kurs zum selben
  Stand wird wiederverwendet. `usePortfolioValuation` bildet den Stempel aus
  allen `fetchedAt` der Kurse je Währung und bietet `retryFx` für „Erneut
  versuchen“ (lädt immer). Beide Ansichten verwenden `retryFx`.
- `stores/valueHistory.ts`: `ensure()` lädt nur bei anderem Depot oder anderer
  Währung; der Live-Abgleich ruft weiter `load()`.
- `stores/quotes.ts`: innerhalb der Schonfrist `loadMissing()` statt vollem
  Durchgang; andere Kurse, ihre Ausfälle und `lastRefreshAt` bleiben.

**Belege:** `make test` 845 Frontend- und 20 API-Tests grün; Lint und
Typecheck für `frontend` und `api` ohne Befund. Neue Tests:
`tests/views/dashboardRemount.spec.ts` (3), je einer in `fx.spec.ts`,
`valueHistoryCurrency.spec.ts` und `quotes.spec.ts`; jede Gegenprobe mit der
alten Fassung rot. `portfolioCurrency.spec.ts` verwendet jetzt `retryFx`, weil
der Wiederholen-Knopf einen veralteten Kurs ohne Fehler neu holen muss.
Sichtbarer Browsertest siehe Verify; Teststack danach gestoppt.

Browserskript zum Nachstellen (Teststack mit `--demo-accounts` vorher starten):
`node /private/tmp/claude-501/-Volumes-DevLocal-DevWeb-Production-StockPortfolio/7fcbb43b-ff4a-4ae1-87e1-2549374318e7/scratchpad/t69-switch.mjs <Testverzeichnis>/demo-accounts.json`.
Es meldet je Runde Zeit und Anfragen an `:8899` und `/api/data`.

**Doku-Abgleich:** `README.md`, `docker/README.md`, `unraid/README.md` und
`docs/` beschreiben das Laden beim Ansichtswechsel nicht; unverändert. Der
Einstellungshinweis „Kurse gelten als alt nach“ (`de`/`en`) bleibt zutreffend:
Jüngere Kurse werden nicht neu geholt, fehlende wie bisher schon.

**Lessons:** CLAUDE-LESSONS gelesen; SI-P-04/08 angewendet (Gegenprobe je
Test), SP-CL-01 (Branch im Root). Keine neue Lesson.
