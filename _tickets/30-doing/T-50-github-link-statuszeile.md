# T-50 · GitHub-Link in der Statuszeile

In der Statuszeile fehlt ein direkter Weg zum GitHub-Repository von
StockPortfolio. Der Link soll wie bei StockInfo aus der App erreichbar sein.

**Stand:** Auf Mikes Auftrag vom 2026-09-27 direkt unter `30-doing/`
angelegt und zur Umsetzung aktiviert. Umsetzung und technische Prüfung laufen.

Für Mike steht jetzt keine Entscheidung an. Die Abschlussbestätigung bleibt
nach der Umsetzung offen.

## Auftrag

Original aus `QUESTIONS.md`:
„Bei StockPortfolio fehlt in der Statuszeile der GitHub link - vergleiche mit StockInfo - dort ist das schon richtig implementiert“.

Mike: „Für die Question - leg ein Ticket in doing an und starte dann gleich mit der Implementation“.

## Umsetzung und technische Nachweise

Scope: UI-only in StockPortfolio. StockInfo dient als lesbare Referenz.
Arbeitsbranch: `t-50-github-link-statuszeile`. Kein GitHub-Issue angelegt.

StockInfo nutzt den Slot `left` von `UxStatusBar` mit einem externen
`NButton`-Link. StockPortfolio verwendet denselben Slot und einen beschrifteten
GitHub-Link. Beschriftung und zugänglicher Name kommen aus beiden Sprachkatalogen.
Das Ziel ist `https://github.com/MikeMitterer/stockportfolio`; der Link öffnet
einen neuen Tab mit `rel="noopener noreferrer"`.

Der installierte Fundament-Baustein hat kein Repository-Prop oder GitHub-Symbol.
Ein Textlink nutzt vorhandene Bausteine ohne kopiertes SVG oder eigene
Naive-Komponentenstile. Status, Depotkontext und Kursalter bleiben sichtbar.

### Akzeptanzkriterien

- [ ] Die Statuszeile enthält einen sichtbaren Link zum StockPortfolio-Repository.
- [ ] Link ist per Tastatur erreichbar, auf schmalen Ansichten sichtbar und in DE/EN beschriftet.
- [ ] Vorhandene Statusangaben und der Weg zu den Einstellungen bleiben erhalten.
- [ ] Pflichtprüfungen und Doku-Abgleich sind dokumentiert.

### Verify

Einzige aktuelle technische Matrix. ✅ geprüft, ◑ teilweise, ➖ noch ohne Nachweis.

| # | Prüfung | Nachweis | AI |
|---|---|---|:--:|
| 1 | Linkziel, Beschriftung, neuer Tab und sichere Linkattribute | Ausstehend | ➖ |
| 2 | Darstellung auf Desktop und schmaler Ansicht; Tastatur und Statusbereich | Ausstehend | ➖ |
| 3 | `make test`, `make lint`, `make typecheck` | Ausstehend | ➖ |
| 4 | Bezeichnerinventar und Doku-Abgleich | Ausstehend | ➖ |

### Side-Effects

Ein zusätzlicher externer Link in der Statuszeile. Keine Daten-, API- oder
Konfigurationsänderung und keine Änderungen an StockInfo oder ux-foundation.

### Lessons und Doku-Abgleich

Lokale Codex-Lessons vor Umsetzung gelesen. SP-CX-02: aktuelle Ticket- und
STATUS-Aussagen gemeinsam nachziehen. AL-R-01/02: tatsächliche Prüftiefe und
Dateiinventar dokumentieren. AL-R-11: Prüfaufwand auf den zusätzlichen Link
begrenzen. Gemeinsame Regeln sind als `needs_review` gekennzeichnet.

Der fehlende Link ist ein einzelner Nutzerbefund ohne belegtes wiederkehrendes
Fehlermuster; keine neue Lesson erforderlich.

**Doku-Abgleich:** README.md, docker/README.md, docs/ und Unraid-Anleitung
werden auf betroffene Aussagen geprüft. Die allgemeine Board-Übernahme auf
`2026-09-11-lessons-follow-through` bleibt außerhalb dieses UI-Auftrags offen.

### Auflösung

Noch in Umsetzung. Keine unabhängige technische Freigabe oder menschliche
Abschlussbestätigung vorhanden.
