# T-57 · AGPL-Lizenz für StockPortfolio

**Warum dieses Ticket:** StockPortfolio wird über GitHub und Container verteilt,
das README erteilt bisher aber keine Lizenz. Das von Mike bestätigte Modell
von StockInfo soll auch hier gelten: AGPL-3.0-or-later und eine separat
vereinbarte kommerzielle Alternative für den eigenen Anwendungscode.

**Stand:** Umsetzung und eigene technische Prüfung abgeschlossen. Die Fassung
wird zum unabhängigen Review übergeben; dessen Freigabe steht aus.

## Für dich

Während der Umsetzung ist nichts zu tun. Nach dem unabhängigen Review bleibt
die menschliche Abschlussentscheidung offen.

Auftrag von Mike, 2026-09-27: „Ja, pass das für StockPortfolio so an“.

## Umsetzung und technische Nachweise

| Repo | Scope | GH-Issue |
|---|---|---|
| StockPortfolio | Lizenztexte, Paketmetadaten, Build-Auslieferung, zugängliche Hinweise, Dokumentation | — |

### Verify

✅ bestätigt · ⚠️ mit Einschränkung · ◑ teilweise · ➖ noch nicht geprüft.

| # | Handgriff | Nachweis | AI |
|---|---|---|:--:|
| 1 | Lizenzmodell mit StockInfo vergleichen | AGPL-3.0-or-later, kommerzielle Alternative, Fremdlizenzen bleiben erhalten | ✅ |
| 2 | Frontend bauen und Quellarchiv prüfen | Lizenzdateien und baubarer Quellstand im Bundle, keine lokalen Geheimnisse | ✅ |
| 3 | Docker lokal bauen und HTTP prüfen | Lizenzlabel, Hinweise und Quellarchiv im Image erreichbar | ✅ |
| 4 | Pflichtprüfungen ausführen | make test, make lint, make typecheck erfolgreich | ✅ |
| 5 | Anleitungen und Hub-Vorschau abgleichen | konsistente Lizenzangaben, Vorschau unter 25.000 Bytes, Unraid-Abgleich | ✅ |

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

### Akzeptanzkriterien

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

Eigene Umsetzung und Verifikation abgeschlossen. Unabhängige technische
Freigabe und menschliche Abschlussentscheidung stehen noch aus. Die
Übergabefassung wird ausschließlich in STATUS.md referenziert. Keine Images,
Release-Tags oder Änderungen auf `master` veröffentlicht.
