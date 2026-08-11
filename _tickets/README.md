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

Stand nach dem Release 0.1.0. „Teilweise" heißt: Das Ticket ist nicht
geschlossen — was fehlt, steht in der Zeile.

| # | Titel | Stand |
|---|---|---|
| T-01 | Scaffolding — Vue 3 + Vite + TS + Tailwind + Naive UI + Pinia | [erledigt](solved/T-01-scaffolding.md) |
| T-02 | Makefile + BashLib/MakeLib-Setup + `.env.example` | [erledigt](solved/T-02-makefile-bashlib.md) |
| T-03 | Domain-Modul — Vitest-Tests je Formel | [erledigt](solved/T-03-domain-tests.md) |
| T-04 | API-Client für StockInfo + typisierte Response-Modelle | [erledigt](solved/T-04-api-client.md) |
| T-05 | Persistenz — IndexedDB-Schema + Pinia-Stores | [erledigt](solved/T-05-persistence.md) |
| T-06 | UI-Shell — vue-router, vue-i18n, Naive UI Theme, Topbar | erledigt, ohne eigenes Ticket |
| T-07 | Dashboard — KPI-Row + Gruppen-Balken | erledigt, ohne eigenes Ticket |
| T-08 | Dashboard — Positions-Tabelle + Delta-Balken + Inline-Edit | [erledigt](solved/T-08-row-grouping.md) |
| T-09 | Dashboard — Drilldown-Panel | erledigt; der Trade-Simulator wurde zugunsten von T-19 wieder entfernt |
| T-10 | Assets-View + Add-Position-Dialog | [erledigt](solved/T-10-instruments.md) |
| T-11 | Settings-View + Export/Import + Health-Check | **teilweise** — Bänder, Puffer, Themes, Verweise, Status und [Export/Import](solved/T-20-backup.md) stehen; die Portfolio-Verwaltung fehlt |
| T-12 | Warnings + Toast + leere/Fehler-Zustände | **teilweise** — Toasts mit Zähler und leere Zustände stehen; die Warnung bei Fremdwährung fehlt |
| T-13 | Docker — Multi-Stage-Image + `docker/build.sh` | [erledigt](solved/T-13-docker.md) |
| T-14 | Version-Bump auf `0.1.0` + finale README/Docs | [erledigt](solved/T-14-release.md) |

### Nachgezogen während der Umsetzung

| # | Titel | Stand |
|---|---|---|
| T-15 | Inline-Edit + Ziel-Summen-Prüfung | [erledigt](solved/T-15-inline-edit-target-sum.md) |
| T-16 | Theming — sechs Themes, Token als RGB-Tripel | [erledigt](solved/T-16-theming.md) |
| T-17 | Mobile — Leseansicht | [erledigt](solved/T-17-mobile-readonly.md) |
| T-18 | Geldmarkt als eigene Klasse + Investitionsreserve | [erledigt](solved/T-18-geldmarkt-reserve.md) |
| T-19 | Rebalancing als eigener Tab | [erledigt](solved/T-19-rebalancing-tab.md) |
| T-20 | Sichern und Wiederherstellen | [erledigt](solved/T-20-backup.md) |
| T-UI | Frühe UI-Vorschau | [erledigt](solved/T-UI-preview.md) |
