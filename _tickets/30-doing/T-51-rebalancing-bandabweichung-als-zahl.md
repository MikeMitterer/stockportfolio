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

**Stand:** Umsetzung und eigene technische Prüfung abgeschlossen auf
`t-51-rebalancing-bandabweichung-als-zahl`. Die unabhängige Prüfung steht aus.
T-50 ist abgeschlossen; anschließend folgt T-52 nach der Reihenfolge in STATUS.

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

Weitere Anzeigevorgaben von Mike, 2026-09-27:

> In der IST Spalte bricht das %-Zeichen immer wiedermal in die nächste Zeile um

> Mach den Text "Anteil nachher ... " ein wenig kleiner

> Den %-Wert für die relative Abweichung grün bzw rot je nach + oder -

## Umsetzung und technische Nachweise

Scope: UI-only in StockPortfolio. Die bestehende Berechnung und die
Bedeutung der Bänder bleiben erhalten. Kein GitHub-Issue angelegt.

### Ausgangsbefund bei Aufnahme

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

**Umsetzung:** `DeltaBar` zeigt `relativeDeviationAfter` wieder mit seinem
unveränderten Standardformat wie im Dashboard. Der Anteil danach steht als
beschriftete zweite Zeile darunter. Die Nachbarspalte benennt Prozentpunkte
und verwendet eine Zahl ohne irreführendes Prozentzeichen. Bei Ziel 0 %
steht am Balken „—“ mit einer sichtbaren Erklärung. Die Berechnung bleibt in
`computeTradePlan`; `decimalSigned` teilt die vorhandene Zahlenformatierung
mit `percentSigned`. Der vorhandene i18n-Schlüssel für den Tooltip am
probeweisen Ziel ersetzt dort außerdem den hartkodierten deutschen Text.

Die IST-Prozentzelle bleibt mit `white-space: nowrap` zusammen. „Anteil
nachher …“ ist von 12 auf 11 Pixel verkleinert. Die relative Zahl ist im
Rebalancing bei positivem Vorzeichen grün, bei negativem rot, bei null oder
undefiniertem Ziel neutral. `DeltaBar` bietet dafür `colorBySign`; die
Balkenfüllung zeigt weiterhin unabhängig davon den Bandstatus.

Die Darstellung verwendet die vorhandenen Werte wieder. Anteil nach
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

Einzige aktuelle technische Matrix. ✅ ausgeführt und bestätigt.
Tests und Browserprüfung sind unten getrennt beschrieben.

| # | Prüfung | Erwartetes Ergebnis / Nachweis | AI |
|---|---|---|:--:|
| 1 | Ziel 10 %, Anteil danach 9,5 %, unteres Band 6 % | Komponententest und Chrome: −5,0 % am Balken, Anteil nachher 9,5 %, −0,5 in der Prozentpunktspalte; Dashboard ebenfalls −5,0 % | ✅ |
| 2 | Vorzeichen, Null, Bandgrenzen und Ziel null | Tests: −7/−6/0/+5/+15/+16 % mit zugehörigem Status. Ziel null: erklärter Strich, kein NaN/Infinity; auch im Browser geprüft | ✅ |
| 3 | Trade und Ziel ändern, DE/EN | Tests über Commit-Ereignisse; Browser über Eingabefeld/Enter: +10 Stück → +5,0 % und Anteil 10,5 %. Zielwechsel auf 5 % im Test → +110,0 %. Englische Beschriftung und Dezimalpunkt bestätigt | ✅ |
| 4 | Pflichtprüfungen und Bezeichnerinventar | 2026-09-27, 09:28: 62 Testdateien / 793 Tests grün; Lint und Typecheck Exit 0. TS-Compiler-API-Inventar der fünf geänderten Code-/Testdateien: englische Bezeichner | ✅ |
| 5 | Doku und Dashboard-Vergleich | README erläutert die drei Werte; Containeranleitung bleibt zutreffend. Browser-Dashboard und Rebalancing vor Trade zeigen beide −5,0 % | ✅ |
| 6 | Vorzeichenfarbe und kompakte Anzeige | Chrome bei 1440 und 800 px Breite: IST-Werte 9,5 % und 90,5 % jeweils eine Textzeile; Anteil 11 px. Negative Zahl rot, positive grün trotz beiderseits grünem Band. Tests prüfen Vorzeichen innerhalb/außerhalb des Bands sowie neutrale Null/undefiniert und Farbwechsel nach Trade | ✅ |

**Nachprüfung der Anzeigevorgaben:** 2026-09-27, 09:35: `make test` erneut
62 Dateien / 793 Tests erfolgreich; `make lint` und `make typecheck` Exit 0.
Die erweiterten Farberwartungen scheiterten vor der Implementierung in sechs
Fällen, danach sind alle zehn Komponententests erfolgreich.

**Prüfumgebung:** `tests/components/rebalancingDeviation.spec.ts` führt die
vollständige Ansicht, echte Stores, `computeRebalancing`, `computeTradePlan`,
`DeltaBar` und die Inline-Eingaben aus. Nur die Cache-Hydrierung ist ersetzt;
IndexedDB läuft durch das globale Testsetup mit `fake-indexeddb`. Kein Netz.
Die zehn neuen Fälle scheiterten vor der Korrektur an der falschen sichtbaren
Zahl (etwa 9,5 % statt −5,0 %); danach 10/10 erfolgreich.

Chrome: isolierter Kontext `t51-rebalancing`, 1440 × 1000, echter vorhandener
StockInfo-Testserver mit temporärer Datenbank für den API-Status. Das Beispiel
wurde als synthetischer Browser-Store-Zustand gesetzt: Aktie 95 Stück zu 10 EUR,
Ziel 10 %, Cash 9.050 EUR, Gesamt 10.000 EUR. Keine behauptete echte Marktquote.
Dashboard-Zahl verglichen; danach Rebalancing, Trade +10 über das echte
Eingabefeld und Enter, Ziel 0 über das Zielfeld, DE/EN über i18n geprüft.
Rebalancing bleibt eine Simulation; die Tests prüfen den unveränderten
Depot-Zielwert nach dem probeweisen Wechsel.

```bash
# #1–#3: Sichtbare Zahlen und Reaktivität.
npx vitest run tests/components/rebalancingDeviation.spec.ts
# #4: Gesamte Pflichtprüfung.
make test
make lint
make typecheck
```

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

**Doku-Abgleich:** Datei- und Überschrifteninventar aus README, Containeranleitung,
`docs/` und Unraid geprüft. `README.md`, „Rebalancing is a simulation“, ergänzt
relative Abweichung am Balken, Anteil darunter, Prozentpunkte daneben und Ziel 0.
Die ergänzte Vorzeichenfarbe und die weiterhin separate Bandfarbe sind ebenfalls
dort erklärt; Schriftgröße und Umbruch benötigen keine Bedienungsanleitung.
`docker/README.md`, „Features“, bleibt unverändert: Die vorhandene Zusage zum
Rebalancing mit Toleranzbändern stimmt weiterhin, die ergänzte Zahl braucht
keine eigene Container-Anweisung. Die Methoden-Erklärung in `src/i18n/de.ts`
und `en.ts` beschreibt relative Bänder bereits richtig; neue Beschriftungen
stehen in beiden Katalogen. Historische Pläne/Spezifikation unter
`docs/superpowers/` und die StockInfo-Integrationsbewertung ändern keine aktuelle
Zusage dieser Anzeige. `unraid/README.md` und zentrale Unraid-Vorlage bleiben
unverändert, da Installation, Speicherung und Konfiguration nicht betroffen sind.

**Lessons angewendet:** SP-CX-02 (aktuelle Board-Aussagen/Doku), AL-R-01
(Testdouble und Browserdaten ausdrücklich benannt), SP-CX-05 (neue Lesson
vor Umsetzung gelesen: Dashboard als echte Referenz auf Format und sichtbare
Zahl verglichen). Keine neue Lesson durch diesen einzelnen Anzeigeauftrag.

Die allgemeine Übernahme der Board-Konventionen auf
`2026-09-11-lessons-follow-through` bleibt separat offen. Dieser Auftrag
ändert keine Board-Konvention und erfordert daher keine Skill-Änderung.

### Auflösung

Umsetzung und eigene Verifikation abgeschlossen. Unabhängige Prüfung und
menschliche Abschlussbestätigung stehen aus; Ticket bleibt in Doing.
