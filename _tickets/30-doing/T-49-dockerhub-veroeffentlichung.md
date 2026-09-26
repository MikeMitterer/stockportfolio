# T-49 · Docker-Hub-Veröffentlichung prüfen und vervollständigen

Der aktuelle App-Stand soll als Docker-Image mit passender Docker-Hub-Übersicht
veröffentlicht werden. Bisher fehlen die automatische README-Übertragung und
eine klare Trennung zwischen lokalem Build und Veröffentlichung. Das README
ist bereits vor der Konvertierung größer als 25.000 Bytes.

**Auftrag · Mike, 2026-09-26:** Dockerfile prüfen, passende Make-Ziele und
Docker-Hub-Push erledigen; StockInfo T-77 als Vorlage für den zentralen
README-Helfer nutzen und das Größenlimit in AGENTS.md verankern.

**Stand:** Implementiert und lokal geprüft; abschließender Build aus sauberer
Commit-Fassung, unabhängiger Review und Veröffentlichung stehen noch aus.
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
   README kürzen/Details auslagern, AGENTS.md und Anleitungen nachziehen.
4. Befehle/Fehlerpfade und echtes Containerverhalten prüfen, Review übergeben,
   autorisierte Veröffentlichung ausführen und Registry/README nachweisen.

## Verify

| # | Prüfung | AI |
|---|---|:--:|
| 1 | Dockerfile, Laufzeit-API und Healthcheck am lokalen amd64-Image geprüft; sauberer Release-Build folgt | ✅ |
| 2 | Help, Make-Dry-Runs und 17 Prozessgrenzen-Tests zu Plattform-/Push-Fehlern erfolgreich | ✅ |
| 3 | Zentraler README-Helfer; Reihenfolge/Fehlercodes mit simuliertem Push geprüft, Live-Aufruf noch offen | ✅ |
| 4 | Reale Pandoc-Vorschau: 23.613 UTF-8-Bytes bei Ref master; AGENTS-Regel vorhanden | ✅ |
| 5 | Echter amd64-Container: Desktop 1440 und Mobile 390, Testdepot/Neuladen/Kursverlauf erfolgreich | ✅ |
| 6 | 781 Tests, Lint, Typecheck, ShellCheck/XML; Doku und Lessons abgeglichen | ✅ |
| 7 | Image auf Docker Hub, Architektur/Tag und README-Rücklesen belegt | ➖ |

## Konventionsstand und Abhängigkeit

T-77 liegt im StockInfo-Board unter `30-doing/`; Implementierung des Helfers
in ProjectTools, aktueller ProjectTools-Prüfstand `8780252`, StockInfo `a7e37ba`;
Runde 1 an Claude übergeben, unabhängiger Review noch offen. Keine lokale Kopie. Das StockPortfolio-Board bleibt auf
`2026-09-11-activity-feed`; offene Übernahme von `lessons-follow-through`
bleibt sichtbar und benötigt ihren eigenen Board-Auftrag.

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

**Noch offen:** sauberer Build und unabhängiger Review, tatsächlicher Push mit
Registry-/README-Rücklesen. Keine Veröffentlichung aus Mock-Tests abgeleitet.
Echter Unraid-Betrieb und produktive StockInfo-CORS-Konfiguration sind ungetestet.
Zentrales Template-Repository enthält weiterhin nur StockInfo; Veröffentlichung
von StockPortfolio dort benötigt die angefragte Umfangsentscheidung.
