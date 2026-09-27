# T-55 · Kurze Versionierungs-Targets vereinheitlichen

StockPortfolio verwendet längere Versionsbefehle als StockInfo. Mike möchte
die kurze Form `tag-major`, `tag-minor` und `tag-patch` auch hier und als
künftige Skill-Vorgabe. Commit, Tag und Push bleiben Bestandteil des Befehls;
der Name muss den Push nicht zusätzlich aufführen.

**Stand:** StockPortfolio ist in Runde 1 durch `claude` ohne Befund
freigegeben. Die drei PersonalSkills-Befunde sind in `772c25c` korrigiert
und geprüft; die kurze Nachprüfung durch Claude steht aus. Kein Release ausgeführt.
**Für dich:** Aktuell kein Handgriff nötig; technische Gesamtfreigabe und
menschlicher Abschluss stehen noch aus.

## Auftrag

Mike: „Push braucht im Namen nicht vorkommen, pass das hier an, vermerke das
auch gleich bei dem Makefile-Skill damit das in Zukunft klar ist“.

Prüfauftrag von Mike: „Lass das Claude nochmal verifizieren - auch die Skillanpassung“.

## Umfang und Umsetzung

- StockPortfolio: Makefile-Targets und aktuelle README-Befehle umbenennen.
- PersonalSkills: `makefile-conventions/SKILL.md`, referenzierte
  `versioning-conventions/SKILL.md` und `templates/versioning.mk` angleichen;
  zugehörige Verweise in Docker-/Unraid-Skills und der Vorlagentest gehören dazu.
- Keine Änderung an BashLib, StockInfo oder dem Versionsstand.

## Verify

Einzige aktuelle Nachweismatrix. ✅ geprüft · ◑ teilweise · ➖ ausstehend.

| # | Prüfung | Nachweis | AI |
|---|---|---|:--:|
| 1 | `make help` und Trockenläufe der drei Targets | Alle drei kurzen Namen sichtbar; `make -n` gibt unveränderte semVerBump-Aufrufe für major/minor/patch aus, ebenso für die Skill-Vorlage | ✅ |
| 2 | Skills, Vorlage und Aufrufer abgleichen | Runde-1-Lücke in drei Dateien behoben; repoweites Inventar ohne alte Targets, Docker-/Unraid-Skills validiert, alle 21 PersonalSkills-Tests grün | ✅ |
| 3 | Doku und Diff prüfen | README-Commands und Release-Anleitung angepasst, docker/README unverändert passend; git diff --check in beiden Repos grün | ✅ |
| 4 | Projektpflichtprüfungen | 793 Tests in 62 Dateien bestanden, Lint und Typecheck Exit 0 | ✅ |

Prüfbefehle aus StockPortfolio:

```bash
make help                                      # #1
make -n tag-major tag-minor tag-patch            # #1, führt kein Release aus
make -f /Volumes/DevLocal/DevKI/Production/PersonalSkills/versioning-conventions/templates/versioning.mk -n tag-major tag-minor tag-patch  # #1
/Volumes/DevLocal/DevWeb/Production/StockInfo/.venv/bin/python /Users/macminipro/.codex/skills/.system/skill-creator/scripts/quick_validate.py /Volumes/DevLocal/DevKI/Production/PersonalSkills/makefile-conventions  # #2
/Volumes/DevLocal/DevWeb/Production/StockInfo/.venv/bin/python /Users/macminipro/.codex/skills/.system/skill-creator/scripts/quick_validate.py /Volumes/DevLocal/DevKI/Production/PersonalSkills/versioning-conventions  # #2
git diff --check                               # #3
make test                                      # #4
make lint                                      # #4
make typecheck                                 # #4
```

System-Python fehlte zunächst PyYAML; beide Validierungen danach erfolgreich
mit der vorhandenen StockInfo-Umgebung ausgeführt, ohne Installation oder
Änderung an StockInfo. Die unveränderten Projekttests enthalten weiterhin
Warnungen aus Negativfällen/PositionsTable-Injection, keine Fehler.

## Side-Effects

Die bisherigen langen Target-Namen entfallen. Der Aufruf von `tag-*` erhöht
weiterhin die Version, committet, taggt und pusht. `make push` für das
Docker-Image bleibt unverändert.

## Doku-Abgleich

Projekt-README: Commands und Building and publishing angepasst.
Docker-README: nennt keine Versionierungs-Targets; Containerbetrieb unverändert.
Historischer Entwurf unter docs nennt bereits `tag-major/-minor/-patch`.
Makefile-Skill und Versionierungs-Skill samt Vorlage gemeinsam angepasst.
Runde-1-Nacharbeit ergänzt Docker- und Unraid-Skill sowie den Vorlagentest.
Bestehende Symlinks zeigen direkt auf die Quelländerungen; keine zweite Kopie.
Die PersonalSkills-Übersicht bleibt passend, Skill-Namen unverändert.
Board-/Lessons-Konventionen bleiben unverändert; offene allgemeine Übernahme
bleibt in STATUS sichtbar.

## Lessons-Einordnung

SP-CX-02 / AL-R-02, Format 1: Das ursprüngliche Inventar war auf die ausdrücklich
benannten Dateien begrenzt. Die Observer-Ergänzung vom 2026-09-27 ist vor der
Nacharbeit gelesen und angewendet: repoweites Inventar aller Aufrufer und
Verweise, Negativtest prüft nun `precheck` und die konkrete Bibliotheksmeldung.
Die Gegenprobe mit altem Target scheitert gezielt; die korrigierte Fassung ist
grün. Konkrete Nachweise unten; vorhandene Lesson erweitert, keine neue ID.

### Unabhängige Prüfung · Runde 1 · claude

Geprüft: StockPortfolio `adc36a19708f33c2adccb94e1b22a0fef691a25b`
(`t-55-kurze-versionierungs-targets`) und PersonalSkills
`6600ce24b4842c1fd64582ddf001d73549a8ab87`
(`docs/kurze-versionierungs-targets`), getrennt belegt. Keine echten
Bump-/Tag-/Push-Targets ausgeführt, nur `make -n`/Dry-Runs und Testsuiten.

**StockPortfolio — in Ordnung:**
- Diff gelesen: `Makefile` und `README.md` benennen ausschließlich
  `tag-and-push-{major,minor,patch}` → `tag-{major,minor,patch}` um; die
  `semVerBump`-Aufrufe selbst sind unverändert (per Diff und eigenem
  `make -n tag-major tag-minor tag-patch` bestätigt — reiner Dry-Run, keine
  Ausführung).
- `rg -n "tag-and-push" .` im ganzen Repo: nur zwei Treffer, beide historisch
  und zu Recht unverändert (`ACTIVITY.md`-Altmeldung, archiviertes
  `T-49`-Ticket) — keine lebenden Verweise übersehen.
- `make help` zeigt die drei neuen Namen mit weiterhin vollständiger
  Verhaltensbeschreibung („committen, taggen UND pushen“).
- Pflichtprüfungen selbst reproduziert: `make lint` (Exit 0),
  `make typecheck` (Exit 0), `make test` — 62 Testdateien/793 Tests grün.

**PersonalSkills — Befund, unvollständiges Bezeichnerinventar:**
Diff in `makefile-conventions/SKILL.md`, `versioning-conventions/SKILL.md`
und `templates/versioning.mk` sauber und konsistent mit Mikes Entscheidung.
Ein repoweiter `rg -n "tag-and-push"` findet jedoch drei weitere, nicht
umbenannte Stellen — genau der Fall, den das Ticket selbst unter
AL-R-02 („vollständige Korrektur braucht ein Inventar“) als geprüft
ausweist:

1. `unraid-conventions/SKILL.md:57-58` — Release-Checkliste nennt weiterhin
   `make tag-and-push-patch`/`tag-and-push-minor`. Diese Zielnamen
   existieren nach der Umbenennung nicht mehr; ein Befolgen der Anleitung
   scheitert mit „No rule to make target“.
2. `docker-conventions/SKILL.md:105` — „StockPortfolio benennt sie
   ausdrücklich `tag-and-push-*`, StockInfo hat noch `tag-*`“ ist jetzt
   sachlich falsch: Nach diesem Ticket verwenden beide Projekte `tag-*`: die
   angebliche Abweichung, die der Satz erklärt, ist genau die, die hier
   beseitigt werden sollte.
3. `tests/test_documented_examples.py:123` (`MakeTests.
   test_version_liest_die_bibliothek_und_precheck_sperrt_fehlende_datei`) —
   ruft `make -f versioning.mk tag-and-push-patch` auf, um zu belegen, dass
   der `precheck`-Schutz einen Release bei fehlender `version.lib.sh`
   blockiert. Eigener Nachlauf bestätigt: Der Test ist weiterhin grün
   (`OK`, selbst ausgeführt), aber nur noch zufällig — `make` bricht jetzt
   mit „No rule to make target 'tag-and-push-patch'“ ab (selbst
   reproduziert, Exit 2), bevor das eigentlich zu prüfende `precheck`-Rezept
   überhaupt erreicht wird. Der Test prüft damit nicht mehr, was sein Name
   und Docstring behaupten; eine künftige Lockerung von `precheck` bliebe
   unbemerkt grün. Volle Testsuite (`test_documented_examples`,
   `test_templates`, `test_skill_structure`, 21 Tests) sonst unauffällig
   grün, keine weiteren Bezüge zu alten oder neuen Zielnamen gefunden.

Die im expliziten Ticketumfang genannten drei Dateien
(`makefile-conventions/SKILL.md`, `versioning-conventions/SKILL.md`,
`templates/versioning.mk`) sind vollständig und korrekt umbenannt; die
Lücke liegt bei den nicht ausdrücklich genannten, aber thematisch
zugehörigen Dateien in demselben Repository.

**Verdict: changes_requested**, beschränkt auf PersonalSkills. Bitte
`unraid-conventions/SKILL.md` (2 Vorkommen), `docker-conventions/SKILL.md`
(1 Aussage) und den Testaufruf in `test_documented_examples.py` auf
`tag-patch` umstellen — im Test bleibt die eigentliche Prüfabsicht
(`precheck` blockiert bei fehlender Lib) erhalten, nur der Zielname ändert
sich. StockPortfolio braucht keine Nacharbeit und keine erneute Prüfung.

### Nacharbeit · codex · 2026-09-27

PersonalSkills `772c25cf1193c244df1c11eafe9eecd4b77942a8` korrigiert die drei
befundeten Dateien. Unraid nennt die kurzen Targets; Docker verweist auf die
Versionierungs-Konvention statt die beseitigte Projektabweichung zu behaupten.
Der Test ruft `tag-patch` auf und verlangt neben einem Fehlerstatus die
fehlende Bibliothek in stdout sowie `precheck` in stderr.

**Gegenprobe:** Neue Assertions zunächst gegen den alten Target-Aufruf im
Speicher ausgeführt: rot, weil `No rule to make target` statt `precheck`.
Nach Korrektur alle 21 PersonalSkills-Tests grün. Der erste Gesamtaufruf mit
System-Python 3.9 scheiterte beim Import von `test_skill_structure` (Union-
Typannotation benötigt neueres Python); erneuter Gesamtlauf mit vorhandener
StockInfo-Umgebung erfolgreich. Keine Umgebung installiert oder verändert.
StockPortfolio unverändert gegenüber der geprüften Fassung; keine Wiederholung
seiner bereits bestandenen 793 Tests für diese ausschließlich externe Nacharbeit.

```bash
cd /Volumes/DevLocal/DevKI/Production/PersonalSkills
PYTHONDONTWRITEBYTECODE=1 /Volumes/DevLocal/DevWeb/Production/StockInfo/.venv/bin/python -m unittest discover -s tests -v  # #2: 21 Tests OK
rg -n --hidden 'tag-and-push' --glob '!.git/**' --glob '!**/__pycache__/**' --glob '!ACTIVITY.md' .  # #2: keine Treffer
git diff --check  # #3
```

### Auflösung

**Observer-Einordnung · 2026-09-27:** SP-CX-02 um diesen belegten Fall
erweitert (Format 1, Ergänzung vom 2026-09-27). Die drei übersehenen
Verbraucher in PersonalSkills `6600ce2` selbst im Quelltext bestätigt.
Vorbeugung: Inventar auch über Aufrufer und querverweisende Anleitungen;
Gegenprobe: Beim Negativtest den beabsichtigten `precheck`-Fehler nachweisen,
nicht nur irgendeinen Fehlerstatus. Der Test-Nachlauf bleibt Claudes
Nachweis, kein eigener Lauf des Observers. Doku-/Skill-Abgleich: bestehendes
Lessons-Format verwendet, keine neue Konvention und kein globales Skill-Update.
Die allgemeine Übernahme bleibt separat offen.

StockPortfolio-Produktfassung `adc36a19708f33c2adccb94e1b22a0fef691a25b`
ist technisch freigegeben und unverändert. PersonalSkills-Nacharbeit
`772c25cf1193c244df1c11eafe9eecd4b77942a8` ist geprüft und zur kurzen
Nachprüfung vorgesehen. Beide Skill-Commits bleiben lokal und unintegriert;
technische Gesamtfreigabe und menschlicher Abschluss stehen aus.
