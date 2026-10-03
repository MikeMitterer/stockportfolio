# T-91 · Public Origin normalisieren und Hinweis zum Einrichtungscode

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

**Stand:** Verifier hat Runde 1 mit zwei Befunden zur Nacharbeit zurückgegeben.

Kein menschlicher Schritt bis zur technischen Freigabe. Danach: Abnahme durch
Mike, am besten auf Unraid mit dem bisherigen Wert samt Schrägstrich.

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
| 1 | Unit | <a id="pruefpunkt-1"></a>`api/tests/public-origin.spec.ts` | 13 Tests grün: leer, Schrägstrich, Groß-/Kleinschreibung, Standardport, neun Ablehnungsfälle mit Meldung, Setup mit `…/`-Konfiguration → 201 | Mike | ➖ |
| 2 | Unit rot | <a id="pruefpunkt-2"></a>`return url.origin` testweise durch `return trimmed` ersetzt | 3 Tests rot (Schrägstrich, Normalisierung, Setup), Exit 1; danach zurückgesetzt, 41/41 grün | Pflicht Gegenprobe | ➖ |
| 3 | lokal | <a id="pruefpunkt-3"></a>`node dist/index.js` mit `…/app` | Ausgabe `STOCKPORTFOLIO_PUBLIC_ORIGIN "https://portfolio.example.com/app" is invalid: must not contain a path. …`, `exit=1`, Datenordner leer | Mike | ✅ |
| 4 | lokal | <a id="pruefpunkt-4"></a>`node dist/index.js` mit `http://127.0.0.1:18391/` | Log `Public origin: http://127.0.0.1:18391`; `POST /api/setup` mit fremdem Origin 403, mit passendem Origin 401 `invalid_credentials` (Origin-Prüfung bestanden) | Mike | ✅ |
| 5 | Pflicht | <a id="pruefpunkt-5"></a>`make test`, Lint, Typecheck | `make test` Exit 0 (Frontend 84/868, API 7/41); Lint und Typecheck für Frontend und API je Exit 0; `git diff --check` sauber | AGENTS.md | ➖ |
| 7 | Pflicht | <a id="pruefpunkt-7"></a>Hilfetext Einrichtungscode | Texte in DE und EN ersetzt; danach `make test` Exit 0 (84/868, 7/41), Frontend-Lint und -Typecheck Exit 0. Keine Sichtprüfung im Browser: der Tooltip rendert den Text unverändert über `UxInfoHint` | Mike | ➖ |
| 6 | Doku | <a id="pruefpunkt-6"></a>Docker-Hub-Vorschau | `dockerhub-readme.sh --preview --ref master` Exit 0, 13.939 Byte (< 25.000) | AGENTS.md | ➖ |

Docker-Image und Unraid-Instanz sind nicht geprüft; das Verhalten liegt
ausschließlich in `node dist/index.js`, das der Container unverändert startet.

### Akzeptanzkriterien

- [x] Ein Schrägstrich am Ende von `STOCKPORTFOLIO_PUBLIC_ORIGIN` führt nicht
      mehr zu `invalid_origin`.
- [x] Werte, die sich nicht auf einen Origin zurückführen lassen, beenden den
      Start mit verständlicher Meldung, bevor ein Setup-Code entsteht.
- [ ] `README.md`, `docker/README.md`, `unraid/README.md` und die
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
