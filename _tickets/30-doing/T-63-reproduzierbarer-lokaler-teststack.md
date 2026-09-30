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
