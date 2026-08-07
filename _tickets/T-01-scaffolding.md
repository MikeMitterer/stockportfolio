# T-01 · Scaffolding — Vue 3 + Vite + TS + Tailwind + Naive UI + Pinia

| Repo | Status | Time-box | Scope | GH-Issue |
|---|---|---|---|---|
| root | in-progress | ~1 h | Projekt-Grundgerüst | — |

**Löst:** Legt das Vue-3-Grundgerüst an: `package.json`, TypeScript strict,
Vite, Tailwind, Naive UI, Pinia, vue-router, vue-i18n, IDB-Wrapper, Vitest.
Danach läuft `npm run dev` und zeigt eine leere App-Shell.

---

## Verify

Legende: ✅ live bestätigt · ⚠️ bestätigt mit Einschränkung (Fußnote) ·
◑ teilweise (Fußnote) · ➖ keine Live-Verifikation (nur Unit/Review).
`AI` = nur KI · `Human` = nur Mensch (nie überschreiben).

| # | Where | Look for | AI | Human |
|---|---|---|:--:|---|
| 1 | `package.json` | `"name": "stockportfolio"`, `"version": "0.1.0"`, `"private": true`, alle Deps aus dem Design (Vue, Vite, TS, Tailwind, Naive UI, Pinia, vue-router, vue-i18n, idb, consola) | ➖ | |
| 2 | `tsconfig.json` | `"strict": true`, `"noUncheckedIndexedAccess": true`, JSX für Vue, path-alias `@/*` → `src/*` | ➖ | |
| 3 | `npm install` (root) | Läuft ohne Fehler, `node_modules/` und `package-lock.json` entstehen | ➖ | |
| 4 | `npm run typecheck` | `vue-tsc --noEmit` läuft grün | ➖ | |
| 5 | `npm run build` | Vite baut nach `dist/` ohne Fehler | ➖ | |
| 6 | `npm run dev` → http://localhost:5173 | Blank-Shell mit App-Titel „StockPortfolio" sichtbar, keine Console-Errors | ➖ | |
| 7 | `npm run test` | Vitest läuft (auch ohne Tests: exit-code 0 oder „no test files found") | ➖ | |
| 8 | `src/` | Ordner-Struktur laut Design vorhanden: `api/`, `composables/`, `stores/`, `components/`, `views/`, `domain/`, `i18n/`, `router/`, `db/`, `types/` (mit `.gitkeep` wenn leer) | ➖ | |

---

## Details

### Kontext / Ziel
Fundament für alle weiteren Tickets. Muss Konventionen aus `code-standards` folgen:
- Composition-API (`<script setup lang="ts">`), keine Options-API
- TS strict, kein `any`
- Tailwind + Naive UI parallel

### Akzeptanzkriterien
- [x] `package.json` + `tsconfig.json` + `vite.config.ts` + `tailwind.config.ts` +
  `postcss.config.js` erstellt
- [x] Deps installiert, Lockfile eingecheckt
- [x] `index.html` + `src/main.ts` + `src/App.vue` funktionieren
- [x] Ordner-Skelett steht mit `.gitkeep` in leeren Ordnern
- [x] `.env.example` mit `VITE_STOCKINFO_API_URL`
- [x] `npm run` scripts: `dev`, `build`, `preview`, `typecheck`, `lint`, `test`
- [x] Git-Commit

### Side-Effects
- Legt `node_modules/` (gitignored) an
- Erzeugt `package-lock.json` (getrackt)

### Auflösung
Wird am Ende gefüllt: Commit-Hash + kurze Notiz.
