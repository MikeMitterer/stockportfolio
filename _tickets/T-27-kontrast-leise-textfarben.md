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
| 1 | `theme-tokens.py check src/theme/_tokens.scss` | Ausgabe endet mit „Alle harten Grenzwerte eingehalten", Exit-Code **0** | ➖ | |
| 2 | ebenda, `--zonen` | keine `!`-Hinweise mehr bei `--text-muted` auf `--surface-raised` | ➖ | |
| 3 | App, jedes der neun Themes | Beschriftungen und Hinweistexte lesbar, ohne dass sie zu **Fließtext** werden — sie sollen leise bleiben | ➖ | |
| 4 | `paper`, `mono`, `sepia`, `meadow` | die hellen Themes kippen nicht ins Graue: leiser Text dunkler statt heller | ➖ | |
| 5 | Statuszeile in `classic`, `ocean`, `slate`, `forest`, `mono`, `paper` | „powered by", Trennpunkte und Versionsangabe lesbar | ➖ | |
| 6 | `classic` und `paper`, Hauptknopf einer Ansicht | Text **auf** der Akzentfläche lesbar (dort reißt `--accent-contrast`) | ➖ | |
| 7 | `npm run build && npm test` | `vue-tsc -b` ohne Fehler, Testsuite grün | ➖ | |

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

### Akzeptanzkriterien

- [ ] `theme-tokens.py check` liefert Exit-Code 0
- [ ] Farbton und Sättigung jedes Themes unverändert — nur Helligkeit der
      leisen Textstufen und, wo nötig, `--accent-contrast`
- [ ] `--text-bar-muted` in den betroffenen sechs Themes **explizit** gesetzt
      statt über den Rückfall auf `--text-muted`
- [ ] Vorschaufarben in `themes.ts` nachgezogen, falls sich `ink` ändert
- [ ] Verify-Zeilen 1–6 vom Menschen bestätigt

### Side-Effects

Kein Backend-Change, keine Komponente angefasst — nur Token-Werte in
`src/theme/_tokens.scss`.

**Sichtbare Wirkung in neun Themes.** Beschriftungen, Einheiten und
Hinweistexte werden heller (in den hellen Themes dunkler). Das ist der Zweck,
aber es verändert das Bild aller betroffenen Themes gleichzeitig — deshalb
Verify-Zeile 3 und nicht nur der Zahlencheck.

`carbon`, `mangolila`, `amber` und `petrol` bleiben unangetastet.

Sinnvoll wäre danach ein Make-Target, das `theme-tokens.py check` bei jedem
Build mitlaufen lässt — sonst wandert dieselbe Abweichung beim nächsten neuen
Theme wieder herein. Eigenes Ticket, nicht hier.

### Auflösung

_(offen)_
