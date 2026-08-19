# T-30 · Ladeanzeige beim Aktualisieren — global und je Position

| Repo | Status | Time-box | Scope | GH-Issue |
|---|---|---|---|---|
| root | done | ~1 h | UI-only | — |

**Löst:** Beim Aktualisieren gab es keine Rückmeldung. Man klickte und wartete
darauf, dass sich irgendwo eine Zahl ändert — global wie beim einzelnen Papier.

---

## Verify

Legende: ✅ live bestätigt · ⚠️ bestätigt mit Einschränkung (Fußnote) ·
◑ teilweise (Fußnote) · ➖ keine Live-Verifikation (nur Unit/Review).
`AI` = nur KI · `Human` = nur Mensch (nie überschreiben).

| # | Where | Look for | AI | Human                                                                      |
|---|---|---|:--:|----------------------------------------------------------------------------|
| 1 | Kopfzeile, „Aktualisieren" | Beim Klick dreht der Spinner an der Stelle des Pfeil-Symbols, die Beschriftung bleibt stehen | ✅¹ | ok                                                                         |
| 2 | dito | Während des Abrufs nimmt der Knopf keinen zweiten Klick an | ✅¹ | ok                                                                         |
| 3 | dito, schmal (< 768 px) | Ohne Beschriftung dreht der Spinner an derselben Stelle; die Zeile bleibt einzeilig | ➖² | ???                                                                        |
| 4 | Zeile aufklappen → „Kurs neu laden" | Derselbe Spinner, nur an diesem Knopf — die übrigen Zeilen bleiben unberührt | ✅¹ | Spinner vorher nicht da, nach Klick schon - Refresh dauert auch eine Weile |
| 5 | dito, zwei Zeilen offen | Beide nacheinander anstoßen → beide drehen unabhängig voneinander | ➖² | ok                                                                         |
| 6 | dito, Abruf schlägt fehl | Der Knopf hört auf zu drehen und ist wieder bedienbar; der Fehler erscheint wie bisher | ✅³ | ok                                                                         |
| 7 | Kopfzeile während eines Einzel-Abrufs | Der globale Knopf bleibt bedienbar — die beiden sperren sich nicht gegenseitig | ➖² | ok                                                                         |
| 8 | Terminal | `npm run typecheck && npm run lint && npm run test && npm run build` | ✅⁴ |                                                                            |
| 9 | Kopfzeile, „Aktualisieren" | Der Spinner bleibt jetzt rund 0,4 s stehen, auch wenn der Abruf schneller fertig ist — **damit werden #1 und #2 überhaupt erst prüfbar** | ✅⁵ |                                                                            |
| 10 | dito, zweimal kurz hintereinander klicken | Der zweite Abruf zeigt seine eigene volle Frist, erbt nicht die Restzeit des ersten | ✅⁵ |                                                                            |
| 11 | dito | Die Altersangabe „…" daneben erscheint und verschwindet zusammen mit dem Spinner, nicht früher | ➖² |                                                                            |

> ¹ **(CC):** Mount-Tests prüfen, dass der Knopf `n-button--loading` und `disabled` trägt — `tests/components/appTopbarRefresh.spec.ts` und `tests/components/positionDrilldownRefresh.spec.ts`. Dass die Animation tatsächlich läuft, sieht nur ein Auge.
> ² **(CC):** Reine Sichtprüfung, dafür gibt es keinen Test.
> ³ **(CC):** Test-first gebaut: `tests/stores/quotes.spec.ts` prüft, dass die Position nach einem Fehlschlag wieder freigegeben wird. Der `finally`-Zweig war der Grund für den Test, nicht umgekehrt.
> ⁴ **(CC):** Am 2026-08-19 gelaufen: typecheck ✓, lint ✓, vitest 34 Dateien / 533 Tests ✓, build ✓.
> ⁵ **(CC):** Test-first gebaut, `tests/composables/useMinimumDuration.spec.ts` — Einschalten, Halten bei zu frühem Abschalten, sofortiges Abschalten nach abgelaufener Frist, neue Frist beim zweiten Durchgang, Aufräumen beim Abbau. Mit gestellten Zeitgebern; ob die Dauer sich richtig **anfühlt**, sagt das nicht.

### Kurz-Testblock

```bash
npm run dev     # #1–#7 unter http://localhost:5175/#/
npm run test    # #1, #2, #4, #6, #8
```

Für #6 braucht es einen fehlschlagenden Abruf — am einfachsten mit gestopptem
StockInfo-Dienst oder in den Entwicklerwerkzeugen auf „Offline".

---

## Details

### Kontext / Ziel

Beide Wege durch denselben Mechanismus: `:loading` am `NButton` von Naive. Der
ersetzt das Symbol durch einen Spinner und lässt die Beschriftung stehen —
keine eigene Animation, keine zweite Knopfsorte. Dazu `disabled`, sonst lässt
sich derselbe Abruf mehrfach anstoßen.

| Weg | Zustand | Woher |
|---|---|---|
| Global | `quotesStore.loading` | Gab es schon, wurde nur nicht durchgereicht |
| Je Position | `quotesStore.refreshing` | Neu: Menge von Positions-IDs |

Eine Menge und kein Schalter, weil mehrere Zeilen offen sein können. Gesetzt
und geräumt wird in `refreshOne` mit `try/finally` — ein Fehlschlag darf den
Knopf nicht ewig drehen lassen.

**Nachgezogen: Mindestanzeigedauer.** Beim Testen war der globale Spinner nicht
zu sehen. Ursache ist kein Anzeigefehler, sondern der Unterschied der beiden
Wege:

- **Kopfzeile** (`loadQuotes` → `fetchOne`) ruft `getQuoteByIsin` und liest
  damit den **Cache** des Dienstes — in Millisekunden fertig.
- **Drilldown** (`refreshOne`) ruft `refreshByIsin` und erzwingt den
  Server-Refresh — dauert spürbar.

`useMinimumDuration` hält den Zustand deshalb rund 0,4 s, sobald er
einschaltet. Nicht im Store: Dort steht, ob tatsächlich etwas läuft; wie lange
eine Anzeige standhält, ist Sache der Oberfläche. Die Altersangabe „…" hängt an
derselben Größe, sonst liefen die beiden auseinander.

Das Gegenstück — den Spinner erst nach einer Weile zeigen — wäre hier falsch:
Nach einem eigenen Klick will man eine Bestätigung sehen, nicht nichts.

Der Zustand läuft als Prop durch (`DashboardView` → `PositionsTable` →
`h(PositionDrilldown)`), nicht über einen Store-Zugriff im Drilldown: Die
Aktion geht bereits als Emit nach oben, und zwei Wege für dieselbe Sache wären
einer zu viel.

### Akzeptanzkriterien

- [x] Der Knopf in der Kopfzeile dreht während des globalen Abrufs und ist gesperrt.
- [x] Der Knopf im Drilldown dreht nur für seine eigene Position.
- [x] Nach einem Fehlschlag ist der Knopf wieder bedienbar.
- [x] Die beiden Wege sperren sich nicht gegenseitig.
- [x] #3, #5, #7 vom Menschen gesehen.
- [x] Der globale Spinner ist lange genug sichtbar, um überhaupt geprüft werden zu können.

### Side-Effects

Das `'…'` als Altersangabe in der Kopfzeile (`App.vue:37`) bleibt, wie es war —
es sagt etwas anderes als der Spinner, nämlich dass die Angabe gerade nicht
stimmt.

Bewusst **nicht** gebaut: eine Sperre der Einzelknöpfe während des globalen
Abrufs, und eine Markierung der Zeile selbst. Beides geht über „es passiert
gerade etwas" hinaus.

### Auflösung

Vom Menschen am 2026-08-19 als erledigt erklärt.

Ein Commit, `c1a8e8d`: Ladezustand global und je Position, Mindestanzeigedauer
als `useMinimumDuration`, dazu Tests im Quotes-Store, für das Composable und je
ein Mount-Test für beide Knöpfe.

Stand beim Abschluss: typecheck ✓, lint ✓, vitest 34 Dateien / 538 Tests ✓,
build ✓.

**Findings:**

Der eigentliche Befund kam erst beim Testen und war kein Anzeigefehler: Die
beiden Knöpfe rufen verschiedene Endpunkte. Die Kopfzeile liest über
`getQuoteByIsin` den Cache des Dienstes, der Drilldown erzwingt mit
`refreshByIsin` den Server-Refresh. Deshalb war global nichts zu sehen.

**Offen, bewusst nicht entschieden:** Ob der globale Knopf überhaupt nur den
Cache lesen soll. Er heißt „Aktualisieren" und tut damit etwas anderes als
derselbe Knopf an einer einzelnen Zeile. Das kann Absicht sein — bei vielen
Positionen wären es ebenso viele erzwungene Server-Refreshes auf einmal. Wenn
nicht, ist es ein eigenes Ticket.

Was kein Test sagt: ob sich 0,4 s richtig anfühlen. Die Zahl steht als
`MIN_VISIBLE_MS` an einer Stelle.
