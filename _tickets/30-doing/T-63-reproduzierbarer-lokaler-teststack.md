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

**Für dich:** Mike hat dieses Ticket am 2026-09-29 vorgezogen, weil er die
menschliche T-60-Prüfung erst später vornehmen kann. T-63 ist jetzt der aktive
Coder-Auftrag. T-60 bleibt in `30-doing/` technisch freigegeben, aber mit
offener menschlicher Prüfung; dafür läuft aktuell keine Testinstanz.

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

- [x] Ein Startbefehl bringt StockInfo-Fixtures, Konto-API und Vite ohne
  Docker hoch und zeigt die drei Adressen samt zugehöriger Herkunft an.
- [x] Die Browser-App erreicht den bekannten StockInfo-Testkurs. Die
  Anmeldung funktioniert über die lokale Konto-API auch dann, wenn der
  StockInfo-Testserver danach gestoppt wird.
- [x] Start und Stop erkennen eigene Prozesse zuverlässig. Ein zweiter Start
  ersetzt keinen laufenden Prozess; ein fremder Portbesitzer wird nicht
  beendet. Temporäre Daten bleiben getrennt von echten Depot- und
  StockInfo-Datenbanken.
- [x] Portabweichungen und fehlende Abhängigkeiten werden vor oder beim Start
  mit einem konkreten Hinweis gemeldet. Der notwendige `ps`-Zugriff des
  vorhandenen Scripts wird für eingeschränkte Agentenlaufzeiten ausdrücklich
  dokumentiert; die Lösung umgeht keine Freigabegrenze.
- [x] `README.md` und `AGENTS.md` beschreiben den gültigen lokalen Startweg.
  `docker/README.md` wird inhaltlich gegengeprüft; Container-Anweisungen
  bleiben dort von diesem Entwicklungsweg getrennt.

## Verify

| # | Gegenprobe | Erwarteter Beleg | AI | Human |
|---|---|---|:--:|:--:|
| 1 | Frischen lokalen Stack starten | `/health`, `/healthz`, Setup-Status, Testkurs und CORS passen zu den angezeigten Adressen | ✅ | |
| 2 | Browser auf der ausgegebenen Vite-Adresse öffnen | Setup/Login und StockInfo-Testkurs laufen ohne Docker; kein Beispiel-Endpunkt im Netzwerkprotokoll | 🔶 | |
| 3 | Zweiten Start, Portkonflikt und Stop prüfen | Kein fremder Prozess wird beendet; eigene Prozesse und temporäre Daten werden gezielt behandelt | ✅ | |
| 4 | Dokumentations- und Bezeichnerabgleich | Root-README, AGENTS und Docker-README stimmen; neue Codebezeichner sind englisch | ✅ | |

**Doku-Abgleich bei Einplanung:** Nur der Auftrag wurde beschrieben;
Produktverhalten und Startbefehle sind noch nicht geändert. Deshalb ist jetzt
keine Anleitung angepasst. Bei Umsetzung sind `README.md` (Setup/Commands),
`AGENTS.md` (lokaler Dienststart) und `docker/README.md` (Abgrenzung der
Containerprüfung) inhaltlich abzugleichen.

## Umsetzung und Eigenprüfung · 2026-09-29

`scripts/stockinfo-test-server.py` hat einen Shebang und verwaltet mit
`--stack` den vorhandenen StockInfo-Testserver, die eigene API und Vite. Die
zusätzliche Logik liegt in `scripts/local_test_stack.py`; CLI-Texte der neuen
Funktion liegen im gettext-Katalog unter `scripts/locale/`. Der bestehende
StockInfo-only-Weg bleibt verfügbar. `--stack --status` nennt Prozesse, Ports,
Herkunft und wirksamen Endpunkt; `--stack --stop` beendet nur registrierte
Prozessgruppen mit unveränderter Identität und löscht die isolierten Kontodaten.
StockInfo-Quoten und Historie stammen weiterhin aus dem vorhandenen Script.
`--demo-accounts` legt optional einen synthetischen Admin und Benutzer über die
echte Konto-API an; zufällige Zugangsdaten stehen nur in einer temporären Datei
mit Modus 0600. Ohne diese Option ist die API im frischen Setup-Zustand.

**Belege zur Matrix:**

1. Frischer Start mit und ohne `--demo-accounts`: 5175/8080/8899 laufen;
   `--stack --status` prüft StockInfo `/health`, Kurs
   `/quote/IE00B4L5Y983` mit Preis 128,7 und CORS-Herkunft 5175, API
   `/healthz` und `/api/setup/status`, Vites kompilierten Client sowie
   `config.js`. Ohne Testkonten meldet Setup `required=true`, mit ihnen
   `required=false`.
2. Browser auf `http://127.0.0.1:5175`: Login-Felder sichtbar,
   `/api/setup/status` über Vite-Proxy mit HTTP 200; der Browser-Fetch auf
   den lokalen StockInfo-Testkurs liefert HTTP 200 und 128,7. Der direkte
   StockInfo-Aufruf der Browser-Seite nutzt 8899 und die richtige Herkunft.
   Nach `--stop` **ohne** `--stack` blieb die Anmeldung beider Testkonten
   über den Vite-Proxy mit HTTP 200 möglich, während StockInfo gestoppt war.
   **Teilbeleg:** Eine vollständige Anmeldung durch die sichtbare Vue-Maske
   samt Kursanzeige in der Depotansicht wurde nicht durchgespielt; daher
   Verify-Zeile 2 nur teilweise markiert. Der Verifier kann dies mit
   `--demo-accounts` ergänzen.
3. Zweiter `--stack`-Start bricht mit „already registered“ ab. Ein belegter
   lokaler Test-Socket löst „Port ... is already in use; no process was stopped“
   aus. Falsches `--origin` und fehlende StockInfo-`.venv` werden konkret
   zurückgewiesen. Nach gezieltem StockInfo-Stopp zeigte `--stack --status`
   StockInfo `stopped`, API/Vite `running`; `--stack --stop` beendete die
   übrigen eigenen Prozesse. Beide temporären Laufverzeichnisse waren danach
   entfernt; Status meldete keinen registrierten Stack. Ein fremder
   Portbesitzer wurde in dieser Probe nicht tatsächlich gestartet oder
   beendet; die Gegenprobe belegte die frühe Portabweisung.
4. `make test`: 65 Frontend-Dateien/803 Tests und 3 API-Dateien/7 Tests grün;
   `make lint`, `make typecheck`, Python-Syntax und `git diff --check` grün.
   Neue Python-Bezeichner sind englisch. Shebang durch direkten Statusaufruf
   geprüft. `msgfmt --check-format` grün, deutsche CLI-Ausgabe mit
   `LANGUAGE=de` geprüft.

**Doku-Abgleich:** `README.md` → Setup beschreibt Start, Status, Stop,
temporäre Testkonten und Portwahl. `AGENTS.md` → „Bauen und prüfen“ nennt
denselben Startweg und die unveränderten Make-/Umgebungsdateien. Die
Überschriften und Aussagen in `docker/README.md` → „Quick start“, „Docker
Compose“, „Configuration“, „Status and logs“ betreffen Containerbetrieb und
bleiben sachlich richtig; dort ist kein lokaler Entwickler-Stack zu ergänzen.
`Makefile`, `.env`, `.local-data` und das StockInfo-Repository wurden nicht
geändert. Die offene Board-Konventionsübernahme (`_tickets/.gitignore`) bleibt
gemäß STATUS außerhalb dieses Produktauftrags sichtbar.

**Lessons-Abgleich:** SP-CX-01/AL-R-08 begrenzen die Lösung auf das vorhandene
Script und einen Python-Helfer ohne Docker oder neues Make-Target.
SP-CX-04 hält den wiederverwendeten Helfer dauerhaft unter `scripts/`.
AL-R-03 führt zur Identitäts- und Portprüfung vor dem Cleanup; AL-R-10 zum
Frischstart mit leerer temporärer API-Datenbank. SP-CX-02 gleicht gültige
Startbefehle in README und AGENTS ab. Die gemeinsamen Regeln sind im
installierten Stand `df699dd1d7583c59030030ad44e3ab896d4660be8d84575662e652f754624da1`
als `needs_review` gekennzeichnet; ihre fachliche Neubewertung wird hier
nicht behauptet. `task-verification-workflow` wurde mit der lokalen
Übernahmeanleitung abgeglichen; keine Board-Konvention wurde in T-63 geändert.
