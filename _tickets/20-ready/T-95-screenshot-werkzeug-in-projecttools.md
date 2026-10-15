# T-95 · Screenshot-Werkzeug als Deno-Skript in ProjectTools

**Warum dieses Ticket:** Die Bilder für README, Docker Hub und Unraid entstehen
in StockPortfolio mit `frontend/scripts/capture-screenshots.mjs`. Das Skript
ist fest auf diese App verdrahtet: Adresse, Anmeldung, Theme-Schlüssel,
Seiten, Klickfolgen und Dateinamen stehen im Code. StockInfo braucht dieselbe
Art Bilder (`unraid/screenshots/*.png`) und hat keinen gemeinsamen Weg dafür.
Jedes Projekt baut sich so sein eigenes Aufnahmeskript, und die Regeln
(sichtbarer Browser, Fensterposition, Bildgröße, kein Hover) laufen
auseinander.

Das Skript soll deshalb nach **Deno/TypeScript** portiert und in
**ProjectTools** als universelles Werkzeug bereitgestellt werden. Was
aufgenommen wird, beschreibt eine **Projekt-Config**; der Werkzeugcode kennt
keine App. Die Projektdoku sagt danach ausdrücklich: Für Bilder in den
Anleitungen wird dieses Werkzeug verwendet, kein eigenes Skript.

**Beispiel:** Heute:
`npm --prefix frontend run screenshots -- <data_dir>/demo-accounts.json`
startet ein Node-Skript, in dem `VGWL.DE`, `.reb__delta` und
`stockportfolio.theme` stehen. Danach: Ein ProjectTools-Aufruf liest
StockPortfolios Config (Adresse, Viewport, Sprache, Theme, Anmeldung,
Aufnahmeschritte, Zielordner) und erzeugt dieselben sechs Bilder. Mit einer
anderen Config entstehen StockInfos Dashboard- und Detailbilder, ohne eine
Zeile Werkzeugcode zu ändern.

**Stand:** Auf Mikes Auftrag vom 2026-10-13 in `20-ready/` angelegt. Noch
nicht aktiviert, kein Branch, keine Umsetzung. Der zuständige Coder aktiviert
es nach `30-doing/` mit eigenem Branch und STATUS-Zuordnung.

Für Mike steht derzeit keine Entscheidung an. Die Übernahme in StockInfo ist
ausdrücklich **nicht** Teil dieses Tickets (siehe [Abgrenzung](#abgrenzung)).

## Umsetzung und technische Nachweise

| Repo | Time-box | Scope | GH-Issue |
|---|---|---|---|
| cross: ProjectTools, StockPortfolio | mittel | Deno-Werkzeug, Config-Format, StockPortfolio-Config, Doku | — |

### Werkzeug in ProjectTools

- **Ort:** `src/deno/` in ProjectTools, nach dem Muster von `docs-check.ts`:
  Kopfkommentar mit Zweck, Aufruf und Optionen; `deno lint`, `deno fmt` und
  Tests unter `tests/deno/`. Ein Bash-Einstieg unter `src/bash/` ist
  zulässig, wenn er dem bestehenden `docs-check.sh`-Muster folgt (Config
  suchen, `--config`-Override, `--help` ohne Argument).
- **Playwright** über einen `npm:`-Import (`playwright-core`) mit dem
  installierten Google Chrome; `CHROME_PATH` beziehungsweise ein Config-Wert
  überschreibt den Pfad. Keine gebündelte Browserinstallation.
- **Deno-Rechte so eng wie möglich**, ausdrücklich gesetzt und im
  Kopfkommentar begründet (Lesen der Config, Schreiben nur in den Zielordner
  und die Zugangsdatei, Netz nur zur konfigurierten Adresse, Start nur von
  Chrome). Was Playwright zwingend zusätzlich braucht, wird benannt statt
  pauschal `-A`.
- **Kein App-Wissen im Code:** keine Selektoren, Routen, Speicherschlüssel,
  Symbole, Dateinamen oder Rechnerpfade. Alles davon kommt aus der Config.

### Config-Format

Die Config liegt im Verbraucher-Root und ist versioniert. Das Format
(TypeScript-Modul, JSON oder YAML) wählt der Coder und begründet es im
Ticket; Aufnahmeschritte brauchen Struktur, ein gesourcetes Bash-Array
genügt dafür nicht. Mindestens abzudecken:

| Bereich | Inhalt |
|---|---|
| Ziel | Basisadresse, Zielordner relativ zum Projekt-Root |
| Browser | Viewport, `locale`, `colorScheme`, Fensterposition (Vorgabe: links 100 px frei, Hauptmonitor, sichtbar) |
| Vorbelegung | `localStorage`-Einträge vor dem ersten Laden (bei StockPortfolio Sprache und Theme) |
| Anmeldung | optional; Zugangsdatei als Argument, Feldselektoren, optionaler erzwungener Passwortwechsel samt Rückschreiben in die Zugangsdatei |
| Aufnahmen | geordnete Liste je Bild: Dateiname, Schritte (`goto`, `click`, `fill`, `waitFor`, Ruhe abwarten), Ganzseite oder Elementausschnitt |

Die Ruhephase vor jeder Aufnahme (Maus aus dem Bild, `networkidle`, kurze
Wartezeit) ist Werkzeugverhalten mit einstellbaren Zeiten, kein
Config-Pflichtschritt.

Eine Config-Datei wird beim Laden geprüft. Unbekannte Schritte, fehlende
Pflichtfelder oder ein Element, das nicht erscheint, enden mit Exit ≠ 0 und
einer Meldung, die Bild und Schritt nennt. Ein halber Bildersatz ohne Fehler
darf nicht entstehen.

### StockPortfolio

- StockPortfolios Config bildet die heutigen sechs Aufnahmen ab
  (`login.png`, `dashboard.png`, `drilldown.png`, `rebalancing.png`,
  `settings-calculation.png`, `user-admin.png`), Englisch, Theme MangoLila,
  1440 × 1000, Zielordner `docs/images/`.
- `frontend/scripts/capture-screenshots.mjs` entfällt. Das npm-Skript
  `screenshots` entfällt oder ruft das neue Werkzeug auf; der Coder wählt
  einen dokumentierten Einstieg (npm-Skript oder Make-Target nach
  `makefile-conventions`) und begründet ihn.
- Die Fensterposition folgt AGENTS.md (100 px links), nicht dem alten
  Wert 80 im Skript.
- Bezeichner englisch, Kommentare deutsch (AGENTS.md).

### Doku: auf das Werkzeug hinweisen

- **ProjectTools `README.md`:** Abschnitt zum Werkzeug mit Zweck, Aufruf,
  vollständigem Config-Format, einem kleinen Beispiel und Grenzen (Chrome
  nötig, sichtbarer Browser, kein Test-Framework). Zwei Beispiel-Configs
  zeigen die Universalität: StockPortfolio (mit Anmeldung) und eine
  StockInfo-artige App ohne Anmeldung.
- **StockPortfolio `AGENTS.md`**, Abschnitt „Browserprüfung“: Der Eintrag zu
  `capture-screenshots.mjs` wird ersetzt durch die Regel, dass Bilder für
  Anleitungen ausschließlich mit dem ProjectTools-Werkzeug und der
  Projekt-Config entstehen; neue Bilder kommen als Aufnahme in die Config,
  nicht als eigenes Skript.
- **`docs/development.md`**, Abschnitt Browserprüfung: Tabelleneintrag
  `screenshots` und Beschreibung auf Aufruf und Config umstellen.
- **`README.md` und `docker/README.md`:** Inventar prüfen. Beide nennen das
  Aufnahmeskript derzeit nicht; Entwicklerdetails gehören nach
  `docs/development.md` (Mike, 2026-10-11). Ergebnis im Doku-Abgleich nennen.
- **Skills:** Prüfen, ob `docs-conventions` oder `docker-conventions`
  einen Hinweis auf das Werkzeug brauchen (Bilder für README und Docker Hub).
  Änderung nur mit Mikes Auftrag; sonst Vorschlag im Ticket.

### Abgrenzung

- **StockInfo wird hier nicht geändert** (AGENTS.md: kein Code in StockInfo
  ohne ausdrücklichen Auftrag). Die Übernahme dort — eigene Config,
  Ersatz für vorhandene Aufnahmewege, Doku-Hinweis in StockInfos
  `AGENTS.md` und README — ist ein eigenes Ticket im StockInfo-Board, das
  der Coder nach der Umsetzung als Vorschlag formuliert. Universell heißt
  hier: Das Werkzeug kann es nachweislich, belegt durch die
  StockInfo-artige Beispiel-Config und Tests.
- Keine Prüfskripte (`check:*`, `smoke:*`) umziehen. Sie prüfen Inhalte und
  bleiben unter `frontend/scripts/`.
- ProjectTools erhält eigene Commits; die Repositories werden nicht in einem
  Commit vermischt.

### Verify

Legende: ✅ live bestätigt · ⚠️ mit Einschränkung · ◑ teilweise ·
➖ noch ohne Ausführung.

| # | Lauf | Handgriff | Erwarteter Nachweis | woher | AI |
|---|:--:|---|---|---|:--:|
| 1 | Teststack | <a id="pruefpunkt-1"></a>Stack mit `--demo-accounts` starten, Werkzeug mit StockPortfolios Config sichtbar ausführen | Dieselben sechs Bilder in `docs/images/`; Inhalt (Sprache, Theme, Depot, Ausschnitt) gleichwertig zur alten Fassung | Mike | ➖ |
| 2 | Unit | <a id="pruefpunkt-2"></a>Config-Prüfung und Schrittausführung unter `tests/deno/` testen | Gültige Configs laden; unbekannter Schritt, fehlendes Pflichtfeld und fehlender Zielordner enden mit Exit ≠ 0 und benannter Stelle | Ticket | ➖ |
| 3 | Gegenprobe | <a id="pruefpunkt-3"></a>Einen Selektor in einer Testkopie der Config absichtlich falsch setzen | Lauf endet mit Exit ≠ 0, Meldung nennt Bild und Schritt; kein stiller Teilerfolg | Board-Workflow | ➖ |
| 4 | Universalität | <a id="pruefpunkt-4"></a>Werkzeugcode nach App-Wissen durchsuchen (Inventar der String-Literale über die TS-Compiler-API); Beispiel-Config ohne Anmeldung gegen eine lokale Testseite laufen lassen | Keine Selektoren, Routen, Speicherschlüssel oder Pfade im Werkzeug; Beispiel ohne Anmeldung erzeugt ihr Bild | Mike | ➖ |
| 5 | Rechte | <a id="pruefpunkt-5"></a>Lauf mit den dokumentierten Deno-Rechten; Schreibversuch außerhalb des Zielordners | Lauf grün; Zugriff außerhalb wird von Deno verweigert | Hausregel Deno-Skripte | ➖ |
| 6 | Doku | <a id="pruefpunkt-6"></a>`make docs-check`, Inventar von AGENTS.md, `docs/development.md`, beiden READMEs und ProjectTools-README | Kein Verweis mehr auf `capture-screenshots.mjs`; Hinweis auf das Werkzeug und die Pflicht zur Nutzung vorhanden | Mike | ➖ |
| 7 | Pflicht | <a id="pruefpunkt-7"></a>`make test`, Lint und Typecheck beider Pakete; in ProjectTools `deno lint`, `deno fmt --check`, `deno test` | Je Repo dokumentierter Exit-Code 0 | Projektregeln | ➖ |

### Akzeptanzkriterien

- [ ] ProjectTools enthält ein Deno-Werkzeug, das Bilder ausschließlich nach
      einer Projekt-Config aufnimmt, ohne App-Wissen im Code.
- [ ] Das Config-Format ist im ProjectTools-README vollständig beschrieben,
      mit Beispielen für eine App mit und eine ohne Anmeldung.
- [ ] StockPortfolio erzeugt seine sechs Anleitungsbilder über das Werkzeug;
      `capture-screenshots.mjs` ist entfernt.
- [ ] Fehler in Config oder Ablauf enden geschlossen mit Exit ≠ 0 und
      benannter Stelle; absichtlich rot gelaufen und belegt.
- [ ] AGENTS.md und `docs/development.md` verweisen auf das Werkzeug und
      schreiben seine Nutzung für Anleitungsbilder vor.
- [ ] Ein Ticketvorschlag für StockInfos Board liegt als Text im Ticket.

### Side-Effects

Wer `make setup` nutzt, braucht zusätzlich Deno, falls es noch nicht für
`docs-check` vorhanden ist. Der erste Lauf lädt `playwright-core` aus npm in
den Deno-Cache. Bilder unter `docs/images/` werden bei Prüfpunkt 1 neu
geschrieben; nur committen, wenn sie inhaltlich gleichwertig oder bewusst
aktualisiert sind.

**Doku-Abgleich:** bei Umsetzung wie unter [Doku](#doku-auf-das-werkzeug-hinweisen)
beschrieben. Board-Konventionen bleiben unverändert; im Skill
`task-verification-workflow` ist keine Übernahme nötig.

## Review-Verlauf (neueste Runde zuerst)

Noch keine Implementierungsübergabe.
