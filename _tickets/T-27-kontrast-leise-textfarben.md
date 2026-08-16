# T-27 · Kontrast der leisen Textfarben in neun Themes

| Repo | Status | Time-box | Scope | GH-Issue |
|---|---|---|---|---|
| frontend | ready | ~2 h | UI-only | — |

**Löst:** `--text-muted` verfehlt in **neun von dreizehn** Themes die eigene
Regel (≥ 4.5:1 gegen `--surface-card`), in sechs davon zusätzlich
`--text-bar-muted` gegen die Leisten und in zweien `--accent-contrast` gegen
`--accent`. Gefunden beim ersten Lauf von `theme-tokens.py check`.

<!--
  Repo:   frontend. Status: ready. Scope: UI-only (nur Token-Werte).
  Fund vom 2026-08-15 bei der Neufassung von mangolila. Die Regel steht seit
  Langem in ux-standards/references/themes.md — nachgemessen hatte sie nie
  jemand, weil dreizehn Paletten von Hand niemand durchrechnet.
  Nicht betroffen: mangolila, amber, petrol (Werte gerechnet), carbon.
-->

---

## Verify

Legende: ✅ live bestätigt · ⚠️ bestätigt mit Einschränkung (Fußnote) ·
◑ teilweise (Fußnote) · ➖ keine Live-Verifikation (nur Unit/Review).
`AI` = nur KI · `Human` = nur Mensch (nie überschreiben).

| # | Where | Look for | AI | Human |
|---|---|---|:--:|---|
| 1 | `theme-tokens.py check src/theme/_tokens.scss` | Ausgabe endet mit „Alle harten Grenzwerte eingehalten", Exit-Code **0** | ✅¹ | |
| 2 | ebenda, `--zonen` | keine `!`-Hinweise mehr bei `--text-muted` auf `--surface-raised` | ⚠️² | |
| 3 | App, jedes der neun Themes | Beschriftungen und Hinweistexte lesbar, ohne dass sie zu **Fließtext** werden — sie sollen leise bleiben | ◑³ | |
| 4 | `paper`, `mono`, `sepia`, `meadow` | die hellen Themes kippen nicht ins Graue: leiser Text dunkler statt heller | ✅⁴ | |
| 5 | Statuszeile in `classic`, `ocean`, `slate`, `forest`, `mono`, `paper` | „powered by", Trennpunkte und Versionsangabe lesbar | ➖ | |
| 6 | `classic` und `paper`, Hauptknopf einer Ansicht | Text **auf** der Akzentfläche lesbar | ➖⁵ | |
| 7 | `npm run build && npm test` | `vue-tsc -b` ohne Fehler, Testsuite grün | ✅⁶ | |

> ¹ **(CC):** live gegen `src/theme/_tokens.scss` (2026-08-16). Alle dreizehn
> Themes, Exit-Code 0.
> ² **(CC):** ⚠️ **Nicht erfüllt, bewusst.** Fünf Themes (`aurora`, `classic`,
> `forest`, `ocean`, `slate`) tragen weiter den weichen Hinweis auf
> `--surface-raised`, Werte 3.70 bis 4.16. Grund steht unten unter
> „Entscheidung"; kurz: Die strenge Variante lässt `secondary` und `muted`
> ineinanderlaufen — bei `forest` bliebe ein Abstand von 8 % Helligkeit, bei
> `slate` rund 4 %. Dann gibt es keine leise Stufe mehr, nur zwei fast gleiche.
> ³ **(CC):** ◑ nur `slate` (+10 %, größte Anhebung) und `paper` (−8 %, hellstes
> Theme) im Browser angesehen — beide lesbar und weiterhin erkennbar leiser als
> die Werte daneben. **Die übrigen sieben stehen aus.**
> ⁴ **(CC):** gemessen — `meadow` −11 %, `mono` −10 %, `paper` −11 % (in zwei
> Schritten), `sepia` −8 %. Alle vier nach unten, keiner ins Graue.
> ⁵ **(CC):** ➖ nicht angesehen. Zahlenstand: `classic` 3.64 → 4.51,
> `paper` 4.42 → 4.52. **Abweichung von der Vorgabe:** Verschoben wurde
> `--accent`, nicht `--accent-contrast` (Begründung unter „Entscheidung").
> ⁶ **(CC):** `vue-tsc -b` exit 0, `vite build` ok, 533 Tests in 28 Dateien grün.

```bash
# #1 — muss 0 liefern
python3 ~/.claude/skills/ux-standards/scripts/theme-tokens.py check src/theme/_tokens.scss
echo $?

# #2 — Zonen und weiche Hinweise
python3 ~/.claude/skills/ux-standards/scripts/theme-tokens.py check src/theme/_tokens.scss --zonen

# #7
npm run build && npm test
```

---

## Details

### Kontext / Ziel

Messstand vom 2026-08-15, harte Verstöße:

| Theme | `--text-muted` / card | `--text-bar-muted` / Leisten | `--accent-contrast` / accent |
|---|---|---|---|
| `aurora` | 3.81 | — | — |
| `classic` | 3.36 | 3.72 / 3.36 | **3.64** |
| `forest` | 3.57 | 4.07 / 3.57 | — |
| `meadow` | 3.11 | — | — |
| `mono` | 3.44 | 3.21 / 3.44 | — |
| `ocean` | 3.31 | 3.76 / 3.31 | — |
| `paper` | 3.48 | 3.02 / 3.48 | **4.42** |
| `sepia` | 3.38 | — | — |
| `slate` | 3.20 | 3.98 / 3.98 | — |

Verlangt sind 4.5:1. Sauber sind `carbon` sowie `mangolila`, `amber` und
`petrol` — bei den drei letzten, weil ihre Werte gerechnet und nicht gesetzt
wurden.

**Nicht von Hand nachbessern.** `theme-tokens.py` löst die Helligkeit gegen
eine Zielfläche; dieselbe Funktion hat die drei neuen Themes erzeugt. Der
Farbton und die Sättigung jedes Themes bleiben unangetastet, nur die
Helligkeit der leisen Stufen wandert. Wer stattdessen Hex-Werte anpasst,
landet wieder bei „fast richtig", und fast richtig sieht man nicht.

**Gegen welche Fläche gelöst wird, ist die eigentliche Entscheidung.** Die
Regel nennt `--surface-card`. Leiser Text steht aber auch auf
`--surface-raised` (Menüs, Popover) und in den Leisten. Gegen die *hellste*
Fläche zu lösen erfüllt alles auf einmal, hebt den Text aber sichtbar an —
in den drei neuen Themes landete `muted` dadurch bei 58–68 % Helligkeit statt
bei 48 %. Das ist der Punkt, an dem Verify-Zeile 3 entscheidet: Der Text muss
lesbar werden, ohne seine Rolle als *leise* Stufe zu verlieren.

Vorschlag, falls beides nicht zusammengeht: hart gegen `--surface-card` und
die Leisten lösen (das ist die Regel), `--surface-raised` als weichen Hinweis
stehen lassen — Menüs sind kurzlebig, eine Tabelle liest man minutenlang.

### Entscheidung

Das Ticket ließ offen, gegen welche Fläche gelöst wird, und schlug einen
Kompromiss vor. Gemessen wurden beide Varianten; entschieden hat der Abstand
zwischen `--text-secondary` und `--text-muted` — die Leiter, die „zweite
Ebene" von „leise" trennt:

| Theme | hart (Karte + Leisten) | streng (zusätzlich `raised`) |
|---|---|---|
| `aurora` | 15 % | 13 % |
| `classic` | 13 % | 10 % |
| `forest` | 15 % | **8 %** |
| `slate` | ~10 % | **~4 %** |

Die strenge Variante hebt `muted` bei `slate` von 46 auf 62 % und bei `ocean`
von 45 auf 59 %. Damit liegt die leise Stufe praktisch auf der zweiten Ebene,
und die Abstufung, um die es geht, ist weg. **Gewählt: hart.** Menüs und
Popover sind kurzlebig, eine Tabelle liest man minutenlang — der weiche
Hinweis bleibt bewusst stehen.

**Zweite Abweichung: verschoben wurde `--accent`, nicht `--accent-contrast`.**
In `paper` ist die Schrift auf der Akzentfläche bereits weiß und verfehlt die
Grenze um vier Hundertstel (4.42 statt 4.5) — heller geht nicht. Bliebe nur,
weiße Schrift durch dunkle zu ersetzen, und das sieht jeder. Den Akzent um ein
bis sieben Prozent Helligkeit zu bewegen sieht niemand, und es wirkt in beide
Richtungen richtig: Der Akzent hebt sich damit auch von der Inhaltsfläche
besser ab.

### Akzeptanzkriterien

- [x] `theme-tokens.py check` liefert Exit-Code 0
- [x] Farbton und Sättigung jedes Themes unverändert — nur Helligkeit
- [x] `--accent` in `classic` (56 → 49 %) und `paper` (50 → 49 %) statt
      `--accent-contrast`, Begründung oben
- [x] Vorschaufarben in `themes.ts` nachgezogen (`classic` `#3987e5` →
      `#1d74dd`, `paper` `#2a78d6` → `#2876d2`)
- [ ] `--text-bar-muted` **explizit** setzen — *entfällt:* Nach der Korrektur
      trägt der Rückfall auf `--text-muted` überall, kein Theme braucht einen
      eigenen Wert (geprüft, Zeile 1)
- [ ] Verify-Zeilen 3, 5 und 6 vom Menschen bestätigt

### Side-Effects

Kein Backend-Change, keine Komponente angefasst — nur Token-Werte in
`src/theme/_tokens.scss`.

**Sichtbare Wirkung in neun Themes.** Beschriftungen, Einheiten und
Hinweistexte werden heller (in den hellen Themes dunkler). Das ist der Zweck,
aber es verändert das Bild aller betroffenen Themes gleichzeitig — deshalb
Verify-Zeile 3 und nicht nur der Zahlencheck.

`carbon`, `mangolila`, `amber` und `petrol` bleiben unangetastet.

Ein Make-Target für `theme-tokens.py check` wurde erwogen und von Mike
verworfen (2026-08-16). Die Prüfung läuft damit nur, wenn jemand sie aufruft.

### Auflösung

Elf Werte in neun Themes verschoben, alle nur in der Helligkeit:

| Theme | Token | vorher | nachher |
|---|---|---|---|
| `aurora` | `--text-muted` | 50 % | 55 % |
| `classic` | `--text-muted` | 42 % | 51 % |
| `classic` | `--accent` | 56 % | 49 % |
| `forest` | `--text-muted` | 43 % | 50 % |
| `meadow` | `--text-muted` | 55 % | 44 % |
| `mono` | `--text-muted` | 52 % | 42 % |
| `ocean` | `--text-muted` | 45 % | 54 % |
| `paper` | `--text-muted` | 51 % | 40 % |
| `paper` | `--accent` | 50 % | 49 % |
| `sepia` | `--text-muted` | 51 % | 43 % |
| `slate` | `--text-muted` | 46 % | 56 % |

Gerechnet, nicht getippt: Von jedem heutigen Wert aus in die Richtung, die den
Kontrast erhöht, und beim ersten Wert stehengeblieben, der 4.5:1 erreicht. So
bleibt jedes Theme so nah wie möglich an seiner bisherigen Wirkung — ein
gemeinsamer Zielwert hätte alle neun einander angeglichen.

**Zwei Fallen im Skript, beide erst durch die Nachprüfung aufgefallen** und
für den nächsten Durchgang notiert:

- `mono` steht **zweimal** in `_tokens.scss` — einmal als Palette, einmal im
  `--brand-word`-Block (`:root[data-theme='paper'], :root[data-theme='mono']`).
  Ein `re.search` trifft den ersten und schreibt ins Leere. Geschrieben werden
  muss in den Block, der das Token tatsächlich enthält.
- Wer die **Rückfallkette der Leisten** nicht auflöst (`--surface-header` →
  `--surface-page`), übersieht bei `paper` genau die Fläche, auf der der Text
  am schlechtesten steht. Der Prüfer kann das, das Korrekturskript konnte es
  zuerst nicht.

Nicht angefasst: `carbon`, `mangolila`, `amber`, `petrol` — dort waren die
Werte bereits gerechnet.

**Offen:** Verify-Zeilen 3 (sieben der neun Themes), 5 und 6 im Browser;
danach `git mv` nach `solved/`.
