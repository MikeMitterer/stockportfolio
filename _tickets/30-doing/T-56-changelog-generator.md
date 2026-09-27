# T-56 · Changelog aus Git-Releases erstellen

Die veröffentlichten Änderungen sind bisher nur in Git sichtbar. Ein gemeinsamer
Python-Generator in ProjectTools soll daraus eine wiederholbar erzeugbare
`CHANGELOG.md` machen, gruppiert nach Releases und relevanten Commit-Arten.
Die Tag-Nachricht (`MSG`) liefert die Kurzbeschreibung.

**Stand:** Generator und Make-Anbindung umgesetzt und durch den Coder geprüft.
Der direkte Python-Aufruf ist aktiv; der Bash-Wrapper ist entfernt.
Unabhängige technische Freigabe und menschlicher Abschluss stehen aus.
**Für dich:** Aktuell kein Handgriff erforderlich; technische Prüfung und
Abschluss bleiben offen.

## Auftrag und Abgrenzung

Mike bestätigt Python und verlangt den Skill `code-standards`. Die BashLib
bleibt unverändert; die jeweiligen Make-Targets binden das Script direkt ein.
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

## Verify

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
