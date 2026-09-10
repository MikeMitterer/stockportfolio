# T-04 · StockInfo-API-Client + typisierte Response-Modelle

| Repo | Status | Time-box | Scope | GH-Issue |
|---|---|---|---|---|
| root | done | ~1 h | API-Layer + Composable (kein UI-Umbau) | — |

**Löst:** Ersetzt die Mock-Kurse durch echte Daten aus
`https://stockinfo.int.mikemitterer.at`. Typisierter Client (aus dem
OpenAPI-Schema abgeleitet), Fehlerbehandlung mit `ApiError`, Mapping von
`QuoteResponse` → `QuoteCacheEntry`, Concurrency-begrenztes Bulk-Refresh
und ein `useQuotes`-Composable für die Views.

---

## Verify

Legende: ✅ live bestätigt · ⚠️ bestätigt mit Einschränkung (Fußnote) ·
◑ teilweise (Fußnote) · ➖ keine Live-Verifikation (nur Unit/Review).

| # | Where | Look for | AI | Human |
|---|---|---|:--:|---|
| 1 | `src/api/types.ts` | Typen aus OpenAPI: `QuoteResponse`, `InstrumentSummary`, `DailyPoint`, `QuotePoint`, `HealthResponse`, `RefreshResult`, `Period`; nullable-Felder als `\| null` | ✅¹ | |
| 2 | `src/api/errors.ts` | `ApiError` mit `status`, `detail`, `url`; `isNetworkError` (status 0) und `isNotFound` (404) | ✅² | |
| 3 | `src/api/client.ts` | `StockInfoClient` mit `getInstruments`, `getQuoteByIsin`, `getQuoteBySymbol`, `getDailyHistory`, `getQuoteHistory`, `refreshByIsin`, `health`; Base-URL **und** `fetch` injiziert (DI) | ✅² | |
| 4 | `src/api/mappers.ts` | `toQuoteCacheEntry`, `instrumentToQuoteCacheEntry`, `cacheKeyOf` — snake_case → camelCase | ✅² | |
| 5 | `src/composables/useQuotes.ts` | Concurrency-Limit 6, `loading`/`failures`/`lastRefreshAt`-Refs, Teilfehler brechen den Rest nicht ab, Cash + disabled übersprungen | ✅² | |
| 6 | `tests/api/mappers.spec.ts` | 11 Tests: vollständige Response, minimale Response (nur required), null-Felder, Währungs-Fallback-Kette | ✅² | |
| 7 | `tests/composables/useQuotes.spec.ts` | 14 Tests mit gemocktem Client: Erfolg, Teilfehler (1 von 3), Cash übersprungen, disabled übersprungen, Symbol-Fallback ohne ISIN, Concurrency-Peak ≤ 6, `refreshOne` isoliert | ✅² | |
| 8 | `npm run test` | **110 / 110 Tests grün** (54 rebalancing + 19 formatters + 14 useQuotes + 11 client + 11 mappers + 1 smoke) | ✅² | |
| 9 | `npm run typecheck` / `npm run build` | Beide grün; Bundle: `index` 22,8 kB (gzip 9,3 kB), `vendor-ui` 549 kB (gzip 150 kB) | ✅² | |
| 10 | Dashboard (Dev-Server) | Echte Kurse statt Mock-Preise; Refresh-Button lädt neu; „vor X Min."-Anzeige in der Topbar | ◑³ | |

> ¹ **(CC):** Gegen das Live-OpenAPI-Schema (Version 0.5.0) abgeglichen.
> ² **(CC):** Lokal ausgeführt (2026-08-07) — `npm run typecheck`, `npm run test` (110/110), `npm run build` alle grün.
> ³ **(CC):** Der **API-Pfad** ist live verifiziert: alle 8 Portfolio-ISINs liefern via `curl` echte EUR-Kurse (VGWL 162,92 · EQQQ 625,20 · BRYN 452,85 · CEBL 252,55 · CEMS 14,16 · IUSN 9,18 · IS3M 101,11 · 4GLD 120,50), kein `stale`-Flag, keine Nicht-EUR-Währung. Die **UI-Darstellung** dieser Kurse habe ich nicht selbst im Browser gesehen (der Dev-Server läuft beim User) — daher ◑ statt ✅. Bitte im Browser gegenprüfen: Kurse ≠ Mock-Werte, Refresh-Button aktualisiert, Topbar zeigt „gerade eben".

---

## Details

### Kontext / Ziel
Der API-Layer ist die einzige Stelle, die HTTP kennt. Domain und UI bleiben
davon unberührt (`QuoteCacheEntry` ist die Grenze). Das Composable kapselt
Reactive-State und Fehlerbehandlung, damit Komponenten keinen `fetch` sehen.

### API-Fakten (live geprüft, 2026-08-07)
- `GET /quote/{isin}` → `QuoteResponse` (price, currency, volatility, ter,
  accumulating, name, cached, stale, fetched_at, quote_time)
- `GET /instruments` → `InstrumentSummary[]` (aktuell 8 Papiere)
- `GET /quote/{isin}/daily?period=1w|1m|3m|1y|max` → `DailyPoint[]`
- `GET /health` → `{status, version}`
- Unbekannte ISIN → **HTTP 404** mit `{"detail": "Keine Auflösung für ISIN ..."}`
- CORS: `Access-Control-Allow-Origin: http://localhost:5173` wird korrekt
  gespiegelt, Preflight (OPTIONS) antwortet 204

### Akzeptanzkriterien
- [ ] `src/api/types.ts`, `errors.ts`, `client.ts`, `mappers.ts`
- [ ] `src/composables/useQuotes.ts` mit Concurrency-Limit
- [ ] Client via `provide/inject` bereitgestellt (DI, testbar)
- [ ] Mock-Kurse aus dem Dashboard entfernt; Portfolio-Mock bleibt
      (Positionen kommen erst in T-05 aus IndexedDB)
- [ ] Tests für Mapper + Composable
- [ ] Ticket-Close + Commit

### Side-Effects
- Dashboard lädt beim Mount echte Kurse → Netzwerk-Abhängigkeit im Dev
- `.env` muss `VITE_STOCKINFO_API_URL` gesetzt haben (Fallback im Code)

### Offene Punkte für später
- **CORS beim Deploy:** Die API spiegelt aktuell `localhost:5173`. Wenn die
  App unter einer anderen Origin läuft (Docker/Nginx, T-13), muss die
  StockInfo-API diese Origin ebenfalls erlauben. Prüfen bevor T-13 schließt.

### Auflösung
Commit folgt nach Close.

**Struktur:**
- `src/api/types.ts` — OpenAPI-Typen, snake_case wie die API liefert
- `src/api/errors.ts` — `ApiError` als einziger Fehlertyp nach außen
- `src/api/client.ts` — `StockInfoClient`; `fetch` ist injizierbar, daher
  ohne Netzwerk testbar. `apiBaseUrl()` + `STOCK_INFO_CLIENT`-Symbol für DI.
- `src/api/mappers.ts` — die Grenze API ↔ Domain
- `src/composables/useQuotes.ts` — Reactive-State + `mapWithConcurrency`
  (Worker-Pool statt Batch-Chunks: kein Warten auf den langsamsten je Batch)
- `src/composables/useSharedQuotes.ts` — eine modulweite Instanz, damit
  Topbar und Dashboard denselben State sehen
- `src/composables/useRelativeTime.ts` — „vor 12 Min"-Formatierung

**Entscheidung — geteilte Instanz statt prop-drilling:** Der Refresh-Button
sitzt in der Topbar (`App.vue`), die Tabelle im Dashboard. Statt Events durch
den Router zu reichen, gibt es genau eine `useQuotes`-Instanz auf Modulebene.
Das ist bewusst die Struktur, die T-05 zum Pinia-Store macht — die
Aufrufer-Schnittstelle bleibt dabei identisch.

**Was noch am Mock hängt:** Die **Positionen** (`MOCK_PORTFOLIO`) kommen
weiterhin aus dem Mock — das löst T-05 mit IndexedDB. `MOCK_QUOTES` wird vom
Dashboard nicht mehr gelesen, bleibt aber als Test-/Offline-Fixture liegen.

**Für T-13 vormerken:** CORS. Die API spiegelt aktuell `http://localhost:5173`
in `Access-Control-Allow-Origin` (Preflight antwortet 204, mit
`Allow-Credentials: true`). Läuft die App später unter einer anderen Origin
(Docker/Nginx), muss die StockInfo-Seite diese Origin ebenfalls erlauben,
sonst schlagen alle Kursabfragen im Browser fehl — im Node/curl-Test fällt das
nicht auf, weil CORS nur der Browser durchsetzt.
