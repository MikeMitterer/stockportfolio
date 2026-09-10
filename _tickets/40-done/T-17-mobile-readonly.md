# T-17 · Mobile — reine Leseansicht

| Repo | Status | Time-box | Scope | GH-Issue |
|---|---|---|---|---|
| root | done | ~1,5 h | UI-only, unter 768 px | — |

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
| 1 | Fenster < 768 px | Statt der Tabelle erscheinen Karten, eine je Position | ✅¹ | |
| 2 | Karte | Symbol, Bezeichnung, Bestand, Kurs, Marktwert, IST-% / Ziel-% | ✅¹ | |
| 3 | Karte | Delta-Balken über die volle Kartenbreite | ✅¹ | |
| 4 | Karte | Status-Badge gut sichtbar | ✅¹ | |
| 5 | Karte | Farbpunkt der Assetklasse — dieselbe Farbe wie am Desktop | ✅¹ | |
| 6 | Kennzahlen | Untereinander statt vierspaltig, ohne seitliches Scrollen | ✅¹ | |
| 7 | Assetklassen-Balken | Auf Mobil **ausgeblendet** statt schmal gemacht | ⚠️² | |
| 8 | Kein Editieren | Keine Eingabefelder, kein „Position hinzufügen", kein Drilldown | ✅¹ | |
| 9 | Fenster ≥ 768 px | Unverändert die heutige Tabelle | ✅³ | |
| 10 | Kein Querlauf | Bei 375 px scrollt nichts seitlich — auf **allen drei** Seiten | ✅⁴ | |
| 11 | Menü auf Mobil | Alle drei Einträge vollständig sichtbar und bedienbar | ✅⁵ | |

> ¹ **(CC):** Im Produktions-Build bei 375 × 812 px gesehen (2026-08-08). Karten zeigen Basisdaten, IST/Ziel, Delta-Balken und Status; Farbpunkte und Gruppen-Trenner tragen dieselben Farben wie am Desktop.
> ² **(CC):** Abweichung vom Plan. Die Balkenzeile braucht acht Spalten nebeneinander und wäre bei 375 px unlesbar geworden. Die Gruppen-Trenner der Kartenliste zeigen dieselben Zahlen (IST/Ziel/Wert), daher ist die Information nicht verloren — die Darstellung als Balken schon.
> ³ **(CC):** Nach dem Zurückschalten auf Desktop-Breite gegengeprüft: Tabelle, Assetklassen-Balken und Bedienelemente unverändert.
> ⁴ **(CC):** `scrollWidth` gegen `innerWidth` gemessen, Überstand 0 auf Dashboard, Instrumente und Einstellungen.
> ⁵ **(CC):** Auf Nutzerhinweis nachgebessert — die Topbar lief anfangs über, „Instrumente" und „Einstellungen" waren abgeschnitten. Jetzt weichen Wortmarke und Beschriftungen auf schmalen Bildschirmen, die Symbole bleiben; die Beschriftung bleibt für Screenreader erhalten. Alle drei Einträge im Bild geprüft, Navigation funktioniert.

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
Commit folgt nach Close.

**Was entstanden ist:**
- `useIsCompact.ts` — eine Breitenabfrage über `matchMedia` bei 768 px, damit
  nicht jede Komponente ihren eigenen Umschaltpunkt erfindet. Der Wert
  entspricht Tailwinds `md`, sodass Ansicht und Layout-Klassen gemeinsam
  kippen.
- `PositionCard.vue` — eine Position zum Lesen.
- `PositionCardList.vue` — die Karten nach Assetklasse gegliedert, mit
  denselben Farben und Zahlen wie die Gruppen-Kopfzeilen am Desktop.

Beide nutzen dieselben `PositionResult`-Objekte wie die Tabelle: keine zweite
Datenquelle, kein eigener Router-Zweig, nur eine andere Darstellung.

**Nachgebessert auf Hinweis:** Die Topbar lief bei 375 px über — die hinteren
Menüeinträge waren abgeschnitten. Auf schmalen Bildschirmen weichen jetzt
Wortmarke, Nav-Beschriftungen, Kurs-Alter und die Beschriftung des
Aktualisieren-Knopfes; die Symbole bleiben. Die Beschriftungen sind über
`sr-only` weiterhin für Screenreader da, sie verschwinden nur optisch.

**Bewusst nicht gemacht:** deaktivierte Positionen erscheinen auch auf Mobil,
gedämpft und mit „inaktiv" gekennzeichnet — sonst wären sie dort unsichtbar,
und man könnte sich fragen, wo sie hin sind.
