# T-02 · Makefile + BashLib/MakeLib-Setup + `.env.example`

| Repo | Status | Time-box | Scope | GH-Issue |
|---|---|---|---|---|
| root | done | ~40 min | Build-/Dev-Ergonomie | — |

**Löst:** Bringt das Projekt in Einklang mit den Konventionen (`makefile-conventions`,
`code-standards`): Makefile mit `help`/`info`/`hints`/`precheck` und Themeing über
`DEV_MAKE`, `.libs/`-Symlinks per Setup-Script.

---

## Verify

Legende: ✅ live bestätigt · ⚠️ bestätigt mit Einschränkung (Fußnote) ·
◑ teilweise (Fußnote) · ➖ keine Live-Verifikation (nur Unit/Review).

| # | Where | Look for | AI | Human |
|---|---|---|:--:|---|
| 1 | `Makefile` | Standard-Header (SHELL, .DEFAULT_GOAL, WORKSPACE, PROJECT_NAME, `-include ${DEV_MAKE}/colours.mk`, `-include .env` + `export`, Fallback-Farben wenn DEV_MAKE fehlt) | ✅¹ | |
| 2 | `make help` | Zeigt Groups (Setup / Entwicklung / Docker / Versionierung), Targets in THEME_-Farben, `##R`-Marker orange, Legende am Ende | ✅¹ | |
| 3 | `make info` | PROJECT_NAME, WORKSPACE, DEV_MAKE, BASH_LIBS, VITE_STOCKINFO_API_URL-Anzeige | ✅¹ | |
| 4 | `make hints` | Nützliche URLs (Vite Dev, Preview, StockInfo-API-Docs) + 4-Schritt Setup-Anleitung | ✅¹ | |
| 5 | `make precheck` | Exit 1 mit Fehlermeldung + Tipp wenn `BASH_LIBS` / `DEV_MAKE` fehlt, sonst grün | ✅¹ | |
| 6 | `make dev` | Startet Vite auf 5173 | ➖² | |
| 7 | `scripts/setup-libs.sh --help` | Zeigt Hilfe mit `-h/--help`, `-i/--install`, `--info`, Voraussetzungen (BASH_LIBS/DEV_MAKE) | ✅¹ | |
| 8 | `scripts/setup-libs.sh --install` | Legt `.libs/BashLib` + `.libs/MakeLib` Symlinks an (idempotent — überschreibt bestehende) | ✅¹ | |
| 9 | `make tag-patch` (Trockentest — nicht ausführen) | Aufruf würde `semVerBump patch auto "" "..."` triggern | ➖³ | |

> ¹ **(CC):** Live verifiziert (2026-08-07) mit `BASH_LIBS=/Volumes/DevLocal/DevBash/Production/BashLib/src`, `DEV_MAKE=/Volumes/DevLocal/DevMake/Production/MakeLib`, `TERM=xterm-256color` — help zeigt Groups mit THEME_-Farben, `##R`-Marker (`docker-push`) in Orange, Legende am Ende. `precheck` fällt clean mit Fehlermeldung + Tipp aus wenn eine Env-Var fehlt.
> ² **(CC):** Nicht selbst gestartet (Dev-Server soll nicht im Hintergrund hängen). Wrapper ruft `npm run dev` auf; das ist in T-01 bereits verifiziert.
> ³ **(CC):** Ticket-Regel „nicht ausführen" befolgt — Target verweist nur auf `source $BASH_LIBS/version.lib.sh && semVerBump patch auto "" ${MSG:-}`, das würde einen echten Bump+Tag+Push machen.

---

## Details

### Kontext / Ziel
Der User erwartet in jedem Projekt eine konsistente `make`-Oberfläche.
BashLib und MakeLib werden nicht mitkopiert, sondern als Symlink referenziert.

### Akzeptanzkriterien
- [x] `Makefile` erstellt — Standard-Header, Themeing, help/info/hints/precheck
- [x] `scripts/setup-libs.sh` — BashLib-Guard-Pattern, `usageLine`, `--install`/`--info`/`--help`
- [x] `.libs/` ist in `.gitignore` (schon aus T-01)
- [x] Versionierungs-Targets `tag-major/-minor/-patch` (delegieren an `semVerBump`)
- [x] Docker-Targets als Platzhalter (T-13 füllt sie mit `docker/build.sh --build/--push/--images/--samples`)
- [ ] Git-Commit — folgt nach Close

### Side-Effects
- Erstellt Symlinks unter `.libs/BashLib` und `.libs/MakeLib` (gitignored)

### Auflösung
Commit folgt nach diesem Ticket-Close.

Ein kleiner Punkt zum Merken für spätere Tickets: die `##R`-Marker (schreibende
Server-Ops) erscheinen jetzt in Orange in `make help` und mit Legende am Ende.
`docker-push` ist der einzige aktuelle `##R`-Target — wenn später Deploy-Targets
für die App-Instanz dazukommen (SSH → Unraid o.ä.), folgen sie demselben Muster.
