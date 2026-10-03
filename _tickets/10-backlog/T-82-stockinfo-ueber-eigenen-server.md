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
Backlog an“). Noch nicht eingeplant. Für Mike ist kein Handgriff nötig.

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

Legende: ➖ noch keine Live-Verifikation.

| # | Handgriff | Erwarteter Nachweis | AI |
|---|---|---|:--:|
| 1 | Server-Tests mit Ersatz-StockInfo | Erlaubte Pfade werden weitergeleitet, andere abgewiesen; Statuscodes und Parameter unverändert; `502` bei Ausfall; ohne Anmeldung kein Zugriff | ➖ |
| 2 | Frontend-Tests | Client nutzt `/api/stockinfo`; keine Abfrage geht direkt an StockInfo | ➖ |
| 3 | Browserprüfung mit `scripts/stockinfo-test-server.py`, StockInfo **ohne** passendes `CORS_ORIGINS` | Dashboard, Kurse, Verlauf und Aktualisieren funktionieren; Netzwerkansicht zeigt nur Anfragen an StockPortfolio | ➖ |
| 4 | Container mit `STOCKINFO_API_URL` auf einen Docker-internen Namen | Kurse erscheinen | ➖ |
| 5 | `make test`, `make lint`, `make typecheck` | Grün | ➖ |
| 6 | Doku-Abgleich der drei READMEs und des Templates | Keine Aussage mehr zu CORS oder Browser-Erreichbarkeit der API | ➖ |

### Akzeptanzkriterien

- [ ] Der Browser ruft StockInfo nicht mehr direkt auf.
- [ ] StockPortfolio funktioniert ohne `CORS_ORIGINS` bei StockInfo.
- [ ] Nur die genutzten StockInfo-Pfade sind über die Weiterleitung erreichbar, nur angemeldet.
- [ ] Bestehende Installationen funktionieren mit derselben `STOCKINFO_API_URL`, sofern der Container die Adresse auflösen kann.
- [ ] Doku-Abgleich in StockPortfolio und Templates; Folgeänderung in StockInfo als dortiges Ticket.

### Side-Effects

Eine `STOCKINFO_API_URL`, die nur der Browser auflösen kann (etwa ein
`.local`-Name), muss auf eine vom Container erreichbare Adresse umgestellt
werden. Mit der Weiterleitung kann StockInfo ohne veröffentlichten Port nur
im Docker-Netz laufen. Kein Push, kein Docker-Hub- oder Unraid-Update ohne
eigenen Auftrag.

### Auflösung

Offen. Noch keine Umsetzung oder Verifikation.
