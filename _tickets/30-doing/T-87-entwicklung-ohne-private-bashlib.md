# T-87 · Entwicklung ohne private BashLib, Maintainer-Targets kennzeichnen

StockPortfolio soll sich aus einem frischen Klon ohne `.libs/` entwickeln
lassen. MakeLib und ProjectTools sind öffentlich, **BashLib und BashTools
bleiben privat** (Mike, 2026-10-03). Heute scheitert `make setup` für alle
ohne BashLib.

**Beispiel:** Jemand klont das öffentliche Repo und ruft `make setup` auf.
`scripts/setup-libs.sh` bricht ohne BashLib ab, `pip install -r
requirements-dev.txt` scheitert an `-e ./.libs/ProjectTools`. Danach geht
weder `make test` noch `make dev-up`.

**Stand:** Angelegt am 2026-10-03 aus StockInfo (Mike: „ja, setz die drei
Punkte um + StockPortfolio hat das selbe Problem“). Liegt in `30-doing/`;
Rollen und Aktivierung legt `STATUS.md` fest. Noch nicht aktiviert. Bei der
Anlage lief T-86 auf `t-86-dev-down-gibt-ports-frei`; die Umsetzung gehört
auf einen eigenen Branch von `master` nach T-86.

## Vorlage

**StockInfos `Makefile` ist das Vorbild für die Struktur** (Mike,
2026-10-03: „So wie hier die Makefile-Struktur aufgebaut ist passt sie aus
meiner Sicht. In die Richtung sollte es auch bei StockPortfolio gehen“).
Gemeint ist der Stand `217fe5f`: Kopf mit `-include` und Fallbacks, Makro
`require_bash_libs`, Gruppen Setup · Entwicklung (`dev-up`, `dev-down`,
`dev-logs`) · Tests · Docker · Status · Versionierung, `[Maintainer]` in
`make help`, `precheck` ohne `##`, keine Einzel-Targets wie `dev`, `start`,
`stop` oder `logs`. Abweichungen nur, wo StockPortfolio fachlich anders ist
(etwa Node statt Python, `frontend`/`api` statt `dashboard`), und im Ticket
begründet.

- **Regel:** Skill `makefile-conventions`, Abschnitt „Entwicklung und
  Maintainer trennen“ (PersonalSkills `a7be0ce`).
- **Umsetzung in StockInfo** (`217fe5f`): `-include` für MakeLib mit
  Fallback-Farben, `setup` verlinkt `.libs/` nur mit BashLib,
  `requirements-maintainer.txt` für `-e ./.libs/ProjectTools`, Makro
  `require_bash_libs` vor Maintainer-Targets, `[Maintainer]` in `make help`,
  `precheck` ohne `##`, Tests für Maintainer-Werkzeuge per `skipif`.
- **ProjectTools** `dev-ports.sh` läuft seit `38dc0ea` ohne BashLib.

## Umfang (am Code geprüft, 2026-10-03)

| Stelle | Heute | Ziel |
|---|---|---|
| MakeLib-Einbindung | `-include` mit `DEV_MAKE ?= .libs/MakeLib` | bleibt; Fallback-Farben ergänzen, falls `help`/`hints` ohne MakeLib leer oder kaputt aussehen |
| `setup` | `scripts/setup-libs.sh --install` bricht ohne BashLib ab | nur mit BashLib verlinken, sonst Hinweis und weiter |
| `requirements-dev.txt` | `-e ./.libs/ProjectTools` | **Entscheidung nötig**, siehe unten |
| `precheck` | sichtbar in `make help` | ohne `##`, läuft als Abhängigkeit weiter |
| `status`, `build`, `push`, `version`, `tags`, `changelog`, `tag-*` | brechen ohne BashLib roh ab | `require_bash_libs` zuerst, `— Maintainer` in der Beschreibung; `build`/`push` nennen `docker build -f docker/Dockerfile …` |
| `dev-down` (T-86) | ruft `dev-ports.sh` | ohne ProjectTools warnen statt abbrechen |
| `README.md` | — | Absatz „Entwickeln ohne `.libs/`“ wie in StockInfo; Voraussetzungen prüfen |

**Entscheidung zu ProjectTools-Python:** Anders als in StockInfo nutzen hier
Entwicklungs-Skripte das Paket (`scripts/cli_theme.py`, etwa für den lokalen
Test-Stack), und `frontend/tests/dockerBuild.spec.ts` bezieht sich auf
`.libs/`. Zwei Wege:

1. wie StockInfo in `requirements-maintainer.txt` auslagern und die
   betroffenen Skripte ohne das Paket lauffähig machen, oder
2. ProjectTools ist öffentlich: das Paket für alle direkt aus dem
   öffentlichen Repo installieren (`git+https://…`), lokal weiter editierbar.

Der Coder klärt das im Scope-Checkpoint.

| Repo | Time-box | Scope | GH-Issue |
|---|---|---|---|
| StockPortfolio | 2 h | `Makefile`, `requirements-*.txt`, betroffene Skripte und Tests, `README.md` | — |

### Verify

Legende: ➖ noch keine Live-Verifikation.

| # | Handgriff | Erwarteter Nachweis | AI |
|---|---|---|:--:|
| 1 | Frischer Klon ins Temp-Verzeichnis, `env -i PATH=… HOME=$HOME make help` | Exit 0, `[Maintainer]` bei den Maintainer-Targets, kein `precheck` | ➖ |
| 2 | Dort `make setup`, dann `make test` | Exit 0 ohne `.libs/` | ➖ |
| 3 | Dort `make dev-up`, `make dev-down` | Stack startet und stoppt; Warnung statt Abbruch ohne ProjectTools | ➖ |
| 4 | Dort jedes Maintainer-Target | Abbruch mit „Nur für Maintainer …“, Exit ≠ 0 | ➖ |
| 5 | `docker build -f docker/Dockerfile .` ohne BashLib | Image baut | ➖ |
| 6 | Im Maintainer-Arbeitsstand alle Targets | Verhalten unverändert | ➖ |

### Akzeptanzkriterien

- [ ] Ein frischer Klon ohne `.libs/` kann `help`, `setup`, `test`, `dev-up` und `dev-down` ausführen.
- [ ] Maintainer-Targets brechen ohne BashLib mit klarer Meldung ab und sind in `make help` als `[Maintainer]` markiert.
- [ ] `precheck` erscheint nicht in der Hilfe und läuft weiterhin.
- [ ] Doku-Abgleich: `README.md`; `docker/README.md` und `unraid/README.md` geprüft.

### Side-Effects

Nur Entwicklungsumgebung und Doku. Kein Push, kein Docker-Hub- oder
Unraid-Update ohne eigenen Auftrag.

### Auflösung

Offen. Noch keine Umsetzung oder Verifikation.
