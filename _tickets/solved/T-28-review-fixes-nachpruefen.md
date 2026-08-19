# T-28 · Review-Fixes nachprüfen — Spaltenkopf, Caret-Drehung, Guard-Reichweite

| Repo | Status | Time-box | Scope | GH-Issue |
|---|---|---|---|---|
| root | done | ~1 h | Test-only (neue Tests erlaubt, kein Feature-Code) | — |

**Löst:** Die vier Befunde aus dem Code-Review sind behoben, aber nur die Suite
belegt das — die drei sichtbaren Fälle (Spaltenkopf, zwei Caret-Drehungen) hat
niemand im Browser gesehen, und für die Kopfzeilen-Logik gibt es keinen Test,
der den Fehler beim nächsten Mal abfängt.

---

## Verify

Legende: ✅ live bestätigt · ⚠️ bestätigt mit Einschränkung (Fußnote) ·
◑ teilweise (Fußnote) · ➖ keine Live-Verifikation (nur Unit/Review).
`AI` = nur KI · `Human` = nur Mensch (nie überschreiben).

| # | Where | Look for | AI | Human |
|---|---|---|:--:|-------|
| 1 | `http://localhost:5175/#/` | Alle Gruppen offen: Spaltenkopf steht **genau einmal**, über der obersten Tabelle | ➖ | ok    |
| 2 | dito | **Oberste** Gruppe einklappen → die nun oberste sichtbare Tabelle trägt den Spaltenkopf; keine Tabelle steht ohne Spaltennamen da | ➖ | ok    |
| 3 | dito, danach `⌘R` | Nach dem Reload (eingeklappter Zustand kommt aus `localStorage`) gilt #2 unverändert | ➖ | ok    |
| 4 | dito | Alle Gruppen einklappen und wieder öffnen → Kopfzeile wandert mit, erscheint nie doppelt | ➖ | ok    |
| 5 | dito | KPI-Karte auf-/zuklappen → Pfeil **dreht** sich sichtbar (~0,15 s), er springt nicht | ➖ | ok    |
| 6 | dito | Gruppenkopf auf-/zuklappen → Pfeil dreht sich ebenso animiert | ➖ | ok    |
| 7 | dito | Dashboard-, KPI- und Gruppenkopf-Pfeil verhalten sich **gleich** — das war das Ziel der UxCaret-Vereinheitlichung | ➖ |       |
| 8 | `tests/components/positionsTableHeader.spec.ts` | Neuer Test deckt die Kopfzeilen-Regel ab: eingeklappte oberste Gruppe → genau eine kopftragende Tabelle, und die ist sichtbar | ⚠️¹ | ok    |
| 9 | `tests/utilityClasses.spec.ts` | Guard greift im **zweiten** Style-Block: Probe-Utility-Klasse in den SCSS-Block von `PositionsTable.vue` setzen → Test wird rot; Probe zurücknehmen → grün | ✅² | ok    |
| 10 | Terminal | `npm run typecheck && npm run lint && npm run test && npm run build` — alles grün | ✅³ | ok    |
| 11 | Gesamtwert aufklappen | Verlauf: Beträge links und Datumsangaben unten haben Abstand zum Rand — nichts klebt, nichts ist abgeschnitten. Auch am **rechten** Ende, und bei 375 px Breite | ➖⁴ | ok    |
| 12 | Kennzahlen-Zeile | Pfeil **und** Verlaufs-Kurve stehen senkrecht mittig neben dem Betrag, nicht am unteren Zeilenrand | ➖⁴ | ok    |

> ¹ **(CC):** 5 Tests, alle grün. Einschränkung: jsdom wertet die scoped Regel `display: none` nicht aus — geprüft wird, welche Tabelle die Klasse `postable__table--headless` **nicht** trägt und ob die sichtbar ist, nicht das gerenderte `thead`. Gegenprobe gemacht: mit der alten Semantik (`renderedGroups[0]`, unabhängig vom Zustand) fallen 4 der 5 Tests.
> ² **(CC):** Am 2026-08-19 rot gesehen — `.mt-4` im zweiten Style-Block von `PositionsTable.vue` meldet der Guard als `PositionsTable.vue (Stil): .mt-4`. Gegenprobe: mit der alten `[1]`-Fassung bleibt derselbe Fehler grün. Probe wieder entfernt.
> ³ **(CC):** Am 2026-08-19 lokal gelaufen: typecheck ✓, lint ✓, vitest 32 Dateien / 521 Tests ✓. Sagt nichts über #1–#7, #11 und #12 — dafür gibt es keinen Test.
> ⁴ **(CC):** Beim Testen gemeldet (#11/#12), Ursache gefunden und behoben — aber nur gerechnet, nicht angesehen. Beides ist reine Geometrie und braucht ein Auge.

### Kurz-Testblock

```bash
npm run dev            # #1–#7 — Dashboard unter http://localhost:5175/#/
npm run test           # #8, #9, #10
npm run typecheck && npm run lint && npm run build   # #10
```

Eingeklappte Gruppen zurücksetzen, falls #2/#3 einen sauberen Ausgangszustand braucht —
in der Browser-Konsole:

```js
localStorage.removeItem('stockportfolio.table.collapsedGroups'); location.reload()
```

---

## Details

### Kontext / Ziel

Der Code-Review über `a5224c0..HEAD` fand vier Befunde, alle vier sind behoben:

| Befund | Fix |
|---|---|
| `.postable > :not(:first-of-type)` wählte die kopftragende Tabelle nach DOM-Stellung — `v-show` lässt eingeklappte Tabellen stehen, also fiel die Kopfzeile einer unsichtbaren zu | `headedGroup` (erste **sichtbare** Gruppe) + Klasse `postable__table--headless` |
| `transition: opacity …` in `KpiCard.vue` überschrieb als Kurzschreibweise die `transform`-Drehung aus `UxCaret` | `transition: opacity …, transform …` |
| dasselbe in `PositionGroupHeader.vue` | dito |
| `utilityClasses.spec.ts` las je SFC nur den ersten `<style>`-Block — zwei Dateien haben zwei | `.slice(1).join('\n')` in `ausStil` und `ausMarkup` |

Was fehlt, ist der Nachweis. Der erste Befund war ein Zustandsfehler, den keine
Suite gesehen hat und der erst beim Einklappen auftrat — genau die Sorte, die
ohne Test ein zweites Mal kommt.

### Akzeptanzkriterien

- [x] Ein Test in `tests/` mountet `PositionsTable` mit mehreren Gruppen und prüft:
      Grundzustand → genau eine sichtbare Kopfzeile; oberste Gruppe eingeklappt →
      immer noch genau eine, und zwar an der ersten **sichtbaren** Tabelle.
- [x] Der Test schlägt gegen die alte Fassung fehl — kurz gegenprobieren,
      sonst bewacht er nichts.
- [x] #9 einmal absichtlich rot gesehen, nicht nur hergeleitet.
- [x] #1–#7 und #11–#12 vom Menschen im Browser abgehakt, in beiden Breiten (Tabelle und Kartenliste unter `md`).
- [x] Suite, Typecheck, Lint und Build grün.

### Side-Effects

Am Feature-Code keine. Im Testbestand einer: `fakeStorage()` stand wortgleich in
`stores/theme.spec.ts` und `stores/locale.spec.ts` — mit der dritten Kopie wäre es
der Fall aus den Hausregeln geworden. Der Helfer liegt jetzt in
`tests/fixtures/storage.ts`, beide Dateien nutzen ihn.

Zu beachten: `PositionsTable.vue` trägt jetzt eine
eigene Klasse an `<NDataTable>`. `componentStyles.spec.ts` erlaubt das, solange die
Regel nur Lage und Sichtbarkeit setzt (hier `display: none` auf einem `:deep`-Kind)
und keine der Eigenschaften anfasst, die Naive selbst mitbringt — wer die Regel
erweitert, prüft das mit.

### Auflösung

Vom Menschen am 2026-08-19 als erledigt erklärt.

| Commit | Inhalt |
|---|---|
| `b1e2cf0` | Spaltenkopf folgt der Sichtbarkeit statt der Dokumentstellung |
| `6bcf2e0` | Pfeil-Drehung wieder animiert; Pfeil und Verlauf mittig statt auf der Grundlinie |
| `f7552d9` | Achsenbeschriftungen im Wertverlauf mit Abstand zum Rand |
| `ca03d77` | Wächter für den Spaltenkopf, Guard liest alle Stil-Blöcke, gemeinsamer Speicher-Ersatz |

Stand beim Abschluss: typecheck ✓, lint ✓, vitest 33 Dateien / 526 Tests ✓,
build ✓.

**Findings:** Zwei Befunde kamen erst beim Testen dazu (#11/#12) und sind mit
behoben. Der Wächter für den Spaltenkopf prüft die Klassenvergabe, nicht das
gerenderte `thead` — jsdom wertet die scoped Regel nicht aus. Wer die Regel
später auf echtes Rendering umstellen will, braucht dafür einen Browser-Lauf.
