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
`t-86-dev-down-gibt-ports-frei` aktiviert.

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
   uncommittete Fassung nennt `make dev-up` und `overmind echo api`; sie
   übernehmen, gegen das Makefile und die README prüfen und committen.

### Verify

Legende: ➖ noch keine Live-Verifikation.

| # | Handgriff | Erwarteter Nachweis | AI |
|---|---|---|:--:|
| 1 | `make dev-up`, dann `dev-ports.sh --status` | Beide Ports belegt, Prozesse „im Projekt“ | ➖ |
| 2 | overmind-Prozess per `kill -9` beenden (Absturz nachstellen), dann `make dev-down` | Vite und API samt Kindprozessen beendet; tmux-Rest beendet; verwaiste `.overmind.sock` entfernt; 5175 und 8080 frei | ➖ |
| 3 | Danach `make dev-up` | Startet ohne „Overmind is already running“ | ➖ |
| 4 | `make dev-down` dreimal hintereinander ohne laufenden Stack | Jeweils beide Ports frei gemeldet, Exit 0 | ➖ |
| 5 | StockInfo-Stack läuft parallel | StockInfos overmind, tmux und Prozesse auf 5173/8000 bleiben unberührt | ➖ |

### Akzeptanzkriterien

- [ ] `.dev-ports.conf.sh` nennt die tatsächlichen Dev-Ports.
- [ ] `make dev-down` gibt beide Ports frei, auch nach einem Absturz von overmind, und räumt overmind-Reste dieses Projekts samt verwaister `.overmind.sock` auf.
- [ ] `make dev-down` verträgt Mehrfachaufrufe (Exit 0 ohne laufenden Stack).
- [ ] Prozesse außerhalb von StockPortfolio bleiben unberührt, auch overmind anderer Projekte.
- [ ] Der Setup-Code-Hinweis nennt in DE und EN den gültigen Startweg
      (`make dev-up`) und wie man den Code findet.
- [ ] Doku-Abgleich: `README.md`; `docker/README.md` und `unraid/README.md` sind nicht betroffen (Dev-Stack, kein Container).

### Side-Effects

Nur der lokale Dev-Stack. Kein Push, kein Docker-Hub- oder Unraid-Update.

### Auflösung

Offen. Noch keine Umsetzung oder Verifikation.
