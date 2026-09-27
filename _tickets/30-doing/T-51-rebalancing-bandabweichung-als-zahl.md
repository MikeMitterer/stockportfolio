# T-51 · Relative Bandabweichung im Rebalancing als Zahl anzeigen

In der Rebalancing-Ansicht zeigt der Balken die relative Abweichung zum Ziel
im Verhältnis zu den Toleranzbändern. **Die zugehörige Zahl fehlt in der
sichtbaren Anzeige.** Sie soll wie im Dashboard direkt ablesbar sein, auch
solange die Position innerhalb des Bandes liegt. Die bisher sichtbare
Abweichung in Prozentpunkten beantwortet eine andere Frage.

**Beispiel:** Bei einem Zielanteil von 10 % und einem Anteil nach dem Trade
von 9,5 % beträgt die relative Abweichung −5 %. Bei einem unteren Band von
6 % liegt die Position damit innerhalb des Bandes. Die vorhandene Anzeige
−0,5 % beschreibt dagegen die Differenz von −0,5 Prozentpunkten zum Ziel.
Der Wert −5 % soll unmittelbar sichtbar werden.

**Stand:** Auf Mikes ausdrücklichen Auftrag vom 2026-09-27 unter `30-doing/`
angelegt und nach Mikes Abschluss von T-50 zur Umsetzung aktiviert.
Implementierung läuft auf `t-51-rebalancing-bandabweichung-als-zahl`. Der aktive Auftrag
und die Reihenfolge stehen ausschließlich in [STATUS.md](../STATUS.md);
T-50 ist in Runde 2 freigegeben und durch Mike abgeschlossen.

Für Mike steht jetzt keine Rückfrage an. Nach Umsetzung und technischer
Prüfung bleibt seine Abschlussbestätigung offen.

## Auftrag

Mike, 2026-09-27:

> Ich brauch von dir ein Ticket in doing und zwar geht es darum, dass in der
> Rebalancing-View der Balken zwar die Abweichung innerhalb der Bänder anzeigt
> aber es gibt nirgends eine Zahl, wie im Dashboard, dass die Abweichug innerhalb
> des Bandes anzeigt. Es wird nur die Abweichung vom Ziel angezeigt

Mike, anschließend am 2026-09-27:

> Danach geht es gleich mit T-51 weiter

## Umsetzung und technische Nachweise

Scope: UI-only in StockPortfolio. Die bestehende Berechnung und die
Bedeutung der Bänder bleiben erhalten. Kein GitHub-Issue angelegt.

### Ausgangsbefund und Ansatz

Quelltext bei Aufnahme gelesen; keine Browserprüfung durchgeführt:

- `src/views/RebalancingView.vue`: `DeltaBar` erhält
  `row.relativeDeviationAfter`, sein `label` wird aber mit
  `percent(row.percentAfter)` überschrieben. Neben dem Balken steht somit
  der Anteil nach dem Trade.
- Die Spalte für die Zielabweichung zeigt `row.deviationAfter`.
  `row.relativeDeviationAfter` steht dort lediglich im `title`-Attribut.
  Ein Hover-Text erfüllt die gewünschte direkt sichtbare Anzeige nicht.
- `src/components/DeltaBar.vue` zeigt ohne überschriebenes Label bereits
  `percentSigned(relativePercent)`. Das Dashboard nutzt diesen Baustein in
  `src/components/PositionsTable.vue` mit `row.relativeDeltaPercent`.
- `src/domain/tradePlan.ts` liefert den benötigten Wert bereits als
  `relativeDeviationAfter`. Die vorhandene Behandlung eines Zielanteils
  von null berücksichtigen; keine zweite Berechnung in der Ansicht aufbauen.

Die Darstellung soll die vorhandenen Werte wiederverwenden. Anteil nach
dem Trade, relative Abweichung und Differenz in Prozentpunkten müssen
verständlich unterscheidbar bleiben. Der Zahlenwert bezieht sich im
Rebalancing auf denselben simulierten Zustand wie der zugehörige Balken.

### Akzeptanzkriterien

- Die relative Abweichung ist bei jeder angezeigten Position direkt als
  Zahl lesbar, auch innerhalb der Bänder und ohne Hover.
- Vorzeichen, Rundung und Prozentformat folgen der Dashboard-Darstellung.
  Beschriftungen erklären den Bezug und sind in DE und EN verfügbar.
- Änderungen an simulierten Trades oder Zielanteilen aktualisieren Zahl
  und Balken gemeinsam. Der Anteil nach dem Trade bleibt erkennbar.
- Innerhalb, auf und außerhalb der Bandgrenzen stimmen Zahl, Balken und
  bestehende Bewertung überein. Nullabweichung und Zielanteil null erzeugen
  weder `NaN` noch eine unendliche oder irreführende neue Anzeige.
- Pflichtprüfungen und Doku-Abgleich sind im Ticket belegt.

### Verify

Einzige aktuelle technische Matrix. Alle Nachweise sind noch offen.
`➖` bedeutet: keine ausgeführte Verifikation.

| # | Prüfung | Erwartetes Ergebnis / Nachweis | AI |
|---|---|---|:--:|
| 1 | Beispiel mit Ziel 10 %, Anteil danach 9,5 % und unterem Band 6 % | −5 % relative Abweichung direkt sichtbar; Anteil 9,5 % und Differenz −0,5 Prozentpunkte unterscheidbar | ➖ |
| 2 | Negative, positive und null Abweichung; beide Bandgrenzen und Überschreitungen; Zielanteil null | Zahlenwert und bestehende Bandbewertung konsistent; Format wie im Dashboard, keine ungültigen Zahlen | ➖ |
| 3 | Simulierten Trade und Zielanteil ändern, anschließend DE/EN prüfen | Zahl und Balken zeigen denselben aktualisierten Zustand; verständliche Beschriftungen ohne Hover | ➖ |
| 4 | `make test`, `make lint`, `make typecheck`; Bezeichnerinventar geänderter Dateien | Erfolgreiche Pflichtprüfungen; englische Bezeichner | ➖ |
| 5 | Betroffene Anleitungen und bestehende Anzeigen abgleichen | Doku-Abgleich belegt; Anteil nach dem Trade und bisherige Statusinformationen weiterhin verständlich | ➖ |

### Side-Effects

Zusätzlicher sichtbarer Zahlenwert beziehungsweise angepasste Beschriftung
in der Rebalancing-Tabelle. Keine Änderung an Handelsberechnung,
Bandkonfiguration, Speicherung oder StockInfo-Vertrag vorgesehen.

### Lessons und Doku-Abgleich

Der fehlende sichtbare Zahlenwert ist ein einzelner Nutzerbefund. Ein
wiederkehrendes Fehlermuster ist damit nicht belegt; keine neue Lesson
angelegt. AL-R-01 gilt für die Nachweise: Der Quelltextbefund bei Aufnahme
ersetzt keine Prüfung der sichtbaren Darstellung. SP-CX-02 ist beim späteren
Doku-Abgleich zu berücksichtigen.

**Doku-Abgleich bei Aufnahme:** `README.md` beschreibt unter „What it does“
relative Bänder und unter „Rebalancing is a simulation“ die simulierten
Anteile. `docker/README.md` nennt unter „Features“ das Rebalancing mit
Toleranzbändern. Beide Anleitungen versprechen bislang keinen solchen
Zahlenwert und bleiben für die reine Ticketaufnahme unverändert.
Bei Umsetzung diese Abschnitte und betroffene Erklärungen in App und `docs/`
abgleichen; nötige Anpassungen oder begründete Nichtänderung dokumentieren.
Installation, Betrieb und Unraid-Konfiguration sind nicht betroffen.

Die allgemeine Übernahme der Board-Konventionen auf
`2026-09-11-lessons-follow-through` bleibt separat offen. Dieser Auftrag
ändert keine Board-Konvention und erfordert daher keine Skill-Änderung.

### Auflösung

Ticket erfasst. Umsetzung, technische Prüfung und menschlicher Abschluss
stehen aus.
