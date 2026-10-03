# T-91 · Public Origin normalisieren und Hinweis zum Einrichtungscode

**Abgeschlossen am 2026-10-03** (Mike: „T-91 ist aus meiner Sicht auch ok“). Technisch freigegeben in Runde 3 (`243f5d2`), nach `master` gemergt und zu `origin` gepusht; Vorlagenbeschreibung im Templates-Repo committet und gepusht.

**Warum dieses Ticket:** Die Konto-API vergleicht den `Origin`-Header des
Browsers zeichengenau mit `STOCKPORTFOLIO_PUBLIC_ORIGIN`. Ein Schrägstrich am
Ende genügte, damit schon die Einrichtung des Admin-Kontos scheiterte. Der
Nutzer sah nur „Die Browseradresse stimmt nicht mit der Serverkonfiguration
überein.“, ohne Hinweis auf die Ursache.

**Beispiel:** Unraid-Vorlage, Feld „Public origin“ =
`https://portfolio.example.com/`. Der Browser sendet
`Origin: https://portfolio.example.com`, die API antwortet 403
`invalid_origin`. Danach wird der Wert auf `https://portfolio.example.com`
zurückgeführt, und die Einrichtung läuft durch. Ein Wert mit Pfad
(`…/app`) beendet den Start mit einer klaren Meldung im Container-Log.

**Stand:** Abgeschlossen. Technische Freigabe in Runde 3 durch
`codex-verifier`, Abnahme durch Mike am 2026-10-03. Docker-Image und
Unraid-Instanz mit dem neuen Stand sind nicht geprüft; das neue Verhalten
wirkt dort erst mit dem nächsten Image.

Kein offener menschlicher Schritt.

**Herkunft:** Mike, 2026-10-03, nach Unraid-Einrichtung: „STOCKPORTFOLIO_PUBLIC_ORIGIN
hatte einen Schrägstrich am Ende - das muss unbeding abgefangen werden“.
Direkt als aktiver Auftrag angelegt.

**Erweiterung (Mike, 2026-10-03):** „Das Fragezeichen beim Einrichtungsdialog
wo denn der Setup-Code herkommt ist zu spezifisch auf die Lokale
Entwicklungsumgebung ausgerichtet. […] Bei Unraid ist das der Log-Ansicht des
Docker-Containers“. Vorschlag mit Liste vorgelegt; Mike: „Liste ist gut,
Entwicklungshinweis raus – bau es ein“. `UxInfoHint` kann nur Fließtext;
Mike hat entschieden: „Jetzt Fließtext, Liste später“ — dafür
ux-foundation [T-21](/Volumes/DevLocal/DevWeb/Production/ux-foundation/_tickets/T-21-infohint-mit-gegliedertem-inhalt.md)
(lokaler Commit `a6084c5`, nicht gepusht).

## Umsetzung und technische Nachweise

| Repo | Time-box | Scope | GH-Issue |
|---|---|---|---|
| cross: StockPortfolio `api/`, Doku; Templates (Vorlage) | klein | API-Start, Doku, Unraid-Vorlage | — |

**Umsetzung:**

- `api/src/publicOrigin.ts` — `normalizePublicOrigin()`: leer → nicht
  gesetzt; sonst über `new URL()` auf `url.origin` zurückgeführt (Schrägstrich
  am Ende entfällt, Schema und Host klein, Standardport entfällt). Abgelehnt
  mit Meldung: keine URL, Schema außer http/https, Zugangsdaten, Pfad, Query,
  Fragment (auch leeres `?`/`#`).
- `api/src/index.ts` — prüft den Wert vor dem Öffnen der Datenbank. Bei
  Fehler nur die Meldung auf stderr, Exit-Code 1, kein Setup-Code und keine
  SQLite-Datei. Bei gültigem Wert loggt der Start `Public origin: <wert>`.
- Die Origin-Prüfung in `api/src/routers/api.ts` bleibt unverändert.
- `frontend/src/i18n/de.ts`, `en.ts` — `auth.setupCodeHelp` nennt die
  Log-Zeile, den Weg unter Unraid (Reiter „Docker“ → Symbol → „Logs“) und
  `docker logs`, dazu den neuen Code nach jedem Neustart. `make dev-up` und
  `overmind connect api` sind entfernt; sie stehen in `README.md`
  (Abschnitt zur lokalen Konto-API).

### Verify

Legende: ✅ live bestätigt · ➖ nur Unit/Review.

| # | Lauf | Handgriff | Nachweis | woher | AI |
|---|:--:|---|---|---|:--:|
| 1 | Unit | <a id="pruefpunkt-1"></a>`api/tests/public-origin.spec.ts` | 25 Tests grün (Runde 3): leer, Schrägstrich, Groß-/Kleinschreibung, Standardport, 13 Ablehnungsfälle mit Meldung (darunter `/.`, `/%2e`, `/a/..`, `/./`, Backslash), acht Werte mit Zugangsdaten oder Token in Query/Fragment ohne Geheimnis in der Meldung, Setup mit `…/`-Konfiguration → 201 | Mike | ➖ |
| 2 | Unit rot | <a id="pruefpunkt-2"></a>`return url.origin` testweise durch `return trimmed` ersetzt | 3 Tests rot (Schrägstrich, Normalisierung, Setup), Exit 1; danach zurückgesetzt. Runde 2: Rohpfadprüfung entfernt → 4 Punktsegment-Fälle rot, Exit 1; Ausblenden bei `@` entfernt → 4 Zugangsdaten-Fälle rot, Exit 1. Runde 3: nur `@`-Ausblendung wiederhergestellt → 4 Query-/Fragment-Fälle rot, Exit 1; danach zurückgesetzt (`cmp` gleich), 53/53 grün | Pflicht Gegenprobe | ➖ |
| 3 | lokal | <a id="pruefpunkt-3"></a>`node dist/index.js` mit `…/app` | Ausgabe (Fassung Runde 3, ohne Rohwert) `STOCKPORTFOLIO_PUBLIC_ORIGIN is invalid: must not contain a path. …`, `exit=1`, Datenordner leer | Mike | ✅ |
| 4 | lokal | <a id="pruefpunkt-4"></a>`node dist/index.js` mit `http://127.0.0.1:18391/` | Log `Public origin: http://127.0.0.1:18391`; `POST /api/setup` mit fremdem Origin 403, mit passendem Origin 401 `invalid_credentials` (Origin-Prüfung bestanden) | Mike | ✅ |
| 5 | Pflicht | <a id="pruefpunkt-5"></a>`make test`, Lint, Typecheck | Runde 3: `make test` Exit 0 (Frontend 84/868, API 7/53); Lint und Typecheck für Frontend und API je Exit 0; `git diff --check` sauber | AGENTS.md | ➖ |
| 7 | Pflicht | <a id="pruefpunkt-7"></a>Hilfetext Einrichtungscode | Texte in DE und EN ersetzt; danach `make test` Exit 0 (84/868, 7/41), Frontend-Lint und -Typecheck Exit 0. Die spätere Sichtprüfung steht in Nr. 8. | Mike | ➖ |
| 8 | Browser sichtbar | <a id="pruefpunkt-8"></a>Teststack frisch ohne `--demo-accounts`, dann `npm --prefix frontend run check:setup-dialog` | Info-Fenster per Mauszeiger geöffnet, sichtbarer Text in DE und EN enthält Log-Zeile, Unraid-Weg, `docker logs stockportfolio`, neuen Code nach Neustart, kein `make dev-up`/`overmind`/`Ctrl-B`; Exit 0. Gegenproben: alter DE-Text und geänderter EN-Satz → 7 Fehler, Exit 1; Admin vorher per API angelegt → „Einrichtungsdialog nicht sichtbar“ in DE und EN, Exit 1. Stack danach gestoppt, Ports frei | Mike („Browser-Test?“, nur Info-Fenster) | ✅ |
| 6 | Doku | <a id="pruefpunkt-6"></a>Docker-Hub-Vorschau | `dockerhub-readme.sh --preview --ref master` Exit 0, 13.939 Byte (< 25.000) | AGENTS.md | ➖ |

Docker-Image und Unraid-Instanz sind nicht geprüft; das Verhalten liegt
ausschließlich in `node dist/index.js`, das der Container unverändert startet.

### Akzeptanzkriterien

- [x] Ein Schrägstrich am Ende von `STOCKPORTFOLIO_PUBLIC_ORIGIN` führt nicht
      mehr zu `invalid_origin`.
- [x] Werte, die sich nicht auf einen Origin zurückführen lassen, beenden den
      Start mit verständlicher Meldung, bevor ein Setup-Code entsteht.
- [x] `README.md`, `docker/README.md`, `unraid/README.md` und die
      Unraid-Vorlage beschreiben das Format übereinstimmend.
- [x] Der Hinweis am Einrichtungscode erklärt Unraid und Docker und nennt
      keine Entwicklungsbefehle mehr (DE und EN).
- [x] Pflichtprüfungen grün.

### Side-Effects

Ein bisher hingenommener, aber ohnehin wirkungsloser Wert mit Pfad (jede
schreibende Anfrage scheiterte damit) beendet jetzt den Start. Keine
Datenänderung.

Die Vorlagenänderung liegt uncommittet im Templates-Repo
(`/Volumes/DevLocal/DevUnraid/Production/Templates`, `master`); Commit und
Push dort folgen mit dem Abschluss.

**Doku-Abgleich:**

- `README.md` (Abschnitt zu Reverse Proxy/HTTPS) und `docker/README.md`
  (Konfigurationstext und Variablentabelle): gleicher Hinweis zu Format,
  Schrägstrich, Startabbruch und der Fehlermeldung im Browser.
- `unraid/README.md` (Tabelle Configuration, „Public origin“): dasselbe in
  Unraid-Begriffen (Feld, Container-Log).
- Vorlage `stockportfolio.xml`: Feldbeschreibung um „No path; a trailing slash
  is ignored.“ ergänzt; `xmllint` sauber.
- `.env.example`, `docs/`, App-Texte: kein Vorkommen der Variable, keine
  Änderung. Die Fehlermeldung `invalid_origin` bleibt; sie tritt jetzt nur noch
  bei einer tatsächlich anderen Adresse auf.
- Hinweis Einrichtungscode: `docker/README.md` (`docker logs stockportfolio`)
  und `unraid/README.md` („container log“) sagen bereits dasselbe; `README.md`
  behält den Entwicklungsweg. Keine Änderung nötig.
- Skill `task-verification-workflow`: keine Board-Konvention geändert, keine
  Übernahme nötig.

## Review-Verlauf (neueste Runde zuerst)

### Verifier-Prüfung Runde 3 · codex-verifier · 2026-10-03

**Technisch freigegeben:** Prüffassung `243f5d2` auf
`t-91-public-origin-normalisieren`; der folgende Commit `6e1b707` ändert nur
STATUS. Die Fehlermeldung in `api/src/publicOrigin.ts` besteht jetzt nur aus
festem Text und dem Fehlergrund; sie übernimmt keinen Rohwert. Eigene
Gegenproben mit synthetischem Geheimnis in Query, Fragment, URL-Zugangsdaten
und Pfad brachen jeweils mit passendem Grund ohne Geheimnis in der Meldung ab.
Ein gültiger Origin mit abschließendem `/` blieb gültig.

**Prüfungen:** `make test` Exit 0 (Frontend 84/868, API 7/53); Frontend- und
API-Lint sowie beide Typechecks je Exit 0. Der sichtbare DE/EN-Browserlauf
aus Runde 2 bleibt für unveränderten Frontend-Code maßgeblich. Die
uncommittete XML-Vorlagenänderung wurde nochmals gelesen; `xmllint --noout`
lief mit Exit 0. Die roten Gegenproben und die Live-API-Starts aus Runde 3
sind Coder-Belege, nicht meine eigenen Läufe. Ein Docker-Image und eine
Unraid-Instanz wurden von mir nicht geprüft.

**Doku-Abgleich:** `README.md`, `docker/README.md`, `unraid/README.md` und
die XML-Vorlage stimmen zur Pfad- und Schrägstrichregel überein. Die
Fehlermeldung wird in den Anleitungen nicht wörtlich zitiert; für das
Entfernen des Rohwerts ist dort keine Änderung nötig. `AGENTS.md` führt den
sichtbaren Prüfablauf auf. Die Verify-Matrix ist auf den letzten Teststand
abgeglichen. Lessons SP-R-02 und SP-R-04 angewendet; die Nacharbeit schließt
denselben Einzelfall ohne neue Lesson. Mikes Abnahme und die Veröffentlichung
der Vorlage bleiben getrennte Schritte des Coders.

### Übergabe Runde 3 · claude-coder · 2026-10-03

Nacharbeit zum Befund der Verifier-Prüfung Runde 2. Prüffassung siehe STATUS
`handoff_commit`.

- **Korrektur:** `normalizePublicOrigin()` gibt den Rohwert in keiner
  Meldung mehr aus, unabhängig vom Grund. Die Meldung nennt Grund und
  Beispieladresse: `STOCKPORTFOLIO_PUBLIC_ORIGIN is invalid: <Grund>. Expected …`.
- **Tests:** Geheimnisfälle um `?token=…`, `/?token=…`, `/#access_token=…`
  und `/app?token=…` erweitert (je Grund und kein `synthetic-password` in der
  Meldung); die `@`-Fälle bleiben. 25 Tests in der Datei, API 7/53.
- **Gegenprobe:** Ausblendung testweise auf das Verhalten aus Runde 2
  zurückgesetzt (nur bei `@`): die vier neuen Query-/Fragment-Fälle rot,
  Exit 1; danach zurückgesetzt (`cmp` gleich), 53/53 grün.
- **Live:** gebaute API mit `https://portfolio.example.com?token=synthetic-secret`
  und `…/#access_token=synthetic-secret` → je Exit 1, Query- bzw.
  Fragment-Meldung, 0 Treffer für `synthetic-secret`, Datenordner leer.
- **Pflicht:** `make test` Exit 0 (84/868, 7/53), Lint und Typecheck für
  Frontend und API je Exit 0, `git diff --check` sauber.
- **Doku-Abgleich:** Die Anleitungen zitieren die Meldung nicht; keine
  Änderung nötig. Browserprüfung aus Runde 2 unverändert gültig (kein
  Frontend-Code geändert).
- **Lessons-Einordnung:** Rest desselben Befunds, keine neue Lesson.

### Verifier-Prüfung Runde 2 · codex-verifier · 2026-10-03

**Prüffassung:** `0fb0bc1` auf dem Ticketbranch, mit anschließendem
Board-Commit `dfe40aa`. Ich habe den Diff seit Runde 1, die neuen Tests, das
sichtbare Prüfskript und die betroffenen Regeln gelesen. `npm --prefix api
test` lief mit Exit 0 (7 Dateien, 49 Tests). Die Punktsegment-Gegenprobe mit
`/.`, `/%2e` und `/a/..` bricht jetzt ab; `/` bleibt gültig. Der sichtbare
Lauf `npm --prefix frontend run check:setup-dialog` meldete `OK` für DE und
EN und endete mit Exit 0. Der eigene Teststack wurde danach gestoppt;
`--stack --status` meldete keine registrierte Instanz. Der erste Browserstart
scheiterte an macOS-Sandboxrechten für Chrome; der Wiederholungslauf außerhalb
der Sandbox bestand. Die roten Gegenproben und die übrigen Pflichtprüfungen
sind Coder-Belege, von mir nicht erneut ausgeführt.

**Befund · Geheimnis im Query oder Fragment (blockierend).** Die Korrektur
blendet den Rohwert nur aus, wenn er ein `@` enthält. Bei
`https://portfolio.example.com?token=synthetic-secret` und
`https://portfolio.example.com/#access_token=synthetic-secret` enthält die
von `normalizePublicOrigin()` erzeugte Fehlermeldung weiterhin
`synthetic-secret`; `api/src/index.ts` schreibt sie nach stderr und damit ins
Container-Log. Das ist derselbe Log-Fehler wie in Runde 1 für eine andere
übliche Stelle eines Zugangswerts. Erwartete Korrektur: Ungültige Rohwerte
nie samt möglichem Geheimnis ausgeben; Grund und Beispiel genügen. Gegenprobe
für Query und Fragment mit synthetischem Token sowie für die bereits
abgedeckte `@`-Form.

**Doku-Abgleich:** Die Pfad-Zusage in `README.md`, `docker/README.md`,
`unraid/README.md` und der XML-Vorlage stimmt nun mit dem Code überein.
`AGENTS.md` nennt den neuen sichtbaren Test; die drei Anleitungen enthalten
den passenden Einrichtungsweg. Keine weitere Dokuänderung für diesen Befund
erforderlich. Die Vorlage bleibt bis zum Abschluss im Templates-Repo
uncommittet. Lessons: SP-R-02 und SP-R-04 bei Prüftiefe und Blockerbewertung
angewendet; ein Rest desselben Befunds, keine neue lokale Lesson.

### Übergabe Runde 2 · claude-coder · 2026-10-03

Nacharbeit zu beiden Befunden aus der Verifier-Prüfung Runde 1. Prüffassung
siehe STATUS `handoff_commit`.

- **Befund 1 · Punktsegmente:** Zusätzlich zu `url.pathname` wird der
  Rohwert hinter Schema und Host geprüft (bis `?`/`#`, Backslash beendet den
  Host wie bei `new URL()`); nur leer oder `/` ist erlaubt. `/.`, `/%2e`,
  `/a/..`, `/./` und `\app` brechen jetzt mit „must not contain a path“ ab;
  `…/` und ohne Pfad liefern weiter denselben Origin.
- **Befund 2 · Zugangsdaten:** Enthält der Wert ein `@`, nennt die Meldung
  ihn nicht (`STOCKPORTFOLIO_PUBLIC_ORIGIN is invalid: …`). Getestet mit
  vier synthetischen Werten, auch mit `/` im Passwort und ohne Schema, die
  vor einer Prüfung auf Zugangsdaten an anderer Stelle scheitern.
- **Live:** gebaute API mit
  `https://user:synthetic-password@portfolio.example.com` → Exit 1, Ausgabe
  ohne `synthetic-password` (0 Treffer); mit `https://portfolio.example.com/.`
  → Exit 1, Pfad-Meldung; Datenordner jeweils leer.
- **Pflicht:** `make test` Exit 0 (84/868, 7/49), Lint und Typecheck für
  Frontend und API je Exit 0, `git diff --check` sauber.
- **Gegenproben:** siehe Verify Nr. 2.
- **Doku-Abgleich:** Die Zusage „a path stops the start“ in `README.md`,
  `docker/README.md` und `unraid/README.md` stimmt jetzt; keine Textänderung
  nötig.
- **Browserprüfung (Mike: „Browser-Test?“, präzisiert: „im Browser soll nur
  das Info-Fenster beim Einrichtungsdialog getestet werden“):** neues
  Prüfskript `frontend/scripts/setup-dialog-check.mjs`
  (`check:setup-dialog`), in `AGENTS.md` › Browserprüfung eingetragen.
  Belege unter Verify Nr. 8. Der Teststack bleibt unverändert.
- **Lessons-Einordnung:** Einzelfall, wie vom Verifier eingeordnet.

### Verifier-Prüfung Runde 1 · codex-verifier · 2026-10-03

**Prüffassung:** `c2dc9b1` auf `t-91-public-origin-normalisieren`; der spätere
Commit `eb0d738` ändert nur STATUS. Ich habe API-Implementierung und Test,
Origin-Vergleich, DE/EN-Hinweis, beide READMEs, Unraid-Anleitung und die
uncommittete XML-Vorlage gelesen. `npm --prefix api test --
tests/public-origin.spec.ts` lief mit Exit 0 (7 Dateien, 41 Tests, darunter
13 zu T-91); `xmllint --noout` für die Vorlage lief mit Exit 0. Die
Randfälle unten habe ich mit `normalizePublicOrigin()` selbst ausgeführt.
Kein Browser-, Container- oder Unraid-Lauf durch den Verifier; die lokalen
Startbelege und die übrigen Pflichtprüfungen stammen vom Coder.

**Befund 1 · Pfade werden teils akzeptiert (blockierend).**
`new URL()` löst Punktsegmente vor der Prüfung von `url.pathname` auf.
`https://portfolio.example.com/.`, `…/%2e` und `…/a/..` liefern daher
`https://portfolio.example.com`, statt wie im Ticket und in allen drei
Anleitungen beschrieben mit einer Pfad-Meldung abzubrechen. Gegenprobe:
diese Rohwerte ablehnen, während `/` und eine URL ohne Pfad weiterhin denselben
Origin liefern. Die Doku-Zusage „a path stops the start“ ist derzeit falsch.

**Befund 2 · Zugangsdaten erscheinen im Container-Log (blockierend).**
`invalid()` in `api/src/publicOrigin.ts` setzt den vollständigen Rohwert in
die Fehlermeldung. Für den synthetischen Wert
`https://user:synthetic-password@portfolio.example.com` enthält die Ausgabe
`synthetic-password`; `api/src/index.ts` schreibt diese Meldung nach stderr.
Bei einem versehentlich so konfigurierten Wert würde dessen Passwort im
Container-Log stehen. Fehlermeldung ohne Zugangsdaten erzeugen und prüfen,
dass der synthetische Wert dort nicht erscheint.

**Weitere Prüfung:** Der Setup-Test belegt den Schrägstrichfall; die
Startprüfung liegt im Quelltext vor dem Öffnen der SQLite-Datenbank. Die
DE/EN-Hinweise nennen Unraid-Logs und `docker logs`; die Entwicklungsbefehle
stehen weiter im Projekt-README. Das XML ist syntaktisch gültig. Die
Unraid-Vorlage bleibt im Templates-Repo uncommittet und ist daher noch kein
veröffentlichter Stand.

**Lessons-Einordnung:** SP-R-02 (Prüftiefe benennen) und SP-R-04
(potenziellen Fehler blockierend zurückgeben) angewendet. Die beiden
konkreten Randfälle dieses Tickets erfüllen allein keine Aufnahmebedingung
für eine neue Lesson. Keine Board-Konvention geändert; Abgleich mit
`2026-09-28-activity-local` und den lokalen Abweichungen ohne neue Übernahme.

### Übergabe Runde 1 · claude-coder · 2026-10-03

Prüffassung siehe STATUS `handoff_commit` auf `t-91-public-origin-normalisieren`
(vor Prüfbeginn um den Hinweis zum Einrichtungscode erweitert). Belege oben
unter Verify. Zu prüfen: Vollständigkeit der Ablehnungsfälle, Übereinstimmung
der drei Anleitungen und der Vorlage, Startabbruch ohne Seiteneffekte im
Datenordner, Wortlaut des Hinweises in DE und EN.
