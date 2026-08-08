# T-17 · Mobile — reine Leseansicht

| Repo | Status | Time-box | Scope | GH-Issue |
|---|---|---|---|---|
| root | ready | ~1,5 h | UI-only, unter 768 px | — |

**Löst:** Auf dem Telefon ist die Positions-Tabelle mit neun Spalten und rund
1.100 px Mindestbreite unbrauchbar. Unter 768 px tritt an ihre Stelle eine
**Leseansicht**: Basisdaten, Delta, Status. Kein Editieren, kein
Trade-Simulator, kein Hinzufügen.

---

## Verify

Legende: ✅ live bestätigt · ⚠️ bestätigt mit Einschränkung (Fußnote) ·
◑ teilweise (Fußnote) · ➖ keine Live-Verifikation (nur Unit/Review).

| # | Where | Look for | AI | Human |
|---|---|---|:--:|---|
| 1 | Fenster < 768 px | Statt der Tabelle erscheinen Karten, eine je Position | ➖ | |
| 2 | Karte | Symbol, Bezeichnung, Bestand, Kurs, Marktwert, IST-% / Ziel-% | ➖ | |
| 3 | Karte | Delta-Balken über die volle Kartenbreite | ➖ | |
| 4 | Karte | Status-Badge gut sichtbar | ➖ | |
| 5 | Karte | Farbpunkt der Assetklasse — dieselbe Farbe wie am Desktop | ➖ | |
| 6 | Kennzahlen | Untereinander statt vierspaltig, ohne seitliches Scrollen | ➖ | |
| 7 | Assetklassen-Balken | Bleiben sichtbar, auf schmale Breite gebracht | ➖ | |
| 8 | Kein Editieren | Keine Eingabefelder, kein „Position hinzufügen", kein Drilldown | ➖ | |
| 9 | Fenster ≥ 768 px | Unverändert die heutige Tabelle | ➖ | |
| 10 | Kein Querlauf | Bei 360 px Breite scrollt nichts seitlich | ➖ | |

---

## Details

### Entscheidung: Lesen statt Bedienen
Rebalancing ist eine Tätigkeit, für die man sich hinsetzt — das bleibt am
Desktop. Unterwegs zählt eine Frage: *Ist etwas aus dem Band gelaufen?*
Deshalb keine Karten mit Aufklapp-Bedienung, sondern eine Ansicht zum
Nachsehen. Das ist auch die kleinere Änderung: die Tabelle und alles
Editierbare bleiben unangetastet.

### Was auf die Karte gehört
Nach Nutzer-Vorgabe: **Basisdaten, Delta, Status.**

```
┌────────────────────────────────────┐
│ ● VGWL.DE              [OK]        │
│   Vanguard FTSE All-World          │
│                                    │
│   500 Stk · 163,10 €               │
│   81.550 €                         │
│   51,0 % / 45,0 %                  │
│                                    │
│   [────────▌+13,3 %────────]       │
└────────────────────────────────────┘
```

### Umsetzung
- `src/components/PositionCard.vue` — die Leseansicht einer Position
- `src/composables/useIsCompact.ts` — Breitenabfrage über `matchMedia`,
  damit nicht jede Komponente ihren eigenen Umschaltpunkt erfindet
- `DashboardView` wählt zwischen `PositionsTable` und der Kartenliste;
  die Assetklassen-Kopfzeilen bleiben in beiden Fällen als Trenner
- Kennzahlen von `grid-cols-4` auf einspaltig unter 768 px

Bewusst **kein** eigener Router-Zweig und keine zweite Datenquelle: dieselben
`PositionResult`-Objekte, nur anders dargestellt.

### Offen für später
Der Nutzer hat angemerkt, dass die **Desktop**-Ansicht ohnehin noch eine
UI-Änderung braucht. Was genau, ist noch offen — dieses Ticket greift dem
nicht vor und fasst die Tabelle nicht an.

### Akzeptanzkriterien
- [ ] `PositionCard.vue` + `useIsCompact.ts`
- [ ] Umschaltung im Dashboard, Assetklassen-Balken schmal-tauglich
- [ ] Kein seitliches Scrollen bei 360 px
- [ ] Desktop unverändert
- [ ] Ticket-Close + Commit

### Side-Effects
- Keine — die bestehende Tabelle bleibt unberührt

### Auflösung
_TBD_
