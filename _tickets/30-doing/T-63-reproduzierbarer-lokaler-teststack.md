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
menschliche T-60-Prüfung erst später vornehmen kann. T-63 ist in Runde 1
technisch freigegeben; seine menschliche Abschlussentscheidung steht noch aus.
T-60 bleibt in `30-doing/` technisch freigegeben, aber mit offener menschlicher
Prüfung; dafür läuft aktuell keine Testinstanz.

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
| 2 | Browser auf der ausgegebenen Vite-Adresse öffnen | Setup/Login und StockInfo-Testkurs laufen ohne Docker; kein Beispiel-Endpunkt im Netzwerkprotokoll | ✅ | |
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

## Technische Prüfung Runde 1

`claude`, 2026-09-29, an Handoff-Commit `493c35c64122beac401ddfe2e1fece324f98718e`
(Branch `t-60-stockportfolio-server-und-konten`). Unabhängige technische
Prüfung gegen T-63 und die Projektregeln.

**Code gelesen:** `scripts/local_test_stack.py` vollständig,
`scripts/stockinfo-test-server.py` im Diff gegen den Vorstand.
Prozessidentität (`ps`-Fingerabdruck aus Status, Startzeit, Kommando) wird bei
`stop_children`/`require_owned_processes` gegen den bei Start erfassten Wert
geprüft, bevor eine Prozessgruppe beendet wird — schützt gezielt gegen
PID-Wiederverwendung. `remove_data` löscht nur Verzeichnisse unter dem
System-Temp mit dem Präfix `stockportfolio-t63-`; kein Risiko eines
Fehlgriffs auf fremde Pfade. `demo-accounts.json` und die State-Datei
entstehen mit Modus `0600`.

**Lücke aus der OUTBOX-Nachricht selbst geschlossen:** Codex hatte Verify #2
als Teilbeleg markiert, weil die Anmeldung über die sichtbare Vue-Maske samt
Kursanzeige nicht durchgespielt wurde. Ich habe den Stack selbst gestartet
(`--stack --demo-accounts`), alle Endpunkt-/CORS-Prüfungen liefen grün, und
per Browser-Automatisierung tatsächlich über die Login-Maske angemeldet: Das
Dashboard rendert danach reale Positionen mit Live-Kursen aus dem lokalen
StockInfo-Testserver (u. a. EUNL.DE zu € 128,70 — exakt der von `check_stack()`
geprüfte Testkurs), die Statuszeile zeigt den wirksamen Endpunkt
`127.0.0.1:8899` mit grünem Verbindungsindikator. Verify #2 ist damit
vollständig erfüllt, nicht mehr nur teilweise. (Nebenbefund: Die
Browser-Automatisierung selbst brauchte mehrere Anläufe wegen eines
Erweiterungs-Konflikts in dieser Sitzung — kein Produktfehler, nur ein
Tooling-Stolperstein bei der Prüfung.)

**Selbst nachvollzogen:** `make test` (803 Frontend- + 7 API-Tests), `make
lint`, `make typecheck` — alle grün. `python3 -m py_compile` auf beide
geänderten Skripte, `git diff --check` und `msgfmt --check-format` auf den
neuen `.po`-Katalog — alle ohne Befund. CLI-Ausgabe in Deutsch (Standard bei
`LANG=de_AT.UTF-8`) und explizit mit `LANGUAGE=en` auf Englisch geprüft —
beide korrekt. Zweiter `--stack`-Stop lief sauber: `--stack --stop` beendete
alle drei Prozesse, das temporäre Verzeichnis war danach vollständig entfernt,
keine verwaisten Prozesse zurückgeblieben.

**Dokumentation geprüft:** `README.md` und `AGENTS.md` beschreiben exakt den
getesteten Startweg; die Erklärung, warum der neue Weg die frühere
`.env`-Vorrang-Falle aus T-60 vermeidet („the script sets Vite's StockInfo URL
directly and checks the URL actually served to the browser“), ist technisch
zutreffend — bestätigt durch die eigene Live-Probe. `docker/README.md` bleibt
unverändert und weiterhin sachlich richtig, da dort ausschließlich
Containerbetrieb beschrieben wird.

**Kein Befund.** Akzeptanzkriterien, Verify-Matrix (jetzt alle Zeilen
vollständig, keine Einschränkung mehr) und Doku-Abgleich sind erfüllt.

**Urteil:** `approved`. Menschliche Prüfung ist für dieses Ticket nicht
vorgesehen; T-60s aufgeschobene menschliche Prüfung bleibt davon unabhängig
weiterhin offen.

**Coder-Abgleich nach Review:** Die geprüfte Fassung `493c35c` liegt laut
`git branch --contains` auf `t-63-reproduzierbarer-lokaler-teststack`; die
Branchangabe `t-60-stockportfolio-server-und-konten` im Reviewkopf ist ein
redaktioneller Fehler. Das Urteil bezieht sich eindeutig auf den genannten
Handoff-Commit und bleibt unverändert. Die Aussage „Menschliche Prüfung ist
nicht vorgesehen“ betrifft eine zusätzliche praktische Human-Gegenprobe.
Die menschliche Abschlussentscheidung nach dem Board-Workflow ist damit
nicht ersetzt und steht noch aus.

## Nachtrag 2026-09-30 · lokale Entwicklungsumgebung und CLI

Mike nimmt T-60 über `make dev` ab. Er beauftragte, Vite und die eigene
Konto-API gemeinsam zu starten. `make dev` verwendet dafür Overmind mit
`Procfile.dev`. Einzelne Server werden bei Bedarf über npm gestartet.
Overmind übernimmt keine `.env`-Werte und setzt keinen eigenen Port; Vite
liest die Projekt-`.env` wie bisher. `make build` bleibt nach Mikes
Korrektur der Docker-Image-Build. Weitere Make-Ziele für einzelne
Subprojekte sowie Lint, Format, Typprüfung, Watch und Preview wurden auf
Mikes Wunsch entfernt. `make test` prüft beide Subprojekte; `make clean`
räumt generierte Dateien in Root, Frontend und API auf.

Mikes Frage nach dem Root-`package.json` führte zur Trennung der beiden
Paketmanifeste: Frontend-Manifest und Lockfile liegen jetzt unter
`frontend/`, die API-Dateien weiter unter `api/`. Die Projektversion kommt
aus `frontend/package.json`. Dockerfile, Versionierungsziele,
Quellarchiv, Teststack-Helfer und Entwickleranleitungen wurden auf die
neuen Pfade angepasst.

Das Testserver-Skript zeigt ohne Argumente Hilfe und verlangt `--run` zum
Start. Kurzformen für seine Optionen sind ergänzt; Hilfetexte laufen über
den vorhandenen gettext-Katalog. Der Stack-Helfer reicht `--run` auch an
den StockInfo-Kindprozess weiter. Die CLI-Farben werden noch nicht aus einem
festen Dateipfad geladen: ProjectTools stellt inzwischen das installierbare
Paket `projecttools.ui.colors` bereit (Branch
`feat/package-python-tools`, Commit `f8cd8ec`). StockInfo
klärt mit T-82 unter `_tickets/20-ready/` in seinem eigenen Repository
den reproduzierbaren Installationsweg für seine Python-Umgebung. Bis dahin
verwendet dieses Skript die unfarbige native argparse-Hilfe.

Der Observer wies darauf hin, dass die Freigabe für `493c35c` weder die
neuen Makefile-Wege noch das neue `--run` deckt und dass die ersten
Startbeispiele noch veraltet waren. Die Beispiele in `README.md`,
`AGENTS.md` und der Browser-Fixture-Anleitung sind aktualisiert.
Der Nachtrag braucht eine neue unabhängige technische Prüfung.

**Prüfstand vor der Übergabe:** `make test` 803 Frontend- und 7 API-Tests
grün; Frontend-Build, beide Typprüfungen und Lint ohne Cache über npm grün.
`make -n build` zeigt wieder `./docker/build.sh --build "x86"`.
`make help` zeigt bei Entwicklung nur `dev`, `test` und `clean`.
`make dev` lieferte nach dem Paketumzug und der Makefile-Vereinfachung für
Vite und API jeweils HTTP 200;
beide Prozesse wurden anschließend über Overmind beendet. `make clean`
entfernte generierte Root-/Paketdateien, ließ die installierten Abhängigkeiten
stehen. Der Teststack startete mit `--stack --run`; Status zeigte alle drei
eigenen Prozesse und bestand Endpunkt-/CORS-Prüfungen. Stop entfernte
Prozesse und temporäre Kontodaten, Ports 5175, 8080 und 8899 sind frei.
Direkter Skriptaufruf ohne Argumente und deutsche
`--help`-Ausgabe enden mit 0; `-s -S` meldet ohne laufenden Stack
erwartungsgemäß Status 1. `msgfmt --check-format` und
`git diff --check` sind grün. Ein frisches `npm ci --prefix frontend` auf
dem Host konnte wegen Registry-Timeout auch mit freigegebenem Netzzugriff
nicht abgeschlossen werden. Die frische Frontend-Installation in der
Docker-Stage gelang; der Frontend- und der vollständige Container-Build
waren grün. Die vollständige Live-Abnahme von `make dev` bleibt Mikes
Prüfung.

**Doku-Abgleich:** `README.md` (Setup, Befehlsübersicht, Docker-Build,
Paketstruktur), `AGENTS.md` (lokaler Start, Bauen und Prüfen) und
`SOURCE.md` (Quellarchiv und Buildaufrufe) beschreiben die neuen Pfade.
Die Browser-Fixture-Anleitung verwendet `--run` und relative Pfade.
`docker/README.md` enthält keine Entwicklerbefehle und bleibt für den
unveränderten Containerbetrieb richtig.
Der Skill `task-verification-workflow` braucht keine Anpassung:
Board-Verfahren und Ticketformat sind unverändert.

## Nachtrag 2026-09-30 · Paketprüfungen und Makefile-Zuschnitt

Mike hat über Claude präzisiert, dass das Root-Makefile nur gemeinsame
Abläufe enthält. Diese Präzisierung gehört zum laufenden T-63-Auftrag,
weil sie denselben lokalen Entwicklungs- und Prüfweg betrifft; ein neues
Ticket würde denselben Umbau künstlich trennen. Unter „Entwicklung“ steht
allein `make dev`. `make test` prüft beide Pakete, und `make clean` ruft
deren eigene `clean`-Skripte auf und räumt danach den Root auf. Einzelne
Lint- und Typprüfungen laufen direkt über npm in `frontend/` und `api/`.

Frontend und API haben nun je eine eigene ESLint-Konfiguration und ein
`lint`-Skript. Das Frontend durchsucht nur `frontend/`; die API nur `api/`.
Beide Pakete bleiben im selben Repository, haben ein gemeinsames Image und
eine gemeinsame Version. Der Projektstruktur-Abschnitt des
`code-standards`-Skills auf dem PersonalSkills-Branch `docs/subproject-layout`
sieht ohne eigenen Lebenszyklus keine zusätzlichen
Teilprojekt-Makefiles vor. Die npm-Skripte decken die Einzelabläufe ab.

**Nachweise dieser Fassung:** `make test` bestand mit 803 Frontend- und 7
API-Tests. `npm --prefix frontend run lint -- --no-cache`,
`npm --prefix api run lint -- --no-cache` und beide `typecheck`-Skripte
bestanden. `make clean` lief zweimal hintereinander fehlerfrei; erzeugte
Dateien in Root, Frontend und API waren danach nicht mehr vorhanden. Eine
Kopie von Makefile und Paketmanifesten ohne `node_modules` bestand `make clean`
ebenfalls.
`make help` zeigte nur `dev` unter „Entwicklung“, `make version` las 0.5.0
aus `frontend/package.json`, und `git diff --check` war grün. Der vollständige
Docker-Build mit frischen `npm ci`-Schritten für Frontend und API bestand.
Die neue API-Lint-Konfiguration ist im Quellarchiv gelistet.

**Doku-Abgleich:** `AGENTS.md` („Bauen und prüfen“) nennt beide Lint- und
Typprüfungen als Übergabepflicht. `README.md` („Commands“) erklärt den
Root-Zuschnitt und die Paketbefehle. `SOURCE.md` verweist bereits auf die
Dateiliste in `frontend/package.json`; diese enthält nun beide
Lint-Konfigurationen. Die T-60-Spezifikation („Aufbau“, „Prüfschritte“) und
der Umsetzungsplan („Serverkern“, „Betrieb“, „Übergabe“) nennen jetzt
Frontend-Manifest, Paketprüfungen und `make dev` als Abnahmepfad.
`docker/README.md` enthält keine Entwicklerbefehle;
Containerstart und -betrieb sind von der Trennung der Lintläufe nicht
betroffen. Board-Vorlagen enthalten keine Make-Aufrufe und brauchen keine
Änderung. `task-verification-workflow` beschreibt weiterhin den gültigen
Übergabeweg ohne neue Board-Konvention.

## Technische Prüfung Runde 2

`claude`, 2026-09-30, an Handoff-Commit `6459dca57f4769ecea056e6d011d713fef09b869`
(Branch `t-63-reproduzierbarer-lokaler-teststack`). Geprüft wurde der gesamte
Unterschied seit der freigegebenen Runde 1 (`493c35c`), nicht nur der letzte
Commit. Gelesen: Codex-Lessons SP-CX-01, SP-CX-02, SP-CX-04 und SP-R-02.

**Ablauf am Board:** Codex hat die Übergabe mit `e21ad4f` committet, während
ich die Phase schon auf `reviewing` gesetzt hatte. Meine Feldänderung ist
dadurch in Codex' Commit gelandet. Der Inhalt stimmt; es ging nichts verloren.

| Prüfpunkt | Eigener Schritt | Ergebnis |
|---|---|---|
| `make test` | selbst ausgeführt | 65 Dateien / 803 Frontend-Tests, 3 Dateien / 7 API-Tests grün |
| Lint je Paket | `npm --prefix frontend run lint -- --no-cache`, dasselbe für `api` | beide Exit 0, ohne Warnung |
| Lint-Umfang | ESLint mit JSON-Ausgabe aus `frontend/` und `api/` | Frontend: 164 Dateien, nur unter `frontend/`; API: 12 Dateien, nur unter `api/` |
| Typprüfung je Paket | `npm --prefix frontend run typecheck`, dasselbe für `api` | beide Exit 0 |
| `make clean` | zweimal hintereinander | beide Exit 0, Arbeitsbaum danach sauber |
| `make help` | selbst gelesen | Entwicklung: nur `dev`; Prüfen: `test`; Wartung: `clean` |
| `make version` | selbst ausgeführt | 0.5.0 aus `frontend/package.json`; `api/package.json` hat kein eigenes Versionsfeld |
| `tag-*` | `make -n tag-patch` und `semVerBump` in BashLib gelesen | Aufruf aus `frontend/`: Die Automatik findet dort `package.json`; `npm version` aktualisiert auch das Frontend-Lockfile. Nicht ausgeführt, weil der Befehl committet, taggt und pusht |
| `make dev` | gestartet mit `STOCKPORTFOLIO_DATA_DIR` im Scratchpad | Vite 200, API `/healthz` 200, Vite-Proxy `/api/setup/status` 200 (`required: true`); Datenbank im angegebenen Ordner; `overmind quit` gibt 5175 und 8080 frei. `.local-data` blieb unberührt |
| Teststack | `--stack --run`, `-S -s`, zweiter Start, `--stack --stop` | Alle Endpunkt- und CORS-Prüfungen grün, `config.js` wird ausgeliefert; der zweite Start endet mit Exit 2 („already registered“); Stop gibt alle drei Ports frei, kein `stockportfolio-t63-*`-Ordner bleibt übrig; ohne Argumente zeigt das Skript die Hilfe mit Exit 0 |
| Dockerfile | gelesen | Frontend-Stage baut in `/app/frontend`; `outDir: '../dist'` ergibt `/app/dist`, das die Laufzeitstufe kopiert; `frontend/node_modules` ist in `.dockerignore`. Den Container-Build habe ich **nicht** selbst ausgeführt, hier gilt Codex' Beleg |
| Quellarchiv | `scripts/licenseAssets.ts`, `sourceFiles` und Test gelesen | Die Liste enthält beide Lockfiles und beide ESLint-Konfigurationen; der angepasste Test ist grün. Einen Build aus dem entpackten Archiv habe ich nicht ausgeführt |
| Doku | Diff von `README.md`, `AGENTS.md`, `SOURCE.md`, T-60-Nachtrag, Spezifikation und Plan gelesen | Beschreibt den geprüften Stand. Der Ersatz für `make docker-update` steht im README. `docker/README.md` enthält keine Entwicklerbefehle und bleibt richtig. Die STATUS-Aussage zur Versionsquelle ist nachgezogen |
| Bezeichner | Diff der Python- und Konfigurationsdateien gelesen | Neue Bezeichner sind englisch |
| ProjectTools `f8cd8ec`, StockInfo `ce69410` | nur gelesen | ProjectTools: `changelog.py` importiert jetzt `projecttools.*`; beim direkten Aufruf liegt `src/python` im Suchpfad, der Aufruf in `tag-*` funktioniert also weiter. StockInfo: nur Ticket und STATUS, kein Produktcode |

**Hinweise, nicht blockierend:**

1. **Veraltete Prüfzeilen in den aktiven Tickets (SP-CX-02).** Die Verify-Zeilen von
   [T-61](T-61-benutzergebundene-depotdaten-per-rest.md) (#6) und
   [T-62](T-62-sse-benachrichtigung-fuer-depots.md) (#5) verlangen noch
   `make lint` und `make typecheck`. Diese Ziele gibt es nicht mehr. Der Doku-Abgleich
   nennt nur die Board-Vorlagen. Bitte vor der Aktivierung von T-61 auf die
   Paketbefehle aus `AGENTS.md` umstellen. Die bisherigen Belege in T-60 und T-63
   beziehen sich auf ihre damalige Fassung und bleiben stehen.
2. **`scripts/licenseAssets.ts` wird nicht mehr gelintet.** Früher erfasste der
   Root-Lint auch `scripts/`. Jetzt prüft kein Paket die Datei. Die Typprüfung
   erreicht sie weiter über `frontend/vite.config.ts`.
3. **Das Ziel `docker-update` ist entfernt**, obwohl Mikes Liste es nicht nennt.
   Das README zeigt den direkten Aufruf `./docker/build.sh --update`. Der Skill
   `docker-conventions` (Tabelle „Makefile und Defaults“) nennt `docker-update`
   und `build-frontend` noch als StockPortfolio-Ziele. Der Skill gehört nicht zu diesem Repository;
   seine Pflege ist eine offene Übernahme für den Skill-Besitzer.
4. **Das README-Versionsabzeichen ist entfernt.** Ohne Root-`package.json` ist das
   folgerichtig. Der Doku-Abgleich erwähnt es aber nicht. Shields kann über
   `?filename=frontend%2Fpackage.json` weiter die Version anzeigen.
5. **Schon in Runde 1 vorhanden und dort übersehen:** Die Meldung „A local test
   stack is already registered …“ in `scripts/local_test_stack.py:290` ist nicht
   übersetzt und erscheint auch bei deutscher Ausgabe englisch.

**Urteil:** `approved` für `6459dca`. Die Hinweise ändern das Ergebnis nicht.
Mikes menschliche Abschlussentscheidung für T-63 steht aus, ebenso seine
T-60-Abnahme über `make dev`.

**Observer-Nachtrag zu Hinweis 3 (`claude-observer`, 2026-09-30):** Auf Mikes
Auftrag „Aktualisiere du den Skill“ entfernt PersonalSkills-Commit `d547005`
(Branch `docs/docker-conventions-stockportfolio-targets`, auf `master`
`642e9c0`) die Zeilen `docker-update` und `build-frontend` aus der
Target-Tabelle von `docker-conventions`. Der Skill nennt nun den direkten
Aufruf `BASE_IMAGE=<Referenz> ./docker/build.sh --update` und verweist für
den Frontend-Build auf das Paket-Skript. Die Skill-Tests liefen mit 24 Tests
grün. Noch nicht nach `master` gemergt; StockPortfolio-Code ist unverändert.

## Nachtrag 2026-09-30 · Hinweise aus Runde 2 korrigiert

Mike hat vor seiner Abnahme die Korrektur aller fünf Hinweise beauftragt,
einschließlich des vom Observer ergänzten T-60-Prüfpunkts. Die Freigabe für
`6459dca` bleibt auf diese Fassung beschränkt; dieser Nachtrag braucht
erneut eine unabhängige technische Prüfung.

1. Die noch geltenden Verify-Zeilen T-60 #5, T-61 #6 und T-62 #5 nennen
   jetzt `make test` sowie Lint und Typprüfung mit den npm-Skripten beider
   Pakete. Historische Belegabsätze bleiben auf ihrem damaligen Stand.
2. Der Quellarchiv-Helfer liegt unter `frontend/scripts/licenseAssets.ts`.
   Vite, Test, TypeScript-Konfiguration und Quellarchiv-Liste verwenden den
   neuen Pfad. Der Frontend-Lint erfasst die Datei; ein gezielter ESLint-Lauf
   meldete für sie null Fehler und null Warnungen.
3. Der Observer hat `docker-conventions` im separaten PersonalSkills-Branch
   `docs/docker-conventions-stockportfolio-targets` mit Commit `d547005`
   korrigiert. Die veralteten StockPortfolio-Targets stehen dort nicht mehr;
   der direkte Update-Aufruf und das npm-Build-Skript sind genannt. Mike hat
   die Integration ausdrücklich freigegeben; PersonalSkills-`master` wurde
   per Fast-Forward auf `d547005` gesetzt und ist sauber. Ein Push zu
   `origin` war nicht beauftragt und wurde nicht ausgeführt.
4. Das README zeigt das Versionsabzeichen wieder mit dem Dateiparameter
   `frontend/package.json`. Die offizielle Shields-Dokumentation nennt
   `filename` für den GitHub-package.json-Version-Badge. Auf `master` wird
   es die neue Datei erst nach der Integration dieser Projektfassung finden.
5. Die Meldung beim zweiten Stack-Start kommt jetzt aus dem gettext-Katalog.
   Der deutsche `.po`-Eintrag ist in die `.mo`-Datei übersetzt und per
   Katalog-Lookup geprüft.

**Prüfungen:** `make test` (803 Frontend- und 7 API-Tests), beide Paket-Lints
ohne Cache, beide Typprüfungen, Frontend-Build und vollständiger Docker-Build
bestanden. Der Frontend-Build erzeugte das Quellarchiv; darin ist
`frontend/scripts/licenseAssets.ts` enthalten. Der gezielte
Lizenzartefakt-Test bestand mit drei Tests. `msgfmt --check-format` und die
Python-Syntaxprüfung bestanden. Der erste Syntaxprüfungsversuch scheiterte
nur am gesperrten macOS-Python-Cache; die Wiederholung mit Cache unter
`/private/tmp` bestand.

**Doku-Abgleich:** `README.md` (Versionsabzeichen) zeigt wieder die Version
aus dem Frontend-Manifest. Die aktuellen Verify-Zeilen in T-60, T-61 und
T-62 verwenden die Paketbefehle aus `AGENTS.md`; historische Nachweise
bleiben unverändert. `SOURCE.md` beschreibt die vom Manifest gesteuerte
Dateiliste weiterhin zutreffend. `docker/README.md` behandelt den
unveränderten Containerbetrieb und braucht keine Anpassung. Die
PersonalSkills-Korrektur liegt getrennt im Skill-Repository und ist lokal in
dessen `master` integriert; `origin/master` steht noch auf `642e9c0`.

## Technische Prüfung Runde 3

`claude`, 2026-09-30, an Handoff-Commit `a8c7402b1ed991b9e6f27d0a9f912570cdbb9fdd`.
Geprüft wurde der Diff seit Runde 2 (`6459dca`), also die Korrektur der fünf Hinweise.

| Hinweis aus Runde 2 | Eigener Schritt | Ergebnis |
|---|---|---|
| 1 · Verify-Zeilen T-61/T-62 | Diff gelesen | T-61 #6 und T-62 #5 nennen jetzt die vier Paketbefehle aus `AGENTS.md`; T-60 #5 ebenfalls. Kein aktives Ticket nennt mehr `make lint` oder `make typecheck` als Prüfvorgabe |
| 2 · Lint für `licenseAssets.ts` | ESLint mit JSON-Ausgabe aus `frontend/`, Verweise gesucht | Die Datei liegt jetzt unter `frontend/scripts/`. Der Frontend-Lint erfasst 165 Dateien, darunter `scripts/licenseAssets.ts`, ohne Fehler oder Warnung. `tsconfig.json` schließt `scripts/**/*.ts` ein. Außerhalb der Ticketgeschichte gibt es keinen Verweis mehr auf den alten Pfad |
| 2 · Build und Quellarchiv | `npm --prefix frontend run build`, Archiv aufgelistet, danach `make clean` | Build mit Exit 0; `dist/stockportfolio-source.tgz` enthält `frontend/scripts/licenseAssets.ts` und beide Manifeste (161 Einträge); der Arbeitsbaum ist danach sauber |
| 3 · Skill `docker-conventions` | PersonalSkills `d547005` gelesen | Die Tabelle nennt `docker-update` und `build-frontend` nicht mehr; der direkte `build.sh --update`-Aufruf ist beschrieben. Der Commit liegt in PersonalSkills-`master` |
| 4 · Versionsabzeichen | README gelesen, Shields abgerufen | Die URL mit `filename=frontend%2Fpackage.json` meldet derzeit „frontend/package.json missing“, weil `origin/master` noch das alte Root-`package.json` enthält (`git ls-tree`). Das Abzeichen wird erst nach Merge und Push richtig; das ist erwartbar und kein Befund |
| 5 · gettext-Meldung | `msgfmt --check-format`, Teststack gestartet und zweiter Start | Der Katalog ist gültig; der zweite Start meldet deutsch „Ein lokaler Teststack ist bereits registriert; …“ mit Exit 2; Stop gibt alle drei Ports frei |

**Mitgelaufen:** `make test` mit 803 Frontend- und 7 API-Tests grün. Beide
Typprüfungen und der API-Lint enden mit Exit 0.
Den Docker-Build habe ich nicht selbst ausgeführt; hier gilt Codex' Beleg.

**Anmerkung ohne Befund:** T-60 #5 trägt weiter ✅. Die Zeile nennt jetzt aber
Befehle, die es bei der Runde-3-Freigabe von T-60 noch nicht gab. Für die aktuelle
Paketstruktur belegen T-63 Runde 2 und 3 diese Befehle. Die erneute technische
T-60-Prüfung nach dem Paketumbau steht laut T-60-Nachtrag weiter aus.

**Urteil:** `approved` für `a8c7402`. Mikes menschliche Abschlussentscheidung
für T-63 steht aus.

## Abnahmeablauf · Mike, 2026-09-30

Mike: „Ich bin bei der Abnahme, das sind die Punkte die mir bei der Abnahme
einfallen bzw. die ich sehe. Codex setzt sie gleich um. Dafür kann es kein
Ticket geben. […] Schlussendlich müssen aber dennoch diese Änderungen von
Claude abgenommen werden.“ Auf den Vorschlag des Observers hat Mike
geantwortet: „Ja, trag das so ein“.

Mike nimmt T-63 und T-60 gemeinsam ab. Dafür gilt:

1. **Kein eigenes Ticket.** Jeder Abnahmepunkt steht als kurzer Eintrag unter
   „Abnahme Mike · 2026-09-30“ in dem Ticket, zu dem er gehört: Anmeldeseite,
   Kontenverwaltung und Konto-API in
   [T-60](T-60-stockportfolio-server-und-benutzerkonten.md), Makefile und
   lokaler Entwicklungsweg hier in T-63. Frühere Nachträge und Belege bleiben
   unverändert; Änderungen am Stand stehen im Abnahmeabschnitt.
2. **Direkte Umsetzung durch Codex**, in kleinen Commits mit Ticketbezug.
   Während der Abnahme gibt es keine Übergabe je Punkt.
3. **Eine Übergabe**, sobald Mike die Abnahmepunkte für fertig erklärt:
   T-63 als Runde 4 mit dem Umfang seit `a8c7402`. Dieselbe Übergabe
   beauftragt ausdrücklich die ausstehende erneute technische Prüfung von
   T-60: Paketumbau und Abnahmepunkte.
4. **Abschluss unter Vorbehalt.** Mikes Abnahme wird wirksam, wenn Claude
   beide Fassungen freigibt. Vorher kein Merge nach `master` und kein Push;
   danach werden T-60 und T-63 gemeinsam integriert.

Der Observer meldet während der Abnahme nicht jede Einzeländerung. Er prüft,
dass die Punkte im Ticket stehen und vor der Freigabe nichts integriert wird.

## Abnahme Mike · 2026-09-30

- `make test` und `make clean` stehen im Help mit `make dev` unter
  „Entwicklung“. Die Targets und ihre Befehle bleiben unverändert. `AGENTS.md`
  (**Bauen und prüfen**) und `README.md` (**Setup**, Makefile-Übersicht)
  beschreiben die aktuelle Gruppierung. `make help` zeigt alle drei Ziele in
  dieser Gruppe. Runde 3 deckt diesen Abnahmepunkt noch nicht ab.
- Der StockInfo-Status liegt auf einer eigenen Route `/#/status`. Der
  API-Eintrag rechts unten und die Ausfallmeldung führen direkt dorthin.
  Das ist eine Navigationsänderung an der Funktion aus
  [T-52](../40-done/T-52-statuszeile-api-link-zum-status-tab.md).
  Der Status-Reiter der Einstellungen entfällt; „About“ bleibt rechts in
  der Einstellungsleiste. `README.md` (**Docker**), `docker/README.md`
  (**Configuration**, **Status and logs**) und `unraid/README.md` (**Data,
  API and verification**) beschreiben den neuen Weg.
- Der Python-Testserver nennt alle Optionen im Skriptkopf; Einzelserver- und
  Stackmeldungen laufen durch denselben gettext-Katalog. `--demo-accounts`
  erzeugt Passwörter mit Großbuchstabe, Ziffer und Sonderzeichen passend zur
  Konto-API. Die native `argparse`-Hilfe bleibt auf Python 3.11 zulässig
  unfarbig; eine Laufzeitabhängigkeit vom ProjectTools-Quellpfad entsteht nicht.
- Mikes weitere Vorgabe für dieses Skript: keine Farben, Themes oder
  Hints-Sektion. Die native unfarbige Hilfe zeigt stattdessen mehrere
  Beispiele sauber untereinander: Stack-Start, Demo-Konten, Status, Stop und
  Einzelserver. Der bereits vorhandene gettext-Katalog übersetzt die
  Überschrift. T-63 bleibt bis zu Mikes ausdrücklichem Urteil in Abnahme.
- **Neuerer Abnahmepunkt · Testserver-Theme:** Mike erwartet inzwischen die
  gemeinsame Gestaltung wie bei ProjectTools `changelog.py`. Das Skript
  verwendet optional `projecttools.ui.colors.HelpFormatter` und `Theme` für
  Hilfe, Fehler und Statusmeldungen. `MAKE_THEME` wählt das Theme; `NO_COLOR`,
  Umleitung und `TERM=dumb` bleiben farblos. Das Python-Paket kann über den
  auf jeder Maschine eingerichteten `.libs/ProjectTools`-Link in StockInfos
  bestehende venv installiert werden, ohne im Skript einen
  ProjectTools-Quellpfad zu suchen. Fehlt das Paket, funktionieren Start,
  Status, Stop und Hilfe schlicht mit nativer `argparse`-Hilfe. `README.md`
  (**Setup**) und `AGENTS.md` (**Bauen und prüfen**) nennen den Bezugsweg.
- „Anmeldung nicht erreichbar“ bei einzeln gestartetem Vite ist ein fehlender
  Konto-API-Prozess auf Port 8080. `make dev` startet beide Server; der
  isolierte Stack startet sie zusammen und meldet die konkreten Adressen.

**Eigenprüfung:** `make help` zeigt `dev`, `test` und `clean` gemeinsam unter
„Entwicklung“; `git diff --check` ist unauffällig. `make test` bestand mit
805 Frontend- und 8 API-Tests; Frontend- und API-Lint sowie beide Typechecks
bestanden. Die gemeinsame Prüfung ist auch in T-60 belegt.
Im Browser öffnete ein Klick auf den API-Eintrag die Statusseite; die
Einstellungen zeigten weder Status- noch Benutzerreiter und „About“ blieb
rechts.
`msgfmt --check-format` für den ergänzten Katalog und die deutsche
`--help`-Ausgabe bestanden. Der isolierte Stack startete mit
`--demo-accounts`; StockInfo, Konto-API und Vite sowie Kurs, Health und CORS
waren bereit. Danach stoppte `--stack --stop` alle eigenen Prozesse und
entfernte die temporären Kontodaten.

**Doku-Abgleich:** `README.md` (**Setup**) erklärt den Fehler bei einzeln
gestartetem Vite und nennt den gemeinsamen Start mit `make dev`. Die
synthetischen Passwörter erfüllen nun die dokumentierten Passwortregeln.
`docker/README.md` beschreibt ausschließlich den Containerbetrieb und
braucht für diese lokale CLI-Korrektur keine Änderung.
Der abschließende gemeinsame Lauf bestand mit 806 Frontend- und 8 API-Tests;
Frontend- und API-Lint sowie beide Typechecks bestanden. SP-CX-01 wurde am
beibehaltenen direkten Python-Aufruf ohne neue Startschicht geprüft;
SP-CX-02 am Abgleich von `README.md`, `AGENTS.md`, den aktiven Tickets und
den tatsächlichen CLI-Aufrufen.

## Übergabe an Claude · Runde 4 · 2026-09-30

Mike hat nach seinen Abnahmepunkten beauftragt: „OK, wenn du fertig bist,
übergib an claude“. Prüffassung ist `1d534ce` auf
`t-63-reproduzierbarer-lokaler-teststack`; der T-63-Umfang beginnt nach
`a8c7402`. Bitte den aktuellen Abnahmeabschnitt einschließlich Makefile,
Statusnavigation, Python-Teststack und Doku-Abgleich prüfen. Die frühere
technische Freigabe der Runde 3 bleibt auf ihren damaligen Stand bezogen.

Dieselbe Übergabe beauftragt ausdrücklich die ausstehende erneute technische
Prüfung von T-60: Paketumbau und alle Abnahmepunkte im
[T-60-Ticket](T-60-stockportfolio-server-und-benutzerkonten.md). Die Frage,
ob mehrere Admins lokale Depots teilen dürfen, ist für Claudes Beurteilung
bei T-61 vorgemerkt und wird hier nicht als beschlossene Regel behandelt.

**Prüfbelege:** `make test` 806 Frontend- und 8 API-Tests; Lint und Typecheck
beider Pakete erfolgreich. `msgfmt --check-format` und deutsche CLI-Hilfe
erfolgreich. Der isolierte Stack startete mit synthetischen Konten, bestand
Health-, Kurs-, CORS- und Browseradressprüfung und wurde anschließend
gestoppt. Das Login-Panel lag bei 900 px Höhe mit seiner Mitte auf 38,2 %.
`git diff --check` war unauffällig. Doku-Abgleich steht in beiden
Abnahmeabschnitten; für den lokalen Teststack brauchte `docker/README.md`
keine Änderung. Vor Claudes Freigabe erfolgen weder Merge noch Push.

## Technische Prüfung Runde 4 · mit erneuter T-60-Prüfung

`claude`, 2026-09-30, an Handoff-Commit `1d534ce24fe0ee98e4dc7a11b2c15b6c758eccb4`
(Diff seit `a8c7402`, 32 Dateien). Derselbe Auftrag umfasst die erneute
technische Prüfung von
[T-60](T-60-stockportfolio-server-und-benutzerkonten.md): Paketumbau und
Mikes Abnahmepunkte. Gelesen: Codex-Lessons SP-CX-01, SP-CX-02 und SP-CX-05
sowie meine Lessons SP-R-02 und SP-R-03. Nach SP-R-03 habe ich jede geänderte
Ansicht selbst mit ihren Nachbaransichten verglichen und eigene Screenshots gemacht.

**Werkzeug:** Die Chrome-Erweiterung war nicht verbunden. Den Browserdurchlauf
habe ich deshalb mit `playwright-core` und dem lokal vorhandenen Chromium im
Scratchpad ausgeführt. Er lief gegen den isolierten Teststack mit
`--stack --run --demo-accounts`. Die synthetischen Zugangsdaten las das Skript
direkt aus der temporären Datei; sie wurden nicht ausgegeben.

| Prüfpunkt | Eigener Schritt | Ergebnis |
|---|---|---|
| Tests, Lint, Typen | `make test`, beide Lint-Läufe mit `--no-cache`, beide Typprüfungen, `git diff --check a8c7402 1d534ce` | 67 Dateien / 806 Frontend-Tests, 3 / 8 API-Tests; alles Exit 0 |
| Makefile | `make help` | „Entwicklung“ zeigt `dev`, `test`, `clean`; `AGENTS.md` und `README.md` beschreiben dasselbe |
| Passwortregel (API) | `validatePassword` und neuer Test gelesen | 12–1024 Zeichen, `\p{Lu}`, `\p{Nd}`, `[\p{P}\p{S}]`; gilt für Setup, Kontoanlage, Reset und Wechsel. Der Login prüft keine Regel, bestehende Passwörter bleiben also gültig |
| Setup-Code | `api/src/index.ts` gelesen | Der Code wird nur ausgegeben, solange kein Admin existiert; die README-Aussage „each API start prints a new code“ stimmt |
| Rahmen-Wächter | Regex des Tests `pageFrame.spec.ts` gegen `7b4cbbe`, `a8c7402`, `1d534ce` angewendet | `UserAdminView` ist in den alten Fassungen „MISSING“, in `1d534ce` mit Rahmen: der Test unterscheidet richtig und falsch |
| Oberkante der Seiten | h1-Position bei 1440 und 390 px gemessen | Benutzerverwaltung, Einstellungen und Status: h1 bei 88 px, Kopfzeile endet bei 56 px, also übereinstimmend |
| Anmeldedialog | Mittelpunkt des Panels gemessen | 0,382 bei 1440 × 900 und bei 390 × 844; die Unterzeile „Tolerance-Band Rebalancing“ fehlt |
| Admin-Ansicht | Screenshots und DOM | Das eigene Konto hat keine Aktionen, das andere Konto hat „Passwort zurücksetzen“ und „Deaktivieren“; Passwortkriterien und Fragezeichen-Hilfe sind sichtbar |
| Konto-Menü | geöffnet | Enthält nur „Abmelden“; nach dem Abmelden steht die Adresse auf `/#/`. Nach 0, 500 und 2000 ms gemessen; eine erste Messung mit `/#/admin/users` war ein Artefakt meines Skripts nach vorherigem Laden von `/admin/users` |
| Normaler Nutzer | Anmeldung ab `/#/rebalancing`, erzwungener Wechsel | Zuerst „Passwort ändern“ unter `/#/`, danach „Depotzugriff folgt“ unter `/#/`; kein Personen-Icon; `GET /api/admin/users` liefert 403 |
| Status-Route | Screenshot `/#/status`, Reiter der Einstellungen | Eigene Seite mit Rahmen; die Einstellungen haben keinen Status- oder Benutzerreiter mehr, „About“ steht rechts |
| Teststack-CLI | Katalogabgleich per Skript, `msgfmt --check-format`, `.mo` neu erzeugt und verglichen | Alle 72 Meldungen aus `translate(...)` stehen im deutschen Katalog, die `.mo`-Datei ist aktuell. Die Demo-Passwörter (`Aa1!` + Zufall) erfüllen die Regel; der Stack mit Demo-Konten lief, und `--stop` gab alle Ports frei |
| Doku | Diffs von `README.md`, `docker/README.md`, `unraid/README.md`, `AGENTS.md` gelesen; nach „Settings → Status“ und „Einstellungen → Benutzer…“ gesucht | Beide READMEs stimmen bei Passwortregel, Status-Seite, Personen-Icon und Kontenzugriff überein. Reste siehe Hinweis 1 |
| Paketumbau (T-60) | in T-63 Runden 2 und 3 geprüft | Gilt unverändert; dieser Diff berührt Paketstruktur und Build nicht |

**Befunde (blockierend):**

1. **Die Kopfzeile verdeckt bei 390 px Navigationseinträge.** Gemessen auf
   `/#/settings` als Admin: Die Navigation hat 139 px Platz, braucht aber 217 px
   (`scrollWidth`), und `overflow-x` ist `visible`. Dadurch liegen „Assets“
   (x 185–209), „Einstellungen“ (213–237) und das neue Personen-Icon
   (241–265) unter „Aktualisieren“ (203–247) und dem Konto-Knopf
   „test-admin“ (259–374). Im Screenshot sieht man bei 390 px nur „Rebalancing“
   und den aktiven Unterstrich unter dem Aktualisieren-Knopf. Auf dem Handy
   sind Einstellungen und Benutzerverwaltung damit nicht erreichbar.
   Ursache sind die neuen Elemente dieser Runde: Der Konto-Knopf zeigt jetzt
   den Benutzernamen (115 px), und das Personen-Icon kommt als weiterer
   Eintrag dazu. Rechnerisch passte die Navigation mit dem früheren
   „Abmelden“-Knopf gerade noch. Diesen Vergleich habe ich nicht mit einem
   Screenshot von `a8c7402` belegt. T-60 verlangt die Bedienung bei 390 px.
   **Erwartet:** Bei schmaler Breite sind alle Navigationseinträge bedienbar,
   etwa indem der Konto-Knopf dort nur das Symbol zeigt. Beleg ist ein
   Screenshot oder eine Messung bei 390 px für Admin und normalen Nutzer.
2. **Die Überschrift der Benutzerverwaltung ist größer als bei den Nachbarn
   (SP-R-03).** Einstellungen (`settings__title`), Assets (`instruments__title`)
   und Status verwenden `font-size: 1.5rem; font-weight: 600`. Das h1 in
   `UserAdminView.vue` hat keine Größe und erscheint mit der Browser-Vorgabe
   von 2em in Fett. Im Vergleich bei 1440 px ist das deutlich sichtbar.
   **Erwartet:** dieselbe Titelgestaltung wie bei den Nachbaransichten.

**Hinweise (nicht blockierend):**

1. **Zwei veraltete Pfadangaben.** `docs/superpowers/specs/2026-09-29-stockportfolio-server-design.md:103`
   und T-60, Akzeptanzkriterium 3 (Zeile 54), nennen noch „Einstellungen →
   Benutzerverwaltung“. Der Zugang ist jetzt das Personen-Icon in der
   Kopfzeile (SP-CX-02). Die Abweichung „nur erster Admin“ ist dagegen
   ausdrücklich vermerkt und für T-61 zurückgestellt.
2. **Die Kopfzeile baut einen eigenen Nav-Eintrag.** `.topbar__admin` stellt
   die Optik von `UxNavItem` nach, samt aktivem Unterstrich, weil das
   Fundament kein Personensymbol hat. Nach `AGENTS.md` gehört ein gemeinsames
   Symbol ins Fundament. Sonst laufen die beiden Stile beim nächsten Update
   auseinander.
3. **Die Karten sind nachgebaut.** `StatusView` und `UserAdminView` schreiben
   Rahmen, Radius und Hintergrund selbst. `ux-foundation` bietet dafür
   `@include card-surface`.
4. **Der direkte Pfad `/admin/users` funktioniert nur über die API.** Die API
   leitet mit 302 auf `/#/admin/users` weiter (geprüft auf :8080). Unter Vite
   landet der Pfad auf dem Dashboard. Das ist älterer Stand und betrifft nur
   die Entwicklung.

**Urteil:** `changes_requested` für `1d534ce`. Das gilt ebenso für die
erneute T-60-Prüfung, weil Befund 1 T-60s Anforderung an 390 px betrifft. Alle
übrigen Abnahmepunkte, die API-Passwortregel, der Rahmen-Wächter, die
Statusroute, die Teststack-CLI und die Doku habe ich selbst geprüft; sie
sind ohne Befund. Eine Nachprüfung beschränkt sich auf die beiden Befunde
und die Hinweise, soweit Codex sie aufgreift.

## Nacharbeit zu Runde 4 · 2026-09-30

Die beiden blockierenden Befunde sind im
[T-60-Nachtrag](T-60-stockportfolio-server-und-benutzerkonten.md#nacharbeit-zu-claudes-runde-4--2026-09-30)
mit der 390-px-Gegenprobe und dem Titelvergleich belegt. Die zwei veralteten
Zugangsangaben aus Hinweis 1 sind berichtigt. `StatusView` verwendet für
seine Karte wie die Benutzerverwaltung nun `card-surface` aus
`ux-foundation` (Hinweis 3); die Oberflächenwerte bleiben gleich.

Hinweis 2 bleibt bewusst lokal: Das Personen-Icon kommt nur in dieser App
vor. Der UX-Skill lässt app-spezifische Symbole bis zu einem zweiten Bedarf
hier; `UxNavItem` bietet derzeit keinen Icon-Slot. Eine generische Änderung
am externen Fundament gehört nicht zu dieser Korrekturrunde. Hinweis 4
beschreibt einen älteren direkten Vite-Pfad; der dokumentierte Entwicklungsweg
ist `make dev` beziehungsweise der isolierte Stack. Kein aktueller
Abnahmepunkt verlangt den direkten Pfad.

**Prüfung:** `make test` bestand mit 806 Frontend- und 8 API-Tests; Lint und
Typecheck beider Pakete sowie der Frontend-Build bestanden. Browserbelege
und Doku-Abgleich stehen im T-60-Nachtrag. `README.md` und
`docker/README.md` beschreiben die kompakte Kopfzeile gleichlautend;
die Docker-Hub-README-Vorschau bestand einschließlich Größenprüfung.
`AGENTS.md` und `unraid/README.md` benötigen dazu keine Anpassung.
Mike hat nach Abschluss dieser Anpassungen den unmittelbaren Start von T-61
und T-62 ohne weiteren Warteschritt beauftragt. Die Nachprüfung dieser
Fassung durch Claude bleibt vor der gemeinsamen Integration von T-60/T-63
erforderlich.

## Übergabe an Claude · Runde 5 · 2026-09-30

Prüffassung ist `91b84da` nach dem Runde-4-Handoff `1d534ce`.
Bitte die beiden blockierenden Befunde gezielt nachprüfen: sichtbare und
bedienbare Navigation bei 390 px sowie die Titelgröße der
Benutzerverwaltung. Hinweis 1 (Zugangspfad) und Hinweis 3
(`card-surface`) sind ebenfalls korrigiert; die Einordnung von Hinweis 2
und 4 steht im Nachtrag. Die erneute T-60-Prüfung bleibt Teil desselben
Auftrags. Mikes T-60-Abnahme gilt nach den nun ausgeführten Anpassungen;
die technische Freigabe fehlt noch.

Vor Übergabe erneut geprüft: `make test` (806/8), beide Lints, beide
Typechecks, Frontend-Build, Docker-Hub-README-Vorschau und
`git diff --check`. Der mobile Browserbefund und der Doku-Abgleich stehen
im T-60-Nachtrag. Der isolierte Teststack ist wieder gestoppt. Merge und
Push bleiben bis zur technischen Freigabe aus.

## Technische Prüfung Runde 5 · mit T-60

`claude`, 2026-09-30, an Handoff-Commit `91b84da306663d10f40ddffa91f59e8f5aacdefb`
(Diff seit `1d534ce`). Geprüft wurden die beiden Befunde aus Runde 4 und die
aufgegriffenen Hinweise. Der Browserdurchlauf lief wieder mit `playwright-core`
gegen den isolierten Stack mit `--demo-accounts`. Gemessen habe ich bei 320,
390, 768 und 1440 px und zusätzlich alle Breiten von 360 bis 1280 px in
20-px-Schritten.

| Punkt | Eigener Schritt | Ergebnis |
|---|---|---|
| Befund 1 · 390 px | Positionen und `elementFromPoint` für jeden sichtbaren Nav-Link, Screenshot | **Behoben für Telefone.** Bei 390 px: Die Navigation hat 169 von 169 px, der letzte Link endet bei 233, die Knöpfe beginnen bei 274, alle vier Links sind klickbar. Bei 320 px ebenso (Knöpfe ab 204). Der Konto-Knopf zeigt nur das Symbol; `aria-label` „Konto test-admin: Menü öffnen“. Das Logo heißt „Dashboard“ und führt zu `/#/`, das Personen-Icon zu `/#/admin/users`. Kein horizontales Scrollen |
| Befund 2 · Überschrift | berechneter Stil bei 390 und 1440 px | **Behoben.** Benutzerverwaltung, Einstellungen und Status haben jeweils 24px, Gewicht 600, Oberkante 88 px |
| Hinweis 1 · Pfadangaben | Diff gelesen | Spezifikation und T-60-Kriterium 3 nennen das Personen-Icon |
| Hinweis 3 · `card-surface` | Diff gelesen | `StatusView` und `UserAdminView` nutzen den Mixin. Schatten und Innenabstand bleiben lokal; das ist gleichwertig |
| Doku | `README.md` und `docker/README.md` gelesen | Beide beschreiben den kompakten Konto-Knopf gleich |
| Tests | `make test`, Frontend-Lint und -Typprüfung, `git diff --check` | 806 + 8 Tests grün, alles Exit 0. Der API-Code ist in dieser Runde unverändert |

**Befunde (blockierend):**

1. **Bei Tablet-Breite überlappt die Kopfzeile weiterhin.** Bei 768 px
   (Screenshot `r5-settings-768`) braucht die Navigation 586 px und hat 414 px.
   Der Markenname überlagert „Dashboard“, und „Benutzerverwaltung“
   (x 565–729) liegt unter dem Aktualisieren-Knopf und dem Konto-Knopf, der
   ab x 573 beginnt. `elementFromPoint` trifft den Knopf und nicht den Link. Der
   Scan meldet den Verwaltungslink ab etwa 768 bis 860 px als nicht klickbar.
   Ab `md` zeigt die Leiste wieder alle Beschriftungen und den Benutzernamen.
   Die Korrektur dieser Runde gilt nur unterhalb von `sm`/`md`. Die Ursache ist
   dieselbe wie in Runde-4-Befund 1: Das zusätzliche Personen-Icon und der
   Benutzername passen dort nicht mehr. T-60 nennt ausdrücklich nur 390 und
   1440 px. Eine sichtbar zerbrochene Kopfzeile in einem gängigen
   Tablet-Hochformat ist trotzdem ein Befund.
   **Erwartet:** Zwischen `md` und der Breite, ab der alles passt, überlappt
   nichts, etwa indem Beschriftungen oder der Benutzername dort später
   erscheinen. Beleg ist ein Breiten-Scan ohne nicht klickbaren Link.
2. **Mikes T-44-Entscheidung zu Rebalancing ist stillschweigend aufgehoben.**
   [T-44](../40-done/T-44-aktien-etfs-und-linkgruppen-trennen.md) hält Mikes
   Vorgabe fest: „In der mobilen Navigation soll das Rebalancing-Symbol
   entfallen; der Menüpunkt bleibt erreichbar und verständlich beschriftet“.
   Umgesetzt war das mit `.topbar__rebalancing`. `7eb4224` entfernt diese
   Regel: Bei 390 px ist Rebalancing jetzt ein reines Symbol ohne sichtbare
   Beschriftung (`labelVisible: false`). Die T-60-Nacharbeit erwähnt T-44
   nicht. Mikes Erklärung „T-60 erledigt“ nennt diese Abkehr nicht und deckt
   sie daher nicht erkennbar ab.
   **Erwartet:** Entweder die T-44-Regel wiederherstellen, soweit der Platz es
   zulässt (Rebalancing als Wort, übrige Einträge als Symbole), oder Mikes
   ausdrückliche Entscheidung zur Aufhebung im Ticket festhalten.

**Urteil:** `changes_requested` für `91b84da`, ebenso für T-60. Beide
Runde-4-Befunde sind für die geprüften Breiten 390 und 1440 px behoben. Die
Nachprüfung beschränkt sich auf die Kopfzeile: Breiten-Scan und die
Rebalancing-Beschriftung.

## Nacharbeit zu Runde 5 · 2026-09-30

Beide blockierenden Befunde sind im
[T-60-Nachtrag](T-60-stockportfolio-server-und-benutzerkonten.md#nacharbeit-zu-claudes-runde-5--2026-09-30)
mit Umsetzung und Browser-Gegenprobe belegt. Die Kopfzeile zeigt allgemeine
Labels und Benutzernamen erst ab `xl`, die Wortmarke zwischen `sm` und `md`
nicht. Auf Telefonen ab 23 rem steht Rebalancing gemäß Mikes T-44-Entscheidung
als Wort ohne Symbol; darunter bleibt der Link als benanntes Symbol erhalten.
Ein Scan von 360 bis 1280 px in 20-px-Schritten fand keinen verdeckten Link,
keine Überlappung und kein waagrechtes Scrollen. Die Umschaltpunkte und 320 px
wurden zusätzlich geprüft. SP-CX-06 aus der Observer-INBOX ist damit anhand
der tatsächlichen Klickziele angewandt, nicht nur zitiert.

Den von Mike zusätzlich beanstandeten Python-Einstieg habe ich strukturell
bereinigt: `parse_args()` parst und validiert, `main()` wählt Stack oder
Einzelserver, und der Einzelserver wird erst nach dieser Wahl geladen. Beim
Import des Skripts wird kein Server mehr gestartet. Der dokumentierte Aufruf
und alle Optionen bleiben gleich. Geprüft wurden `--help` und der Aufruf ohne
Argumente sowie Start, Status und Stop sowohl des vollständigen Stacks als
auch des einzelnen StockInfo-Testservers. Beide Starts meldeten die Ports;
der Stack bestand seine Endpoint- und CORS-Prüfungen. `ruff check` bestand.

`make test` bestand mit 806 Frontend- und 8 API-Tests. Beide Lints, beide
Typechecks, Frontend-Build und `git diff --check` bestanden. Die Vorschau von
`docker/README.md` für Docker Hub bestand einschließlich Größenprüfung.

**Doku-Abgleich:** Die gemeinsam geprüften Abschnitte in `README.md` (**Where
the data lives**) und `docker/README.md` (**Configuration**) nennen die
mobile Rebalancing-Beschriftung übereinstimmend. Die Architektur-Spezifikation,
`AGENTS.md`, `unraid/README.md` und die Unraid-Vorlage enthalten keine
entgegenstehende Navigationsanweisung. Der gemeinsame Workflow-Skill und seine
Vorlagen ändern sich durch die Anwendung von SP-CX-06 nicht. Der Python-Einstieg
behält seine dokumentierte CLI; `README.md` (**Setup**) und `AGENTS.md` (**Bauen
und prüfen**) brauchen dafür keine weiteren Änderungen.

## Übergabe an Claude · Runde 6 · 2026-09-30

Prüffassung ist `26b59ed` nach dem Runde-5-Handoff `91b84da`. Bitte die
beiden Kopfzeilenbefunde aus Runde 5 anhand eines eigenen Breiten-Scans und
der sichtbaren Rebalancing-Beschriftung nachprüfen. Die erneute technische
T-60-Prüfung bleibt Teil dieses Auftrags. Der Python-Testserver erhielt auf
Mikes Hinweis einen `main()`-Einstieg; bitte besonders prüfen, ob Hilfe,
Stack und Einzelserver dadurch weiter wie dokumentiert funktionieren.

Vor der Übergabe bestanden `make test` (806 Frontend-, 8 API-Tests), beide
Lints, beide Typechecks, Frontend-Build, Python-`ruff check`, die echte
Docker-Hub-README-Vorschau und `git diff --check`. Der isolierte Stack und
seine temporären Daten sind gestoppt. Doku-Abgleich und SP-CX-06-Anwendung
stehen im Nachtrag. Merge und Push bleiben bis zu Claudes Freigabe aus.

## Technische Prüfung Runde 6 · mit T-60

`claude`, 2026-09-30, an Handoff-Commit `26b59edc2a272cb550de1ef153930b45e5aa4d5b`
(Diff seit `91b84da`). Geprüft wurden die beiden Befunde aus Runde 5 und der
neue `main()`-Einstieg des Testservers. Der Browserdurchlauf lief wie in
Runde 4 und 5 mit `playwright-core` gegen den isolierten Stack mit
`--demo-accounts`.

| Punkt | Eigener Schritt | Ergebnis |
|---|---|---|
| Befund 1 · Kopfzeile über alle Breiten | 31 Breiten von 320 bis 1920 px, darunter alle Umschaltpunkte (367/368, 639/640, 767/768, 1023/1024, 1279/1280). Je sichtbarem Nav-Link `elementFromPoint` in der Mitte; Marke, Navigation und Aktionen auf Überlappung, Nav-Überlauf und seitliches Scrollen geprüft; Screenshots bei 390, 768, 1024 und 1280 px | **Behoben.** Kein verdeckter Link, keine Überlappung, kein Überlauf, kein seitliches Scrollen. Unter 640 px: 4 Links (Dashboard über das Logo); ab 640 px: 5 Links |
| Befund 2 · T-44 | Sichtbarkeit von Beschriftung und Symbol bei Rebalancing je Breite | **Behoben.** Ab 368 px (23 rem) bis 767 px steht „Rebalancing“ als Wort ohne Symbol. Nur unter 368 px und damit enger als die frühere Vorgabe erscheint das Symbol mit zugänglichem Namen. Das ist in beiden READMEs so beschrieben |
| Python-Einstieg | Diff mit `-w` gelesen; Aufruf ohne Argumente; Import per `importlib` ohne Start; Einzelserver `-r`, `-s`, `-t`, danach erneut `-s`; Stack `-S -r -d`, `-S -t` | Die Logik ist unverändert, nur in `parse_args`/`run_single_server`/`main` gekapselt; keine `global`-Anweisungen. Ohne Argumente: Hilfe, Exit 0. Der Import startet nichts. Einzelserver: `/health` 200, Status 0, Stop 0, Port frei, danach Status 1. Stack: Endpunkt- und CORS-Prüfung erfolgreich, Stop entfernt alles |
| Tests | `make test`, Frontend-Lint und -Typprüfung, `git diff --check` | 806 + 8 grün, alles Exit 0 |
| Doku | `README.md` und `docker/README.md` gelesen | Beide sagen dasselbe über Konto-Knopf, Logo und Rebalancing-Beschriftung |

**Hinweise, nicht blockierend:**

1. **Zwischen 768 und 1279 px zeigt die Navigation nur Symbole.** Das gilt auch
   für Laptop-Breiten wie 1024 px, wo rechts viel Platz frei bleibt
   (Screenshot `r6-1024`). Vor T-60 erschienen die Beschriftungen ab `md`.
   Die Ansicht ist bedienbar, und jedes Symbol hat einen zugänglichen Namen.
   Ob die Beschriftungen früher zurückkommen sollen, etwa ab `lg` ohne
   Benutzernamen, ist eine Gestaltungsfrage für Mike.
2. **`sys.dont_write_bytecode = True` ist entfallen.** Wird das Skript ohne
   `-B` aufgerufen, etwa direkt über den Shebang, entsteht `scripts/__pycache__`.
   Ausgeschlossen wird es nur über Mikes globale Git-Ignore-Datei, nicht über
   die Projekt-`.gitignore`. Beim Aufräumen nach meiner `py_compile`-Probe
   habe ich eine dort schon vorhandene Cache-Datei mitgelöscht; das war nur
   generierter Cache.

**Urteil:** `approved` für `26b59ed`, ebenso die erneute technische Prüfung
von T-60 samt Paketumbau (Runden 2 bis 6). Mike hat die T-60-Abnahme erklärt.
Mikes Abschlussentscheidung für T-63 und die gemeinsame Integration beider
Tickets stehen aus.

## Abschlussstand nach Runde 6 · 2026-09-30

Die technische Freigabe liegt vor. Mike hat T-60 ausdrücklich für sich
abgeschlossen und den unmittelbaren Beginn von T-61/T-62 beauftragt. Eine
ausdrückliche menschliche Abschlussentscheidung für T-63 ist damit noch nicht
festgehalten. Der Observer hat vor dem Archivieren auf diese Trennung
hingewiesen. T-60 und T-63 bleiben deshalb in `30-doing/`; der gemeinsame
Merge und Push warten auf Mikes T-63-Entscheidung. T-61 kann auf einem eigenen,
auf der geprüften Fassung aufbauenden Branch beginnen.

## Weitere Abnahmepräzisierung · CLI-Hilfe · 2026-09-30

Die einzelne `Example:`-Zeile der Hilfe ist durch fünf getrennte
Beispielzeilen ersetzt. `argparse.RawDescriptionHelpFormatter` erhält deren
Zeilenumbrüche. Das Skript enthält weiterhin keine Farb-, Theme- oder
Hints-Ausgabe und lädt `projecttools.ui.colors` nicht. Der Skriptkopf und die
Aktionsoptionen bleiben unverändert.

**Eigenprüfung:** `--help` und Aufruf ohne Argumente zeigten die Beispiele
zeilenweise und endeten jeweils mit Exit 0. Die deutsche Ausgabe mit
`LC_ALL=de_DE.UTF-8` zeigte „Beispiele:“ und dieselben fünf Aufrufe.
`msgfmt --check-format` erzeugte den aktuellen deutschen Katalog; `ruff check`
für beide Python-Dateien und `git diff --check` bestanden.

**Doku-Abgleich:** `README.md` (**Setup**) und `AGENTS.md` (**Bauen und prüfen**)
nennen weiterhin die gültigen Aufrufe. `docker/README.md` beschreibt den
Containerbetrieb und betrifft die lokale Skript-Hilfe nicht. Keine Änderung
an Board- oder Lessons-Konventionen; der `task-verification-workflow`-Skill
bleibt unverändert. T-60 ist von Mike abgenommen; T-63 bleibt in Abnahme.

## Weitere Abnahmepräzisierung · CLI-Theme · 2026-09-30

Mikes neuerer Abnahmepunkt aus der Observer-INBOX ersetzt die frühere
Festlegung auf durchgehend unfarbige Hilfe. `scripts/cli_theme.py` bindet
`projecttools.ui.colors` als optional installiertes Paket ein. Ist es
vorhanden, formatieren `HelpFormatter` und `Theme` Optionen, Beispiele,
Fehler sowie Statusmeldungen nach `MAKE_THEME`. Ohne Paket bleiben alle
Aktionen und die native `argparse`-Hilfe nutzbar. Im Skript steht kein
absoluter ProjectTools-Quellpfad. ProjectTools-`master` enthält das
paketierbare Python-Modul nach Mikes Zustimmung lokal als Fast-Forward
`f8cd8ec`; `origin/master` wurde nicht verändert. Die unversionierte
ProjectTools-`AGENTS.md` blieb unberührt.

**Eigenprüfung:** Aus dem ProjectTools-Stand wurde ein Wheel gebaut und in
ein isoliertes Testverzeichnis installiert. Mit diesem Paket zeigte ein
PTY-Aufruf unter `MAKE_THEME=ocean`, `TERM=xterm` und ohne `NO_COLOR` ANSI-
Farben in Hilfe und Fehlern. `NO_COLOR=1` und umgeleitete Ausgabe blieben
farblos; die fünf Beispiele stehen weiterhin untereinander. Ohne Paket
erschienen Hilfe und Fehlermeldung im nativen Format; die deutsche Hilfe
zeigte „Beispiele:“ und alle fünf Zeilen. `ruff check` für die drei
Python-Dateien bestand.

Der isolierte Stack startete mit synthetischen Konten auf Fixture-Port
18898, bestand `--stack --status` einschließlich Endpunkt-, Kurs- und
CORS-Prüfung und wurde mit `--stack --stop` samt temporären Kontodaten
beendet. Port 8899 war durch eine fremde registrierte State-Datei belegt;
deren Prozess und Daten blieben unberührt. Ein erneuter interaktiver
Browserdurchlauf fand für diese CLI-Änderung nicht statt.

`make test` bestand mit 806 Frontend- und 8 API-Tests, beide Lints ohne
Cache, beide Typechecks und `git diff --check` bestanden. Der erste Lauf im
Worktree traf den bekannten Docker-Test unter macOS-Bash 3.2; mit Bash 5.3
im `PATH` bestand der unveränderte Gesamtumfang. ProjectTools-
`tests/python/test_cli_themes.py` bestand mit 9 Tests und 11 übersprungenen
Fällen.

**Doku-Abgleich:** `README.md` (**Setup**, **Command-line themes**) und
`AGENTS.md` (**Bauen und prüfen**) erklären Installation, `MAKE_THEME` und
den Fallback. `docker/README.md` (**Data and backups**, **Configuration**)
betrifft den Container und hat keinen Aufruf dieses lokalen Skripts;
inhaltlich bleibt es unverändert. Keine Board- oder Lessons-Konvention
wurde geändert.

## Technische Prüfung Runde 7

`claude`, 2026-09-30, an Handoff-Commit `bd4faecb64f6fd92db2c2942055a94eed063da17`
(Branch `t-63-reproduzierbarer-lokaler-teststack`, Diff seit `26b59ed`).
Geprüft habe ich Mikes Theme-Abnahmepunkt in einem eigenen, abgetrennten
Worktree. Angewandt habe ich SP-R-04 (Scout Rule) und die projektweite
StockInfo-Grenze aus `AGENTS.md`.

| Punkt | Eigener Schritt | Ergebnis |
|---|---|---|
| Code | `scripts/cli_theme.py`, `local_test_stack.py` und `stockinfo-test-server.py` gelesen | Optionaler Import: Nur ein fehlendes `projecttools`-Modul führt zum schlichten Rückfall, andere Importfehler werden weitergereicht. Kein Rechnerpfad im Skript. Fehler, Status und Stop laufen über `print_message` mit Rollen `SUCCESS`, `WARNING` und `DANGER` |
| Ohne Paket | StockInfo-`.venv` (ohne `projecttools`), `--help` in eine Pipe, falsche Optionskombination | Native Hilfe mit „Beispiele:“ und fünf Zeilen untereinander, Exit 0; schlichte argparse-Fehlermeldung |
| Mit Paket | Für die Probe nur `PYTHONPATH` auf ProjectTools-`master` `f8cd8ec`, ohne Installation; Pseudo-Terminal über `script`, `MAKE_THEME=ocean`, `TERM=xterm` | Hilfe mit 21 farbigen Zeilen (Gruppen, Optionen, Beschreibungen); Fehler rot mit „✗“, „kein Stack registriert“ gelb |
| `NO_COLOR` und Pipe | dieselbe Probe mit `NO_COLOR=1` beziehungsweise umgeleiteter Ausgabe | 0 farbige Zeilen |
| Katalog, Lint | `msgfmt --check-format`, `.mo` neu erzeugt und verglichen, `ruff check`, `py_compile` | Katalog gültig, `.mo` aktuell, Ruff „All checks passed“ |
| Umfang | `git diff --stat 26b59ed bd4faec -- frontend api` | Frontend und API unverändert; ein erneuter Testlauf ist dafür nicht nötig |
| StockInfo-Umgebung | `pip show mmit-projecttools` und Import in StockInfos `.venv` | Nicht installiert; StockInfos Umgebung ist unverändert |

**Befund (blockierend):**

1. **Die Anleitungen schreiben eine Installation in StockInfos Python-Umgebung
   vor und greifen damit StockInfo-T-82 vor.** `README.md` (**Command-line
   themes**) und `AGENTS.md` (**Bauen und prüfen**) nennen als Weg
   `../StockInfo/.venv/bin/python -m pip install -e ./.libs/ProjectTools`.
   Genau diese Frage klärt StockInfos eigenes Ticket
   `20-ready/T-82-python-paket-fuer-konsumententests-klaeren.md` (Stand
   `ce69410`, noch nicht aktiviert). Es hält ausdrücklich fest: „Keine
   vorweggenommene Entscheidung über StockInfos Abhängigkeiten“ und „keine
   automatische Änderung fremder Projekt-venvs“. `AGENTS.md` sagt: Braucht die
   App etwas vom Dienst, entsteht ein StockInfo-Ticket, und über die Lösung
   entscheidet, wer den Dienst kennt. Dazu kommt ein technisches Risiko: Die
   editierbare Installation bindet StockInfos `.venv` an den Symlink
   `.libs/ProjectTools` dieses Repositorys. StockInfo deklariert das Paket
   nicht, und ein Neuaufbau oder Abgleich seiner Umgebung entfernt es wieder
   still. Mikes Zustimmung laut Übergabe betrifft den lokalen Fast-Forward von
   ProjectTools-`master`, nicht diesen Installationsweg.
   **Erwartet, je nach Mikes Entscheidung:**
   (a) Die Anleitungen beschreiben das Theme als verfügbar, sobald
   `projecttools` in der ausführenden Umgebung importierbar ist, und kennzeichnen
   den Installationsweg für StockInfos Umgebung als **noch nicht verfügbar,
   geklärt in StockInfo-T-82**; der Code bleibt unverändert. Oder
   (b) Mike entscheidet ausdrücklich, diesen Installationsweg jetzt
   festzulegen. Dann steht das mit seinem Wortlaut in T-63 und als
   Konsumentenhinweis in StockInfos T-82, und die Anleitungen nennen die
   Grenze, dass ein Neuaufbau von StockInfos `.venv` die Installation entfernt.

**Urteil:** `changes_requested` für `bd4faec`. Der Code erfüllt Mikes
Theme-Abnahmepunkt vollständig, einschließlich Rückfall, `NO_COLOR` und Pipe.
Die Nachprüfung beschränkt sich auf den Befund zu den Anleitungen.

## Nacharbeit zu Runde 7 · 2026-09-30

Die in der Runde-7-Prüffassung vorgeschlagene editierbare Installation in
StockInfos `.venv` ist aus `README.md` und `AGENTS.md` entfernt. Sie war
kein freigegebener Entwicklungsweg: StockInfo-T-82 unter `20-ready/` klärt
erst, welche Python-Umgebung das Paket für Konsumententests bereitstellen
soll. Bis dahin bleibt die dokumentierte StockInfo-venv unverändert und die
CLI zeigt dort die schlichte Hilfe. Der optionale Paketimport und das
bereits geprüfte Theme-Verhalten bleiben erhalten, wenn das Paket in der
ausführenden Umgebung importierbar ist. Damit wird keine StockInfo-
Abhängigkeit vorweggenommen. Die frühere Installationsangabe im
Abnahme-Nachtrag oben ist durch diese Entscheidung überholt.

**Prüfung:** `git grep -n 'pip install -e ./.libs/ProjectTools' -- README.md
AGENTS.md` liefert keinen Treffer. `git diff --check` ist sauber. Es wurde
kein Produktcode geändert; die Runde-7-Proben für Hilfe mit und ohne Paket,
Ruff sowie 806 Frontend- und 8 API-Tests bleiben auf `bd4faec` bezogen.

**Doku-Abgleich:** `README.md` (**Setup**) und `AGENTS.md` (**Bauen und
prüfen**) nennen denselben noch offenen Installationsweg aus StockInfo-T-82
und versprechen für den normalen Aufruf bis dahin nur schlichte Hilfe.
`docker/README.md` enthält keinen lokalen Testserver-Aufruf und bleibt
unverändert. StockInfos T-82 ist aus Konsumentensicht benannt, aber sein
Umfang und seine Lösung wurden hier nicht geändert. Keine Board- oder
Lessons-Konvention geändert.

## Übergabe an Claude · technische Runde 8 · 2026-09-30

Bitte den einzelnen Doku-Befund aus Runde 7 nachprüfen: Der normale
StockInfo-Python-Aufruf verändert StockInfos Umgebung nicht und verspricht
keine bereits installierten Farben. Die installierbare, optional genutzte
Theme-Bibliothek bleibt auf ProjectTools-`master` lokal verfügbar; über
StockInfos regulären Paketbezug entscheidet T-82. Mikes T-63-Abnahme und
die gemeinsame Integration mit T-60 stehen weiterhin aus.

## Technische Prüfung Runde 8

`claude`, 2026-09-30, an Handoff-Commit `e4db84b5d13a136d9dec4095fa9e6bd6f8cc8781`
(Diff seit `bd4faec`, nur `README.md`, `AGENTS.md` und dieses Ticket).

**Geprüft:** Die Fassung setzt Variante (a) aus Runde 7 richtig um. Beide
Anleitungen enthalten keine Installationsanweisung für StockInfos `.venv`
mehr, verweisen für den Paketbezug auf StockInfo-T-82, halten fest, dass der
Teststack StockInfos Umgebung nicht ändert, und beschreiben dasselbe. Der
Produktcode ist seit `bd4faec` unverändert.

**Überholt durch Mikes Entscheidung:** Parallel zu dieser Übergabe hat Mike
den Befund aus Runde 7 anders entschieden, nämlich mit Variante (c): „Weshalb
das .venv in StockInfo wenn der Aufruf aus StockPortfolio erfolgt? Dann wäre
wohl naheliegend das .venv hier zu verwenden“, danach „Ja, trag Variante (c)
in die INBOX ein“. Die CLI (Hilfe, Stack-Start, Status, Stop, Theme) läuft
künftig in einer eigenen `.venv` von StockPortfolio mit `projecttools`. Der
StockInfo-Kindprozess startet unverändert mit `<stockinfo-root>/.venv/bin/python`.
Nur der Einzelserver `--run` ohne `--stack` bleibt in StockInfos `.venv` und
damit ohne Theme. Die Einzelheiten der Umsetzung stehen in der INBOX
(STATUS-Commit `46e262a`).

**Urteil:** `changes_requested` für `e4db84b`, allein wegen Mikes Entscheidung
für Variante (c). Die Fassung selbst enthält keinen Fehler. Die nächste
Runde prüft die eigene `.venv`, den Stack-Aufruf daraus, die unveränderte
StockInfo-Umgebung und den Abgleich beider Anleitungen.

## Abnahme Mike · Python-Umgebung · 2026-09-30

Mike entschied nach Runde 8, den Stack mit StockPortfolios eigener `.venv`
auszuführen. Der StockInfo-Kindprozess bleibt an StockInfos `.venv` gebunden;
der Einzelserver ohne `--stack` importiert StockInfos App im selben Prozess
und wird deshalb weiter direkt mit dessen Python gestartet. Diese Entscheidung
ersetzt den vorläufigen T-82-Verweis aus der Nacharbeit zu Runde 7, ohne die
älteren Reviewbelege umzuschreiben.

Commit `ca9c74b` richtet `make setup` für die lokale Python-Umgebung und das
deklarierte `requirements-test-stack.txt` ein. `.gitignore` ignoriert `.venv`;
`make clean` entfernt sie. Der Bibliotheks-Check in `setup-libs.sh` verwendet
den paketierten Pfad `projecttools/ui/colors.py`. README, AGENTS und
Skriptkopf zeigen Stack-Start, Status und Stop mit `.venv/bin/python` sowie
den StockInfo-only-Aufruf mit dessen Python. `make hints` zeigt die verkürzte
Setup-Reihenfolge ohne doppelte npm-Installation.

**Prüfung:** Ein frisches `python3.11 -m venv .venv` und die reguläre
Installation aus `requirements-test-stack.txt` bestanden; der erste pip-Lauf
in der Netz-Sandbox scheiterte nur am isolierten Build-Download, derselbe
Befehl mit Netzfreigabe bestand. Der Import kommt aus dem lokalen,
paketierten ProjectTools-`master`. `bash scripts/setup-libs.sh --install`,
`make help`, `make hints` und `make -n setup` bestanden. `make clean`
entfernte die `.venv`; sie wurde danach für die Reviewprobe wieder angelegt.
Der gesamte `make setup`-Lauf wurde im Prüf-Worktree wegen seiner auf den
Haupt-Workspace zeigenden `node_modules`-Symlinks nicht erneut ausgeführt;
der unveränderte npm-Teil ist durch `make test` geprüft.

Die CLI-Hilfe lief aus StockPortfolios `.venv` ohne StockInfo-Pakete. Im
Pseudo-Terminal zeigte `MAKE_THEME=ocean` farbige Gruppen und Optionen;
`NO_COLOR=1` sowie die Pipe zeigten keine ANSI-Farben. `--stack --status`
meldete korrekt keinen registrierten Stack. Ein `--stack --run` mit absichtlich
fehlendem StockInfo-Pfad endete vor einem Prozessstart mit
`Missing StockInfo Python environment: .../.venv/bin/python`; für dessen
`ps`-Identitätsprüfung wurde die vorgesehene Freigabe verwendet. Der
vollständige Stack wurde für diese Änderung nicht erneut gestartet. Der
frühere Endpunkt-, Kurs- und CORS-Lauf aus Runde 7 bleibt der letzte
Live-Stack-Nachweis. StockInfos `.venv` wurde nicht verändert.

`make test` bestand mit 806 Frontend- und 8 API-Tests. Beide ESLint-Läufe,
beide Typechecks, Ruff, Python-Syntaxprüfung und `git diff --check`
bestanden. Frontend- und API-Produktcode blieben unverändert.

**Doku-Abgleich:** `README.md` (**Setup**, **Commands**) und `AGENTS.md`
(**Bauen und prüfen**) nennen beide den eigenen Stack-Interpreter, den
StockInfo-Kindprozess und den direkten Einzelserver-Aufruf. `docker/README.md`
(**Quick start**, **Configuration**, **Data and backups**) enthält weder
lokalen Teststack noch Python-Setup; keine Änderung nötig. StockInfo-T-82
wird durch diese Lösung für StockPortfolios Theme-Bezug nicht benötigt und
hier nicht verändert. Keine Board- oder Lessons-Konvention wurde geändert.

## Übergabe an Claude · technische Runde 9 · 2026-09-30

Bitte Mikes Variante (c) auf Commit `ca9c74b` prüfen: `make setup` richtet
StockPortfolios `.venv` ein, die CLI verwendet daraus das Theme, während
der StockInfo-Kindprozess weiterhin dessen `.venv` verwendet. Den fehlenden
StockInfo-Pfad und die offen benannte Grenze des nicht wiederholten
Live-Stack-Laufs bitte gegen die obigen Belege bewerten. Mikes T-63-Abnahme
und die gemeinsame Integration mit T-60 stehen noch aus.

### Ergänzung vor Runde 9 · 2026-09-30

Mike präzisierte den Lebenszyklus nach dem ersten Commit: `make clean` darf
die eigene `.venv` nicht entfernen; `make setup` verwendet eine vorhandene
Umgebung wieder und installiert nur das fehlende Python-Paket. Die allgemeine
Python-Abhängigkeitsdatei heißt `requirements.txt` im Projekt-Root. Der
dokumentierte Stack-Aufruf lautet `.venv/bin/python scripts/stockinfo-test-server.py …`.
Diese Vorgaben ersetzen die gegenteiligen Aussagen zur `.venv` und zum
Dateinamen im unmittelbar vorhergehenden Abnahmeabschnitt.

Commit `d7e1607` setzt das um. Setup prüft `PYTHON_BOOTSTRAP` auf Python 3.11+
vor dem Erstellen, prüft auch eine vorhandene `.venv`, erstellt sie nur bei
Bedarf und installiert `mmit-projecttools` aus `requirements.txt` nur, wenn
Distribution oder UI-Modul fehlen. `make clean` behält `.venv`, entfernt
aber erzeugte Python-Caches. README, AGENTS und Skriptkopf zeigen denselben
Aufruf ohne `-B`; `.gitignore` ignoriert `.venv` und Python-Caches.

**Gegenproben:** `make setup PYTHON_BOOTSTRAP=python3.9` endete vor der
venv-Anlage mit „Python 3.11 oder neuer erforderlich“. Nach `make clean`
waren `.venv/bin/python` und der ProjectTools-Import weiterhin vorhanden.
Die Installation mit `pip install --no-build-isolation -r requirements.txt`
bestand in der Netz-Sandbox; zuvor bestand die reguläre pip-Build-Isolation
mit Freigabe für denselben lokalen Paketpfad. Der dokumentierte
`.venv/bin/python scripts/stockinfo-test-server.py --help`-Aufruf zeigte die
Hilfe, `--stack --status` meldete korrekt keinen Stack. `make -n setup` und
`git diff --check` waren sauber. Frontend und API blieben gegenüber dem
vorherigen grünen Gesamtprüflauf unverändert. Nach `d7e1607` bestanden
`make test` erneut mit 806 Frontend- und 8 API-Tests, beide Lints, beide
Typechecks und Ruff.

**Doku-Abgleich:** `README.md` (**Setup**, **Commands**) und `AGENTS.md`
(**Bauen und prüfen**) nennen beide `requirements.txt`, die wiederverwendete
`.venv` und deren Erhalt bei `make clean`. `docker/README.md` hat weiterhin
keinen lokalen Python-Setup-Weg; unverändert. Keine Board- oder
Lessons-Konvention geändert. Die technische Runde 9 soll beide Produktcommits
`ca9c74b` und `d7e1607` einschließlich dieser Ergänzung prüfen.

## Technische Prüfung Runde 9

`claude`, 2026-09-30, an Handoff-Commit `70c25a6117d9339cddd8fd18ba459565b614315b`
(Diff seit `e4db84b`). Geprüft habe ich Mikes Variante (c) samt seinen
Vorgaben zu `make setup`, `make clean` und `requirements.txt` in einem eigenen,
abgetrennten Worktree. Den vollen Stack habe ich selbst gestartet, weil die
Übergabe diesen Live-Nachweis für die Umstellung offen ließ. Angewandt habe ich
SP-R-02 und SP-R-04.

| Punkt | Eigener Schritt | Ergebnis |
|---|---|---|
| Setup-Schritte | Die vier Python-Zeilen aus `make -n setup` zweimal ausgeführt | Lauf 1 legt `.venv` mit Python 3.11 an und installiert `requirements.txt`; Lauf 2 meldet das Paket vorhanden, ohne Installation. `projecttools.ui.colors` kommt aus `.libs/ProjectTools` (`mmit-projecttools` 0.1.0). Die `.venv` enthält keine StockInfo-Abhängigkeiten (`fastapi` fehlt) |
| Stack aus eigener `.venv` | `.venv/bin/python scripts/stockinfo-test-server.py --stack --run --demo-accounts`, `--stack --status`, `--stack --stop` | Start und alle Endpunkt- und CORS-Prüfungen erfolgreich; Status mit Theme im Pseudo-Terminal farbig (11 Zeilen), in einer Pipe Exit 0; Stop entfernt API, Vite und Kontodaten |
| StockInfos `.venv` | Fingerabdruck von `pip freeze` vor und nach dem Lauf, Import von `projecttools` | Unverändert (`61eccd459663`), `projecttools` dort nicht importierbar |
| `make clean` | zweimal im Worktree | Beide Exit 0, `.venv` bleibt, `scripts/__pycache__` wird entfernt |
| Doku | Diff von `README.md`, `AGENTS.md` und dem Skriptkopf gelesen | Aufruf mit `.venv/bin/python`, `make setup` samt `PYTHON_BOOTSTRAP` und Versionsprüfung, `make clean` behält die `.venv`, Einzelserver weiter mit StockInfos `.venv`; beide Anleitungen stimmen überein |

**Befunde (blockierend, nach SP-R-04):**

1. **Der Stopp hinterlässt Zustandsdatei und Datenverzeichnis des
   StockInfo-Kindprozesses.** `stop_children` beendet die Prozessgruppe mit
   SIGTERM. StockInfos `uvicorn` 0.51.0 fängt das Signal, fährt herunter und
   löst es dann erneut aus (`raise_signal` in `uvicorn/server.py`). Der Prozess
   endet damit, bevor der `finally`-Block von `run_single_server` läuft
   (`stockinfo-test-server.py`, `state_path.unlink()` und
   `shutil.rmtree(data_dir)`). Belegt: Nach einem erfolgreichen
   `--stack --stop` lag `stockportfolio-test-server-8899.json` mit beendeter
   PID 76374 weiter vor. Unter dem System-Temp liegen **46** Verzeichnisse
   `stockportfolio-t39-server-*` mit StockInfo-Test-Datenbanken von 15:32 bis
   21:25. Eine liegengebliebene Zustandsdatei blockiert den nächsten Start aus
   einem anderen Pfad („gehört nicht zu diesem Testserver“); das ist heute
   zweimal passiert, um 15:29 im Hauptverzeichnis und um 19:17 in meinem
   T-61-Worktree. Das widerspricht dem Kriterium „Stop räumt eigene Prozesse
   und temporäre Daten auf“. **Das gab es schon in Runde 1; ich habe dort nur
   nach `stockportfolio-t63-*` gesucht und die Kindreste übersehen.**
   **Erwartet:** Der Einzelserver räumt Zustandsdatei und Datenverzeichnis
   auch nach SIGTERM zuverlässig auf, etwa per Signal-Handler vor `uvicorn`
   oder per Aufräumen durch den Stack nach dem Stopp für den registrierten
   Kindzustand. Ein Test oder eine Gegenprobe belegt: Nach `--stack --stop`
   gibt es keine Zustandsdatei und kein `stockportfolio-t39-server-*`
   dieses Laufs mehr.
2. **Die Portprüfung meldet nach einem Stopp fälschlich „belegt“.** Der
   Test-Socket in `local_test_stack.py:53–55` bindet ohne `SO_REUSEADDR`.
   Direkt nach `--stack --stop` scheiterte ein Neustart vom selben Pfad mit
   „Port 8899 ist bereits belegt“, obwohl kein Prozess mehr lauschte
   (`lsof` leer); `netstat` zeigte nur `TIME_WAIT`-Verbindungen. Uvicorn selbst
   bindet mit `SO_REUSEADDR` und hätte starten können.
   **Erwartet:** Die Prüfung verhält sich wie der Server-Bind und meldet nur
   einen tatsächlich lauschenden Prozess. Eine Gegenprobe belegt einen
   Neustart unmittelbar nach dem Stopp.

**Aufgeräumt:** Meine eigenen verwaisten Zustandsdateien (19:17 aus
`wt-t61`, 21:25 aus `wt-t63r9`, beide mit beendeter PID) habe ich entfernt.
Die 46 Datenverzeichnisse habe ich nicht angefasst, weil sie auch aus fremden
Läufen stammen; über ihr Entfernen entscheidet Mike.

**Nebenbemerkung zum Board:** Mein Commit `637f3ed` („start T-63 round 9
review“) hat Codex' noch uncommittete Übergabeänderungen an `STATUS.md`
mitgenommen (Kontext, `handoff_commit`, Runde 9, drei Observer-Nachrichten).
Inhaltlich ist der Stand richtig, er steht nur unter meinem Commit.

**Urteil:** `changes_requested` für `70c25a6`. Variante (c) ist vollständig
und nachprüfbar umgesetzt, einschließlich aller drei Vorgaben Mikes. Die
Nachprüfung beschränkt sich auf die Befunde 1 und 2.

## Nacharbeit zu Runde 9 · 2026-09-30

Die zwei Befunde sind getrennt behoben:

1. `44f61a6` hält `SIGTERM` beim StockInfo-Einzelserver während Uvicorns
   Signalrückgabe zurück. Uvicorn kann geordnet herunterfahren; danach läuft
   der vorhandene `finally`-Block und entfernt die zur eigenen PID gehörende
   Zustandsdatei sowie das neue `stockportfolio-t39-server-*`-Verzeichnis.
   Anschließend wird der vorherige Signalhandler wiederhergestellt.
2. `05ccd7b` setzt beim Port-Probesocket `SO_REUSEADDR` vor `bind`, wie der
   eigentliche Uvicorn-Server. Eine reine `TIME_WAIT`-Verbindung wird damit
   nicht mehr als fremder Listener gemeldet.

**Gegenproben:** Vor dem Port-Fix scheiterte ein lokaler Bind nach einer
geschlossenen Testverbindung auf Port 60190 mit `Address already in use`;
mit dem Fix bestand dieselbe Probe auf Port 60212. Auf Port 18987 wurde der
StockInfo-Einzelserver zweimal gestartet und mit `--stop` beendet: Jeweils
verschwanden seine Zustandsdatei und das neue Datenverzeichnis. Danach wurde
der **vollständige Stack zweimal direkt hintereinander** auf Port 18987 aus
StockPortfolios `.venv` gestartet, mit `--stack --status` geprüft und mit
`--stack --stop` beendet. Beide Starts, Statusläufe und Stopps bestanden.
Nach jedem Stopp waren weder Stack- noch Kindzustandsdatei vorhanden; die
Menge der zuvor vorhandenen `stockportfolio-t39-server-*`-Verzeichnisse war
unverändert. Der Lauf berührte keine der von Claude genannten Altverzeichnisse.

Nach den Codecommits bestanden `make test` mit 806 Frontend- und 8 API-Tests,
beide ESLint-Läufe, beide Typechecks, Ruff, Python-Syntaxprüfung und
`git diff --check`. Die Produktänderung betrifft nur die beiden lokalen
Python-Skripte.

**Doku-Abgleich:** `README.md` (**Setup**, **Commands**) und `AGENTS.md`
(**Bauen und prüfen**) versprachen bereits, dass Stop die eigenen Testdaten
entfernt und ein belegter Port fremde Prozesse nicht beendet. Diese Zusagen
werden nun erfüllt; kein Wortlautwechsel nötig. `docker/README.md`
(**Quick start**, **Configuration**, **Data and backups**) enthält diesen
lokalen Fixture-Stack nicht und bleibt unverändert. Keine Board- oder
Lessons-Konvention geändert.

## Übergabe an Claude · technische Runde 10 · 2026-09-30

Bitte nur die zwei Befunde aus Runde 9 an `44f61a6` und `05ccd7b` erneut
prüfen: Aufräumen des StockInfo-Kindprozesses nach `SIGTERM` sowie sofortiger
Stack-Neustart nach Stopp trotz `TIME_WAIT`. Die Gegenproben stehen oben.
Mikes T-63-Abschlussentscheidung und die gemeinsame Integration mit T-60
bleiben offen.

## Technische Prüfung Runde 10

`claude`, 2026-09-30, an Handoff-Commit `e596e1b76b08d629fac979544fa2ef1ff8d22252`
(Diff seit `70c25a6`, nur `scripts/` und dieses Ticket). Geprüft habe ich die
beiden Befunde aus Runde 9 in einem eigenen, abgetrennten Worktree mit
frischer eigener `.venv` aus `requirements.txt`. Angewandt habe ich SP-R-04.

| Punkt | Eigener Schritt | Ergebnis |
|---|---|---|
| Befund 1 · Aufräumen | Einzelserver zweimal mit StockInfos `.venv` gestartet (`/health` 200) und mit `-t` gestoppt; Stack zweimal gestartet und gestoppt; Zustandsdateien und `stockportfolio-t39-server-*` vorher und nachher gezählt | **Behoben.** Keine neue Zustandsdatei, kein neues Datenverzeichnis (vorher 46, nachher 46) |
| Befund 2 · Portprüfung | Stack direkt nach dem Stopp erneut gestartet, `TIME_WAIT` per `netstat` geprüft | **Behoben.** Neustart erfolgreich bei drei offenen `TIME_WAIT`-Verbindungen auf 8899; `SO_REUSEADDR` am Test-Socket entspricht dem Server-Bind |
| Mechanismus | `uvicorn.server.Server.capture_signals` (0.51.0) gelesen | `uvicorn` merkt sich den bestehenden Handler (`SIG_IGN`), stellt ihn nach dem Herunterfahren wieder her und löst das Signal dann erneut aus; unter `SIG_IGN` wird es ignoriert, und das `finally` läuft |
| Lint, Umfang | `ruff check`, `py_compile`, `git diff --stat -- frontend api` | Sauber; Frontend und API unverändert |

**Befund (blockierend, nach SP-R-04):**

3. **Ein SIGTERM kurz nach dem Start geht verloren.**
   `run_single_server` setzt SIGTERM vor `uvicorn.run` auf `SIG_IGN`. Bis
   `uvicorn` in `capture_signals` seinen eigenen Handler setzt (innerhalb von
   `server.run` → `asyncio.run(serve())`), wird ein eintreffendes SIGTERM
   ignoriert, nicht verzögert. `stop_children` sendet genau ein SIGTERM,
   wartet 10 Sekunden und meldet dann „did not stop“. Der Server läuft danach
   weiter, bis ihn jemand von Hand beendet. Das Fenster ist kurz, aber
   erreichbar, zum Beispiel wenn der Stack-Start wegen eines anderen Kindes
   früh scheitert und die Aufräumlogik die Kinder sofort beendet.
   **Erwartet:** Ein Handler, der das Signal nicht verwirft, etwa
   `signal.signal(signal.SIGTERM, lambda *_: sys.exit(0))` statt `SIG_IGN`.
   `uvicorn` ersetzt ihn während des Laufs, stellt ihn danach wieder her, und
   das erneut ausgelöste Signal endet dann als `SystemExit`. Das `finally`
   räumt in beiden Fällen auf. Eine Gegenprobe belegt Aufräumen sowohl nach
   normalem Stopp als auch bei SIGTERM unmittelbar nach dem Start.

**Hinweis zu Altlasten, keine Codeänderung dieser Fassung:** Unter dem
System-Temp liegen vier verwaiste Zustandsdateien für die Ports 18898, 59999,
8898 und 8901, alle mit beendeter PID und aus Läufen vor dieser Korrektur,
sowie die 46 `stockportfolio-t39-server-*`-Verzeichnisse. Über das einmalige
Entfernen entscheidet Mike (offene Frage aus Runde 9).

**Urteil:** `changes_requested` für `e596e1b`. Die Befunde 1 und 2 aus
Runde 9 sind behoben und live belegt. Die Nachprüfung beschränkt sich auf
Befund 3.

## Nacharbeit zu Runde 10 · frühes SIGTERM · 2026-09-30

Commit `4d5e81f` ersetzt `SIG_IGN` durch einen eigenen SIGTERM-Handler, der
`SystemExit(0)` auslöst. Er wird innerhalb des `try` vor dem Schreiben der
Zustandsdatei und vor `uvicorn.run` gesetzt. Damit läuft das vorhandene
`finally` sowohl bei einem frühen Signal als auch nach Uvicorns geordnetem
Stopp; der vorherige Handler wird anschließend wiederhergestellt.

- Gezielte Gegenprobe: Der Test verzögerte `uvicorn.run` vor dessen
  Signalhandler, sendete in diesem Fenster über `--stop` ein SIGTERM und
  prüfte Prozessende, entfernte Zustandsdatei und entfernte Testdaten.
  Ergebnis: alles erfolgreich, ohne die 15 Sekunden Verzögerung abzuwarten.
- Normaler Einzelserver-Stopp: `/health` antwortete mit 200; `--stop`
  entfernte Prozesszustand und Testdaten.
- Voller Stack: zweimal direkt nacheinander Start, Status und Stopp auf
  Port 18987. Beide Läufe endeten ohne neue Zustandsdatei oder Testdaten.
- `make test`: 806 Frontend- und 8 API-Tests bestanden mit Homebrew-Bash
  voran im `PATH`. Der erste Lauf mit dem Umgebungs-`PATH` scheiterte an
  einem bestehenden Docker-Build-Test: macOS-Bash 3.2 versteht die dort
  verwendete Kleinschreibsubstitution `${GITHUB_OWNER,,}` nicht. Der
  unveränderte Test bestand mit Bash 5.3; kein Bezug zur Python-Änderung.
- `npm --prefix frontend run lint`, `npm --prefix api run lint`, beide
  `typecheck`, `ruff check`, `py_compile` und `git diff --check`: erfolgreich.

**Doku-Abgleich:** `README.md` (**Setup**, **Commands**) und `AGENTS.md`
(**Bauen und prüfen**) sagen bereits zu, dass Stop eigene Prozesse und
Testdaten entfernt. Die Korrektur erfüllt diese Zusage auch im frühen
Startfenster; Textänderungen sind nicht nötig. `docker/README.md`
(**Quick start**, **Configuration**, **Data and backups**) beschreibt den
lokalen Testserver nicht und bleibt unverändert. Board- und Lessons-Verfahren
wurden nicht geändert.

**Alte Testdaten auf Mikes Auftrag entfernt:** Vorher lagen 47
`stockportfolio-t39-server-*`-Verzeichnisse und die vier in Runde 10
genannten Zustandsdateien im System-Temp. Das 47. Verzeichnis entstand bei
einer zunächst durch die Sandbox gesperrten Gegenprobe. Die Prozessliste
zeigte keinen laufenden `stockinfo-test-server.py`; alle vier Ports waren
ohne Listener. Nach Prüfung der Namen und Zustandsinhalte wurden genau diese
Einträge entfernt. Nachher: 0 Testverzeichnisse und 0 der vier Dateien.

## Übergabe an Claude · technische Runde 11 · 2026-09-30

Bitte ausschließlich Befund 3 aus Runde 10 an `4d5e81f` erneut prüfen:
Ein SIGTERM im Fenster vor Uvicorns eigenem Handler muss den Prozess beenden
und seinen Zustand samt Testdaten entfernen. Die Gegenproben stehen oben.
Die von Mike verlangte einmalige Bereinigung alter Testdaten ist dort
ebenfalls belegt.
Mikes T-63-Abschlussentscheidung und die gemeinsame Integration mit T-60
bleiben offen.

## Technische Prüfung Runde 11

`claude`, 2026-09-30, an Handoff-Commit `f2fafac7528892f1b8de7e973b19d4f5b3f16b68`
(Diff seit `e596e1b`, nur `scripts/stockinfo-test-server.py` und dieses
Ticket). Geprüft habe ich Befund 3 aus Runde 10 und das von Mike beauftragte
Aufräumen, in einem eigenen, abgetrennten Worktree mit frischer `.venv`.
Angewandt habe ich SP-R-04 und SP-R-05: ein Inventar über alle Präfixe
`stockportfolio-t39-server-*`, `stockportfolio-test-server-*.json` und
`stockportfolio-t63-*` vor und nach jedem Lauf.

| Punkt | Eigener Schritt | Ergebnis |
|---|---|---|
| Altlasten | Inventar vor meinem ersten Lauf | 0 / 0 / 0; Codex' Bereinigung der verwaisten Verzeichnisse und der vier Zustandsdateien ist wirksam |
| Befund 3 · Code | Diff gelesen | **Behoben.** `exit_on_termination` löst `SystemExit(0)` aus und wird vor dem Anlegen der Zustandsdatei gesetzt; `uvicorn` ersetzt ihn während des Laufs und stellt ihn danach wieder her |
| Früher Stopp | Einzelserver gestartet, SIGTERM an die PID, sobald die Zustandsdatei erschien | Prozess beendet, Inventar 0 / 0 / 0. **Grenze:** Das Log zeigt, dass `uvicorn` beim Signal schon lief. Das Fenster vor `uvicorn`s Handler hat meine Probe nicht getroffen; dass der Handler vorher gesetzt wird, belegt der Code |
| Normaler Stopp, Stack | Einzelserver mit `-t`; Stack zweimal mit sofortigem Neustart | Alle Läufe erfolgreich, Inventar jeweils 0 / 0 / 0, keine Ports belegt |
| Lint | `ruff check`, `py_compile`, `git diff --stat -- frontend api` | Sauber; Frontend und API unverändert |

**Befund (blockierend, nach SP-R-04):**

4. **Eine halb geschriebene Zustandsdatei verhindert Aufräumen und
   Neustart.** Der Handler steht jetzt vor `state_path.open("x")`. Kommt
   SIGTERM nach dem Anlegen, aber vor dem Ende von `json.dump`, bleibt eine
   leere oder unvollständige Datei. Im `finally` wirft `json.loads` dann
   `JSONDecodeError`. Weil `shutil.rmtree(data_dir)` im selben `try` steht,
   bleibt auch das Datenverzeichnis liegen. Beim nächsten Start liest
   `read_owned_state` (Zeile 140) die Datei ungeschützt mit `json.loads` und
   bricht mit Traceback ab, bis jemand sie von Hand löscht. Das Fenster ist
   sehr kurz. Die Folge wäre aber genau die Blockade, die Befund 1 aus
   Runde 9 beseitigen sollte.
   **Erwartet:**
   - Die Zustandsdatei entsteht atomar, etwa als vollständige temporäre
     Datei, die exklusiv an ihren Zielnamen gebunden wird (`os.link`).
   - Das `finally` entfernt die eigene Datei auch dann, wenn ihr Inhalt
     unlesbar ist, zum Beispiel über ein Merkmal „von diesem Prozess
     angelegt“.
   - `shutil.rmtree(data_dir)` läuft in einem eigenen `finally`.
   - `read_owned_state` meldet eine unlesbare Datei konkret, statt mit
     Traceback abzubrechen.

   Ein kleiner Test oder eine Gegenprobe mit leerer Zustandsdatei belegt
   Aufräumen und klare Meldung.

**Urteil:** `changes_requested` für `f2fafac`. Befund 3 aus Runde 10 und die
Bereinigung der Altlasten sind wirksam. Die Nachprüfung beschränkt sich auf
Befund 4.

## Abnahme Mike · Zeitpunkt · 2026-09-30

Mike: „Auch T-63 nehme ich erst ganz am Ende ab“. Die menschliche Prüfung
folgt damit nach T-61 und T-62. Die technische Nachprüfung von T-63 läuft
weiter; die gemeinsame Integration von T-60 und T-63 folgt erst nach Mikes
T-63-Abschlussentscheidung. Dieser Zeitpunkt ergänzt den bisherigen
Abnahmeabschnitt, ohne frühere Nachträge oder Belege zu ändern.

## Nacharbeit zu Runde 11 · atomarer Zustand · 2026-09-30

Commit `637da2f` schreibt den vollständigen JSON-Zustand zunächst in eine
temporäre Datei im selben Verzeichnis. `os.link` bindet den fertigen Inhalt
exklusiv an den endgültigen Namen. Das vor dem Link gemerkte Datei-Inode
erlaubt im `finally` das Entfernen der eigenen Zustandsdatei auch ohne
JSON-Lesen. Testdaten werden in einem eigenen `finally` entfernt. Ein
unlesbarer vorhandener Zustand führt nun zu einer übersetzten CLI-Meldung
ohne Traceback und wird nicht ungeprüft gelöscht.

- Gezielte Gegenprobe: `json.dump` nach dem Schreiben von `{` angehalten,
  SIGTERM in diesem Fenster gesendet. Danach gab es weder endgültige oder
  temporäre Zustandsdatei noch Testdaten; der Prozess endete sofort.
- Leere bzw. unvollständige vorhandene Zustandsdatei: `--status` endete mit
  konkreter Fehlermeldung und ohne Traceback. Die Testdatei wurde anschließend
  entfernt. Eine durch die Sandbox vor der eigentlichen Probe erzeugte
  Testdatenkopie wurde ebenfalls gezielt entfernt.
- `make test` mit Homebrew-Bash 5.3 im `PATH`: 806 Frontend- und 8 API-Tests
  bestanden. Beide Lints, beide Typechecks, Ruff, Python-Syntax und
  `git diff --check` waren erfolgreich. Der Grund für den Bash-`PATH` steht
  im Nachtrag zu Runde 10.

**Doku-Abgleich:** `README.md` (**Setup**, **Commands**) und `AGENTS.md`
(**Bauen und prüfen**) beschreiben bereits Stop und Aufräumen des lokalen
Testservers; die Implementierung erfüllt diese Zusage nun auch bei
unterbrochenem Schreiben. `docker/README.md` (**Quick start**,
**Configuration**, **Data and backups**) beschreibt diesen lokalen Weg
nicht. Keine Anleitung braucht eine Textänderung. Board- und
Lessons-Konventionen bleiben unverändert.

## Übergabe an Claude · technische Runde 12 · 2026-09-30

Bitte ausschließlich Befund 4 aus Runde 11 an `637da2f` nachprüfen:
atomarer Zustand, Aufräumen auch nach Signal während des Schreibens und
klare Meldung bei unlesbarer vorhandener Datei. Die Gegenproben stehen oben.
Mikes Abnahme liegt nach T-61/T-62; Merge und Push bleiben bis dahin offen.

## Lebenszyklusprüfung vor Runde 12 · 2026-09-30

Der Observer forderte nach den wiederholten Start- und Stoppbefunden eine
Prüfung des gesamten Ablaufs. Commit `18c60f4` verwendet die atomare
Zustandsablage aus `637da2f` nun auch für den Stack. Beim Stack-Start merkt
der Signalhandler die Beendigungsanforderung zunächst nur vor. So wird ein
gerade gestartetes Kind vollständig registriert, bevor das Aufräumen
beginnt. Der Einzelserver installiert seinen Handler schon vor dem Anlegen
des Testverzeichnisses; während `mkdtemp` wird das Signal vorgemerkt,
danach greift ein `atexit`-Rückfall für die Importphase ohne Zustandsdatei.

| Schritt | Signal oder Fehler an dieser Stelle | Ergebnis und Schutz |
|---|---|---|
| Vorprüfung und Zustandslesen | Port belegt, `ps` unzugänglich oder JSON unlesbar | Kein Kind gestartet. Port und Prozessidentität werden geprüft; unlesbare eigene Zustände melden ihren Pfad ohne Traceback und werden nicht blind entfernt. |
| Einzelserver: Testverzeichnis und StockInfo-Import | SIGTERM vor der Zustandsdatei | Handler wird vor `mkdtemp` gesetzt; das Signal während der Anlage wird vorgemerkt. `atexit` entfernt das eigene Verzeichnis auch bei Abbruch während des Imports. Importfenster mit SIGTERM gezielt geprüft: keine Reste. |
| Stack: Kind starten und registrieren | SIGTERM nach `Popen`, vor Speicherung der PID; oder Fehler beim Start eines späteren Kindes | Der Stack-Handler merkt SIGTERM vor. Jedes Kind wird vor dem Abbruch registriert; bei Fehlern stoppt der Stack alle bereits registrierten Kinder. Probe während der API-Registrierung: keine laufenden Kinder, Zustände oder Testdaten. |
| Zustand schreiben | SIGTERM oder Fehler während `json.dump`; vorhandener Zielname | Gemeinsamer Helfer schreibt in eine temporäre Datei und bindet den vollständigen Inhalt mit `os.link` exklusiv an den Zielnamen. Eigene Datei wird über Dateigerät und Inode erkannt, ohne JSON erneut zu lesen. Teil-Schreibprobe und unlesbare Zustandsdatei geprüft. |
| Laufen und Bereitschaft prüfen | SIGTERM vor Uvicorns Handler, nach dem Start oder während Stack-Health-Checks | Einzelserver beendet sich über `SystemExit` und sein `finally`; Stack prüft die vorgemerkte Anforderung bei jedem Start- und Health-Schritt und stoppt seine Kinder. Früher und normaler Einzelserver-Stopp sowie zweimaliger voller Stack-Lauf geprüft. |
| Stoppen und Aufräumen | Kind ist schon beendet, Identität hat gewechselt oder ein Stopp schlägt fehl | Nur eigene Prozessgruppen werden signalisiert. Der Stack versucht alle registrierten Kinder zu stoppen; bei einem Fehlschlag bleiben Zustandsdatei und Daten zur sicheren Nachprüfung erhalten. Nach erfolgreichem Stopp entfernt er Testdaten und dann Zustand. Im Fehlerpfad der Initialisierung entfernt ein eigenes `finally` die Zustandsdatei und ein weiteres die Testdaten. |

**Gegenproben:** SIGTERM während StockInfo-Import, vor Uvicorns Handler,
während `json.dump` des Einzelservers und zwischen API-Kindstart und
Registrierung; normaler Einzelserver-Stopp; zweimal Start/Status/Stopp des
gesamten Stacks; unlesbarer Einzel- und Stack-Zustand. Vorher und nachher
jeweils 0 verbliebene `stockportfolio-t39-server-*`-Verzeichnisse,
`stockportfolio-test-server-*.json`-Dateien und `stockportfolio-t63-*`-Einträge.
`make test` mit Homebrew-Bash 5.3 im `PATH` bestand mit 806 Frontend- und
8 API-Tests. Beide Lints, beide Typechecks, Ruff, Python-Syntax und
`git diff --check` waren erfolgreich.

**Doku-Abgleich:** `README.md` (**Setup**, **Commands**) und `AGENTS.md`
(**Bauen und prüfen**) versprechen bereits den vollständigen Stopp eigener
Prozesse und Daten. Der Stack erfüllt das nun auch bei Abbruch während des
Starts. `docker/README.md` (**Quick start**, **Configuration**, **Data and
backups**) behandelt den lokalen Teststack nicht. Keine Textänderung nötig.
Die Board- und Lessons-Konventionen wurden nicht geändert.

**Runde-12-Übergabe:** Die Nachprüfung von Befund 4 umfasst `637da2f` und
`18c60f4` sowie diese Lebenszyklusbelege. Mikes T-63-Abnahme bleibt bis
nach T-61 und T-62 offen.

Der Prüfauftrag für Runde 12 umfasst ausdrücklich den **gesamten Start- und
Stoppweg** von Einzelserver und Stack: Vorprüfung, Kindstart und Registrierung,
Signalbehandlung, Zustandsablage, Bereitschaft, normaler Stopp und Aufräumen
nach Fehlern. Die Tabelle oben ist die Grundlage; Claude soll auch andere
Abbruchzeitpunkte als Befund 4 prüfen. Diese Erweiterung ersetzt den engeren
Übergabetext unmittelbar nach Runde 11.

## Technische Prüfung Runde 12

`claude`, 2026-09-30, an Handoff-Commit `66fe49498d3b7ddad3c461fc27dc64757dca3170`
(Diff seit `f2fafac`, nur `scripts/` und dieses Ticket). Auf Codex' Bitte habe
ich den gesamten Start- und Stoppweg von Einzelserver und Stack geprüft, in
einem eigenen, abgetrennten Worktree mit frischer `.venv`. Angewandt habe ich
SP-R-04 und SP-R-05. Das Inventar umfasste **alle** `stockportfolio-*`-Einträge
im System-Temp, also auch die Temp-Dateien von `OwnedStateFile.publish`, und
zusätzlich die Ports 5175, 8080 und 8899.

**Code gelesen:** `test_state.py`, der Signal- und Aufräumweg in
`stockinfo-test-server.py` und `start_children`, `stop_children` und
`run_stack_cli` in `local_test_stack.py`.
- `publish` schreibt vollständiges JSON in eine Temp-Datei, merkt sich die
  Inode vor `os.link` und bindet dann exklusiv.
- `remove` löscht nur die Datei mit dieser Inode, also nie eine fremde.
- Der Einzelserver fängt SIGTERM vor `mkdtemp` ab und räumt über `atexit` auf.
- `stop_children` sammelt Fehler, statt beim ersten abzubrechen.

| Probe | Eigener Schritt | Ergebnis |
|---|---|---|
| a · SIGTERM während des Imports | SIGTERM, sobald `stockportfolio-t39-server-*` existiert, noch ohne Zustandsdatei | Exit 0, Inventar 0 |
| b · SIGTERM vor `uvicorn`s Handler | SIGTERM, sobald die Zustandsdatei existiert; das Log zeigt 0 × „Uvicorn running“ | Exit 0, Inventar 0; **genau das Fenster, das meine Probe in Runde 11 verfehlt hatte** |
| c · unlesbarer Zustand | leere Einzel-Zustandsdatei und kaputtes JSON in der Stack-Zustandsdatei | Klare Meldung, Exit 2, kein Traceback |
| d · normaler Einzelstopp | `/health` 200, danach `-t` | Inventar 0 |
| e · Stack | zweimal `--stack --run --demo-accounts`, jeweils sofort `--stack --stop` und Neustart | Beide erfolgreich, Inventar 0, Ports frei |
| f · SIGTERM an die Stack-CLI mitten im Start | SIGTERM, sobald 8899 lauscht | Alle Kinder beendet, Inventar 0, Ports frei, keine verwaisten Prozesse. **Aber:** Exit 0 und leere Ausgabe (siehe Befund 5) |
| Katalog, Lint | `msgfmt`, `.mo` neu erzeugt und verglichen, alle `translate(...)` gegen den Katalog, `ruff check`, `py_compile` | Katalog aktuell, keine fehlende Übersetzung, Ruff sauber; Frontend und API unverändert |

**Befund 4 aus Runde 11: behoben.**

**Befund (blockierend, nach SP-R-04):**

5. **Ein abgebrochener Stack-Start meldet Erfolg.** `check_cancelled` löst
   `SystemExit(0)` aus. Bei Probe f endete `--stack --run` nach SIGTERM mit
   Exit 0 und ohne jede Ausgabe, obwohl der Stack nicht läuft und alles
   wieder abgebaut wurde. Ein Skript oder Agent, der den Exit-Code prüft,
   hält den Start damit für gelungen und prüft gegen einen nicht laufenden
   Stack. Beim Einzelserver ist Exit 0 nach SIGTERM richtig, denn dort ist
   es das normale Beenden. Der Stack-Start ist dagegen ein Befehl, der
   einen Zustand herstellen soll.
   **Erwartet:** Ein abgebrochener Stack-Start endet mit einem Fehlercode,
   etwa 143 (128 + SIGTERM), und einer kurzen übersetzten Meldung
   „Start abgebrochen; eigene Prozesse und Daten entfernt“. Probe f belegt
   Code und Meldung.

**Urteil:** `changes_requested` für `66fe494`. Der Lebenszyklus ist sonst
vollständig und robust, auch in den Fenstern, die früher Reste hinterließen.
Die Nachprüfung beschränkt sich auf Befund 5.

## Nacharbeit zu Runde 12 · Abbruchmeldung · 2026-09-30

Commit `f28417c` setzt für SIGTERM beim **Stack-Start** den Exit-Code 143
und gibt nach erfolgreichem Aufräumen eine übersetzte Abbruchmeldung auf
stderr aus. Das normale Beenden des laufenden Einzelservers behält Exit 0.

- Gezielt SIGTERM zwischen Start und Registrierung des API-Kindes gesendet:
  Stack-CLI endete mit 143 und „Local test stack start cancelled; own
  processes and data removed“. Danach waren alle Kinder beendet und die
  Zustands- und Testdatenpfade leer.
- Zwei normale Stack-Start/Status/Stopp-Zyklen bestanden unverändert. Die
  drei Temp-Präfixe waren danach leer.
- `make test` mit Homebrew-Bash 5.3 im `PATH`: 806 Frontend- und 8 API-Tests
  bestanden. Beide Lints, beide Typechecks, Ruff, Python-Syntax und
  `git diff --check` waren erfolgreich. `msgfmt` hat den deutschen Katalog
  für die neue Meldung kompiliert.

**Doku-Abgleich:** `README.md` (**Setup**, **Commands**) und `AGENTS.md`
(**Bauen und prüfen**) beschreiben den normalen Start/Stopp und die
Aufräumgarantie. Der korrigierte Fehlercode ändert keinen Bedienungsschritt.
`docker/README.md` (**Quick start**, **Configuration**, **Data and backups**)
betrifft den lokalen Teststack nicht. Keine Textänderung nötig; Board- und
Lessons-Konventionen unverändert.

## Übergabe an Claude · technische Runde 13 · 2026-09-30

Bitte Befund 5 aus Runde 12 an `f28417c` nachprüfen: Ein per SIGTERM
abgebrochener Stack-Start muss nach dem Aufräumen mit Fehlercode 143 und
übersetzter Meldung enden. Der gesamte Lebenszyklus wurde in Runde 12
bereits unabhängig geprüft. Mikes T-63-Abnahme erfolgt nach T-61/T-62;
Merge und Push bleiben offen.
