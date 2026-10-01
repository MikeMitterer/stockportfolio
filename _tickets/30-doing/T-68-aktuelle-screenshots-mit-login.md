# T-68 · Aktuelle Screenshots, dazu ein Bild vom Login-Dialog

**Warum dieses Ticket:** Das Dashboard-Bild in README, Docker-Hub-Beschreibung
und Unraid-Vorlage ist veraltet. Es zeigt Version 0.2.0, die alte
Kennzahlzeile und ein „Buy“-Badge, das es nach T-66 nicht mehr gibt. Den
Login-Dialog mit Hinweis und Pflicht-Checkbox (T-64) zeigt bisher kein Bild.

**Beispiel:** Wer StockPortfolio über Docker Hub oder Unraid findet, sieht
heute Badges mit „Buy“ und keinen Login, obwohl die App beides anders zeigt.

**Stand:** Runde 2 (`efc290f`) durch `codex-verifier` technisch freigegeben;
Mikes Bildurteil und der Ticketabschluss stehen aus. Branch
`t-68-aktuelle-screenshots`
(Mike, 2026-10-01: „Dann T-68“). Mike hat ergänzt: „Bei T-68 - mach auch einen
Screenshot vom Login-Dialog und von der Benutzerverwaltung“. Ein Hinweis
„keine Anlageberatung“ kommt nicht in die Texte (Mike, 2026-10-01).

## Für dich

| Frage | Prüfpunkt # | Handgriff | Dein Urteil | Human |
|---|---|---|---|---|
| A · Bilder | [1](#pruefpunkt-1) | `docs/images/` und die Vorschau der READMEs ansehen | Zeigen die Bilder den aktuellen Stand und sind sie für das Listing geeignet? | |

## Umfang

1. `docs/images/dashboard.png` neu aufnehmen: aktueller Stand nach T-66
   (Symbol-Badges, Fragezeichen am Status, Kennzahlzeile), **englische
   Oberfläche**, synthetisches Beispiel-Depot, keine echten Daten.
2. Neu `docs/images/login.png`: Login-Dialog in englischer Oberfläche mit
   Hinweis und Checkbox, Desktop-Layout.
3. Neu `docs/images/user-admin.png`: Benutzerverwaltung (Admin) mit
   synthetischen Testkonten, englische Oberfläche (Mike, 2026-10-01).
4. Verweise: README und `docker/README.md` zeigen das Login-Bild an passender
   Stelle; die zentrale Unraid-Vorlage
   (`/Volumes/DevLocal/DevUnraid/Production/Templates/templates/stockportfolio.xml`)
   erhält ein zweites `<Screenshot>`.
5. `drilldown.png`, `rebalancing.png` und `settings-calculation.png` liegen in
   `docs/images/`, werden aber nirgends verwendet. Entweder aktualisieren und
   einbinden oder entfernen (SP-CX-07); die Wahl im Ticket begründen.
6. Theme und Bildbreite einheitlich wählen und im Ticket nennen; Aufnahme
   über ein wiederholbares Skript unter `frontend/scripts/` statt von Hand,
   damit spätere Releases die Bilder gleich erzeugen.

**Wirksam erst mit Veröffentlichung:** Docker Hub und Unraid laden die Bilder
über `raw.githubusercontent.com/.../master/...`. Neue Bilder erscheinen dort
erst nach Merge und Push nach `master`; ein Image-Push ist dafür nicht nötig,
die Docker-Hub-Beschreibung wird aber erst beim nächsten README-Upload
aktualisiert. Ein Veröffentlichungsauftrag folgt daraus nicht.

## Verify

| # | Handgriff | Nachweis | AI |
|---|---|---|:--:|
| 1 | <a id="pruefpunkt-1"></a>Bilder ansehen | Aktueller Stand, englische Oberfläche, keine echten Daten | ✅ Coder: alle sechs Bilder angesehen; MangoLila, Beispiel-Depot, Konten `test-admin`/`test-user` |
| 2 | Alle Verweise in README, Docker-README, Unraid-Vorlage prüfen | Pfade existieren; Hub-Vorschau unter 25.000 Bytes | ✅ Coder: 9 Verweise, alle Dateien vorhanden; Vorschau 11.439 Bytes; XML gültig |
| 3 | Unbenutzte Bilder | aktualisiert und eingebunden oder entfernt, begründet | ✅ Mike: „drilldown + settings-calculation updaten“ — neu aufgenommen und im README eingebunden |

Legende: ✅ live bestätigt · ⚠️ mit Einschränkung · ◑ teilweise ·
➖ noch kein Nachweis.

### Doku-Abgleich

`README.md` und `docker/README.md` binden die passenden Bilder ein und stimmen
bei den gemeinsamen Dashboard-, Login- und Kontohinweisen überein.
`unraid/README.md` nennt keine Bilder und bleibt zutreffend. Die
StockPortfolio-Unraid-Vorlage verweist auf vier vorhandene Bildpfade; die
Raw-URLs werden erst nach Veröffentlichung der Bilder auf `master` wirksam.
Die beiden README-Beschreibungen aus Review Runde 1 sind in `efc290f`
berichtigt: Der Detailausschnitt ist ausgenommen, und das Rebalancing-Bild
zeigt einen gedeckten Plan mit zwei übernommenen Vorschlägen.

## Coder-Übergabe · Runde 1 · claude-coder · 2026-10-01

**Prüfstand:** `5821721ecc491561fdbfdd29489da41862e9c158` gegen `72f488e`, Branch `t-68-aktuelle-screenshots`.
Unraid-Templates: `9670339` auf `t-60-stockportfolio-template`, nur
`templates/stockportfolio.xml`.

**Bilder** (`docs/images/`, 1440 × 1000 außer `drilldown.png` als Ausschnitt
der aufgeklappten Position, englisch, Theme MangoLila nach Mikes Vorgabe):
`login.png` (neu), `dashboard.png`, `drilldown.png`, `rebalancing.png`,
`settings-calculation.png`, `user-admin.png` (neu, Mikes Nachtrag). Daten:
eingebautes Beispiel-Depot und die synthetischen Konten des Teststacks.

**Skript:** `frontend/scripts/capture-screenshots.mjs`, Aufruf
`npm --prefix frontend run screenshots -- <dir>/demo-accounts.json` bei
laufendem Teststack (`--stack --run --demo-accounts`); sichtbarer Browser,
`CHROME_PATH` wie beim Live-Sync-Test. Zweimal vollständig gelaufen, danach
Teststack gestoppt.

**Einbindung:** README: Dashboard (Kopf), Einstellungen „Calculation“ (bei
den Auslösern), Detailansicht (Price history), Rebalancing (Simulation),
Login und Benutzerverwaltung (Where the data lives). `docker/README.md`:
Dashboard, Login (beim Login-Hinweis), Benutzerverwaltung (Data and backups).
Unraid-Vorlage: zusätzlich Rebalancing, Login, Benutzerverwaltung. Die
Vorlagenänderung liegt wie die übrigen StockPortfolio-Änderungen seit T-60 auf
`t-60-stockportfolio-template` und wird erst mit dem nächsten Image-Release
veröffentlicht (Unraid-Reihenfolge: Image vor Vorlage).

**Doku-Abgleich:** `README.md` und `docker/README.md` gemeinsam geprüft: die
Bildunterschrift zum Dashboard ist wortgleich; Login-Hinweis („tick … not
stored“) in beiden gleichbedeutend; die Benutzerverwaltung steht in beiden beim
Kontomodell. Detail-, Rebalancing- und Einstellungsbild nur im Projekt-README,
weil die Container-Anleitung Funktionen nicht im Einzelnen beschreibt. Das
README beschreibt außerdem das Aufnahmeskript beim Live-Sync-Test.
`unraid/README.md` nennt keine Bilder; unverändert. Wirksam werden die Bilder
in Docker Hub und Unraid erst nach Push (Raw-URLs auf `master`) bzw. dem
nächsten README-Upload.

**Belege:** `make test` 848 Frontend- und 20 API-Tests grün; Lint und
Typecheck für `frontend` und `api` ohne Befund (zwei `no-undef` im Skript
behoben). Hinweis am Rand: Die Eingabefelder zeigen Naive UIs Platzhalter
„Please Input“; das ist bestehendes Verhalten, nicht Teil dieses Tickets.

**Lessons:** SP-CX-07 angewendet (unbenutzte Bilder entschieden: nach Mikes
Vorgabe aktualisiert und eingebunden). Keine neue Lesson.

## Unabhängige Prüfung · Runde 1 · `codex-verifier` · 2026-10-01

**Prüffassungen:** StockPortfolio `5821721ecc491561fdbfdd29489da41862e9c158`
gegen `72f488e`, Unraid-Templates `96703391dd6ceee9e00fcdfd8125f2725b6dec66`
nur für `templates/stockportfolio.xml`. Bis zum Review-HEAD `60152c2`
keine spätere Änderung an Bildern, Skript, READMEs oder Produktcode.
**Urteil: `changes_requested` für die README-Beschreibungen.** Keine
menschliche Abnahme oder Freigabe anderer Template-Dateien.

**Bilder und Verweise:** Alle sechs PNGs visuell geprüft: englische
Oberfläche, MangoLila, Beispiel-Depot und synthetische Konten; Dashboard
zeigt Symbol-Badges und den aktuellen Status. Login-Hinweis und Checkbox
sowie Benutzerverwaltung sind sichtbar. Fünf Bilder sind 1440 × 1000 Pixel,
`drilldown.png` ist ein Ausschnitt mit 1334 × 324 Pixeln. Die sechs README-,
drei Docker-README- und vier XML-Bildverweise zeigen auf vorhandene Dateien.
Das Aufnahmeskript nutzt Demo-Konten und einen sichtbaren Browser; ich habe
es gelesen, syntaktisch geprüft und keinen eigenen Browserlauf gestartet.

**Zu korrigieren:** Im Projekt-README behauptet der Absatz zum
Aufnahmeskript, es speichere alle sechs Bilder mit 1440 × 1000 Pixeln. Das
Detailbild wird vom Skript als Ausschnitt aufgenommen und ist 1334 × 324
Pixel groß. Die Bildunterschrift „Rebalancing simulation“ steht außerdem
über einem Bild mit „Nothing planned yet“ und leeren Buy-/Sell-Spalten; es
zeigt die Rebalancing-Ansicht, aber keine geplante Simulation. Bitte die
beiden README-Aussagen an die tatsächlichen Bilder anpassen oder ein
passendes Simulationsbild aufnehmen. Die Bilder selbst müssen dafür nicht
erneut erzeugt werden, wenn die Texte berichtigt werden.

**Eigene Nachweise:** `node --check` für das Skript und `xmllint --noout`
für die StockPortfolio-Vorlage erfolgreich; `git diff --check` ohne Befund.
Die Docker-Hub-Vorschau konvertiert die drei Bildpfade korrekt und misst
11.439 UTF-8-Bytes (Grenze 25.000). Die anderen Vorlagendateien und eine
veröffentlichte Hub-/Unraid-Ansicht wurden nicht geprüft. Die
Lessons-Einordnung bleibt beim Observer; dies sind zwei konkrete
Textfehler, keine neue allgemeine Regel.

## Coder-Übergabe · Runde 2 · claude-coder · 2026-10-01

**Prüfstand:** `efc290f4e25c0b5852261f6bd613012a6b55c748` gegen `2a5e0bb`, Branch `t-68-aktuelle-screenshots`;
enthält davor T-71 (`509881e`, eigenes Ticket). Templates unverändert
`9670339`.

**Befund Bildgröße:** bestätigt. Das README nennt jetzt 1440 × 1000 für ganze
Seiten und `drilldown.png` als Ausschnitt der aufgeklappten Position; der
Skriptkopf sagt dasselbe.

**Befund Simulation:** statt den Text abzuschwächen, nimmt das Skript jetzt
eine echte Simulation auf: Es übernimmt die Delta-Vorschläge für `VGWL.DE`
(−114) und `IUSN.DE` (+373). Der Plan ist gedeckt („€10,883 left over“), ohne
Warnhinweis über dem Bild. Ein erster Versuch mit `IS3M.DE` war nicht gedeckt
und legte eine Warnung über die Tabelle; verworfen. Die Bildunterschrift im
README beschreibt die zwei übernommenen Vorschläge.

**Neu aufgenommen:** alle sechs Bilder (Teststack mit Demo-Konten, danach
gestoppt); sie zeigen die Felder ohne Standard-Platzhalter aus T-71.

**Belege:** `make test` 852 Frontend- und 20 API-Tests grün; Lint und
Typecheck ohne Befund; Docker-Hub-Vorschau 11.439 Bytes.

**Doku-Abgleich:** nur `README.md` geändert (Skriptabsatz, Bildunterschrift
Rebalancing); `docker/README.md` enthält beide Aussagen nicht und bleibt.

## Unabhängige Prüfung · Runde 2 · `codex-verifier` · 2026-10-01

**Prüffassung:** `efc290f4e25c0b5852261f6bd613012a6b55c748` gegen
`2a5e0bb`; darin auch T-71 aus `509881e` (separates Review im T-71-Ticket).
Unraid-Templates bleiben für StockPortfolio auf `9670339`, wie in Runde 1
geprüft. Bis zum Review-HEAD `84580e9` keine spätere Änderung an Bildern,
Skript, READMEs oder Produktcode. **Urteil: technisch `approved` für T-68.**
Mikes Bildurteil und der Ticketabschluss bleiben offen.

**Gegenprobe zu Runde 1:** Das Projekt-README beschreibt 1440 × 1000 Pixel
für ganze Seiten und nennt `drilldown.png` ausdrücklich als Ausschnitt; die
Datei ist weiterhin 1334 × 324 Pixel groß. Das neue Rebalancing-Bild zeigt
die zwei im README genannten Delta-Vorschläge mit −114 und +373 Einheiten,
Werten und einem verbleibenden Betrag von 10.883 Euro. Es ist damit eine
tatsächliche Simulation. Dashboard, Login und Benutzerverwaltung wurden
ebenfalls neu aufgenommen; die Bilder zeigen weiterhin das englische
Beispiel-Depot beziehungsweise synthetische Testkonten. Die Felder ohne
Standard-Platzhalter gehören zu T-71.

**Eigene Nachweise:** Alle geänderten Bilder visuell geprüft, die Bildmaße
erneut abgeglichen, `node --check` für das Aufnahmeskript und
`xmllint --noout` für die StockPortfolio-Vorlage erfolgreich;
`git diff --check` ohne Befund. `docker/README.md` und die Vorlagen-XML sind
seit Runde 1 unverändert; die damals selbst erzeugte Hub-Vorschau hatte
11.439 UTF-8-Bytes und korrekte Bildpfade. Den Coder-Browserlauf habe ich
nicht wiederholt. Raw-URLs auf `master` und ein Hub-/Unraid-Upload sind noch
kein Nachweis einer veröffentlichten neuen Bildfassung.

**Doku-Abgleich:** Die gemeinsame Dashboard-Unterschrift in `README.md` und
`docker/README.md` stimmt weiter überein. Login- und Kontohinweise sind
inhaltlich gleich; die neuen Angaben zu Bildmaßen und Rebalancing stehen nur
im Projekt-README, wo das Skript und die Funktion erklärt werden.
`unraid/README.md` benötigt keine Änderung. Die Lessons-Einordnung der
beiden Textbefunde aus Runde 1 bleibt beim Observer; kein neuer Befund.
