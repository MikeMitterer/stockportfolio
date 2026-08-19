# T-32 · Fortschrittsleiste oben, Spinner nur nach dem Klick

| Repo | Status | Time-box | Scope | GH-Issue |
|---|---|---|---|---|
| root | in-progress | ~1 h | UI + Store | — |

**Löst:** Der Spinner am Knopf drehte bei **jedem** Kursabruf mit, auch beim
Seitenaufruf — er behauptete eine Handlung, die es nicht gab, und sperrte den
Knopf dabei. Umgekehrt fehlte eine Anzeige für das, was tatsächlich im
Hintergrund passiert.

---

## Verify

Legende: ✅ live bestätigt · ⚠️ bestätigt mit Einschränkung (Fußnote) ·
◑ teilweise (Fußnote) · ➖ keine Live-Verifikation (nur Unit/Review).
`AI` = nur KI · `Human` = nur Mensch (nie überschreiben).

| # | Where | Look for | AI | Human |
|---|---|---|:--:|---|
| 1 | Seite neu laden (F5) | Oben am Fensterrand läuft eine schmale Leiste durch; der Knopf in der Kopfzeile bleibt **ruhig und bedienbar** | ✅¹ | |
| 2 | Klick auf „Aktualisieren" | Leiste **und** Spinner am Knopf; die Leiste wächst mit jedem fertigen Papier | ✅¹ | |
| 3 | dito, viele Papiere | Der Balken geht sichtbar voran, statt nur zu stehen — dafür dauert der erzwungene Abruf seit T-31 lange genug | ➖² | |
| 4 | Drilldown → „Kurs neu laden" | Leiste oben **und** Spinner an diesem Knopf; der Knopf in der Kopfzeile bleibt ruhig | ✅¹ | |
| 5 | Ende eines Abrufs | Die Leiste läuft voll und verschwindet — sie schnappt nicht auf den Anfang zurück | ➖³ | |
| 6 | Ansicht wechseln (Dashboard ↔ Ausgleichen) | Leiste erscheint kurz, Knopf bleibt ruhig | ➖² | |
| 7 | Dienst gestoppt, „Aktualisieren" | Leiste läuft durch und verschwindet, Knopf wird wieder frei; Fehler erscheinen wie bisher | ✅¹ | |
| 8 | Schmaler Schirm, Theme wechseln | Die Leiste liegt **über** der Kopfzeile, nicht darunter, und trägt die Akzentfarbe des Themes | ➖² | |
| 9 | Terminal | `npm run typecheck && npm run lint && npm run test && npm run build` | ✅⁴ | |

> ¹ **(CC):** Test-first, `tests/stores/quotes.spec.ts` — der Fortschritt zählt jeden fertigen Kurs mit, steht danach still, bleibt auch nach einem Fehlschlag nicht stehen; `forcing` ist nur beim erzwungenen Abruf gesetzt und bleibt aus, wenn es nichts zu holen gibt. Dazu `tests/components/appProgressBar.spec.ts` für die Leiste selbst.
> ² **(CC):** Reine Sichtprüfung, dafür gibt es keinen Test.
> ³ **(CC):** Beim Durchdenken gefunden, nicht beim Testen: Der Store nullt seine Zähler, sobald der letzte Kurs da ist — die Leiste steht wegen der Mindestdauer aber noch. `App.vue` hält sie deshalb auf 100 %, sobald nichts mehr läuft. Ein Einzeiler ohne eigenen Test.
> ⁴ **(CC):** Am 2026-08-19 gelaufen: typecheck ✓, lint ✓, vitest 36 Dateien / 552 Tests ✓, build ✓.

### Kurz-Testblock

```bash
npm run dev     # #1–#8 unter http://localhost:5175/#/
npm run test    # #1, #2, #4, #7, #9
```

---

## Details

### Kontext / Ziel

Zwei Anzeigen, zwei verschiedene Fragen:

| Anzeige | Frage | Hängt an |
|---|---|---|
| Leiste oben | „Passiert gerade etwas?" | `busy` — jeder Kursabruf |
| Spinner am Knopf | „Ist mein Klick angekommen?" | `forcing` bzw. `refreshing` je Position |

Abgedeckt sind alle fünf Auslöser: Seitenaufruf, Ansichtswechsel, Beispiel-Depot
und neue Position, Klick auf „Aktualisieren", Einzel-Refresh im Drilldown.

Der Fortschritt steht als **zwei Zähler** im Store, nicht als Objekt je Vorgang:
Es können mehrere gleichzeitig laufen — ein Einzel-Refresh, während der
Seitenaufruf noch lädt —, und addierte Zahlen ergeben von selbst einen
gemeinsamen Balken. Gezählt wird in `finally` bzw. direkt nach `fetchOne`, das
nie wirft; ein Fehlschlag lässt die Leiste also nicht stehen.

`AppProgressBar` ist bewusst **kein** `NProgress`: Dessen Spur und Füllung
müssten für die Lage am Seitenrand umgestylt werden, und eigenes CSS auf einer
Naive-Komponente ist genau das, was `componentStyles.spec.ts` verbietet. Hier
gibt es kein Bedienelement, nur zwei Flächen — die Bibliothek gewönne nichts.
Die Komponente kennt die App nicht (keine Stores, kein `t()`) und könnte ins
Fundament ziehen, sobald eine zweite App sie braucht.

### Akzeptanzkriterien

- [x] Die Leiste erscheint bei jedem Kursabruf und zeigt den echten Stand.
- [x] Der Spinner am Knopf erscheint nur nach einem Klick — und nur, wenn tatsächlich etwas geholt wird.
- [x] Mehrere gleichzeitige Vorgänge ergeben einen gemeinsamen Balken.
- [x] Ein Fehlschlag lässt weder Leiste noch Spinner stehen.
- [ ] #3, #5, #6, #8 vom Menschen gesehen.

### Side-Effects

Die Altersangabe „…" in der Kopfzeile hängt jetzt an der Leiste, nicht mehr am
Knopf-Spinner: Sie sagt, dass die Zahl daneben gerade nicht stimmt, und das gilt
auch beim automatischen Laden.

Die Mindestdauer aus T-30 gilt für beide Anzeigen. Ohne sie blitzen sie bei
einem Abruf, der aus dem Speicher des Dienstes kommt, unbemerkt auf.

### Auflösung

Wird zuletzt gefüllt. Commit-Hash(es), Lint-Status, Findings.
