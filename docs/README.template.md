# README-Vorlage für StockPortfolio

Hinweise an den Agenten, der `README.md` schreibt oder aktualisiert. Diese
Datei enthält keinen Text zum Übernehmen: Jeder Abschnitt beschreibt, was
hinein gehört und woher die Angaben kommen. Formuliere selbst, in der Sprache
des README (laut `AGENTS.md` Englisch). Erscheint das README in weiteren
Sprachen, gilt dieselbe Vorlage für jede Fassung.

Die Datei hat zwei Teile: zuerst Anweisungen für die Arbeit, dann die
nummerierten Abschnitte des README in ihrer Reihenfolge. Nur die nummerierten
Abschnitte erscheinen im README.

## Anweisungen

**Allgemeine Regeln** (keine Make-Targets, npm-Befehle, Verzeichnisbäume,
Test- oder Release-Abläufe; nur Belegtes; Mermaid für Zusammenhänge) stehen
im Skill `readme-conventions` und werden hier nicht wiederholt.

Halte dich kurz und allgemein verständlich. Keine ausufernden Beschreibungen,
keine Detailverliebtheit. Wichtige Details klar aber nicht jede Kleinigkeit.
Kein Verweis auf Tickets und Entwicklungshistorie,
falls es nicht für das Verständnis des Textes unbedingt notwendig ist.

**Verbotene Begriffe** stehen mit Grund in `.docs-check.conf.sh` unter
`FORBIDDEN`; `make docs-check` prüft sie. Sie gelten auch für Codeblöcke und
Entwicklerabschnitte.

**Feature-Liste:** Quelle sind die Abschnitte von `docs/user-guide.md`
(je Funktion ein Abschnitt; „Rebalancing-Methode“ und „Noch nicht vorhanden“
sind keine Features). Beim Aktualisieren neue Abschnitte dort und
`feat`-Commits seit dem letzten README-Commit gegen die Liste abgleichen.

**Fehlende Dokumente:** Fehlt ein Dokument, auf das diese Vorlage verlinkt
(etwa `docs/user-guide.md` oder `docs/development.md`), legt der Agent es an,
nach den Sprachregeln der `AGENTS.md` (`docs/` ist deutsch). Inhalt aus Code
und vorhandener Doku, insbesondere aus dem bisherigen README. Angelegte
Dokumente im Bericht nennen.

**Sprachfassungen:** `README.md` ist englisch, daneben steht die deutsche
Fassung `README.de.md`. Aufbau, Sprachzeile und Abgleich der Fassungen regelt
der Skill `readme-conventions`.


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
Quelle: `docker/README.md`.

## 5. Feature-Liste

Alle Features als Liste, je Eintrag eine Zeile: fetter Name, kurze
Beschreibung. Quelle siehe [Anweisungen](#anweisungen). Features mit eigenem
Abschnitt (siehe 6) verlinken auf diesen.

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
- Unraid-Guide (`unraid/README.md`)
- Changelog (`CHANGELOG.md`)

Design-Specs und Ticket-Board nicht aufnehmen.

## 12. Support

Für den Eigengebrauch gebaut und frei geteilt; Issues und Pull Requests
werden gelesen, ohne Zusage auf Antwort, Fix oder neue Funktion. Link auf die
Issues. Quelle: Abschnitt „Support“ im bisherigen README.

## 13. Lizenz

Baustein `templates/license-eupl.md` aus dem Skill `readme-conventions`,
Wortlaut unverändert. Alle Werte und Links aus `LICENSING.md` und den dort
genannten Lizenzdateien; das bisherige README ist keine Quelle.
