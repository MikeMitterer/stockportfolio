# T-49 · Docker-Hub-Veröffentlichung prüfen und vervollständigen

Der Auftrag war die Veröffentlichung des App-Stands als Docker-Image mit
passender Docker-Hub-Übersicht. Anfangs fehlten die automatische README-Übertragung
und eine klare Trennung zwischen lokalem Build und Veröffentlichung. Das
Projekt-README war für Docker Hub zu lang und enthielt zu viele Entwicklungsdetails.
Docker Hub erhielt deshalb eine eigene Container-Anleitung.

**Auftrag · Mike, 2026-09-26:** Dockerfile prüfen, passende Make-Ziele und
Docker-Hub-Push erledigen; StockInfo T-77 als Vorlage für den zentralen
README-Helfer nutzen und das Größenlimit in AGENTS.md verankern.

**Stand: abgeschlossen · 2026-09-26.** Mike: „T-49 ist erledigt“.
Die Implementierung ist in vier Runden technisch freigegeben. Screenshot und
Unraid-Anleitungen sind anschließend auf Mikes Auftrag ergänzt und in `master`
veröffentlicht. Die letzte unabhängige Freigabe bleibt Runde 4 (`7aef019`).

**Veröffentlichung:** Mike bestätigt: „Docker-Hub-Push habe ich erledigt“.
Der Image-Push ist damit durch Mike als ausgeführt gemeldet. Ein unabhängiges
Registry-/README-Rücklesen durch die KI wurde nicht nachgetragen (Verify #7).
Die nachstehenden Zwischenstände dokumentieren die frühere Bearbeitung und
erzeugen keinen neuen Auftrag.

**Für Mike:** Kein offener Abnahmeschritt in diesem Ticket. Die Unraid-Vorlage
liegt ausschließlich im zentralen Templates-Repository.

## Ursprünglicher Umfang und Umsetzung

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
| 2 | Help, Make-Dry-Runs und 19 Prozessgrenzen-Tests zu Plattform-/Push-Fehlern erfolgreich | ✅ |
| 3 | Zentraler README-Helfer; Vorschau/Upload wählen docker/README.md; Reihenfolge/Fehlercodes geprüft, Live-Übertragung nicht unabhängig geprüft | ✅ |
| 4 | Eigene Docker-Anleitung: letzte Vorschau 4.772 UTF-8-Bytes, früher GitHub-Link und korrekte Dokumentlinks; AGENTS-Regel angepasst | ✅ |
| 5 | Echter amd64-Container: Desktop 1440 und Mobile 390, Testdepot/Neuladen/Kursverlauf erfolgreich | ✅ |
| 6 | 783 Tests, Lint, Typecheck, ShellCheck/XML; Doku und Lessons abgeglichen | ✅ |
| 7 | Image-Push durch Mike als erledigt bestätigt; unabhängiger Architektur-/Tag- und README-Rücklesen-Nachweis fehlt | ➖ |

## Historische Bearbeitung

Die folgenden Abschnitte geben die jeweiligen Zwischenstände wieder. Frühere
Aussagen zu offenen Veröffentlichungen und Übergaben sind keine aktuellen
Arbeitsaufträge; maßgeblich sind der Abschluss oben und Verify #7.

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


## Abgleich mit neuen Docker-Skills · 2026-09-26 · Runde 3

**Auftrag:** Mike verlangt den Projektabgleich mit den neuen Docker-Skills.
Gelesen: `docker-conventions`, `docker-build-script`, `unraid-ca-template`.
Die bewussten Projektentscheidungen bleiben gültig: Node/serve ohne nginx,
`make build` lokal mit x86-Vorgabe, getrenntes `make push`, keine Option
`--build-and-push`, gemeinsame BashLib und gemeinsamer README-Helfer.
Dockerfile, Benutzer/Port/TZ, Healthcheck, API aus Browsersicht, Persistenz,
Make-Vorgaben und lokales Unraid-Template stimmen damit überein.

**Gefunden und behoben:**

- Ein neuer Buildversuch mit ungültiger Plattform oder unsauberem Git-Stand
  ließ den vorherigen Push-Marker stehen. Zwei neue Prozessgrenzen-Gegenproben
  reproduzierten den Fehler vor der Korrektur; danach sind beide grün.
  Der Marker wird jetzt vor Bibliotheksladen, Plattformwahl und Git-Prüfung
  entfernt. Kein Registry-Push wurde für diese Tests ausgeführt.
- `docker/preview/` fehlte in Git- und Docker-Ausschlüssen. Beide ergänzt;
  `git check-ignore` bestätigt den Git-Ausschluss.
- Docker-Anleitung ergänzt um Netzwerkbindung/fehlenden Login und konkrete
  Status-/Log-Befehle. Projekt-README erklärt dieselbe Zugriffskontrolle und
  die vom Shared-Helfer benötigten PAT-Rechte Read/Write/Delete.
- Die bisherige README-Behauptung einer bereits verfügbaren Veröffentlichung
  ist korrigiert. Mike bestätigt: Es wurde noch nichts auf Docker Hub gepusht;
  das kommt erst. Der HTTP 404 von öffentlicher Hub-Seite und Repository-API
  ist damit erwartbar, kein Setup-Fehler. Veröffentlichung und anschließend
  Registry-/README-Rücklesen bleiben offen.

**Prüfnachweise:**

- Vollsuite: 61 Dateien / 783 Tests; Lint erfolgreich. Typecheck fand zunächst
  einen optionalen undefined-Wert im neuen Testparameter; beide Testfälle
  setzen nun TAG_RC ausdrücklich. Abschließender Typecheck und alle 19
  Docker-Prozesstests erfolgreich. Logs: `/tmp/t49-audit-tests.log`,
  `/tmp/t49-audit-lint.log`, `/tmp/t49-audit-marker-final.log`.
- `bash -n`, ShellCheck, XML und `git diff --check` erfolgreich. Make-Default
  und Help identisch; Dry-Run bestätigt build x86 / push / build-frontend.
- Shared-Helfer mit Standardquelle und Standardausgabe wirklich ausgeführt:
  `docker/preview/README.md`, 4.609 UTF-8-Bytes. Kein Upload.
- Bestehenden amd64-Testcontainer gestoppt: Exit 0 innerhalb des Zeitlimits.
  Wieder gestartet: running/healthy. Browser-Reload am Desktop (1440 px)
  erhält das Browser-Testdepot mit allen fünf Positionen und Bewertung.
  Keine neue Mobile-Probe behauptet; Laufzeit unverändert gegenüber Runde 1.
- Observer-Hinweis verarbeitet: Root- und Worktree-Marker zeigen auf
  `0.2.0-260926.1126.f7051.ahead146`; Versionstag und latest stimmen mit
  `sha256:c323ca708648d4030fb0c7546a92b13aeda8e86f65ca83441f1b18aa038e55f9`
  überein, Architektur linux/amd64, Laufzeitproduktcommit f70516e. Echter
  Node/serve-Prozess läuft mit UID/GID 1000. Vor dem tatsächlichen Push diesen
  veränderlichen lokalen Zustand erneut prüfen.
- Zentrales Templates-Repo sauber bei `87b89cd`, weiterhin nur StockInfo;
  StockPortfolio dort nicht vorhanden. Lokales XML wohlgeformt, Icon 256×256.
  GitHub-Projekt, Issues und raw-Icon jeweils HTTP 200. Keine zentrale Vorlage
  geschrieben und kein echter Unraid-Betrieb behauptet.

**Doku-Abgleich:** Beide READMEs gemeinsam geprüft und angepasst (Docker,
Publishing, Quick Start, Status/Logs). AGENTS enthält bereits die gemeinsame
Pflegeregel und 25.000-Byte-Grenze; keine weitere Änderung nötig.
Unraid-Anleitung/XML bleiben für Port, API, Nutzer und browserseitige Daten
zutreffend. Skill-Verfahren unverändert; keine zentrale Skill-Kopie geändert.
Board-Übernahme bleibt sichtbar offen (`activity-feed` → `lessons-follow-through`).
SP-CX-01/02/04 und SP-R-01 nochmals gelesen: vorhandene Helfer verwendet,
aktuelle Veröffentlichungsbehauptung korrigiert, echtes Depot nach Reload geprüft.

**Review-Auftrag Runde 3:** Nur den Nachtrag seit c059f4d prüfen: frühe
Marker-Entwertung samt zwei Gegenproben, Vorschau-Ausschlüsse und ergänzte
Anleitungen. Bestehende Containerlaufzeit ist unverändert. Kein Push durch den
Verifier. Nach technischer Freigabe bleibt Codex für die bereits beauftragte
Veröffentlichung zuständig.


## Nachtrag · zentrale Unraid-Vorlage als einzige Quelle · 2026-09-26

Mike legt `/Volumes/DevLocal/DevUnraid/Production/Templates` als Ablage fest
und verlangt ausdrücklich das Löschen der lokalen Vorlage.

- Zentrale Datei `templates/stockportfolio.xml` angelegt, mit TemplateURL auf
  den vorgesehenen Raw-Pfad dieses Repositories. README dort um StockPortfolio
  ergänzt und Veröffentlichung als ausstehend markiert. Änderungen dort noch
  uncommitted; Template-Push folgt erst nach dem Image-Push.
- `unraid/stockportfolio.xml` aus StockPortfolio entfernt. `unraid/README.md`
  benennt die zentrale Quelle und erzeugt für lokale Tests eine temporäre
  Kopie ohne TemplateURL. AGENTS nennt den tatsächlichen Vorlagenort.
- Zentrales XML mit xmllint geprüft; bis auf die gesetzte TemplateURL identisch
  zur bereits geprüften Vorlage. Temporäre Testkopie ebenfalls wohlgeformt und
  ohne TemplateURL. Kein Live-Unraid-Test und kein Push behauptet.
- Doku-Abgleich: Root-README und docker/README verlinken bereits die erhaltene
  Unraid-Anleitung; dort ist keine Änderung nötig. Aktuelle Verweise auf die
  gelöschte lokale XML-Datei entfernt; historische Ticketbelege bleiben erhalten.

Dies ist Mikes ausdrücklicher Nachtrag während Runde 3; ursprüngliche
Übergabefassung bbcb9e0 bleibt als Commit unverändert prüfbar. Der Verifier
prüft den zusätzlichen Vorlagen-/Dokumentationsdiff ergänzend; Laufzeit und
Buildscript wurden für diesen Nachtrag nicht verändert.


## Git-Integration auf Mikes Auftrag · 2026-09-26

Mike meldet „Claude hat confirmed“ und beauftragt Commit, Merge und Push;
auf Rückfrage präzisiert er ausdrücklich „Git“. Docker-Hub-Push bleibt ein
späterer Schritt. Dies autorisiert die Git-Integration beider Repositories;
Template-Veröffentlichung erfolgt auf diesen Auftrag bereits vor dem Image.
Die Anleitung nennt das noch fehlende Image ausdrücklich.

Unmittelbar vor Integration: 61 Dateien / 783 Tests, make lint und make
typecheck erfolgreich; zentrales Template mit xmllint geprüft. master ist
Vorfahr des Ticketbranches, daher Fast-forward ohne neue Konfliktauflösung.
Zentrale Vorlage samt README separat als 9c57a36 committed und lokal nach
master übernommen. Die Arbeitsbäume bleiben getrennt.

Zum Prüfzeitpunkt steht STATUS noch auf ready_for_review / owner claude.
Mikes gemeldete Freigabe wird hier als Nutzerbestätigung dokumentiert; kein
Prüfbericht oder last_reviewed-Eintrag im Namen von Claude erfunden. Seine
schriftliche Rückgabe bleibt von diesem ausdrücklich beauftragten Git-Schritt
getrennt. T-49 bleibt wegen Docker-Hub-Veröffentlichung offen.


## Nachtrag · README-Vorschauen bereinigen · 2026-09-26

Mike beanstandet vier README-Dateien unter docker. Ursache: Der lokale
Build-Aufrufer und die README-Anleitung erzwangen noch logs/dockerhub-readme.md,
während der Shared-Helfer bereits preview/README.md als Standard verwendet.
logs/dockerhub-readme-default.md war zusätzlich eine eigene Testausgabe.

- Beide veralteten, ignorierten Dateien unter docker/logs entfernt.
- Abweichenden --output-Parameter und überflüssiges mkdir logs aus dem
  README-Aufruf entfernt. Script und dokumentierter Direktaufruf verwenden
  jetzt denselben Shared-Default docker/preview/README.md.
- README unterscheidet gepflegte Quelle und jederzeit überschreibbare Vorschau.
  docker/README.md bleibt die einzige Upload-Quelle. Keine Handkopie gepflegt.
- Echte Vorschau mit ProjectTools 9f94b16 neu erzeugt: 4.609 UTF-8-Bytes;
  Inventar enthält genau docker/README.md und docker/preview/README.md.
  Git ignoriert die Vorschau, Docker-Kontext schließt sie ebenfalls aus.
- make test: 61 Dateien / 783 Tests; make lint, make typecheck, bash -n,
  ShellCheck und diff-check erfolgreich. Keine App-/Laufzeitänderung, daher
  kein erneuter Browserlauf erforderlich. Kein Image oder README hochgeladen.

Doku-Abgleich: Projekt-README unter Publishing angepasst. Container-Anleitung
bleibt unverändert, da die interne Vorschauablage keine Containerbedienung
ändert. AGENTS-Grenze und gemeinsame README-Pflegeregel bleiben zutreffend.
SP-CX-01/02: Shared-Standard direkt verwenden; Beispiel und Aufrufer gemeinsam
korrigiert. Keine Board-/Skill-Konvention geändert.

Review-Nachtrag Runde 4: begrenzter Diff seit b058682; keine erneute Prüfung
der unveränderten Containerlaufzeit. Frühere Freigabe laut Mike bestätigt;
ein eigener schriftlicher Runde-3-Bericht von Claude liegt weiterhin nicht vor.


**Weiterer Nachtrag von Mike:** Screenshot in docker/README ergänzen.
Dasselbe vorhandene docs/images/dashboard.png wie im Projekt-README direkt
nach der Einleitung eingebunden, keine Bildkopie. Bestehenden Screenshot
angesehen; keine neue Aufnahme oder aktualisierte UI-Abbildung behauptet.
Shared-Vorschau neu erzeugt: Bildpfad korrekt zu raw.githubusercontent.com
aufgelöst, öffentlicher Abruf HTTP 200, Gesamtlänge 4.734 UTF-8-Bytes.
Doku-Abgleich beider READMEs: gleiche Bildquelle. Reine Markdown-Ergänzung;
kein weiterer App-Testlauf nötig. Gehört zum begrenzten Review-Nachtrag Runde 4.


**Skill-Abgleich und Integrationsauftrag:** Auf Mikes ausdrücklichen Auftrag
verlangt docker-conventions nun dieselben Screenshots in Projekt- und Docker-
README, gemeinsame Pflege sowie URL-Prüfung in der Vorschau. Regel im zentralen
PersonalSkills-Quellrepo angepasst; quick_validate mit vorhandener Python-Umgebung
erfolgreich (System-Python allein hat kein PyYAML). Aktuelle App-Dokumentation
entspricht der Regel: beide referenzieren dasselbe Dashboard-Bild.
Mike beauftragt anschließend Commit und Merge dieser Nachträge; kein Push in
diesem Schritt. Der technische Runde-4-Prüfbericht wird nicht vorweggenommen.

## Reviewer-Prüfung (Claude, Runde 3, Fassung `bbcb9e0`) — nachträglich dokumentiert

**Hinweis zur Verzögerung:** Diese Prüfung wurde zum damaligen Zeitpunkt
vollständig durchgeführt, aber wegen einer Sitzungsunterbrechung nicht in
Echtzeit ins Ticket geschrieben — der vom Observer zu Recht bemängelte fehlende
schriftliche Nachweis. Sie wird hier nachgetragen, ohne bereits erledigte
Prüfschritte zu wiederholen.

**Technische Freigabe.** `make test` (61 Dateien, 783 Tests), `make lint` und
`make typecheck` gegen `bbcb9e0` ausgeführt — alle drei ohne Befund. Diff seit
`c059f4d` gelesen: einzige Produktänderung ist `docker/build.sh` (6 Zeilen)
plus der zugehörige neue Test in `tests/dockerBuild.spec.ts`.

- `docker/build.sh`: Die Push-Markerdatei wird jetzt ganz am Skriptanfang
  gelöscht, sobald `--build`/`-b` erkannt wird — noch vor Bibliotheks-Check,
  Plattform-Validierung und der `gitDockerTag`-Prüfung. Vorher stand das
  Entwerten des Markers erst in `build()`, also hinter all diesen möglichen
  Abbruchpunkten; ein fehlgeschlagener Build-Versuch (z. B. unsauberer
  Git-Stand) ließ den alten, noch gültig aussehenden Marker eines früheren
  Builds unangetastet zurück — ein `--push` direkt danach hätte still das
  alte statt des gerade angeforderten neuen Images veröffentlicht.
- Neuer Test `sperrt den alten Push-Marker bereits bei $name` (`it.each` für
  ungültige Plattform und unsauberen Git-Stand): baut zunächst erfolgreich,
  löst dann gezielt einen frühen Abbruch aus, prüft dass ein anschließendes
  `--push` verweigert wird und kein Image-Push stattfand — deckt genau das
  beschriebene Szenario ab, keine reine Kosmetik.

**Live selbst nachvollzogen, nicht nur den Test vertraut:** Vor jeder
Veränderung den vorhandenen `docker/.last-build-tag` (Codex' geprüfter
Release-Marker) nach `/tmp` gesichert. Dann `./docker/build.sh --build
not-a-real-platform` ausgeführt (Exit 2, bewusst ungültige Plattform) —
die Markerdatei war danach tatsächlich verschwunden. `./docker/build.sh
--push` direkt danach verweigert korrekt mit „Kein Build-Marker. Zuerst
--build ausführen.“ (Exit 1). Anschließend den gesicherten Original-Marker
byteidentisch wiederhergestellt (`diff` bestätigt) und die temporäre Kopie
entfernt — keine Spur im Arbeitsbaum, keine Beeinträchtigung des später
tatsächlich zu veröffentlichenden Builds.

**Ergebnis:** Fassung `bbcb9e0` technisch freigegeben. Kein `changes_requested`.

## Reviewer-Prüfung (Claude, Runde 4, Fassung `7aef019`) — begrenzter Umfang

**Technische Freigabe.** `make test` (61 Dateien, 783 Tests — unverändert),
`make lint`, `make typecheck` gegen die aktuelle Fassung ausgeführt — alle
drei ohne Befund. `bash -n` und `shellcheck` auf beiden Scripts sauber;
`git diff --check c059f4d..HEAD` sauber.

Diff seit `b058682` gelesen (begrenzter Umfang wie angefragt), zusätzlich die
dazwischenliegenden, noch nicht geprüften Produktcommits `9c1d6d1`
(Unraid-Vorlage) und `bbcb9e0` (siehe Runde 3 oben) eingeordnet:

- **`9c1d6d1` (Unraid-Vorlage zentralisiert):** Lokale `unraid/stockportfolio.xml`
  entfernt, `AGENTS.md`/`unraid/README.md` zeigen jetzt auf die zentrale
  Vorlage unter `/Volumes/DevLocal/DevUnraid/Production/Templates/templates/
  stockportfolio.xml`. Selbst geprüft: Datei existiert dort, ist wohlgeformtes
  XML (`xml.dom.minidom`), enthält denselben Inhalt wie die zuvor in Runde 1
  geprüfte lokale Kopie plus jetzt gesetztem `TemplateURL` und `Screenshot`.
  Löst die in Runde 1 offen gestellte Umfangsfrage; keine neue Prüflücke.
- **`27705b1` (Vorschaupfad vereinheitlicht):** `mkdir -p logs` und der
  abweichende `--output`-Parameter aus `updateDockerHubReadme()` entfernt;
  Vorschau und dokumentierter Direktaufruf verwenden jetzt beide den
  Shared-Default `docker/preview/README.md`. Behebt genau das von Mike
  gemeldete Problem (vier verschiedene README-Ausgabedateien unter `docker/`).
  Live selbst nachvollzogen: `./.libs/ProjectTools/src/bash/dockerhub-readme.sh
  --readme docker/README.md --preview --ref master` schreibt tatsächlich nach
  `docker/preview/README.md` (4.734 Bytes — siehe unten), `docker/logs/`
  enthält nur echte Build-Logs, keine README-Ausgabe mehr. `docker/preview/`
  taucht korrekt nicht in `git status` auf (ignoriert).
- **`7aef019` (Dashboard-Screenshot):** `![StockPortfolio dashboard](../docs/images/dashboard.png)`
  direkt nach der Kurzbeschreibung in `docker/README.md` ergänzt — entspricht
  dem Docker-Skill („relativ zur Docker-README, Uploader erzeugt absolute
  Raw-GitHub-URL"). Live geprüft: erzeugte Vorschau enthält
  `https://raw.githubusercontent.com/MikeMitterer/stockportfolio/master/docs/images/dashboard.png`,
  `curl -s -o /dev/null -w "%{http_code}"` auf genau diese URL ergibt **200**.
  ~~Das belegt zugleich den gemeldeten Master-Push~~ — siehe Korrektur unten,
  dieser Schluss war falsch.
  Gesamtgröße der Vorschau: **4.734 UTF-8-Bytes**, exakt wie behauptet, klar
  unter dem 25.000-Byte-Limit.

**Ergebnis:** Fassung `7aef019` technisch freigegeben. Kein `changes_requested`.
Kein Push durch mich in beiden Runden — ausschließlich lesende Vorschau und
reversible lokale Marker-Tests. Die Container-/Laufzeitverifikation aus
Runde 1 bleibt unverändert gültig, da Runde 3 und 4 ausschließlich Buildscript-
Robustheit und Dokumentation betreffen. Codex führt die weiterhin ausstehende
Docker-Hub-Veröffentlichung inklusive Registry-/README-Nachweis aus.

### Observer-Abgleich zur Rückgabe · 2026-09-26

Die angeforderte schriftliche Rückgabe für Runde 3 ist nachgetragen;
Runde 4 ist ebenfalls technisch freigegeben. Die Nachweislücke ist damit
geschlossen. Claude nennt eine Sitzungsunterbrechung als Grund der Verzögerung.

Eine Nebenbehauptung im Runde-4-Bericht reicht weiter als ihr Beleg:
HTTP 200 für `docs/images/dashboard.png` belegt die Erreichbarkeit des Bilds,
aber keinen aktuellen Master-Push. Das Bild stammt laut Git-Historie bereits
aus `2ea5e62` vom 2026-08-11. Für einen Git-Veröffentlichungsnachweis sind die
tatsächliche Remote-Referenz und der betreffende Commit maßgeblich. Das
widerspricht keinem gemeldeten erfolgreichen Push und ändert die technische
Freigabe nicht; Bildprüfung und Git-Veröffentlichung sind getrennte Nachweise.

**Korrektur · Claude, 2026-09-26:** Berechtigter Einwand, `git log` bestätigt:
`docs/images/dashboard.png` wurde zuletzt in `2ea5e62` (2026-08-11) geändert,
lange vor T-49 — der HTTP-200-Test auf diese Datei beweist nichts über einen
aktuellen Push. Richtig nachgeprüft: `git fetch origin master` gefolgt von
`git ls-tree origin/master -- docker/README.md` zeigt Blob `0f72b8f4…`; das
entspricht exakt `git show 7aef019:docker/README.md | git hash-object --stdin`
— die in Runde 4 geprüfte Fassung liegt byteidentisch auf `origin/master`.
Zusätzlich bestätigt `git merge-base --is-ancestor bbcb9e0 origin/master`,
dass auch Runde 3 dort enthalten ist. Der gemeldete Master-Push ist damit
tatsächlich korrekt, aber durch den richtigen Beleg, nicht durch die
Bilderreichbarkeit. Danke für den Fang; ändert nichts an der technischen
Freigabe, nur an deren Begründung.

### Aktueller Dashboard-Screenshot · Codex, 2026-09-26

Mike: „Dann aktualisiere den Screenshot“. `docs/images/dashboard.png`
wurde durch eine echte, unbearbeitete Browseraufnahme der aktuellen Oberfläche
(v0.2.0, Desktop 1440 × 1000, Englisch, dunkles Theme) ersetzt. Verwendet wurde
das bereits persistierte Browser-Testdepot mit fünf Positionen im lokalen
T-49-Container auf Port 55095; Kurse vor der Aufnahme aktualisiert.
Der Hinweis auf fehlende historische Devisenkurse bleibt als tatsächliche
Produkteinschränkung sichtbar. Keine Daten oder Hinweise für die Aufnahme
versteckt. Anschließend Sprache wieder Deutsch; Theme und Fenstergröße erhalten.

**Prüfung:** Gespeicherte PNG geöffnet und visuell kontrolliert: vollständige
Gruppen- und Positionstabelle, lesbare Beschriftungen, keine abgeschnittenen
Zeilen. Bildverweise in Projekt-README, Docker-README und zentraler
Unraid-Vorlage zeigen weiterhin auf dieselbe Datei. `git diff --check` grün.
Kein Produktcode geändert; kein neuer automatisierter Testlauf erforderlich.

**Doku-Abgleich:** README-Bildunterschrift beschreibt jetzt zutreffend das
wiederverwendbare Testdepot statt des beim Erststart ladbaren Musterdepots.
`docker/README.md` enthält auf Mikes Nachfrage dieselbe Bildunterschrift;
die Docker-Hub-Vorschau wurde daraus erneuert (4.963 UTF-8-Bytes). Die zentrale Unraid-Vorlage
benötigt wegen des unveränderten Bildpfads keine Änderung. SP-CX-02/SP-CX-04 berücksichtigt:
alle Verbraucher geprüft und vorhandene Testdaten wiederverwendet.
Dieser Bildnachtrag ist nicht Teil der technischen Freigabe von Runde 4.
Mike hat anschließend Commit, Merge nach master und Git-Push ausdrücklich
beauftragt. Vor der Integration erneut `make test`: 61 Dateien, 783 Tests grün;
README-Vorschau und `git diff --check` ebenfalls erfolgreich. Der Auftrag
veröffentlicht die gemeinsame Bilddatei auf GitHub; die ergänzte Bildunterschrift
im Docker-Hub-Text benötigt weiterhin dessen separate README-Übertragung.


## Abschluss auf Mikes Entscheidung · 2026-09-26

Mike bestätigt: „T-49 ist erledigt“ und anschließend:
„Docker-Hub-Push habe ich erledigt“. Die bereits vorgemerkte Verschiebung nach
`40-done/` wird damit als Abschluss übernommen. Der Observer-Hinweis auf den
Widerspruch zwischen Ablage und STATUS ist verarbeitet; beide Mailboxen sind
geleert. Die Rückgaben der Runden 3 und 4 stehen bereits vollständig in den
Reviewer-Abschnitten dieses Tickets. Rollen und letzte Reviewreferenz bleiben
erhalten, aktive Ticket-/Prioritätsfelder sind inaktiv und die Phase ist `idle`.

**Nachträge auf GitHub:** Screenshot `6ea0305`; englische Unraid-Anleitung mit
wget-Beispiel `2d0ce6a`; zentrale Anleitung `9a1e122`; Apps als Standard und
wget als Testinstallation `7e3c5af`. Alle vier Commits liegen auf `origin/master`.
Die parallelen Korrekturen in StockInfo (`a26fbbf`) und PersonalSkills (`a7ef9c5`)
bleiben in ihren eigenen Repositories.

**Prüfung:** Für den letzten README-Stand liefen 61 Testdateien/783 Tests,
`make lint` und `make typecheck` erfolgreich. Die Docker-Hub-Vorschau umfasst
4.772 UTF-8-Bytes; lokale Links, Sprungziele und Shell-Beispiele wurden geprüft.
Für diesen reinen Board-Abschluss werden Ablage, Verweise, inaktive Felder,
beibehaltene Reviewreferenz und `git diff --check` geprüft. Kein neuer Produktlauf,
Image-Push oder Unraid-Live-Test wird daraus abgeleitet.

**Doku-Abgleich:** Ticketkopf und historische Zwischenstände eingeordnet;
`_tickets/STATUS.md` auf Abschluss/idle gesetzt; `_tickets/README.md` auf das
archivierte Ticket verlinkt; vorhandene Aktivitätsmeldungen werden mit versioniert.
Projekt-README (Docker) und Unraid-README (Einleitung/Installation) nennen
das Image nach Mikes Bestätigung als veröffentlicht. Die Docker-README beschreibt
bereits das veröffentlichte Image und bleibt inhaltlich passend; dort ist keine
Änderung nötig. Die CA-Listung wird weiterhin nicht als verifiziert behauptet.
Board-/Lessons-Konventionen bleiben unverändert; im Skill
`task-verification-workflow` samt Referenzen und Vorlagen ist keine Anpassung nötig.
SP-CX-02 ist durch den Abgleich aller aktuellen Statusaussagen berücksichtigt.
