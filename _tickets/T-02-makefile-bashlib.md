# T-02 · Makefile + BashLib/MakeLib-Setup + `.env.example`

| Repo | Status | Time-box | Scope | GH-Issue |
|---|---|---|---|---|
| root | ready | ~45 min | Build-/Dev-Ergonomie | — |

**Löst:** Bringt das Projekt in Einklang mit den Konventionen (`makefile-conventions`,
`code-standards`): Makefile mit `help`/`info`/`hints`/`precheck` und Themeing über
`DEV_MAKE`, `.libs/`-Symlinks per Setup-Script.

---

## Verify

Legende: ✅ live bestätigt · ⚠️ bestätigt mit Einschränkung (Fußnote) ·
◑ teilweise (Fußnote) · ➖ keine Live-Verifikation (nur Unit/Review).

| # | Where | Look for | AI | Human |
|---|---|---|:--:|---|
| 1 | `Makefile` | Standard-Header (SHELL, .DEFAULT_GOAL, WORKSPACE, PROJECT_NAME, `include ${DEV_MAKE}/colours.mk`, tools.mk), `-include .env` + `export` | ➖ | |
| 2 | `make help` | Zeigt Groups (Setup / Entwicklung / Docker / Versionierung), Targets in THEME_-Farben | ➖ | |
| 3 | `make info` | PROJECT_NAME, WORKSPACE, DEV_MAKE, BASH_LIBS-Anzeige | ➖ | |
| 4 | `make hints` | Nützliche URLs (Vite Dev, StockInfo-API), Docker-Kommandos | ➖ | |
| 5 | `make precheck` | Exit 1 wenn `BASH_LIBS` fehlt, sonst grün | ➖ | |
| 6 | `make dev` | Startet Vite auf 5173 | ➖ | |
| 7 | `scripts/setup-libs.sh --help` | Zeigt Hilfe mit `-h/--help`, `-i/--install` | ➖ | |
| 8 | `scripts/setup-libs.sh --install` | Legt `.libs/BashLib` + `.libs/MakeLib` Symlinks an (Idempotent — 2. Lauf ändert nichts) | ➖ | |
| 9 | `make tag-patch` (Trockentest — nicht ausführen) | Aufruf würde `semVerBump patch auto "" "..."` triggern | ➖ | |

---

## Details

### Kontext / Ziel
Der User erwartet in jedem Projekt eine konsistente `make`-Oberfläche.
BashLib und MakeLib werden nicht mitkopiert, sondern als Symlink referenziert.

### Akzeptanzkriterien
- [ ] `Makefile` erstellt (siehe `makefile-conventions` — Standard-Header, Themeing, help/info/hints, precheck)
- [ ] `scripts/setup-libs.sh` — BashLib-Guard-Pattern, `usageLine`, `--install` legt Symlinks an
- [ ] `.libs/` ist in `.gitignore` (schon vorhanden aus T-01)
- [ ] Versionierungs-Targets `tag-major/-minor/-patch` (delegieren an `semVerBump`)
- [ ] Docker-Targets als Platzhalter (T-13 füllt sie mit `docker/build.sh`)
- [ ] Git-Commit

### Side-Effects
- Erstellt Symlinks unter `.libs/` (gitignored)

### Auflösung
_TBD nach Umsetzung_
