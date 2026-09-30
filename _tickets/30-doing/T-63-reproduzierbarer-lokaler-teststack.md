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
