# T-46 · Detailtabs und Felder kompakter

**Stand:** Mike hat die Anpassungen am 2026-09-26 während T-45 beauftragt.
T-46 ist nach der technischen Freigabe von T-47 umgesetzt und durch Codex selbst geprüft.
Unabhängige Prüfung durch Claude folgt.

## Für dich

Die Detailansicht beginnt mit „Kursverlauf“. Tabs für weitere Informationen
erscheinen nur, wenn sie Inhalte anbieten. Die Informationsfelder brauchen
weniger Platz zwischen Rand, Bezeichnung, Wert und Quellenangabe.

## Gewünschtes Verhalten

- Kursverlauf steht zuerst und ist beim Öffnen ausgewählt.
- Leere Informationsbereiche erzeugen keinen Tab. Vorhandene Werte einschließlich
  0 und Nein bleiben sichtbar. Lade- und Fehlerzustände dürfen nicht unerreichbar werden.
- Informationen und Zusatzinformationen erhalten kompaktere Innenabstände und
  Zeilenabstände; Desktop und Mobile bleiben lesbar und umbrechbar.
- StockInfo bleibt Datenquelle, keine neue Bearbeitung seiner Angaben.

## Verify

| Handgriff | Erwartung | AI |
|---|---|:--:|
| Wertpapier öffnen | Kursverlauf zuerst und aktiv | ✅ |
| Position mit/ohne Zusatzwerte öffnen | Nur tatsächlich verfügbare Informations-Tabs; 0/Nein bleiben erhalten | ✅ |
| Desktop und Mobile im Browser | Kompakte Felder, kein Überlauf oder abgeschnittener Inhalt | ✅ |
| Tests, Lint, Typecheck | Erfolgreich; Doku-Abgleich dokumentiert | ✅ |

## Auflösung

Fassung `573d15b` technisch freigegeben (Runde 1, `claude`). Mikes
Abschlussentscheidung bleibt offen und wird getrennt dokumentiert.
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
