# T-46 · Detailtabs und Felder kompakter

**Stand:** Mike hat die Anpassungen am 2026-09-26 während T-45 beauftragt.
T-46 ist nach der technischen Freigabe von T-47 umgesetzt und durch Codex selbst geprüft.
Runde 1 ist technisch freigegeben. Der in Runde 2 bestätigte Übersetzungsfehler
(`links.newLink`) ist korrigiert und in Runde 3 (`c48f212`) technisch
freigegeben. Mikes Abschlussentscheidung für T-46 insgesamt bleibt offen;
zwei weitere Nachträge (Löschbestätigungs-Abstand bei Verweisen, leere
Depotgruppen ausblenden) sind an Codex übergeben.

## Für dich

Die Detailansicht beginnt mit „Kursverlauf“. Tabs für weitere Informationen
erscheinen nur, wenn sie Inhalte anbieten. Die Informationsfelder brauchen
weniger Platz zwischen Rand, Bezeichnung, Wert und Quellenangabe.

## Gewünschtes Verhalten

- Kursverlauf steht zuerst und ist beim Öffnen ausgewählt.
- Leere Informationsbereiche erzeugen keinen Tab. Vorhandene Werte einschließlich
  0 und Nein bleiben sichtbar. Lade- und Fehlerzustände dürfen nicht unerreichbar werden.
- Ein gemeinsamer Informationstab zeigt nur ergänzende Angaben und Zusatzwerte.
  Desktop und Mobile bleiben kompakt, lesbar und umbrechbar.
- StockInfo bleibt Datenquelle, keine neue Bearbeitung seiner Angaben.

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

Fassung `573d15b` in Runde 1 technisch freigegeben (`claude`). Fassung
`fd52010` (Runde 2, Nachträge) hat Claude mit `changes_requested`
zurückgegeben: `links.newLink` erscheint als roher Schlüssel statt Text beim
Hinzufügen eines Verweises. Korrektur steht bei Codex aus; danach erneute
Prüfung. Mikes Abschlussentscheidung für T-46 insgesamt bleibt offen.
Mike hat Text-Tabs mit Unterstrich gewählt: ohne Rahmen/Buttonfläche, aktive Akzentlinie; mobil kompakte Bereichsauswahl statt der von Mike beanstandeten zweizeiligen Tabs.

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
