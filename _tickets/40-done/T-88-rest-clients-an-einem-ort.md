# T-88 · REST-Clients des Frontends an einem Ort

**Abgeschlossen am 2026-10-03** (Mike, 2026-10-03: „T-88 ist abgenommen, push es“). Technisch freigegeben in Runde 2 (`343de5d`), nach `master` gemergt (`57c89fc`) und zu `origin` gepusht.

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

### Technische Prüfung Runde 2 · codex-verifier · 2026-10-03

**Prüffassung:** Nacharbeit `343de5d`, Übergabe auf
`t-88-rest-clients-an-einem-ort`; Rollen, Owner, Branch und Paketversion
`df699dd1d7583c59030030ad44e3ab896d4660be8d84575662e652f754624da1`
erneut abgeglichen. **Urteil: `approved`.** Die Freigabe ist technisch;
Mikes Abschluss bleibt getrennt. Kein Produktcode durch den Verifier geändert.

**Rückgabepunkt erledigt.** Der Coder hat beide Rotläufe auf dem
unveränderten Produktstand wiederholt. Für den eingefügten `fetch`-Aufruf
und die ausgelagerte `liveEvents.ts`-Kopie sind jeweils Fehlerbild und
Exit-Code 1 belegt; nach Rücknahme der Proben bestanden alle drei
Wächtertests mit Exit-Code 0. `git diff 798477d HEAD` zeigt keine Änderung
an `frontend/src/`, dem Wächter oder `AGENTS.md`. Der gezielte Wächterlauf
war auch unabhängig grün (Exit 0, drei Tests; durch den lokalen
`active-work.local`-Link zweimal eingesammelt). `git diff --check
798477d HEAD` war sauber.

**Übrige Prüfung:** Die unabhängigen Tests, Lint, Typecheck, Build und das
Source-Inventar aus Runde 1 gelten für denselben Produktstand. Die
sichtbaren Teststack-Läufe sind als Coder-Beleg dokumentiert und wurden
von mir nicht wiederholt. Der Doku-Abgleich aus Runde 1 bleibt gültig:
`AGENTS.md` nennt die neuen Pfade; die beiden READMEs und
`unraid/README.md` enthalten keine betroffenen Frontend-Pfade. Keine neue
Board-Konvention für `task-verification-workflow`; keine neue Lesson.

### Nacharbeit Runde 1 · claude-coder · 2026-10-03

**Formaler Befund behoben: Exit-Codes der Rotläufe.** Beide Fehlerfälle auf
dem unveränderten Stand `798477d` wiederholt, Aufruf jeweils
`npx vitest run tests/networkAccess.spec.ts` in `frontend/`:

| Lauf | Eingebauter Fehler | Ergebnis | Exit |
|---|---|---|---|
| R1 | `void fetch(`/api/data/${'x'}`)` am Anfang des Skripts von `src/views/StatusView.vue` | `1 failed \| 2 passed`; `frontend/src/views/StatusView.vue:2 fetch(…)` und `Pfad „/api/data/“` | **1** |
| R2 | Kopie von `src/api/data/liveEvents.ts` nach `src/data/liveEvents.ts` | `1 failed \| 2 passed`; `frontend/src/data/liveEvents.ts:48 new EventSource(…)` und `:64 Pfad „/api/data/events“` | **1** |
| Grün | beide Fehler zurückgenommen (`cp` der Sicherung, Kopie gelöscht) | `3 passed` | **0** |

Danach `git status --short frontend/src` leer: kein Rest der Probe im Baum.
Produktcode und Belege der Runde 1 sonst unverändert.

### Technische Prüfung Runde 1 · codex-verifier · 2026-10-03

**Prüffassung:** `798477d` auf `t-88-rest-clients-an-einem-ort`.
Rollen, Owner, Branch und Paketversion
`df699dd1d7583c59030030ad44e3ab896d4660be8d84575662e652f754624da1`
abgeglichen. **Urteil: `changes_requested`.** Kein Produktcode durch den
Verifier geändert.

**Formaler Rückgabepunkt · Exit-Codes der Rotläufe fehlen.**
`_tickets/.agents/AGENT-WORKFLOW.md` verlangt bei einem neuen Testwächter
für jeden absichtlich roten Fehlerfall den eingebauten Fehler **und den
beobachteten Exit-Code** im Ticket; ohne diesen Beleg ist die Übergabe formal
zurückzugeben. Die Übergabe dokumentiert zwei Fehlerfälle in `StatusView.vue`
und `src/data/liveEvents.ts`, bezeichnet die Tests jeweils als rot, nennt
aber keinen beobachteten Exit-Code. Bitte die Exit-Codes beider Rotläufe
belegen und die Übergabe erneut vornehmen. Die technische Freigabe folgt
erst nach diesem Nachweis.

**Unabhängige grüne Belege:** `make test` Exit 0 (Frontend 84 Dateien/868
Tests, API 6/28); Frontend- und API-Lint sowie Typecheck je Exit 0;
`npm --prefix frontend run build` Exit 0. Die verschobenen Clientdateien
haben identischen Inhalt (`R100`); die übrigen Source-Änderungen sind
Importpfade. Das Inventar fand gegenwärtig keinen Netzwerkaufruf und keinen
`/api/`-Pfad außerhalb `frontend/src/api/`. Die sichtbaren Läufe stehen in
der Coder-Übergabe; ich habe sie in dieser Runde nicht selbst wiederholt.

**Doku-Abgleich:** `AGENTS.md` nennt die neuen Pfade und den Wächter;
`README.md`, `docker/README.md` und `unraid/README.md` enthalten keine
betroffenen Frontend-Pfade. Eine inhaltliche Änderung dieser Anleitungen
ist durch die reine Verschiebung nicht nötig. Am Skill
`task-verification-workflow` ist keine Board-Konvention zu übernehmen.

**Lessons-Einordnung:** Bestehende lokale Rotlauf-Regel angewendet; die
fehlenden Exit-Codes sind ein Übergabebeleg, kein neues Fehlermuster für
eine Lesson. Die Prüfung behauptet nur die selbst ausgeführten grünen
Schritte als unabhängigen Nachweis (SP-R-02).

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
