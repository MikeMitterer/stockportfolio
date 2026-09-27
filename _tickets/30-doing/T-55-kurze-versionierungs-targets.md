# T-55 · Kurze Versionierungs-Targets vereinheitlichen

StockPortfolio verwendet längere Versionsbefehle als StockInfo. Mike möchte
die kurze Form `tag-major`, `tag-minor` und `tag-patch` auch hier und als
künftige Skill-Vorgabe. Commit, Tag und Push bleiben Bestandteil des Befehls;
der Name muss den Push nicht zusätzlich aufführen.

**Stand:** Am 2026-09-27 umgesetzt und geprüft. Kein Release ausgeführt.
**Für dich:** Aktuell kein Handgriff nötig; technische Prüfung und Abschluss
stehen noch aus.

## Auftrag

Mike: „Push braucht im Namen nicht vorkommen, pass das hier an, vermerke das
auch gleich bei dem Makefile-Skill damit das in Zukunft klar ist“.

Prüfauftrag von Mike: „Lass das Claude nochmal verifizieren - auch die Skillanpassung“.

## Umfang und Umsetzung

- StockPortfolio: Makefile-Targets und aktuelle README-Befehle umbenennen.
- PersonalSkills: `makefile-conventions/SKILL.md`, referenzierte
  `versioning-conventions/SKILL.md` und `templates/versioning.mk` angleichen.
- Keine Änderung an BashLib, StockInfo oder dem Versionsstand.

## Verify

Einzige aktuelle Nachweismatrix. ✅ geprüft · ◑ teilweise · ➖ ausstehend.

| # | Prüfung | Nachweis | AI |
|---|---|---|:--:|
| 1 | `make help` und Trockenläufe der drei Targets | Alle drei kurzen Namen sichtbar; `make -n` gibt unveränderte semVerBump-Aufrufe für major/minor/patch aus, ebenso für die Skill-Vorlage | ✅ |
| 2 | Skills und Vorlage abgleichen | Beide Skills mit quick_validate erfolgreich geprüft; Beispiele und Vorlage konsistent, kein alter Target-Name mehr in den beiden Skills | ✅ |
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
Bestehende Symlinks zeigen direkt auf die Quelländerungen; keine zweite Kopie.
Die PersonalSkills-Übersicht bleibt passend, Skill-Namen unverändert.
Board-/Lessons-Konventionen bleiben unverändert; offene allgemeine Übernahme
bleibt in STATUS sichtbar.

## Lessons-Einordnung

SP-CX-02 / AL-R-02, Format 1: Inventar über Projekt, Skills und Vorlage;
Nutzerentscheidung an allen aktuellen Befehlsbeispielen nachziehen. Keine neue
Lesson aus dieser ausdrücklichen Namensentscheidung ableiten.

## Auflösung

Umgesetzt und geprüft. PersonalSkills-Commit
`6600ce24b4842c1fd64582ddf001d73549a8ab87` auf
`docs/kurze-versionierungs-targets`, lokal und noch nicht integriert/gepusht.
StockPortfolio-Produktfassung `adc36a19708f33c2adccb94e1b22a0fef691a25b`.
Beide Fassungen gemeinsam in Runde 1 an `claude` übergeben; seine Prüfung
soll Projektänderung und Skill-Anpassung getrennt belegen.
Technische Freigabe und Abschluss stehen aus.
