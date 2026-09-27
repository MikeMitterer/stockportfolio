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

**Stand:** Runde 4 technisch freigegeben (`claude`, approved): getrennte
Rel.-%-Spalte, ausblendbare Balkenspalte unter 1280 px und Simulationshinweis
unter 1160 px. Die danach beauftragte Mindestbreite mit gemeinsamem Scrollen
und das Mülleimer-Icon sind umgesetzt; Runde 6 (`claude`) fordert Nacharbeit
zur Symbolherkunft an (`changes_requested`). Mike hat den Abschluss bei
Claudes Freigabe bereits bestätigt; diese Freigabe steht wegen der
Nacharbeit noch aus.
Branch `t-51-rebalancing-bandabweichung-als-zahl`. T-50 ist abgeschlossen; anschließend folgt T-52 nach der Reihenfolge in STATUS.

Für Mike steht keine Rückfrage an. Seine Abschlussfreigabe gilt, sobald Claude
die aktuelle Fassung technisch freigibt; keine erneute Bestätigung erforderlich.

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

Mike beauftragt anschließend kürzere Tabellenüberschriften mit Hover-Erklärungen
wie bei DELTA. Präzisierungen: „Lass Kauf/Verkauf“ und „Pack aber doch bei Kauf /
Verkauf die Info dass positive Werte einen Kauf bedeuten und negative Werte einen
Verkauf bedeuten“.
Anschließend: „ABW. ZIEL bricht um“ und Hinweis auf die verbindliche i18n-Ablage.

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

**Umsetzung:** Die relative Zahl steht in der eigenen Spalte „Rel. %“ mit
`percentSigned`, demselben Formatierer wie im Dashboard. `DeltaBar` zeigt
den Balken ohne eigene Zahl (`hideValue`). Der Anteil danach steht unter
dem Balken. „Abw. Ziel“ zeigt Prozentpunkte ohne Prozentzeichen; das Popup
erklärt die Einheit. Bei Ziel 0 % steht in „Rel. %“ ein Strich mit Erklärung
im Titel; die breite Ansicht erklärt dies zusätzlich unter dem Balken. Die Berechnung bleibt in
`computeTradePlan`; `decimalSigned` teilt die vorhandene Zahlenformatierung
mit `percentSigned`. Der vorhandene i18n-Schlüssel für den Tooltip am
probeweisen Ziel ersetzt dort außerdem den hartkodierten deutschen Text.

Die IST-Prozentzelle bleibt mit `white-space: nowrap` zusammen. „Anteil
nachher …“ ist von 12 auf 11 Pixel verkleinert. Die relative Zahl ist im
Rebalancing bei positivem Vorzeichen grün, bei negativem rot, bei null oder
undefiniertem Ziel neutral. Die Farbklassen liegen an der eigenen Zahlenzelle;
der nur hier genutzte `colorBySign`-Prop entfällt. Die Balkenfüllung zeigt
weiterhin unabhängig davon den Bandstatus.

Die Überschriften heißen jetzt „Rel. Abw.“ und „Abw. Ziel“; ihre Popups
erklären den Zustand nach dem Handel und unterscheiden Prozent von
Prozentpunkten anhand von 9,5 % Anteil bei 10 % Ziel. „Kauf / Verkauf“ bleibt
erhalten und erklärt im Popup die positiven Kauf- und negativen Verkaufswerte.
Alle drei verwenden das bestehende DELTA-Muster: `NTooltip`, gepunktete
Unterstreichung und Hilfecursor. Texte sind in DE und EN vorhanden.
Die kurzen Tooltip-Überschriften bleiben mit `white-space: nowrap` einzeilig.
Chrome bestätigt für DELTA, Kauf / Verkauf, Rel. Abw. und Abw. Ziel bei 800 px
jeweils genau eine Textzeile. Im Template stehen nur i18n-Schlüssel.

Nach Mikes Hinweis zum dreizeiligen Anteil-Text sind Balken und Prozentzahl
getrennte Tabellenspalten. Unter der Fundament-Grenze `xl` (1280 px) werden
Balkenspalte und deren Header ausgeblendet. „Rel. %“ bleibt samt Vorzeichenfarbe
sichtbar. Oberhalb bleiben Anteiltexte einzeilig. Die Gruppen- und Fußzeilen
spannen über die zusätzliche Spalte; die Summen bleiben unter „Wert“.

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
  und Balken gemeinsam. Der Anteil nach dem Trade bleibt in der breiten Ansicht erkennbar.
- Innerhalb, auf und außerhalb der Bandgrenzen stimmen Zahl, Balken und
  bestehende Bewertung überein. Nullabweichung und Zielanteil null erzeugen
  weder `NaN` noch eine unendliche oder irreführende neue Anzeige.
- Pflichtprüfungen und Doku-Abgleich sind im Ticket belegt.

### Verify

Einzige aktuelle technische Matrix. ✅ ausgeführt und bestätigt.
Tests und Browserprüfung sind unten getrennt beschrieben.

| # | Prüfung | Erwartetes Ergebnis / Nachweis | AI |
|---|---|---|:--:|
| 1 | Ziel 10 %, Anteil danach 9,5 %, unteres Band 6 % | Komponententest und Chrome: −5,0 % neben dem Balken, Anteil nachher 9,5 %, −0,5 in der Prozentpunktspalte; Dashboard ebenfalls −5,0 % | ✅ |
| 2 | Vorzeichen, Null, Bandgrenzen und Ziel null | Tests: −7/−6/0/+5/+15/+16 % mit zugehörigem Status. Ziel null: erklärter Strich, kein NaN/Infinity; auch im Browser geprüft | ✅ |
| 3 | Trade und Ziel ändern, DE/EN | Tests über Commit-Ereignisse; Browser über Eingabefeld/Enter: +10 Stück → +5,0 % und Anteil 10,5 %. Zielwechsel auf 5 % im Test → +110,0 %. Englische Beschriftung und Dezimalpunkt bestätigt | ✅ |
| 4 | Pflichtprüfungen und Bezeichnerinventar | 2026-09-27, 09:28: 62 Testdateien / 793 Tests grün; Lint und Typecheck Exit 0. TS-Compiler-API-Inventar der fünf geänderten Code-/Testdateien: englische Bezeichner | ✅ |
| 5 | Doku und Dashboard-Vergleich | README erläutert die drei Werte; Containeranleitung bleibt zutreffend. Browser-Dashboard und Rebalancing vor Trade zeigen beide −5,0 % | ✅ |
| 6 | Vorzeichenfarbe und kompakte Anzeige | Runde 2: Chrome bei 1440 und 800 px Breite: IST-Werte 9,5 % und 90,5 % jeweils eine Textzeile; Anteil 11 px. Negative Zahl rot, positive grün trotz beiderseits grünem Band. Tests prüfen Vorzeichen innerhalb/außerhalb des Bands sowie neutrale Null/undefiniert und Farbwechsel nach Trade | ✅ |
| 7 | Kurze Header und Hover-Erklärungen | Runde 2: Chrome bei 800 px: „Rel. Abw.“, „Abw. Ziel“, unverändert „Kauf / Verkauf“. Alle drei Popups durch tatsächliches Hover geöffnet, DE/EN-Texte geprüft; DELTA-Muster wiederverwendet | ✅ |
| 8 | Getrennte Spalten bei schmalem Fenster | Chrome: 1280 px mit Balken/Anteil, 1279/1024/800 px ohne Balkenspalte; relative Prozentzahl jeweils sichtbar und farbig. Screenshots 1280/1024 bestätigen Ausrichtung von Headern und Bilanz. Bei 800 px bleibt das vorhandene seitliche Scrollen der Eingabetabelle nötig | ✅ |

**Nachprüfung der Anzeigevorgaben:** 2026-09-27, 09:35: `make test` erneut
62 Dateien / 793 Tests erfolgreich; `make lint` und `make typecheck` Exit 0.
Die erweiterten Farberwartungen scheiterten vor der Implementierung in sechs
Fällen, danach sind alle zehn Komponententests erfolgreich.

**Header-Nachprüfung:** 2026-09-27, einschließlich Umbruchsperre: erneut 793 Tests in 62 Dateien
erfolgreich; Lint und Typecheck Exit 0. Bestehende Header-Erwartungen an die
kurzen Beschriftungen angepasst. Die fachliche Erklärung steht jetzt im Popup.

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

**Responsive Nachprüfung:** 2026-09-27, 09:48: 793 Tests / 62 Dateien,
Lint und Typecheck erfolgreich. Bestehende zehn Fälle prüfen jetzt die eigene
Zahlenzelle und das Fehlen einer zweiten Zahl im Balken.

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
Die drei Hover-Erklärungen sind im selben README-Abschnitt erwähnt. Der erneute
Abgleich mit `docker/README.md` erfordert dort keine Änderung: Bedienungshilfe,
kein geänderter Funktionsumfang oder Betrieb. Neue Katalogschlüssel sind englisch.
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

**Doku-Abgleich zur schmalen Ansicht:** README, „Rebalancing is a simulation“,
beschreibt separate Zahl und Ausblendung unter 1280 px. Containeranleitung
„Features“ bleibt zutreffend; keine Änderung an Betrieb, Vertrag oder Installation.

### Unabhängige Prüfung · Runde 2 · claude

Geprüfte Fassung: `45f532d9a350c0355b993c0d8eae3e76fa76b54f` auf
`t-51-rebalancing-bandabweichung-als-zahl`. Runde 1 (`ae8e83c`) wurde vor
einem Prüfurteil zurückgenommen (siehe oben) und ist deshalb kein Gegenstand
dieser Prüfung; nur die aktuelle Fassung wurde bewertet. Vor der Prüfung
SP-CX-05 gelesen (Autor: codex).

- **Diff gelesen (voller Umfang seit T-51-Aktivierung, `2a941de..45f532d`):**
  `DeltaBar.vue` (neuer `colorBySign`-Prop, Farbklassen nur ohne
  überschriebenes `label`), `formatters.ts` (`decimalSigned` aus
  `percentSigned` extrahiert), `RebalancingView.vue` (Spaltenkopf, Balken-Label
  bei Ziel 0 %, drei neue Hover-Popups nach dem bestehenden DELTA-Muster:
  `NTooltip` + `.reb__hinted` + `.reb__tooltip`, bereits vor diesem Ticket für
  „Delta“ vorhanden), i18n-Kataloge.
- **Referenzvergleich (SP-CX-05):** `PositionsTable.vue` (Dashboard) nutzt
  `DeltaBar` unverändert ohne `color-by-sign` — die Grundzahl (Vorzeichen,
  Rundung) kommt aus derselben Komponente und stimmt damit mit dem Dashboard
  überein; die Vorzeichenfarbe ist eine bewusst auf Rebalancing begrenzte
  Ergänzung nach Mikes ausdrücklichem Wunsch, keine Dashboard-Änderung.
- **Domänenebene geprüft:** `tradePlan.ts` setzt `relativeDeviationAfter` bei
  `target === 0` bereits auf `0` (kein NaN/Infinity); die Ansicht fängt diesen
  Platzhalter ab und zeigt „—“ mit Erklärung statt einer irreführenden
  Nullabweichung.
- **Tooltip-Wiederverwendung bestätigt:** Alle drei neuen Popups verwenden das
  vorbestehende Delta-Muster, keine neue Abstraktion. Einzige neue CSS-Regel:
  `white-space: nowrap` auf `.reb__hinted` — adressiert direkt Mikes „ABW. ZIEL
  bricht um“.
- **Pflichtprüfungen selbst reproduziert:** `make lint` (Exit 0),
  `make typecheck` (Exit 0), `make test` — 62 Testdateien/793 Tests grün,
  deckt sich mit der gemeldeten Zahl.
- **Doku-Abgleich gegengeprüft:** README-Ergänzung zu den Hover-Erklärungen
  vorhanden und zutreffend; `docker/README.md` unverändert, korrekt begründet
  (Bedienhilfe, kein Funktions-/Betriebswechsel).
- **Beobachtung, kein Befund:** `decimalSigned` (neu extrahiert aus
  `percentSigned`) hat keinen eigenen Eintrag in `tests/domain/formatters.spec.ts`,
  anders als sein Geschwister `percentSigned` dort. Verhalten ist über
  `rebalancingDeviation.spec.ts` und meinen eigenen Testlauf abgedeckt; keine
  Nacharbeit verlangt, für spätere Gelegenheit vermerkt.
- **SP-CX-05-Gegenprobe abgeschlossen:** Nutzerauftrag („wie im Dashboard“,
  spätere Präzisierungen zu Umbruch, Schriftgröße, Farbe, Kauf/Verkauf-Hinweis)
  Punkt für Punkt gegen die Prüffassung gehalten; alle erfüllt.

**Verdict: approved.** Keine blockierenden Befunde.

**Weiterer Nutzerauftrag nach Runde-3-Übergabe:** Der Hinweis „Alles hier ist …“
wird unter 1160 px ausgeblendet. Die ausdrücklich von Mike vorgegebene Grenze
ist als lokale Ausnahme zur allgemeinen Breakpoint-Konvention kommentiert.
Bestehender i18n-Text unverändert. Chrome: bei 1160 px sichtbar, bei 1159 px
`display: none`; „Plan leeren“ bleibt in beiden Breiten sichtbar. Danach erneut
793 Tests / 62 Dateien, Lint und Typecheck erfolgreich. README erläutert die
Sichtbarkeit; Containeranleitung weiterhin zutreffend, keine Betriebsänderung.
Die wartende Runde 3 wurde vor einem Prüfurteil zurückgenommen; neue Übergabe
in Runde 4 einschließlich der getrennten Prozentzahl.

### Unabhängige Prüfung · Runde 4 · claude

Geprüfte Fassung: `ba618382393ce80d5d333361602bafc28d2be94c` auf
`t-51-rebalancing-bandabweichung-als-zahl`. Runde 3 wurde vor einem
Prüfurteil zurückgenommen und ist kein Gegenstand dieser Prüfung; geprüft
wurde der volle Unterschied seit der freigegebenen Runde 2 (`45f532d`).

- **Diff gelesen (`45f532d..ba61838`):** `DeltaBar.vue` — `colorBySign`
  entfernt, ersetzt durch allgemeineres `hideValue` (Farblogik verlässt die
  gemeinsam genutzte Komponente vollständig, da sie nur hier gebraucht wurde).
  `RebalancingView.vue` — neue eigene Spalte „Rel. %“ mit `percentSigned` und
  eigenen Farbklassen, Balkenspalte per `reb__band-column`/`below(xl)` unter
  1280 px ausgeblendet, Simulationshinweis per eigener `@media`-Regel unter
  1160 px ausgeblendet (kommentiert als Mikes ausdrückliche Ausnahme).
- **Spaltenzählung nachgerechnet:** 12 tatsächliche `<th>` im Kopf; Gruppen-
  zeile `colspan="12"` und Fußzeile `colspan="7"` + `colspan="4"` + eine
  ungespannte Geldzelle ergeben ebenfalls 12 — Layout bleibt konsistent, keine
  Verschiebung durch die neue Spalte.
- **Breakpoints gegen die Quelle geprüft:** `$bp-xl: 1280px` in
  `node_modules/@mmit/ux-foundation/src/styles/_shared.scss` bestätigt die
  Balken-Ausblendung; die 1160-px-Regel sitzt korrekt nur auf `.reb__note-text`,
  der benachbarte „Plan leeren“-Button bleibt unberührt sichtbar.
- **Kein toter Code:** Keine verbleibenden Referenzen auf `colorBySign`/
  `color-by-sign` im Baum.
- **Pflichtprüfungen selbst reproduziert:** `make lint` (Exit 0),
  `make typecheck` (Exit 0), `make test` — 62 Testdateien/793 Tests grün.
- **Tests inhaltlich geprüft:** Bestehende Fälle korrekt auf `.reb__relative-value`
  umgestellt, prüfen zusätzlich ausdrücklich das Fehlen von `.delta__value`
  (belegt `hide-value` tatsächlich) und den richtigen `td`-Index nach der neuen
  Spalte.
- **Doku-Abgleich gegengeprüft:** README beschreibt beide neuen Grenzen
  (1280 px, 1160 px) zutreffend; `docker/README.md` unverändert, weiterhin
  richtig begründet.
- **Frühere Beobachtung (Runde 2, `decimalSigned` ohne eigenen Unit-Test)
  weiterhin unverändert**, nicht erneut als Befund gezählt.

**Verdict: approved.** Keine Befunde.

### Mindestbreite nach Runde 4

Mike meldet, dass „Plan leeren“ unter 890 px in die nächste Zeile rutscht und
die Tabelle ohnehin nicht weiter schrumpft. Entscheidung auf Rückfrage:
„Mindestbreite und horizontales scrollen“.

Die Arbeitsfläche hat mindestens 890 px; die Mindestbreite ihres Tabelleninhalts
kann sie weiter vergrößern. Kopf und Tabelle liegen in einem gemeinsamen
horizontalen Scrollbereich. Die Kopfzeile bricht nicht mehr in mehrere Reihen
um, „Plan leeren“ schrumpft nicht. Der bisher separate Tabellenscroller entfällt.
Der benannte Scrollbereich ist per Tastatur fokussierbar; sein Name verwendet
den vorhandenen i18n-Schlüssel. Neue sichtbare Texte sind nicht erforderlich.

Browser mit synthetischem Prüfdepot: 889 und 800 px, Kopf und Tabelle gemeinsam
scrollbar, Button weiterhin an derselben unteren Kopfkante; kein Überlauf der
Gesamtseite. Scrollen bis rechts zeigt Status und Button vollständig. Pfeil rechts
im fokussierten Bereich verschiebt ihn. Bei 1440 px kein horizontaler Überlauf.
793 Tests / 62 Dateien, Lint und Typecheck erneut erfolgreich. Keine neuen
Bezeichner in TypeScript; neue BEM-Bezeichnung `workspace` ist englisch.

**Doku-Abgleich:** README, „Rebalancing is a simulation“ und „Mobile“, beschreibt
Mindestbreite und gemeinsames Scrollen. `docker/README.md`, „Features“, bleibt
zutreffend: Bedienungsanpassung ohne Änderung von Betrieb oder Funktionsumfang.
Runde 4 bleibt freigegeben; diese Ergänzung geht in Runde 5 zur Prüfung.

### Icon bei „Plan leeren“

Mike: „Gib zu Plan leeren noch ein Icon dazu“. Mülleimer-Symbol im vorhandenen
Strichstil über den `NButton`-Icon-Slot und `NIcon` ergänzt. Keine zusätzliche
Bibliothek; `UxIcon` bietet nur Navigationssymbole. Das SVG ist dekorativ,
der zugängliche Name bleibt die vorhandene i18n-Beschriftung. Chrome bei
889 px: Icon vorhanden, Button 118 × 28 px, weiterhin in derselben Kopfzeile.
793 Tests, Lint und Typecheck nach der Ergänzung erfolgreich.

**Doku-Abgleich:** README und Containeranleitung bleiben zutreffend; ergänzendes
Symbol ohne Änderung an Bedienung, Funktion oder Betrieb. Wartende Runde 5
vor Prüfurteil zurückgenommen; Mindestbreite und Icon gehen gemeinsam in Runde 6.

### Unabhängige Prüfung · Runde 6 · claude

Geprüfte Fassung: `5e983a0bac76a96c8198bb07f0ff4468c5e2c9f9` auf
`t-51-rebalancing-bandabweichung-als-zahl`. Runde 5 wurde vor einem
Prüfurteil zurückgenommen und ist kein Gegenstand dieser Prüfung; geprüft
wurde der volle Unterschied seit der freigegebenen Runde 4 (`ba61838`).
Hinweis für spätere Prüfungen an diesem Diff: `git diff -w` zeigt den
tatsächlichen Umfang, ein Wrapper-`<div>` verschiebt sonst die gesamte
Tabelleneinrückung.

- **Diff gelesen (`git diff -w ba61838..5e983a0`):** neue `.reb__workspace`
  mit `min-width: 890px`, gemeinsamer Scrollbereich (`role="region"`,
  `aria-label` aus vorhandenem `nav.rebalancing`, `tabindex="0"`) über Kopf
  und Tabelle statt des bisherigen separaten `.reb__scroll` nur um die
  Tabelle; `&__summary` nicht mehr umbrechend; Mülleimer-Icon über
  `NButton`-`#icon`-Slot mit `NIcon`.
- **Layout nachvollzogen, nicht neu im Browser geprüft:** Wechsel von
  tabellen-only zu workspace-weitem horizontalen Scrollen ist strukturell
  konsistent mit der Beschreibung; verlasse mich hier auf den dokumentierten
  Browsernachweis (889/800/1440 px), da rein strukturell nichts dagegen
  spricht und die bestehenden Komponententests nach dem Wrapper-Umbau
  unverändert grün bleiben.
- **`UxIcon`-Ablehnung nachvollzogen:** `navIcons.ts` enthält tatsächlich nur
  `dashboard/rebalancing/settings/analysis/exchanges/fx/instruments` — kein
  Symbol für „löschen“. Ein Rückgriff auf eine eigene Inline-SVG ist damit
  begründet.
- **Befund — Drittanbieter-Symbol ohne Vermerk:** Der neue Mülleimer-Pfad
  (`M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7`) entspricht in Aufbau
  und Geometrie erkennbar dem Lucide-Symbol `trash-2` (vier Teilpfade zu
  einem `<path>` zusammengeführt — dieselbe Vereinfachungstechnik wie bei den
  bereits vermerkten Codicons in `GroupActionIcon.vue`). `THIRD_PARTY_NOTICES.md`
  enthält bisher nur „Microsoft Codicons“ und „Lucide Icons“ (für
  `AssetTypeIcon.vue`); für dieses neue Symbol fehlt ein Eintrag, obwohl das
  Projekt diese Zuordnung für jedes bisher aus einer fremden Bibliothek
  übernommene Symbol konsequent führt (inklusive vollem Lizenztext bei ISC).
  Bitte Herkunft bestätigen und einen Abschnitt nach dem vorhandenen Muster
  ergänzen (Symbolname, Komponente, Lizenz) — oder, falls das Symbol
  tatsächlich unabhängig entworfen wurde, das ausdrücklich im Ticket
  festhalten.
  **Zur Kenntnis, nicht Teil dieses Befundes:** Derselbe Symbolpfad (das
  GitHub-Zeichen) in `AppStatusBar.vue` aus dem bereits abgeschlossenen T-50
  hat denselben fehlenden Eintrag; das ist mir in Runde 1/2 von T-50 nicht
  aufgefallen. T-50 ist archiviert und wird dafür nicht erneut geprüft; der
  Observer sollte das als möglichen Musterbefund einordnen (zwei Belege).
- **Pflichtprüfungen selbst reproduziert:** `make lint` (Exit 0),
  `make typecheck` (Exit 0), `make test` — 62 Testdateien/793 Tests grün.
- **Doku-Abgleich gegengeprüft:** README beschreibt Mindestbreite,
  gemeinsames Scrollen und die angepasste Mobile-Aussage zutreffend; das
  Icon selbst braucht laut bisherigem Muster (T-50) keine eigene
  Nutzungsanleitung, nur die Lizenzanmerkung fehlt wie oben beschrieben.
- **Frühere Beobachtung (Runde 2, `decimalSigned` ohne eigenen Unit-Test)
  weiterhin unverändert**, nicht erneut als Befund gezählt.

**Verdict: changes_requested.** Ein Befund: fehlender
`THIRD_PARTY_NOTICES.md`-Eintrag für das neue Mülleimer-Symbol. Alles
Übrige — Scrollmechanik, Mindestbreite, Spaltenlayout, Pflichtprüfungen,
Doku — ist in Ordnung.

### Auflösung

Runde 4 bleibt technisch freigegeben. Die danach beauftragte Mindestbreite,
das gemeinsame Scrollen und das Icon sind umgesetzt und selbst geprüft;
Runde 6 (`claude`) fordert eine kleine Nacharbeit zur Symbolherkunft an,
sonst keine Einwände. Mikes Abschlussfreigabe gilt bedingt auf Claudes OK;
das OK steht bis zur Nacharbeit noch aus. Ticket bleibt bis dahin in Doing.
Runde 3 und Runde 5 blieben ohne Prüfurteil.

Wartende Übergabe Runde 1 zu `ae8e83c` auf Mikes neuen Header-Auftrag
zurückgenommen, bevor ein Prüfurteil vorlag. Die ergänzte Fassung wurde in
Runde 2 neu übergeben und geprüft; die Rücknahme war keine technische Abnahme.


### Menschliche Abschlussfreigabe · 2026-09-27

Mike: „Wenn Claude das OK gibt dann ist das Ticket von mir aus erledigt“.
Die menschliche Abschlussentscheidung ist damit erteilt, unter der Bedingung
der technischen Freigabe durch Claude für die aktuelle Übergabefassung
`5e983a0bac76a96c8198bb07f0ff4468c5e2c9f9` (Runde 6). Nach diesem OK T-51
archivieren und gemäß bestehendem Auftrag unmittelbar T-52 aktivieren.
Zum Zeitpunkt dieser Eintragung steht das Prüfurteil von Runde 6 noch aus.
