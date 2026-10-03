# T-82 · StockInfo über den eigenen Server abfragen

StockPortfolio soll StockInfo nicht mehr direkt aus dem Browser aufrufen,
sondern über seinen eigenen Server. Der Browser spricht dann nur noch mit
StockPortfolio. CORS bei StockInfo, die Erreichbarkeit vom Browser und die
HTTPS-Vorgabe für die API entfallen.

**Beispiel:** Auf Unraid läuft StockPortfolio unter `http://tower:8088`,
StockInfo unter `http://tower:8000`. Heute muss StockInfo
`CORS_ORIGINS=["http://tower:8088"]` gesetzt haben, sonst blockiert der
Browser die Antworten. Nach dem Umbau genügt `STOCKINFO_API_URL` bei
StockPortfolio, auch mit einem Docker-internen Namen wie
`http://stockinfo:8000`.

**Stand:** Angelegt am 2026-10-03 aus StockInfo nach der Durchsicht der
Unraid-Templates (Mike: „Ich dachte das läuft umgekehrt - CORS wird bei
StockPortfolio eingetragen“, danach „leg das Ticket in StockPortfolio im
Backlog an“). Am 2026-10-03 eingeplant (Mike: „Nach T-86 ist T-82 dran“) und
nach `20-ready/` verschoben. Am 2026-10-03 nach dem Abschluss von T-86 auf
Branch `t-82-stockinfo-ueber-eigenen-server` aktiviert. Für Mike ist
kein Handgriff nötig.

## Ausgangslage (Claude, 2026-10-03, am Code geprüft)

- `frontend/src/api/client.ts` ruft StockInfo mit der Basisadresse aus der
  Laufzeitkonfiguration (`window.__STOCKPORTFOLIO_CONFIG__.apiUrl`) direkt
  auf. `docker/entrypoint.sh` schreibt dafür `STOCKINFO_API_URL` in die
  Browser-Konfiguration; `docker/Dockerfile` kennt zusätzlich das
  Build-Argument `VITE_STOCKINFO_API_URL`.
- Genutzte StockInfo-Pfade: `GET /instruments`, `/fields`,
  `/instrument-types`, `/fx`, `/quote/{isin}`, `/quote?symbol=`,
  `/quote/{isin}/daily`, `/quote/by-symbol/{symbol}/daily`,
  `/quote/{isin}/history`, `/health`; `POST /refresh/{isin}` und
  `/refresh/by-symbol/{symbol}`.
- Die Live-Updates (`/api/data/events`) kommen vom eigenen Server und sind
  nicht betroffen.
- Der Server (Hono, `api/src/routers/api.ts`) liefert bereits `/api/*` und die
  Web-App aus derselben Herkunft. Vite leitet `/api` in der Entwicklung an
  `127.0.0.1:8080` weiter.

## Umfang

1. **Weiterleitung** `/api/stockinfo/*` im Server an `STOCKINFO_API_URL`:
   nur die oben genannten Pfade und Methoden, Abfrageparameter und
   Statuscodes unverändert, Zeitlimit, `502` bei nicht erreichbarem
   StockInfo. Nur für angemeldete Nutzer; Cookies und Sitzungsdaten gehen
   nicht an StockInfo.
2. **Frontend:** Basisadresse `/api/stockinfo`. `apiUrlSource` und die
   Unterscheidung Laufzeit/Build entfallen. Fehlertexte zu CORS, HTTPS und
   „vom Browser erreichbar“ in `de.ts` und `en.ts` anpassen.
3. **Container:** `STOCKINFO_API_URL` liest nur noch der Server; der
   Entrypoint schreibt sie nicht mehr in die Browser-Konfiguration.
   `VITE_STOCKINFO_API_URL` entfällt.
4. **Doku und Template:** `README.md`, `docker/README.md`,
   `unraid/README.md` und `templates/stockportfolio.xml` im Templates-Repo:
   „reachable from the browser“ wird „reachable from the container“;
   CORS- und HTTPS-Hinweise zur API entfallen; Docker-interne Namen erlaubt.
5. **StockInfo nachziehen** (eigenes Board): Die Absätze „Using
   StockPortfolio?“ zu `CORS_ORIGINS` in StockInfos Anleitungen und das
   Template-Feld „CORS origins“ kürzen oder entfernen. StockInfo T-100
   („CORS_ORIGINS robust lesen“) wird dann voraussichtlich überflüssig.

| Repo | Time-box | Scope | GH-Issue |
|---|---|---|---|
| StockPortfolio | 1 Tag | Server, Frontend, Container, Tests, Doku | — |
| Unraid-Templates | — | `stockportfolio.xml` Beschreibung | — |

### Verify

Legende: ✅ geprüft (Claude, 2026-10-03, Branch-Stand `b246305`).

| # | Handgriff | Erwarteter Nachweis | AI |
|---|---|---|:--:|
| 1 | Server-Tests mit Ersatz-StockInfo | Erlaubte Pfade werden weitergeleitet, andere abgewiesen; Statuscodes und Parameter unverändert; `502` bei Ausfall; ohne Anmeldung kein Zugriff | ✅ |
| 2 | Frontend-Tests | Client nutzt `/api/stockinfo`; keine Abfrage geht direkt an StockInfo | ✅ |
| 3 | Browserprüfung mit `scripts/stockinfo-test-server.py`, StockInfo **ohne** passendes `CORS_ORIGINS` | Dashboard, Kurse, Verlauf und Aktualisieren funktionieren; Netzwerkansicht zeigt nur Anfragen an StockPortfolio | ✅ |
| 4 | Container mit `STOCKINFO_API_URL` auf einen Docker-internen Namen | Kurse erscheinen | ✅ |
| 5 | `make test`, `make lint`, `make typecheck` | Grün | ✅ |
| 6 | Doku-Abgleich der drei READMEs und des Templates | Keine Aussage mehr zu CORS oder Browser-Erreichbarkeit der API | ✅ |
| 7 | Sichtbare Routenabdeckung mit einem Repo-Skript, gegen Teststack **und** Container | Jede neue Server-Route kommt im Browserlauf vor: `GET /api/stockinfo-target` und jeder freigegebene Pfad unter `/api/stockinfo/*` mit 200; ohne Sitzung 401, außerhalb der Freigabeliste 404; Ausfall als 502 `stockinfo_unreachable` sichtbar gemeldet | ✅ |

### Akzeptanzkriterien

- [x] Der Browser ruft StockInfo nicht mehr direkt auf.
- [x] StockPortfolio funktioniert ohne `CORS_ORIGINS` bei StockInfo.
- [x] Nur die genutzten StockInfo-Pfade sind über die Weiterleitung erreichbar, nur angemeldet.
- [x] Bestehende Installationen funktionieren mit derselben `STOCKINFO_API_URL`, sofern der Container die Adresse auflösen kann.
- [x] Doku-Abgleich in StockPortfolio und Templates; Folgeänderung in StockInfo als dortiges Ticket.
- [x] Die sichtbaren Prüfungen enthalten alle mit T-82 im StockPortfolio-Server
      hinzugefügten StockInfo-Routen (Mike, 2026-10-03: „Bei den visuellen
      Checks - wichtig natürlich dass die neuen API-Routen zu StockInfo in den
      Tests enthalten sind - die wurden bei T-82 ja beim StockPortfolio-Server
      hinzugefügt“). Der Verifier prüft die Abdeckung je Route gegen die
      Freigabeliste in `api/src/stockinfo/proxy.ts`.

### Side-Effects

Eine `STOCKINFO_API_URL`, die nur der Browser auflösen kann (etwa ein
`.local`-Name), muss auf eine vom Container erreichbare Adresse umgestellt
werden. Mit der Weiterleitung kann StockInfo ohne veröffentlichten Port nur
im Docker-Netz laufen. Kein Push, kein Docker-Hub- oder Unraid-Update ohne
eigenen Auftrag.

### Auflösung

**Runde 2 technisch freigegeben (2026-10-03).** Die zwei Befunde aus Runde 1
sind behoben und unabhängig nachgeprüft. Menschlicher Abschluss und
Veröffentlichung stehen aus. Mike hatte T-82 vor dem ersten Review
zurückgeholt („Hol T-82 zurück und ergänze die Prüfungen“); die ältere
Übergabe am Ende gilt nicht mehr.

## Review-Verlauf (neueste Runde zuerst)

### Technische Prüfung Runde 2 · codex-verifier · 2026-10-03

**Prüffassung:** StockPortfolio `9409be1` auf
`t-82-stockinfo-ueber-eigenen-server`; Templates-Commit `a205317` lokal auf
`master`. Rollen, Owner, Branch und Paketversion vor dem Review abgeglichen.
**Urteil: technisch freigegeben (`approved`).** Keine menschliche Abnahme
durch den Verifier.

**Befund 1 behoben:** Die Weiterleitung baut bei 204, 205 und 304 eine
Antwort mit `null` als Rumpf. Dieselbe isolierte Gegenprobe, die in Runde 1
mit `TypeError` und Exit 1 scheiterte, lieferte jetzt HTTP 204 mit Exit 0.
Der neue Servertest prüft alle drei Statuscodes, leeren Rumpf, erlaubte
`cache-control`- und gesperrte interne Kopfzeilen. `make test` endete mit
Exit 0: Frontend 83 Dateien/865 Tests, API 6/28.

**Befund 2 behoben:** `unraid/README.md` und
`Templates/templates/stockportfolio.xml` sagen nicht mehr, der Browser
verbinde sich direkt mit StockInfo. `README.md`, `docker/README.md`,
`unraid/README.md` und die XML-Vorlage beschreiben nun übereinstimmend:
Weiterleitung nur für angemeldete Nutzer, Zugriff auf StockInfos eigene
Adresse gesondert schützen, StockInfo-Adresse vom Container erreichbar,
kein CORS für StockPortfolio nötig. Die betroffenen Abschnitte und der
Templates-Commit wurden unabhängig gelesen. Das Templates-Repository ist
noch vor `origin/master` und wird hier nicht gepusht.

**Weitere Prüfung:** Lint und Typecheck für Frontend und API je Exit 0,
`git diff --check` ohne Befund. Die in Runde 1 unabhängig grünen sichtbaren
Teststack- und Containerläufe umfassen alle 12 freigegebenen Routen,
401/404 sowie den 502-Ausfall. Die Nacharbeit verändert diese Routen und
den Browserablauf nicht; ein weiterer Browserlauf war für die zwei gezielten
Korrekturen nicht erforderlich. Kein Teststack wurde in dieser Runde
gestartet. [SP-R-04](../.agents/lessons/SP-R-04-erkannte-potenzielle-fehler-beheben-scout-rule.md)
ist mit der ausdrücklichen Gegenprobe erfüllt; der Doku-Inventarbefund ist
in den betroffenen Dateien behoben.

**Board-Hinweis:** Die OUTBOX war bei der Übergabe leer und die INBOX
enthielt noch die verarbeitete Rückgabe aus Runde 1. STATUS nannte Rolle,
Owner, Commit und Runde eindeutig; Umfang und Belege standen im Ticket.
Der Verifier hat die alte Nachricht beim Prüfurteil ersetzt. Bei der nächsten
Übergabe bitte die Mailbox wieder nach Workflow füllen und abarbeiten.

### Nacharbeit Runde 1 · claude-coder · 2026-10-03

**Befund 1 behoben** (`724f0ba`): `forwardToStockInfo` baut Antworten mit
204, 205 und 304 mit `null` als Rumpf; Status und erlaubte Kopfzeilen
bleiben. Neuer Servertest „leitet Antworten ohne Rumpf mit Status und
Kopfzeilen weiter“ für alle drei Codes, auch `cache-control` durch und
`x-internal` gesperrt. Rotlauf vor der Korrektur: `204: expected 500 to be
204`; danach 28 von 28.

**Befund 2 behoben** (`12055db`, Templates `a205317`, lokal, kein Push):
Inventar über `README.md`, `docker/README.md`, `unraid/README.md`, `docs/`
und die Vorlage nach „directly“, „browser … StockInfo“, „reachable from“ und
CORS. Stehengeblieben waren genau die beiden genannten Stellen. Alle vier
Texte sagen jetzt gleich: „StockPortfolio forwards StockInfo requests only for
signed-in users, but its login does not protect StockInfo's own address:
anyone who reaches that address can use StockInfo.“ In `README.md` und
`docker/README.md` ersetzt dieser Satz das knappere „that login does not
protect StockInfo“. Gegenlesen der vier Dateien: Zugriff vom Container, kein
CORS, Login schützt StockInfos eigene Adresse nicht — keine widersprechende
Aussage mehr. Hub-Vorschau 12.714 Byte.

**Belege:** `make test` (Frontend 83/865, API 6/28), Lint und Typecheck
`frontend`/`api` Exit 0, `git diff --check` sauber. Sichtbar
`check:stockinfo-proxy` gegen den Teststack: alle Schritte OK, 12 Routen mit
200; Stack danach gestoppt. `docker/browser-check.sh` nicht erneut: Die
Änderung betrifft nur Antworten ohne Rumpf, die der Testdienst nicht liefert;
der Servertest deckt sie ab.

### Technische Prüfung Runde 1 · codex-verifier · 2026-10-03

**Prüffassung:** `81180d0` auf `t-82-stockinfo-ueber-eigenen-server`, mit
STATUS-Übergabe `d836e3c`. Rollen, Owner, Branch und Paketversion
`df699dd1d7583c59030030ad44e3ab896d4660be8d84575662e652f754624da1`
abgeglichen. **Urteil: `changes_requested`.** Kein Produktcode durch den
Verifier geändert.

**Blockierender Befund 1 · gültige Antwort ohne Rumpf bricht die
Weiterleitung.** `api/src/stockinfo/proxy.ts` baut jede Upstream-Antwort als
`new Response(await upstream.arrayBuffer(), { status: upstream.status, ... })`
neu. Bei HTTP 204, 205 oder 304 darf `Response` keinen Rumpf erhalten, auch
keinen leeren `ArrayBuffer`. Unabhängige Gegenprobe mit injiziertem Fetch,
das `new Response(null, { status: 204 })` liefert: `forwardToStockInfo`
wirft `TypeError: Response constructor: Invalid response status code 204`
(Exit 1). Der Proxy liefert damit den zugesagten Status nicht weiter.
Erwartung: Antworten ohne Rumpf mit `null` konstruieren, Status und erlaubte
Header erhalten und den 204-Fall im Servertest ausdrücklich prüfen. Ein
Status ohne Rumpf ist etwa bei einer künftigen Refresh-Antwort plausibel;
der Fehlerpfad bleibt nicht nur wegen der heutigen 200-Antworten offen.

**Blockierender Befund 2 · Installationsanleitungen widersprechen T-82.**
`unraid/README.md` im Abschnitt „Installing through Unraid Apps“ behauptet
weiter: „The browser connects to StockInfo directly“. Die zentrale Vorlage
`/Volumes/DevLocal/DevUnraid/Production/Templates/templates/stockportfolio.xml`
enthält im `Overview` noch „The browser calls StockInfo directly“. Beide
Dateien erklären später zutreffend den Zugriff vom Container und widersprechen
sich damit jeweils selbst. Erwartung: Die beiden alten Sicherheitshinweise
inhaltlich an den Proxy-Weg anpassen und `README.md`, `docker/README.md`,
`unraid/README.md` sowie die Vorlage erneut gegeneinander lesen. Die Vorlage
liegt im separaten Repository; dessen Schreib- und Commitgrenzen gelten.

**Unabhängige grüne Belege:** `make test` Exit 0 (Frontend 83 Dateien/865
Tests, API 6/27); Frontend-/API-Lint und Typecheck je Exit 0, `git diff
--check` ohne Befund. Das vorhandene sichtbare Skript
`check:stockinfo-proxy` gegen den temporären Teststack prüfte alle 12
freigegebenen Routen mit 200, die Abweisungen 401/404 und ausschließlich
Browseranfragen an `127.0.0.1:5175`. `docker/browser-check.sh` bestand gegen
das lokal vorhandene Image beide Fälle: alle 12 Routen mit 200 über
`127.0.0.1:18091` sowie den nicht auflösbaren StockInfo-Namen mit 502,
Dialog und Statusanzeige. Der Teststack wurde gestoppt; temporäre
Kontodaten wurden durch dessen Stop entfernt. Diese Belege decken die
heutigen 200-/502-Pfade ab und widerlegen die beiden Befunde nicht.

**Lessons-Einordnung:** [SP-R-04](../.agents/lessons/SP-R-04-erkannte-potenzielle-fehler-beheben-scout-rule.md)
auf den plausiblen 204-Fehler angewendet; er blockiert die Freigabe.
SI-P-02/12 (vollständige Korrektur braucht ein Inventar) auf die zwei
stehengebliebenen Installationsaussagen angewendet. Beide Texte tragen
denselben alten Sicherheitshinweis; das ist ein einzelner Auslassungsfall,
keine zweite unabhängige Episode für eine neue Lesson. Der Observer kann
die Einordnung beim nächsten Durchlauf ergänzen.

### Übergabe Runde 1, neu · claude-coder · 2026-10-03

Branch
`t-82-stockinfo-ueber-eigenen-server`, Stand `b246305`. Gegenüber der
zurückgeholten Fassung:

- **Freigabeliste nur mit genutzten Pfaden** (`50092ac`): Die Ausgangslage
  nannte `GET /quote/{isin}/history` als genutzt, `getQuoteHistory` hatte aber
  keinen Aufrufer. Route, Methode und Typ `QuotePoint` sind entfernt; der
  Servertest erwartet die Abweisung. Rotlauf: Test zuerst umgestellt → `GET
  /quote/IE00B4L5Y983/history: expected true to be false`; danach grün.
- **`frontend/scripts/stockinfo-proxy-check.mjs`** (`fef5388`, `a8d2f01`,
  npm `check:stockinfo-proxy`): spielt
  `frontend/tests/fixtures/browser/stockinfo-routes.backup.json` ein (ISIN,
  USD-Papiere, NOSI.DE ohne ISIN) und prüft Verlaufslinien, Kursverlauf einer
  Position, „Aktualisieren“, Assets-Übersicht, Einstellungen › Links und
  Statusseite. **Routenabdeckung:** Die Muster liest das Skript aus
  `api/src/stockinfo/proxy.ts`; jedes muss im Lauf mit 200 vorkommen, dazu
  `GET /api/stockinfo-target`. **Abweisungen:** `/history` und `/docs` → 404,
  `/api/stockinfo/health` und `/api/stockinfo-target` ohne Sitzung → 401.
  Mit `--unreachable`: alle Antworten 502 `stockinfo_unreachable`, Dialog
  „Dienst nicht erreichbar“ mit dem Grund vom Server, Statusseite „nicht
  erreichbar“ samt Grund. Immer: keine Browseranfrage an eine fremde
  Herkunft.
- **`docker/browser-check.sh`** (`fef5388`): zwei Wegwerf-Container gegen den
  Teststack, StockInfo über `host.docker.internal` und unter einem Namen, der
  nicht auflöst; ersetzt die Handprüfung mit der Chrome-Erweiterung aus der
  zurückgeholten Fassung.
- **`live-sync-smoke.mjs`** (`b246305`): löschte feste Symbole des
  Beispiel-Depots und brach ab, wenn ein anderes Skript zuvor ein eigenes
  Depot ins selbe Konto gespielt hatte (Rotlauf: Timeout bei `EQQQ.DE`). Jetzt
  die Hälfte der vorhandenen Marktpositionen.

**Belege dieser Fassung.**

1. `make test`: Frontend 83 Dateien / 865 Tests, API 6 / 27, grün. Lint und
   Typecheck `frontend` und `api`: Exit 0. `git diff --check` sauber.
2. Teststack (ohne `--demo-details`), `check:stockinfo-proxy`: alle Schritte
   OK, Routenabdeckung 12 Routen mit 200 (`/api/stockinfo-target`,
   `/instruments`, `/fields`, `/instrument-types`, `/fx`, `/health`,
   `/quote`, `/quote/{isin}`, `/quote/{isin}/daily`,
   `/quote/by-symbol/NOSI.DE/daily`, `POST /refresh/{isin}`,
   `POST /refresh/by-symbol/NOSI.DE`), Abweisungen wie erwartet, nur
   Anfragen an `127.0.0.1:5175`.
   Rotläufe: R1 `--unreachable` gegen erreichbares StockInfo → 5 `FEHLER`
   (200 statt 502, kein Dialog, Zustand „erreichbar“), Exit 1. R2 falsche
   `STOCKINFO_URL` → `FEHLER Statusseite: Adresse …`, Exit 1. R3 zusätzliches
   Muster `/^\/new-route$/` in `proxy.ts` → `FEHLER Routenabdeckung: GET
   ^\/new-route$: nie aufgerufen`, Exit 1; Datei danach wiederhergestellt.
   R4 laufender Stack mit alter Serverfassung → `/history → 200 statt 404`
   (erst nach Neustart grün).
3. Container (`make build` 2026-10-03 15:12 UTC), `docker/browser-check.sh`:
   Fall 1 `http://host.docker.internal:8899` alle Schritte OK, dieselben 12
   Routen, nur `127.0.0.1:18091`. Fall 2 `http://stockinfo-missing.invalid:8000`:
   502 `stockinfo_unreachable`, Dialog und Statusseite nennen „vom
   StockPortfolio-Server aus nicht erreichbar“. „Beide Fälle bestanden.“
   Rotläufe davor: Klick hinter dem Ausfall-Dialog (Fall 2) und Neuladen nach
   dem Import (Fall 1) brachen ab, beides im Skript behoben (`a8d2f01`).
4. Gegenprobe der übrigen Abläufe auf dem Endstand: `live-sync-smoke.mjs`
   alle Prüfschritte bestanden, `notice-texts-check.mjs` grün,
   `demo-data-check.mjs` (Stack mit `--demo-details`) grün.
5. `docker/smoke-test.sh` aus der zurückgeholten Fassung (31 von 31) bleibt
   gültig; das Image hat seither nur die entfernte Route geändert, die
   `browser-check.sh` mit 404 belegt.

**Doku-Abgleich dieser Fassung.** `README.md` › Building and publishing:
`smoke-test.sh` nennt die Weiterleitung, neuer Absatz zu `browser-check.sh`
und `check:stockinfo-proxy`. `AGENTS.md` › Browserprüfung: Skript, Regel
„neue StockInfo-Route braucht einen sichtbaren Schritt“, Container-Prüfung.
`frontend/tests/fixtures/browser/README.md`: Abschnitt „StockInfo-Routen
prüfen“. `docker/README.md` bleibt unverändert: Die Prüfwerkzeuge sind
Entwicklerwerkzeuge und gehören ins Projekt-README.

### Übergabe Runde 1, vor Rückholung · claude-coder · 2026-10-03

Branch
`t-82-stockinfo-ueber-eigenen-server`, Code- und Dokustand `0cf50c2`.

**Umsetzung.**

- Server: `api/src/stockinfo/proxy.ts` mit Freigabeliste (GET: `/instruments`,
  `/fields`, `/instrument-types`, `/fx`, `/health`, `/quote`,
  `/quote/{x}`, `/quote/{x}/daily`, `/quote/{x}/history`,
  `/quote/by-symbol/{x}/daily`; POST: `/refresh/{x}`,
  `/refresh/by-symbol/{x}`), 60 s Zeitlimit, keine Cookies, nur
  `content-type`, `cache-control` und `retry-after` zurück. Routen in
  `api/src/routers/api.ts`: `/api/stockinfo/*` (401 ohne Sitzung, 404 außerhalb
  der Liste, 503 `stockinfo_not_configured`, 502 `stockinfo_unreachable`,
  504 `stockinfo_timeout`) und `GET /api/stockinfo-target` für die Anzeige.
  POST läuft durch die bestehende Origin- und Content-Type-Prüfung.
- Frontend: `StockInfoClient` nutzt `/api/stockinfo`, wird einmal in
  `AuthRoot.vue` erzeugt und bereitgestellt; die Zieladresse steht im
  `apiStatus`-Store. `config.js`, `VITE_STOCKINFO_API_URL`,
  `MissingApiUrlError` und `apiUrlSource` entfallen; Fehlertexte nennen die
  drei Servercodes.
- Container und Entwicklung: Entrypoint und Dockerfile schreiben keine
  Browser-Konfiguration mehr. `make dev` gibt der Konto-API die lokale
  Umgebungsdatei mit (`tsx watch --env-file-if-exists=../.env`).
- Teststack: StockInfo startet mit absichtlich fremder CORS-Herkunft
  (`http://cors-not-used.invalid`); `--status` prüft, dass Vite
  `/api/stockinfo/*` an die Konto-API reicht (401 ohne Sitzung).
- Wächter-Tests finden den Projektordner über `tests/helpers/projectRoot.ts`
  statt `process.cwd()` (`c6c5152`); sie liefen aus `frontend/` gestartet rot.

**Belege.**

1. `make test`: Frontend 83 Dateien / 865 Tests, API 6 / 27, grün.
   `api/tests/stockinfo-proxy.spec.ts` deckt Pfade, Weiterleitung, POST mit
   Origin-Prüfung, 401/404, 502/504/503 und die Zieladresse ab. Lint und
   Typecheck für `frontend` und `api`: Exit 0. `git diff --check`: sauber.
2. `client.spec.ts`: Basis `/api/stockinfo`, POST mit JSON-Content-Type,
   Servercodes übersetzt.
3. Teststack ohne passendes CORS bei StockInfo, sichtbar:
   - `demo-data-check.mjs`: grün, Statusseite nennt `http://127.0.0.1:8899`
     als erreichbar, Schritt 6 meldet nur Anfragen an
     `http://127.0.0.1:5175`.
     Rotlauf R1: falsche erwartete Adresse → `FEHLER` Statusseite, Exit 1.
     Rotlauf R2: Client-Basis direkt auf `:8899` → `FEHLER` mit „nicht an
     StockPortfolio: GET http://127.0.0.1:8899/…“, Exit 1. Datei danach per
     `cmp` wiederhergestellt.
   - `notice-texts-check.mjs`: grün.
   - `live-sync-smoke.mjs`: alle Prüfschritte bestanden, B holte nach dem
     Kursabruf in A 9 Kurse über die Weiterleitung. Rotlauf: Der erste Lauf
     hing in `getScreenDetails()` und endete erst durch `timeout` (Exit 124);
     Playwright kennt die Freigabe `window-management` nicht. Behoben in
     `18b3641`: Freigabe per CDP für den Browserkontext, 5 s Rückfall auf
     `window.screen`, ohne Terminal kein Warten auf Enter.
4. Container (`make build`, Image vom 2026-10-03):
   - `docker/smoke-test.sh` neuer Schritt 6: StockInfo-Stub nur unter dem
     Docker-internen Namen `stockinfo-stub` erreichbar; Weiterleitung erreicht
     ihn, ohne Sitzung 401. Rotlauf mit dem Image vom 2026-10-01: 28 von 31,
     drei `FEHLER` (Zieladresse, Stub, 401 → 404). Grünlauf: 31 von 31.
   - Sichtbar im Browser: Container mit
     `STOCKINFO_API_URL=http://host.docker.internal:8899` auf dem Teststack;
     Beispiel-Depot zeigt Kurse und Verlauf, „Aktualisieren“ sendet fünf
     `POST /api/stockinfo/refresh/…` an `127.0.0.1:18091` (200), keine Anfrage
     an StockInfo direkt. Statusseite: `http://host.docker.internal:8899`,
     erreichbar, Version 1.5.0. Container danach entfernt.
5. Siehe 1.
6. Doku-Abgleich siehe unten.

**Doku-Abgleich.**

- `README.md`: Setup (Variable `STOCKINFO_API_URL`), Docker-Start (Container
  ruft StockInfo, kein CORS), Statusseite (fehlend, nicht erreichbar, zu
  langsam statt CORS), Teststack (Konto-API ohne Umgebungsdatei, Prüfung der
  Weiterleitung), Abschnitt „API address“ neu, Zeile „CORS against the
  production API“ aus „Not there yet“ entfernt.
- `docker/README.md`: Absatz „The container talks to StockInfo“, Tabelle
  „reachable from the container“. Gemeinsame Aussagen stimmen mit
  `README.md` überein. Hub-Vorschau 12.612 Byte (Grenze 25.000).
- `unraid/README.md`: Installationsschritt 3, Feldtabelle und Absatz zur
  Adresse; CORS-Absatz entfernt.
- `AGENTS.md`: neuer Punkt „Der Browser fragt StockInfo nur über den eigenen
  Server ab“, „Die Basisadresse hat keine Rückfallebene“ ohne `config.js`,
  Teststack-Prüfung und Entwicklungsstand ohne CORS.
- `frontend/tests/fixtures/browser/README.md`: Start über den ganzen
  Teststack; Container-Probe mit `host.docker.internal`.
- `docs/superpowers/specs/`: datierte Entwürfe, bleiben unverändert.
- Templates-Repo `templates/stockportfolio.xml`: Overview, Requires und Feld
  „StockInfo API“ auf „reachable from this container“, CORS-Satz entfernt
  (`4ca7d50`, lokal, kein Push).
- Skill `task-verification-workflow`: keine Board- oder Lessons-Konvention
  geändert, keine Anpassung.

**StockInfo.** Ticket
[StockInfo T-101](/Volumes/DevLocal/DevWeb/Production/StockInfo/_tickets/10-backlog/T-101-stockportfolio-braucht-kein-cors-mehr.md)
im dortigen Backlog (`4ccdc92`, lokal, kein Push): betrifft T-99 und T-100.
Template-Feld „CORS origins“ und die StockPortfolio-Hinweise in StockInfos
Anleitungen sind bereits entfernt (Templates `4e910c4`, StockInfo `ad10866`).

**Für Mike.** In der lokalen Umgebungsdatei `VITE_STOCKINFO_API_URL` in
`STOCKINFO_API_URL` umbenennen; sonst meldet die App die fehlende Adresse.
Ein Container mit einer nur im Browser auflösbaren Adresse (etwa `.local`)
braucht eine vom Container erreichbare Adresse.
