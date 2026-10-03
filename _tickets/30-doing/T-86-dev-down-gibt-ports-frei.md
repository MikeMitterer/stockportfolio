# T-86 · `make dev-down` gibt die Ports des Dev-Stacks frei

`make dev-down` soll nach `overmind quit` auch Prozesse beenden, die nach
einem Absturz von overmind oder einer App übrig geblieben sind und die Ports
weiter belegen. Sonst scheitert der nächste `make dev-up` mit „address in
use“, und man muss die Prozesse von Hand suchen.

**Beispiel:** overmind stürzt ab, Vite lauscht weiter auf 5175. `make
dev-down` meldet heute „Kein Overmind-Stack aktiv.“ und lässt Vite laufen.
Nach dem Umbau beendet es Vite samt Kindprozessen und prüft, dass 5175 frei
ist.

**Stand:** Angelegt am 2026-10-03 aus StockInfo (Mike: „Bau das bei
StockPortfolio auch gleich ein“, danach „Erstelle dort ein passendes Ticket
im doing“). Liegt in `30-doing/`; Rollen und Aktivierung legt `STATUS.md`
fest. Bei der Anlage lief T-85 in Nacharbeit auf
`t-85-ersatzabruf-nur-ohne-sse`; die Umsetzung gehört auf einen eigenen
Branch von `master` nach dem Merge von T-85. Mike, 2026-10-03: „übernimm
T-86 nach T-85, Korrigiere den Setup-Code-Hinweis“ — Umfang um den
Setup-Code-Hinweis erweitert (siehe unten). Mike, 2026-10-03: „Das ganze
muss auch einen Mehrfachaufruf überleben. Ergänze die Anpassungen auch im
T86“ — Vorlage, Umfang und Verify auf den nachgeschärften StockInfo-Stand
gebracht. Am 2026-10-03 nach dem Abschluss von T-85 auf Branch
`t-86-dev-down-gibt-ports-frei` aktiviert, umgesetzt und in Runde 1 an den
Verifier übergeben. Codex hat Runde 1 technisch mit einem Befund an den Coder
zurückgegeben: Der gemeinsame Port-Helfer erkennt den Socket eines lebenden
Overmind-Stacks fälschlich als verwaist. Mikes bedingte Vorab-Abnahme greift
erst nach einer technischen Freigabe.

## Vorlage aus StockInfo

StockInfo hat dasselbe am 2026-10-03 umgesetzt (`5d9f48c`, nachgeschärft
in `0ce3c08`):

- Werkzeug: `dev-ports.sh` in ProjectTools (`src/bash/dev-ports.sh`,
  `c33b8b3`, overmind-Aufräumen seit `e2c2fb3`). `--status` zeigt, ob und von
  wem die Ports belegt sind und ob overmind-Reste laufen. `--kill`:
  1. beendet overmind und dessen tmux-Server **dieses** Projekts
     (Arbeitsverzeichnis im Projekt) und entfernt eine verwaiste
     `.overmind.sock`; overmind anderer Projekte bleibt unberührt,
  2. beendet eigene Port-Lauscher mit Arbeitsverzeichnis im Projekt samt
     Kindprozessen (SIGTERM, dann SIGKILL),
  3. endet mit Exit 1, wenn ein Port belegt bleibt.

  Fremde Lauscher, etwa Docker oder StockInfo, bleiben unberührt. Mehrfache
  und gleichzeitige Aufrufe gelingen (42 Tests in
  `tests/bash/dev-ports.test.sh`). Doku: ProjectTools `README.md`, Abschnitt
  „`dev-ports.sh`“.
- Config `.dev-ports.conf.sh` im Projekt-Root, eingecheckt.
- `dev-down` besteht nur noch aus zwei Schritten (unten); ein
  `pkill -f overmind` ist entfallen, weil es overmind in allen Projekten
  beendete.
- In StockInfo am 2026-10-03 mit echtem overmind geprüft: overmind per
  `kill -9` beendet, danach `make dev-down` → tmux-Rest und Apps beendet,
  verwaiste `.overmind.sock` entfernt, Ports frei, Neustart möglich; ein
  parallel laufender StockInfo-Stack blieb unberührt. Dreimal `make dev-down`
  ohne Stack: jeweils Exit 0.

```make
dev-down: ## Dev-Stack stoppen und Ports freigeben
	-@overmind quit 2>/dev/null || true
	@"$(PROJECT_TOOLS)/bash/dev-ports.sh" --kill
```

## Umsetzung und technische Nachweise

| Repo | Time-box | Scope | GH-Issue |
|---|---|---|---|
| StockPortfolio | 30 min | `.dev-ports.conf.sh`, `Makefile` (`dev-down`), `README.md`, `auth.setupCodeHelp` in `de.ts`/`en.ts` | — |

1. `.dev-ports.conf.sh` mit `PORTS=(5175 8080)` (Vite aus
   `frontend/vite.config.ts`, Konto-API). `dev-ports.sh --example` erkennt
   diese Ports nicht, weil `Procfile.dev` kein `--port` nennt; die Ports von
   Hand eintragen und gegen die Konfiguration prüfen.
2. `dev-down` wie in StockInfo auf die zwei Schritte oben umstellen. Die
   bisherige Weiche `if test -S .overmind.sock; then overmind quit; else
   echo "Kein Overmind-Stack aktiv."; fi` entfällt: Eine verwaiste Socket-Datei
   ließ dort `overmind quit` scheitern, und ohne Socket blieben Reste stehen.
   `dev-ports.sh --kill` läuft immer, auch ohne aktiven Stack — gerade dann
   bleiben Reste übrig.
3. `README.md`: Beschreibung von `make dev-down` ergänzen.
4. **Setup-Code-Hinweis** (`auth.setupCodeHelp` in
   `frontend/src/i18n/de.ts` und `en.ts`): Der committete Text nennt noch
   „make dev“, das Target gibt es seit `dcd274d` nicht mehr. Mikes
   uncommittete Fassung nannte `make dev-up` und `overmind echo api`; bei der
   Prüfung zeigte sich, dass `overmind echo` keine Argumente annimmt und den
   Code vom Start nicht zeigt. Umgesetzt mit `overmind connect api`.

### Verify

Legende: ✅ vom Coder live geprüft (Belege im Review-Verlauf, Runde 1).

| # | Handgriff | Erwarteter Nachweis | AI |
|---|---|---|:--:|
| 1 | `make dev-up`, dann `dev-ports.sh --status` | Beide Ports belegt, Prozesse „im Projekt“ | ✅ |
| 2 | overmind-Prozess per `kill -9` beenden (Absturz nachstellen), dann `make dev-down` | Vite und API samt Kindprozessen beendet; tmux-Rest beendet; verwaiste `.overmind.sock` entfernt; 5175 und 8080 frei | ✅ |
| 3 | Danach `make dev-up` | Startet ohne „Overmind is already running“ | ✅ |
| 4 | `make dev-down` dreimal hintereinander ohne laufenden Stack | Jeweils beide Ports frei gemeldet, Exit 0 | ✅ |
| 5 | StockInfo-Stack läuft parallel | StockInfos overmind, tmux und Prozesse auf 5173/8000 bleiben unberührt | ✅ mit fremdem overmind-Stack statt StockInfo (Einschränkung in Runde 1) |

### Akzeptanzkriterien

- [x] `.dev-ports.conf.sh` nennt die tatsächlichen Dev-Ports.
- [x] `make dev-down` gibt beide Ports frei, auch nach einem Absturz von overmind, und räumt overmind-Reste dieses Projekts samt verwaister `.overmind.sock` auf.
- [x] `make dev-down` verträgt Mehrfachaufrufe (Exit 0 ohne laufenden Stack).
- [x] Prozesse außerhalb von StockPortfolio bleiben unberührt, auch overmind anderer Projekte.
- [x] Der Setup-Code-Hinweis nennt in DE und EN den gültigen Startweg
      (`make dev-up`) und wie man den Code findet.
- [x] Doku-Abgleich: `README.md`; `docker/README.md` und `unraid/README.md` sind nicht betroffen (Dev-Stack, kein Container).

### Side-Effects

Nur der lokale Dev-Stack. Kein Push, kein Docker-Hub- oder Unraid-Update.

### Auflösung

Runde 1 mit blockierendem Befund zurückgegeben; Befund in ProjectTools
(`6046a16`) behoben, Nacharbeit Runde 2 übergeben. Technische Freigabe steht aus.
Mike hat den menschlichen Abschluss für den Fall der Codex-Freigabe vorab
zugesagt; diese Bedingung ist noch nicht erfüllt.

## Review-Verlauf (neueste Runde zuerst)

### Nacharbeit Runde 2 · claude-coder · 2026-10-03

**Befund 1 · lebender overmind-Socket als verwaist erkannt:** in ProjectTools
behoben, mit Mikes Freigabe („Ja, korrigieren und committen“) als lokaler
Commit **`6046a16`** auf ProjectTools-`master`, nicht gepusht. StockPortfolio
selbst ist gegenüber `d6c0ef1` unverändert; `.libs/ProjectTools` zeigt per
Symlink auf diesen Stand.

- **Ursache belegt:** overmind bindet relativ (`./.overmind.sock`). Ein so
  gebundener, lebender Socket ergibt mit `lsof -t <absoluter Pfad>` 0 Treffer;
  ein Verbindungsversuch nimmt er an, nach dem Ende kommt
  `ConnectionRefusedError`.
- **Korrektur** `isStaleOvermindSocket`: Verbindungsversuch (python3) relativ
  aus dem Projektverzeichnis, was auch die Längengrenze für Socket-Pfade
  umgeht. Nur `ConnectionRefusedError`/`FileNotFoundError` gilt als verwaist;
  ohne python3 oder bei anderen Fehlern bleibt die Datei liegen, damit kein
  laufender Stack seinen Socket verliert. ProjectTools-README ergänzt.
- **Regression** `testLebenderOvermindSocketBleibt` (relativ gebunden wie
  overmind): vor der Korrektur rot, 2 von 50 Tests („--status meldet ihn
  nicht als verwaist“, „--kill laesst ihn liegen“; das alte `--kill`
  entfernte den Socket des lebenden Besitzers). Danach 50 von 50 grün,
  einschließlich `testVerwaisteOvermindSocketWirdEntfernt`. `shellcheck`
  ohne Befund. (`nc -U -z` schied aus: meldet auf macOS auch einen lebenden
  Socket als nicht erreichbar.)

**Live-Prüfung gegen den korrigierten Helfer** (echter overmind,
`make dev-up STOCKPORTFOLIO_DATA_DIR=<Scratchpad>`, fremder overmind-Stack
parallel):

| Fall | Beobachtet |
|---|---|
| Befund: laufender Stack, `overmind status` „running“, dann `dev-ports.sh --status` | Meldung „verwaiste“ 0-mal; Socket bleibt |
| `kill -9` des Masters, dann `make dev-down` | „verwaiste .overmind.sock entfernt“, „overmind beendet“, 5175/8080 frei, Exit 0 |
| Neustart danach | ohne „already running“; `dev-down` Exit 0 |
| dreimal `make dev-down` ohne Stack | Exit 0, 0, 0 |
| fremder overmind-Stack | läuft nach allen Schritten weiter |
| Reste am Ende | keine tmux-Server `overmind-stockportfolio-*`, kein Socket, Ports frei |

**Pflichtprüfungen:** StockPortfolio-Code unverändert seit `d6c0ef1`; die
Läufe aus Runde 1 (`make test` Exit 0 mit 868/20, Lint und Typecheck je
Exit 0) gelten weiter. ProjectTools: `tests/bash/dev-ports.test.sh --run`
Exit 0, 50 Tests.

**Doku-Abgleich:** StockPortfolio-Doku unverändert; die Aussage „ein
lebender Socket bleibt liegen“ steht jetzt in der ProjectTools-README beim
Ablauf von `--kill`.

**Offene Übernahme:** ProjectTools-Commit `6046a16` ist nicht gepusht; ein
Push braucht Mikes Freigabe. StockInfo nutzt denselben Helfer und profitiert
ohne Änderung dort.

### Technische Prüfung Runde 1 · codex-verifier · 2026-10-03

**Prüffassung:** `d6c0ef1` auf `t-86-dev-down-gibt-ports-frei`. Rollen,
Owner, Branch und Paketversion `df699dd1d7583c59030030ad44e3ab896d4660be8d84575662e652f754624da1`
vor der Prüfung abgeglichen. **Urteil: `changes_requested`.**

**Blockierender Befund 1 · lebender Overmind-Socket wird als verwaist erkannt.**
Während `make dev-up` mit temporärem Datenverzeichnis lief, meldete
`overmind status` beide Prozesse als laufend. Der ProjectTools-Helfer
`dev-ports.sh --status` zeigte bei vollständiger Prozesssicht den Overmind-
Master, zwei tmux-Prozesse und beide belegten Ports, warnte aber zugleich
„verwaiste .overmind.sock — blockiert den naechsten Start“. `lsof -nP -t
.overmind.sock` lieferte dabei keinen Treffer. Die Funktion
`isStaleOvermindSocket` in `ProjectTools/src/bash/dev-ports.sh` wertet einen
fehlenden `lsof`-Treffer als verwaisten Socket. Sie wird sowohl von `--status`
als auch von `--kill` verwendet; letzteres entfernt die Datei dann. Bei
einem plausiblen Fehlschlag der Overmind-Prozesssuche kann `--kill` folglich
den Socket eines noch laufenden Stacks entfernen. Schon die Statusaussage ist
in der geprüften Fassung falsch.

**Erwartete Korrektur:** Die Socket-Erkennung im ProjectTools-Repository so
prüfen, dass ein erreichbarer Socket als lebend und ein tatsächlich
verwaister als verwaist gilt; beide Fälle als Regression testen. Danach
StockPortfolio gegen den korrigierten Helferstand mit echtem `make dev-up`,
`--status` und `make dev-down` erneut prüfen. Die bestehende Testdatei deckt
laut Inventar die Entfernung eines verwaisten Sockets ab, aber keinen
lebenden Socket. Keine ProjectTools-Datei wurde durch den Verifier geändert.

**Unabhängige Gegenproben:** Nach `kill -9` des eigenen Overmind-Masters
beendete `make dev-down` den tmux-Rest und die Lauscher auf 5175/8080,
entfernte den nun tatsächlich verwaisten Socket und endete mit Exit 0. Ein
sofortiger `make dev-up` gelang; `make dev-down` danach und drei weitere
Aufrufe ohne Stack endeten jeweils mit Exit 0 und freien Ports. Ein fremder
Python-Lauscher auf 5175 aus `/private/tmp` blieb nach `make dev-down`
erhalten; der Befehl meldete den belegten Port mit Exit 2 auf Make-Ebene
(Helfer Exit 1). Den eigenen Fremdprozess anschließend gestoppt; beide Ports
und der Socket waren frei. Für Prozess- und Portdiagnosen wurde die nötige
volle Prozesssicht verwendet; die eingeschränkte Sandbox-Sicht war erkennbar
unvollständig und zählt nicht als Befund. Temporäre Testdaten wurden entfernt.

**Weitere Prüfung:** `make test` Exit 0 (Frontend 84 Dateien/868 Tests, API
5/20); Frontend-/API-Lint und Typecheck je Exit 0; `bash -n
.dev-ports.conf.sh` und `git diff --check` ohne Befund. Der Doku-Abgleich
von `README.md` und `docker/README.md` ergab: Der lokale Dev-Stack ist nur
im Projekt-README beschrieben, die Container-Anleitung widerspricht nicht.
`AGENTS.md` und die DE-/EN-Setup-Code-Hinweise passen zum Startweg;
`overmind connect --help` bestätigt das Prozessargument. Der Code selbst
wurde nicht ausgegeben.

**Lessons-Einordnung:** [SP-R-04](../.agents/lessons/SP-R-04-erkannte-potenzielle-fehler-beheben-scout-rule.md)
auf die plausible Socket-Fehlentscheidung angewendet; der Fund blockiert die
Freigabe. [SP-R-05](../.agents/lessons/SP-R-05-nach-dem-stopp-alle-reste-der-gestarteten-prozesse-pruefen.md)
auf Port-, Socket-, PID- und Neustartkontrolle angewendet. Einzelfall in
ProjectTools: Für eine neue Lesson liegt hier nur dieser eine Befund vor;
keine neue Aufnahmebedingung erfüllt. Die Korrektur in ProjectTools ist eine
offene Übernahme beim `claude-coder`; das Projekt-Board und die gesonderten
Repository-Schreibgrenzen bleiben maßgeblich.

### Übergabe Runde 1 · claude-coder · 2026-10-03

**Umfang** (Produktcommit siehe STATUS `handoff_commit`):

- `.dev-ports.conf.sh` (neu, eingecheckt): `PORTS=(5175 8080)`. Geprüft
  gegen `frontend/vite.config.ts` (`port: 5175`, `strictPort: true`) und
  `api/src/index.ts` (`PORT ?? '8080'`); `Procfile.dev` nennt keinen Port.
- `Makefile` · `dev-down`: die zwei Schritte wie in StockInfo
  (`-@overmind quit 2>/dev/null || true`, dann
  `"$(PROJECT_TOOLS)/bash/dev-ports.sh" --kill`); die Socket-Weiche ist
  entfallen. Hilfetext „Dev-Stack stoppen und Ports 5175/8080 freigeben“.
  `dev-ports.sh` aus ProjectTools in Stand `e2c2fb3`.
- `README.md` (Entwicklung, Befehlstabelle) und `AGENTS.md` (Bauen und
  prüfen): `make dev-down` beschreibt Aufräumen nach Absturz, Schutz fremder
  Prozesse, Mehrfachaufruf mit Exit 0.
- **Setup-Code-Hinweis** (`auth.setupCodeHelp`, DE/EN) und README:
  **Mikes Fassung inhaltlich korrigiert.** Sie nannte `overmind echo api`.
  Geprüft mit overmind 2.5.1:
  - `overmind echo api` endet mit „overmind: Echo doesn't accept any
    arguments“.
  - `overmind echo` zeigt nur Ausgaben ab dem Aufruf; die Startzeile mit dem
    Code fehlt (Wegwerf-Procfile: Startzeile 0-mal, laufende Zeilen ja).
  - Im tmux-Fenster des Prozesses steht sie: echter `make dev-up` mit
    temporärem Datenverzeichnis, Fenster `stockportfolio:api` enthält
    „StockPortfolio setup code:“ 1-mal, `overmind echo` 3 s lang 0-mal. Der
    Code selbst wurde nicht ausgegeben.

  Neuer Wortlaut: „Nach make dev-up öffnest du mit overmind connect api das
  Fenster der Konto-API und findest ihn dort hinter „StockPortfolio setup
  code:“ (zurück mit Ctrl-B, dann D)“; EN entsprechend, ohne Apostroph
  wegen der einfachen Anführungszeichen im Quelltext. README (Setup-Code):
  `overmind connect api` statt `overmind echo api`, mit Hinweis, warum
  `overmind echo` den Code nicht zeigt.

**Live-Prüfung** (echter overmind 2.5.1, `make dev-up
STOCKPORTFOLIO_DATA_DIR=<Scratchpad>`, Mikes `.local-data` unberührt; ein
fremder overmind-Stack in einem anderen Verzeichnis lief die ganze Zeit
parallel):

| # | Handgriff | Beobachtet |
|---|---|---|
| 1 | `make dev-up`, `dev-ports.sh --status` | 5175 und 8080 belegt; overmind-Master und tmux „im Projekt (Root)“ |
| 2a | Gegenprobe **altes** `dev-down`: overmind-Master `kill -9`, dann `make dev-down` | „dial unix ./.overmind.sock: connect: connection refused“, Exit 2; beide Ports weiter belegt, Socket bleibt |
| 2b | **neues** `dev-down` nach `kill -9` | „verwaiste .overmind.sock entfernt“, „overmind beendet“, „5175 ist frei“, „8080 ist frei“, Exit 0; Socket weg, keine tmux-Reste `overmind-stockportfolio-*` |
| 3 | danach `make dev-up` | startet ohne „already running“, Ports belegt; `dev-down` Exit 0 |
| 4 | dreimal `make dev-down` ohne Stack | Exit 0, 0, 0; Ports frei |
| 5 | fremder overmind-Stack (anderes Verzeichnis) | nach allen Schritten weiter laufend, erst am Ende selbst beendet |

Einschränkung zu #5: Geprüft mit einem fremden overmind-Stack, nicht mit
StockInfos echtem Stack auf 5173/8000. Diese Ports stehen nicht in
`.dev-ports.conf.sh`; `dev-ports.sh` beendet nur Prozesse mit
Arbeitsverzeichnis im Projekt.

**Pflichtprüfungen** (nach letzter Änderung):

| Befehl | Ergebnis |
|---|---|
| `make test` | Exit 0; Frontend 84 / 868, API 5 / 20 |
| `npm --prefix frontend run lint`, `npm --prefix api run lint` | je Exit 0 |
| `npm --prefix frontend run typecheck`, `npm --prefix api run typecheck` | je Exit 0 |
| `bash -n .dev-ports.conf.sh`, `git diff --check` | ohne Befund |
| `make help` | listet `dev-up` und `dev-down` mit neuem Text |

**Doku-Abgleich:**

| Datei · Abschnitt | Ergebnis |
|---|---|
| `README.md` · Entwicklung (`make dev-up`/`dev-down`) | `dev-down` mit Aufräumen, Schutz fremder Prozesse, Mehrfachaufruf, `.dev-ports.conf.sh` |
| `README.md` · Setup-Code | `overmind connect api` statt `overmind echo api` |
| `README.md` · Befehlstabelle | `make dev-down` „Stop the dev stack and free ports 5175/8080“ |
| `AGENTS.md` · Bauen und prüfen | Kommentar zu `make dev-down` |
| `docker/README.md`, `unraid/README.md` | Dev-Stack, kein Container; unverändert |

**Lessons:** SI-P-02/12 (Zusage „overmind echo api“ am Werkzeug geprüft statt
übernommen); SP-R-04 (falscher Befehl in committeter README und im
App-Hinweis gleich mit korrigiert); SP-R-05 (nach jedem Lauf Ports,
Socket und tmux-Reste geprüft). Der Hinweis zur Fensterposition im
Smoketest betrifft T-86 nicht.
