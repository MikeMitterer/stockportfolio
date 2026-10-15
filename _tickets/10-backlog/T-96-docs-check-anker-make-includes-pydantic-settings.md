# T-96 · docs-check: Anker mit Unterstrich, Make-Includes über Variablen, pydantic-Settings

**Warum dieses Ticket:** Beim Einrichten von `docs-check` in StockInfo
(StockInfo T-102, 2026-10-15) sind drei Grenzen von
`ProjectTools/src/deno/docs-check.ts` aufgefallen. StockInfo arbeitet mit dem
veröffentlichten Stand und umgeht sie; die Korrektur gehört nach ProjectTools.
StockPortfolio ist das Board, über das ProjectTools-Arbeit läuft.

**Beispiel:** In StockInfo verlinkt `docs/rest-core-contract.md` die eigene
Überschrift „Identität: `listing_id` für Maschinen, `symbol` für Menschen“
mit `#identität-listing_id-für-maschinen-symbol-für-menschen`. Auf GitHub
funktioniert der Link; `docs-check` meldet ihn als toten Anker, weil es beim
Ankerbilden `_` entfernt.

**Stand:** Auf Mikes Auftrag aus StockInfo T-102 („Fehlt dem Werkzeug etwas
oder stimmt etwas nicht, entsteht dafür ein eigenes Ticket in StockPortfolio
oder ProjectTools“) in `10-backlog/` angelegt. Nicht aktiviert, keine
Umsetzung.

## Befunde

| # | Befund | Fundstelle | Folge | Erwartung |
|---|---|---|---|---|
| 1 | `slugify` entfernt `_`; GitHub behält ihn | `slugify()` (`.replace(/[`*_~[\]()]/g, "")`) | gültige Anker gelten als tot; StockInfo braucht ein `<a id>` als Umweg | Ankerbildung wie GitHub (`_` bleibt) |
| 2 | Ein Makefile mit `-include ${VAR}/datei.mk` macht jedes unbekannte Target nur zum Hinweis | `readMakefile()` setzt `unresolved`, `checkCommand()` stuft herab | `make test` scheitert nicht an einem veralteten Make-Target in der Doku. Betrifft StockInfo **und** StockPortfolio (beide binden MakeLib über `${DEV_MAKE}` ein) | Variablen mit `?=`-Vorgabe im selben Makefile auflösen, oder eingebundene Dateien ohne Targets nicht als Unsicherheit werten |
| 3 | Felder einer pydantic-`BaseSettings`-Klasse erkennt `CODE_VARIABLES` nicht | `ENV_READS` kennt nur ausdrückliche Lesezugriffe | In StockInfo findet die Prüfung nur `VITE_API_BASE_URL`; keines der 16 Felder der Settings-Klasse in `app/config.py` ist abgedeckt | Felder von Klassen, die von `BaseSettings` erben, als gelesene Variablen werten (Name in Großbuchstaben, `env_prefix` beachten) |

Gegenprobe zu Befund 2, in beiden Projekten gleich: `make no-such-target` in
`README.md` ergibt „Hinweis … Das Makefile bindet aber Dateien über Variablen
ein“, Exit-Code 0.

**Nebenbefund in StockPortfolio selbst (nicht ProjectTools):**
`.githooks/pre-commit` prüft den Arbeitsbaum. Ist ein Fehler vorgemerkt und
nur im Arbeitsbaum korrigiert, lässt der Hook den fehlerhaften Commit durch
(StockInfo T-102, Befund B2 von Codex). StockInfos Hook prüft seit
`e57c7f4` eine Kopie des Index (`git checkout-index` in ein temporäres
Verzeichnis, `GIT_DIR`/`GIT_WORK_TREE` gesetzt). Übernahme hier nach
eigener Einplanung.

**Entscheidung Mike, 2026-10-15** (StockInfo T-102, B1): Bis zur Korrektur
von Befund 2 genügt in StockInfo der Hinweis; die Korrektur kommt über
dieses Ticket.

## Akzeptanzkriterien

- [ ] Je Befund ein Test in `tests/deno/docs-check.test.ts`, der am alten
      Stand rot ist.
- [ ] StockInfo kann das `<a id>` in `docs/rest-core-contract.md` entfernen,
      und `make docs-check` bleibt grün.
- [ ] `make no-such-target` in einem README ist in StockInfo und
      StockPortfolio ein Problem mit Exit-Code ≠ 0.
- [ ] In StockInfo prüft `CODE_VARIABLES` die Settings-Felder; die Grenze in
      StockInfos `.docs-check.conf.sh` und `AGENTS.md` entfällt.

## Abgrenzung

Die Anpassungen in StockInfo (Umweg entfernen, Grenze aus der Doku nehmen)
folgen dort mit eigenem Ticket, nachdem ProjectTools geändert ist.
