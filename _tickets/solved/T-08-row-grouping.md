# T-08 · Row-Grouping in der Positions-Tabelle + UI-Feinschliff

| Repo | Status | Time-box | Scope | GH-Issue |
|---|---|---|---|---|
| root | done | ~1 h | UI-only | — |

**Löst:** Die Positions-Tabelle gruppiert sichtbar nach Assetklasse — mit
Gruppen-Kopfzeile, Summe und Vorschlag je Gruppe. Dazu drei Detailkorrekturen
aus dem Nutzer-Feedback: Delta-Balken durchgezogen statt gestrichelt,
Navigation ohne Unterstreichung, Assetklassen-Kopf schlanker und farblich
zurückgenommen.

---

## Verify

Legende: ✅ live bestätigt · ⚠️ bestätigt mit Einschränkung (Fußnote) ·
◑ teilweise (Fußnote) · ➖ keine Live-Verifikation (nur Unit/Review).

| # | Where | Look for | AI | Human |
|---|---|---|:--:|---|
| 1 | Positions-Tabelle | Gruppen-Kopfzeile je Assetklasse mit Name, Anzahl Positionen, Summe, IST-%/Ziel-%, Delta-€ und Status-Badge | ◑¹ | |
| 2 | Gruppen-Kopfzeile | Klick klappt die Gruppe ein/aus; Zustand bleibt über einen Reload erhalten | ◑¹ | |
| 3 | Leere Gruppe | Erscheint gar nicht (keine leeren Kopfzeilen) | ✅² | |
| 4 | Sortierung | Sortieren innerhalb einer Gruppe funktioniert weiter, Gruppierung bleibt intakt | ◑¹ | |
| 5 | Delta-Balken | Bandgrenzen durchgezogen statt gestrichelt | ✅² | |
| 6 | Topbar | „StockPortfolio", „Dashboard", „Instrumente", „Einstellungen" ohne Unterstreichung — auch beim Hovern | ◑³ | |
| 7 | Drilldown-Links | myOEKB / extraetf sind weiterhin als Links erkennbar (bewusst unterstrichen) | ✅² | |
| 8 | Assetklassen-Kopf | Schlanker (py-2.5 statt py-4), gedämpfte Farbe; eingeklappt zeigt er die Gruppen-Anteile statt leerer Fläche | ◑¹ | |
| 9 | `npm run test` / `typecheck` / `build` / `lint` | **148 Tests grün**, typecheck grün, build grün, lint sauber | ✅⁴ | |

> ¹ **(CC):** Code geschrieben und typgeprüft, aber die Darstellung nicht selbst im Browser gesehen (Dev-Server läuft beim User). Bitte gegenprüfen.
> ² **(CC):** Am Code verifiziert — `renderedGroups` filtert Gruppen ohne Positionen heraus; `border-dashed` ist entfernt; die Drilldown-Links tragen weiterhin explizit `underline`.
> ³ **(CC):** Ursache war der fehlende Preflight (Tailwind aus, damit Naive UI intakt bleibt) — dadurch griff die Browser-Vorgabe `text-decoration: underline`. Global in `style.css` zurückgesetzt. Im Browser nicht selbst geprüft.
> ⁴ **(CC):** Lokal ausgeführt (2026-08-08).

---

## Details

### Kontext / Ziel
Bisher standen alle Positionen in einer flachen Liste — die Zuordnung zur
Assetklasse war nur im Drilldown sichtbar. Das Excel gruppierte sie deutlich;
das soll die App auch tun.

### Umsetzung
Naive UIs `DataTable` bringt kein Row-Grouping mit, das zur Expand-Spalte
passt. Statt die Tabelle gegen ihre Bauart zu biegen: eine Tabelle **pro
Gruppe**, jede mit eigener Kopfzeile. Das hält die Expand-Zeilen, die
Sortierung und das Inline-Editing intakt und macht Ein-/Ausklappen je Gruppe
trivial.

### Akzeptanzkriterien
- [ ] Gruppen-Kopfzeilen mit Summe, Anteil und Vorschlag
- [ ] Ein-/Ausklappen je Gruppe, in localStorage gemerkt
- [ ] Leere Gruppen werden übersprungen
- [ ] Delta-Balken durchgezogen
- [ ] Navigation ohne Unterstreichung
- [ ] Assetklassen-Kopf schlanker
- [ ] Ticket-Close + Commit

### Side-Effects
- Globaler Link-Reset in `style.css` (Preflight ist aus, daher nötig)

### Auflösung
Commit folgt nach Close.

**Row-Grouping — eine Tabelle je Gruppe:** Naive UIs `DataTable` bringt kein
Row-Grouping mit, das mit der Expand-Spalte zusammenspielt. Statt die Tabelle
gegen ihre Bauart zu biegen, rendert `PositionsTable` jetzt eine `NDataTable`
pro Gruppe, jeweils unter einer `PositionGroupHeader`-Zeile. Damit bleiben
Expand-Zeilen, Sortierung und Inline-Editing unangetastet, und das Ein-/
Ausklappen je Gruppe ist ein simples `v-show`. Die Spalten-Kopfzeile erscheint
per CSS nur über der ersten Gruppe — sonst stünde sie viermal untereinander.

**Unterstreichung:** Die Ursache war nicht das Markup, sondern der abgeschaltete
Tailwind-Preflight (nötig, damit Naive UIs Defaults intakt bleiben). Dadurch
griff die Browser-Vorgabe `text-decoration: underline` für `<a>`. Global in
`style.css` zurückgesetzt; die Inhalts-Links im Drilldown setzen `underline`
weiterhin selbst und bleiben dadurch als Links erkennbar.

**Assetklassen-Kopf:** Höhe von `py-4` auf `py-2.5` reduziert, das Grau vom
Container auf den Text verlagert (kein flächiges `bg-neutral`), Pfeil kleiner.
Eingeklappt zeigt er jetzt die Anteile aller Gruppen in einer Zeile — die
Information geht beim Einklappen also nicht verloren, sondern wird nur dichter.
Gruppen außerhalb ihres Bandes erscheinen dort bernsteinfarben.
