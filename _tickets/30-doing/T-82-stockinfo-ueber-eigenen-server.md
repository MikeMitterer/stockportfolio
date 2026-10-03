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

Legende: ✅ geprüft (Claude, 2026-10-03, Branch-Stand `0cf50c2`).

| # | Handgriff | Erwarteter Nachweis | AI |
|---|---|---|:--:|
| 1 | Server-Tests mit Ersatz-StockInfo | Erlaubte Pfade werden weitergeleitet, andere abgewiesen; Statuscodes und Parameter unverändert; `502` bei Ausfall; ohne Anmeldung kein Zugriff | ✅ |
| 2 | Frontend-Tests | Client nutzt `/api/stockinfo`; keine Abfrage geht direkt an StockInfo | ✅ |
| 3 | Browserprüfung mit `scripts/stockinfo-test-server.py`, StockInfo **ohne** passendes `CORS_ORIGINS` | Dashboard, Kurse, Verlauf und Aktualisieren funktionieren; Netzwerkansicht zeigt nur Anfragen an StockPortfolio | ✅ |
| 4 | Container mit `STOCKINFO_API_URL` auf einen Docker-internen Namen | Kurse erscheinen | ✅ |
| 5 | `make test`, `make lint`, `make typecheck` | Grün | ✅ |
| 6 | Doku-Abgleich der drei READMEs und des Templates | Keine Aussage mehr zu CORS oder Browser-Erreichbarkeit der API | ✅ |
| 7 | Sichtbare Routenabdeckung mit einem Repo-Skript, gegen Teststack **und** Container | Jede neue Server-Route kommt im Browserlauf vor: `GET /api/stockinfo-target` und jeder freigegebene Pfad unter `/api/stockinfo/*` mit 200; ohne Sitzung 401, außerhalb der Freigabeliste 404; Ausfall als 502 `stockinfo_unreachable` sichtbar gemeldet | ➖ |

### Akzeptanzkriterien

- [x] Der Browser ruft StockInfo nicht mehr direkt auf.
- [x] StockPortfolio funktioniert ohne `CORS_ORIGINS` bei StockInfo.
- [x] Nur die genutzten StockInfo-Pfade sind über die Weiterleitung erreichbar, nur angemeldet.
- [x] Bestehende Installationen funktionieren mit derselben `STOCKINFO_API_URL`, sofern der Container die Adresse auflösen kann.
- [x] Doku-Abgleich in StockPortfolio und Templates; Folgeänderung in StockInfo als dortiges Ticket.
- [ ] Die sichtbaren Prüfungen enthalten alle mit T-82 im StockPortfolio-Server
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

**Vor Prüfbeginn zurückgeholt (2026-10-03).** Mike: „Hol T-82 zurück und
ergänze die Prüfungen“. Kursverlauf, Fehlerfall und Container waren nur
teilweise oder von Hand sichtbar geprüft; Verify #7 und das letzte
Akzeptanzkriterium kommen dazu. Die Übergabe Runde 1 unten gilt nicht mehr.

**Übergabe Runde 1 an den Verifier (claude-coder, 2026-10-03).** Branch
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
