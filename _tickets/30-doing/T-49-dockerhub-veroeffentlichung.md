# T-49 · Docker-Hub-Veröffentlichung prüfen und vervollständigen

Der aktuelle App-Stand soll als Docker-Image mit passender Docker-Hub-Übersicht
veröffentlicht werden. Bisher fehlen die automatische README-Übertragung und
eine klare Trennung zwischen lokalem Build und Veröffentlichung. Das Projekt-README war für Docker Hub zu lang und enthielt zu viele
Entwicklungsdetails. Docker Hub erhält deshalb eine eigene Container-Anleitung.

**Auftrag · Mike, 2026-09-26:** Dockerfile prüfen, passende Make-Ziele und
Docker-Hub-Push erledigen; StockInfo T-77 als Vorlage für den zentralen
README-Helfer nutzen und das Größenlimit in AGENTS.md verankern.

**Stand:** Implementiert und als Commit `f70516e` mit echtem Container und
Browser geprüft. Claude hat Runde 1 technisch freigegeben (eigener
arm64-Testbuild plus echter Container). Mikes Nachtrag (eigenes
`docker/README.md`, früher GitHub-Link, gegenseitige Links, sowie die
nachgereichte README-Pflegeregel) ist in Runde 2 (`c059f4d`) technisch
freigegeben. Veröffentlichung durch Codex steht aus.
StockInfo/ProjectTools werden nur als bestehende Abhängigkeiten gelesen;
keine parallele Implementierung oder Änderung in deren Arbeitsbäumen.

**Für Mike:** Die zentrale Aufnahme der Unraid-Vorlage ist noch offen; die
lokale Vorlage ist korrigiert. Veröffentlichung, lokale
Prüfung und unabhängiger Review werden mit ihren tatsächlichen Ergebnissen
getrennt dokumentiert. Kein Versionssprung oder Master-Merge impliziert.

## Umfang und Umsetzung

1. Dockerfile, Laufzeitkonfiguration, Build-Kontext und bestehende Targets prüfen.
2. Aktuellen BashLib-Buildablauf übernehmen: lokaler Testbuild, expliziter
   Build/Push, unveränderliche Image-ID für späteren Push; amd64 als Serverziel.
3. ProjectTools-README-Helfer einmal nach erfolgreichem Hub-Push anbinden.
   Vorschau und 25.000-UTF-8-Byte-Grenze vor Veröffentlichung prüfen;
   `docker/README.md` als eigene Container-Anleitung verwenden; GitHub-Link
   weit oben, Links aus dem Projekt-README, AGENTS.md und Anleitungen nachziehen.
4. Befehle/Fehlerpfade und echtes Containerverhalten prüfen, Review übergeben,
   autorisierte Veröffentlichung ausführen und Registry/README nachweisen.

## Verify

| # | Prüfung | AI |
|---|---|:--:|
| 1 | Dockerfile, Laufzeit-API und Healthcheck am amd64-Release-Build f70516e geprüft | ✅ |
| 2 | Help, Make-Dry-Runs und 17 Prozessgrenzen-Tests zu Plattform-/Push-Fehlern erfolgreich | ✅ |
| 3 | Zentraler README-Helfer; Vorschau/Upload wählen docker/README.md; Reihenfolge/Fehlercodes geprüft, Live-Aufruf offen | ✅ |
| 4 | Eigene Docker-Anleitung: echte Vorschau 4.078 UTF-8-Bytes, früher GitHub-Link und korrekte Dokumentlinks; AGENTS-Regel angepasst | ✅ |
| 5 | Echter amd64-Container: Desktop 1440 und Mobile 390, Testdepot/Neuladen/Kursverlauf erfolgreich | ✅ |
| 6 | 781 Tests, Lint, Typecheck, ShellCheck/XML; Doku und Lessons abgeglichen | ✅ |
| 7 | Image auf Docker Hub, Architektur/Tag und README-Rücklesen belegt | ➖ |

## Konventionsstand und Abhängigkeit

T-77 liegt im StockInfo-Board unter `30-doing/`; der Helfer liegt ausschließlich
in ProjectTools. Der neue dortige Commit `a1908f7` verwendet `docker/README.md`
als Standardquelle; StockPortfolio setzt denselben Pfad zusätzlich explizit.
Vor Veröffentlichung dessen endgültigen Stand erneut prüfen, da Mike dort
weitere Anpassung beauftragt hat. Keine lokale Kopie und keine fremde Freigabe
übernommen. Das StockPortfolio-Board bleibt auf `2026-09-11-activity-feed`;
offene Übernahme von `lessons-follow-through` bleibt sichtbar und benötigt
ihren eigenen Board-Auftrag.

## Erweiterung · Unraid-Template

Mike beauftragt zusätzlich die Prüfung von
`/Volumes/DevLocal/DevUnraid/Production/Templates`. Dort ist derzeit nur
StockInfo vorhanden; keine StockPortfolio-Vorlage. Die lokale Vorlage hat
veraltete Texte/URLs und wird gegen das geprüfte Image korrigiert. Zentrale
Aufnahme und Veröffentlichung sind als Umfangsfrage an Mike gestellt.
Template-Repository ist sauber, Branch master; keine eigenen AGENTS.md gefunden.

## Präzisierung · Auslieferung ohne nginx

Mike: „nginx sollte dazu nicht notwendig sein“. Der vorhandene nginx wird
entfernt; statische Auslieferung über Node/`serve` mit eigenem Dependency-Lock
unter `docker/runtime/`, kein API-Backend. Laufzeitkonfiguration wird mit
`JSON.stringify` geschrieben. Containerport 8080, Prozess als Benutzer node.
Cache-Regeln für index/config und gehashte Assets bleiben wirksam.

## Präzisierung · Make-Targets wie StockInfo

Mike möchte `build` statt `build-and-push` und verweist auf StockInfo.
Dort baut `make build` lokal; `make push` veröffentlicht anschließend den
geprüften Stand. Genau diese Aufteilung gilt hier ebenfalls, mit `PLATFORM=x86` (amd64) als
Vorgabe und `PLATFORM=arm` für den Mac. Keine zusätzlichen Make-Targets
`build-local` oder `build-and-push`. Der reine Frontend-Build heißt
`make build-frontend`; `npm run build` bleibt unverändert.
Auch die Script-Option `--build-and-push` samt direktem Veröffentlichungsweg
ist auf Mikes Hinweis entfernt; `--build` unterstützt nur eine lokale Plattform.

`make` ohne Target zeigt wie StockInfo die Hilfe. Registry-Vorgabe bleibt
`dockerhub` (im Buildscript); `TARGET=ghcr`/`ecr` sind explizite Abweichungen.

## Implementierungsnachweis · 2026-09-26

- `make test`: 61 Dateien, 781 Tests erfolgreich; darunter 17 Tests in
  `tests/dockerBuild.spec.ts`. `make lint` und `make typecheck`: Exit 0.
  Prozessgrenzen simulieren Docker/BashLib/README-Aufruf, keine Testveröffentlichung.
- `bash -n` und ShellCheck für Build/Entrypoint, XML-Prüfung der lokalen Vorlage,
  `git diff --check`: erfolgreich. `make -n build build-frontend push`
  belegt die von Mike gewünschten Target-Namen; `make help` zeigt die Wirkungen.
- Wirklicher Build `stockportfolio-t49-check:latest`, linux/amd64, Node 22/serve
  14.2.6. Container `stockportfolio-t49-smoke`, Port 55095 → 8080, UID/GID 1000,
  TZ Europe/Vienna. Healthcheck healthy; `/` und `/config.js` HTTP 200/no-cache;
  gehashte JS-Datei immutable/31536000; `/assets/` und `/package.json` HTTP 404.
- Browser: `http://127.0.0.1:55095`, isolierter Kontext
  `stockportfolio-t49-container`. Vorhandene `valid-portfolio.backup.json` über
  Settings/Sicherung importiert und bestätigt. Fünf Positionen, EUR 5.000,
  Datenlage vollständig; MSCI-Kursverlauf +6,4 % öffnet über Sparkline.
  Neuladen erhält das Depot. Mobile 390 px: Dokumentbreite ebenfalls 390 px.
  Browser steht wieder auf Desktop. Keine Daten anderer Browserkontexte ersetzt.
- Derselbe dauerhafte StockInfo-Prüfhelfer läuft separat auf 8901; neue Option
  `--origin http://127.0.0.1:55095` erlaubt die Containerprobe ohne Eingriff in
  den bestehenden 5189/8899-Testaufbau. Historische FX-Zeitreihe fehlt bewusst
  im Fixture; entsprechender Rückblick-Hinweis ist keine Transportstörung.
- Gefundener und korrigierter Einzelfall: `cleanUrls: false` zusammen mit
  deaktiviertem Directory Listing ergab für `/` HTTP 404. Option entfernt,
  Image neu gebaut, `/` und Healthcheck erneut erfolgreich geprüft.
- Bezeichnerinventar des neuen TypeScript-Tests und Bash-Zuweisungen/Funktionen:
  englische Namen. Keine lokale Kopie der BashLib-Loginfunktion und kein eigener
  README-Konverter; ProjectTools wird direkt aufgerufen.

**Doku-Abgleich:** README: Produktbeschreibung, gekürzte Darstellung, Setup,
Commands, Docker/Publishing/API/Unraid und Sicherung; AGENTS: Build-Namen und
25.000-Byte-Regel; `unraid/README.md` und XML: API aus Browsersicht, Port 8080,
Browser-Daten, Update-Hinweis; Browser-Fixture-Anleitung: eigener Container-Origin.
Datei-/Überschrifteninventar unter `docs/` geprüft: alte nginx-Entwurfsabschnitte
liegen in der historischen Spezifikation vom 2026-08-06 und bleiben historisch.
Keine Board-/Lessons-Konvention geändert; Skill-Abgleich ohne zentrale Änderung.

**Lessons:** SP-CX-01 (direkter Shared-Helfer), SP-CX-02 (alle aktuellen
Betriebsaussagen), SP-CX-04 (ein Testserver unter scripts), jeweils lokale
Formatfassung 1; SP-R-01 ergänzend durch tatsächlichen Browser-Reload geprüft.
SP-CX-03: Scheduler-Zelle 473 meldete um 11:12 UTC einen Folgetakt; danach
fehlten bis 11:26 UTC sichtbare Heartbeats. Keine durchgehende Beobachtung
behauptet; STATUS wird während der Arbeit unmittelbar geprüft. Der Root-404 ist ein behobener Einzelfall, keine erfundene Wiederholung.

**Noch offen:** unabhängiger Review und tatsächlicher Push mit
Registry-/README-Rücklesen. Keine Veröffentlichung aus Mock-Tests abgeleitet.
Echter Unraid-Betrieb und produktive StockInfo-CORS-Konfiguration sind ungetestet.
Zentrales Template-Repository enthält weiterhin nur StockInfo; Veröffentlichung
von StockPortfolio dort benötigt die angefragte Umfangsentscheidung.

## Finaler Build · Prüffassung f70516e

`make build` im isolierten Worktree `/private/tmp/stockportfolio-t49-release`
erfolgreich (Exit 0). Standard `PLATFORM=x86`, Image
`mangolila/stockportfolio:0.2.0-260926.1126.f7051.ahead146`.
Gespeicherte Image-ID:
`sha256:c323ca708648d4030fb0c7546a92b13aeda8e86f65ca83441f1b18aa038e55f9`.
Produktdateien entsprechen dem Commit; Build-Eingaben ohne lokale Konfiguration.
Die separat verlinkten Bibliotheken gehören nicht in den Docker-Kontext.
Worktree ist jetzt laut `git status --short` sauber; der anfangs unversionierte
`.libs`-Symlink wurde durch das regulär ignorierte Verzeichnis mit drei Links ersetzt.

Container am selben Testport durch genau dieses Image ersetzt: healthy,
linux/amd64, USER node. OCI-Beschreibung englisch und umfasst Portfoliomanagement,
Kurse, Bewertung, Charts und Rebalancing. Root/config HTTP 200 mit no-cache.
Zusätzlicher kurzlebiger Container bestätigt JSON-Roundtrip einer API-Adresse
mit Quotes und Backslash. Browser nach Reload: weiter fünf Positionen,
EUR 5.000 und Datenlage vollständig. Originaler 5189-Testkontext unverändert.

Finale Suite nach Vereinfachung des Scripts: 61 Dateien / 781 Tests,
`make lint`, `make typecheck`, ShellCheck, bash -n, XML und diff-check erfolgreich.
`make` und `make help` liefern identische Hilfe; Dry-Run build/push ruft wie
StockInfo `--build x86` und `--push` auf. Vorschau weiterhin 23.613 UTF-8-Bytes
bei Ref master. Für Veröffentlichung wird eine veröffentlichte Prüffassung als
`DOCKER_README_REF` verwendet und deren endgültige Größe erneut geprüft.

**Review-Auftrag Runde 1:** Produktdiff von `f867331` nach `f70516e` prüfen,
insbesondere Build/Push-Trennung, Laufzeit ohne nginx, Shared-README-Anbindung,
Browserkonfiguration, Cache-Regeln und aktuelle Anleitungen. Kein Push durch
den Verifier. Nach Freigabe führt Codex den bereits beauftragten Image-/README-Push
mit Registry-Nachweis aus. StockInfo T-77/ProjectTools ist eine externe, noch
in Runde 1 geprüfte Abhängigkeit; keine fremden Rollen oder Freigaben übernommen.

**Scheduler:** Zelle 473 wegen fehlender sichtbarer Heartbeats beendet; pmset
zeigt für den relevanten Zeitraum keine Systemruhe. Ersatz-Zelle 531 startet
um 11:27:28 UTC mit 300-Sekunden-Takt und sichtbarem Startsignal. Ein Folgetakt
ist bei dieser Übergabe noch abzuwarten; keine rückwirkende Abdeckung behauptet.

## Reviewer-Prüfung (Claude, Runde 1, Fassung `f70516e`)

**Technische Freigabe.** `make test` (61 Dateien, 781 Tests — darunter die 17
neuen `tests/dockerBuild.spec.ts`), `make lint` und `make typecheck` selbst
gegen die Übergabefassung ausgeführt — alle drei ohne Befund, deckungsgleich
mit der Übergabe. `bash -n` und `shellcheck` auf `docker/build.sh` und
`docker/entrypoint.sh`: beide sauber. `git diff --check f867331..f70516e`:
sauber.

**Diff vollständig gelesen** (19 Dateien). Kernpunkte:

- `Dockerfile`: sauberer Zweistufenbau, Laufzeit ohne nginx (Node 22 +
  `serve`), `USER node`, Healthcheck über `node -e fetch(...)`, OCI-/Unraid-
  Labels korrekt gesetzt.
- `entrypoint.sh`: schreibt `config.js` per `JSON.stringify` über einen
  Node-Heredoc — sicher gegen Quotes/Backslashes in der API-Adresse (live
  geprüft, siehe unten); `exec "$@"` erhält korrektes Signal-Handling.
- `docker/runtime/serve.json`: `no-cache` für `**`, `immutable`/1 Jahr für
  `assets/**`, `directoryListing: false` — das von Codex dokumentierte
  `cleanUrls`-Problem ist tatsächlich behoben (Option entfernt, nicht nur
  umgestellt).
- `Makefile`: gegen den Skill `makefile-conventions` geprüft — Kopf
  (`BASH_LIBS`/`PROJECT_TOOLS`/`DEV_MAKE`, `export`, `-include`), `help`/
  `info`/`hints`, `precheck`, `setup`, `status`, Zielreihenfolge und
  `tag-and-push-*` entsprechen dem Grundgerüst. `build`/`push` statt
  `docker-build`/`docker-push`, `build-frontend` statt `build` — genau die
  von Mike geforderten Namen. Einzige Abweichung: `precheck` ist eine knappe
  Einzeiler-Fassung statt des vollen farbigen Templates — funktional
  gleichwertig, nicht blockierend.
- `docker/build.sh`: `saveBuild`/`loadBuild` binden Version **und** `latest`
  an dieselbe validierte Image-ID (Regex-Prüfung von Tag/ID/Timestamp vor
  Verwendung, kein `eval`/`source` der Markerdatei); ein fehlgeschlagener
  Rebuild kann nicht per `--push` veröffentlicht werden (`_KIND != single`).
  `updateDockerHubReadme` ruft ausschließlich den geteilten
  `$PROJECT_TOOLS/bash/dockerhub-readme.sh` auf (keine lokale Kopie),
  `--preview` vor und `--publish` **nach** dem Image-Push, nur für
  `TARGET=dockerhub`, Token ausschließlich über `--token-file`. `PLATFORM=all`
  ist explizit gesperrt („Eine Plattform wählen: x86 oder arm.“); `--build`
  und `--push` sind getrennte, nicht verkettete Pfade — kein
  `--build-and-push` mehr vorhanden.
- `AGENTS.md`: 25.000-UTF-8-Byte-Regel und Build-Zielnamen korrekt verankert.
- `unraid/stockportfolio.xml`: wohlgeformt (`xml.dom.minidom` geprüft), Port
  8080/TZ-Default UTC konsistent mit dem Dockerfile.
- `scripts/stockinfo-test-server.py`: neue `--origin`-Option für isolierte
  Containerproben, sauber auf `CORS_ORIGINS`/`Access-Control-Allow-Origin`
  durchgereicht.
- `tests/fixtures/browser/README.md`: „Einstellungen → Verweise“ zu
  „Einstellungen → Links“ korrigiert — deckt sich mit dem bereits separat
  akzeptierten Label-Fix `3b63788` (Teil von T-48s Abschluss), kein neuer
  Rückschritt.

**Live selbst nachgebaut und getestet** (nicht nur die Coder-Angaben
übernommen): `make build PLATFORM=arm` lokal ausgeführt (eigener
arm64-Testbuild, da Zweitprüfung des bereits getesteten amd64-Pfads keinen
Zusatznutzen hätte). Container über `docker run -p 18080:8080` gestartet und
unabhängig geprüft:

- `/` → 200, `Cache-Control: no-cache`, korrekter Inhalt.
- `/config.js` → `window.__STOCKPORTFOLIO_CONFIG__ = {"apiUrl":"...","container":true};`
  mit no-cache.
- Gehashtes Asset (`assets/index-*.js`) → `Cache-Control: public,
  max-age=31536000, immutable`.
- `/assets/` (Verzeichnis ohne Datei) → 404, kein Directory-Listing.
- `docker exec ... id` → `uid=1000(node) gid=1000(node)`, kein root.
- `which nginx` im Container → nicht vorhanden, bestätigt „ohne nginx“.
- Healthcheck nach Start → `healthy`.
- Sonderzeichen-Probe: `STOCKINFO_API_URL='https://a"b\c.test'` ergibt
  `{"apiUrl":"https://a\"b\\c.test",...}` in `config.js` — mit Node
  nachgeprüft, dass dieser Ausdruck exakt `https://a"b\c.test` zurückliefert.
- README-Vorschau selbst mit dem echten `dockerhub-readme.sh --preview --ref
  master` erzeugt: **23.613 UTF-8-Bytes**, exakt wie im Ticket behauptet, klar
  unter dem 25.000-Byte-Limit.
- `make help`/`make hints`/`make -n build build-frontend push`: Ausgaben
  geprüft, `build`/`push`/`build-frontend`-Namen und Docker-Hinweise korrekt.

**Nebenwirkung erkannt und behoben:** Mein eigener `make build
PLATFORM=arm`-Testlauf hat `docker/.last-build-tag` (gitignored, lokaler
Marker für `push`) sowie den `latest`-Tag auf mein Testbild umgeschrieben —
dadurch hätte ein nachfolgender `make push` versehentlich meinen
Review-Build statt Codex' geprüften amd64-Build (`f70516e`,
`sha256:c323ca708648...`) veröffentlicht. Behoben: eigenes Testimage entfernt,
`latest` wieder auf `c323ca708648` (Codex' Build) zurückgetaggt, Marker-Datei
mit den im Ticket dokumentierten Werten (Tag `0.2.0-260926.1126.f7051.ahead146`,
dieselbe Image-ID) neu geschrieben und gegen `docker image inspect`
verifiziert. Für den eigenen Testbuild war zusätzlich ein Commit nötig
(`0c50b9a`, nur `_tickets/ACTIVITY.md` — `build.sh` bricht bei unclean
working tree ab); kein Produktcode berührt. Codex sollte vor `make push`
dennoch einmal `git status`/`docker/.last-build-tag` gegenkontrollieren, da
dies lokaler Maschinenzustand ist, kein versionierter Nachweis.

**Kein Push durch den Verifier** — wie im Review-Auftrag verlangt; nur
`--preview` (lesend) und lokale `--build`/`docker run`-Verifikation.

**Ergebnis:** Fassung `f70516e` technisch freigegeben. Kein `changes_requested`.
StockInfo T-77/ProjectTools bleibt eine geprüfte externe Abhängigkeit (eigener
Prüfstand `8780252`/`a7e37ba`); keine fremde Rolle oder Freigabe übernommen.
Codex führt den bereits beauftragten Image-/README-Push aus und dokumentiert
den Registry-Nachweis (Punkt 7 der Verify-Tabelle) separat.

## Observer-Hinweis · Lokaler Veröffentlichungsstand · 2026-09-26

Der Reviewer hat in Runde 1 belegt, dass sein arm64-Testbuild den lokalen
Push-Marker und `latest` verändert hat, und beide anschließend wiederhergestellt.
Das ist eine konkrete Nebenwirkung der Prüfung, kein nachgewiesener falscher
Registry-Push. SP-R-01 betrifft eine andere Ursache (Datenerhalt nur am Lesepfad
begründet); dafür wird keine Wiederholung oder neue Lesson behauptet.

Vor dem tatsächlichen Push den vorgesehenen Produktcommit, Marker, Image-ID
und `linux/amd64` zusammen abgleichen und im Veröffentlichungsnachweis nennen.
Für weitere lokale Buildproben auch ignorierte Marker und gemeinsame Docker-Tags
als veränderten Zustand behandeln; eigener Worktree allein isoliert die Tags
nicht. Ein nach dem README-Nachtrag neu gebautes Image erhält seinen eigenen
Nachweis. Die technische Freigabe von Runde 1 bleibt unverändert.

## Nachtrag · eigenes Docker-Hub-README · 2026-09-26

**Mike:** Eigenes README im docker-Ordner, weil das Projekt-README für Docker Hub
nicht geeignet ist. GitHub-Verweis weit oben; das normale README soll auf diese
Anleitung und das Docker-Hub-Repository verlinken.

- Neues `docker/README.md`: englische Container-Anleitung mit Produktumfang,
  GitHub-Link direkt unter der Kurzbeschreibung, docker run/Compose, API/CORS,
  Port/Timezone, Browser-Speicher und Sicherung, Updates, Unraid und Support.
- Projekt-README verlinkt beide Ziele bereits in der Einleitung und benennt
  die separate Upload-Quelle im Publishing-Abschnitt.
- `docker/build.sh` übergibt `--readme docker/README.md` für Vorschau und Upload.
  Keine neue Option, kein neuer Konverter und kein neuer Make-Target im Projekt.
  Der inzwischen angepasste Shared-Helfer (`a1908f7`) nutzt denselben Default.
- `AGENTS.md` bindet die 25.000-UTF-8-Byte-Grenze an die konvertierte
  Docker-Beschreibung. Das Projekt-README unterliegt dieser Hub-Grenze nicht.
- Echte Vorschau explizit und mit neuem Default: bytegleich, **4.078 Bytes**.
  Relative Links aus docker/ werden richtig auf `unraid/README.md` und das
  Projekt-README aufgelöst, ohne falsches zusätzliches docker-Verzeichnis.
- Angepasste Prozessgrenzen-Tests prüfen den Quelldateipfad sowohl für Vorschau
  als auch Upload, einschließlich der bisherigen Fehlerpfade. Voller Lauf:
  **61 Dateien / 781 Tests**, Lint/Typecheck, ShellCheck/bash -n und diff-check grün.

**Doku-Abgleich:** `docker/README.md`, Projekt-README (Einleitung/Publishing)
und AGENTS (Hub-Beschreibung) stimmen in Quelle, Ziel und Grenze überein.
Unraid-Anleitung bleibt fachlich gültig und wird verlinkt. Keine Änderung an
App oder Containerlaufzeit: Browser-/Containerbelege von Runde 1 gelten weiterhin
für genau deren Fassung; kein neuer Lauf behauptet. SP-CX-01/02, lokale
Formatfassung 1: Shared-Helfer direkt verwendet und alle aktuellen Quellangaben
nachgezogen. Frühere 23.613-Byte-Belege oben gehören zur historischen Root-README-
Prüffassung. Veröffentlichung weiterhin offen; neue Anleitung noch nicht hochgeladen.

## Reviewer-Prüfung (Claude, Runde 2, Fassung `8a8e77a`) — begrenzter Umfang

**Technische Freigabe.** `make test` (61 Dateien, 781 Tests — unverändert
gegenüber Runde 1), `make lint` und `make typecheck` selbst gegen die
Übergabefassung ausgeführt — alle drei ohne Befund. Diff seit `f70516e`
gelesen (6 Dateien, nur Doku/Konfiguration, keine Laufzeit-/Containeränderung
— Runde 1s Live-Belege bleiben deshalb unberührt gültig).

- `docker/build.sh`: `--readme docker/README.md` an beiden Aufrufstellen
  (`--preview` und `--publish`) ergänzt, sonst unverändert.
- `tests/dockerBuild.spec.ts`: Die Fake-Nachbildung des Helfers verfolgt jetzt
  den übergebenen Quellpfad und prüft ihn in allen bestehenden Fällen
  (Erfolg, gescheiterter Rebuild, Vorschau-/Push-Fehler, ghcr/ecr ohne
  Hub-README) mit — echte Testabdeckung, keine reine Kosmetik.
- `docker/README.md` (neu, 111 Zeilen): GitHub-Link unmittelbar nach der
  Kurzbeschreibung, danach Quick Start, Compose, Konfigurationstabelle,
  Daten/Backup, Update-Hinweis (inklusive Port-80→8080-Migration) und
  Unraid/Support mit Links zu `../unraid/README.md`, `../README.md` und den
  GitHub-Issues. Inhaltlich deckt sich das mit allem, was ich in Runde 1 am
  echten Container bestätigt habe (Port 8080, UID 1000, kein Volume,
  Healthcheck prüft nur die Seite, Default `linux/amd64`).
- `README.md`/`AGENTS.md`: Einleitung verlinkt Anleitung und Docker-Hub-Repo,
  Publishing-Abschnitt und die 25.000-Byte-Regel beziehen sich jetzt
  ausdrücklich auf `docker/README.md`, nicht mehr aufs Projekt-README.

**Unabhängig nachvollzogen, nicht nur den Angaben vertraut:**

- `--readme` gegen den tatsächlich installierten Shared-Helfer geprüft
  (`.libs/ProjectTools/src/python/dockerhub-readme.py`): eine echte,
  aktuell unterstützte Option (`-s/--readme`, `type=Path`), deren
  **Default bereits `docker/README.md` ist** — genau wie im Ticket
  behauptet (Commit `a1908f7`). Das ausdrückliche Setzen im Buildscript ist
  eine bewusste Absicherung gegen einen künftig geänderten Default, keine
  Notwendigkeit für die aktuelle Fassung.
- Vorschau selbst erzeugt: `./.libs/ProjectTools/src/bash/dockerhub-readme.sh
  --readme docker/README.md --preview --ref master --output ...` →
  **4.078 UTF-8-Bytes**, exakt wie behauptet, weit unter dem Limit.
- Im erzeugten Vorschautext geprüft: GitHub-Link steht tatsächlich als erste
  Zeile nach der Kurzbeschreibung; die relativen Links am Ende lösen korrekt
  zu `https://github.com/MikeMitterer/stockportfolio/blob/master/unraid/README.md`
  bzw. `.../README.md` auf — keine falsche zusätzliche `docker/`-Ebene.

**Nachtrag zu `c059f4d` (README-Pflegeregel, während dieser Runde
nachgereicht):** Neue `AGENTS.md`-Regel verlangt, `README.md` und
`docker/README.md` bei jeder betreffenden Änderung inhaltlich abzugleichen.
Selbst gegengeprüft: beide Dateien stimmen bei Container-Port 8080,
TZ-Default UTC und dem Port-80→8080-Migrationshinweis überein
(`grep` auf beide Dateien, keine Abweichung gefunden). Keine Inhaltsänderung
für diese Runde nötig; der neue Regeltext selbst ist klar und widerspruchsfrei.

**Ergebnis:** Fassung `c059f4d` technisch freigegeben. Kein `changes_requested`.
Kein Push durch mich — wie in Runde 1 nur lesende Vorschau. Die
Laufzeit-/Containerverifikation aus Runde 1 (`f70516e`) bleibt unverändert
gültig, da dieser Nachtrag ausschließlich Dokumentation/Konfiguration betrifft.
Codex führt die bereits beauftragte Veröffentlichung inklusive Registry-/
README-Nachweis aus.
