# T-43 · Positionsdetails nach Aufgabe gliedern

Vor T-43 erschienen beim Öffnen einer Position **Bearbeitung, Depotzahlen,
Zusatzinformationen und Kursverlauf gleichzeitig**. Die aufgeklappte
Tabellenzeile wurde lang und erschwerte es, eine bestimmte Information zu finden.
Die neue Ansicht zeigt jeweils den gewählten Bereich.

**Beispiel:** Wer nur den Kursverlauf ansehen möchte, wählt „Kursverlauf“
und sieht dort den großen Chart mit der Zeitraumwahl.

**Stand:** Mikes UX-Entscheidung vom 2026-09-25 ist bestätigt. Während der
Umsetzung hat Mike den bisherigen Reiternamen „Depot“ und „Asset“ widersprochen
und einen Dialog für „Position bearbeiten“ angeregt. Die Umsetzung nutzt
„Bewertung“, „Kursverlauf“, „Informationen“ und „Zusatzinformationen“ sowie
den Bearbeitungsdialog. Spätere Sichtprüfungen führten zu linksbündigen,
responsiven Karten, zwei Tab-Zeilen auf Mobile und einer kompakten mobilen
Bewertung. Technische Feldschlüssel stehen nicht mehr unter jeder Beschriftung.
Reiter, Kursstand und Aktionssymbole teilen sich eine Zeile; die Feldkarten
verwenden einen zurückhaltenden Hintergrund und einen feinen Rand.
Claude hat die Fassungen `1f75154`, `3855bb7` und `9a92abe` in Runde 1 bis 3
technisch freigegeben. Mike hat die Bedienansicht am 2026-09-25 abgenommen;
T-43 ist abgeschlossen.
Rollen, Phase und Reviewfassung stehen ausschließlich in
[`STATUS.md`](../STATUS.md).

Die technische Grundlage für die StockInfo-Zusatzwerte ist in
[T-40](T-40-detailanzeige-aus-feldkatalog.md) bereits umgesetzt und unabhängig
freigegeben. T-43 folgt darauf als Umbau der Bedienansicht. Der T-40-Review
wird nicht wiederholt; Mikes Abschlussabnahme für T-40 bleibt offen.

Für Mike ist zu T-43 kein weiterer Schritt offen. Die Bedienprüfung und
Abschlussabnahme erfolgten nach Claudes technischer Freigabe.

## Für dich

Nach der technischen Freigabe auf dem Dashboard eine Position in der Tabelle
öffnen. Zwischen „Bewertung“, „Kursverlauf“, „Informationen“ und
„Zusatzinformationen“ wechseln und prüfen,
ob die gesuchten Angaben ohne langes Scrollen auffindbar sind. Danach
das Bearbeiten-Symbol öffnen und prüfen, ob „Abbrechen“, das X und
„Speichern“ erwartbar wirken. Auf einem schmalen Bildschirm die Positionskarte und ihre
Informationen prüfen. Für einen wiederholbaren Test das
[`Browser-Testdepot`](../../tests/fixtures/browser/README.md) in einer frischen
Browsersitzung importieren; die Testserver-Adresse wird bei jedem Start nach
dieser Anleitung gesetzt. Die Übergabefassung ist
`9a92abe5b6295b8e27c10ae1df3f685908ef7b49`.

Dein Urteil: Die Detailansicht ist nach Mikes „Passt, mach mit dem nächsten
Ticket weiter“ am 2026-09-25 abgenommen. Das Urteil stammt von Mike und
nicht aus technischen Tests.

## Umsetzung und technische Nachweise

| Repo | Umfang | Fremddienst |
|---|---|---|
| StockPortfolio | Detail-UX im Dashboard, Tests und betroffene Benutzerdokumentation | StockInfo unverändert |

### Gewünschtes Verhalten

Die aufgeklappte Tabellenzeile behält den Kontext zur Position. Ihr kompakter
Kopf zeigt Kursstatus und Aktionen; der Name steht bereits in der Tabellenzeile.
Unter dem Kopf ist genau einer dieser Bereiche sichtbar:

| Bereich | Inhalt |
|---|---|
| Bewertung | Marktwert, Zielwert, Bandgrenzen und Abweichung; weitere für die Depotentscheidung nötige Werte nach bestehender Berechnung |
| Kursverlauf | Großer Kurschart und vorhandene Zeitraumwahl; der Chart wird erst beim Öffnen dieses Bereichs geladen |
| Informationen | ISIN und, wenn StockInfo ein eigenes Symbol ausweist, dieses Symbol; dazu Kurs und passende externe Links |
| Zusatzinformationen | Wirksame StockInfo-Felder mit Herkunft, Stand und gegebenenfalls verdecktem manuellem Wert |

„Bewertung“ ist beim ersten Öffnen gewählt. Ein Bereichswechsel ändert keine
Position und keinen Kurs. Kursprobleme bleiben im Kopf oder direkt beim
betroffenen Inhalt erkennbar, auch wenn ein anderer Bereich gewählt ist.
Cash-Positionen bekommen keinen leeren Kursverlauf; fehlende Kurse und leere
Zusatzfelder haben einen verständlichen Zustand.

Das Bearbeiten-Symbol öffnet einen Dialog mit dem Formular. Eingaben bleiben
bis „Speichern“ im Entwurf; „Abbrechen“ und das X verwerfen sie. „Löschen“
steht links in der Fußzeile und behält die vorhandene Bestätigung. „Abbrechen“
und „Speichern“ stehen rechts, „Speichern“ außen. Das Neuladen-Symbol steht
beim Kursstatus und dreht sich während des Abrufs; bei reduzierter Bewegung
bleibt es ruhig. Reiter, Kursstand und Aktionen stehen in einer Zeile ohne
reservierten Platz für einen zweiten Namen. Die Werte werden im reinen Lesebereich nicht als Eingabefelder
wiederholt.

Die Hauptspalte heißt „Position“, weil sie je nach StockInfo-Identität Ticker
oder ISIN als Kennung verwendet. Bei gelisteten Assets mit ISIN stehen beide
Kennungen sichtbar nebeneinander, auch auf der Mobilkarte und im Rebalancing.
Ein senkrechter Strich trennt Ticker und ISIN in der jeweiligen Positionszeile;
die wiederholte Vorsilbe „ISIN“ entfällt dort.
Im Desktop-Dashboard steht die Spalte „Ziel %“ vor „IST %“. Die Desktop- und
Mobil-Gruppenköpfe zeigen ihre Prozentwerte in derselben Reihenfolge.
In „Informationen“ werden ISIN und Symbol als getrennte Felder gezeigt, soweit
StockInfo sie ausweist. Für `identity.kind = isin_only` erscheint kein
künstliches Symbol; die Anleihe `DE0001135275` zeigt nur ihre ISIN. Der
Asset-Katalog hat eine eigene ISIN-Spalte und zeigt in seiner Symbolspalte
für solche Assets einen Strich. Diese StockInfo-Daten werden in StockPortfolio
nicht bearbeitet; das Bearbeitungsformular erhält kein Symbolfeld.

Direkt rechts neben der Desktop-Positionsüberschrift stehen zwei
Symbolaktionen für „Alle Gruppen schließen“ und „Alle Gruppen öffnen“.
Sie wirken auf die sichtbaren Gruppen; der vorhandene Gruppenzustand wird
weiter gespeichert.

Auf schmalen Bildschirmen öffnet ein Tippen auf die Positionskarte ihre Details;
das Symbol im Kartenkopf ist auch per Tastatur bedienbar. Der zusätzliche
Textknopf „Positionsdetails anzeigen“ entfällt.
Die vier Lesebereiche stehen in zwei Zeilen und sind ohne waagrechtes Scrollen
bedienbar. Das bisher bewusst auf Desktop begrenzte Bearbeiten in der
Mobilansicht wird durch dieses Ticket nicht erweitert.

Die vorhandene Feldprojektion bleibt maßgeblich: StockInfo-Felder, die bereits
in der Hauptzeile sichtbar sind, erscheinen nicht nochmals unter
„Zusatzinformationen“.
Kurswährung, Depotwährung, Herkunft und Zustand der Detailwerte bleiben wie
bisher verständlich. Es gibt keine neue StockInfo-Route und keine Änderung an
Depotberechnung oder Speicherung.

Die Feldprojektion aus T-40 bleibt die einzige Quelle für die Zusatzliste.
Der Bereich „Zusatzinformationen“ verwendet dieselben Definitionen und Werte,
einschließlich der Originalwährung am Wert. Desktop und Mobilansicht dürfen
dafür keine getrennten Feldregeln oder Ausschlusslisten erhalten. Der Umbau
ändert weder Feldkatalog, Mapper noch Cache.

StockInfo erlaubt gleiche Beschriftungen für verschiedene vollständige
Feldnamen. Das Testpaar `risk-a.score` und `risk-b.score` trägt daher zweimal
„Risikoscore“; beim zweiten Feld fehlt in den Browserdaten der Wert. Die
Anzeige lässt bei gleichem Label nur einen leeren Platzhalter stehen; ein
befülltes Feld ersetzt diesen Platzhalter. Haben beide einen Wert, bleiben sie
getrennt und werden über ihre Quelle unterschieden. Die vollständigen Namen
bleiben intern für den Dublettenabgleich erhalten. Das ist eine
Darstellungsentscheidung in T-43; die T-40-Feldprojektion bleibt unverändert.

### Verify

Legende: ✅ live bestätigt · ⚠️ mit Einschränkung · ◑ teilweise ·
➖ keine Live-Verifikation.

| # | Handgriff | Erwarteter Nachweis | AI |
|---|---|---|:--:|
| 1 | Tabellenposition öffnen und die vier Bereiche wählen | Jeweils nur der gewählte Inhalt erscheint; der Kopf und Positionskontext bleiben sichtbar | ✅ |
| 2 | Position öffnen, ohne „Kursverlauf“ zu wählen; danach dorthin wechseln | Der große Chart und sein Zeitraumabruf starten erst beim Anzeigen; die kleine Tabellenlinie darf weiterhin ihren eigenen kurzen Verlauf laden. Die Zeitraumwahl funktioniert weiter | ✅ |
| 3 | Bearbeiten-Symbol wählen, Feld ändern, abbrechen und erneut ändern/speichern | Erst „Speichern“ übernimmt den Entwurf; Abbrechen und X verwerfen ihn | ✅ |
| 4 | Kurs neu laden und Position löschen | Neuladen ist beim Kurs erreichbar; Löschen bleibt im Formular und verlangt Bestätigung | ⚠️ |
| 5 | Cash-Position, fehlenden Kurs und leere beziehungsweise nicht geladene Zusatzfelder anzeigen | Keine leeren Reiter oder irreführenden Werte; Warnung und Leerzustand bleiben verständlich | ◑ |
| 6 | Positionskarte bei 390 px öffnen und Bereiche bedienen | Vier Tabs in zwei Zeilen, kompakte Bewertung und Zusatzkarten ohne waagrechtes Scrollen | ✅ |
| 7 | Feld zugleich als Hauptspalte und als StockInfo-Detailwert anzeigen; „Zusatzinformationen“ am Desktop und mobil öffnen | Es erscheint nicht doppelt; Metadaten, Leerzustand und Originalwährung bleiben in beiden Ansichten erhalten | ✅ |
| 8 | `make test`, `make lint`, `make typecheck` ausführen | Alle drei Prüfungen bestehen; Ergebnisse und Einschränkungen stehen vor Übergabe hier | ✅ |
| 9 | Bei gemischtem Gruppenzustand die beiden Symbole neben der Positionsüberschrift wählen | Alle sichtbaren Desktop-Gruppen schließen beziehungsweise öffnen; der Zustand bleibt gespeichert | ✅ |
| 10 | Gelistetes Asset mit ISIN und reine ISIN-Anleihe in Hauptzeile und „Informationen“ ansehen | Ticker und ISIN erscheinen gemeinsam, wenn StockInfo beide ausweist; die Anleihe bekommt kein künstliches Symbol | ✅ |

Claude prüft nach der Übergabe die beauftragte Fassung und die
Zuordnung der Aussagen in README und weiteren betroffenen Anleitungen.

**Codex-Probe am 2026-09-25:** Die App lief unter `http://127.0.0.1:5189/`
gegen den lokalen StockInfo-Testserver auf Port 8899 mit `--demo-details`.
Eine frische isolierte Browsersitzung importierte
[`valid-portfolio.backup.json`](../../tests/fixtures/browser/valid-portfolio.backup.json):
vier gültige Positionen, 100 % Zielsumme und „Datenlage: Vollständig“.
Der Startweg steht in
[`tests/fixtures/browser/README.md`](../../tests/fixtures/browser/README.md).
Die Sicherung ist eine normale JSON-Sicherung; beim Export im Browser wird
sie standardmäßig unter „Downloads“ abgelegt. Die Repo-Datei ist die
wiederverwendbare Vorlage für spätere Sitzungen.

Desktop bei 900 px: vier Bereiche in einer Zeile, Zusatzkarten linksbündig
in drei Spalten. Reiter, Kursstand und die zwei Aktionssymbole teilen sich
eine Zeile. Die Karten haben einen sichtbaren, aber zurückhaltenden
Hintergrund. Nur die geöffnete Positionszeile und ihr Detailbereich erhalten
einen transparenten Hover-Farbwert; geschlossene Nachbarzeilen behalten den
Tabellen-Hover. Die lokale `tdColorHover`-Überschreibung der Naive-Tabelle
setzt ihren Hover zunächst neutral; `rowProps` und `cellProps` färben nur
geschlossene Zeilen über das Fundament-Token `--surface-raised`. Ein Zugriff
auf Naives interne CSS-Variablen oder die DOM-Zeile entfällt. Dies wurde für
offene und geschlossene Zeilen sowie den Detailbereich im Browser an den
berechneten Flächenfarben geprüft. Auf Mobile
bei 390 px: Tabs in zwei Zeilen, Bewertung in kompakten Zahlenpaaren,
Zusatzkarten in einer Spalte; `scrollWidth` blieb 390 px. Der große Chart
und sein Verlaufabruf erschienen erst nach Auswahl von „Kursverlauf“; die
kleine Tabellenlinie lud weiterhin ihren eigenen Verlauf.

Der Dialog wurde mit „Löschen“ links, „Abbrechen“ und „Speichern“ rechts
sowie X oben rechts im Browser geprüft. Der Komponententest bestätigt, dass
Änderungen vor „Speichern“ nicht an den Store gemeldet werden und „Abbrechen“
sie verwirft. „Kurs neu laden“ lieferte einen neuen Kursstand. Die
Löschbestätigung wurde geöffnet und abgebrochen, damit die wiederverwendbare
Testposition erhalten blieb. Cash ohne Verlauf wurde im Browser geprüft;
fehlender Kurs und nicht geladene Zusatzwerte sind über Komponententests
geprüft, daher Zeile 5 nur teilweise live. Der dynamische Spaltenausschluss
ist durch `tests/components/detailFields.spec.ts` geprüft; der Browser zeigte
die Originalwährung und die Herkunft der Zusatzwerte. Die Anleihe zeigt im
Informationsbereich nur noch die ISIN, weil StockInfo `isin_only` meldet.
Der Desktop-Browser zeigte bei EUNL.DE und VTI Symbol plus ISIN in der
Positionszeile mit senkrechtem Trenner; bei der Anleihe nur die ISIN.
Die Mobilkarte zeigte beide Kennungen ebenfalls in einer Zeile bei 390 px;
`scrollWidth` blieb 390 px.
Der Desktop-Browser zeigte in der Tabellenkopfzeile „Marktwert“, „Ziel %“,
„IST %“, „Delta“ in dieser Reihenfolge.
Die Gruppenköpfe zeigten am Desktop und bei 390 px zuerst das Ziel und dann
den Ist-Anteil, etwa „70,0 % / 68,2 %“. Die schmale Ansicht blieb ohne
waagrechtes Scrollen.

`make test`: 54 Dateien, 729 Tests bestanden. `make lint`, `make typecheck`
und `make build` bestanden. Der Build meldet den vorhandenen Hinweis zum
großen UI-Vendor-Chunk; kein Fehler. Die nichtenglischen deutschen
Bandnamen im Lesebereich wurden auf „Untergrenze“ und „Obergrenze“ korrigiert.
Die zwei Gruppensymbole wurden im Browser bei gemischtem Zustand geprüft:
alle drei Gruppen gingen zu und wieder auf; `localStorage` enthielt danach
die passende Auswahl. Die Symbole wurden danach ohne Button-Fläche und
optisch bündig mit der Überschrift dargestellt. Der Dialog wurde nach der
späteren Nutzerkorrektur auf Speichern/Abbrechen umgestellt. Der vollständige
Prüflauf nach der letzten Produktänderung bestand mit 729 Tests, Lint,
Typprüfung und Build; `git diff --check` blieb leer. Bei 390 px blieben die
vier Bereiche ohne waagrechtes Scrollen bedienbar (`scrollWidth = 390 px`).

**Doku-Abgleich:** Datei- und Überschrifteninventar für `README.md`, `docs/`
und `unraid/` durchgeführt. `README.md` („Position information“, „Price
history“, „Mobile“) beschreibt vier Bereiche, Bearbeiten als Dialog und die
aktuelle Feldanzeige. Der Link auf das veraltete
`docs/images/drilldown.png` wurde entfernt. Der T-43-Umsetzungsplan wurde an
vier Bereiche angepasst; die aktuelle Nutzeranleitung in T-40 verweist
auf den neuen Bereich, ohne dessen alte Reviewbelege umzuschreiben.
`tests/fixtures/browser/README.md` erklärt den wiederholbaren Browserstart.
Die aktuelle Information über das Neuladen-Symbol und die getrennten
Kennungen wurde in `README.md` ergänzt.
`unraid/` betrifft diese Bedienänderung nicht; `docs/stockinfo-integration-proposal.md`
ist ein historischer Vorschlag, keine aktuelle Benutzersicht.

**Lessons-Abgleich:** `SP-CX-02`, Fassung 1: aktuelle Aussagen in README,
T-40 und T-43 wurden gemeinsam nachgezogen; Gegenprobe über Datei- und
Überschrifteninventar. `SP-CX-04`, Fassung 1: der gemeinsame Browser-Testserver
bleibt unter `scripts/`, die Sicherung unter `tests/fixtures/browser/` statt
im Ticketordner; Start und frischer Import wurden geprüft. Gemeinsame Regeln
`AL-R-01` und `AL-R-10`, Archivfassung `2026-09-10`, stehen weiterhin unter
`needs_review`; ihre Anwendung wurde auf Browser-/Dokubelege begrenzt, eine
globale Übernahme wird hier nicht behauptet.

**Board-Konvention:** Der Skill `task-verification-workflow` steht auf
`2026-09-11-lessons-follow-through`, der lokale Workflow auf
`2026-09-11-activity-feed`. Die allgemeine Übernahme mit Ziel
`_tickets/.agents/AGENT-WORKFLOW.md` bleibt für Mike beziehungsweise eine
eigens beauftragte Board-Instanz offen. T-43 ändert diese Konvention nicht.

### Reviewer-Prüfung (Claude, Runde 1, Fassung `1f75154`)

**Technische Freigabe.** `make test` (54 Dateien, 729 Tests), `make lint` und
`make typecheck` selbst gegen die Übergabefassung ausgeführt — alle drei ohne
Befund, deckt sich mit der Codex-Angabe. Seit dem Handoff-Commit betreffen
alle Folgecommits ausschließlich Ticket-/Kommunikationsdateien; der
Produktstand war während der Prüfung stabil.

Quellcode gelesen und gegen die Akzeptanzkriterien geprüft:
`PositionReadDetails.vue`, `PositionDetailFields.vue` (Dublettenlogik für
gleiche Labels), `PositionCard.vue`, `PositionDrilldown.vue` (Editor,
Lösch-Bestätigung, Lazy-Load des großen Charts), `PositionsTable.vue`
(Gruppen-Auf/Zu, Hover-Färbung über `--surface-raised`), `DashboardView.vue`
(Gruppensymbole mit `aria-label`) sowie `README.md`, `de.ts`/`en.ts`. Keine
deutschen Bezeichner in neuem Code gefunden; de/en-Kataloge sind schlüsselgleich.

Live im Browser nachvollzogen (Testdienst Port 8899, App auf `:5189`, frischer
MCP-Browserkontext, `valid-portfolio.backup.json` importiert): alle vier
Bereiche (Bewertung, Kursverlauf, Informationen, Zusatzinformationen),
Editor-Dialog mit verworfenem Entwurf nach „Abbrechen“ (Bestand blieb bei 12
statt der eingegebenen 99), Spaltenreihenfolge „Ziel %“ vor „IST %“,
Ticker/ISIN-Trenner bei EUNL.DE und VTI, reine ISIN bei der Bundesanleihe,
mobile Kartenansicht mit Tipp-zum-Öffnen und vier Tabs in zwei Zeilen ohne
waagrechtes Scrollen (bei der vom Werkzeug erzwungenen Fensterbreite von
559 px; die von Codex dokumentierte 390-px-Probe wurde nicht wiederholt).
Zeile 4 und 5 der Verify-Tabelle bleiben wie von Codex eingeordnet (⚠️/◑) —
die Begründungen im Probetext sind nachvollziehbar und ausreichend.

**Lessons-Abgleich (Verifier-Prüfung):** `SP-CX-04`, Fassung 1 — Gegenprobe
bestanden: Testserver bleibt unter `scripts/stockinfo-test-server.py`, die
Sicherung unter `tests/fixtures/browser/`, keine Ablage im Ticketordner.
`SP-CX-02`, Fassung 1 — der Board-Konventionshinweis in diesem Ticket deckt
sich mit dem tatsächlichen `AGENT-WORKFLOW.md`-Stand; keine widersprüchliche
Aussage gefunden.

**Beobachtung außerhalb des Umfangs (kein Blocker):** In Einstellungen →
Berechnung zeigen die Toleranzbänder weiterhin „Lower Band (%)“ / „Upper
Band (%)“ (i18n-Schlüssel `bands.lower`/`bands.upper`, unverändert seit vor
T-43). Die in diesem Ticket korrigierten deutschen Bandnamen
(„Untergrenze“/„Obergrenze“) gelten nur im Lesebereich der Positionsdetails;
T-43 hat die Einstellungen nicht berührt und musste es laut Abgrenzung auch
nicht. Für eine spätere Aufnahme in `10-backlog/` vorgemerkt, kein Rückgabegrund.

**Ergebnis:** Fassung `1f75154` technisch freigegeben. Kein `changes_requested`.
Die Freigabe bezieht sich nicht auf die danach beauftragten Korrekturen.

### Folgekorrekturen nach Runde 1

Mike möchte die beiden Symbole rechts neben der Positionsüberschrift enger
zusammenrücken. Außerdem soll der Bereichsbalken der mobilen Positionskarte
kompakter werden; derzeit zieht er sich über die gesamte Kartenbreite. Beide
Korrekturen gehören zur noch laufenden Bedienabnahme von T-43. Der Coder
hat sie in `3855bb7` umgesetzt und übergibt die neue Produktfassung für
Runde 2.

**Codex-Probe der Folgekorrekturen:** Die beiden Desktop-Symbole haben eine
Klickfläche von je 24 px Breite ohne Zwischenraum. Bei 390 px steht der
Delta-Balken rechts neben „Delta“ und misst einschließlich Wert 160 px; die
eigentliche Spur ist 96 px breit. Ziel und Ist stehen auch in der mobilen
Positionskarte in dieser Reihenfolge. Der Browser blieb bei 390 px ohne
waagrechtes Scrollen. Desktop und Mobile wurden nach der Änderung visuell
geprüft. `make test` bestand erneut mit 54 Dateien und 729 Tests;
`make lint`, `make typecheck`, `make build` und `git diff --check` blieben
ohne Fehler.

**Doku-Abgleich der Folgekorrekturen:** `README.md` → „Mobile“ beschreibt
die Reihenfolge und die kompakte Delta-Anzeige. Der Abschnitt zur
Desktop-Positionsüberschrift bleibt sachlich richtig; er nennt die beiden
Symbolaktionen, aber keinen Abstand. `docs/` und `unraid/` enthalten keine
betroffene aktuelle Bedienanleitung.

### Reviewer-Prüfung (Claude, Runde 2, Fassung `3855bb7`)

**Technische Freigabe.** `make test` (54 Dateien, 729 Tests), `make lint` und
`make typecheck` selbst gegen die Übergabefassung ausgeführt — alle drei ohne
Befund. Der Produktstand war seit dem Handoff-Commit stabil (Folgecommit
betraf nur Ticket-/Board-Dateien).

Diff `1f75154..3855bb7` gelesen: `DeltaBar.vue` (neue `narrow`-Variante,
`flex: 0 1 10rem`), `PositionCard.vue` (Reihenfolge auf „Ziel % / IST %“
gedreht, Delta jetzt als eigene beschriftete Zeile mit `narrow`-Balken statt
kartenbreitem Balken) und `DashboardView.vue` (`row(0)` statt `row(var(--space-1))`,
Icon-Breite 1,5rem statt 1,75rem). `table.delta` ist ein bestehender
i18n-Schlüssel in `de.ts`/`en.ts`, keine Lücke.

Live im Browser mit dem bereits importierten Testdepot nachvollzogen: Klick
auf „Alle Gruppen schließen“/„öffnen“ funktioniert weiterhin korrekt; die
Klickflächen der beiden Symbole per `getBoundingClientRect()` vermessen —
390,98–414,98 px und 414,98–438,98 px, also je 24 px ohne Zwischenraum,
deckt sich exakt mit der Codex-Angabe. Die schmale Ansicht bei genau 390 px
konnte in dieser Sitzung nicht erneut erzwungen werden (`resize_window`
lieferte in diesem Lauf keine engere Fensterbreite als die Fensterchrome
selbst zuließ); die Delta-Zeile wurde daher nicht erneut visuell bei 390 px
nachgestellt, sondern anhand des Codex-Nachweises und der gelesenen CSS
(`flex: 0 1 10rem` = 160 px, deckt sich mit „160 px einschließlich Wert“)
für plausibel befunden.

**Ergebnis:** Fassung `3855bb7` technisch freigegeben. Kein `changes_requested`.

### Mobile Positionskarten nach Runde 2

Mike findet die mobile Ansicht insgesamt noch nicht ansprechend und nennt
als konkreten Befund die gleichförmige Masse der Assets. Die einzelnen
Positionen sollen deutlicher voneinander getrennt sein. Der Coder nimmt die
gemeinsame Rahmenfläche der mobilen Liste zurück und gestaltet jede Position
als eigene dezente Karte mit Abstand. Die Gruppenköpfe bleiben als
Orientierung erhalten. Desktop-Tabelle und Datenverhalten ändern sich dabei
nicht. Die neue Fassung `9a92abe` wurde in Runde 3 technisch freigegeben.

**Codex-Probe:** Die gemeinsame Rahmenfläche der mobilen Positionsliste ist
entfallen. Jede Positionskarte hat einen feinen Rand, eine eigene Fläche und
8 px Abstand zur nächsten; auch zwischen Gruppen bleibt Raum. Im Browser bei
390 px blieben geschlossene und geöffnete Positionen ohne waagrechtes
Scrollen (`scrollWidth = 390 px`). Eine geöffnete Karte hielt die vier Reiter
innerhalb ihrer Fläche (`tabScrollWidth = 320 px`). Die Desktop-Tabelle blieb
optisch unverändert. `make test` bestand mit 54 Dateien und 729 Tests;
`make lint`, `make typecheck`, `make build` und `git diff --check` bestanden
ebenfalls.

**Doku-Abgleich:** `README.md` → „Mobile“ beschreibt die getrennten
Positionskarten. Der bestehende Abschnitt „Position information“ bleibt
richtig; `docs/` und `unraid/` enthalten keine betroffene aktuelle
Bedienanleitung.
Die Beobachtung zu „Lower Band“/„Upper Band“ aus Runde 1 bleibt unverändert
außerhalb des Umfangs.

### Reviewer-Prüfung (Claude, Runde 3, Fassung `9a92abe`)

**Technische Freigabe.** `make test` (54 Dateien, 729 Tests), `make lint` und
`make typecheck` selbst gegen die Übergabefassung ausgeführt — alle drei ohne
Befund. Der Produktstand war seit dem Handoff-Commit stabil.

Diff `3855bb7..9a92abe` gelesen: `PositionCard.vue` (`border-bottom` wird zu
vollem `border` plus `border-radius` und eigener Kartenfläche),
`PositionCardList.vue` (`gap: var(--space-2)` zwischen Karten, Gruppenkopf
mit `border-radius` und `margin-top` außer beim ersten), `DashboardView.vue`
(gemeinsamer Panel-Rahmen und die untere Trennlinie der Kopfzeile gelten nur
noch `@include up(md)` — derselbe Schwellwert wie `COMPACT_BREAKPOINT_PX`,
kein neuer Ad-hoc-Bruchpunkt; oberhalb bleibt die Desktop-Tabelle unverändert
gerahmt). `--space-2` ist im Fundament `0.5rem` = 8 px, deckt sich exakt mit
der „8 px Abstand“-Angabe der Codex-Probe.

Live im Browser mit dem importierten Testdepot nachvollzogen: Desktop-Tabelle
optisch unverändert, weiterhin ohne Scrollbalken. Die 390-px-Probe der
Kartentrennung konnte in dieser Sitzung erneut nicht erzwungen werden
(`resize_window` ohne Wirkung auf `innerWidth` in diesem Lauf, dieselbe
Werkzeuggrenze wie in Runde 2); anhand der gelesenen CSS (Randfarbe, Radius,
Abstand und der auf `up(md)` begrenzte Panel-Rahmen) und der mit dem
Fundament-Token übereinstimmenden Codex-Angabe als plausibel befunden.

**Ergebnis:** Fassung `9a92abe` technisch freigegeben. Kein `changes_requested`.
Die Beobachtung zu „Lower Band“/„Upper Band“ aus Runde 1 bleibt unverändert
außerhalb des Umfangs.

### Side-Effects

Der große Kurschart und sein Zeitraumabruf werden erst beim Öffnen des
Bereichs geladen. Die kleine Tabellenlinie behält ihren eigenen Abruf.
Der Bearbeitungsdialog speichert erst nach ausdrücklichem Klick auf
„Speichern“; der Gruppenzustand bleibt gespeichert. API, Berechnung und
Datenmodell bleiben unverändert.

### Abgrenzung

Die Tabellen-Hauptzeile, Rebalancing-Rechnung und StockInfo-Verträge bleiben
fachlich unverändert. Eine neue Positionsseite, zusätzliche Konfiguration
und eine neue mobile Bearbeitungsfunktion gehören nicht zu diesem Ticket.
Die Datenanbindung und Feldregeln aus T-40 werden nicht nochmals umgesetzt.
T-43 prüft ihre Darstellung nach dem Umbau, ohne die bestehende technische
Freigabe oder Mikes getrennte Abschlussabnahme für T-40 zu ersetzen.

### Auflösung

Fassungen `1f75154`, `3855bb7` und `9a92abe` technisch freigegeben
(Runde 1 bis 3, `claude`). Mike hat die überarbeitete Ansicht am
2026-09-25 mit „Passt, mach mit dem nächsten Ticket weiter“ abgenommen.
T-43 ist abgeschlossen; T-44 folgt als eigenständiger Auftrag.
