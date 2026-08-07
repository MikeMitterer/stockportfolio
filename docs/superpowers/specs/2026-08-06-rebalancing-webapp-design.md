# Rebalancing-WebApp — Design-Spec

**Status:** Draft (review pending)
**Datum:** 2026-08-06
**Autor:** MM + Claude (Brainstorming-Session)
**Ziel:** Nachbau der Excel-Datei `Rebalancing-v2-Claude.xlsx` als Vue 3 WebApp mit
deutlich besserem UI, Kursen aus der StockInfo-API und späterer Erweiterbarkeit für
Threshold-Notifications.

---

## Übersicht

- [1 — Ziel & Scope](#1--ziel--scope)
- [2 — Excel-Analyse (was wird nachgebaut)](#2--excel-analyse-was-wird-nachgebaut)
- [3 — Tech-Stack & Konventionen](#3--tech-stack--konventionen)
- [4 — Projekt-Layout](#4--projekt-layout)
- [5 — Datenmodell & Persistenz](#5--datenmodell--persistenz)
- [6 — API-Client (StockInfo)](#6--api-client-stockinfo)
- [7 — Rebalancing-Domain-Logik](#7--rebalancing-domain-logik)
- [8 — UI-Konzept](#8--ui-konzept)
- [9 — Docker & Deployment](#9--docker--deployment)
- [10 — Makefile & Scripts](#10--makefile--scripts)
- [11 — Testing](#11--testing)
- [12 — Nicht im MVP](#12--nicht-im-mvp)
- [13 — Offene Punkte / spätere Ausbaustufen](#13--offene-punkte--spätere-ausbaustufen)

---

## 1 — Ziel & Scope

Der User pflegt sein Portfolio derzeit in einer Excel-Datei mit *Tolerance-Band-Rebalancing*:
pro Position gibt es ein Ziel-Prozent und ein Toleranzband (Lower/Upper). Ist der aktuelle
Marktwert außerhalb des Bands, wird *Kaufen* oder *Verkaufen* empfohlen. Die Excel-Datei
zieht Kurse über ein externes Makro (`_FV(...)`) und ist damit an eine Windows-Excel-Instanz
gebunden.

**Was die WebApp bringt:**

- Kurse aus der eigenen [StockInfo-API](https://stockinfo.int.mikemitterer.at) — plattformunabhängig
- deutlich reduziertes, fokussiertes UI (Excel zeigt ~30 Spalten, die App zeigt ~8 mit Drilldown)
- visuelles Feedback pro Position (Delta-Balken mit Bändern)
- konfigurierbare Bänder und Kennzahlen
- persistiert im Browser (IndexedDB), Export/Import als JSON
- Docker-Deploy für Unraid o. ä. (statisch, Nginx-Container)

**Explizit nicht Teil der App (Entscheidungen aus Brainstorming):**

- Trade-Journal / Dokumentation
- Pyramidisieren bei Verlust (3 Strategien)
- Push-Notifications (kommt später als eigener Backend-Cron-Dienst)
- Multi-Currency / FX-Umrechnung
- Multi-Portfolio-Vergleichsansichten

[↑ Übersicht](#übersicht)

---

## 2 — Excel-Analyse (was wird nachgebaut)

Das Analyse-Skript hat folgende Strukturelemente identifiziert:

**Struktur (Sheet „Rebalancing"):**

| Excel-Bereich | Bedeutung | in App? |
|---|---|---|
| I3 `=ROUND(K7+K14+K16+K19,-3)` | Gesamtsumme, auf Tausender gerundet | ✅ |
| G3, L2 | Überschriften | — |
| Zeile 5 | Header (Symbol, ISIN, Bezeichnung, Meldefond, Bestand, Bestand opt., Kurs, Volatilität, Marktwert, IST-%, Target-%, Target Details) | ✅ als Tabellen-Spalten |
| Zeilen 7 / 14 / 16 / 19 | Gruppen-Zeilen: Aktien, Anleihen, Edelmetalle, Cash | ✅ als Gruppen-Balken + Row-Grouping |
| Zeilen 8–13, 15, 17 | Positionen | ✅ |
| G22 / H22 | Lower-Band (6 %) / Upper-Band (15 %) | ✅ in Settings |
| Spalten O–S | pro-Position Band-Berechnungen (Low/Target/High €) | ✅ als Domain-Funktionen |
| Spalte Y | Vorschlag (`Kaufen/Verkaufen/OK`) | ✅ als Status-Badge |
| Spalte Z | Delta Bestand (Stück) | ✅ im Drilldown |
| Spalten AA/AB/AC/AD | manuelle Trade-Simulation | ✅ als inline-Simulator im Drilldown |
| Spalten AE/AF/AG | projizierte Bänder nach Trade | ✅ im Simulator |
| I25 | Save-Asset-Grenze (170.000 €) | ✅ in Settings |
| I26 / I27 | Liquiditäts-Puffer € und % | ✅ als KPI-Karte |
| G29 | Rebalancing-Budget (230.000 €) | ✅ in Settings |
| R26 / R27 / R28 | Ziel-Investitionsreserve % / € / Verkauf-Vorschlag | ✅ als KPI-Karte |
| Zeilen 31–36 | Pyramidisieren bei Verlust (3 Strategien) | ❌ nicht MVP |
| R30 ff. | Dokumentation / Trade-Journal | ❌ nicht MVP |
| E-Spalte `_FV(C…, "Name")` | Instrument-Name von externem Provider | ✅ ersetzt durch `GET /quote/{isin}.name` |
| I-Spalte `_FV(C…, "Preis")` | Kurs | ✅ ersetzt durch `GET /quote/{isin}.price` |
| F-Spalte `HYPERLINK myOEKB` | Meldefond-Check-Link | ✅ als kleines Icon-Link im Drilldown |

**Excel-Zellbezüge / Formeln, die 1:1 als reine TS-Funktionen abgebildet werden:**

```
Excel                                     TS-Domain
────────────────────────────────────────  ─────────────────────────────────────────
K = G*I                                   marketValue(pos, quote)
L = K*100/I3                              actualPercent(pos, total)
R = I3/100 * M                            targetValue(pos, total)
Q = R − R*G22%                            lowerBand(pos, bands)
S = R + R*H22%                            upperBand(pos, bands)
Y = IF(K>S,"Verkaufen",IF(K<Q,"Kaufen","OK"))   suggestion(pos)
Z = U/I*-1                                unitsDelta(pos, quote)
AC = ROUND((G29/100*T)/I, -2)             suggestedTradeUnits(pos, budget, groupPct)
X = IF(R<>0, U*100/R, 100)                relativeDeltaPercent(pos)
AF = ((G-(AA*-1))*I) * 100 / I3           projectedPercentAfterTrade(pos, tradeUnits)
```

Diese Formeln sind die Testgrundlage: die App muss für den Excel-Datensatz exakt
dieselben Ergebnisse liefern.

[↑ Übersicht](#übersicht)

---

## 3 — Tech-Stack & Konventionen

- **Vue 3** (Composition-API, `<script setup lang="ts">`) — keine Options-API
- **Vite** + **TypeScript strict** — kein `any`, explizite Rückgabetypen
- **Pinia** für Store
- **Naive UI** + **Tailwind** — UI-Bibliothek und Utility-CSS
- **vue-i18n** (Composition-Mode, `legacy: false`) — nur DE-Katalog, typisierte Keys via
  `DottedKeys<typeof de>` (Referenz: StockInfo-Dashboard)
- **idb** (thin wrapper) für IndexedDB
- **Vitest** für Unit-Tests (Domain-Modul + Composables)
- **consola** fürs Frontend-Logging
- **Nginx** für Docker-Serve
- **BashLib / MakeLib** für Scripts und Makefile (Konventionen aus `code-standards` und
  `makefile-conventions`)
- **semVerBump** (BashLib `version.lib.sh`) für Version-Bumps, `package.json` ist SoT

**Composables-first:** Business-Logic, API-Aufrufe und Reactive-State in Composables —
Komponenten sind rein präsentational. Reine Berechnungen leben im `domain/`-Modul
(kein DOM, keine Reactivity) und sind ohne Setup unit-testbar.

[↑ Übersicht](#übersicht)

---

## 4 — Projekt-Layout

```
StockPortfolio/
├── .libs/                       # Symlinks (setup-Target legt sie an)
│   ├── BashLib   -> $DEV_BASH/.../BashLib
│   └── MakeLib   -> $DEV_MAKE/.../MakeLib
├── src/
│   ├── main.ts, App.vue
│   ├── api/                     # StockInfo-API-Client (typisiert)
│   │   ├── client.ts            # fetch wrapper, base URL aus env
│   │   ├── types.ts             # aus OpenAPI abgeleitete Typen
│   │   └── endpoints.ts         # quote/, instruments/, health/, refresh/
│   ├── composables/             # useQuoteRefresh, usePortfolio, useRebalancing, useInstruments
│   ├── stores/                  # Pinia — portfolio, settings, instruments, quoteCache
│   ├── domain/                  # reine Berechnungs-Funktionen (unit-testbar)
│   │   ├── rebalancing.ts       # 1:1 aus den Excel-Formeln
│   │   ├── warnings.ts          # detect: stale, non-EUR, target≠100 %, ...
│   │   └── formatters.ts        # €, %, tabular-Zahlen
│   ├── components/              # präsentational — Table, DeltaBar, GroupBar, KpiCard, ...
│   ├── views/                   # DashboardView, InstrumentsView, SettingsView
│   ├── i18n/                    # index.ts, de.ts, types.ts (DottedKeys)
│   ├── router/                  # vue-router, 3 Routen
│   ├── db/                      # IndexedDB via idb — Object-Stores, Migrationen
│   └── types/                   # Domain-Typen (Portfolio, Position, Band, ...)
├── tests/                       # Vitest — mind. domain/*, composables/*
├── docker/
│   ├── Dockerfile               # Multi-Stage: node build → nginx serve
│   ├── build.sh                 # generiert via `docker-build-script`-Skill
│   └── nginx.conf               # SPA-Fallback, Cache, CSP
├── docs/superpowers/specs/      # dieses Dokument
├── scripts/                     # ggf. Hilfs-Scripts (BashLib-Guard-Pattern)
├── Makefile                     # Standard-Header (DEV_MAKE, THEME, precheck, help/…)
├── package.json                 # SoT für Version — start 0.1.0
├── vite.config.ts, tsconfig.json, tailwind.config.ts
├── .env.example                 # VITE_STOCKINFO_API_URL=…
└── .gitignore, README.md
```

**Kein `VERSION`-File** (Konvention: `package.json` ist SoT).

[↑ Übersicht](#übersicht)

---

## 5 — Datenmodell & Persistenz

### Domain-Typen (`src/types/portfolio.ts`)

```typescript
export type AssetGroup = 'stocks' | 'bonds' | 'metals' | 'cash'

export interface Position {
  id: string                     // uuid — stabil, unabhängig von ISIN-Wechsel
  isin: string | null            // null für Cash und für Papiere ohne ISIN
  symbol: string                 // primärer Yahoo-Symbol (z.B. "VGWL.DE"); für Cash "CASH"
  displayName: string            // vom User editierbar, Fallback = API-Name
  group: AssetGroup
  units: number                  // Bestand (Stück; für Cash = Betrag in EUR)
  targetPercent: number          // Ziel-% am Gesamt (z.B. 36 = 36 %)
  enabled: boolean               // ausschließbar; siehe Whitelist unten
  notes?: string
}

// Cash als Position: group='cash', symbol='CASH', isin=null, units = EUR-Betrag.
// Es gibt genau EINE Cash-Position pro Portfolio (im Add-Dialog nicht wählbar,
// wird beim Portfolio-Anlegen automatisch mit units=0 erzeugt).

export interface Portfolio {
  id: string
  name: string                   // z.B. "Hauptdepot"
  positions: Position[]
  createdAt: string              // ISO
  updatedAt: string
}

export interface Bands {
  lowerPercent: number           // z.B. 6
  upperPercent: number           // z.B. 15
}

export interface Settings {
  activePortfolioId: string
  totalRounding: number          // -3 = auf Tausender, wie Excel
  bands: Bands
  saveAssetGrenze: number        // 170_000 (EUR)
  investmentReservePercent: number   // Ziel-Reserve % (Excel R26=10)
  currentRebalancingBudget: number   // Excel G29
  currency: 'EUR'                // fixed für MVP
  refresh: { autoOnLoad: boolean; staleAfterMinutes: number }
  ui: {
    // Sichtbare Zusatzspalten (Sektion-3-Zwischenlösung „C")
    columns: {
      volatility: boolean
      optimalUnits: boolean       // Bestand opt.
      groupSharePercent: boolean  // % in Gruppe
      deltaEuro: boolean
      deltaMax: boolean
      deltaPercentAbs: boolean
    }
  }
}

export interface QuoteCacheEntry {
  isin: string | null
  symbol: string
  price: number
  currency: string               // Warnung wenn ≠ EUR
  volatility: number | null
  name: string | null
  ter: number | null
  accumulating: boolean | null
  fetchedAt: string              // wann von API geholt
  cached: boolean                // API-Feld
  stale: boolean                 // API-Feld
}
```

### Persistenz (IndexedDB via `idb`)

Vier Object-Stores in Datenbank `stockportfolio`:

| Store | Key | Inhalt |
|---|---|---|
| `portfolios` | `id` | `Portfolio` |
| `settings` | fest `'default'` | `Settings` |
| `quoteCache` | `isin \|\| symbol` (fallback-Kette) | `QuoteCacheEntry` |
| `instrumentAllowlist` | `isin \|\| symbol` (fallback-Kette) | `{ enabled: boolean }` |

**Cache-Key-Konvention:** `isin` bevorzugt, `symbol` als Fallback für Papiere ohne ISIN.
Für Cash gibt es keinen Cache-Eintrag (kein Kurs nötig, `units` = EUR-Betrag).

Warum IndexedDB statt localStorage: strukturierte Reads (per-Store, per-Key), Cache
kann größer werden, saubere Migrationen über `db.version`.

**Migrations-Strategie:** Version-Nummer in `db/schema.ts`, `upgrade`-Callback pro
Versionsprung. Beim MVP-Start Version 1.

### Export / Import

Menü-Aktion: `settings.json` mit `{ portfolios, settings, instrumentAllowlist }`
(ohne `quoteCache`). Import überschreibt komplett nach Bestätigung.

### Whitelist-Verhalten

`GET /instruments` kann ein Superset sein. In der App:

- Standard-Anzeige im Portfolio-Add-Dialog: nur Instrumente mit `enabled: true` im Allowlist-Store.
- Der Instrumenten-View (`/instruments`) zeigt alle API-Instrumente mit einem Toggle
  „In Portfolio-Auswahl anzeigen".
- Beim ersten API-Fetch (leerer Allowlist): alle als `enabled: true` initialisieren
  (dann kann der User schrittweise ausschließen), oder alternativ leer starten und
  der User whitelistet aktiv — MVP-Default: **alle ein**, ausblenden ist der explizite Akt.

[↑ Übersicht](#übersicht)

---

## 6 — API-Client (StockInfo)

**Basis-URL:** `import.meta.env.VITE_STOCKINFO_API_URL` (Default:
`https://stockinfo.int.mikemitterer.at`).

**Verwendete Endpunkte:**

| Verb  | Pfad | Zweck |
|---|---|---|
| `GET` | `/instruments` | Katalog aller bekannten Papiere (für Allowlist / Add-Dialog) |
| `GET` | `/quote/{isin}` | Kurs + Metadaten (bevorzugt Xetra/EUR) — für ISIN-basierte Positionen |
| `GET` | `/quote?symbol=…` | Kurs per Yahoo-Symbol (Fallback für Positionen ohne ISIN, z.B. US-Aktie ohne DE-Notierung) |
| `GET` | `/quote/{isin}/daily?period=3m` | Historische EOD (optional, für Drilldown-Sparkline) |
| `POST` | `/refresh/{isin}` | Server-seitiges Refresh eines Papiers (manueller Refresh-Button) |
| `GET` | `/health` | Health-Check-Button in Settings |

**Client-Struktur:**

```typescript
// src/api/client.ts
export class StockInfoClient {
  constructor(private readonly baseUrl: string) {}
  async getInstruments(): Promise<InstrumentSummary[]> { ... }
  async getQuoteByIsin(isin: string): Promise<QuoteResponse> { ... }
  async getQuoteBySymbol(symbol: string): Promise<QuoteResponse> { ... }
  async getDailyHistory(isin: string, period: Period): Promise<DailyPoint[]> { ... }
  async refreshByIsin(isin: string): Promise<QuoteResponse> { ... }
  async health(): Promise<HealthResponse> { ... }
}
```

**Fehlerbehandlung:**

- HTTP-Fehler → typisierter `ApiError` mit `status`, `code`, `detail`
- Netzwerkfehler → generische Meldung, in Toast anzeigen, `consola.error` mit Kontext
- Konkurrente Refresh-Anfragen: `Promise.allSettled` mit Concurrency-Limit (max. 6 gleichzeitig
  über `p-limit` oder simple Semaphore)

**DI:** Der Client wird einmal in `main.ts` instanziiert und über
`app.provide('stockInfo', client)` bereitgestellt; Composables/Stores injizieren ihn
via `inject('stockInfo')`. Das macht die Composables testbar (Mock-Client).

[↑ Übersicht](#übersicht)

---

## 7 — Rebalancing-Domain-Logik

Alle Berechnungen als **reine Funktionen** in `src/domain/rebalancing.ts`.
Kein DOM, keine API, keine Reactivity. Ein einziger Aggregator liefert das komplette
Rebalancing-Ergebnis für ein Portfolio + Kurs-Snapshot + Settings.

### Kernfunktionen

```typescript
function marketValue(position: Position, quote: QuoteCacheEntry): number
function groupMarketValue(group: AssetGroup, positions, quotes): number
function totalValue(portfolio, quotes, rounding): number
function actualPercent(marketValue: number, total: number): number
function targetValue(position, total): number
function lowerBand(target: number, bands: Bands): number
function upperBand(target: number, bands: Bands): number
function suggestion(marketValue, low, high): 'buy' | 'sell' | 'ok'
function unitsDelta(target, current, price): number
function suggestedTradeUnits(budget, groupSharePercent, price, rounding = -2): number
function relativeDeltaPercent(actual, target): number
function projectedPercentAfterTrade(position, tradeUnits, price, total): number
```

### Aggregator

```typescript
interface PositionResult {
  position: Position
  quote: QuoteCacheEntry | null    // null wenn kein Kurs verfügbar
  marketValue: number
  actualPercent: number
  targetValue: number
  lowerBand: number
  upperBand: number
  suggestion: 'buy' | 'sell' | 'ok'
  unitsDelta: number
  suggestedTradeUnits: number
  relativeDeltaPercent: number     // für den Delta-Balken
  isNearBand: boolean              // Vorwarn-Schwelle
  warnings: PositionWarning[]
}

interface GroupResult {
  group: AssetGroup
  actualValue: number
  actualPercent: number
  targetPercent: number
  targetValue: number
  lowerBand: number
  upperBand: number
  suggestion: 'buy' | 'sell' | 'ok'
  deltaEuro: number                // Kaufen (+) / Verkaufen (−)
}

interface LiquidityResult {
  liquidBuffer: number             // Anleihen + Cash − Save-Asset-Grenze
  liquidBufferPercent: number
  targetReserveEuro: number
  sellForReserve: number           // wie viel aus Aktien in Reserve umschichten
}

interface RebalancingResult {
  total: number
  rounding: number
  groups: GroupResult[]
  rows: PositionResult[]
  liquidity: LiquidityResult
  warnings: PortfolioWarning[]
  computedAt: string
}

function computeRebalancing(
  portfolio: Portfolio,
  quotes: Map<string, QuoteCacheEntry>,
  settings: Settings,
): RebalancingResult
```

### Warnings

- `POSITION_NON_EUR_CURRENCY` — Position mit `quote.currency !== 'EUR'`
- `POSITION_STALE_QUOTE` — Kurs älter als `settings.refresh.staleAfterMinutes`
- `POSITION_NO_QUOTE` — Kein Kurs verfügbar (API-Fehler)
- `TARGETS_NOT_100` — Summe der `targetPercent` ≠ 100 (Excel-Analog: M-Spalte summiert auf 99)
- `SAVE_ASSET_UNDERSHOT` — Liquiditäts-Puffer < Save-Asset-Grenze
- `GROUP_TARGETS_MISMATCH` — Summe der Sub-Targets in einer Gruppe stimmt nicht mit Gruppen-Ziel

Warnings sind reine Berechnung; deren visuelle Darstellung erfolgt im UI (Badges, Toasts).

[↑ Übersicht](#übersicht)

---

## 8 — UI-Konzept

### Routen

- `/` **Dashboard** — Rebalancing-Ansicht, Hauptbildschirm
- `/instruments` **Instrumente** — API-Katalog + Whitelist
- `/settings` **Einstellungen** — Bänder, Kennzahlen, Portfolios, Export/Import

### Dashboard

1. **Topbar** — Logo/App-Name · Portfolio-Auswahl · Refresh-Button („vor 3 Min.
   aktualisiert") · Theme-Toggle · Nav
2. **KPI-Row** — 4 Karten:
   - Gesamtwert (mit % Änderung ggü. letztem Refresh)
   - Liquiditäts-Puffer € (Anleihen + Cash − Save-Assets)
   - Ziel-Investitionsreserve € (mit „% vom Gesamt")
   - Warnungen (Anzahl, Klick → Panel)
3. **Gruppen-Balken** — pro Gruppe eine Zeile: IST-% als Balken über Ziel-%,
   Kauf/Verkauf-€-Delta
4. **Positions-Tabelle** — Naive UI DataTable, Row-Grouping nach `AssetGroup`,
   8 Standard-Spalten:
   - Symbol / Bezeichnung (mit Muted-Sub)
   - Bestand
   - Kurs (mit Stale-Indikator)
   - Marktwert (EUR)
   - IST %
   - Ziel %
   - Delta % (divergierender Balken — siehe Mockup)
   - Status (farbcodierter Badge: OK / nahe Band / Kaufen / Verkaufen)
5. **Drilldown-Panel (Klick auf Zeile)**:
   - **Position editieren** (inline, live-persistiert in IndexedDB):
     - Bestand (Stück; für Cash = Betrag in EUR) — Number-Input
     - Ziel-% — Number-Input mit Slider
     - Bezeichnung — Text-Input (überschreibt API-Name)
     - Gruppen-Zuordnung — Select (Aktien / Anleihen / Metalle / Cash)
     - Enabled-Toggle — Position temporär deaktivieren, ohne sie zu löschen
     - Notes — freies Textfeld
     - Delete-Button (mit Confirm-Dialog)
   - alle Zusatz-Zahlen die im `settings.ui.columns` aktiv sind (default: Volatilität +
     Bestand opt. + Delta €)
   - **Trade-Simulator inline**: Number-Input („Stück kaufen/verkaufen"), live-Anzeige:
     Delta € / neues IST-% / Band-Status nach Trade / neues Kauf/Verkauf-Signal.
     „**Übernehmen**"-Button schreibt die Trade-Menge in den Bestand
     (Bestand += Trade-Menge; positiv = Kauf, negativ = Verkauf) und setzt den
     Simulator-Wert zurück auf 0.
   - Kurs-Zeitstempel + Refresh-Button (nur diese Position)
   - myOEKB-Meldefond-Link (nur bei ETFs mit ISIN)
   - Sparkline aus `/quote/{isin}/daily?period=3m` — MVP-Ziel, kann bei
     Zeitmangel in eine spätere Iteration verschoben werden

**Schnell-Edit in der Tabelle:** Bestand und Ziel-% sind auch direkt in der Zeile
per Doppelklick editierbar (Naive UI DataTable unterstützt Inline-Editing). Änderungen
werden live persistiert und die Berechnungen aktualisieren sich sofort.

### Delta-%-Balken (bestätigt im Mockup)

- Horizontaler Balken mit Zentrumslinie = 0 % (Ziel)
- Balken links = untergewichtet (Kaufen), rechts = übergewichtet (Verkaufen)
- Gepunktete Zonen links/rechts markieren die Toleranzbänder aus Settings
- Füllfarbe: grün (im Band), gelb (nahe Bandgrenze, ≤ 1 % vom Rand),
  rot (Bandverletzung)
- Extreme Ausreißer (> ±50 %) werden clip-optisch auf 50 % begrenzt, die Zahl bleibt
  aber wahrheitsgetreu (z.B. „+460 %" innerhalb des Balkens)
- Skala relativ zum Ziel, nicht absolut zum Portfolio — kleine Positionen mit engen
  Bändern zeigen so gut lesbare Ausschläge

### Instruments-Seite

Tabelle mit allen Papieren aus `GET /instruments`: Symbol, ISIN, Name, Typ, letzter Kurs,
TER, Volatilität, `history_count`. Toggle „In Portfolio-Auswahl anzeigen"
(= Allowlist-Store). Such-/Filter-Leiste (Typ = ETF|Stock, Provider, Replication).

Kein direktes „Zum Portfolio hinzufügen" hier — das passiert im Dashboard über einen
+-Button, aber nur unter den Whitelist-Papieren.

### Settings-Seite

- **Bänder**: Lower- und Upper-Band % (Number-Input mit Slider)
- **Kennzahlen**: Save-Asset-Grenze €, Investitionsreserve %, Rebalancing-Budget €,
  Rundung Gesamtwert (`-3` = Tausender, `-4` = Zehntausender)
- **Portfolios**: Liste anlegen/umbenennen/löschen, aktives Portfolio wählen
- **Refresh**: Auto-Load beim Start an/aus, „stale after X Minuten" Schwelle
- **Anzeige**: welche Zusatzspalten default sichtbar sind (siehe `settings.ui.columns`)
- **Daten**: Export als JSON / Import aus JSON
- **API**: aktuelle URL (read-only, aus `VITE_STOCKINFO_API_URL`) + Health-Check-Button

### Farb-/Theme

- Dark-Mode default, Toggle in Topbar (Naive UI ThemeProvider)
- Naive UI Dark-Theme + Tailwind mit `darkMode: 'class'`

### Responsive

- Desktop (default): volle Tabelle
- Tablet: Kurs + Marktwert nebeneinander, IST/Ziel als kombinierter Balken
- Mobile: Karten-Layout statt Tabelle, ein Papier pro Karte mit Kern-KPIs
  und Aufklapp-Details

[↑ Übersicht](#übersicht)

---

## 9 — Docker & Deployment

### Dockerfile (Multi-Stage)

```
Stage 1 — Node-Build:
  FROM node:22-alpine
  npm ci → vite build → dist/

Stage 2 — Nginx-Serve:
  FROM nginx:1.29-alpine
  COPY dist/ → /usr/share/nginx/html
  COPY nginx.conf → /etc/nginx/conf.d/default.conf
  EXPOSE 80
```

### `docker/build.sh`

Generiert per `docker-build-script`-Skill mit:

- `NAMESPACE = mikemitterer` (Docker-Hub-User)
- `NAME = stockportfolio`
- `GITHUB_OWNER = MikeMitterer` (nur relevant wenn TARGET=ghcr)
- `PORT = 8080`
- `TARGET_DEFAULT = dockerhub` (öffentlich hostbar, Unraid-Muster wie StockInfo)

### Environment

- **Build-Zeit** (Vite injiziert): `VITE_STOCKINFO_API_URL`
- **Runtime**: keine — die App ist rein statisch

Falls die API-URL zur Laufzeit konfigurierbar sein muss (verschiedene Deployments derselben
Image-Version): Runtime-Config-Datei `/config.json` per `envsubst` beim Container-Start
erzeugen und in `main.ts` als erstes fetchen. Für MVP nicht nötig — der User baut selbst.

### Nginx-Config

- SPA-Fallback: alle Routen auf `/index.html`
- Cache-Header: `index.html` `no-cache`, Assets mit Hash → `1y immutable`
- CSP: `connect-src` auf die StockInfo-URL beschränken

[↑ Übersicht](#übersicht)

---

## 10 — Makefile & Scripts

### Makefile-Struktur (nach `makefile-conventions`)

```
SHELL := /bin/bash
.DEFAULT_GOAL := help
WORKSPACE    := $(realpath $(shell pwd))
PROJECT_NAME := $(notdir $(WORKSPACE))
include ${DEV_MAKE}/colours.mk
include ${DEV_MAKE}/tools.mk
-include .env
export
```

### Targets

| Gruppe | Target | Beschreibung |
|---|---|---|
| Hilfe | `help` / `info` / `hints` | Standard-Hilfen |
| Setup | `setup` | `.libs`-Symlinks (BashLib, MakeLib), `npm install` |
| Setup | `precheck` | prüft `BASH_LIBS` |
| Entwicklung | `dev` | `npm run dev` (Vite, Port 5173) |
| Entwicklung | `build` | `npm run build` → `dist/` |
| Entwicklung | `preview` | `npm run preview` |
| Entwicklung | `lint` | `npm run lint` (ESLint + Prettier) |
| Entwicklung | `typecheck` | `npm run typecheck` (vue-tsc --noEmit) |
| Entwicklung | `test` | `npm run test` (Vitest) |
| Docker | `docker-build` | `docker/build.sh --build` |
| Docker | `docker-push`  ##R | `docker/build.sh --push` (TARGET=dockerhub default) |
| Docker | `docker-run` | Sample-Container starten (aus build.sh) |
| Versionierung | `version` | `readProjectVersion` + `git describe` |
| Versionierung | `tags` | letzte 10 Tags |
| Versionierung | `tag-major/-minor/-patch` | via `semVerBump …` (BashLib), `MSG="..."` optional |

### Scripts

- `scripts/setup-libs.sh` — legt die `.libs/`-Symlinks an (BashLib-Guard-Pattern,
  `usageLine`, `--help` bei keinem Argument)
- alle Scripts mit `set -euo pipefail`, Header-Block (80 Zeichen), sourceable
  `.<name>.conf.sh` falls Config nötig

[↑ Übersicht](#übersicht)

---

## 11 — Testing

### Unit-Tests (Vitest)

**Pflicht:**

- `src/domain/rebalancing.ts` — pro Formel eine dedizierte Suite mit klaren,
  minimalen synthetischen Inputs. Edge-Cases explizit (Division durch 0,
  fehlende Kurse, disabled Positionen, Cash-Handling, Vorzeichen). Der
  Aggregator wird mit einem kleinen konstruierten Portfolio (2–3 Positionen)
  geprüft, bei dem die Arithmetik im Kopf nachvollziehbar bleibt. **Kein**
  Regression-Test gegen die Excel-Zahlen (fragil — jede Rundungsänderung
  würde rot).
- `src/domain/warnings.ts` — jede Warning-Bedingung mit gezieltem Trigger.
- `src/domain/formatters.ts` — DE-Locale, Vorzeichen, Cent-Stellen.

**Empfohlen:**

- Composables mit gemocktem `StockInfoClient` (`useQuoteRefresh`, `usePortfolio`).

**Nicht MVP:**

- Component-/E2E-Tests (Playwright etc.).

[↑ Übersicht](#übersicht)

---

## 12 — Nicht im MVP

- **Trade-Journal / Dokumentation** — bewusst gestrichen
- **Pyramidisieren bei Verlust** — die 3 Excel-Strategien (degressiv / progressiv / all-in
  bei −10 % / −20 % / −30 %) sind nicht Teil des MVP
- **Multi-Currency / FX** — EUR-only, andere Währungen erzeugen eine Warnung
- **Push-Notifications** — separater Backend-Cron in Ausbaustufe (siehe §13)
- **Charts über Zeit** außer optionale Sparkline im Drilldown
- **Multi-Portfolio-Vergleich** — nur ein aktives Portfolio ist zur Zeit sichtbar
- **PWA / Offline** — nicht MVP
- **Automatischer Kurs-Polling** — nur manueller Refresh + Auto-Load beim Start

[↑ Übersicht](#übersicht)

---

## 13 — Offene Punkte / spätere Ausbaustufen

- **Threshold-Notifications** als separates Deployment: eigener Docker-Container mit
  Cron-Job der die StockInfo-API pollt, die WebApp-Settings (oder eine kleine parallele
  Konfig-Datei) liest und bei Bandverletzung Mail / Telegram / Discord schickt. Kein Push
  in die Browser-App.
- **Trade-Journal** ggf. als eigenes IndexedDB-Object-Store, wenn der Bedarf entsteht.
- **Pyramidisieren-bei-Verlust** kann später als eigener Tab in der Detail-Position
  ergänzt werden, wenn die Basis stabil läuft.
- **Runtime-Config** (`/config.json`) falls dieselbe Image-Version für mehrere Deployments
  laufen soll.
- **Import aus Excel** (drop-in) — die Struktur ist stabil, ein `xlsx → Portfolio + Settings`-Konverter wäre machbar.

[↑ Übersicht](#übersicht)
