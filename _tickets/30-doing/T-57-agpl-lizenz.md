# T-57 · Nutzungslizenz für StockPortfolio

**Warum dieses Ticket:** StockPortfolio braucht klare Nutzungsbedingungen für
GitHub und Container. Die zunächst übernommene AGPL passt nicht zum bestätigten
Ziel: eigene Nutzung und interne Anpassungen kostenlos, Angebote unter eigener
Marke, Weiterverkauf und Hosting für Dritte gegen gesonderte Vereinbarung.

**Stand:** Neue StockPortfolio License 1.0 umgesetzt. Copyright bei Michael
Mitterer; Anbieterin, Lizenzgeberin und Vertragspartnerin ist MangoLila GmbH.
Kostenlose Weitergabe unveränderter Kopien unter dem Namen StockPortfolio mit
allen Lizenz- und Urheberhinweisen ist erlaubt. Eigene technische Prüfung erfolgreich; unabhängiger Review steht aus;
die erste AGPL-Reviewanforderung wurde vor Prüfbeginn zurückgezogen.

## Für dich

Kostenlos: eigene private Nutzung, interne Firmennutzung und eigene Änderungen,
auch internes Branding; unveränderte kostenlose Weitergabe mit allen Hinweisen.
Eine gesonderte kostenpflichtige schriftliche Vereinbarung mit MangoLila GmbH
ist nötig für Rebranding als Angebot, Weiterverkauf, Hosting für Dritte
(auch kostenlos) und Weitergabe veränderter Fassungen. Download-Mirrors
unveränderter Kopien fallen unter die kostenlose Weitergabe.

Die Texte setzen die beauftragte Rollenverteilung um. Sie ersetzen weder die
interne Rechtevereinbarung zwischen Michael Mitterer und MangoLila GmbH noch
eine rechtliche Prüfung. Ausschließlichkeit, Umfang und Dauer der Rechte sowie
die Berechtigung zur Unterlizenzierung müssen intern dokumentiert werden.
Die Umsetzung behauptet keinen unterschriebenen internen Vertrag und keine
vollständige Befreiung von persönlicher gesetzlicher Haftung.

### Entscheidungen von Mike · 2026-09-27

- Ursprünglich: „Ja, pass das für StockPortfolio so an“.
- Nach Erklärung der AGPL-Erlaubnis zum Rebranding: „Also das geällt mir nicht.“
- Zum neuen Nutzungsziel: „Genau, fraglich ist ob die Vereinbarung mit mir getroffen werden muss oder mit MangoLila?“
- Rollenwunsch: „Am liebsten wäre es mir wenn ich das CopyRight hätte, MangoLila Gmbh aber rechtlich dafür verantwortlich wäre“.
- Ergänzung: „Die Firma gehört mir - also ist die Trennung schwierig.“
- Bestätigung: „OK, also ich bin der Urheber, MangoLila erhält die Nutzungs- und Lizenzierungsrechte“.
- Rückfrage: „Probleme mit Unraid?“ — Katalogfall geprüft und ausdrücklich erlaubt.
- Klarstellung: „Unraid-templates ist ja nicht die Applikation“ — MIT gilt nur
  für die Vorlagen. Keine Open-Source-Pflicht der App daraus abgeleitet.
- Auf „Soll auch die kostenlose Weitergabe der unveränderten App unter dem Namen StockPortfolio erlaubt sein?“: „Ja, mit allen Lizenz- und Urheberhinweisen“.

## Umsetzung und technische Nachweise

| Repo | Scope | GH-Issue |
|---|---|---|
| StockPortfolio | Lizenztexte, Paketmetadaten, Build-Auslieferung, Hinweise, Dokumentation | — |

### Verify

✅ bestätigt · ⚠️ mit Einschränkung · ◑ teilweise · ➖ noch nicht geprüft.

| # | Handgriff | Nachweis | AI |
|---|---|---|:--:|
| 1 | Nutzungsfälle und Rollen gegen Mikes Entscheidungen lesen | LICENSE §§ 1–5; gleiche Aussagen in beiden READMEs, kommerzieller Seite und Legal-Seite | ✅ |
| 2 | Frontend bauen und Archiv gegen Arbeitsdateien prüfen | 121 Dateien bytegleich; explizite Dateiliste geprüft; Lizenzdownloads bytegleich | ✅ |
| 3 | Docker bauen, Lizenzlabel und HTTP-Downloads prüfen | linux/amd64 gebaut, healthy; fünf HTTP-Downloads 200 und Inhalte bytegleich | ✅ |
| 4 | Pflichtprüfungen ausführen | 63 Testdateien, 795 Tests; lint, typecheck und Frontend-Build erfolgreich | ✅ |
| 5 | Dokumentation und Hub-Vorschau abgleichen | beide READMEs konsistent, Hub-Vorschau 6.459 UTF-8-Bytes; Unraid unverändert passend | ✅ |
| 6 | Interne Rechtevereinbarung und rechtliche Tragfähigkeit prüfen | technische Umsetzung ist kein Rechtsgutachten; Prüfung ausstehend | ➖ |

### Umsetzung

- `LICENSE`: eigener Text StockPortfolio License 1.0 statt AGPL. Eigene Nutzung,
  unveränderte kostenlose Weitergabe und Fälle mit Vertragsbedarf getrennt.
  Fremdlizenzen und zwingende gesetzliche Rechte bleiben unberührt.
- `COMMERCIAL-LICENSE.md`: Vertrag mit MangoLila GmbH, Kontakt office@MangoLila.at;
  keine pauschale Gebührenpflicht für interne geschäftliche Nutzung.
- Root-Paket und Lockfile: `SEE LICENSE IN LICENSE` gemäß
  [npm-Dokumentation](https://docs.npmjs.com/cli/v11/configuring-npm/package-json/#license).
  Der private interne Server-Wrapper hat keine eigene Lizenzdeklaration; er
  gehört zur Projektlizenz. Lizenzen der npm-Abhängigkeiten bleiben unverändert.
- Docker-OCI-Label: `LicenseRef-StockPortfolio-1.0`, Bezeichner im Lizenztext
  definiert. App-Link und bestehender Build-Helfer liefern Lizenz und Quellen.
- Lizenzseite und SOURCE.md nennen die neuen Bedingungen. Der Quellcode wird
  freiwillig mitgeliefert; es wird keine AGPL-Veröffentlichungspflicht behauptet.

### Prüfbelege · neue Fassung

`make test`, `make lint`, `make typecheck`, `make build-frontend`: erfolgreich.
Bekannte Buildwarnung: vendor-ui-Chunk größer als 500 kB; kein neuer Fehler.
`python3 /private/tmp/t57-verify-archive.py`: 121 reguläre Archivdateien
bytegleich zum Arbeitsstand, 258.501 Bytes, keine Symlinks, alle Pfade in der
expliziten Liste. Die drei ausgelieferten Lizenzdateien stimmen byteweise mit
den Originalen überein. Der bestehende Archivtest prüft ausgelassene private
Dateien, alte Buildausgaben und AppleDouble-Metadaten. Keine neuen Tests allein
für Textänderungen hinzugefügt.

Docker neu gebaut: `stockportfolio-t57:local`, linux/amd64,
Manifest `sha256:be54ad20ffee2232705b097972ce37a1c6ea943adde3194128251b3bb5cee8f4`.
Temporärer Container `stockportfolio-t57-check`, localhost:58455, Status healthy;
OCI-Lizenzlabel `LicenseRef-StockPortfolio-1.0`. Fünf HTTP-Downloads erfolgreich:
legal.html (2.013 Bytes), LICENSE.txt (4.067), COMMERCIAL-LICENSE.md (1.775),
THIRD_PARTY_NOTICES.md (3.156), stockportfolio-source.tgz (246.100).
Alle Dokumente und alle 121 regulären Dateien des heruntergeladenen Archivs
bytegleich zum Arbeitsstand. API absichtlich unerreichbar (`127.0.0.1:9`);
kein Backend-/Kursnachweis. Testcontainer anschließend entfernt.
Die früheren Neubau- und Browserprüfungen stehen im historischen Abschnitt;
sie werden nicht als neue Prüfung ausgegeben.

### Doku-Abgleich

- `README.md` / License und `docker/README.md` / License and source: identische
  Erlaubnisse, Beschränkungen, Rechteinhaber und Kontakt. Quellarchiv und Downloads
  beschrieben. Docker-Anleitung enthält keine unnötige Entwicklungsanleitung.
- `COMMERCIAL-LICENSE.md`, `SOURCE.md`, `public/legal.html`: alle AGPL-Zusagen
  durch das beschlossene Modell ersetzt. Keine Behauptung freier Drittanbieter-
  Dienste oder beliebiger Umbenennung als Angebot mehr.
- Hub-Vorschau mit dem echten ProjectTools-Helfer erzeugt: 6.459 von höchstens
  25.000 UTF-8-Bytes. Noch keine Veröffentlichung; GitHub-Links mit `master`
  werden erst durch Integration der Fassung verfügbar.
- `unraid/README.md`: Lizenzabschnitt ergänzt; eigene Nutzung und Katalogfall
  ausdrücklich erlaubt, MIT des Template-Repos getrennt. Zentrale Vorlage
  `/Volumes/DevLocal/DevUnraid/Production/Templates/templates/stockportfolio.xml`:
  keine betroffenen Lizenzzusagen; Ports, Variablen, Start und Datenhaltung
  unverändert. Keine XML-Änderung nötig, kein Live-Unraid-Test.
- `docs/stockinfo-integration-proposal.md` und historische Specs/Pläne: keine
  aktuelle Lizenzzusage betroffen. Vorhandene Fremdlizenztexte bleiben erhalten;
  kein vollständiger neuer Audit aller Abhängigkeiten behauptet.

Keine Änderung der Board- oder Lessons-Konventionen. Aktuellen zentralen
Workflow-Stand gelesen; keine allgemeine Board-Migration in diesem Auftrag.

### Unraid-Abgleich

Die [offiziellen CA-Einreichungsvorgaben](https://ca.unraid.net/submit/help)
verlangen eine OSI-anerkannte Lizenz für das eingereichte Repository.
Das lokale zentrale Template-Repository hat bereits eine MIT-LICENSE;
`templates/stockportfolio.xml` verweist auf das offizielle Original-Image
`mangolila/stockportfolio:latest`. Daraus folgt kein belegter Lizenzkonflikt
für diesen Katalogweg; eine CA-Freigabe wird nicht behauptet. LICENSE § 3
stellt Katalogeinträge und Installationsvorlagen auch bei kostenpflichtigen
Plattformen ausdrücklich frei, solange die App selbst unverändert und
kostenlos unter Originalnamen angeboten wird. Kein Betrieb für Dritte erlaubt.

### Grenzen und Rechtsgrundlage

[§ 24 österreichisches UrhG](https://www.ris.bka.gv.at/eli/bgbl/1936/111/P24/NOR40041612)
ermöglicht die Einräumung von Nutzungsrechten; die konkrete interne Vereinbarung
wird durch einen Copyright-Vermerk nicht ersetzt. Die Texte bestimmen die GmbH
als Lizenzgeberin, garantieren aber keine vollständige Haftungsverlagerung.
Rechtsprüfung betrifft insbesondere die interne Rechtekette und die konkrete
Wirksamkeit der Nutzungsbedingungen. Der technische Review prüft Konsistenz
und Auslieferung, nicht die rechtliche Wirksamkeit.

StockInfo bleibt unverändert. Keine Veröffentlichung von Images oder Tags.
Die lokale AGPL-Zwischenfassung wird ersetzt; keine rückwirkende Aufhebung
bereits anderweitig erteilter Rechte behauptet.

### Vorbeugung und Lessons

SP-CX-01/04: vorhandenen Build-Helfer und Publish-Weg beibehalten.
SP-CX-02: Lizenzentscheidung in allen aktuellen Texten und Metadaten nachgezogen.
SP-CX-05: ursprüngliche StockInfo-Referenz tatsächlich geprüft; Abweichung jetzt
bewusste Produktentscheidung. AL-R-01/02/06: konkrete Belege mit Grenzen,
Dateiinventar und fertiger Commit vor unabhängiger Übergabe. Kein neuer
Wiederholungsbefund und keine zusätzliche Lesson angelegt.

### Auflösung

Umsetzung und eigene technische Prüfungen abgeschlossen; bereit für den
unabhängigen Review von `claude`, Runde 2.
Rechtliche Prüfung der internen Vereinbarung bleibt gesondert offen.
Kein Ticketabschluss, Merge oder Push behauptet.

## Historie · zurückgezogene AGPL-Fassung

Die folgenden Nachweise und Aussagen beschreiben ausschließlich den früheren
Stand `ccbb03d4861a4ea125dc8757f7c9c4815bb7e85a`. Sie sind historisch und keine
aktuellen Produktzusagen. Runde 1 wurde vor Reviewbeginn zurückgezogen.

<details>
<summary>Frühere Umsetzung, Prüfbelege und damaliger Doku-Abgleich</summary>

### Ergebnisse · 2026-09-27

1. `LICENSE` ist bytegleich mit StockInfos AGPL-v3-Text. README, beide
   Paketmanifeste und Lockfiles nennen `AGPL-3.0-or-later`. Die kommerzielle
   Seite übernimmt das dortige Modell einschließlich des Hinweises, dass
   Hosting oder Umbenennen allein keinen Lizenzkauf erfordert. StockInfos
   MIT-Sonderfall für `plugin_api` wurde nicht übernommen. Die vorhandenen
   Fremdlizenztexte bleiben unverändert. Rechtsquelle:
   [AGPL, insbesondere §§ 4–6 und 13](https://www.gnu.org/licenses/agpl.html).
2. `make build-frontend`: erfolgreich. Quellarchiv: **121 Dateien**, jede
   bytegleich zur jeweiligen Arbeitsdatei. Alle Archivpfade entsprechen der
   expliziten Dateiliste; keine Symlinks, lokalen Konfigurationen, Git-Daten
   oder Buildreste. Lizenztexte im Bundle bytegleich zu den Originalen.
   Neubau aus einem frisch entpackten Archiv mit `npm run build` erfolgreich;
   dafür wurden die bereits installierten npm-Abhängigkeiten per Symlink
   verwendet. Die zusätzliche frische npm-Installation ist durch den Docker-
   Build belegt, nicht durch diesen lokalen Neubau. `tar` bleibt eine
   dokumentierte Buildvoraussetzung.
3. Docker direkt als lokales Testimage `stockportfolio-t57:local` für
   `linux/amd64` gebaut, ohne Push und ohne Veränderung des normalen
   Build-/Push-Helfers. Frische `npm ci`-Layer liefen erfolgreich. Image-Label
   `org.opencontainers.image.licenses=AGPL-3.0-or-later` ausgelesen.
   Eigener Container `stockportfolio-t57-check`, Loopback-Port 57096:
   `/legal.html`, `/LICENSE.txt`, `/COMMERCIAL-LICENSE.md`,
   `/THIRD_PARTY_NOTICES.md` und `/stockportfolio-source.tgz` jeweils HTTP 200.
   Heruntergeladene Lizenztexte bytegleich; alle 121 Dateien des heruntergeladenen
   Quellarchivs erneut gegen den Arbeitsstand verglichen. Danach nur diesen
   Testcontainer gestoppt; `--rm` hat ihn entfernt. Testimage bleibt lokal.
   Chrome in isoliertem Browserkontext: Lizenzlink im Footer vorhanden,
   Ziel und Hinweistexte geprüft. Bei 375×812 px sind Link und Dokument ohne
   horizontalen Überlauf zugänglich. API war absichtlich `127.0.0.1:9`;
   keine Kursabrufe gegen einen echten Dienst und kein StockInfo-Funktionstest.
4. `make test`: **63 Dateien, 795 Tests bestanden**. `make lint` und
   `make typecheck`: Exit 0. `git diff --check`: sauber. Die zwei neuen Tests
   prüfen Archivinhalt, aktuelle uncommittete Quelldateien, Ausschluss privater
   Dateien/Buildreste, unveränderte Lizenztexte und Abbruch bei fehlender Lizenz.
   Rot vor Implementierung (Modul fehlt), anschließend grün.
   Während der Archivprüfung wurden macOS-AppleDouble-Metadaten entdeckt;
   ein gezielter Test mit synthetischem xattr schlug fehl und ist nach
   `COPYFILE_DISABLE=1` grün. Keine lokale Konfigurationsdatei wurde dafür gelesen.
   Der Build meldet weiterhin die bekannte Vite-Warnung für große Chunks.
5. Echte ProjectTools-Hub-Vorschau: **6.352 UTF-8-Bytes**, Exit 0.
   Dokumentlinks sind auf GitHub und das bestehende Screenshotbild auf Raw GitHub
   umgeschrieben. Neue Lizenzziele auf `master` werden erst mit der Integration
   veröffentlicht; kein Hub-Upload behauptet. Bezeichnerinventar über die
   TypeScript-Compiler-API für alle berührten TS-/Vue-Dateien geprüft:
   englische Namen, einschließlich lokaler Variablen.

Reproduzierbare Prüfungen ab Projektroot:

```bash
# 1, 2 und 4
cmp LICENSE /Volumes/DevLocal/DevWeb/Production/StockInfo/LICENSE
make test
make lint
make typecheck
make build-frontend
cmp LICENSE dist/LICENSE.txt
cmp COMMERCIAL-LICENSE.md dist/COMMERCIAL-LICENSE.md
cmp THIRD_PARTY_NOTICES.md dist/THIRD_PARTY_NOTICES.md

# 2: Neubau aus Archiv, vorhandene installierte Abhängigkeiten wiederverwenden
_SOURCE_DIR=$(mktemp -d /private/tmp/stockportfolio-source-check.XXXXXX)
tar -xzf dist/stockportfolio-source.tgz -C "${_SOURCE_DIR}"
ln -s "${PWD}/node_modules" "${_SOURCE_DIR}/node_modules"
npm --prefix "${_SOURCE_DIR}" run build

# 3: Port muss frei sein; andernfalls einen anderen Testport wählen
docker build --platform linux/amd64 -f docker/Dockerfile -t stockportfolio-t57:local .
docker run --rm -d --name stockportfolio-t57-check --platform linux/amd64 \
  -p 127.0.0.1:57096:8080 -e STOCKINFO_API_URL=http://127.0.0.1:9 stockportfolio-t57:local
docker inspect stockportfolio-t57-check --format '{{json .Config.Labels}}'
for _FILE in legal.html LICENSE.txt COMMERCIAL-LICENSE.md THIRD_PARTY_NOTICES.md stockportfolio-source.tgz; do
  curl -fsSL -w '%{http_code} %{size_download}\n' \
    "http://127.0.0.1:57096/${_FILE}" -o "/private/tmp/t57-http-${_FILE}"
done
docker stop stockportfolio-t57-check

# 5
./.libs/ProjectTools/src/bash/dockerhub-readme.sh --readme docker/README.md \
  --preview --ref master --output docker/logs/dockerhub-readme.md
```

### Akzeptanzkriterien der bisherigen AGPL-Fassung

Nach der Modellentscheidung neu abzugleichen; keine aktuelle Abschlussfreigabe.

- [x] Eigener Anwendungscode unter AGPL-3.0-or-later; separate kommerzielle Vereinbarung.
- [x] Browser-Build und Container liefern Hinweise und passenden Quellstand aus.
- [x] Paketmetadaten, README und Containeranleitung stimmen überein.
- [ ] Technische Nachweise und unabhängiger Review dokumentiert.

### Side-Effects

Neue Lizenz gilt für diese Fassung des eigenen Anwendungscodes. Fremdkomponenten
behalten ihre Lizenzen. Keine Änderung an StockInfo, keine Veröffentlichung
von Images oder Release-Tags in diesem Auftrag.

### Vorbeugung

Lokale Codex-Lessons vor Umsetzung inventarisiert und gelesen. SP-CX-01/04:
vorhandene Werkzeuge nutzen, keine zweite Build-/Push-Implementierung.
SP-CX-02 (einschließlich 2026-09-27): vollständiger Doku-Abgleich.
SP-CX-05: Lizenzreferenz StockInfo tatsächlich gelesen. AL-R-01/02/06,
Sammlungsstand needs_review: Prüftiefe begrenzen, Inventar führen,
erst fertigen Commit übergeben. SP-CX-03 betrifft diesen Auftrag nicht.

### Doku-Abgleich

Datei- und Überschrifteninventar sowie Suche nach bisherigen Lizenzbehauptungen:

- `README.md`, Abschnitt License: bisherige Nicht-Lizenz ersetzt; Modell,
  Auslieferung, Quellarchiv und tar-Voraussetzung beschrieben.
- `docker/README.md`, neuer Abschnitt License and source: gleiches Modell und
  konkret erreichbare Containerdateien. Alle gemeinsamen Aussagen stimmen mit
  dem Projekt-README überein; keine Buildanleitung für Containeranwender.
- `COMMERCIAL-LICENSE.md`: StockPortfolio-Fassung der Referenz; keine pauschale
  Gebührenpflicht. `SOURCE.md`: npm-/Docker-Neubau, Archivumfang, Bedingungen
  für lokale Fundament-Links und geänderte Fassungen.
- `public/legal.html`: englisches Lizenzdokument mit Copyright, Gewährleistungs-
  hinweis und Downloads; der App-Link ist deutsch/englisch übersetzt.
- `unraid/README.md` und
  `/Volumes/DevLocal/DevUnraid/Production/Templates/templates/stockportfolio.xml`
  gelesen: keine abweichende Lizenzbehauptung; Repository, Ports, Variablen,
  Pfade und Browser-Datenhaltung bleiben passend. Keine Anpassung erforderlich,
  keine Änderungen im Template-Repository, kein Live-Unraid-Test.
- `docs/stockinfo-integration-proposal.md` und historische Specs/Pläne enthalten
  keine betroffene aktuelle Lizenzzusage; unverändert.
- `THIRD_PARTY_NOTICES.md`: bestehende Codicons-/Lucide-/Feather-Hinweise erhalten.
  Kein neuer vollständiger Audit aller Fremdkomponenten behauptet.
Board- und Lessons-Konventionen werden nicht geändert; kein Skill-Abgleich nötig.

### Lessons-Einordnung

SP-CX-01/04 durch einen kleinen Vite-Build-Helfer mit vorhandenem `tar` und
unverändertem Docker-Push-Weg berücksichtigt. SP-CX-02 durch obigen Doku-Abgleich;
SP-CX-05 durch Originalvergleich mit StockInfo. AL-R-01/02 durch Bytevergleich,
HTTP- und Neubau-Nachweise mit benannten Grenzen; AL-R-06 durch Commit vor
Übergabe. Vor Übergabe lokale Codex-Sammlung erneut geprüft.
Der AppleDouble-Befund ist ein im selben Auftrag korrigierter Einzelfall;
kein neues belegtes Wiederholungsmuster und keine zusätzliche Lesson angelegt.

### Auflösung

Die bisherige Umsetzung und Verifikation sind abgeschlossen, das AGPL-Modell
ist aber durch Mikes spätere Rückmeldung abgelehnt. Runde 1 wurde vor Beginn
zurückgezogen. Neue Lizenzentscheidung und daran anschließende Umsetzung/Prüfung
sind offen. Keine Images, Release-Tags oder Änderungen auf `master` durch
den Coder veröffentlicht.

</details>
