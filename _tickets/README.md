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
| T-11 | Settings-View + Export/Import + Health-Check | [erledigt](solved/T-21-portfolios.md) — Bänder, Puffer, Themes, Verweise, Status, [Export/Import](solved/T-20-backup.md) und Depot-Verwaltung |
| T-12 | Warnings + Toast + leere/Fehler-Zustände | [erledigt](solved/T-22-currency.md) |
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
| T-21 | Verwaltung mehrerer Depots | [erledigt](solved/T-21-portfolios.md) |
| T-22 | Fremdwährung + Meldungen einheitlich als Toast | [erledigt](solved/T-22-currency.md) |
| T-23 | Kursverlauf + Unraid-Template | [erledigt](solved/T-23-history.md) |
| T-24 | Sprachumschaltung DE/EN + Konventions-Durchgang | [erledigt](solved/T-24-i18n.md) |
| T-25 | Erklärung in der App — Begriffe und Methodenseite | [erledigt](solved/T-25-doku.md) |
| T-UI | Frühe UI-Vorschau | [erledigt](solved/T-UI-preview.md) |
| T-26 | Wertentwicklung des Depots — Rückblick und Tageswerte | [erledigt](solved/T-26-wertentwicklung.md) |

## Offen

Kein Ticket, aber notiert, damit es nicht verloren geht:

| Thema | Stand |
|---|---|
| Basiswährung außer EUR | hängt an StockInfo, siehe [Anfrage](../docs/stockinfo-currency-request.md) |
| CORS gegen die produktive API | ungeprüft — nur auf dem Zielsystem möglich |
| Unraid-Vorlage | nie auf einer echten Instanz gelaufen |
| Verlaufs-Zwischenspeicher | wird nie aufgeräumt, wächst nur |
| Feste Spaltenbreiten in der Positionstabelle | zehn Stück; blockieren einen späteren Schriftwechsel |
