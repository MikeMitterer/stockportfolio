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

## Voraussetzungen

- Node.js 22 und npm
- Bash 5 vorn im `PATH`; macOS bringt nur Bash 3.2 mit, damit scheitern schon
  `make help` und `make setup` (macOS: `brew install bash`)
- Python 3.11+ für den Teststack
- pipx und der Starter `devtools`, einmal je Rechner aus der lokalen
  DevTools-Arbeitskopie installiert (dort das Make-Ziel install); fehlt er, bricht
  `make setup` mit diesem Hinweis ab. Solange die Werkzeuge nicht auf GitHub
  oder PyPI veröffentlicht sind, holt DevTools sie über seine rechnerlokale
  Zuordnung aus den lokalen Repos.
- Overmind und tmux für den Dev-Stack (macOS: `brew install overmind tmux`)
- eine erreichbare StockInfo-Instanz; `make dev-up` startet sie **nicht**

## Einrichten und starten

```bash
make setup                 # npm-Pakete, Python-venv, Werkzeuge in .tools/, Git-Hooks
cp .env.example .env       # STOCKINFO_API_URL anpassen
make dev-up                # Vite auf :5175, Konto-API auf :8080
```

`make setup` ist der einzige Einrichtungsweg. Es installiert die
npm-Pakete von Frontend und API, legt StockPortfolios `.venv` mit Python
3.11+ an (`PYTHON_BOOTSTRAP` wählt den Interpreter, falls `python3.11`
fehlt) und bringt die gemeinsamen Werkzeuge ProjectTools und BashLib in der
Version aus `.dev-tools.conf.sh` nach `.tools/`. Jeder Schritt läuft nur,
wenn seine Lock- oder Config-Datei neuer ist als die letzte Einrichtung; ein
zweiter Aufruf dauert deshalb nur Bruchteile einer Sekunde. Prüfziele wie
`make test` richten nichts selbst ein: Fehlt etwas oder ist es veraltet,
brechen sie ab und nennen `make setup`. `make info` zeigt den Werkzeugstand.

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

`make help` listet alle Ziele, `make hints` zeigt Links, URLs und Tipps für
den Alltag.

| Befehl | Zweck |
|---|---|
| `make dev-up` / `make dev-down` | Dev-Stack starten / stoppen |
| `make test` | Doku-Prüfung, Frontend- und API-Tests, einmalig |
| `make docs-check` | Nutzerdoku prüfen: Links, Anker, Befehle, verbotene Begriffe |
| `make clean` | Erzeugte Dateien, `.venv` und `.tools/` entfernen; danach wieder `make setup` |
| `make build` | Docker-Image lokal bauen (linux/amd64) |
| `make push` | Geprüftes Image veröffentlichen, danach Docker-Hub-README |
| `make tag-minor MSG="…"` | Version erhöhen, lokal taggen und Changelog committen; kein Push |
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
Problemen ab. Fehlen der Starter oder ProjectTools in `.tools/`, warnt der
Hook nur („Doku nicht geprüft“) und lässt den Commit durch; ein solcher Commit
gilt nicht als geprüft, `make test` bleibt die harte Grenze. Der Hook prüft genau den vorgemerkten Stand, nicht den
Arbeitsbaum: Nicht vorgemerkte Änderungen zählen nicht, und ein Link auf eine
Datei, die nicht in git liegt, ist ein Problem. Jede Umgebungsvariable, die der Code unter `api/src`,
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
zählen als „jetzt“. Ändert sich `docs/README.template.md` nach den READMEs,
erscheint nur ein Hinweis (`DEPENDS_HINT`).

`README.md` und `README.de.md` müssen gleich aufgebaut sein (`TRANSLATIONS`):
dieselben Überschriften und je Abschnitt dieselben Links, Bilder, Code,
Hinweisboxen und gleich viele Absätze. Übersetzt werden nur Texte und
Mermaid-Beschriftungen. Jede Abweichung ist ein Problem und lässt den
Pre-Commit-Hook scheitern; quittieren lässt sie sich nicht. Wer eine Fassung
ändert, zieht die andere im selben Commit nach.

Screenshots unter `docs/images/` werden mit dem UI-Code verglichen, den sie
zeigen (`SCREENSHOTS`): Hat er sich nach der Aufnahme geändert, erscheint ein
Hinweis. Verlangt eine Änderung nichts, etwa eine Meldung, die auf keinem Bild
steht, die Meldung nach dem Prüfen quittieren und `.docs-check.ack`
mitcommitten:

```bash
.tools/bin/docs-check --ack docs/images/dashboard.png
```

Die Quittung gilt bis zum nächsten Commit der Basis. Einträge mit Frist 0 und
uncommittete Basen lassen sich nicht quittieren.

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

**StockInfo-Fehler** kommen als Kennung mit Werten (`{code, params}`), bei
503 während einer Migration oder eines Starts als Kennung in `detail`. Den
Satz bildet StockPortfolio selbst aus `errors.reason` im Katalog; eine
unbekannte Kennung erscheint in einem allgemeinen Satz, ein Satz im alten
Format unverändert. Welche Kennungen es mit welchen Werten gibt, steht im
StockInfo-Repository: im REST-Vertrag (rest-core-contract.md unter docs) und im
Katalog `errors.reason` der StockInfo-Oberfläche. Eine neue Kennung bekommt in beiden Sprachen einen
Satz und einen Eintrag in `frontend/tests/api/errorReasons.spec.ts`.

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
Markierung. Der Build merkt sich den Release-Tag samt Tag-Objekt; vor dem Push
prüft `make push`, dass genau dieses Objekt auf `origin` liegt, damit die
Registry keine Version zeigt, die es im Repository so nicht gibt. Ein nur
lokal getaggtes Release bricht mit dem Hinweis auf
`git push --follow-tags origin master` ab. Wurde der Tag nach dem Build
umgesetzt oder liegt er auf `origin` anders, heißt der Hinweis `make build`. `TARGET=dockerhub` ist Standard; GHCR und ECR sind optional.
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
ProjectTools-Befehl `dockerhub-readme` aus `.tools/` `docker/README.md` nach
Docker Hub. Nur diese Datei
bearbeiten. Relative Links werden zu absoluten GitHub-Links; die konvertierte
Fassung darf höchstens 25.000 UTF-8-Bytes groß sein. Vorschau ohne Upload:

```bash
.tools/bin/dockerhub-readme --readme docker/README.md --preview --ref master
```

`DOCKER_README_REF` muss einen bereits veröffentlichten Stand nennen
(Standard `master`). Das Token liest der Helfer aus `DOCKER_PW_FILE` oder
`${DOCKER_CONFIG:-$HOME/.docker}/dockerhub.sec`; es braucht die Rechte
**Read, Write, Delete**. Scheitert nur der README-Upload, lässt er sich ohne
neuen Build wiederholen:

```bash
.tools/bin/dockerhub-readme \
  --readme docker/README.md --publish --ref master --repository mangolila/stockportfolio
```

## Release und Changelog

`make tag-major`, `make tag-minor` und `make tag-patch` (jeweils mit
`MSG="Zusammenfassung"`) heben die Version in `frontend/package.json`,
committen und taggen sie lokal, erzeugen [CHANGELOG.md](../CHANGELOG.md) und
committen ihn. Nichts wird gepusht; veröffentlicht wird danach mit
`git push --follow-tags`. `make help` zeigt neben jedem Ziel die Version davor
und danach. Ein normaler Image-Build erhöht die Version nicht.

Den Ablauf übernimmt `tag-version` aus ProjectTools: Es bricht vor dem Bump
ab, wenn nicht `master` ausgecheckt ist. Der
Changelog-Generator `changelog` liest Release-Tags der First-Parent-Historie,
gruppiert Conventional Commits und lässt Ticket-, Aktivitäts-, Merge- und
Versions-Commits weg. Ungetaggte Änderungen erscheinen nicht.
`make changelog` erzeugt die Datei ohne Commit.

Scheitert der Changelog-Schritt nach dem Tag, existiert das Release bereits.
Ursache beheben und ohne neue Version wiederholen:

```bash
.tools/bin/changelog --commit
```
