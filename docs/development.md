# StockPortfolio – Entwicklung

Diese Anleitung richtet die Entwicklungsumgebung ein und beschreibt Befehle,
Teststack, Browserprüfungen sowie Bau und Veröffentlichung. Was die App für
Nutzer tut, steht im [Benutzerhandbuch](user-guide.md); den Containerbetrieb
beschreibt der [Docker-Guide](../docker/README.md).

## Inhalt

- [Voraussetzungen](#voraussetzungen)
- [Einrichten und starten](#einrichten-und-starten)
- [Befehle](#befehle)
- [Projektaufbau](#projektaufbau)
- [StockInfo-Adresse](#stockinfo-adresse)
- [Teststack für Browserprüfungen](#teststack-für-browserprüfungen)
- [Browserprüfungen](#browserprüfungen)
- [Sprache und Texte](#sprache-und-texte)
- [Docker-Image bauen und veröffentlichen](#docker-image-bauen-und-veröffentlichen)
- [Release und Changelog](#release-und-changelog)
- [Kommandozeilen-Themes](#kommandozeilen-themes)

## Voraussetzungen

- Node.js 22 und npm
- Python 3.11+ für den Teststack und die gemeinsamen Werkzeuge
- Overmind und tmux für den Dev-Stack (macOS: `brew install overmind tmux`)
- eine erreichbare StockInfo-Instanz; `make dev-up` startet sie **nicht**
- für den ersten `make setup`: die Repositories BashLib, MakeLib und
  ProjectTools, angegeben über `BASH_LIBS`, `DEV_MAKE` und `PROJECT_TOOLS`

## Einrichten und starten

```bash
make setup                 # .libs/-Links, lokale Python-venv, npm-Abhängigkeiten
cp .env.example .env       # STOCKINFO_API_URL anpassen
make dev-up                # Vite auf :5175, Konto-API auf :8080
```

`make setup` verlinkt BashLib, MakeLib und ProjectTools unter `.libs/`, legt
StockPortfolios `.venv` mit Python 3.11+ an und installiert dort das
ProjectTools-Paket aus `requirements-dev.txt`. `PYTHON_BOOTSTRAP` wählt den
Interpreter, falls `python3.11` fehlt. Eine bestehende venv wird
wiederverwendet; `make clean` behält sie.

Ohne die gemeinsamen Werkzeuge reichen für Frontend und API
`npm ci --prefix frontend` und `npm ci --prefix api`. Jedes Teilprojekt hat
seine eigene Lock-Datei.

**Einrichtungscode:** Solange es kein Admin-Konto gibt, gibt die API bei jedem
Start einen neuen Code nach `StockPortfolio setup code:` aus. Unter
`make dev-up` liest du ihn mit `overmind connect api` (verlassen mit Ctrl-B,
dann D); `overmind echo` zeigt nur neue Ausgaben und verpasst den Code.

**Stoppen:** `make dev-down` beendet den Stack und gibt die Ports 5175 und
8080 frei. Nach einem Absturz räumt es auch Overmind- und tmux-Reste und eine
veraltete `.overmind.sock` auf. Prozesse anderer Projekte, etwa StockInfo oder
Docker, bleiben unberührt. Ein zweiter Aufruf ohne Stack endet mit 0.

**Einzeln starten:** `npm run dev --prefix frontend` startet nur Vite. Nur die
API aus dem Projekt-Root:

```bash
STOCKPORTFOLIO_DATA_DIR="$PWD/.local-data" \
STOCKPORTFOLIO_PUBLIC_ORIGIN=http://localhost:5175 \
npm run dev --prefix api
```

Ohne `STOCKPORTFOLIO_DATA_DIR` legt die API lokale Konten unter `.local-data`
ab. Meldet die Anmeldeseite, dass der Kontodienst nicht erreichbar ist, läuft
die API auf Port 8080 nicht: Vite allein liefert die Seite, aber keine
Anmeldung.

## Befehle

`make help` listet alle Ziele, `make hints` zeigt URLs und Setup-Schritte.

| Befehl | Zweck |
|---|---|
| `make dev-up` / `make dev-down` | Dev-Stack starten / stoppen |
| `make test` | Doku-Prüfung, Frontend- und API-Tests, einmalig |
| `make docs-check` | Nutzerdoku prüfen: Links, Anker, Befehle, verbotene Begriffe |
| `make clean` | Erzeugte Dateien entfernen; Python-venv bleibt |
| `make build` | Docker-Image lokal bauen (linux/amd64) |
| `make push` | Geprüftes Image veröffentlichen, danach Docker-Hub-README |
| `make tag-minor MSG="…"` | Version erhöhen, committen, taggen, pushen; danach Changelog |
| `make changelog` | `CHANGELOG.md` neu erzeugen, ohne Commit |

Lint und Typprüfung laufen je Paket:

```bash
npm --prefix frontend run lint
npm --prefix api run lint
npm --prefix frontend run typecheck
npm --prefix api run typecheck
```

Vor einer Übergabe laufen mindestens `make test` und diese vier Befehle.

`make docs-check` liest seine Dokumentliste, Pflichtdateien und verbotenen
Begriffe aus `.docs-check.conf.sh`. Es läuft auch vor jedem Commit
(`.githooks/pre-commit`, eingerichtet von `make setup`) und bricht ihn bei
Problemen ab. Jede Umgebungsvariable, die der Code unter `api/src`,
`frontend/src`, `frontend/scripts` oder `scripts` liest, muss in der Doku
stehen; eine neue Variable also gleich hier oder im Container-Guide
beschreiben.

Manche Dateien müssen einer anderen folgen: `README.de.md` dem `README.md`,
`docker/preview/README.md` dem `docker/README.md`, die Lizenzabschnitte der
`LICENSING.md`. Diese Paare stehen in `.docs-check.conf.sh` unter `DEPENDS`
mit einer Frist in Tagen. Ändert sich die Basis nach der abhängigen Datei,
meldet `make docs-check` einen Hinweis, nach Ablauf der Frist ein Problem. Die
Vorschau hat die Frist 0 und gehört deshalb in denselben Commit wie
`docker/README.md`. Maßgeblich ist der letzte Commit, uncommittete Änderungen
zählen als „jetzt“.

Vor Änderungen an `README.md` zuerst
`make docs-check` laufen lassen: Es meldet auch Anker, auf die andere
Dokumente verlinken. Das README folgt [`README.template.md`](README.template.md).

## Projektaufbau

```text
frontend/            Vue-3-App mit Vite
  src/api/           alle ausgehenden Aufrufe: stockinfo/, account/, data/
  src/db/            IndexedDB-Altbestand und Kurs-Zwischenspeicher
  src/stores/        Anwendungszustand
  src/i18n/          deutsche und englische Texte
  scripts/           sichtbare Playwright-Prüfungen
api/                 Konto-API (Node, SQLite)
  src/routers/       HTTP-Routen
  src/persistence/   SQLite-Zugriff
  src/stockinfo/     Weiterleitung an StockInfo mit Freigabeliste
docker/              Dockerfile, Build-, Smoke- und Browserprüfung, Docker-Hub-README
scripts/             Teststack mit StockInfo-Testdaten
unraid/              Unraid-Anleitung
```

`frontend/package.json` ist die Versionsquelle des Projekts. Der Router nutzt
Hash-URLs (`/#/rebalancing`); Einstellungsreiter sind direkt adressierbar
(`/#/settings?tab=calc`). Der Server braucht deshalb keine Rewrite-Regeln.

Die API liefert die gebaute App aus `STOCKPORTFOLIO_PUBLIC_DIR` aus. Ohne die
Variable ist das `dist/` im Projekt-Root, wohin `npm --prefix frontend run build`
baut; das Image setzt `/app/public`. Im Betrieb muss niemand den Wert ändern.

## StockInfo-Adresse

Die Adresse steht in `STOCKINFO_API_URL` der Konto-API, in der Entwicklung in
der lokalen `.env` (Vorlage: `.env.example`). Sie ist **nicht** ins Image
eingebaut und hat keine Rückfallebene. Fehlt sie, laufen Setup und Anmeldung
weiter, und die App meldet die fehlende Adresse.

Der Browser ruft StockInfo nie direkt. Er fragt `/api/stockinfo/*` beim eigenen
Server an; `api/src/stockinfo/proxy.ts` leitet nur Pfade aus seiner
Freigabeliste weiter, nur für angemeldete Konten, ohne Cookies und mit
60 Sekunden Zeitlimit. Ein neuer StockInfo-Endpunkt braucht deshalb:

1. Aufruf, Typ und Mapper unter `frontend/src/api/stockinfo/`,
2. ein Muster in der Freigabeliste von `api/src/stockinfo/proxy.ts`,
3. einen sichtbaren Schritt in `frontend/scripts/stockinfo-proxy-check.mjs`,
   der die Route aufruft – sonst schlägt die Routenabdeckung fehl.

## Teststack für Browserprüfungen

Der Teststack startet StockInfos Routen mit temporären Testkursen, die eigene
Konto-API und Vite gemeinsam. Er berührt keine echten Daten.

```bash
.venv/bin/python scripts/stockinfo-test-server.py --stack --run --stockinfo-root ../StockInfo
.venv/bin/python scripts/stockinfo-test-server.py --stack --status
.venv/bin/python scripts/stockinfo-test-server.py --stack --stop
```

Der Start kehrt zurück, sobald Vite (`127.0.0.1:5175`), Konto-API
(`127.0.0.1:8080`) und StockInfo-Testserver (`127.0.0.1:8899`) bereit sind.
Er prüft Health, einen Testkurs und die Weiterleitung über Vite zur Konto-API.
Ohne weitere Option steht der Einrichtungscode im ausgegebenen API-Log.

| Option | Wirkung |
|---|---|
| `--demo-accounts` | legt einen synthetischen Admin und Benutzer an; Zugangsdaten nur in der ausgegebenen temporären Datei |
| `--demo-details` | zehn lesbare Instrumente mit echten Namen für Screenshots, Detailwerte aus `scripts/fixtures/demo-details.json` |
| `--port PORT` | ändert nur den StockInfo-Testport; Status und Stop lesen den registrierten Port |

Mit `--demo-details` leert **Aktualisieren** die Demo-Detailwerte, weil die
Testquelle keine liefert; ein Neustart stellt sie wieder her. Ohne die Option
liefert der Testserver Randfälle: Kryptopaar, OTC-Anleihe, mehrdeutiges Symbol,
Pence-Listing und Listing ohne ISIN.

Stop entfernt Testkonten und temporäre Datenbanken. `.env`, `.local-data`,
Makefiles und StockInfo-Dateien bleiben unverändert. Die Ports 5175 und 8080
sind fest, weil Vites Proxy sie erwartet. Ein Portkonflikt bricht den Start
ab; fremde Prozesse werden nicht beendet. Liegt StockInfo nicht neben diesem
Repository, braucht `--stockinfo-root` einen absoluten Pfad.

Der StockInfo-Kindprozess nutzt `../StockInfo/.venv/bin/python`. Nur den
StockInfo-Testserver ohne Stack startest du direkt mit StockInfos Python:

```bash
../StockInfo/.venv/bin/python scripts/stockinfo-test-server.py --run --stockinfo-root ../StockInfo
```

## Browserprüfungen

Browserprüfungen laufen sichtbar gegen den Teststack, nie gegen echte Daten.
Die Skripte liegen unter `frontend/scripts/`; der genaue Aufruf steht jeweils
im Kopfkommentar. Prüfskripte enden mit Exit-Code 1 bei Abweichung.

| npm-Skript | Prüft |
|---|---|
| `smoke:live-sync` | Live-Abgleich zwischen zwei Browsern desselben Kontos (braucht `--demo-accounts`) |
| `screenshots` | erzeugt die Bilder unter `docs/images/` |
| `check:notice-texts` | Hinweistexte auf Methodenseite und Rebalancing, DE und EN |
| `check:demo-data` | lesbare Demodaten aus `--demo-details` |
| `check:stockinfo-proxy` | Weiterleitung an StockInfo: jede freigegebene Route, 401 ohne Sitzung, 404 außerhalb der Liste |
| `check:setup-dialog` | Info-Fenster am Einrichtungscode (braucht einen frischen Stack ohne `--demo-accounts`) |

`check:demo-data` und `check:stockinfo-proxy` erreichen StockInfo unter
`STOCKINFO_URL` (Vorgabe `http://127.0.0.1:8899`, der Test-StockInfo des
Teststacks). `check:stockinfo-proxy` öffnet StockPortfolio unter
`STOCKPORTFOLIO_ORIGIN` (Vorgabe `http://127.0.0.1:5175`, der Vite-Server).

Beispiel:

```bash
npm --prefix frontend run smoke:live-sync -- <testverzeichnis>/demo-accounts.json
```

Der Live-Abgleich öffnet zwei Fenster eines Kontos nebeneinander und ein drittes
des zweiten Kontos. Er prüft Änderungen ohne Neuladen, Kursaktualisierung,
Backup-Wiederherstellung, Wiederverbindung, den 15-Sekunden-Keep-Alive über
den Vite-Proxy, Konflikte und Abmeldung. Die Fenster bleiben bis Enter offen.
Google Chrome muss installiert sein; `CHROME_PATH` überschreibt den Pfad.

`screenshots` meldet sich als synthetischer Admin an, lädt das Beispiel-Depot
und speichert `login.png`, `dashboard.png`, `drilldown.png`, `rebalancing.png`,
`settings-calculation.png` und `user-admin.png` auf Englisch im Theme MangoLila.

## Sprache und Texte

Alle sichtbaren Texte stehen im Katalog unter `frontend/src/i18n/`. Eine
ESLint-Regel macht fest eingetragenen Text im Template zum Fehler, und die
Typprüfung meldet jeden Schlüssel, der in einer Sprache fehlt.

## Docker-Image bauen und veröffentlichen

Bauen und Veröffentlichen sind getrennte Schritte. Erst den gebauten Container
prüfen, dann `make push`.

```bash
make build                    # linux/amd64 bauen und laden, kein Push
make docker-samples           # Beispielbefehle zum Testen zeigen
make push                     # genau dieses Image veröffentlichen, danach README
make build PLATFORM=arm       # optional: lokaler ARM-Build
```

`make push` verwendet die unveränderliche Image-ID des lokalen Builds, auch
für `latest`. Gescheiterte Builds hinterlassen keine wiederverwendbare
Markierung. `TARGET=dockerhub` ist Standard; GHCR und ECR sind optional.
Voraussetzungen: Bash 4+, BashLib, Docker mit buildx, ein Git-Tag und ein
sauberer Arbeitsbaum. `STRICT=2` erlaubt Commits nach dem Tag, `STRICT=1`
verlangt den getaggten Commit.

**Prüfskripte:**

- `./docker/smoke-test.sh` prüft das Image mit Wegwerf-Containern: Setup und
  Anmeldung, Rechte auf `/data`, Daten älterer Images, Netzfreigaben ohne
  `chown` und die Weiterleitung an StockInfo über einen Docker-internen Namen.
  Es entfernt alles, was es angelegt hat.
- `./docker/browser-check.sh` startet zwei Wegwerf-Container gegen den
  laufenden Teststack (ohne `--demo-details`): einer erreicht StockInfo über
  `host.docker.internal`, der andere bekommt eine nicht auflösbare Adresse.
  Beide führen `check:stockinfo-proxy` aus.

**Docker-Hub-Beschreibung:** Nach erfolgreichem Push überträgt der
ProjectTools-Helfer `docker/README.md` nach Docker Hub. Nur diese Datei
bearbeiten. Relative Links werden zu absoluten GitHub-Links; die konvertierte
Fassung darf höchstens 25.000 UTF-8-Bytes groß sein. Vorschau ohne Upload:

```bash
./.libs/ProjectTools/src/bash/dockerhub-readme.sh \
  --readme docker/README.md --preview --ref master
```

`DOCKER_README_REF` muss einen bereits veröffentlichten Stand nennen
(Standard `master`). Das Token liest der Helfer aus `DOCKER_PW_FILE` oder
`${DOCKER_CONFIG:-$HOME/.docker}/dockerhub.sec`; es braucht die Rechte
**Read, Write, Delete**. Scheitert nur der README-Upload, lässt er sich ohne
neuen Build wiederholen:

```bash
./.libs/ProjectTools/src/bash/dockerhub-readme.sh \
  --readme docker/README.md --publish --ref master --repository mangolila/stockportfolio
```

## Release und Changelog

`make tag-major`, `make tag-minor` und `make tag-patch` (jeweils mit
`MSG="Zusammenfassung"`) erhöhen die Version, committen, taggen und pushen.
Danach erzeugen sie [CHANGELOG.md](../CHANGELOG.md) und veröffentlichen ihn in
einem eigenen Commit. Ein normaler Image-Build erhöht die Version nicht.

Der Generator aus ProjectTools liest Release-Tags der First-Parent-Historie,
gruppiert Conventional Commits und lässt Ticket-, Aktivitäts-, Merge- und
Versions-Commits weg. Ungetaggte Änderungen erscheinen nicht. Er braucht nur
Python 3.9+ ohne Zusatzpakete; `make changelog PYTHON=/pfad/zu/python3` wählt
einen anderen Interpreter.

Scheitert der Changelog-Schritt nach dem Tag, existiert das Release bereits.
Ursache beheben und ohne neue Version wiederholen:

```bash
python3 .libs/ProjectTools/src/python/changelog.py --publish
```

## Kommandozeilen-Themes

Make, BashLib-Helfer und ProjectTools-Skripte teilen die Themes aus MakeLib:
`classic`, `ocean`, `earth`, `night`, `mono`, `sunset`, `forest`, `neon` und
`shell`. Auswahl mit `MAKE_THEME`, etwa `make help MAKE_THEME=ocean`; Make
reicht den Wert an gestartete Skripte weiter. `NO_COLOR`, umgeleitete Ausgabe
und `TERM=dumb` schalten Farben ab.

| Variable | Standard | Wirkung |
|---|---|---|
| `THEME_WIDTH_TARGET` | 22 | Breite der Zielspalte |
| `THEME_COLUMN_GAP` | 1 | Abstand zwischen Spalten |
| `THEME_INDENT_GROUP` / `THEME_INDENT_TARGET` | 2 / 7 | Einrückung von Gruppen und Einträgen |
| `THEME_WIDTH_HELP` | 110 | Breite der Python-Hilfe |
| `THEME_GROUP_SPACING` | 1 | Leerzeilen zwischen Gruppen |
