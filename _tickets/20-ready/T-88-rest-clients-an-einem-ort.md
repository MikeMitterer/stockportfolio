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
direkt nach T-82. Für Mike ist kein Handgriff nötig.

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

- [ ] Alle REST- und SSE-Clients liegen unter einem Ort, je Gegenstelle ein
      Unterordner.
- [ ] Außerhalb davon gibt es keine Netzwerkaufrufe, Pfade oder Adressen von
      Gegenstellen; belegt per Inventar.
- [ ] Verhalten unverändert: `make test`, Lint, Typecheck grün; Smoketest
      Live-Abgleich grün.
- [ ] Doku-Abgleich: `AGENTS.md`, `README.md`, Kommentare mit alten Pfaden.

### Side-Effects

Reine Umstrukturierung im Frontend. Kein Push, kein Docker-Hub- oder
Unraid-Update ohne eigenen Auftrag.

### Auflösung

Offen. Noch keine Umsetzung.
