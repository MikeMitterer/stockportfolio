# T-88 · REST-Clients des Frontends an einem Ort

**Warum dieses Ticket:** Alle REST-Aufrufe des Frontends laufen zwar über
Client-Klassen, diese liegen aber über drei Ordner verteilt und neben Code,
der mit dem Netz nichts zu tun hat. Wer wissen will, mit welchen Servern die
App spricht und über welche Pfade, muss heute an drei Stellen suchen. Die
Hausregel verlangt einen Ort für ausgehende REST-Aufrufe (Skill
`code-standards`, Abschnitt „Technische Zugriffe bündeln“ und „Adressen und
Endpunkte gehören in den Client“).

**Beispiel:**

| Client | Gegenstelle | Liegt heute in |
|---|---|---|
| `StockInfoClient` | StockInfo über `/api/stockinfo` | `frontend/src/api/` |
| `PortfolioAuthClient` | Konto-API: Setup, Login, Benutzer | `frontend/src/auth/` |
| `PrivateDataClient` | Konto-API: Depots, Einstellungen, Backup | `frontend/src/data/` |
| `LiveEventsClient` | SSE `/api/data/events` | `frontend/src/data/` |

Danach liegen sie gemeinsam unter einem Ort, etwa `frontend/src/api/`
mit Unterordnern je Gegenstelle (`stockinfo/`, `account/`, `data/`).

**Stand:** Angelegt am 2026-10-03 während T-82 (Mike: „Generell um
REST-Calls - die dürfen nicht über die gesamte Applikation verstreut sein“,
danach „Eigenes Ticket direkt nach T-82“). Liegt in `20-ready/`; eingeplant
direkt nach T-82. Für Mike ist kein Handgriff nötig. Reihenfolge laut Mike
(2026-10-03): „ok, T-89 nach T-82, dann T-88“; aktiviert am 2026-10-03.

## Umfang

1. Die vier Clients samt Typen, Normalisierung und Transportfehlern an den
   gemeinsamen Ort verschieben; Imports nachziehen. Kein Verhalten ändern.
2. Inventar über die TS-Compiler-API (wie bei der Benennungsprüfung): Kein
   `fetch`, `EventSource`, `XMLHttpRequest`, kein `/api/`-Pfad und keine
   Gegenstellen-Adresse außerhalb des gemeinsamen Ortes, außer in Tests.
3. Prüfen, ob ein Wächter-Test wie die vorhandenen (`frontend/tests/*.spec.ts`
   mit statischer Suche über `src/`) das dauerhaft absichert; wenn ja, mit
   roter Gegenprobe anlegen.
4. Doku: `AGENTS.md` nennt `frontend/src/api/client.ts` und
   `frontend/src/auth/client.ts`; Pfade nachziehen.

### Akzeptanzkriterien

- [x] Alle REST- und SSE-Clients liegen unter einem Ort, je Gegenstelle ein
      Unterordner.
- [x] Außerhalb davon gibt es keine Netzwerkaufrufe, Pfade oder Adressen von
      Gegenstellen; belegt per Inventar.
- [x] Verhalten unverändert: `make test`, Lint, Typecheck grün.
- [x] Sichtbar unverändert, weil die Verschiebung alle vier Clients berührt
      (Mike, 2026-10-03: sichtbare Prüfungen wichtig für T-82 und T-88):
      `check:stockinfo-proxy` (alle StockInfo-Routen, Fehlerfall),
      `smoke:live-sync` (Konto-API, Daten, SSE) und `check:demo-data`
      grün, jeweils gegen den Teststack.
- [x] Doku-Abgleich: `AGENTS.md`, `README.md`, Kommentare mit alten Pfaden.

### Side-Effects

Reine Umstrukturierung im Frontend. Kein Push, kein Docker-Hub- oder
Unraid-Update ohne eigenen Auftrag.

### Auflösung

Siehe Review-Verlauf.

## Review-Verlauf (neueste Runde zuerst)

### Übergabe Runde 1 · claude-coder · 2026-10-03

Branch `t-88-rest-clients-an-einem-ort` von `master` (`c410a4f`, mit T-82
und T-89), Stand `4812a3b`.

**Umsetzung.**

| Vorher | Nachher |
|---|---|
| `src/api/{client,errors,mappers,normalizers,types}.ts` | `src/api/stockinfo/…` |
| `src/auth/client.ts` | `src/api/account/client.ts` |
| `src/data/client.ts`, `src/data/liveEvents.ts` | `src/api/data/…` |

Verschoben mit `git mv`, 64 Dateien in `src/` und `tests/` per Skript auf die
neuen Importpfade umgestellt (Alias, relative Pfade, `vi.mock`). Kein
Verhalten geändert. `src/data/repository.ts` bleibt: Es ist die
Speicherschicht über dem Daten-Client, kein REST-Code. Die Testdateien
bleiben an ihren Orten unter `tests/api/` und `tests/data/`; nur zwei
Kopfkommentare nennen den neuen Pfad.

**Inventar und Wächter** (Umfang 2 und 3): `frontend/tests/networkAccess.spec.ts`
durchsucht `src/` über die TS-Compiler-API (bei `.vue` die `<script>`-Blöcke)
nach `fetch`/`sendBeacon`-Aufrufen (auch `window.fetch`), `new EventSource`,
`XMLHttpRequest`, `WebSocket` und String-/Template-Literalen mit `/api` oder
`/api/…`. Außerhalb von `src/api/`: keine Fundstelle. Zwei Gegenproben im
Test selbst: Eine Probe-Quelle findet sieben Zugriffe, aber keinen Kommentar
und kein `/apix`; unter `src/api/` werden alle vier Clients gefunden.
Externe Links (justETF, GitHub) sind keine Netzwerkaufrufe und bleiben
erlaubt; Gegenstellen-Adressen gibt es im Frontend seit T-82 keine mehr.

**Belege.**

1. Rotläufe des Wächters: R1 `void fetch(`/api/data/${'x'}`)` in
   `StatusView.vue` → `frontend/src/views/StatusView.vue:2 fetch(…)` und
   `Pfad „/api/data/“`, Test rot. R2 `liveEvents.ts` zusätzlich unter
   `src/data/` → `new EventSource(…)` und `Pfad „/api/data/events“`, rot.
   Beide Dateien danach wiederhergestellt.
2. `make test`: Frontend 84 Dateien / 868 Tests, API 6 / 28. Vitest auch aus
   `frontend/` gestartet grün. Lint und Typecheck `frontend`/`api` Exit 0,
   `git diff --check` sauber. `npm --prefix frontend run build` grün.
3. Sichtbar gegen den Teststack:
   - `check:stockinfo-proxy`: alle 8 Schritte OK, 12 Routen mit 200, nur
     `127.0.0.1:5175`. Gegenprobe `--unreachable` gegen erreichbares StockInfo
     → Exit 1.
   - `smoke:live-sync`: 12 × BESTANDEN, „Alle Prüfschritte bestanden.“
     (Konto-API, Daten, SSE über den verschobenen Client).
   - `check:demo-data` (Stack mit `--demo-details`): „Demodaten wie
     erwartet.“
   Stack danach gestoppt, Ports frei.

**Doku-Abgleich.** `AGENTS.md`: neuer Punkt „Alle ausgehenden Aufrufe des
Frontends liegen unter `frontend/src/api/`“, Pfade im StockInfo-Punkt und bei
den Normalisierern, Wächter-Tabelle um `networkAccess.spec.ts` ergänzt
(„Sechs Tests“). `README.md`, `docker/README.md`, `unraid/README.md`: nennen
keine Frontend-Pfade, unverändert. `docs/stockinfo-integration-proposal.md`
und T-35 enthalten datierte Analysen mit alten Zeilenständen; sie bleiben als
Momentaufnahme. Skill `task-verification-workflow`: keine Board-Konvention
geändert.
