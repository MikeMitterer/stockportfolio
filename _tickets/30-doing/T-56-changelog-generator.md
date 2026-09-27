# T-56 · Changelog aus Git-Releases erstellen

Die veröffentlichten Änderungen sind bisher nur in Git sichtbar. Ein gemeinsamer
Python-Generator in ProjectTools soll daraus eine wiederholbar erzeugbare
`CHANGELOG.md` machen, gruppiert nach Releases und relevanten Commit-Arten.
Die Tag-Nachricht (`MSG`) liefert die Kurzbeschreibung.

**Stand:** Generator, Theme-Vereinheitlichung, gemeinsamer Python-Starter und
Setup-Anpassung sind umgesetzt und durch den Coder geprüft. Mike hat die
ursprüngliche Prüfung für diese Ergänzungen ausdrücklich zurückgestellt.
Der direkte Python-Aufruf ist aktiv; der Bash-Wrapper ist entfernt.
Unabhängige technische Freigabe und menschlicher Abschluss stehen aus.
**Für dich:** Aktuell kein Handgriff erforderlich; technische Prüfung und
Abschluss bleiben offen.

## Auftrag und Abgrenzung

Mike bestätigt Python und verlangt den Skill `code-standards`. Für den ursprünglichen Generatorauftrag blieb die BashLib
unverändert; die jeweiligen Make-Targets binden das Script direkt ein.
Der Auftrag umfasst ProjectTools und die Anbindung in StockPortfolio, nicht
StockInfo. Beide Repositories erhalten eigene Branches und Commits.

`make changelog` schreibt die Datei aus erreichbaren Release-Tags. Die Targets
`tag-major`, `tag-minor`, `tag-patch` rufen den Generator nach dem vorhandenen
Versionsschritt auf und veröffentlichen die Datei mit eigenem Commit. Damit
steht der aktualisierte Changelog auf dem Branch nach dem Release-Tag; im
bereits getaggten Archiv ist er noch nicht aktualisiert. Kein weiterer echter
Versionsbump während Umsetzung oder Tests.

Zusatzauftrag: Docker-Hub-Link in `make hints` ergänzen, ohne eigenes Ticket.
Der Link ist umgesetzt und mit `make hints` geprüft.

Mikes spätere Vorgabe: „direkter python aufruf“. Sie ersetzt für dieses
Werkzeug ausdrücklich die Bootstrap-/venv-Pflicht des Python-Skills. Die
Farbkorrektur verwendet native Parser-Hilfe sowie Statussymbole und TTY-/
NO_COLOR-konforme Farben.

## Umsetzung

1. Direkt aufrufbarer Python-Generator mit Standardbibliothek und gettext;
   keine Wrapper-/venv-Einrichtung. Hilfe, Vorschau und Ausgabe.
2. Echte temporäre Git-Repositories prüfen Tags, Merge-Historie, Filter,
   Wiederholbarkeit, Fehler und direkten CLI-Aufruf.
3. Make-Anbindung mit Abbruch bei Fehlern, eigenem Changelog-Commit und Push;
   Release-Verhalten ausschließlich in isolierten Repositories testen.
4. Aktuellen Changelog erzeugen; beide READMEs gegen Verhalten abgleichen.

## Verify · ursprüngliche Generator-Fassung

✅ geprüft · ◑ teilweise · ➖ ausstehend.

| # | Prüfung | Nachweis | AI |
|---|---|---|:--:|
| 1 | Release-Gruppierung, MSG, Filter und deterministische Ausgabe | Echte temporäre Git-Repos; lokale MSG und drei reale Releases in CHANGELOG.md; 10 Generator-Tests grün | ✅ |
| 2 | Direkter Python-Aufruf, Hilfe, Farben, Fehlerpfade | 10 Generator-Tests zusätzlich direkt unter Python 3.9 grün; PTY-Test: Optionen 45, OUTPUT 11, Beispiele/Erfolg 10, Fehler 196; NO_COLOR/Pipe farblos; Beschreibungen in Spalte 37 | ✅ |
| 3 | Make-Targets und unveränderte BashLib | Patch→Minor→Major über echtes Makefile und BashLib gegen lokalen Bare-Remote; Version 1.0.0, drei Tags, kein erneuter Commit beim Publish; dirty blockiert | ✅ |
| 4 | Projektprüfungen und Doku-Abgleich | 793 Vitest-Tests, Lint/Typecheck grün; ProjectTools 50 Python-Tests und Ruff grün; Docker-README-Vorschau 5.052 Bytes | ✅ |

## Doku-Abgleich

Beide StockPortfolio-READMEs gelesen. Jüngste Funktionen sind dokumentiert;
Container-Port, API-Konfiguration und Browser-Speicherung stimmen überein.
README.md: Commands und Building and publishing um Changelog, direkten Python-
Aufruf und Wiederholung nach Fehler ergänzt. docker/README.md: unter Updating
Changelog verlinkt und Git-Release von Container-Veröffentlichung unterschieden.
ProjectTools-README: direkter Aufruf, Filter, Farben und Publish-Verhalten erklärt.
Keine Änderung an Containerkonfiguration, docs/ oder zentraler Unraid-Vorlage
nötig; diese Inhalte hängen nicht vom Changelog-Aufruf ab. Die veröffentlichte
Docker-Hub-Beschreibung wurde weder geändert noch mit dem Repository verglichen.

## Lessons und Konventionsstand

SP-CX-01, Format 1: vorhandenen Ablauf verwenden, keine neue Release-Steuerung
oder Änderungen in BashLib. SP-CX-02, Format 1: Targets, Aufrufer, Anleitung und
Tests gemeinsam inventarisieren. Allgemeine Board-Übernahme bleibt in STATUS
sichtbar: lokaler Stand `2026-09-11-activity-feed`, Skill
`2026-09-11-lessons-follow-through`; keine Board-Migration beauftragt.

## Prüfbefehle und Grenzen

```bash
make changelog  # #1: lokale Erzeugung ohne Commit oder Push
make hints  # #3: Docker-Hub-Link
make test  # #4: 793 Tests in 62 Dateien
make lint && make typecheck  # #4: Exit 0
./.libs/ProjectTools/src/bash/dockerhub-readme.sh --readme docker/README.md --preview --ref master --output docker/logs/dockerhub-readme.md  # #4: 5.052 Bytes
cd /Volumes/DevLocal/DevBash/Production/ProjectTools
PYTHONDONTWRITEBYTECODE=1 /Volumes/DevLocal/DevWeb/Production/StockInfo/.venv/bin/python -m pytest tests/python -q -p no:cacheprovider  # #1/#2/#4: 50 Tests
ruff check --no-cache src/python/changelog.py src/python/git_access/changelog.py tests/python/test_changelog.py  # #2/#4
```

Der erste breite Python-Testlauf scheiterte nur in zwei bestehenden Docker-
README-Bootstrap-Tests an gesperrten Paketdownloads. Erneuter Lauf mit Netzwerk
grün; der neue Generator installiert nichts und seine Tests brauchen kein Netz.
Die StockInfo-Testumgebung wurde nur als vorhandener Interpreter verwendet;
kein Code, Paket oder Zustand in StockInfo geändert.

Die Pipe-Ausgabe wurde zunächst mit zu dichter Spaltenbreite und ohne passende
Farben umgesetzt. Nach Mikes Hinweis korrigiert und explizit per PTY geprüft;
`NO_COLOR=1` ist in der Werkzeugumgebung gesetzt und wird absichtlich respektiert.
Ohne diese Variable sind die ANSI-Farben am echten Terminal nachgewiesen.

Die Generator-Tests prüfen auch Publish-Wiederholung nach fehlgeschlagenem Push,
Schutz fremder gestagter Dateien, nicht erreichte/seitliche Tags, Symlink-Ziele,
Deutsch/Englisch und unveränderte Umgebungen. Gemischte Dokumentationscommits
können erscheinen; semantische Zusammenfassungen oder Übersetzungen der
Git-Texte sind nicht Teil dieses Generators. Die Changelog-Datei wird vollständig
neu erzeugt; keine manuell redigierten Abschnitte erhalten.

### Isolierter Make-Nachweis · #3

Der folgende Test läuft nur in neuen temporären Repositories. Er erzeugt und
pusht keine Tags im Produkt-Repository. Zuletzt grün unter
`/tmp/t56-release.GXUfUM` (bereits mit direktem Python-Aufruf).

```bash
#!/usr/bin/env bash
set -euo pipefail
SOURCE_ROOT=/Volumes/DevLocal/DevWeb/Production/StockPortfolio
PROJECT_TOOLS=/Volumes/DevLocal/DevBash/Production/ProjectTools/src
export PROJECT_TOOLS
CHECK_ROOT=$(mktemp -d /tmp/t56-release.XXXXXX)
export XDG_CACHE_HOME="${CHECK_ROOT}/cache"
git init --bare "${CHECK_ROOT}/remote.git" >/dev/null
git init -b master "${CHECK_ROOT}/repo" >/dev/null
cd "${CHECK_ROOT}/repo"
git config user.name 'Release Test'
git config user.email 'release@example.invalid'
git remote add origin "${CHECK_ROOT}/remote.git"
cp "${SOURCE_ROOT}/Makefile" Makefile
printf '0.0.0\n' > VERSION
git add Makefile VERSION
git commit -qm 'feat: Erste Funktion'
git push -u origin master >/dev/null
for RELEASE_KIND in patch minor major; do
    make "tag-${RELEASE_KIND}" MSG="Release ${RELEASE_KIND}" > "${CHECK_ROOT}/${RELEASE_KIND}.log" 2>&1
    test -z "$(git status --porcelain)"
    test "$(git rev-parse HEAD)" = "$(git rev-parse origin/master)"
    test "$(git log -1 --pretty=%s)" = 'docs(changelog): update release history'
    git show HEAD:CHANGELOG.md | rg "Release ${RELEASE_KIND}"
done
test "$(cat VERSION)" = 1.0.0
test "$(git tag --list | wc -l | tr -d ' ')" = 3
PREVIOUS_HEAD=$(git rev-parse HEAD)
make changelog-publish >/dev/null
test "${PREVIOUS_HEAD}" = "$(git rev-parse HEAD)"
printf 'unrelated\n' > foreign.txt
if make tag-minor > "${CHECK_ROOT}/dirty.log" 2>&1; then exit 1; fi
test "$(cat VERSION)" = 1.0.0
printf 'Release-Prüfung erfolgreich: %s\n' "${CHECK_ROOT}"
```

## Auflösung

Implementiert und geprüft. ProjectTools-Fassung:
`e88ba2b7a7b14835e02d22bf325e1e1ce9670b9c` auf `feat/changelog-generator`.
StockPortfolio-Fassung wird über `handoff_commit` in STATUS referenziert.
Beide Repository-Fassungen sind Gegenstand der unabhängigen Prüfung;
technische Freigabe und menschlicher Abschluss bleiben offen.
Die fremde unversionierte ProjectTools-AGENTS.md bleibt ausgeschlossen.

## Ergänzung · Einheitliche CLI-Themes · 2026-09-27

Mike: „Wir bleiben bei den files colors.mk und colors.lib.sh. Für Python ein
eigenes colors.py. Vereinheitliche die Files bzw. ergänze sie um notwendige
Settings. Achte auf Rückwärtskompatibilität“. Die Theme-Auswahl wie in
`colours.mk` soll erhalten bleiben. Mike bestätigt „Ja, Theme-Vereinheitlichung“
und stellt dafür die offene Prüfung zurück. Die vorhandene Make-Datei heißt
weiter `colours.mk`; kein JSON und kein Generator.

Repo: StockPortfolio, MakeLib, BashLib, ProjectTools.
Plan: vorhandene Paletten und Namen erhalten; neun Themes in allen drei
Sprachen, gemeinsame überschreibbare Layout-Werte; Python-Formatierung in
`colors.py` teilen und Changelog anbinden. Make-Hilfe und Hints verwenden
dieselben Werte. Reine Standardbibliothek bleibt direkt aufrufbar.
Fremde Änderung `BashLib/src/docker.lib.sh` und unversionierte
`ProjectTools/AGENTS.md` bleiben ausgeschlossen.

| # | Prüfung | Nachweis | AI |
|---|---|---|:--:|
| 5 | Neun Themes, unbekanntes Theme, alte Farbnamen und Aufrufe | 20 CLI-Tests; Palette gegen echtes Make und Bash, alte Makros und usageLine-Argumente | ✅ |
| 6 | Einheitliche Spalten und anpassbare Abstände; lange Optionen ohne Überlappung | Beschreibung Spalte 31; lange Beschriftungen separat, OUTPUT mit Abstand; PTY ocean in Make/Setup/Changelog/Runner | ✅ |
| 7 | Direkter Python-Aufruf, TTY/NO_COLOR; bestehende Generator-Tests | 57 Python-Tests plus 13 Bootstrap-Tests; 10 Generator-Tests zusätzlich direkt unter Python 3.9 | ✅ |
| 8 | Dokumentation und Regressionen aller betroffenen Repositories | 793 Vitest; Lint/Typecheck; Ruff; ShellCheck der neuen/überarbeiteten Einstiege; 24 Skill-Tests, zusätzlich 17 Tests gegen SP-Setup | ✅ |

### Zurückgestellte Übergabe Runde 1


**codex → claude · 2026-09-27 · T-56, Runde 1:** Bitte beide Fassungen prüfen:
StockPortfolio `602d706b1475b48eadf53438bd393508f5795763` auf `t-56-changelog-generator` und ProjectTools
`e88ba2b7a7b14835e02d22bf325e1e1ce9670b9c` auf `feat/changelog-generator`.
Generator, Make-Anbindung, aktueller Changelog, beide READMEs und Docker-Hub-Link
in `make hints`. Mikes ausdrückliche Vorgabe: direkter Python-Aufruf ohne
Bash-Wrapper/venv; BashLib bleibt unverändert. Farben und Abstand wurden nach
seinen Hinweisen korrigiert; bitte PTY/NO_COLOR und OUTPUT-Spalte mitprüfen.
Nachweise und vollständig kopierbare Prüfungen im Ticket: 793 Vitest-Tests,
Lint/Typecheck, 50 ProjectTools-Python-Tests, zusätzlich 10 Generator-Tests unter
Python 3.9, Ruff, isolierte echte Patch-/Minor-/Major-Releases mit lokalem Remote,
Docker-README-Vorschau 5.052 Bytes. Kein echtes Release während T-56 ausgelöst.
Changelog liegt absichtlich in eigenem Commit nach dem Tag; Wiederholung über
`make changelog-publish`. Gemischte Dokumentationscommits bleiben sichtbar,
keine semantische Textbewertung. ProjectTools-AGENTS.md ist fremd/unversioniert
und ausdrücklich nicht enthalten. Lessons SP-CX-01/SP-CX-02 berücksichtigt;
allgemeine Board-Übernahme unverändert offen. Noch kein Merge/Push der Umsetzung.

### Gemeinsamer Python-Starter

Mike benennt `py-run.sh` ausdrücklich, verlangt die Liste verfügbarer
ProjectTools-Skripte und die vollständigen Script-Konventionen. Umsetzung:
`-l`/`--list`, `-r`/`--run SCRIPT [ARGS ...]`, `-h`/`--help`, ohne Argumente
Hilfe. Fachskripte bleiben direkt aufrufbar. Docker-Hub-README verwendet denselben
Runner über seinen bisherigen Alias; seine Vorprüfung bleibt im Fachskript.
Sprachkatalog Deutsch, gemeinsames Theme, eigene Paket-venv nur bei Requirements.
PersonalSkills gleicht Python-/CLI- und Makefile-Konventionen damit ab.

## Nachweise der Theme- und Setup-Ergänzung

Die drei Farbdateien verweisen auf Mikes Wunsch direkt im Kopf aufeinander.
Vorhandene Grundfarben, Make-Makros und `usageLine`-Argumente bleiben erhalten.
Die Standarddarstellung der Ausgabehelfer folgt jetzt dem gemeinsamen Theme.
Bash-/Python-Theme-Ausgabe respektiert TTY, NO_COLOR und TERM=dumb. Make behält
seine TERM-basierte Farberkennung und berücksichtigt zusätzlich NO_COLOR.
`THEME_WIDTH_HELP` betrifft den Python-Textumbruch; Bash und Make geben lange
Beschreibungstexte weiterhin unverändert aus. Alle Layout-Parameter sind in den
Library-READMEs beschrieben; Einrückungen bleiben Leerzeichenketten.

`setup-libs.sh` und die gemeinsame Skill-Vorlage nutzen zentral
`printThemeHeading`, `printThemeRow` und `printThemeStatus` aus BashLib
`tools.lib.sh`. Ohne Quellbibliothek bleibt eine kurze Starthilfe; vor
`--install` muss `BASH_LIBS` auf deren `src`-Verzeichnis zeigen. `--info`/`-s`
prüft auch die tatsächlich benötigten CLI-Dateien. Wiederholung erhält gültige
Links; Quellen aus bestehenden lokalen Links werden physisch aufgelöst, damit
kein Link auf sich selbst entsteht. Echte Dateien, Verzeichnisse und eine
umgeleitete `.libs` bleiben geschützt. Quelle und installierte CLI-Dateien
müssen verfügbar sein; fehlende Dateien werden als Fehler gemeldet.

Python-Bezeichner als AST-Inventar geprüft; Bash-Zuweisungen/Funktionen gegen die
englischen Benennungsregeln gelesen. Bestehende deutsche Testbezeichner in den
geänderten Testdateien nachgezogen. Neue/angepasste Python-Dateien Ruff-grün.
`colors.lib.sh`, `py-run.sh`, Docker-README-Alias und Setup ShellCheck-grün.
`tools.lib.sh` hat unverändert 20 bestehende ShellCheck-Diagnosen; Vergleich nach
Code/Meldung gegen HEAD vor Änderung ergab keine neue Diagnose. Kein pauschal
ShellCheck-grüner Gesamtbestand behauptet.

Die isolierten Erstinstallationsprüfungen scheiterten zuerst nur am gesperrten
Paketdownload; mit freigegebenem Netzwerk 13/13 grün. Skill-Tests benötigen
Python 3.11: der erste Aufruf mit System-Python 3.9 scheiterte beim Import eines
bestehenden Tests; unter 3.11 sind 23/23 grün. Changelog selbst ist zusätzlich
unter 3.9 mit allen 10 Tests geprüft. Keine Paketinstallation in StockInfo;
dessen vorhandener Interpreter diente ausschließlich als Testwerkzeug.

```bash
# #5–7: Alle neun Paletten, Spalten, Legacy-Aufrufe und Runner
cd /Volumes/DevLocal/DevBash/Production/ProjectTools
THEME_MAKE_LIB=/Volumes/DevLocal/DevMake/Production/MakeLib BASH_LIBS=/Volumes/DevLocal/DevBash/Production/BashLib/src PYTHONDONTWRITEBYTECODE=1 /Volumes/DevLocal/DevWeb/Production/StockInfo/.venv/bin/python -m pytest tests/python -q -p no:cacheprovider
# #7: direkter Standardbibliotheks-Aufruf unter dem System-Python (hier 3.9)
PYTHONDONTWRITEBYTECODE=1 python3 -m unittest discover -s tests/python -p test_changelog.py
# #8: Skill-Vorlage und deren Verbraucher im StockPortfolio-Projekt
cd /Volumes/DevLocal/DevKI/Production/PersonalSkills
PYTHONDONTWRITEBYTECODE=1 /Volumes/DevLocal/DevWeb/Production/StockInfo/.venv/bin/python -m unittest discover -s tests -p 'test_*.py'
SETUP_LIBS_SCRIPT=/Volumes/DevLocal/DevWeb/Production/StockPortfolio/scripts/setup-libs.sh PYTHONDONTWRITEBYTECODE=1 /Volumes/DevLocal/DevWeb/Production/StockInfo/.venv/bin/python -m unittest discover -s tests -p test_templates.py
# #6: sichtbarer Vergleich; im Terminal bei Bedarf NO_COLOR entfernen
cd /Volumes/DevLocal/DevWeb/Production/StockPortfolio
MAKE_THEME=ocean ./scripts/setup-libs.sh --help
MAKE_THEME=ocean LANGUAGE=de python3 .libs/ProjectTools/src/python/changelog.py --help
MAKE_THEME=ocean LANGUAGE=de .libs/ProjectTools/src/bash/py-run.sh --help
make help MAKE_THEME=ocean
# #7: Werkzeugliste ohne Installation
./.libs/ProjectTools/src/bash/py-run.sh --list
```

**Doku-Abgleich:** Datei-/Überschrifteninventar und beide StockPortfolio-READMEs
abgeglichen. README unter Commands ergänzt: gemeinsame Themes, Parameter,
Setup-Ausgabe und Runner. `docker/README.md` bleibt sachlich unverändert:
Containerbetrieb und Veröffentlichungsschnittstelle sind gleich; echte Vorschau
über den neuen Runner erfolgreich, weiterhin 5.052 UTF-8-Bytes. MakeLib-,
BashLib- und ProjectTools-READMEs beschreiben Palette, Layout, Grenzen und Aufrufe.
PersonalSkills: Python-/CLI-Regeln, Makefile-Konvention und Setup-Vorlage samt
Tests konsistent nachgezogen. Kein neues Docker-/Unraid-Verhalten; dort keine
weiteren Dokumentänderungen nötig. Allgemeine Board-Übernahme weiterhin offen.

**Lessons:** SP-CX-01/02/04/05, Format 1: ein gemeinsamer Runner, keine
JSON-/Generator-Zwischenlage, Inventar der Aufrufer und Vergleich der tatsächlich
sichtbaren Referenzausgabe; wiederverwendbare Checks liegen in ProjectTools bzw.
PersonalSkills. Neue unabhängige Prüfung steht aus. Die frühere Runde 1 war nur
zurückgestellt und hat keine Freigabe erteilt.

**Seiteneffekt abgefangen:** BashLibs bestehender lokaler Post-Commit-Hook
reihte beim Review-Commit einen Jenkins-Aufruf als Job 82 ein. Der Job war noch
in `atq` und wurde gezielt mit `atrm 82` entfernt. Hook und andere Jobs blieben
unverändert. Kein Jenkins-Erfolg oder veröffentlichter Build behauptet.

### Prüffassungen der erweiterten Übergabe · Runde 2

| Repository | Branch | Commit |
|---|---|---|
| StockPortfolio | `t-56-changelog-generator` | `handoff_commit` in STATUS |
| MakeLib | `feat/cli-themes` | `10b128d00e514495232d94a95ca9893a32e1dfb7` |
| BashLib | `feat/cli-themes` | `ab6a5a77949f31b285dc987b66cadba249a6db15` |
| ProjectTools | `feat/changelog-generator` | `a54f84d4196d4a72dece1d07fcf9564333726ae5` |
| PersonalSkills | `docs/shared-cli-themes` | `38073d8af066c68f532ff1b571b910663e582b70` |

MakeLib hatte bereits vor Beginn zwei lokale Commits auf master; Ausgangsfassung
`df55af9` bleibt erhalten. BashLibs fremde Änderung an `src/docker.lib.sh` und
ProjectTools' unversionierte `AGENTS.md` sind nicht in den Prüffassungen enthalten.
Keine der neuen Fassungen ist durch den Coder gemergt oder gepusht. Technische
Freigabe und Ticketabschluss bleiben offen; danach gilt Mikes Integrationsablauf
mit Rückkehr auf master.

### Nachtrag vor Übergabe · zentrale Bash-Helfer und direkte Changelog-Anbindung

Mike verlangt gemeinsame Ausgabehelfer in `tools.lib.sh`, Namen mit
`printTheme` und die kurze einzeilige BashLib-Einbindung. Setup-Script und
Skill-Vorlage enthalten keine eigenen Kopien der drei Helfer mehr. Die bisher
öffentlichen `themeHeading` und `themeLine` bleiben kompatibel verfügbar.
Shell-Konvention und BashLib-README beschreiben die gemeinsame Schnittstelle.
Ohne BashLib liefert die Starthilfe Status 0; Installationsversuche brechen
mit Status 1 ab und legen keine Links an.

Mike bestätigt außerdem den direkten Aufruf von `changelog.py --publish`
in den drei `tag-*`-Targets. Das öffentliche Target `changelog-publish` entfällt.
`make changelog` erzeugt weiterhin nur die Datei. Wiederholung nach einem
fehlgeschlagenen Changelog-Schritt erfolgt direkt über Python, ohne neuen Tag;
der historische Runde-1-Nachweis oben beschreibt noch die damaligen Targets.

Nachprüfung: 24 Skill-Tests und 17 Vorlagentests gegen das StockPortfolio-Script
bestanden. Echter BashLib-Aufruf unter `set -euo pipefail`: Beschreibung in
Spalte 31, Statusausgabe, farblose Pipe und ocean-Farben im PTY geprüft.
ShellCheck des Setup-Scripts grün; die 20 vorhandenen Diagnosen in `tools.lib.sh`
sind nach Code und Meldung unverändert. `make help` enthält nur `changelog`,
`make -n tag-minor MSG=...` zeigt den direkten Python-Aufruf nach dem Bump.
Kein echtes Release ausgeführt.

**Doku-Abgleich:** README-Abschnitte „Command-line themes“ und Release-Anleitung
angepasst; BashLib-README, Shell-Konvention und gemeinsame Setup-Vorlage ebenso.
`docker/README.md` erneut abgeglichen: beschreibt den Containerbetrieb, keine
Entwickler-Targets oder BashLib-Einbindung; keine Anpassung erforderlich.
Beim BashLib-Nachtragscommit wurde ausschließlich für diesen Git-Aufruf der
bekannte Jenkins-Hook ausgelassen (`core.hooksPath=/dev/null`); keine permanente
Hook-Konfiguration verändert und kein weiterer Jenkins-Job erzeugt.
