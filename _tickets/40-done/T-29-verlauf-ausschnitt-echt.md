# T-29 · Wertverlauf — Ausschnitt „Echt" für die festgehaltenen Tageswerte

| Repo | Status | Time-box | Scope | GH-Issue |
|---|---|---|---|---|
| root | done | ~1 h | UI-only | — |

**Löst:** Neben 1M/3M/1J/Max fehlte der Ausschnitt, der genau die tatsächlich
festgehaltenen Tageswerte zeigt — und zwar ohne den gerechneten Rückblick, der
sonst blass daneben läuft.

---

## Verify

Legende: ✅ live bestätigt · ⚠️ bestätigt mit Einschränkung (Fußnote) ·
◑ teilweise (Fußnote) · ➖ keine Live-Verifikation (nur Unit/Review).
`AI` = nur KI · `Human` = nur Mensch (nie überschreiben).

| # | Where | Look for | AI | Human                    |
|---|---|---|:--:|--------------------------|
| 1 | `http://localhost:5175/#/`, Gesamtwert aufklappen | Hinter „Max" steht abgesetzt ein Knopf „Echt" | ➖¹ | ok                       |
| 2 | dito | „Echt" gewählt → **nur** die kräftige Linie, keine gestrichelte | ✅² | ok                       |
| 3 | dito | Zurück auf 1M/3M/1J/Max → beide Linien wieder da | ✅² | ok                       |
| 4 | dito | Bildunterschrift wechselt mit: unter „Echt" erklärt sie eine Linie, sonst zwei | ➖¹ | ok                       |
| 5 | Frisches Depot (0 oder 1 Tageswert) | Knopf ist gesperrt; Überfahren zeigt den Grund | ⚠️³ | nicht getestet - aber ok |
| 6 | dito, Telefon/schmal (< 768 px) | Dieselbe Erklärung öffnet per **Tipp** — Hover gibt es dort nicht | ➖¹ | wie oben                 |
| 7 | dito | Der gesperrte Knopf bricht die Zeile nicht um und sitzt auf einer Linie mit der Gruppe | ➖¹ | ok                       |
| 8 | Sprache auf Englisch | „Real" und beide neuen Texte erscheinen englisch | ➖¹ | ok                       |
| 9 | Terminal | `npm run typecheck && npm run lint && npm run test && npm run build` | ✅⁴ | ok                       |

> ¹ **(CC):** Reine Sichtprüfung, dafür gibt es keinen Test.
> ² **(CC):** Test-first gebaut, vor der Umsetzung rot gesehen: `tests/components/portfolioValueChart.spec.ts` prüft, dass `.value-chart__line--backtest` unter „Echt" fehlt und sonst da ist.
> ³ **(CC):** Dass der Knopf ab dem zweiten Tageswert freigibt und darunter `disabled` ist, deckt der Test ab. Ob das **Popup** erscheint, nicht — `NTooltip` rendert erst beim Überfahren.
> ⁴ **(CC):** Am 2026-08-19 gelaufen: typecheck ✓, lint ✓, vitest 33 Dateien / 526 Tests ✓, build ✓.

### Kurz-Testblock

```bash
npm run dev     # #1–#8 unter http://localhost:5175/#/
npm run test    # #2, #3, #5 (teilweise), #9
```

Den gesperrten Zustand (#5/#6) erreicht man ohne frisches Depot nicht von selbst —
dafür braucht es ein Depot, in dem noch keine zwei Tageswerte festgehalten sind.

---

## Details

### Kontext / Ziel

Das Diagramm zeigt zwei Linien: kräftig die tatsächlich festgehaltenen
Tageswerte, blass-gestrichelt den Rückblick, der den *heutigen* Bestand gegen
alte Kurse rechnet. Wer wissen will, was wirklich dastand, konnte das bisher
nicht isoliert ansehen.

Entscheidungen aus dem Vorgespräch:

| Frage | Entschieden |
|---|---|
| Beschriftung | „Echt" / „Real" — kurz genug für die Gruppe |
| Rückblick im Ausschnitt | **Nein.** Nur unter „Echt"; die anderen Zeiträume zeigen weiter beide |
| Kein Tageswert vorhanden | Knopf **gesperrt** mit Erklärung beim Überfahren (nicht ausgeblendet) |

### Akzeptanzkriterien

- [x] Knopf „Echt" hinter der Zeitraum-Gruppe, Auswahl schaltet auf die gemessene Reihe.
- [x] Unter „Echt" wird kein Rückblick gezeichnet; die übrigen Ausschnitte bleiben unverändert.
- [x] Gesperrt bei weniger als zwei Tageswerten, mit Erklärung; ab zwei frei.
- [x] Bildunterschrift zieht mit — unter „Echt" beschreibt sie eine Linie.
- [x] Beide Kataloge gepflegt, keine harten Texte.
- [x] #1, #4, #6, #7, #8 vom Menschen gesehen.

### Side-Effects

`days` als `ref<number>` ist zu einer Kennung (`selected: PeriodId`) geworden,
die Tageszahl hängt jetzt an `PERIOD_DAYS`. Nötig, weil „Echt" keine Länge ist,
sondern eine Quelle — zwei Ausschnitte hätten sonst dieselbe `0` getragen.

Der gesperrte Knopf steht in zwei ineinander liegenden `<span>`, weil ein
`disabled`-Button keine Mausereignisse annimmt und das Popup sonst an nichts
hinge. Beide tragen nur `display: inline-flex`, also nichts, was
`componentStyles.spec.ts` verbietet.

Abweichung vom besprochenen Entwurf: Der Knopf steht **neben** der
`NButtonGroup` statt darin. Ein `<span>`-Rahmen als direktes Kind der Gruppe
hätte deren Randanpassung gebrochen — abgesetzt passt es ohnehin besser, „Echt"
ist kein Längenmaß.

### Auflösung

Vom Menschen am 2026-08-19 als erledigt erklärt.

Ein Commit, `ea9cd51`: Ausschnitt „Echt", gesperrter Knopf samt Erklärung,
mitziehende Bildunterschrift, beide Kataloge und
`tests/components/portfolioValueChart.spec.ts`.

Stand beim Abschluss: typecheck ✓, lint ✓, vitest 33 Dateien / 526 Tests ✓,
build ✓.

**Findings:** Der Knopf steht neben statt in der `NButtonGroup` — ein
`<span>`-Rahmen als direktes Kind hätte deren Randanpassung gebrochen. Ob das
Popup tatsächlich erscheint, deckt kein Test ab; `NTooltip` rendert seinen
Inhalt erst beim Überfahren. Der gesperrte Zustand ist nur in einem Depot mit
weniger als zwei festgehaltenen Tageswerten überhaupt erreichbar.
