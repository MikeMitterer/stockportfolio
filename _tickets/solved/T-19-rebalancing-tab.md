# T-19 · Rebalancing-Tab — Trade-Planer

| Repo | Status | Time-box | Scope | GH-Issue |
|---|---|---|---|---|
| root | done | ~3 h | Neuer Tab + Domain-Modul | — |

**Löst:** Das Planen eines Rebalancings war über den Drilldown je Position
verstreut — man sah nie, ob der Plan als Ganzes aufgeht. Ein eigener Tab
bildet jetzt die Spalten AA–AG der Excel-Vorlage ab.

---

## Verify

Legende: ✅ live bestätigt · ⚠️ bestätigt mit Einschränkung (Fußnote) ·
◑ teilweise (Fußnote) · ➖ keine Live-Verifikation (nur Unit/Review).

| # | Where | Look for | AI | Human |
|---|---|---|:--:|---|
| 1 | Navigation | Eigener Eintrag „Rebalancing" zwischen Dashboard und Instrumente | ✅¹ | |
| 2 | Tabelle | Je Position: Bestand, Kurs, IST-%, Vorschlag, Eingabe, Wert, Anteil nachher, Status | ✅¹ | |
| 3 | Verkauf eintragen | Negative Stückzahl → positiver Geldfluss, „Frei gemacht" steigt | ✅² | |
| 4 | Vorschlag | Verteilt die freigemachten Mittel nach Gruppenanteil, per Klick übernehmbar | ✅² | |
| 5 | Anteil nachher | Balken zeigt den Anteil nach dem Trade gegen Ziel und Band | ✅² | |
| 6 | Bilanz | „Geht der Plan auf?" — Zufluss minus Abfluss | ✅² | |
| 7 | Deckung | Warnung, wenn mehr gekauft als freigemacht wird | ✅³ | |
| 8 | Sicherheitspuffer | Warnung, wenn Cash + Geldmarkt darunter fallen | ✅¹ | |
| 9 | Plan übernehmen | Bucht die Stückzahlen auf die Bestände, danach ist der Plan leer | ➖⁴ | |
| 10 | `npm run test` / `typecheck` / `build` / `lint` | **283 Tests grün**, alles sauber | ✅⁵ | |

> ¹ **(CC):** Im Produktions-Build gesehen (2026-08-08). Die Puffer-Warnung erscheint korrekt, weil das Beispiel-Depot mit 15.116 € liquide unter dem Puffer von 170.000 € liegt.
> ² **(CC):** Der Ablauf des Nutzers durchgespielt: IS3M −100 → +10.116 € frei gemacht, Vorschläge erschienen (VGWL 40, EQQQ 3, IUSN 157), IUSN-Vorschlag per Klick übernommen → −1.449 €, Anteil stieg von 5,8 % auf 6,7 %, Bilanz auf +8.667 €.
> ³ **(CC):** Als Unit-Test abgedeckt („ungedeckt, wenn ohne Gegenfinanzierung gekauft wird"); die Warnung selbst nicht im Bild ausgelöst.
> ⁴ **(CC):** Nicht ausgeführt — das hätte die Bestände verändert. Der Pfad nutzt `applyTrade`, das aus T-05 getestet ist.
> ⁵ **(CC):** Lokal ausgeführt (2026-08-08).

---

## Details

### Kein abstraktes Budget — Korrektur während der Umsetzung
Der erste Entwurf hatte ein Eingabefeld „Einsatz für diesen Durchgang".
Nutzerhinweis: *„Der Einsatz muss von irgendwo herkommen. Konkret von Cash
oder/und vom Geldmarkt — evtl. auch durch den Verkauf eines anderen Assets."*

Das war der bessere Gedanke, und der Umbau hat das Modell vereinfacht: Es gibt
keinen Budget-Topf. Jeder gekaufte Euro muss im Plan sichtbar herkommen — aus
einem Verkauf oder aus einer Entnahme bei Cash bzw. Geldmarkt, dort als
negative Zahl eingetragen. Der Kopf zeigt „Frei gemacht", „Eingesetzt" und die
Bilanz; der Sicherheitspuffer begrenzt, wie weit Cash und Geldmarkt sinken
dürfen.

Nebeneffekt: Die Vorschläge verteilen jetzt genau das, was der Plan freigemacht
hat. Vor dem ersten Verkauf steht dort nichts — was ehrlich ist.

### Weitere Korrekturen aus dem Feedback
- Zeilen kompakter (`py-1` statt `py-2`), Balken flacher.
- Die Eingabe nimmt **jede** Stückzahl an; nur der Vorschlag rundet, und zwar
  auf ganze Stück (erst 100er, dann 10er, dann 1 — jeweils auf Zuruf).

### Der Balken „Anteil nachher"
Anders als der Delta-Balken auf dem Dashboard ist die Skala **absolut**
(Anteil am Gesamtvermögen), nicht relativ zum Ziel: beim Planen vergleicht man
Positionen untereinander, da muss dieselbe Länge dasselbe bedeuten. Ein feiner
gestrichelter Strich markiert den Anteil **vor** dem Trade, damit die Bewegung
sichtbar ist.

### Auflösung
Commit folgt.
