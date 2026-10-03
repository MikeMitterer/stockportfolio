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
fest. Noch nicht aktiviert. Bei der Anlage lief T-85 in Nacharbeit auf
`t-85-ersatzabruf-nur-ohne-sse`; die Umsetzung gehört auf einen eigenen
Branch von `master` nach dem Merge von T-85. Mike, 2026-10-03: „übernimm
T-86 nach T-85, Korrigiere den Setup-Code-Hinweis“ — Umfang um den
Setup-Code-Hinweis erweitert (siehe unten).

## Vorlage aus StockInfo

StockInfo hat dasselbe am 2026-10-03 umgesetzt (`5d9f48c`):

- Werkzeug: `dev-ports.sh` in ProjectTools (`src/bash/dev-ports.sh`,
  `c33b8b3`). `--status` zeigt, ob und von wem die Ports belegt sind;
  `--kill` beendet eigene Prozesse mit Arbeitsverzeichnis im Projekt samt
  Kindprozessen (SIGTERM, dann SIGKILL) und endet mit Exit 1, wenn ein Port
  belegt bleibt. Fremde Lauscher, etwa Docker oder StockInfo, bleiben
  unberührt. Doku: ProjectTools `README.md`, Abschnitt „`dev-ports.sh`“.
- Config `.dev-ports.conf.sh` im Projekt-Root, eingecheckt.
- `dev-down` ruft nach den overmind-Schritten
  `"$(PROJECT_TOOLS)/bash/dev-ports.sh" --kill` auf.

## Umsetzung und technische Nachweise

| Repo | Time-box | Scope | GH-Issue |
|---|---|---|---|
| StockPortfolio | 30 min | `.dev-ports.conf.sh`, `Makefile` (`dev-down`), `README.md`, `auth.setupCodeHelp` in `de.ts`/`en.ts` | — |

1. `.dev-ports.conf.sh` mit `PORTS=(5175 8080)` (Vite aus
   `frontend/vite.config.ts`, Konto-API). `dev-ports.sh --example` erkennt
   diese Ports nicht, weil `Procfile.dev` kein `--port` nennt; die Ports von
   Hand eintragen und gegen die Konfiguration prüfen.
2. `dev-down`: Die bestehende overmind-Logik bleibt. Danach
   `"$(PROJECT_TOOLS)/bash/dev-ports.sh" --kill`, auch wenn kein
   Overmind-Stack aktiv ist — gerade dann bleiben Reste übrig.
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
| 2 | overmind-Prozess hart beenden (Absturz nachstellen), dann `make dev-down` | Vite und API samt Kindprozessen beendet; 5175 und 8080 frei | ➖ |
| 3 | `make dev-down` ohne laufenden Stack | Meldet beide Ports frei, Exit 0 | ➖ |
| 4 | StockInfo-Stack läuft parallel | StockInfos Prozesse auf 5173/8000 bleiben unberührt | ➖ |

### Akzeptanzkriterien

- [ ] `.dev-ports.conf.sh` nennt die tatsächlichen Dev-Ports.
- [ ] `make dev-down` gibt beide Ports frei, auch nach einem Absturz von overmind.
- [ ] Prozesse außerhalb von StockPortfolio bleiben unberührt.
- [ ] Der Setup-Code-Hinweis nennt in DE und EN den gültigen Startweg
      (`make dev-up`) und wie man den Code findet.
- [ ] Doku-Abgleich: `README.md`; `docker/README.md` und `unraid/README.md` sind nicht betroffen (Dev-Stack, kein Container).

### Side-Effects

Nur der lokale Dev-Stack. Kein Push, kein Docker-Hub- oder Unraid-Update.

### Auflösung

Offen. Noch keine Umsetzung oder Verifikation.
