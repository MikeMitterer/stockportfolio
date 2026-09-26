# T-46 · Detailtabs und Felder kompakter

**Abgeschlossen am 2026-09-26.** Mike: „T-46 ist erledigt“.

**Stand:** Mike hat die Anpassungen am 2026-09-26 während T-45 beauftragt.
T-46 ist nach der technischen Freigabe von T-47 umgesetzt und durch Codex selbst geprüft.
Runde 1 ist technisch freigegeben. Der in Runde 2 bestätigte Übersetzungsfehler
(`links.newLink`) ist korrigiert und in Runde 3 (`c48f212`) technisch
freigegeben. Die zwei Nachträge (Löschbestätigungs-Abstand bei Verweisen,
leere Depotgruppen ausblenden) sind in Runde 4 (`0a26ed0`) technisch
freigegeben. Der Nutzerauftrag „Asset-Typ in der Basiszeile anzeigen“ ist
umgesetzt; Claude hatte Runde 5 (`1124b4b`) mit `changes_requested`
zurückgegeben (abgeschnittener Basiswährungs-Hinweis). Die Korrektur sowie ein
Header-Überlapp-Fund und die Rundung von Delta Bestand sind in Runde 6
(`4367acf`) technisch freigegeben. Mike hat T-46 am 2026-09-26 abgeschlossen.

## Für dich

Die Detailansicht beginnt mit „Kursverlauf“. Tabs für weitere Informationen
erscheinen nur, wenn sie Inhalte anbieten. Die Informationsfelder brauchen
weniger Platz zwischen Rand, Bezeichnung, Wert und Quellenangabe.
Die Basiswährung steht außerdem beim Gesamtwert und beim aktiven Depot in
der Statuszeile (Mikes UI-Nachtrag zu T-38).

## Gewünschtes Verhalten

- Kursverlauf steht zuerst und ist beim Öffnen ausgewählt.
- Leere Informationsbereiche erzeugen keinen Tab. Vorhandene Werte einschließlich
  0 und Nein bleiben sichtbar. Lade- und Fehlerzustände dürfen nicht unerreichbar werden.
- Ein gemeinsamer Informationstab zeigt nur ergänzende Angaben und Zusatzwerte.
  Desktop und Mobile bleiben kompakt, lesbar und umbrechbar.
- StockInfo bleibt Datenquelle, keine neue Bearbeitung seiner Angaben.
- Die Basiswährung ist beim Gesamtwert und in der globalen Depot-Statuszeile
  sichtbar; ein Depotwechsel aktualisiert beide Anzeigen.
- Ein dezentes typspezifisches SVG mit neutralem Etikett als Rückfall neben dem Namen in der Basiszeile (Desktop und Mobile)
  zeigt den aktuellen StockInfo-Typ im Tooltip. Auch neue Typen
  erscheinen ohne lokale Enumeration. Kein Informationstab allein für den Typ.

## Verify

| Handgriff | Erwartung | AI |
|---|---|:--:|
| Wertpapier öffnen | Kursverlauf zuerst und aktiv | ✅ |
| Position mit/ohne Zusatzwerte öffnen | Nur tatsächlich verfügbare Informations-Tabs; 0/Nein bleiben erhalten | ✅ |
| Desktop und Mobile im Browser | Kompakte Felder, kein Überlauf oder abgeschnittener Inhalt | ✅ |
| Sparkline zweimal anklicken | Kursverlauf öffnet, zweiter Klick schließt die Zeile | ✅ |
| Gruppencarets und globale Symbole | Caret in Gruppenfarbe; globale SVGs dezent | ✅ |
| Englischer Tabellenkopf / Gattung | Prozentzeichen einzeilig; Label und Wert an einer Grundlinie | ✅ |
| Tests, Lint, Typecheck | Erfolgreich; Doku-Abgleich dokumentiert | ✅ |

## Auflösung

Alle Nachträge sind bis Runde 6 (`4367acf`) technisch freigegeben. Die
früheren Rückgaben aus Runde 2 und 5 sind behoben und erneut geprüft.
Mike hat T-46 am 2026-09-26 abgeschlossen.
Text-Tabs mit Unterstrich am Desktop und kompakte Bereichsauswahl mobil
entsprechen Mikes Entscheidung.

## Umsetzungshinweis des Observers · 2026-09-26

T-46 baut auf der T-43-Detailansicht auf. Verfügbare Tabs und Auswahl für
Desktop/Mobile gemeinsam ableiten; beim Wegfall eines Tabs muss ein gültiger
Reiter ausgewählt bleiben. T-43 beschreibt den verzögerten Abruf des großen
Charts beim Öffnen des Kursbereichs. Mit Kursverlauf als Standard startet
dieser Abruf bereits beim Öffnen der Position; Doku-Abgleich und Browserprobe
müssen das berücksichtigen. Cash ohne Kursverlauf braucht weiterhin eine
erreichbare Detailansicht.

## Ergänzung · Mike · 2026-09-26

Die Symbole zum Öffnen/Schließen aller Asset-Gruppen sollen probeweise die
Akzentfarbe verwenden. Herkunft geprüft: aktuell Unicode `⊟` und `⊞` in
`DashboardView.vue`, keine Icon-Bibliothek. Bestehenden Verzicht auf Buttonfläche
und Rand erhalten.

**Mikes Auswahl:** „SVG-Vorschlag passt“. Genehmigt ist das gezeigte Paar
Microsoft Codicons `collapse-all` / `expand-all` (gestapelte Flächen, Minus/Plus),
bündig zur Überschrift. Die zunächst gewählte Akzentfarbe hat Mike anschließend
zurückgenommen; die SVGs verwenden wieder die dezente Textfarbe. Die bisherigen Unicode-Zeichen
werden dadurch ersetzt. Quelle: https://github.com/microsoft/vscode-codicons.

## Weitere Nutzerwünsche · 2026-09-26

- Löschbestätigung: mehr Platz um Text und zwischen Text und Schaltflächen.
- Gespeicherte Positionsnotizen unterhalb der Button-Leiste in den Detailinfos
  anzeigen. Ohne Notiz kein Leerraum; mehrzeiliger Text muss mobil umbrechen.

**Offene Übernahme:** Lokaler Board-Stand `2026-09-11-activity-feed` gegenüber
Skill `2026-09-11-lessons-follow-through`: allgemeine Übernahme bleibt für Mike
bzw. ausdrücklich beauftragte Board-Pflege offen. Keine Konventionsänderung hier.

- Gruppen-Carets laut Mike mindestens so deutlich wie Positions-Carets: gemeinsame
  UxCaret-Komponente in Größe md statt sm, ohne bisherige 50-%-Dämpfung.

**Jüngste Farbentscheidung:** „Nimm die Akzentfarbe für Gruppen öffnen/schließen wieder weg“.
Die SVG-Auswahl bleibt erhalten; normale Textfarbe mit Aufhellung beim Hover.

## Umsetzung und Selbstprüfung · Codex · 2026-09-26

- Gemeinsame Bereichsliste für Desktop und Mobile: Kursverlauf zuerst und aktiv;
  Cash ohne Kursverlauf bleibt bei Bewertung. Leere Informationsbereiche entfallen.
  Beim Wegfall eines ausgewählten Tabs wird ein gültiger Bereich gewählt.
- Feldkatalog wird beim Öffnen der Position geladen, damit ein ausgeblendeter Tab
  den Abruf nicht verhindern kann. Lade-/Fehlerzustand und nicht geladene Details
  bleiben erreichbar. Null ohne Inhalt ist leer; 0 und Nein bleiben Inhalte.
- Positionsnotiz als sicherer Text direkt unter der Bereichs-/Aktionsleiste;
  Zeilenumbrüche bleiben erhalten, leere Notizen erzeugen kein Element.
  Im Desktop-Editor gespeichert und nach Reload auf Mobile wieder angezeigt.
- Karteninnenabstand von 12 auf 8 px reduziert. Browser 1440 und 390 px geprüft;
  mobile Bereichsauswahl ohne horizontalen Überlauf (Dokument 390/390 px).
  0,0 % und Nein im Browser vorhanden, Cash bietet nur Bewertung an.
- Codicons-SVGs ersetzen Unicode. Herkunft und CC-BY-4.0-Zuordnung in
  THIRD_PARTY_NOTICES.md; normale Textfarbe gemäß jüngster Nutzerentscheidung.
  Alle Gruppen schließen/öffnen im Browser geprüft. Gruppen-Carets 15,2 px und
  volle Deckkraft, Positions-Carets 12 px. Bestehende UxCaret-Komponente verwendet.
- Löschbestätigung mit zusätzlichem Textinnenabstand 12 px vertikal / 8 px horizontal;
  Desktop-Screenshot geprüft und Abbrechen ohne Löschen verwendet.
- Regressionen zunächst rot, danach grün: Standardbereich, Notiz als Text,
  leere Notiz, Cash, Wegfall des ausgewählten Tabs. Zusätzliche Probe prüft
  Katalogabruf vor Tab-Klick, Ladezustand, Nein als einzigen Wert und Ausschluss
  durch sichtbare Hauptspalte. Fehlerzustand bleibt erreichbar.
- Letzter Lauf: `make test` 740 Tests / 57 Dateien; `make lint` und
  `make typecheck` ohne Fehler oder Warnungen. TS-Compiler-API-Inventar der
  angefassten TS/Vue-Dateien: englische Bezeichner. `git diff --check` sauber.

**Doku-Abgleich:** README „Price history“ nennt den Abruf beim Öffnen der Position;
„Detail notes and information“ erklärt Notizen und bedingte Tabs. Browserfixture
und deren README enthalten nun die mehrzeilige EUNL-Notiz für weitere Sitzungen.
Inventar von docs und unraid geprüft; historische Entwürfe und Containeranleitungen
enthalten keine anzupassende aktuelle Zusage zu diesen Darstellungen.
**Lessons:** SP-CX-01 bis SP-CX-04, Fassung 2026-09-11, vor Umsetzung und Übergabe
berücksichtigt. SP-CX-02 durch aktuellen Zustands-/Doku-Abgleich; SP-CX-04 durch
Wiederverwendung und Ergänzung des bestehenden Browserfixtures und Testservers.
Die fehlende Notizanzeige ist ein einzelner belegter Befund, kein neues wiederholtes
Muster. Allgemeine Skill-Übernahme bleibt wie oben ausdrücklich offen.

**Detailnavigation · letzte Nutzerentscheidung:** Text-Tabs mit Unterstrich,
ausdrücklich dezent. Naive-Textbuttons ohne Flächen und Rahmen, neutrale
Schriftfarbe; nur die aktive Linie verwendet die Akzentfarbe (1 px).
Nach Mikes Bündigkeitskorrektur seitlichen Innenabstand und Zentrierung entfernt.
Mobile Browsermessung: Inhalt, Notiz und erste Tab-Spalte beginnen bei x = 33 px;
zweite Tab-Spalte und ihr Text ebenfalls identisch. Keine horizontale Scrollfläche.
Desktop und Mobile nach der Umstellung visuell geprüft. Letzte vollständige
Prüfung nach dieser Korrektur: 740 Tests / 57 Dateien, Lint und Typecheck grün.
Gruppen-SVGs im Browser in normaler Textfarbe bestätigt (`rgb(196, 186, 177)`),
transparent und ohne Buttonrand. Die SVG-Vorschau mit Akzentfarbe ist überholt.

**Mobile-Nachbesserung:** Mike bestätigt Desktop, beanstandet die zweizeilige
Textnavigation auf Mobile. Unter dem Fundament-Breakpoint md bietet jetzt ein
Naive-Dropdown alle verfügbaren Bereiche aus derselben Liste an. Der aktuelle
Bereich steht mit UxCaret in einer Zeile; bei nur einem Bereich entfällt die
Auswahl. Browserwechsel Kursverlauf → Bewertung geprüft, Menü schließt und
Beschriftung folgt. Komponententest klickt durch das echte Dropdown.
Mikes weiterer Wunsch: sehr dezenter Hintergrund hinter der Navigation,
ohne Rand und ohne Verschiebung der Textkante. Aus vorhandenen Token gemischt;
keine neuen Theme-Werte und keine Fundamentänderung.

**Abschließende Prüfung der Mobile-Auswahl und Hintergrundfläche:**
`make test`: 741 Tests / 57 Dateien, `make lint` und `make typecheck` erfolgreich.
Browser Mobile 390 px: Bewertung per Auswahl geöffnet, Label aktualisiert und
Menü geschlossen, Dokumentbreite 390 px. Desktop Textkante bleibt bei x = 65 px.

## Reviewer-Prüfung (Claude, Runde 1, Fassung `573d15b`)

**Technische Freigabe.** `make test` (57 Dateien, 741 Tests), `make lint` und
`make typecheck` selbst gegen die Übergabefassung ausgeführt — alle drei ohne
Befund. Seit dem Handoff-Commit betraf der Folgecommit ausschließlich
Board-Dateien; der Produktstand war während der Prüfung stabil.

Diff `4c51480..573d15b` gelesen. `PositionReadDetails.vue`: `section` startet
bei `history` für Wertpapiere, bei `portfolio` für Cash; `sections` leitet die
verfügbaren Bereiche zentral ab (Desktop-Tabs und mobile Auswahl teilen sich
dieselbe Liste), ein `watch` auf `sections` wählt beim Wegfall des aktiven
Tabs automatisch einen gültigen Bereich. `hasAdditionalInfo` berücksichtigt
`fields.loading`/`fields.error`/`details == null` zusätzlich zu
`hasDetailContent`, damit Lade- und Fehlerzustände nicht unerreichbar werden.
`hasDetailContent` in `domain/detailFields.ts` behandelt 0/„Nein“ als Inhalt
(Wert ungleich Platzhalter) und Felder mit Metadaten auch ohne Wert als
Inhalt — konsistent mit der bereits geprüften Logik aus T-43/T-45. Der
Katalogabruf wurde von `PositionDetailFields.vue` nach `PositionReadDetails.vue`
verschoben (kein doppelter Request, kein Laden erst nach Tab-Klick).
Positionsnotiz nutzt Vue-Textinterpolation (`{{ row.position.notes }}`), keine
`v-html` — kein XSS-Risiko durch Freitext.

Karteninnenabstand (`--space-3` → `--space-2`) ergibt 12 → 8 px, deckt sich
mit der Angabe. Löschbestätigungs-Padding `var(--space-3) var(--space-2)` =
12 px vertikal / 8 px horizontal, exakt wie angegeben. `GroupActionIcon.vue`
mit sauberer CC-BY-4.0-Zuordnung in `THIRD_PARTY_NOTICES.md`; `fill="currentColor"`
und `aria-hidden="true"` korrekt (Button trägt das eigentliche `aria-label`).
Gruppen-Caret jetzt `size="md"` und `opacity: 1` (vorher `sm`/0.5) — deckt sich
mit „mindestens so deutlich wie Positions-Carets“.

`tests/components/positionReadDetails.spec.ts` ist ungewöhnlich gründlich:
eigener Test bestätigt, dass die Notiz als Text (nicht als HTML) gerendert
wird (`note.find('img').exists()` ist `false` bei einem eingeschleusten
`<img onerror>`); weitere Tests decken Tab-Wegfall bei Nullwerten, den
Fehlerzustand des Katalogs, den Katalogabruf vor Tab-Klick, „Nein“ als
einzigen Zusatzwert, die Cash-Sonderrolle (nur „Bewertung“) und die
Naive-Dropdown-Interaktion der mobilen Auswahl (`.n-dropdown-option-body`,
echte Klicks) ab.

Live im Browser (Testdienst Port 8899, App auf `:5189`) nachvollzogen: AAPL
geöffnet — „Kursverlauf“ zuerst aktiv, dünne Unterstreichung in Akzentfarbe,
keine Button-Flächen. Gruppensymbole (Collapse/Expand-all) per
`getComputedStyle` auf `rgb(196, 186, 177)` bestätigt — exakt die im Ticket
genannte Farbe, kein Akzent. Mehrzeilige Notiz gesetzt und gespeichert:
erscheint sofort unterhalb der Tab-/Aktionsleiste mit erhaltenem Zeilenumbruch;
nach Reload weiterhin vorhanden, Standardbereich weiterhin „Kursverlauf“.
Die mobile mit 390 px erzwungene mobile Bereichsauswahl (`resize_window`)
konnte in dieser Sitzung erneut nicht mit echter Fensterbreite nachgestellt
werden (bekannte Werkzeuggrenze); die zugehörige Komponentenprobe mit echter
Dropdown-Interaktion und die CSS-Bruchpunktprüfung (`@include below(md)`)
wurden stattdessen gelesen und für korrekt befunden.

**Ergebnis:** Fassung `573d15b` technisch freigegeben. Kein `changes_requested`.

## Beauftragte Nachträge nach Runde 1 · 2026-09-26

Rückgabe von Claude zu `573d15b` verarbeitet; technische Freigabe ohne Befund.
Mikes „Passt“ bestätigt den Vorschlag zur Zusammenführung, keinen Ticketabschluss.

- Ein gemeinsamer Bereich Informationen: Gattung und Zusatzwerte, keine Wiederholung
  von Symbol, ISIN und Rohkurs aus der Hauptzeile. Umgerechneter Stückpreis bleibt;
  mobil auch Kursstand und externe Links, da sie dort sonst fehlen.
- Klick auf die kleine Kursgrafik öffnet gezielt den Kursverlauf, auch wenn zuvor
  ein anderer Detailbereich gewählt war. Mikes Präzisierung: Klick schaltet die Zeile
  auf und zu; beim Öffnen wird Kursverlauf gewählt.
- Hintergrund hinter der Navigation deutlicher als der verworfene sehr schwache Stand.
- Symbole für alle Gruppen öffnen/schließen kleiner und kontrastärmer; Hover/Fokus klar.
- Gruppen-Caret in der Farbe des zugehörigen Gruppenpunkts.

- Tabellenüberschriften: Actual/Target bzw. IST/Ziel und Prozentzeichen mit
  geschütztem Leerzeichen zusammenhalten; Mike meldete ein allein umgebrochenes %.

## Umsetzung der Nachträge · Codex · 2026-09-26

- Ein gemeinsamer Informationstab enthält Gattung und Zusatzwerte. Desktop entfernt
  wiederholte Kennungen, Rohkurs, Kursstand und Links; Mobile behält Kursstand/Links.
  Der umgerechnete Stückpreis bleibt bei Fremdwährungen sichtbar. Gemeinsame
  Verfügbarkeitsprüfung und Auswahl; 0/Nein/Lade-/Fehlerzustände bleiben erreichbar.
- Sparkline als beschrifteter, per Tastatur bedienbarer Knopf. Er schaltet die Zeile
  auf/zu und fordert beim Öffnen gezielt Kursverlauf an. Browserfolge geöffnet →
  geschlossen → geöffnet geprüft, einschließlich vorheriger Informationsauswahl.
- Globale Gruppen-SVGs auf 16 px verkleinert und Text-Muted statt Text-Secondary;
  Hover und Fokus bleiben klar. Gruppen-Carets verwenden denselben Farbwert wie
  der jeweilige Punkt (vier Gruppen im Browser per berechneter Farbe verglichen).
- Navigationshintergrund nach Mikes Rückmeldung auf eine Zwischenstufe reduziert:
  40 % Surface-Raised gegenüber der zu schwachen 18-%- und zu starken 75-%-Probe.
  Gattung und Typ an gemeinsamer Grundlinie; der bisherige dd-Abstand entfällt.
- Prozentüberschriften erhalten geschützten Zwischenraum und einen nicht
  umbrechenden Label-Wrapper; Actual-Spalte 110 statt 90 px für Text plus Sortierer.
  Im englischen Browser bei 1024 px beide Labels per Text-Range exakt eine Zeile.
- Betroffene Komponentenproben vor Umsetzung rot, danach grün. Test durch echte
  Tabelle prüft Sparkline-Auf/Zu, Standardbereich und gemeinsamen Informationstab.
  TS-Compiler-API-Inventar sämtlicher angefasster TS/Vue-Dateien: englische Namen.

**Doku-Abgleich der Nachträge:** README „Position information“ und „Price history“
beschreiben zusammengeführte Informationen, verbleibende mobile Angaben und
Sparkline-Auf/Zu. Keine Änderung an Konfiguration, StockInfo oder Unraid.
Runde-1-Freigabe bleibt auf `573d15b` bezogen; Nachträge werden getrennt übergeben.

**Letzter Nachweis:** Mobile 390 px zeigt im gemeinsamen Informationstab auch Kursstand
und beide externen Links; 0 und Nein bleiben erhalten, Dokumentbreite 390 px.
Desktop 1024 px zeigt drei Bereiche und keine wiederholten Kennungen/Rohkurse.
`make test`: 741 Tests / 57 Dateien, `make lint` und `make typecheck` grün.

**Gruppenreihenfolge · Mike:** ETFs zuerst, danach Stocks. Gemeinsame ASSET_GROUPS-
Vorgabe geändert; alle übrigen Gruppen folgen in ihrer bisherigen Reihenfolge.
README „Six portfolio groups“ entsprechend aktualisiert.
Bestehende Reihenfolge-Erwartung im Rebalancing-Test angepasst; Browser zeigt
ETFs vor Aktien, danach Anleihen und Cash.

**Link-Einstellungen · Mikes UI-Rückmeldung:** Seit T-44 belegte jeder Verweis
am Desktop zwei breite Formularzeilen. Ab lg wieder eine Zeile pro Verweis,
Spaltenbeschriftungen nur einmal; kleinere Ansichten behalten die Feldbeschriftungen
und umbrechende Anordnung. Browser bei 1440, 1024 und 390 px geprüft, kein
horizontaler Überlauf. Desktop-Zeilen nach der ersten jeweils 28 px hoch.
`make test`: 741/741, `make lint` und `make typecheck` erfolgreich.
**Doku-Abgleich:** README-Abschnitt zu Links beschreibt weiterhin korrekt beide
Filter; keine Verhaltensänderung an Speicherung, Filterung oder Sicherung.
Nur die Darstellung geändert, daher dort keine Textanpassung erforderlich.

## Observer-Einordnung zum Übersetzungsschlüssel · 2026-09-26

Der neue Nutzerbefund ist am Quelltext bestätigt: `ExternalLinkEditor.vue`
verwendet `links.newLink`, beide Sprachkataloge führen `newLink` jedoch unter
`instruments`. Die Schlüsselgleichheit zwischen Deutsch und Englisch allein
erkennt diese Abweichung zwischen Aufruf und Katalog nicht.

**Lessons-Einordnung:** Einzelbefund; kein neues wiederholtes Fehlermuster
belegt und kein passender lokaler Lessons-Eintrag vorhanden. Der Befund bleibt
in T-46. Für die Korrektur prüfen Coder und Verifier den tatsächlichen
Hinzufügen-Schritt in beiden Sprachen: Der neue Verweis erhält eine übersetzte
Bezeichnung, keinen rohen Schlüssel. Der bereits gemeldete Rückgabeweg bleibt
maßgeblich; dieser Hinweis erzeugt keine zusätzliche Reviewrunde.

## Reviewer-Prüfung (Claude, Runde 2, Fassung `fd52010`)

**Technische Prüfung mit Rückgabe.** `make test` (57 Dateien, 741 Tests),
`make lint` und `make typecheck` selbst gegen die Übergabefassung
ausgeführt — alle drei ohne Befund. Seit dem Handoff-Commit gab es keine
weiteren Commits; der Produktstand war während der Prüfung stabil.

**Bestätigter Rückgabegrund:** Live im Browser (`Einstellungen → Verweise →
Verweis hinzufügen`) nachvollzogen — das neue Bezeichnungsfeld zeigt wörtlich
„links.newLink“ statt eines übersetzten Textes. Quellcode bestätigt die vom
Observer benannte Ursache: `ExternalLinkEditor.vue:55` ruft `t('links.newLink')`
auf, `newLink` ist in `de.ts`/`en.ts` jedoch unter `instruments` einsortiert
(`grep` bestätigt genau eine Verwendung, unter dem falschen Namensraum). Per
`git log -S"newLink"` vorbestehend seit Commit `6cec925`, nicht durch T-46
verursacht, aber ein reproduzierbarer, sichtbarer Fehler beim alltäglichen
Hinzufügen eines Verweises. Testfall wieder entfernt, keine Restspur im Depot.

**Ergebnis:** `changes_requested`. Fassung `fd52010` bleibt bis zur Korrektur
unverändert stabil.

**Übrige Runde-2-Änderungen — alle live bestätigt, kein weiterer Befund:**
- Gemeinsamer „Informationen“-Tab: Symbol/ISIN/Rohkurs nicht wiederholt,
  umgerechneter Stückpreis bleibt (`Bewertet mit € 180,80 je Stück · USD/EUR`
  bei AAPL live gesehen). Quellcode: `showConvertedPrice`/`showQuoteAge`/
  `showLinks` steuern die mobil zusätzlich sichtbaren Werte korrekt.
- Sparkline als `<button>` mit `aria-label`/`aria-expanded`,
  `event.stopPropagation()` verhindert doppeltes Umschalten durch den
  Zeilen-Klick; `historyRequest`-Zähler erzwingt „Kursverlauf“ nur beim
  Öffnen, nicht beim Schließen — live reproduziert (Zeile geschlossen →
  Sparkline-Klick → öffnet mit Kursverlauf aktiv).
- `ASSET_GROUPS` jetzt `['etfs', 'stocks', ...]` — ETFs stehen im Dashboard
  vor Aktien, sowohl in der Bilanzübersicht als auch in der Positionstabelle.
- Tabellenüberschriften `IST %`/`Ziel %` bzw. `Actual %`/`Target %` mit
  ` ` (geschütztes Leerzeichen) in `de.ts`/`en.ts`, zusätzlich
  `.cell-head-label { white-space: nowrap }`; Actual-Spalte jetzt 110 px.
- Gruppensymbole auf 16 px verkleinert, Farbe auf `--text-muted` reduziert;
  Gruppen-Caret nutzt jetzt dieselbe `color`-Variable wie der Gruppenpunkt
  (`:style="{ color }"` in `PositionGroupHeader.vue`).
- `ExternalLinkEditor.vue`: ab `lg` eine Zeile pro Verweis mit einmaligen
  Spaltenbeschriftungen (visuell versteckt für Hilfstechnik via
  Standard-„sr-only“-Clip-Path), kleinere Ansichten unverändert umbrechend.
  Live bei 1456 px als einzeilige Verweise bestätigt.
- README-Änderungen decken sich mit der Umsetzung (Informationen, Preisverlauf,
  Sechs-Gruppen-Reihenfolge).

## Nacharbeit zur Runde 2 · Codex

`newLink` in beiden Sprachkatalogen von instruments nach links verschoben.
Ein Komponententest führt den Hinzufügen-Klick mit echtem i18n für Deutsch
und Englisch aus und prüft sowohl ausgegebene Daten als auch das Eingabefeld.
Vor Korrektur beide Fälle rot (links.newLink), danach grün. Gesamtlauf:
743 Tests / 58 Dateien, Lint und Typecheck erfolgreich. Neue Bezeichner per
TS-Compiler-API inventarisiert: englisch.
Browser: Hinzufügen unter Deutsch ergibt „Neuer Verweis“, unter Englisch
„New link“. Beide Testverweise anschließend über die Löschbestätigung entfernt;
die drei ursprünglichen Verweise bleiben erhalten. Browser auf Deutsch zurückgesetzt.

Dynamische StockInfo-Typen sind ein weiterer Nutzerauftrag mit eigenem
API-Bedarf, erfasst in T-48. StockInfo-Konsumententicket T-73 liegt dort im
Backlog; die zwei Typen werden nicht durch eine neue feste Liste ersetzt.
Keine Umsetzung dieses API-Auftrags in der T-46-Prüffassung.

**Doku-Abgleich:** Die Bezeichnung eines neuen Verweises ist eine Korrektur
des bestehenden Verhaltens; keine Anleitung verspricht den Schlüsseltext.
README bleibt hierfür unverändert. Die unvollständige Beschreibung der
Asset-Typen wird mit dem zugehörigen Verhalten in T-48 korrigiert.

## Reviewer-Prüfung (Claude, Runde 3, Fassung `c48f212`)

**Technische Freigabe.** `make test` (58 Dateien, 743 Tests), `make lint` und
`make typecheck` selbst gegen die Übergabefassung ausgeführt — alle drei ohne
Befund. Seit dem Handoff-Commit betrafen die Folgecommits ausschließlich
Board-Dateien; der Produktstand war während der Prüfung stabil.

**Korrektur geprüft.** `git show c48f212 -- src/i18n/de.ts src/i18n/en.ts`
gelesen: `newLink` ist in beiden Katalogen aus `instruments` entfernt und
unverändert im Wert unter `links` neu eingefügt — minimale, zielgerichtete
Änderung ohne Nebenwirkung auf andere Schlüssel.

**Neuer Regressionstest.** `tests/components/externalLinkEditor.spec.ts`
mountet `ExternalLinkEditor` je Sprache (`de`/`en`), klickt den echten
„Verweis hinzufügen“/„Add link“-Button, prüft das emittierte `update`-Ereignis
und den tatsächlichen Feldwert im DOM (`wrapper.get('input').element.value`).
Beide Fälle deckten den Fehler vor der Korrektur auf (laut Codex zunächst rot)
und sind jetzt grün — ein Test, der den konkreten gemeldeten Fehler in beiden
Sprachen dauerhaft absichert, nicht nur die Katalogstruktur.

**Live im Browser** (`http://127.0.0.1:5189/#/settings?tab=links`, Testdienst
Port 8899) nachvollzogen: Ein von mir angelegter Verweis erhielt die
Bezeichnung „Neuer Verweis“ (zuvor wörtlich „links.newLink“) — Fix bestätigt.
Bei der Live-Probe fiel zusätzlich mein eigener Testverweis aus Runde 2 auf,
der noch vorhanden war (ein früherer Löschversuch war an der
Popconfirm-Bestätigung „Verweis „links.newLink" entfernen?“ hängen geblieben,
die ich damals übersehen hatte — kein Produktfehler, sondern ein liegen
gebliebener eigener Testrest). Beide Testverweise über die Löschbestätigung
inklusive „Bestätigen“-Klick entfernt; danach wieder die drei ursprünglichen
Verweise sichtbar, Depot unverändert.

Die übrigen Runde-2-Änderungen waren bereits in Runde 2 live bestätigt und
seither unverändert (Diff seit `fd52010` betrifft ausschließlich die beiden
i18n-Dateien und den neuen Test).

**Ergebnis:** Fassung `c48f212` technisch freigegeben. Kein `changes_requested`.
Mikes Abschlussentscheidung für T-46 insgesamt bleibt offen; die beiden neuen
Nachträge aus der OUTBOX (Löschbestätigungs-Abstand bei Verweisen, leere
Depotgruppen ausblenden) sind nicht Teil dieser Prüffassung und folgen nach
Rückgabe an Codex.

## Weitere UI-Nachträge nach Runde 3 · Codex

- Link-Löschbestätigung: eigener Inhaltsabsatz mit denselben Token-Abständen
  wie bei der Positions-Löschung (12 px vertikal, 8 px horizontal). Breite
  begrenzt, lange Bezeichnungen dürfen umbrechen. Keine Naive-Komponente
  über CSS überschrieben. Desktop 1440 und Mobile 390 px im Browser geprüft;
  mobil liegt die Bestätigung bei x=80 bis 357 innerhalb der Seite. Abgebrochen,
  keine bestehenden Links gelöscht.
- Übersicht „Depotgruppen“: gemeinsame reaktive visibleGroups-Auswahl für
  Balken und eingeklappte Kurzliste. Nur Gruppen mit Ist=0 und Ziel=0 entfallen;
  ein gesetztes Ziel ohne Bestand bleibt sichtbar. Positionen und Berechnung
  werden dadurch nicht verändert. Browser-Testdepot zeigt ETFs, Aktien,
  Anleihen und Cash; leere Edelmetalle/Geldmarkt entfallen.
- `make test`: 743 Tests / 58 Dateien; Lint, Typecheck und diff-check grün.
  TS-Compiler-Inventar der beiden angefassten Vue-Dateien: englische Bezeichner.

**Doku-Abgleich:** README bei „Six portfolio groups“ beschreibt das Ausblenden
und den sichtbaren Zielanteil ohne Bestand. Der Dialogabstand verändert keine
Bedienfolge und erfordert keine weitere Anleitung. SP-CX-02 berücksichtigt:
die technische Freigabe der Runde 3 bleibt auf ihre alte Fassung beschränkt.

## Reviewer-Prüfung (Claude, Runde 4, Fassung `0a26ed0`)

**Technische Freigabe.** `make test` (58 Dateien, 743 Tests — unverändert
gegenüber Runde 3, kein neuer Testfall in dieser Runde), `make lint` und
`make typecheck` selbst gegen die Übergabefassung ausgeführt — alle drei ohne
Befund. Seit dem Handoff-Commit betraf der Folgecommit ausschließlich
Board-Dateien; der Produktstand war während der Prüfung stabil.

Diff `c48f212..0a26ed0` gelesen (`README.md`, `ExternalLinkEditor.vue`,
`DashboardView.vue`, 37 Zeilen). Beide Änderungen sind minimal und zielgerichtet:

- **Link-Löschbestätigung:** Der bisherige nackte Text im `NPopconfirm` steckt
  jetzt in `<p class="linkeditor__delete-confirmation">` mit
  `padding: var(--space-3) var(--space-2)` — genau das bei der
  Positions-Löschung bereits verwendete Muster (12 px vertikal / 8 px
  horizontal, Runde 1 bestätigt). `max-width: min(22rem, calc(100vw - 6rem))`
  und `overflow-wrap: anywhere` verhindern Überlauf bei langen Bezeichnungen.
  Live im Browser gemessen (`getComputedStyle`):
  `padding: "12px 8px"`, `maxWidth: "352px"` — exakt wie im Code. Kein CSS auf
  der Naive-Komponente selbst (nur auf dem eigenen `<p>`), der
  Naive-Wächter-Test bleibt unberührt.
- **Leere Depotgruppen ausblenden:** Neuer `visibleGroups`-Computed in
  `DashboardView.vue` filtert `actualPercent !== 0 || targetPercent !== 0`
  und wird sowohl für die aufgeklappten Balken als auch die eingeklappte
  Kurzliste verwendet (eine gemeinsame Quelle, kein doppelter Filter).
  Quellcode zu `actualPercent`/`groupTargetPercent` geprüft
  (`src/domain/rebalancing.ts:88`, `:448`): Beide Werte entstehen durch
  Multiplikation mit dem tatsächlichen Gruppenwert bzw. durch Summierung
  vorhandener Ziel-Prozentsätze — bei keiner Position in der Gruppe ergeben
  sich exakt `0`, kein Gleitkommarest durch Rundung. Der `!==0`-Vergleich ist
  damit für den Fall „keine Positionen“ verlässlich, keine Rundungsfalle.

**Live im Browser** (Testdienst Port 8899, App auf `:5189`) nachvollzogen:
Depotgruppenübersicht zeigt nur ETFs/Aktien/Anleihen/Cash (aufgeklappt und
eingeklappt identisch), Edelmetalle/Geldmarkt entfallen — passend dazu über
IndexedDB bestätigt, dass im Testdepot keine Position und kein Ziel-% in
diesen beiden Gruppen existiert (`actualPercent`/`targetPercent` also exakt 0
in beiden Fällen). Link-Löschbestätigung mit „Abbrechen“ abgebrochen, kein
Verweis gelöscht; die drei ursprünglichen Verweise unverändert vorhanden.

**Einschränkung (nicht blockierend):** Der Fall „Ziel gesetzt, aber ohne
Bestand bleibt die Gruppe sichtbar“ ist nicht live reproduziert — ein Test
dafür hätte eine reale Instrumentensuche gegen den Testdienst und eine neue
Position erfordert, was das Risiko von Testresten im Depot erhöht hätte. Die
Prüfung stützt sich hier auf die Quellcodeanalyse oben (`targetPercent` wird
unabhängig von `actualValue`/Bestand berechnet, der Filter verknüpft beide
Bedingungen mit „oder“) sowie darauf, dass für DashboardView projektweit
keine Komponententests existieren (kein Rückschritt gegenüber dem
bestehenden Testumfang). Diese Einschränkung ist keine Rückgabe, sondern eine
offene Beobachtung für eine künftige gezielte Probe.

**Ergebnis:** Fassung `0a26ed0` technisch freigegeben. Kein `changes_requested`.
Mikes Abschlussentscheidung für T-46 insgesamt bleibt offen; der neue
Nutzerauftrag „Asset-Typ in der Basiszeile anzeigen“ aus der OUTBOX ist nicht
Teil dieser Prüffassung.

## Typanzeige und sichtbare Basiswährung · Codex-Nachtrag

- Gemeinsame `positionType`-Auflösung bevorzugt den aktuellen StockInfo-Kurstyp
  gegenüber einer gespeicherten alten Gattung. Offene Kennungen einschließlich
  etc, fund, crypto und new-plugin-type werden unverändert durchgereicht.
- Gemeinsamer `AssetTypeHint` für Desktop/Mobile. Mike fand den ersten Textentwurf
  schlecht; auf seinen Folgeauftrag stehen unterschiedliche Lucide-SVGs neben
  dem Namen: stock/Kurschart, etf/Ebenen, etc/Edelstein, fund/Kreisdiagramm,
  crypto/Münzen, bond/Urkunde. Unbekannte Typen bekommen ein neutrales Etikett.
  Dies ist ausschließlich eine Darstellungszuordnung, keine Typbeschränkung.
  Auf Mikes letzten Wunsch 14 statt 16 px und 75 % Deckkraft mit text-muted.
  Herkunft/ISC-Lizenz in THIRD_PARTY_NOTICES.md. Tooltip
  öffnet am Desktop per Hover/Fokus, mobil per Tippen; der Klick öffnet nicht
  die Zeile. Cash trägt keine StockInfo-Typmarkierung.
- Typangabe aus dem Informationstab entfernt; bei der Bundesanleihe im Browser
  nur noch Kursverlauf/Bewertung. Lade-/Fehlerzustände und echte Zusatzdaten
  bleiben weiterhin Inhalt. Ein leer gewordener gewählter Tab fällt zurück.
- Mikes T-38-UI-Befund: Dashboard nennt neben dem Gesamtwert ausdrücklich die
  Basiswährung, globale Statuszeile nennt sie beim Depotnamen. Kein Eingriff
  in Währungswahl oder FX-Rechnung; die T-38-Freigabe bleibt historisch getrennt.
- Browser: Desktop 1440 px mit ETF/stock/bond, Fokus-Tooltip „Asset-Typ: bond“;
  Mobile 390 px mit per Tippen geöffnetem „Asset-Typ: etf“, keine gleichzeitig
  geöffnete Detailansicht und kein horizontaler Überlauf. EUR in KPI und
  Statuszeile bei beiden Breiten sichtbar. Desktopansicht wiederhergestellt.
- Regression: fünf Typ-/Leer-Tab-Proben zunächst rot. Aktuelle Suite 750 Tests
  / 58 Dateien, Lint, Typecheck und diff-check grün. Statuszeilentest wechselt
  von Europa (EUR) auf Amerika (USD). Alle angefassten TS/Vue-Bezeichner per
  Compiler-API inventarisiert, deutsche Altvariable in AppStatusBar bereinigt.
- Symbol-Nachtrag: sieben verschiedene SVG-Geometrien einschließlich Fallback
  geprüft; weitere freie Kennungen behalten Fallback und unveränderten zugänglichen
  Namen. Browser 1440/390 px: unterschiedliche ETF-/Aktien-/Anleihen-Symbole,
  Mobile-Tooltip öffnet ohne Details, kein horizontaler Überlauf. Nach Verkleinerung
  14 px / opacity 0.75 im Desktop-Browser gemessen.

**Doku-Abgleich:** README „Position information“, mobile Bedienung und
„Portfolio base currency“ aktualisiert. T-48 nennt den bereits umgesetzten
Anzeigeanteil und die noch offenen API-/Speicher-/Filter-Aufgaben. T-38 verweist
auf den UI-Nachtrag hier. SP-CX-02 und Observer-Hinweis zur Abgrenzung umgesetzt;
SP-CX-04: vorhandenes Browser-Testdepot weiterverwendet. Keine StockInfo-
Produktänderung, keine vorweggenommene vollständige Typkatalog-Integration.


## Nutzer-Nachtrag · Delta Bestand als ganze Stückzahl

Mike, 2026-09-26: „Bei der Bewertung in den Detail-Ansicht - Delta Bestand
Stück - runde auf die volle Stückzahl“.

Nach Rückgabe der Runde 5 umgesetzt: Stückanzeige bei Delta Bestand auf eine
volle Stückzahl runden; gerundete Null ohne Minuszeichen. Die Berechnung selbst
bleibt präzise. Browser Desktop/Mobile geprüft. Dieser Nachtrag war nicht Teil
der Prüffassung `1124b4b`.

## Reviewer-Prüfung (Claude, Runde 5, Fassung `1124b4b`) — `changes_requested`

**Technische Prüfung mit Rückgabe.** `make test` (58 Dateien, 750 Tests — 7 neue
Fälle gegenüber Runde 4), `make lint` und `make typecheck` selbst gegen die
Übergabefassung ausgeführt — alle drei ohne Befund. Seit dem Handoff-Commit
gab es keine weiteren Produktcommits; der Stand war während der Prüfung stabil.

Diff `0a26ed0..1124b4b` vollständig gelesen (19 Dateien). Die neuen Komponenten
`AssetTypeIcon.vue` (sieben Lucide-SVG-Geometrien plus Fallback) und
`AssetTypeHint.vue` (Tooltip/Button mit `@click.stop`, Hover am Desktop,
Klick auf Touch) sind sauber angebunden; `positionType()` in
`positionIdentity.ts` bevorzugt `quote.type` vor der gespeicherten Gattung und
lässt beliebige neue Kennungen unverändert durch — passend zur T-48-Abgrenzung.
`PositionReadDetails.vue` entfernt `kindLabel` konsequent aus `sections`/`facts`,
sodass kein Informationstab mehr allein für den Typ entsteht; der neue Test
`zeigt keinen Informationstab nur für den bereits in der Basiszeile sichtbaren
Typ` sowie die angepasste `quoteContract.spec.ts`-Erwartung belegen das direkt.
`tests/components/positionReadDetails.spec.ts` prüft alle sieben SVG-Formen auf
Verschiedenheit (`shapes.size === 7`), `aria-label` je Typ und die mobile
Einbindung über `PositionCard`. THIRD_PARTY_NOTICES.md enthält die vollständige
ISC-Lizenz für Lucide; Pfade/Geometrie laut Kommentar unverändert.

**Live im Browser** (Testdienst Port 8899, App auf `:5189`, Fenster 1516×863)
nachvollzogen: ETF/Aktie/Anleihe zeigen drei sichtbar unterschiedliche Symbole
(Ebenen/Kurschart/Urkunde), Fokus-Tooltip auf AAPL zeigt sauber „Asset-Typ:
stock“ ohne Kürzung. Statuszeile zeigt „Browser-Testdepot (EUR)“ vollständig.

**Bestätigter Rückgabegrund:** Der neue `:hint` an der Gesamtwert-Karte
(`DashboardView.vue:471`, `` `${t('fx.baseCurrency')}: ${baseCurrency}` ``)
wird bei der Standardfensterbreite abgeschnitten. Live gemessen
(`getComputedStyle`/`getBoundingClientRect`):
`.kpi__hint` hat `clientWidth: 97px` bei `scrollWidth: 101px` — der Text
„Basiswährung: EUR“ passt nicht vollständig, das Ellipsis frisst genau die
Zeichen, die den Wert ausmachen. Sichtbar erscheint „Basiswährung: E…“ statt
„Basiswährung: EUR“ (Zoom-Screenshot bei x=81–300/y=108–150 bestätigt). Ursache:
`KpiCard.vue` legt `.kpi__hint` als einzig flexibles Kind in `.kpi__row` an
(`overflow: hidden; text-overflow: ellipsis; white-space: nowrap;`, kein
`flex-shrink: 0`), während `trend` (`flex-shrink: 0`, 64 px Sparkline) und der
Ausklapp-Chevron bereits Platz beanspruchen — anders als bei den zwei
bestehenden Hinweisen (Investitionsreserve, Reserve in %), die ohne
`trend`/`expandable` auskommen und deshalb nicht überlaufen (live ebenfalls
gemessen: `197px`/`134px` `clientWidth`, kein Unterschied zu `scrollWidth`).
Die Codex-Notiz „EUR in KPI und Statuszeile bei beiden Breiten sichtbar“ trifft
für die Statuszeile zu, für die Gesamtwert-Karte bei dieser Fensterbreite nicht.

Dies verfehlt die im Ticket selbst formulierte Erwartung „Die Basiswährung ist
beim Gesamtwert … sichtbar“ an genau der Stelle, an der der Währungscode
lesbar sein soll — kein Rand- sondern der Normalfall bei üblicher
Desktop-Breite. Kein Recheneingriff nötig, nur eine Platz-/Prioritätsfrage im
Layout der Gesamtwert-Karte (z. B. eigene Zeile für den Hinweis oder
`min-width`/Priorisierung gegenüber Sparkline und Chevron).

**Übrige Runde-5-Änderungen — live bestätigt, kein weiterer Befund:**
- Sieben unterscheidbare Icon-Formen inklusive Fallback für unbekannte Typen.
- Tooltip-Text vollständig lesbar, `@click.stop` verhindert ungewolltes Öffnen
  der Zeile beim Klick auf das Symbol.
- Kein Informationstab mehr allein für die Gattung (Bundesanleihe: nur noch
  Kursverlauf/Bewertung als Bereiche, Quellcode und Test bestätigen dasselbe
  für den allgemeinen Fall).
- Statuszeile zeigt Depotname und Basiswährung vollständig und korrekt.

**Ergebnis:** `changes_requested`. Fassung `1124b4b` bleibt bis zur Korrektur
unverändert stabil. Der offene Nutzer-Nachtrag „Delta Bestand als ganze
Stückzahl“ ist unabhängig davon und kann mit der Korrektur zusammen umgesetzt
werden.


## Korrekturen nach Runde 5 · Codex

- Claudes Hinweis auf die abgeschnittene Basiswährung behoben: KPI-Zeilen
  können umbrechen, Hinweise schrumpfen nicht und dürfen bei Bedarf selbst
  umbrechen. Kein Abschneiden per Ellipse mehr. Browser mit zusätzlichem
  64-px-Verlaufsplatz und auf 220 px begrenzter Zeile: Hinweisbreite 101/101 px,
  kein innerer Überlauf; Mobile 390 px ebenfalls vollständig.
- Mikes Screenshotbefund: Gruppen-Zielmarkierung und Header hatten beide
  z-index 10. Vorher lag die Markierung bei Überlappung vor der Navigation
  (elementsFromPoint), nach Isolation des Balkens hinter dem Header.
  Dieselbe Isolation für die Zielmarkierung des Delta-Balkens übernommen.
  Header, Transparenz und Theme unverändert. Scrollprobe bei 1200×550 px
  im echten Dashboard vor/nach Änderung, Screenshot ohne durchscheinenden Strich.
- Delta Bestand in der Bewertung als ganze Stückzahl, keine negative Null.
  Desktop und Mobile mit bestehendem Testdepot geprüft, keine Speicheränderung.
- `make test`: 750 Tests / 58 Dateien; `make lint`, `make typecheck`,
  `git diff --check` grün. Keine neuen Bezeichner; vorhandene englische
  Namen beibehalten. Desktopansicht wiederhergestellt.

**Doku-Abgleich:** README „Position information“ nennt die gerundete
Stückanzeige bei unveränderter Rechengenauigkeit. Layoutkorrekturen verändern
keine weiteren dokumentierten Verträge. Keine Änderung an Board-Konventionen;
deren offene Übernahme bleibt unverändert sichtbar.

**Observer · Lessons-Einordnung der Runde-5-Nacharbeit:** Die abgeschnittene
KPI-Basiswährung und die Zielmarkierung vor dem Header sind zwei bestätigte
Layout-Einzelfälle mit unterschiedlichen Ursachen. Eine Wiederholung desselben
Fehlermusters oder ein passender lokaler Lessons-Eintrag ist nicht belegt;
keine neue Lesson wird daraus abgeleitet. Die konkreten Gegenproben bleiben
beim Ticket: vollständiger Währungscode auch mit Sparkline und engem Platz,
sowie Header vor den Zielmarkierungen beim Scrollen. Coder-Belege liegen
oben vor; der Verifier prüft diese Aussagen gegen `4367acf`.

## Reviewer-Prüfung (Claude, Runde 6, Fassung `4367acf`)

**Technische Freigabe.** `make test` (58 Dateien, 750 Tests — unverändert
gegenüber Runde 5), `make lint` und `make typecheck` selbst gegen die
Übergabefassung ausgeführt — alle drei ohne Befund. Seit dem Handoff-Commit
betraf der Folgecommit ausschließlich Board-Dateien; der Produktstand war
während der Prüfung stabil.

Diff `1124b4b..4367acf` gelesen (`KpiCard.vue`, `DeltaBar.vue`, `GroupBar.vue`,
`PositionReadDetails.vue`, `README.md`, 6 Dateien):

- **KPI-Hinweis:** `.kpi__row` erhält `flex-wrap: wrap`, `.kpi__hint` verliert
  `overflow: hidden`/`text-overflow: ellipsis`/`white-space: nowrap` zugunsten
  von `flex-shrink: 0`, `max-width: 100%`, `overflow-wrap: anywhere` — der
  Hinweis wird nicht mehr abgeschnitten, sondern bricht bei Bedarf um. Live
  gemessen (`getComputedStyle`/`getBoundingClientRect`): `.kpi__hint`
  `clientWidth === scrollWidth === 101px`, kein Rest-Unterschied mehr (Runde 5:
  97 vs. 101). Zoom-Screenshot zeigt „Basiswährung: EUR“ vollständig auf
  eigener Zeile unter dem Wert.
- **Zielmarkierung/Header-Überlappung:** `isolation: isolate` auf
  `.track` in `DeltaBar.vue` und `GroupBar.vue`. Quellcode-Gegenprobe:
  `ux-foundation/src/components/UxTopbar.vue` hat tatsächlich
  `position: sticky; z-index: 10` — exakt die von Codex genannte Ursache
  (gleicher z-index wie die Zielmarkierung, ohne eigenen Stacking-Context
  lief die Markierung außerhalb ihres Tracks mit dem Header um den Rang).
  `isolation: isolate` ist die lehrbuchgerechte, minimale Eindämmung für
  genau dieses Problem und ändert das Layout selbst nicht. Live bestätigt:
  Depotgruppen-Balken rendern unverändert (Farben, Zielstriche, keine
  Verschiebung). Der ursprüngliche Scroll-Überlapp ließ sich im kleinen
  Testdepot (5 Positionen, keine ausreichende Seitenhöhe) nicht erneut
  provozieren; die Verifikation stützt sich hier auf den bestätigten
  Quellcode-Fund statt auf eine erneute Live-Reproduktion — keine Einschränkung
  der Freigabe, da Ursache und Fix eindeutig und ohne Seiteneffekt sind.
- **Delta Bestand:** `integer(Math.round(row.unitsDelta) || 0)` ersetzt
  `number(row.unitsDelta)`. `Math.round(-0.x)` ergibt in JS `-0`, `Intl.
  NumberFormat` (`integer()`) formatiert `-0` sichtbar als „-0"; `|| 0`
  fängt das ab (`-0` ist falsy in JS). Live an allen vier bepreisten Positionen
  des Testdepots (EUNL, VTI, AAPL, Bundesanleihe) geprüft: Δ Bestand (Stück)
  zeigt durchgehend „0", nie „-0" — genau der Fall, den der Fix behebt. Ein
  größerer, tatsächlich von 0 verschiedener gerundeter Wert war im
  vorhandenen Testdepot nicht erzeugbar, ohne Zielprozente künstlich zu
  verändern; die zugrunde liegende `unitsDelta`-Berechnung selbst ist
  unverändert und bereits durch `tests/domain/rebalancing.spec.ts` abgedeckt
  (`unitsDelta` liefert 10/-10 in den bestehenden Fällen).

**Ergebnis:** Fassung `4367acf` technisch freigegeben. Kein `changes_requested`.
Damit sind alle bislang gemeldeten Runde-5-Befunde und der vorgemerkte
Nutzer-Nachtrag „Delta Bestand als ganze Stückzahl“ abgearbeitet. Mikes
Abschlussentscheidung für T-46 insgesamt bleibt offen.


## Abschluss · 2026-09-26

**Mikes Abschlussentscheidung:** „T-46 ist erledigt“ — im Claude-Chat, von Claude über die STATUS-INBOX weitergeleitet.

Technische Freigabe liegt vor, keine erforderliche Nacharbeit offen.
Ticket nach `40-done/` verschoben; frühere Prüfurteile und damalige
Abnahmestände bleiben als Historie erhalten.

**Doku-Abgleich:** STATUS, Board-README und Ticket-Verweise auf den Abschluss
und den neuen Ablageort aktualisiert. Kein Produktcode geändert; vorhandene
Prüfnachweise bleiben gültig. Allgemeine Konventionsübernahme weiterhin offen
(`2026-09-11-activity-feed` → `2026-09-11-lessons-follow-through`).
