# T-50 · GitHub-Link in der Statuszeile

In der Statuszeile fehlt ein direkter Weg zum GitHub-Repository von
StockPortfolio. Der Link soll wie bei StockInfo aus der App erreichbar sein.

**Stand:** Auf Mikes Auftrag vom 2026-09-27 direkt unter `30-doing/`
angelegt. GitHub-Link umgesetzt; eigene technische Prüfungen erfolgreich.
Die unabhängige Prüfung und Mikes Abschlussbestätigung sind noch offen.

Für Mike bleibt nach der technischen Prüfung die Abschlussbestätigung offen.

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

- [x] Die Statuszeile enthält einen sichtbaren Link zum StockPortfolio-Repository.
- [x] Link ist per Tastatur erreichbar, auf schmalen Ansichten sichtbar und in DE/EN beschriftet.
- [x] Vorhandene Statusangaben und der Weg zu den Einstellungen bleiben erhalten.
- [x] Pflichtprüfungen und Doku-Abgleich sind dokumentiert.

### Verify

Einzige aktuelle technische Matrix. ✅ geprüft, ◑ teilweise, ➖ noch ohne Nachweis.

| # | Prüfung | Nachweis | AI |
|---|---|---|:--:|
| 1 | Linkziel, Beschriftung, neuer Tab und sichere Linkattribute | Chrome: DE/EN-Label, korrektes Ziel, `_blank`, `noopener noreferrer`; Enter öffnet GitHub in separatem Tab | ✅ |
| 2 | Darstellung auf Desktop und schmaler Ansicht; Tastatur und Statusbereich | 1440 × 900 und 375 × 812, kein horizontaler Überlauf; Tab von MangoLila erreicht GitHub; Statusklick führt nach `#/settings` | ✅ |
| 3 | `make test`, `make lint`, `make typecheck` | 2026-09-27: 61 Testdateien / 783 Tests bestanden; Lint und Typecheck jeweils Exit 0 | ✅ |
| 4 | Bezeichnerinventar und Doku-Abgleich | TS-Compiler-API: 509 unterschiedliche Bezeichner aus den drei geänderten Produktdateien inventarisiert; keine deutschen Bezeichner. Doku-Ergebnis unten | ✅ |

Browserprüfung in einem isolierten Chrome-Kontext mit frischem Browserzustand.
Zunächst wurde der Link bei nicht erreichbarem Dienst geprüft. Auf Mikes Hinweis
wurde anschließend der vorhandene echte StockInfo-Testserver gestartet:
temporäre SQLite-Datenbank, lokale Testquelle, keine produktiven Daten.
Mit erreichbarem Dienst bleiben Depotname, Kursalter und grüner API-Status erhalten.
DE/EN wurde über die bestehende i18n-Instanz geprüft; keine neue Sprachlogik.
Der Link öffnete tatsächlich `https://github.com/MikeMitterer/stockportfolio`
in einem zweiten Tab; die App blieb auf ihrer Einstellungsseite.

Reproduktion aus dem Projektverzeichnis, Server jeweils im eigenen Terminal:

```bash
# #1/#2: Vorhandener isolierter StockInfo-Testserver.
/Volumes/DevLocal/DevWeb/Production/StockInfo/.venv/bin/python \
  scripts/stockinfo-test-server.py \
  --stockinfo-root /Volumes/DevLocal/DevWeb/Production/StockInfo \
  --port 59999 --origin http://127.0.0.1:5175 \
  --detail-fixtures tests/fixtures/stockinfo --demo-details
# #1/#2: Frontend; Browser unter http://127.0.0.1:5175 öffnen.
VITE_STOCKINFO_API_URL=http://127.0.0.1:59999 npm run dev -- --host 127.0.0.1
# #3: Pflichtprüfungen.
make test
make lint
make typecheck
```

Keine neue Testsuite für den statischen Link. Vorhandene Wächter und
Komponententests laufen unverändert; Browserbelege prüfen die tatsächliche
Darstellung und Bedienung.

### Side-Effects

Ein zusätzlicher externer Link in der Statuszeile. Keine Daten-, API- oder
Konfigurationsänderung und keine Änderungen an StockInfo oder ux-foundation.

### Lessons und Doku-Abgleich

Lokale Codex-Lessons vor Umsetzung und Übergabe gelesen. SP-CX-02: aktuelle Ticket- und
STATUS-Aussagen gemeinsam nachziehen. AL-R-01/02: tatsächliche Prüftiefe und
Dateiinventar dokumentieren. AL-R-11: Prüfaufwand auf den zusätzlichen Link
begrenzen. Gemeinsame Regeln sind als `needs_review` gekennzeichnet.
Verwendete Dateifassungen (SHA-256-Präfix): SP-CX-02 `ca1ac7a8458f`,
AL-R-01 `e27b395617b8`, AL-R-02 `3a8094653f02`, AL-R-11 `052ba7162ac0`.
Belege: STATUS/Ticket-Abgleich, Verify #1–#4 und begrenzter Produktdiff.

Der fehlende Link ist ein einzelner Nutzerbefund ohne belegtes wiederkehrendes
Fehlermuster; keine neue Lesson erforderlich.

**Doku-Abgleich:** Datei- und Überschrifteninventar geprüft. `README.md`
(„Several portfolios“, „Checking it works“) und `docker/README.md`
(Repository-Einstieg, „Status and logs“) bleiben inhaltlich richtig und
unverändert: Der zusätzliche Link ändert keine Zusage zu API-Status,
Installation oder Betrieb. Die Repository-URL stimmt mit beiden Anleitungen
und dem Git-Remote überein. `docs/stockinfo-integration-proposal.md` und die
Spezifikation/Pläne unter `docs/superpowers/` behandeln fachliche Verträge
bzw. frühere Aufträge; keine geänderte Zusage. `unraid/README.md`
(„Configuration“, „Data, API and verification“) und die zentrale
`Templates/templates/stockportfolio.xml` bleiben unverändert, da weder
Container-Konfiguration noch Support-/Projektziel wechseln.
`_tickets/README.md`, STATUS und QUESTIONS wurden für T-50 nachgezogen.
Die allgemeine Board-Übernahme auf
`2026-09-11-lessons-follow-through` bleibt außerhalb dieses UI-Auftrags offen.

### Auflösung

Umsetzung und eigene Verifikation abgeschlossen. Keine unabhängige technische
Freigabe oder menschliche Abschlussbestätigung vorhanden; Ticket bleibt in Doing.
Produktfassung `75cac676c36f15d5041ce15c47e09a968d975670`, Runde 1 an den
zugeordneten Verifier übergeben. Eigener Vite- und StockInfo-Testserver nach
der Browserprüfung beendet. Keine Veröffentlichung erfolgt.
