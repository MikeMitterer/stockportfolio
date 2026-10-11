# README-Vorlage für StockPortfolio

Hinweise an den Agenten, der `README.md` schreibt oder aktualisiert. Diese
Datei enthält keinen Text zum Übernehmen: Jeder Abschnitt beschreibt, was
hinein gehört und woher die Angaben kommen. Formuliere selbst, in der Sprache
des README (laut `AGENTS.md` Englisch). Erscheint das README in weiteren
Sprachen, gilt dieselbe Vorlage für jede Fassung.

Reihenfolge der Abschnitte wie hier. Komplexere Zusammenhänge als
Mermaid-Diagramm statt als Fließtext.

## Ausschlüsse

- Keine UID/GID-Angaben (`PUID`, `PGID`, `99:100`, `nobody:users`).
- Keine Make-Targets, npm-Befehle, Verzeichnisbäume, Test- oder Release-Abläufe.
  Das gehört in die Entwicklerdoku; das README verlinkt sie nur.
- Nichts, was sich nicht in Code oder vorhandener Doku belegen lässt.

## 1. Kopf

Zentriert (`<div align="center">`), und nur der Kopf: App-Logo
(`frontend/public/stockportfolio-icon.png`, 96 × 96), Name als
Überschrift, fette Subheadline mit dem Zweck der App in einer Zeile,
Badges (Version, Docker Hub, Lizenz), Link-Leiste zu den wichtigsten
Abschnitten und Dokumenten, getrennt durch ` · `. Danach `</div>`.

## 2. Überblick

Zwei bis vier Sätze: was die App kann und für wen. Nenne die Schwester-App
StockInfo mit Link und in einem Halbsatz ihre Rolle (liefert die Kurse).

## 3. Screenshot

`docs/images/dashboard.png`, nicht zentriert, darunter eine kursive
Bildunterschrift: was man sieht und wie man es liest.

## 4. Warnung

Ein GitHub-Hinweis (`> [!WARNING]`): StockPortfolio und StockInfo nicht ins
Internet stellen, nur im Heimnetz betreiben, von außen per VPN zugreifen.
Quelle: Abschnitt „Docker“ im bisherigen README bzw. `docker/README.md`.

## 5. Feature-Liste

Alle Features als Liste, je Eintrag eine Zeile: fetter Name, kurze
Beschreibung. Features mit eigenem Abschnitt (siehe 6) verlinken auf diesen.

## 6. Wichtigste Features

Je Feature: Überschrift, Screenshot, Beschreibung. Die Beschreibung erklärt,
was das Feature tut und wozu, in einem bis zwei kurzen Absätzen. Nicht nur
ein Satz, keine Bedienungsanleitung (die steht im User Guide).

- **Dashboard und Portfolio-Gruppen**: `docs/images/dashboard.png` ist schon
  oben verwendet; hier ohne Bild oder mit `drilldown.png`.
- **Rebalancing**: `docs/images/rebalancing.png`. Hervorheben, dass es eine
  Simulation ist und keine Aufträge ausführt.
- **Positionsdetails und Kursverlauf**: `docs/images/drilldown.png`.
- **Berechnung, Sicherheitspuffer, Investitionsreserve**:
  `docs/images/settings-calculation.png`.
- **Konten und Benutzerverwaltung**: `docs/images/user-admin.png`.

## 7. Schwester-App StockInfo

Was StockInfo ist, dass StockPortfolio ohne sie nicht läuft und welche Daten
woher kommen (Kurse, Wechselkurse, Fondskennzahlen, Kursverlauf). Ein
Diagramm zeigt den Datenfluss Browser → StockPortfolio → StockInfo →
Datenquellen. Links auf das StockInfo-Repository und das Docker-Image.

## 8. Quick start

Kurz: Voraussetzung (laufende StockInfo-Instanz), ein `docker run`-Beispiel
mit den nötigen Angaben, Adresse im Browser. Dann ein bis zwei Sätze, was im
Container-Guide `docker/README.md` zusätzlich steht (Compose, Daten und
Backups, Updates, Reverse Proxy, Unraid), und der Link dorthin.

## 9. Konfiguration

Nur die wichtigsten Punkte als Tabelle: `STOCKINFO_API_URL`, `/data`-Volume,
Port, `STOCKPORTFOLIO_PUBLIC_ORIGIN`, `STOCKPORTFOLIO_SECURE_COOKIES`.
Beschreibung und Standardwert aus `docker/README.md`; dorthin für alle
Details verlinken.

## 10. Entwicklung

Ein Satz und der Link auf `docs/development.md`.

## 11. Weitere Dokumentation

Liste mit Links und je einer kurzen Beschreibung:

- User Guide (`docs/user-guide.md`)
- Container-Guide (`docker/README.md`)
- Changelog (`CHANGELOG.md`)

Design-Specs und Ticket-Board nicht aufnehmen.

## Fehlende Dokumente

Fehlt ein Dokument, auf das diese Vorlage verlinkt (etwa `docs/user-guide.md`
oder `docs/development.md`), legt der Agent es an, nach den Sprachregeln der
`AGENTS.md` (`docs/` ist deutsch). Inhalt aus Code und vorhandener Doku,
insbesondere aus dem bisherigen README. Angelegte Dokumente im Bericht nennen.

## 12. Support

Für den Eigengebrauch gebaut und frei geteilt; Issues und Pull Requests
werden gelesen, ohne Zusage auf Antwort, Fix oder neue Funktion. Link auf die
Issues. Quelle: Abschnitt „Support“ im bisherigen README.

## 13. Lizenz

Die wichtigsten Punkte: Rechteinhaber und Lizenzgeber, Lizenz (EUPL 1.2,
nur diese Version), was sie erlaubt und verlangt, Haftungsausschluss,
Kontakt. Quelle: `LICENSING.md` und Abschnitt „License“ im bisherigen
README. Verlinke `LICENSE`, `LICENSE.de.txt`, `LICENSING.md` und
`THIRD_PARTY_NOTICES.md` für die Details.
