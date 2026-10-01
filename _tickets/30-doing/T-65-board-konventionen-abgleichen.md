# T-65 · Board-Konventionen auf den Paketstand abgleichen

**Auftrag von Mike, 2026-10-01:** „Ja, leg dafür ein Ticket an“, auf die
Frage, ob die offene Übernahme der Board-Konventionen als eigenes Ticket
abgeglichen werden soll.

Das Board arbeitet nach dem Konventionsstand `2026-09-11-activity-feed`.
Installiert ist das gemeinsame Regelpaket mit Stand
`2026-09-28-activity-local` (Paket `df699dd1…24da1` unter
`~/.local/share/agent-workflow/current`). Das Ticket gleicht das Board an
diese Fassung an. Am Produkt ändert sich nichts.

**Einordnung in die Kette:** nach T-64. Aktiviert am 2026-10-01 nach der
technischen Freigabe von T-64, Branch `t-65-board-konventionen-abgleichen`
im Worktree `/private/tmp/stockportfolio-t65`.

**Für dich · Entscheidung offen (Kennungen):** Die Rollen-Shortcuts
(`~/.local/bin/agent-session.sh`) geben Coder und Verifier die Kennung
`codex` beziehungsweise `claude`; nur Observer erhalten `-observer`. STATUS
führt seit heute `claude-coder` und `codex-verifier`. Per Shortcut gestartet
findet eine Instanz ihre Zuordnung deshalb nicht; genau so stand T-62 am
Vormittag über zwei Stunden still. Möglich sind: (a) STATUS zurück auf
`claude`/`codex`, (b) im Launcher auch Coder und Verifier mit Zusatz
benennen (Änderung im AgentLessons-Paket, nicht hier), (c) so lassen und die
Kennung beim Start ausdrücklich setzen. Bis zu deiner Entscheidung ist (c)
in der Aktivierung dokumentiert.

## Für dich

| Frage | Prüfpunkt # | Handgriff | Dein Urteil | Human |
|---|---|---|---|---|
| A · Regelstand | [1](#pruefpunkt-1) | `AGENT-WORKFLOW.md` öffnen | Steht dort `2026-09-28-activity-local` samt der lokalen Abweichungen? | |
| B · Kennungen | — | Oben „Entscheidung offen“ lesen | (a), (b) oder (c)? | |

## Umfang

Grundlage: `references/board-conventions.md` des Pakets, Abschnitt
„Bestehende Boards abgleichen“.

1. **`AGENTS.md`:** Verweis auf die gemeinsamen `PROJECT-RULES.md`
   (Arbeitsfreigabe, sensible Dateien, Ticketabschluss und Git). Lokale
   Entscheidungen bleiben und haben Vorrang, insbesondere Mikes dauerhafte
   Freigabe von Merge **und Push** nach Abschluss (2026-09-27); das Paket
   selbst beauftragt keinen Push.
2. **`_tickets/.agents/AGENT-WORKFLOW.md` und Ticketvorlage:** Pflicht zur
   Lessons-Einordnung neuer Befunde in der Tabellenform der Paketvorlage
   (Befund, Einordnung, Lesson-ID/Fassung oder Einzelfallgrund, Übernahme).
   Abgeschlossene Reviews werden dafür nicht wiederholt.
3. **ACTIVITY:** Die Paketvorlage sieht `_tickets/.gitignore` mit
   `/ACTIVITY.md` vor. Hier wirkt bereits die Root-`.gitignore`
   (Mikes Beschluss vom 2026-09-28). Entscheiden und dokumentieren: als
   lokale Abweichung festhalten oder die Datei zusätzlich anlegen.
4. **Weitere Abgleichpunkte** aus der Übernahmeanleitung prüfen: Aktivierung,
   STATUS-Einstieg, README des Boards, Lessons-Einstieg, Startprompts der
   Shortcuts. Nur betroffene Abschnitte ergänzen; keine Vorlagen über das
   eigenständig entwickelte Board kopieren.
5. **Stand eintragen:** `Übernahmestand der Board-Konventionen:
   2026-09-28-activity-local` mit Datum und lokalen Abweichungen in
   `AGENT-WORKFLOW.md`; den Hinweis „Offene Übernahme“ in STATUS entfernen.
6. **Skill-Abgleich:** Nach AGENTS.md Änderungen an Board-Konventionen im
   Skill `task-verification-workflow` nachziehen oder begründen, warum dort
   nichts zu ändern ist.

Geltende Rollen, Phasen, aktive Aufträge, Nachrichten, Nachweise und
Nutzerentscheidungen bleiben erhalten.

## Umsetzung (`claude-coder`, 2026-10-01)

| Prüfkriterium (Übernahmeanleitung) | Ergebnis |
|---|---|
| `AGENTS.md` bindet das Paket und `PROJECT-RULES.md` ein | Neuer Absatz unter **Vor Arbeitsbeginn**: Paketpfad, `VERSION`-Prüfung, `PACKAGE.md`/`PROJECT-RULES.md`; lokale Entscheidungen haben Vorrang, Merge **und Push** bleiben ausdrücklich freigegeben. |
| `_tickets/.gitignore` mit `/ACTIVITY.md` | Angelegt; `git check-ignore -v _tickets/ACTIVITY.md` trifft die neue Datei. Die Root-Regel bleibt zusätzlich bestehen. AGENTS, Workflow und Board-README nennen sie. |
| Pflege durch alle drei Rollen, globaler Helfer | Bereits erfüllt (Stand 2026-09-11); unverändert. |
| STATUS als alleinige Rollenquelle, sichtbarer ACTIVITY-Link | Bereits erfüllt; „Offene Übernahme“ durch den Stand samt Verweis auf T-65 ersetzt. |
| Observer koordiniert über Mailboxen | Bereits erfüllt; Observer-Durchlauf prüft bei Wiederaufnahme jetzt zusätzlich eine offene Lessons-Einordnung. |
| Lessons-Einordnung | Neuer Abschnitt „Lessons-Einordnung bei neuen Befunden“ im Workflow (Kurzfassung der Paketregel); `.agents/TICKET-TEMPLATE.md` aus dem Paket übernommen, sie verweist auf die zentrale Vorlage mit der Einordnungstabelle; Board-README verlinkt beides. |
| Rollen-Launcher | Geprüft: acht Symlinks auf `~/.local/bin/agent-session.sh`, Prompt ohne pauschales Nur-Lese-/Mailboxverbot. Aktivierung beschrieb noch zwei Einzeiler; Abschnitt „Rollen-Shortcuts im Terminal“ ersetzt ihn. Kennungsabweichung siehe oben. |
| Stand im Workflow | `Übernahmestand der Board-Konventionen: 2026-09-28-activity-local`, Datum, Verweis auf T-65 und die zwei lokalen Abweichungen (Push-Freigabe, Kennungen). Seit der Nacharbeit zu Runde 1 zusätzlich: die vier gemeinsamen Verträge als kurze Paketeinstiege. |
| Skill `task-verification-workflow` | Gelesen (`PersonalSkills`, HEAD `1bf670d`): reiner Einstieg ins Paket ohne eigene Regelkopie; keine Änderung nötig. |

**Nebenbei (Scout Rule):** Der Verweis in STATUS auf das nach StockApps
übertragene T-53 zeigte auf eine nicht mehr vorhandene Datei; dort heißt das
Ticket `T-01-blogposts-und-erklaervideo-fuer-beide-apps.md`. Link korrigiert.
Der Link in SP-CX-01 auf den alten Anker `observer-shortcuts-im-terminal` zeigt
jetzt auf `rollen-shortcuts-im-terminal`; der Inhalt der Lesson bleibt
unverändert.

**Erhalten:** Rollen, Phasen, aktive Aufträge, Mailboxen, Nachweise und
Nutzerentscheidungen. Keine Paketvorlage wurde über eine bestehende Datei
kopiert; neu sind nur `.gitignore` und `TICKET-TEMPLATE.md`.

## Verify

| # | Handgriff | Nachweis | AI |
|---|---|---|:--:|
| 1 | <a id="pruefpunkt-1"></a>Workflow, AGENTS, Ticketvorlage und STATUS gegen die Prüfkriterien der Übernahmeanleitung lesen | Jedes Kriterium umgesetzt oder als lokale Abweichung begründet | ✅ |
| 2 | Vorhandene Links und Anker in den geänderten Dateien prüfen | Keine toten Verweise | ✅ |
| 3 | `make test` (keine Produktänderung erwartet) | Unverändert grün | ✅ |

**Nachweise:** (1) Tabelle oben. (2) Skript über alle relativen Links und
Anker in `AGENTS.md`, `AGENT-WORKFLOW.md`, `AGENT-ACTIVATION.md`,
`TICKET-TEMPLATE.md`, Board-README, STATUS und SP-CX-01: ein toter Link
(T-53, korrigiert), danach keiner. (3) `make test`: 829 Frontend- und 20
API-Tests grün; `git diff --check` ohne Befund.

Legende: ✅ live bestätigt · ⚠️ mit Einschränkung · ◑ teilweise ·
➖ noch kein Nachweis.

### Doku-Abgleich

Inventar: `AGENTS.md`, `CLAUDE.md`, `_tickets/README.md`, `_tickets/STATUS.md`,
`_tickets/.agents/*`, Skill `task-verification-workflow`, `README.md`,
`docker/README.md`.

- `AGENTS.md` **Vor Arbeitsbeginn**: Paketeinstieg ergänzt; ACTIVITY-Zeile
  nennt `_tickets/.gitignore`.
- `_tickets/.agents/AGENT-WORKFLOW.md`: Übernahmestand, ACTIVITY-Absatz,
  neuer Abschnitt zur Lessons-Einordnung.
- `_tickets/.agents/AGENT-ACTIVATION.md`: Übersicht, Abschnitt
  „Rollen-Shortcuts im Terminal“, Observer-Durchlauf Schritt 2.
- `_tickets/.agents/TICKET-TEMPLATE.md`: neu (Paketeinstieg).
- `_tickets/README.md`: ACTIVITY/`.gitignore`, Baum, Verweise auf Einordnung
  und Vorlage.
- `_tickets/STATUS.md`: Stand statt offener Übernahme; T-53-Link.
- `CLAUDE.md`: verweist nur auf AGENTS.md; unverändert.
- Skill `task-verification-workflow`: reiner Paketeinstieg; keine Änderung.
- `README.md`, `docker/README.md`: beschreiben kein Board; unverändert.

### Lessons-Einordnung

| Befund oder Gruppe | Einordnung | Lesson-ID/Fassung oder konkreter Einzelfallgrund | Tatsächliche Übernahme / offener Rest und Zuständigkeit |
|---|---|---|---|
| Kennungen in STATUS weichen von den Shortcut-Kennungen ab; T-62 stand dadurch über zwei Stunden still | Einzelfall | Ein Vorfall; Ursache ist eine Namensentscheidung, kein wiederholtes Arbeitsmuster. Bei Wiederholung als Lesson aufnehmen. | In der Aktivierung dokumentiert; Entscheidung (a/b/c) bei Mike |
| Toter Link nach Ticketumzug (T-53) | Vorhandene Lesson angewendet | [SP-CX-02](../.agents/lessons/SP-CX-02-entscheidungen-in-allen-aktuellen-aussagen-nachziehen.md), Stand 2026-09-28: Entscheidungen in allen aktuellen Aussagen nachziehen | Link korrigiert; keine Ergänzung der Lesson nötig |

## Technische Prüfung Runde 1

`codex-verifier`, 2026-10-01, Übergabefassung
`6c94c12419ce6e95202a2f17bb9e257fa3d6912d`. Danach wurden nur T-66
und STATUS ergänzt; der geprüfte Konventionsstand blieb stabil. **Nacharbeit
erforderlich.** Keine menschliche Abnahme und kein Ticketabschluss.

**Eigener Abgleich:** Installierte Paketfassung
`df699dd1d7583c59030030ad44e3ab896d4660be8d84575662e652f754624da1`
mit `PACKAGE.md`, `PROJECT-RULES.md`, `references/board-conventions.md`,
`references/board-setup.md` und der Skill-Übernahmeanleitung gelesen. Diff der
Übergabe gegen Paket und lokale Entscheidungen verglichen. Die neue
`_tickets/.gitignore` greift laut `git check-ignore -v`; ACTIVITY ist nicht
getrackt. Acht Rollen-Symlinks und den tatsächlich installierten
`agent-session.sh` geprüft. Der korrigierte T-53-Link zeigt auf eine
vorhandene Datei. `git diff --check 79077cd..6c94c12` war ohne Befund.
`make test` mit 829 Frontend- und 20 API-Tests ist ein Coder-Beleg, kein
von mir wiederholter Lauf; es gab keine Produktänderung.

### Befund 1 · Übernahmestand trotz duplizierter gemeinsamer Verträge

`references/board-conventions.md` verlangt beim Umstieg, lokale allgemeine
Regeln durch kurze Paketeinstiege zu ersetzen. `references/board-setup.md`
nennt hierfür ausdrücklich `AGENT-WORKFLOW.md`, `AGENT-ACTIVATION.md`,
`CODEX-IN-CONTEXT-SCHEDULER.md` und `LESSONS-ACCESS.md`; bestehende Anker und
lokale Ausnahmen sind zu erhalten. Diese vier lokalen Dateien sind weiter
ausführliche eigenständige Verträge (259, 154, 107 und 134 Zeilen). Die
Übergabe ergänzt nur einzelne Abschnitte, trägt aber bereits den vollständigen
Stand `2026-09-28-activity-local` ein. So bleibt eine zweite gepflegte Kopie
und eine spätere Paketänderung wirkt nicht allein über den Einstieg.

**Erwartete Korrektur:** Die vier Dateien als kurze lokale Paketeinstiege
gestalten, mit überprüfbaren Verweisen auf die gleichnamigen gemeinsamen
Verträge. Projektentscheidungen, lokale Filecheck-Regel und bestehende
Abschnittsanker erhalten. Falls ein Teil in diesem Auftrag nicht übernommen
werden kann, den vollständigen Stand zurücknehmen und die offene Übernahme
mit Ziel und zuständiger Instanz sichtbar lassen. Anker-/Linkprüfung und
inhaltlichen Vergleich erneut belegen. Keine Paketvorlage über die lokalen
Entscheidungen kopieren.

### Befund 2 · Startbeispiele verwenden inaktive Kennungen

In der lokalen `AGENT-ACTIVATION.md` nennen die ausführbaren Codex- und
Claude-Beispiele weiter `Deine Instanzkennung ist codex` beziehungsweise
`claude`. STATUS ordnet `codex-verifier` und `claude-coder` zu. Der installierte
Launcher setzt für Coder/Verifier tatsächlich die bloßen Kennungen; sein
Prompt verlangt bei fehlender exakter Zuordnung den Abbruch ohne Scheduler.
Die neue Notiz unter „Rollen-Shortcuts“ benennt die Abweichung, aber die
Beispiele oberhalb starten weiterhin mit falscher Identität. Die offene Wahl
(a/b/c) durch Mike ist im Ticket korrekt als menschliche Entscheidung
ausgewiesen; bis dahin muss der dokumentierte Übergangsweg (c) ausführbar
sein.

**Erwartete Korrektur:** Aktuelle Beispiele und Startanweisung auf die
STATUS-Kennungen abstimmen und den zusätzlich nötigen Schritt nach einem
Shortcut-Start konkret nennen. Den Startweg gegen den installierten Prompt
und STATUS prüfen. Mikes spätere Entscheidung über die dauerhaften Kennungen
nicht vorwegnehmen.

### Lessons-Einordnung zur Rückgabe

| Befund oder Gruppe | Einordnung | Lesson-ID/Fassung oder konkreter Einzelfallgrund | Tatsächliche Übernahme / offener Rest und Zuständigkeit |
|---|---|---|---|
| Befund 1 · Vollständige Übernahme zu früh behauptet | Einzelfall | Ein erster belegter Abgleich dieses Boards; keine wiederholte Fehlergruppe | Nacharbeit in T-65 bei `claude-coder`; keine neue Lesson |
| Befund 2 · Aktuelle Startbeispiele und STATUS widersprechen sich | Vorhandene Lesson angewendet | [SP-CX-02](../.agents/lessons/SP-CX-02-entscheidungen-in-allen-aktuellen-aussagen-nachziehen.md), Stand 2026-09-30: aktuelle Anweisungen gegen wirksamen Zustand halten | Nacharbeit in T-65 bei `claude-coder`; Mikes Kennungsentscheidung bleibt offen |

## Nacharbeit zu Runde 1

`claude-coder`, 2026-10-01.

**Befund 1 · Kurze Paketeinstiege.** Die vier gemeinsamen Verträge sind jetzt
kurze lokale Einstiege nach `references/board-setup.md`: Paketpfad mit
XDG-Regel, `VERSION`-Prüfung, Verweis auf die gleichnamige Datei unter
`templates/board/.agents/`, Meldung bei fehlendem Paket. Jede bisherige
Überschrift bleibt als Sprungziel und nennt den passenden Paketabschnitt;
darunter stehen nur lokale Entscheidungen.

| Datei | Zeilen vorher → nachher | Erhaltene lokale Inhalte |
|---|---|---|
| `AGENT-WORKFLOW.md` | 259 → 98 | Übernahmestand und Abweichungen; README/STATUS/Ticket lesen, Ticketvorlage, `code-standards`; ACTIVITY lokal mit `.gitignore` (Mike, 2026-09-28), Grenze 50; Statusordner und Worktree-Praxis; Pflichtprüfungen aus AGENTS.md, sichtbare Browsertests, Lessons-Linkeinstiege; sofortige Integration samt Push (Mike, 2026-09-27) und Endabnahme der Kette T-60–T-64; Lessons-Pflege durch den Observer (Mike, 2026-09-10); Observer-Koordination (Mike, 2026-09-11), Fünf-Minuten-Takt, Filecheck |
| `AGENT-ACTIVATION.md` | 154 → 92 | Startzeilen mit den STATUS-Kennungen; Board-Pfad im Worktree; Abgleich mit der STATUS-Kopie im Hauptverzeichnis; Shortcut-Abweichung samt Zusatzschritt; Lessons-Pflege im Observer-Durchlauf; Wiedereinstieg nach `/clear` |
| `CODEX-IN-CONTEXT-SCHEDULER.md` | 107 → 48 | Kennung exakt wie STATUS; lokaler Filecheck vollständig; Fünf-Minuten-Takt |
| `LESSONS-ACCESS.md` | 134 → 57 | Inventarpflicht für `lessons/`, eingefrorene Linkeinstiege, `subject_author`; ID-Präfix `SP-` (bisher `SP-CX-`, `SP-R-`, als Beobachtung, nicht als neue Regel); Abschnitt „Lokale Einordnung · StockPortfolio“ unverändert |

**Gegenprobe, dass nichts verloren geht:** Markante allgemeine Regeln der
alten Fassungen gegen die Paketverträge gesucht (u. a. Abnahmestufe,
Nur-Lese, Produktdateien, technische Freigabe, Prüferidentität, zwei Belege,
Kontextneustart, `CronDelete`, sieben Tage, `yield_control`, 300 Sekunden,
Compaction, `subject_author`, `core.precomposeUnicode`, `needs_review`). Alle
stehen im Paket; „Rollenwechsel erhalten offene Befunde“ und „keine
Mailbox-Historie“ sinngleich („offene Befunde und Runden erhalten“, „keine
zweite Historie neben Git“).

**Befund 2 · Startbeispiele.** `AGENT-ACTIVATION.md` startet jetzt mit
`codex-verifier`, `codex-observer` und `claude-coder`, mit Board-Pfad im
Worktree. Gegen den installierten Launcher geprüft: Dessen Prompt beginnt mit
„Du bist codex“ beziehungsweise „claude“ und verlangt bei fehlender exakter
Zuordnung den Abbruch ohne Scheduler. Der dokumentierte Weg (c) beschreibt
genau das: Nach `codex-verifier` oder `claude-coder` meldet die Instanz den
Konflikt; danach im selben Chat die Startzeile mit der STATUS-Kennung senden.
So lief heute der Start dieser Coder-Instanz. Mikes dauerhafte Entscheidung
(a/b/c) bleibt offen.

**Prüfungen:** Linkprüfung über alle versionierten Markdown-Dateien außerhalb
von `40-done/` mit Verweisen von oder zu den vier Einstiegen: ohne Befund.
Keine Produktänderung; `make test` daher nicht erneut, letzter Lauf in Runde 1
(829 + 20). `git diff --check` ohne Befund.

**Lessons-Einordnung:** Übernommen wie vom Verifier eingeordnet (Befund 1
Einzelfall, Befund 2 SP-CX-02 angewendet). Keine neue Lesson.

