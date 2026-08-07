# StockPortfolio

Tolerance-Band-Rebalancing als Web-App — Vue 3 + Vite + TypeScript.
Ersetzt eine bisherige Excel-Datei; Kurse kommen aus der
[StockInfo-API](https://stockinfo.int.mikemitterer.at).

## Status

MVP im Aufbau. Design-Spec:
[`docs/superpowers/specs/2026-08-06-rebalancing-webapp-design.md`](docs/superpowers/specs/2026-08-06-rebalancing-webapp-design.md).
Fortschritt und offene Punkte im [Ticket-Board](_tickets/README.md).

## Setup

```bash
cp .env.example .env       # ggf. VITE_STOCKINFO_API_URL anpassen
npm install
npm run dev                # http://localhost:5173
```

## Scripts

| Command | Zweck |
|---|---|
| `npm run dev` | Vite Dev-Server |
| `npm run build` | Type-Check + Production-Build nach `dist/` |
| `npm run preview` | Preview des Prod-Builds |
| `npm run typecheck` | Nur `vue-tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm run test` | Vitest |
