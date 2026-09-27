# T-57 · EUPL-Lizenz für StockPortfolio

**Warum dieses Ticket:** StockPortfolio soll unter einer OSI-anerkannten
Lizenz nutzbar, veränderbar und weitergebbar sein. Mike hat sich nach der
Abwägung für **EUPL 1.2** entschieden. Die bisherigen Gebührenpflichten für
Rebranding, Weiterverkauf, Hosting und geänderte Weitergabe entfallen.

**Stand:** EUPL 1.2 umgesetzt und lokal geprüft, einschließlich Docker-Image,
HTTP-Downloads und Quellarchiv. COMMERCIAL-LICENSE.md ist entfernt.
Der unabhängige Review der EUPL-Fassung steht noch aus. Die Übergabe der eigenen
StockPortfolio License 1.0 (Runde 2, e3d068e) ist zurückgezogen; ihre Belege
bleiben unten als Historie und bestätigen nicht die neue EUPL-Fassung.

## Für dich

### Rechteaufteilung und interne Vereinbarung später klären

Michael Mitterer bleibt **Urheber und Urheberrechtsinhaber**. MangoLila GmbH
soll die **Nutzungs- und Lizenzierungsrechte** erhalten und nach außen als
Anbieterin und Lizenzgeberin auftreten. „MangoLila ist Rechteinhaberin“ allein
ist zu ungenau: Gemeint sind die eingeräumten Nutzungsrechte, nicht eine
Übertragung der Urheberschaft.

Nach [§ 23 UrhG](https://www.ris.bka.gv.at/eli/bgbl/1936/111/P23/NOR12024424)
ist das Urheberrecht unter Lebenden grundsätzlich nicht übertragbar.
[§ 24 UrhG](https://www.ris.bka.gv.at/eli/bgbl/1936/111/P24/NOR40041612)
unterscheidet die nicht ausschließliche **Werknutzungsbewilligung** vom
**ausschließlichen Werknutzungsrecht**. Ausschließlichkeit ist noch nicht
beschlossen und wird durch die öffentliche Anbieterangabe nicht behauptet.

Für die spätere Vereinbarung zwischen dir und MangoLila ausdrücklich festlegen:

- Welche Nutzungs- und Verwertungsrechte MangoLila erhält, für welche Bestandteile,
  in welchem Gebiet und für welche Dauer; bestehende Fremdrechte ausnehmen.
- Ob diese Rechte ausschließlich sind und welche eigenen Rechte du dir vorbehältst.
- Dass MangoLila Lizenzen an Dritte vergeben darf, ausdrücklich unter EUPL und
  bei Bedarf unter gesondert vereinbarten kommerziellen Bedingungen.
- Ob künftige Beiträge, Versionen und Änderungen umfasst sind; Rechte Dritter
  müssen für eine alternative Lizenzierung ebenfalls ausreichen.

Die Rechtevereinbarung ist **noch nicht als abgeschlossen nachgewiesen**.
Die Repositorytexte ersetzen sie nicht. Art. 6 EUPL setzt entsprechende
Rechte der Lizenzgeberin voraus. Eine GmbH-Anbieterangabe allein garantiert
keine vollständige Befreiung von persönlicher gesetzlicher Haftung.

### Österreichische Haftung und Gewährleistung nachgehen

Die offiziellen EUPL-Texte bleiben unverändert. Eine gesonderte Erklärung
in LICENSING.md setzt den besprochenen konservativen Ansatz um:
MangoLila beruft sich gegenüber Verbrauchern nicht auf die Gewährleistungs-
und Haftungsausschlüsse der Artikel 7 und 8; stattdessen gelten die gesetzlichen
Regeln. Keine zusätzliche freiwillige Garantie und keine Verpflichtung
anderer Mitwirkender. Diese Erklärung schränkt die EUPL-Nutzungsrechte nicht ein.

Vor Veröffentlichung gezielt österreichisch rechtlich prüfen lassen:

- Einbindung und Wirkung dieser Erklärung, einschließlich Art. 9 EUPL;
  kein vollständiges Rechtsgutachten durch die technische Umsetzung behaupten.
- [§ 6 Abs. 1 Z 9 und Abs. 3 KSchG](https://ris.bka.gv.at/Dokumente/Bundesnormen/NOR40274264/NOR40274264.html):
  insbesondere Personenschäden, Vorsatz, grobe Fahrlässigkeit und Transparenz.
- Anwendbarkeit von Gewährleistungs- und Aktualisierungspflichten bei der
  tatsächlichen Auslieferung einschließlich StockInfo-Anbindung. Die Ausnahme
  für kostenlose freie und quelloffene Software in
  [§ 1 Abs. 2 Z 7 VGG](https://www.ris.bka.gv.at/GeltendeFassung.wxe?Abfrage=Bundesnormen&Gesetzesnummer=20011654)
  hängt auch von der Datenverarbeitung ab; daraus folgt keine allgemeine
  Haftungsfreiheit. Bezahltes Hosting wäre gesondert zu beurteilen.
- Österreichisches Recht nach Art. 15 EUPL; zwingende Verbraucherrechte und
  gesetzliche Gerichtsstände dürfen nicht pauschal ausgeschlossen werden.

Die technische EUPL-Umstellung ist umgesetzt und lokal geprüft. Rechtsprüfung,
Rechtevereinbarung, unabhängiger technischer Review und menschlicher
Ticketabschluss werden dadurch nicht als erledigt behandelt.

### Entscheidungen von Mike · 2026-09-27

- „Na dann EUPL. Wie soll ich mit den österreichischen Haftungsregeln umgehen?“
- „Ich bleibe Urheber, MangoLila Rechteinhaber?“ — präzisiert wie oben.
- „Vermerke die lezten Absätze auch in dem Ticket damit ich dem später nachgehen kann. Bei Gelegenheit benenne auch das Ticket um auf eupl und dann setze das so um“.
- „Es gibt dann also keine kommerzielle Lizenz mehr?“ — EUPL erlaubt selbst
  kommerzielle Nutzung; keine zusätzliche Gebührenpflicht. Individuelle spätere
  Vereinbarungen bleiben möglich, werden hier aber nicht als fertige Lizenz angeboten.
- „Das File commerical-licence.md fällt weg - oder?“ — COMMERCIAL-LICENSE.md
  ist einschließlich Links, Build-Auslieferung und Archivmanifest entfernt.
- „Du checkst dass das auch bei Docker usw. berücksichtigt wird.“ — lokaler
  Image-Build, Label, HTTP-Downloads, Quellarchiv und Hub-Vorschau geprüft.

## Umsetzung und technische Nachweise

### Umsetzungsplan

- [x] Offizielle EUPL 1.2 in Englisch und Deutsch unverändert übernehmen;
  Lizenzgewährung, Copyright, Anbieterin und Verbraucherklärung separat halten.
- [x] Paket-/Docker-Metadaten, Downloadliste, Archivmanifest, vorhandene
  Artefakttests und aktuelle Dokumentation gemeinsam umstellen.
- [x] Tests, lint, typecheck, Produktionsbuild, Quellarchiv und HTTP-Auslieferung
  sowie echte Docker-Hub-Vorschau prüfen; Befunde hier nachtragen.
- [x] Fertige Produktfassung committen und als Runde 3 unabhängig übergeben.

### Verify

✅ bestätigt · ⚠️ mit Einschränkung · ◑ teilweise · ➖ noch nicht geprüft.

| # | Handgriff | Nachweis | AI |
|---|---|---|:--:|
| 1 | Lizenztexte, Rechteaufteilung und erlaubte Nutzungen abgleichen | EN/DE bytegleich zur EU-Quelle; persönliche Urheberschaft, MangoLila als Lizenzgeberin und Verbraucherklärung konsistent; EUPL-1.2 only | ✅ |
| 2 | Frontend und Quellarchiv einschließlich neuer Lizenzdateien prüfen | Produktionsbuild erfolgreich; 122 Manifestdateien bytegleich, keine Symlinks; alle lokalen Legal-Downloads vorhanden | ✅ |
| 3 | Containerlabel und HTTP-Downloads prüfen | linux/amd64 healthy; Label EUPL-1.2; sechs HTTP-Antworten 200; fünf Dokumente und 122 Archivdateien bytegleich; kommerzielle Datei fehlt im Image und Archiv | ✅ |
| 4 | make test, make lint und make typecheck ausführen | 63 Testdateien / 795 Tests erfolgreich, lint und typecheck Exit 0 | ✅ |
| 5 | Beide READMEs, Unraid, Links und Hub-Vorschau abgleichen | Gemeinsame Aussagen konsistent; Hub-Vorschau 6.658 Bytes; keine alte Lizenzpflicht in aktuellen Produkttexten; zentrale XML unverändert passend | ✅ |
| 6 | Interne Rechtevereinbarung und österreichische Rechtsprüfung | Menschliche Aufgabe, nicht technisch bestätigt | ➖ |

### Prüfnachweise · EUPL-Fassung · 2026-09-27

**Lizenzquellen:** Die über die [offizielle EU-Seite](https://interoperable-europe.ec.europa.eu/collection/eupl/eupl-text-eupl-12)
verlinkten Originaldateien sind unverändert übernommen. Der gewählte Umfang
ist EUPL 1.2 **only**, in LICENSING.md ausdrücklich angegeben; kein automatischer
Wechsel auf künftige Fassungen. Die Kompatibilitätsregel aus Artikel 5 bleibt
unberührt. npm und Docker nennen entsprechend `EUPL-1.2`.

- [Englisch](https://interoperable-europe.ec.europa.eu/sites/default/files/custom-page/attachment/2020-03/EUPL-1.2%20EN.txt):
  LICENSE, 13.827 Bytes, SHA-256 `6fc9e709ccbfe0d77fbffa2427a983282be2eb88e47b1cdb49f21a83b4d1e665`.
- [Deutsch](https://interoperable-europe.ec.europa.eu/sites/default/files/inline-files/EUPL%20v1_2%20DE.txt):
  LICENSE.de.txt, 15.282 Bytes, SHA-256 `208705beb6df6c418b821f73b2cf192d9d5c6837a1a59391a261c7abe2fb0dce`.

`make test`, `make lint`, `make typecheck` und `make build-frontend` erfolgreich.
63 Testdateien / 795 Tests. Bestehende Vue-Injection-/Routerwarnungen im Testlauf;
keine fehlgeschlagenen Tests. Bekannte Buildwarnung: vendor-ui-Chunk über 500 kB.
`git diff --cached --check` meldet ausschließlich die unverändert aus der
EU-Originaldatei übernommenen CRLF-Zeilen und Leerzeichen in LICENSE.de.txt.
Bytegleichheit hat hier Vorrang; keine globale Whitespace-Regel abgeschaltet.
Der Check für alle übrigen Änderungen ist sauber.
Der Docker-Build meldet beim unveränderten Abhängigkeitsbestand fünf npm-Funde
(3 moderate, 2 high); kein Dependency-Audit oder Fix im Lizenzauftrag behauptet.

Build-Helfer und vorhandener Artefakttest verwenden die neue Dokumentliste:
LICENSE.txt, LICENSE.de.txt, LICENSING.md und THIRD_PARTY_NOTICES.md.
Die App-Seite legal.html verlinkt alle vier und stockportfolio-source.tgz.
Keine neue Testmechanik für den Lizenzwechsel; vorhandene Inhalts-/Archivprüfung
angepasst. Das TS-Compiler-API-Inventar der Deklarationen in beiden geänderten
TS-Dateien enthält ausschließlich englische Bezeichner.

Lokales Quellarchiv: 122 reguläre Dateien, 268.180 Bytes. Exakte Gleichheit mit
der expliziten Paketdateiliste und den Arbeitsdateien geprüft; keine Symlinks
oder zusätzliche Metadaten. Die vier Lizenzdokumente und legal.html sind zum
Quellstand bytegleich, alle lokalen Downloadziele vorhanden. Die entfernte
kommerzielle Datei ist weder im Produktionsverzeichnis noch im Archiv vorhanden.

Docker-Image `stockportfolio-t57-eupl:local`, Plattform linux/amd64,
Manifest-Liste `sha256:f505ef41b48fe08c64d76a0d087cdd36083bd1047ba0618931e65fd59f8fd171`.
Temporärer Container `stockportfolio-t57-eupl-check` auf localhost:60933:
healthy, OCI-Lizenzlabel EUPL-1.2. Sechs HTTP-Downloads mit Status 200:
legal.html (2.076 Bytes, Weiterleitung nach /legal), LICENSE.txt (13.827),
LICENSE.de.txt (15.282), LICENSING.md (3.535), THIRD_PARTY_NOTICES.md (3.156),
stockportfolio-source.tgz (255.747). Die fünf Dokumente und alle 122 Dateien
im heruntergeladenen Archiv sind zum Arbeitsstand bytegleich. Verschiedene
komprimierte Archivgrößen auf macOS und Linux ändern diese Inhaltsgleichheit
nicht. Die fehlende kommerzielle Datei zusätzlich direkt im Image geprüft;
ein HTTP-200 allein wäre wegen möglicher SPA-Fallbacks kein Abwesenheitsbeleg.

Der Container lief mit absichtlich unerreichbarer API-Adresse und prüfte nur
die statische Auslieferung, keine Kurse oder Live-StockInfo. Danach gestoppt;
`--rm` räumt genau diesen Testcontainer auf. Kein Image-Push, keine Hub-Publikation,
kein Live-Unraid und keine CA-Aufnahme behauptet. Kein neuer Browser-Layouttest:
App-Navigation und Styles unverändert, geändert sind statische Lizenztexte.

### Nachprüfen

Im Projektroot; die Docker-Befehle erstellen nur einen lokalen Testcontainer.
Port 60933 muss frei sein, andernfalls einen anderen Port wählen.

```bash
# #1: Hashes mit den oben verlinkten EU-Originaldateien vergleichen
shasum -a 256 LICENSE LICENSE.de.txt
# #2 und #4: vorhandene Tests und Produktionsausgabe
make test
make lint
make typecheck
make build-frontend
cmp LICENSE dist/LICENSE.txt
cmp LICENSE.de.txt dist/LICENSE.de.txt
cmp LICENSING.md dist/LICENSING.md
cmp THIRD_PARTY_NOTICES.md dist/THIRD_PARTY_NOTICES.md
cmp public/legal.html dist/legal.html
tar -tzf dist/stockportfolio-source.tgz
# #3: Image bauen, Label und Downloads prüfen
docker build --platform linux/amd64 -f docker/Dockerfile -t stockportfolio-t57-eupl:local .
docker run --rm -d --platform linux/amd64 --name stockportfolio-t57-eupl-check \
  -p 127.0.0.1:60933:8080 -e STOCKINFO_API_URL=http://127.0.0.1:9 stockportfolio-t57-eupl:local
docker inspect --format '{{index .Config.Labels "org.opencontainers.image.licenses"}} {{.State.Health.Status}}' stockportfolio-t57-eupl-check
curl -fsSL http://127.0.0.1:60933/LICENSE.txt -o /tmp/t57-eupl-license-http.txt
cmp LICENSE /tmp/t57-eupl-license-http.txt
curl -fsSL http://127.0.0.1:60933/stockportfolio-source.tgz -o /tmp/t57-eupl-source-http.tgz
tar -tzf /tmp/t57-eupl-source-http.tgz
docker stop stockportfolio-t57-eupl-check
# #5: tatsächliche Docker-Hub-Konvertierung, keine Veröffentlichung
./.libs/ProjectTools/src/bash/dockerhub-readme.sh --readme docker/README.md --preview --ref master --output docker/logs/dockerhub-readme.md
```

### Doku-Abgleich

Datei- und Überschrifteninventar für Projekt-/Docker-README, unraid/README.md,
SOURCE.md, neue LICENSING.md, public/legal.html, docs/ und Ticketboard erstellt.

- README.md / License und docker/README.md / License and source: gleicher
  Rechteumfang, Copyright und Anbieterin, Verbraucherklärung und Downloads.
  Entwickler-Bauanleitung bleibt im Projekt-README; Containerpfade und Betrieb
  bleiben in der Docker-Anleitung. Hub-Vorschau 6.658 von maximal 25.000 Bytes.
- LICENSE / LICENSE.de.txt bleiben offizielle unveränderte Texte. LICENSING.md
  bündelt konkrete Lizenzgewährung, Anbieterangaben und separate Erklärung.
  SOURCE.md erklärt den Neubau und verweist auf EUPL-Pflichten.
- public/legal.html und scripts/licenseAssets.ts / package.json: alte kommerzielle
  Seite vollständig entfernt, neue Dokumente ausgeliefert und im Quellarchiv.
  Paket-Lockfile und Docker-Label konsistent; privater Runtime-Wrapper hat keine
  eigene abweichende Lizenz und bleibt Teil der Projektlizenz.
- unraid/README.md / License: App selbst unter OSI-anerkannter EUPL; MIT des
  separaten Template-Repos bleibt getrennt. Keine CA-Zusage aus der Lizenz ableiten.
- Zentrale Vorlage `/Volumes/DevLocal/DevUnraid/Production/Templates/templates/stockportfolio.xml`
  gelesen: keine abweichende Lizenzzusage, keine betroffenen Ports/Variablen oder
  Installationsfelder. Unverändert; kein Schreibauftrag dort abgeleitet.
  In diesem Template-Root liegt keine AGENTS.md. Kein fremdes Repository geändert.
- Historische Specs, docs/stockinfo-integration-proposal.md und frühere
  Ticketabschnitte enthalten keine zu ersetzende aktuelle EUPL-Zusage. Alte
  Lizenzvergleiche bleiben historische Recherche. Kein verbliebener Verweis
  auf den alten Ticket-Dateinamen in aktuellen Boarddateien.
- Skill-Abgleich: keine Änderung von Board-/Lessons-Konventionen, daher kein
  Skill-Edit nötig. Installiertes Workflow-Paket `86db65b5bc83e7c494acb738b6275b56a9cb56e5481a17b7c215d7aee4620843`
  gelesen; die in STATUS bereits offene allgemeine Konventionsübernahme bleibt
  außerhalb dieses Lizenzauftrags. Keine vollständige Boardmigration behauptet.

### Vorbeugung und Lessons

Lokales Codex-Inventar SP-CX-01 bis SP-CX-05 und einschlägige gemeinsame
AL-R-01/02/06/12 gelesen. Angewendet: SP-CX-02 (Fassung mit Ergänzung T-55 vom
2026-09-27) für alle aktuellen Lizenzzusagen; AL-R-02 für Datei-/Downloadinventar;
AL-R-01 für Trennung von technischen und juristischen Nachweisen; AL-R-06 für
Rücknahme der überholten Runde und erneute Übergabe erst nach Produktcommit;
AL-R-12 für Prüfung gegen EU-Originaltexte und österreichische Primärquellen.
Keine neue Lesson aus der ausdrücklich geänderten Produktentscheidung abgeleitet.

### Auflösung

Technische Umsetzung und eigene Nachweise fertig. Unabhängiger Review Runde 3
angefordert für Produktfassung `28aba0924ad59f04d0f6340b931fd29b8b5f4905`. Rechtevereinbarung und österreichische
Rechtsprüfung bleiben für Mike offen; weder Veröffentlichung noch Ticketabschluss
sind damit freigegeben. Fremde Änderungen an ACTIVITY.md bleiben außerhalb
der Produkt-/Ticketcommits.

## Historie · zurückgezogene eigene Lizenz, Runde 2

Die folgenden Texte und die darin enthaltene Verify-Matrix sind der
**abgelöste Snapshot** der eigenen Lizenzfassung e3d068e, einschließlich der
anschließenden Recherche. Sie sind keine aktuellen Produktzusagen oder
Prüfnachweise der EUPL-Fassung. Die aktuelle Matrix steht oben. Runde 2 wurde
vor dokumentiertem Reviewabschluss auf Mikes neue Lizenzentscheidung hin
zurückgezogen. Originalrückmeldungen und Belege bleiben erhalten.

# Frühere Nutzungslizenz für StockPortfolio

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

Umsetzung und eigene technische Prüfungen abgeschlossen; an `claude` in
Runde 2 übergeben: `e3d068e81abc55e0474e445bbf2edfae868bb305`.
Rechtliche Prüfung der internen Vereinbarung bleibt gesondert offen.
Kein Ticketabschluss, Merge oder Push behauptet.

## Ergänzende Lizenzanalyse · 2026-09-27 · nach Übergabe Runde 2

Mike beauftragt den Vergleich zweier weiterer Anbieter und ergänzt:
„Die Vereinbarung die wir ausliefern muss aber natürlich österreichischem Recht entsprechen“.
Die Produktfassung e3d068e bleibt für den laufenden Review unverändert.
Die folgenden Empfehlungen sind noch nicht in LICENSE umgesetzt und müssen
vor einer Veröffentlichungsentscheidung bearbeitet werden.

**Duplicacy / Acrosync:** Geprüft ist ausdrücklich die CLI-Lizenz, nicht die
anders lizenzierte Weboberfläche. Die [CLI-Lizenz](https://github.com/gilbertchen/duplicacy/blob/master/LICENSE.md)
erlaubt Änderungen und Weitergabe, bindet aber kommerzielle Nutzung abgeleiteter
Fassungen an dieselben Lizenzanforderungen. [Unraid-Eintrag der CLI](https://ca.unraid.net/apps/duplicacy-cli-cron-1snret31lkotzv).
Nutzen für uns: Regeln ausdrücklich auf urheberrechtlich geschützte übernommene
Teile und abgeleitete Fassungen beziehen; keine Rechte an unabhängig geschriebenem
Code behaupten. Duplicacys Gebührenpflicht für interne Firmennutzung widerspricht
Mikes Entscheidung und wird nicht übernommen.

**Emby / Emby LLC:** Die [App-Bedingungen § 3](https://emby.media/terms.html)
trennen Nutzungsrechte, Fremdkomponenten und freiwilligen Support; sie schränken
Bearbeitung/Weitergabe stark ein und sehen einen weitgehenden Widerruf vor.
[Unraid-Eintrag](https://ca.unraid.net/apps/embyserver-10n559a1aloroy).
Nutzen für uns: freiwilligen Support sauber von gesetzlichen Pflichten trennen.
Kein beliebiger Widerruf, keine pauschalen Verbote eigener Änderungen übernehmen.
Beide Beispiele belegen eine Listung mit eigenen App-Bedingungen, keine Prüfung
unserer Lizenz durch Unraid und keine österreichische Wirksamkeitsbestätigung.

**Konkrete Nachbesserungen am Entwurf:**

1. Software-Begriff um geschützte Teile/abgeleitete Fassungen ergänzen. Eigene
   Anpassungen bleiben frei; die vereinbarten Grenzen gelten auch bei Einbettung.
2. Österreichische Rechtswahl ergänzen, mit ausdrücklichem Erhalt zwingenden
   Verbraucherschutzes nach [Art. 6 Rom I](https://eur-lex.europa.eu/legal-content/DE/TXT/?uri=CELEX:32008R0593).
   Keine pauschale ausschließliche Gerichtsstandsklausel für Verbraucher.
3. LICENSE § 6 und Kurzfassung in legal.html neu fassen: pauschaler Ausschluss
   sämtlicher Gewährleistung und Haftung „soweit zulässig“ ist keine belastbare
   österreichische Klauselprüfung. [§ 6 KSchG](https://www.ris.bka.gv.at/eli/bgbl/1979/140/P6/NOR40274264)
   schützt u.a. bei Personenschäden, Vorsatz/grober Fahrlässigkeit und verlangt
   transparente AGB. [§ 9 KSchG](https://www.ris.bka.gv.at/eli/bgbl/1979/140/P9/NOR40237225)
   schützt bestehende Verbrauchergewährleistungsrechte. Konservative Grundlage:
   gesetzliche Haftung/Gewährleistung gelten; keine zusätzliche freiwillige
   Garantie. Gewünschte weitergehende Einschränkungen anwaltlich gestalten.
4. Keine freiwillige Support-/Weiterentwicklungszusage; zwingende Pflichten,
   insbesondere gegebenenfalls Aktualisierungspflichten, davon ausnehmen.
   Anwendbarkeit des [VGG §§ 1, 3, 7](https://www.ris.bka.gv.at/GeltendeFassung.wxe?Abfrage=Bundesnormen&Gesetzesnummer=20011654)
   hängt vom konkreten Angebot ab; nicht jede Gratis-App fällt darunter und
   Kostenlosigkeit allein schließt es bei Datenbereitstellung nicht aus.
5. Begriff „unverändert“ klarstellen: dokumentierte Konfiguration und separate
   Installationsvorlagen verändern die App nicht. Rebranding-/Hostinggrenzen
   dadurch nicht erweitern. Gilt auch für StockInfo-API-URL und Unraid-Vorlagen.

Rechtsprüfung muss zusätzlich Einbeziehung der Bedingungen bei Download/Installation
und interne Rechtekette Michael Mitterer → MangoLila GmbH abdecken. Der jetzige
App-Link allein beweist keinen wirksamen Vertragsschluss. Kein neuer Produkt-
oder Testnachweis, keine neue Reviewrunde durch diesen Recherche-Nachtrag.

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
