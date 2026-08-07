# T-03 · Domain-Modul — Vitest-Tests je Formel

| Repo | Status | Time-box | Scope | GH-Issue |
|---|---|---|---|---|
| root | done | ~45 min | Tests-only (Domain-Modul + Formatter) | — |

**Löst:** Sichert die Kern-Berechnungen (`src/domain/rebalancing.ts` +
`src/domain/formatters.ts`) durch Unit-Tests ab. Ziel ist die **Regel**, nicht
der **Wert** — kein 1:1-Vergleich gegen die Excel-Zahlen (fragil bei jedem
Rundungstweak), sondern klar isolierte Formel-Tests + Edge-Cases + ein kleines
synthetisches Portfolio als Aggregator-Sanity.

---

## Verify

Legende: ✅ live bestätigt · ⚠️ bestätigt mit Einschränkung (Fußnote) ·
◑ teilweise (Fußnote) · ➖ keine Live-Verifikation (nur Unit/Review).

| # | Where | Look for | AI | Human |
|---|---|---|:--:|---|
| 1 | `tests/domain/rebalancing.spec.ts` | Pro Formel eigene `describe`-Suite: `marketValue`, `targetValue`, `lowerBand`, `upperBand`, `suggestion`, `relativeDeltaPercent`, `unitsDelta`, `roundToPlace`, `isNearBand`, `actualPercent`, `quoteKey`, `quoteFor`, `totalValue` | ✅¹ | |
| 2 | Edge-Cases | Total = 0, target = 0, price = 0, quote fehlt (`null`), Cash-Position (isin=null, symbol=CASH), disabled Position, leeres Portfolio, Division-by-zero-Absicherung | ✅¹ | |
| 3 | `tests/domain/rebalancing.spec.ts` — `computeRebalancing` | 3-Positionen-Portfolio (Stock + Bond + Cash) mit im-Kopf-nachvollziehbaren Zahlen; prüft: Total, Row-Count, Cash-Quote-null, IST-%-Konsistenz, alle 4 Groups vorhanden auch wenn leer, disabled ignoriert, sell-Vorschlag bei Übergewichtung, Invariante Row-Summe = Group-Summe, leeres Portfolio | ✅¹ | |
| 4 | `tests/domain/formatters.spec.ts` | DE-Locale (Punkt/Komma), Vorzeichen-Formatter (`percentSigned`, `eurSigned`), Cent-Stellen, `integer`, `number` | ✅¹ | |
| 5 | `npm run test` | Alle Suites grün: **74 / 74 Tests** (54 rebalancing + 19 formatters + 1 smoke) | ✅¹ | |
| 6 | `npm run test:coverage` | Nicht mehr erforderlich — Coverage-Ziel ohne Wert, entscheidend ist, dass jede Formel eine Suite hat (siehe #1) | ➖² | |

> ¹ **(CC):** `npm run test` lokal ausgeführt (2026-08-07), alle 74 Tests grün.
> ² **(CC):** Coverage-Zielwert bewusst nicht als hartes Kriterium — verleitet zu Test-Auf-Prozent statt Tests-auf-Verhalten. Wenn eine Coverage-Zahl gebraucht wird, kann `npm run test:coverage` jederzeit laufen (Config ist da).

---

## Details

### Kontext / Ziel
Die Domain-Funktionen sind das Herz — von hier aus fließen alle
UI-Zahlen. Tests müssen bei jeder Weiterentwicklung ihre Regeln
bestätigen und nicht bei jedem kleinen Rundungstweak rot werden.

### Akzeptanzkriterien
- [ ] `tests/domain/rebalancing.spec.ts` — pro Formel eigene Suite mit
  klaren, minimalen Inputs; Edge-Cases explizit
- [ ] `tests/domain/formatters.spec.ts` — DE-Locale + signed-Varianten
- [ ] Aggregator-Test mit 3-Positionen-Synthese
- [ ] Alle Tests grün, `smoke.spec.ts` bleibt
- [ ] Ticket-Close + Commit

### Side-Effects
- Vitest läuft jetzt mit echten Domain-Tests, nicht mehr nur Smoke

### Auflösung
Commit folgt nach Close.

**Bugfix aufgedeckt:** `roundToPlace(value, place)` hatte die falsche
Vorzeichenkonvention — `factor = Math.pow(10, place)` liefert bei `place = -3`
den Wert 0.001 und die Rundung wird zur Identität. Damit war der `total` im
Aggregator effektiv nie auf Tausender gerundet, obwohl `settings.totalRounding = -3`.
Im UI fiel das nicht auf, weil `eur()` beim Anzeigen ohnehin auf Ganze rundet
— aber alle abgeleiteten Werte (Ziel, Bänder, IST-%) arbeiteten mit dem
ungerundeten Total. Korrektur: `factor = Math.pow(10, -place)` (Excel-Semantik).

Tests haben genau das aufgedeckt — der eigentliche Zweck.

