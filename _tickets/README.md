# StockPortfolio — Ticket-Board

Kleine, verifizierbare Arbeitspakete für die MVP-Umsetzung nach
[`docs/superpowers/specs/2026-08-06-rebalancing-webapp-design.md`](../docs/superpowers/specs/2026-08-06-rebalancing-webapp-design.md).

## Workflow

- **Offene Tickets** liegen direkt in `_tickets/` (Board-Root).
- **Erledigte Tickets** wandern per `git mv T-NN-*.md solved/` in `solved/`.
- **Verify-Matrix** oben in jedem Ticket ist die Haupt-Interaktionsfläche:
  - `AI`-Spalte füllt ausschließlich Claude (Legende: ✅ / ⚠️ / ◑ / ➖).
  - `Human`-Spalte füllt ausschließlich der User — wird von Claude **nie überschrieben**.
- **Fragen beim Testen** kommen in `QUESTIONS.md` und werden zeitnah drainiert
  (erledigt / GitHub-Issue / gelöscht).

## Roadmap (MVP-Reihenfolge)

Abhängigkeiten fließen top-down; T-04 (Persistenz) kann parallel zu T-05 (UI-Shell)
laufen, T-08/T-09/T-10 sind unabhängig voneinander.

| # | Titel | Vorbedingung |
|---|---|---|
| T-01 | Scaffolding — Vue 3 + Vite + TS + Tailwind + Naive UI + Pinia | — |
| T-02 | Makefile + BashLib/MakeLib-Setup + `.env.example` | T-01 |
| T-03 | Domain-Modul — Vitest-Tests je Formel (Edge-Cases + kleine synthetische Portfolios; keine Excel-Regression) | T-01 |
| T-04 | API-Client für StockInfo + typisierte Response-Modelle | T-01 |
| T-05 | Persistenz — IndexedDB-Schema + Pinia-Stores | T-01 |
| T-06 | UI-Shell — vue-router, vue-i18n, Naive UI Theme, Topbar | T-01 |
| T-07 | Dashboard — KPI-Row + Gruppen-Balken | T-03 + T-05 + T-06 |
| T-08 | Dashboard — Positions-Tabelle + Delta-Balken + Inline-Edit | T-07 |
| T-09 | Dashboard — Drilldown-Panel + Trade-Simulator | T-08 |
| T-10 | Instruments-View + Add-Position-Dialog | T-04 + T-05 + T-06 |
| T-11 | Settings-View + Export/Import + Health-Check | T-05 + T-06 |
| T-12 | Warnings + Toast + leere/Fehler-Zustände | T-07 |
| T-13 | Docker — Multi-Stage-Dockerfile + nginx.conf + `docker/build.sh` | T-01 |
| T-14 | Version-Bump auf `0.1.0` + finale README/Docs | alle |
