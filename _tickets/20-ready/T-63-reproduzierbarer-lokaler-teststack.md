# T-63 · Lokalen Teststack für StockPortfolio reproduzierbar starten

Für Browserprüfungen werden StockInfo, die StockPortfolio-Konto-API und Vite
derzeit von Hand verbunden. Dabei wird leicht eine falsche StockInfo-Adresse
oder Browser-Herkunft verwendet. Ein Test kann dann an der Testumgebung
scheitern, obwohl die Anwendung richtig arbeitet. Ein Docker-Container ist
für diesen normalen Entwicklungsdurchlauf nicht erforderlich.

**Beispiel:** Ein Bearbeiter startet StockPortfolio auf Port 5175, lässt aber
`VITE_STOCKINFO_API_URL` auf eine Beispieladresse zeigen oder startet den
StockInfo-Testserver mit seiner bisherigen Standard-Herkunft auf Port 5189.
Die App erhält keine Testkurse. Der Fehler fällt erst im Browser auf und
führt erneut zur Suche im Produktcode oder zu einem unnötigen Docker-Start.

**Stand am 2026-09-29:**

- `scripts/stockinfo-test-server.py` startet die **echten StockInfo-Routen**
  mit temporärer SQLite-Datenbank, festen Instrumenten, Kursen, Tagesreihen
  und Devisenkursen. Externe Quellen und der produktive Scheduler werden
  ersetzt. Der Dienst bindet nur `127.0.0.1`, standardmäßig Port 8899.
- `--origin` setzt genau eine erlaubte Browser-Herkunft für CORS. Die
  Script-Vorgabe `http://127.0.0.1:5189` passt nicht zum StockPortfolio-Vite-Port
  5175. `--stop` beendet nur den anhand PID, Startzeit und Scriptpfad
  registrierten eigenen Prozess; die Prozessprüfung verwendet `ps`.
- StockInfos `make dev` startet dessen normales Backend auf Port 8000;
  `make dev-up` startet zusätzlich **StockInfos eigenes Dashboard** auf 5173.
  Diese Befehle sind kein Ersatz für die reproduzierbaren StockPortfolio-
  Testkurse. Änderungen im StockInfo-Repository sind hier nicht beauftragt.
- StockPortfolio braucht zusätzlich seine eigene Konto-API (`make dev-api`)
  und Vite (`make dev`). Ihre Adressen, Datenverzeichnisse und Herkunfts-
  Einstellungen werden heute nicht von einem gemeinsamen Teststart geprüft.
  Im T-60-Durchlauf wurde zuerst eine Beispieladresse und danach ein
  Docker-Container verwendet, obwohl der lokale Testserver vorhanden ist.
- `Makefile` bindet `.env` ein und exportiert dessen Werte. Im T-60-Durchlauf
  überstimmte der dortige StockInfo-Wert sogar
  `env VITE_STOCKINFO_API_URL=http://127.0.0.1:8899 make dev`; der Browser
  rief die gehostete API auf. Erst die explizite Make-Zuweisung
  `make dev VITE_STOCKINFO_API_URL=http://127.0.0.1:8899` wirkte. Der
  künftige Startweg muss diesen Vorrang selbst korrekt setzen und prüfen.

**Für dich:** Dieses Ticket ist auf Mikes Wunsch vom 2026-09-29 für die Arbeit
nach T-60 eingeplant. Es startet noch keine Umsetzung; T-60 bleibt der aktive
Auftrag. Die laufende T-60-Prüfung verwendet die vorhandenen lokalen
Startwege; dieses Ticket soll deren künftige Wiederholung absichern.

## Ziel und Grenze

Ein dokumentierter Befehl startet den lokalen **Teststack ohne Docker**:
StockInfos vorhandenes Testserver-Script, die eigene StockPortfolio-API und
Vite. Ein zweiter Befehl stoppt genau diese gestarteten Prozesse und räumt
temporäre Testdaten auf. Ein Statusbefehl zeigt Ports, Adressen, Prozesszustand
und den wirksamen StockInfo-Endpunkt. Die konkrete Form (Make-Targets oder
ein kleines Startscript) wird bei Aktivierung entschieden; es gibt keine
zweite Kopie der StockInfo-Fixtures oder seines Servers.

Der Start setzt die drei zusammengehörigen Werte aus einer Quelle: die
Browser-Adresse der Vue-App, StockInfos `--origin` und die von der App im
Browser verwendete `VITE_STOCKINFO_API_URL`. Für die eigene API setzt er
`STOCKPORTFOLIO_PUBLIC_ORIGIN` auf dieselbe Browser-Adresse. Er überprüft
`/health` von StockInfo, `/healthz` und `/api/setup/status` von StockPortfolio,
einen bekannten Testkurs und den passenden CORS-Header. Bei fehlender
StockInfo-Python-Umgebung, belegtem Port, abweichender Konfiguration oder
nicht startendem Prozess folgt ein konkreter Fehler; kein stiller Wechsel
auf fremde oder produktive Adressen.

Container-Build, Volume-Erhalt und Unraid bleiben separate Betriebsprüfungen
in T-60. Dieser lokale Teststack ersetzt sie nicht. Er benötigt keine echten
Konten, produktive StockInfo-Datenbank, externen Kursdienst oder Zugangsdaten.
Falls eine Lösung StockInfo selbst ändern müsste, entsteht dafür zuerst ein
Ticket in dessen eigenem Board; hier wird dort kein Produktcode geändert.

## Akzeptanzkriterien

- [ ] Ein Startbefehl bringt StockInfo-Fixtures, Konto-API und Vite ohne
  Docker hoch und zeigt die drei Adressen samt zugehöriger Herkunft an.
- [ ] Die Browser-App erreicht den bekannten StockInfo-Testkurs. Die
  Anmeldung funktioniert über die lokale Konto-API auch dann, wenn der
  StockInfo-Testserver danach gestoppt wird.
- [ ] Start und Stop erkennen eigene Prozesse zuverlässig. Ein zweiter Start
  ersetzt keinen laufenden Prozess; ein fremder Portbesitzer wird nicht
  beendet. Temporäre Daten bleiben getrennt von echten Depot- und
  StockInfo-Datenbanken.
- [ ] Portabweichungen und fehlende Abhängigkeiten werden vor oder beim Start
  mit einem konkreten Hinweis gemeldet. Der notwendige `ps`-Zugriff des
  vorhandenen Scripts wird für eingeschränkte Agentenlaufzeiten ausdrücklich
  dokumentiert; die Lösung umgeht keine Freigabegrenze.
- [ ] `README.md` und `AGENTS.md` beschreiben den gültigen lokalen Startweg.
  `docker/README.md` wird inhaltlich gegengeprüft; Container-Anweisungen
  bleiben dort von diesem Entwicklungsweg getrennt.

## Verify

| # | Gegenprobe | Erwarteter Beleg | AI | Human |
|---|---|---|:--:|:--:|
| 1 | Frischen lokalen Stack starten | `/health`, `/healthz`, Setup-Status, Testkurs und CORS passen zu den angezeigten Adressen | ➖ | |
| 2 | Browser auf der ausgegebenen Vite-Adresse öffnen | Setup/Login und StockInfo-Testkurs laufen ohne Docker; kein Beispiel-Endpunkt im Netzwerkprotokoll | ➖ | |
| 3 | Zweiten Start, Portkonflikt und Stop prüfen | Kein fremder Prozess wird beendet; eigene Prozesse und temporäre Daten werden gezielt behandelt | ➖ | |
| 4 | Dokumentations- und Bezeichnerabgleich | Root-README, AGENTS und Docker-README stimmen; neue Codebezeichner sind englisch | ➖ | |

**Doku-Abgleich bei Einplanung:** Nur der Auftrag wurde beschrieben;
Produktverhalten und Startbefehle sind noch nicht geändert. Deshalb ist jetzt
keine Anleitung angepasst. Bei Umsetzung sind `README.md` (Setup/Commands),
`AGENTS.md` (lokaler Dienststart) und `docker/README.md` (Abgrenzung der
Containerprüfung) inhaltlich abzugleichen.
