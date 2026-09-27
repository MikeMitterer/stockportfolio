# T-50 · GitHub-Link in der Statuszeile

In der Statuszeile fehlt ein direkter Weg zum GitHub-Repository von
StockPortfolio. Der Link soll wie bei StockInfo aus der App erreichbar sein.

**Stand:** Nacharbeit auf Mikes Rückmeldung vom 2026-09-27. Die bisherige
Textlink-Fassung war in Runde 1 technisch freigegeben, entsprach aber nicht
der gewünschten Darstellung von StockInfo. Symbol, Position und Trennpunkte sind korrigiert und durch den Coder geprüft.
Die erneute unabhängige Prüfung steht aus.

Mikes Abschlussbestätigung bleibt offen.

## Auftrag

Original aus `QUESTIONS.md`:
„Bei StockPortfolio fehlt in der Statuszeile der GitHub link - vergleiche mit StockInfo - dort ist das schon richtig implementiert“.

Mike: „Für die Question - leg ein Ticket in doing an und starte dann gleich mit der Implementation“.

Mike präzisiert: „Ich habe dir gesagt du sollst das so implementieren wie bei StockInfo - Github-Symbol zwischen Powered by... und Depot“.
Zusatz: „Getrennt durch einen Punkt - wie eben die anderen Trennungen“.

## Umsetzung und technische Nachweise

Scope: UI-only in StockPortfolio. StockInfo dient als lesbare Referenz.
Arbeitsbranch: `t-50-github-link-statuszeile`. Kein GitHub-Issue angelegt.

Die Statuszeile übernimmt die Reihenfolge aus StockInfo:
`powered by MangoLila · GitHub-Symbol · Depot · Kursalter`.
Der linke Slot erhält Symbol und Kontext gemeinsam, weil `UxStatusBar` seine
Kontext-Props vor dem Slot ausgibt. Das SVG entspricht dem ausdrücklich
gewünschten StockInfo-Symbol. Keine Änderung an ux-foundation; keine eigenen
Stile auf Naive-Komponenten. Die Symbolgröße und Trennpunkte verwenden
Fundament-Token. Auf schmalen Ansichten entfällt der Trenner der ausgeblendeten
Herkunft; das Symbol und der Trenner vor dem Depot bleiben sichtbar.

Ziel: `https://github.com/MikeMitterer/stockportfolio`, neuer Tab mit
`rel="noopener noreferrer"`. Zugänglicher Name und Tooltip bleiben in DE/EN.

### Akzeptanzkriterien

- [x] GitHub-Symbol zwischen Herkunft und Depot, getrennt durch Punkte wie in StockInfo.
- [x] Link ist per Tastatur erreichbar, auf schmalen Ansichten sichtbar und in DE/EN beschriftet.
- [x] Vorhandene Statusangaben und der Weg zu den Einstellungen bleiben erhalten.
- [x] Pflichtprüfungen und Doku-Abgleich sind dokumentiert.

### Verify

Einzige aktuelle technische Matrix. ✅ geprüft, ◑ teilweise, ➖ noch ohne Nachweis.

| # | Prüfung | Nachweis | AI |
|---|---|---|:--:|
| 1 | GitHub-Symbol, Reihenfolge und Trennpunkte | Identischer SVG-Pfad wie StockInfo. Chrome-DOM und Screenshot: Herkunft · Symbol · Depot · Kursalter, kein sichtbarer GitHub-Text | ✅ |
| 2 | Desktop/mobil, Tastatur, DE/EN und Statusnavigation | Chrome 1440 × 900 und 375 × 812 ohne Überlauf; Tab erreicht Symbol, DE/EN-Name erhalten, Statusklick nach `#/settings`. Simulierter Kursfehler bleibt sichtbar | ✅ |
| 3 | `make test`, `make lint`, `make typecheck` | 2026-09-27, 09:16: 61 Dateien / 783 Tests grün; Lint und Typecheck erfolgreich | ✅ |
| 4 | Bezeichnerinventar und Doku-Abgleich | TS-Compiler-Inventar der Komponente und SCSS-Klassen geprüft; englisch. DE/EN entfernen nur den überflüssigen Textschlüssel. Anleitungen weiterhin zutreffend | ✅ |

Browserprüfung wieder mit dem vorhandenen StockInfo-Testserver, temporärer
Datenbank und isoliertem Chrome-Kontext. Zusätzlich wurde ein Kursfehler nur
im flüchtigen Quote-Store gesetzt und danach zurückgenommen, um die in den
Slot verschobene Fehleranzeige zu prüfen. Keine Produktionsdaten verändert.
Desktop-DOM: Herkunft, Punkt, Symbol-Link, Punkt, Depot, Punkt, Kursalter.
Mobil: Herkunft samt erstem Punkt ausgeblendet; Symbol · Depot bleiben stehen.
GitHub-Ziel, `_blank` und `noopener noreferrer` unverändert im DOM geprüft.

Frühere Nachweise zur Textlink-Fassung stehen im historischen Review von Runde 1;
sie belegen weder das Symbol noch seine gewünschte Position.

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

**Neuer Befund:** Coder und Review haben die verlinkte Referenz nicht auf
Symbol und Reihenfolge abgeglichen. Die frühere Fertigmeldung erfüllte damit
Mikes Vorgabe nicht vollständig. Der Observer soll die Lessons-Einordnung
für die Autorenschaft codex und die Review-Gegenprobe prüfen. Konkrete
Vorbeugung für diese Nacharbeit: DOM-Reihenfolge, identischer SVG-Pfad und
sichtbare Trennpunkte direkt mit StockInfo vergleichen; Beleg in Verify #1/#2.

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

### Historie: Unabhängige Prüfung · Runde 1 · claude

Geprüfte Fassung: `75cac676c36f15d5041ce15c47e09a968d975670` auf
`t-50-github-link-statuszeile`. Vor der Prüfung die lokale SP-CX-02 sowie
die gemeinsamen AL-R-01/02/11 gelesen (Autor: codex).

- **Diff gelesen:** `AppStatusBar.vue`, `de.ts`, `en.ts`. `NButton` (Naive UI)
  im vorhandenen `UxStatusBar`-Slot `left`, `tag="a"`, `target="_blank"`,
  `rel="noopener noreferrer"`, `aria-label`/`title` aus i18n. Kein eigenes
  CSS, keine Utility-Klasse, kein kopiertes SVG.
- **Pflichtprüfungen selbst reproduziert:** `make lint` (Exit 0),
  `make typecheck` (Exit 0), `make test` — 61 Testdateien / 783 Tests grün,
  deckt sich exakt mit der gemeldeten Zahl. Wächter-Tests (`storageAccess`,
  `componentStyles`, `utilityClasses`, `caretUsage`) darunter bestanden.
- **Bezeichner:** Neue Bezeichner im Diff (`repository`, `repositoryLabel`,
  Import `NButton`) durchgesehen — englisch, keine Auffälligkeit. Die volle
  509er-TS-Compiler-API-Inventur der drei Dateien wurde nicht erneut gefahren;
  bei diesem kleinen, klar abgegrenzten Diff unverhältnismäßig (AL-R-11).
- **Doku-Abgleich gegengeprüft:** Repository-URL im Link identisch mit
  `README.md`, `docker/README.md` und dem Git-Remote. Keine der genannten
  Anleitungen behauptet einen fehlenden GitHub-Zugang; die Einschätzung
  „keine Anpassung nötig" ist zutreffend.
- **SP-CX-02-Gegenprobe:** Ticketkopf, Akzeptanzkriterien, Verify-Matrix,
  STATUS-Kontext und -Zustandsblock beschreiben übereinstimmend Runde 1,
  abgeschlossene Umsetzung, offene Mike-Bestätigung.
- **Nicht erneut ausgeführt:** die interaktive Chrome-Sitzung (Tab/Enter,
  1440×900 und 375×812, StockInfo-Testserver) aus Runde 1 des Coders. Als
  plausibel bewertet, da `NButton` mit `tag="a"` + `href` nativ fokussierbar
  ist und der `UxStatusBar`-Rahmen selbst unverändert bleibt; kein eigener
  Nachweis dieses Teilschritts.

**Verdict: approved.** Keine Befunde. Scope bleibt UI-only wie vereinbart;
kein Anlass für eine neue Lesson (Einzelfall, kein belegtes Muster).

### Auflösung

Symbol-Nacharbeit und eigene Prüfungen abgeschlossen. Runde 1 bleibt als historisches Urteil zur Produktfassung
`75cac676c36f15d5041ce15c47e09a968d975670` erhalten. Keine Freigabe der neuen
Symbolfassung und keine menschliche Abschlussbestätigung vorhanden.
