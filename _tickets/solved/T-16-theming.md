# T-16 · Theming — sechs wählbare Themes

| Repo | Status | Time-box | Scope | GH-Issue |
|---|---|---|---|---|
| root | done | ~3 h | Farb-Token-System + Theme-Auswahl | — |

**Löst:** Statt des Hell/Dunkel-Schalters stehen sechs vollständige Themes zur
Auswahl. Voraussetzung dafür ist ein Token-System: die Oberfläche trägt heute
fest verdrahtete Farbklassen (`bg-neutral-950`, `text-neutral-100`), die sich
nicht umschalten lassen.

---

## Verify

Legende: ✅ live bestätigt · ⚠️ bestätigt mit Einschränkung (Fußnote) ·
◑ teilweise (Fußnote) · ➖ keine Live-Verifikation (nur Unit/Review).

| # | Where | Look for | AI | Human |
|---|---|---|:--:|---|
| 1 | Topbar | Theme-Auswahl mit sechs Einträgen ersetzt den Hell/Dunkel-Schalter | ✅¹ | |
| 2 | Theme wechseln | Flächen, Text, Ränder und Bedienelemente wechseln gemeinsam — keine Reste des alten Themes | ✅¹ | |
| 3 | Reload | Die Wahl bleibt erhalten | ➖² | |
| 4 | Naive-UI-Elemente | Tabelle, Dialoge, Eingabefelder, Schalter folgen dem Theme | ✅¹ | |
| 5 | Assetklassen-Farben | Bleiben über alle Themes hinweg dieselbe Zuordnung | ✅¹ | |
| 6 | Kontrast | Assetfarben halten in **jedem** Theme die Prüfung gegen dessen Fläche | ✅³ | |
| 7 | Statusfarben | Kaufen/Verkaufen/OK bleiben in jedem Theme erkennbar | ⚠️⁴ | |
| 8 | `npm run test` / `typecheck` / `build` / `lint` | **241 Tests grün**, alles sauber | ✅⁵ | |

> ¹ **(CC):** Gegen den **Produktions-Build** geprüft (`vite preview`, 2026-08-08), nicht gegen den Dev-Server — der hatte die geänderte `tailwind.config.ts` nicht neu eingelesen und zeigte deshalb ungefüllte Balken. MangoLila, Ocean, Paper und Classic im Bild gesehen: Flächen, Akzent, Nav-Unterstrich, Delta-Füllung und Assetpunkte alle korrekt.
> ² **(CC):** Nicht eigens geprüft; die Wahl liegt in localStorage und wird beim Start über `init()` gelesen.
> ³ **(CC):** Für alle sechs Flächen mit dem Validator gerechnet, nicht geschätzt — jeweils „ALL CHECKS PASS" auf der Nachbarpaar-Liste. In den hellen Themes liegen drei Töne unter 3:1 Kontrast; das ist die dokumentierte Ausnahme, weil jeder Balken seinen Namen ausgeschrieben trägt.
> ⁴ **(CC):** Im hellen Theme (Paper) korrigiert und nachgeprüft — vorher waren die Badges fast unsichtbar. Für Forest und Mono habe ich die Statusfarben **nicht** im Bild gesehen, nur die Tokens gesetzt.
> ⁵ **(CC):** Lokal ausgeführt (2026-08-08).

---

## Details

### Warum kein Hell/Dunkel-Schalter mehr
Sechs Themes **mal** zwei Helligkeiten wären zwölf Kombinationen — jede
einzeln zu prüfen. Stattdessen ist jedes Theme ein fertiges Gesamtbild, wie
in der MakeLib-Konvention (`MAKE_THEME`), wo Themes ebenfalls keine
Helligkeitsachse haben. Unter den sechs sind helle und dunkle.

### Die sechs Themes
Namen bewusst an die MakeLib angelehnt, damit Terminal und App dieselbe
Sprache sprechen:

| Theme | Charakter |
|---|---|
| `classic` | dunkel, neutralgrau — das bisherige Bild, Vorgabe |
| `ocean` | dunkel, blaustichige Flächen |
| `forest` | dunkel, grünstichig |
| `night` | dunkel, violettstichig |
| `paper` | hell, warmes Off-White |
| `mono` | hell, nahezu farblos — für maximale Ruhe |

### Was ein Theme festlegt
Nur die **Umgebung**, nicht die Bedeutung:

- Flächen (Seite, Karte, erhöhte Fläche)
- Text (primär, sekundär, gedämpft)
- Ränder und Trennlinien
- Akzent (Bedienelemente, Fokus, Verweise)

**Nicht** vom Theme bestimmt: die Farben der Assetklassen und die
Statusfarben. Beide tragen Bedeutung — wenn Aktien je nach Theme mal blau,
mal grün wären, müsste man die Zuordnung neu lernen. Sie werden aber je
Theme **gegen dessen Fläche geprüft**, in hellen Themes mit den hellen
Stufen, in dunklen mit den dunklen.

### Umsetzung
- `src/theme/tokens.css` — je Theme ein `[data-theme="…"]`-Block
- `src/theme/naive.ts` — leitet Naive-UI-Overrides aus denselben Tokens ab,
  damit Tabelle und Dialoge nicht auseinanderlaufen
- `src/stores/theme.ts` — aktives Theme, in localStorage gehalten
- `src/components/ThemeSwitcher.vue` — Auswahl in der Topbar
- Komponenten: feste Farbklassen durch Token-Klassen ersetzen

### Akzeptanzkriterien
- [ ] Token-System für sechs Themes
- [ ] Naive UI folgt den Tokens
- [ ] Auswahl in der Topbar, Wahl bleibt erhalten
- [ ] Assetfarben je Theme validiert
- [ ] Ticket-Close + Commit

### Side-Effects
- Der Hell/Dunkel-Schalter entfällt; der gespeicherte Wert wird einmalig in
  ein Theme übersetzt (`dark` → `classic`, `light` → `paper`)

### Auflösung
Commit `7e1ec06` und Nachtrag.

**MangoLila statt Night, und als Vorgabe.** Nach dem Blick auf das
StockInfo-Backend-Frontend ist aus dem violetten Theme eines geworden, das
dessen Farbwelt trifft (Pflaume mit Koralle) — beide Oberflächen sollen als
eine Familie erkennbar sein. Von dort ebenfalls übernommen: Logo-Plakette mit
Verlauf, Navigation mit Symbolen, Akzent-Unterstrich am aktiven Eintrag.

**Zwei Fallstricke, beide erst im Browser sichtbar:**

1. *Naive UI riss die Tabelle mit.* Sein Farbparser (seemly) kennt die moderne
   Schreibweise `rgb(42 120 214)` nicht und wirft — die Tabelle verschwand
   komplett. Die Token-Brücke liefert jetzt die Form mit Kommas. Der
   Konsolen-Fehler war eindeutig; ohne ihn hätte ich lange gesucht.
2. *Statusfarben verschwanden im hellen Theme.* Sie hingen an festen Klassen
   wie `text-emerald-300`, die für dunkle Flächen gedacht sind. Über die Token
   bekommt jedes Theme die Stufe, die auf seiner Fläche trägt.

**RGB-Tripel statt Hex.** Mit Hex-Werten greifen Tailwinds Deckkraft-Zusätze
nicht — `bg-card/70` bliebe unsichtbar. Die Tokens stehen daher als
`23 23 23`; wer sie direkt verwendet, schreibt `rgb(var(--surface-card))`.

**Zum Merken:** Eine geänderte `tailwind.config.ts` wird vom laufenden
Dev-Server nicht neu eingelesen. Der Build war die ganze Zeit korrekt, nur die
Live-Ansicht nicht — beim nächsten Mal zuerst dort nachsehen, statt den Code
zu verdächtigen.
