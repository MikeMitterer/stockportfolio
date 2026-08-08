# T-16 · Theming — sechs wählbare Themes

| Repo | Status | Time-box | Scope | GH-Issue |
|---|---|---|---|---|
| root | in-progress | ~2,5 h | Farb-Token-System + Theme-Auswahl | — |

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
| 1 | Topbar | Theme-Auswahl mit sechs Einträgen ersetzt den Hell/Dunkel-Schalter | ➖ | |
| 2 | Theme wechseln | Flächen, Text, Ränder und Bedienelemente wechseln gemeinsam — keine Reste des alten Themes | ➖ | |
| 3 | Reload | Die Wahl bleibt erhalten | ➖ | |
| 4 | Naive-UI-Elemente | Tabelle, Dialoge, Eingabefelder, Schalter folgen dem Theme | ➖ | |
| 5 | Assetklassen-Farben | Bleiben über alle Themes hinweg dieselbe Zuordnung (Aktien blau, Anleihen magenta, Metalle gold, Cash aqua) | ➖ | |
| 6 | Kontrast | Assetfarben halten in **jedem** Theme die Prüfung gegen dessen Fläche | ➖ | |
| 7 | Statusfarben | Kaufen/Verkaufen/OK bleiben in jedem Theme erkennbar | ➖ | |
| 8 | `npm run test` / `typecheck` / `build` / `lint` | Alle grün | ➖ | |

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
_TBD_
