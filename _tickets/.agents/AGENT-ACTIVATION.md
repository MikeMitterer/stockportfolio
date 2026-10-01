# Agenten aktivieren · StockPortfolio

**Diese Datei ist ein kurzer Einstieg.** Der gemeinsame Vertrag für
Scheduler, Arbeits- und Observer-Durchlauf liegt im installierten Paket:
`${XDG_DATA_HOME:-$HOME/.local/share}/agent-workflow/current/templates/board/.agents/AGENT-ACTIVATION.md`.
Vor jedem fachlichen Durchlauf `current/VERSION` prüfen und den Vertrag nach
einer Änderung neu lesen. Fehlt das Paket, das melden. Rollen stehen in
[STATUS](../STATUS.md); fachliche Regeln im [Workflow](AGENT-WORKFLOW.md).

Hier stehen die konkreten Startbefehle für StockPortfolio und die lokalen
Abweichungen. Die Überschriften bleiben als Sprungziele erhalten.

## Übersicht

- [Codex-Scheduler](#codex-scheduler)
- [Claude-Scheduler](#claude-scheduler)
- [Rollen-Shortcuts im Terminal](#rollen-shortcuts-im-terminal)
- [Observer-Durchlauf](#observer-durchlauf)
- [Stoppen und Wiedereinstieg](#stoppen-und-wiedereinstieg)

**Aktueller Board-Pfad:** `/private/tmp/stockportfolio-t65/_tickets` (Worktree des aktiven Tickets T-65).
Maßgeblich ist der Worktree, den [STATUS](../STATUS.md) unter „Aktuelle
Arbeit“ nennt. Die Startzeilen unten nennen diesen Pfad absolut; ein Start
nur mit relativem Pfad aus dem Projektroot fände dort ein anderes Board ohne
das aktive Ticket. Wer ein Ticket in einem neuen Worktree aktiviert, ersetzt
den Pfad in allen Startzeilen dieser Datei im selben Commit.

**Kennungen in StockPortfolio** (Mike, 2026-10-01): Coder `claude-coder`,
Verifier `codex-verifier`, Observer `codex-observer`. Maßgeblich ist immer
STATUS; bei einer Änderung dort gelten die Beispiele unten mit der neuen
Kennung. Ob Kennungen oder Shortcuts dauerhaft angeglichen werden, entscheidet
Mike ([T-65](../30-doing/T-65-board-konventionen-abgleichen.md)).

## Codex-Scheduler

Paket: Abschnitt „Codex-Scheduler“; Vertrag im
[Codex-Einstieg](CODEX-IN-CONTEXT-SCHEDULER.md).

Im Codex-Chat des Verifiers beziehungsweise Observers eingeben:

```text
Deine Instanzkennung ist codex-verifier. Board: /private/tmp/stockportfolio-t65/_tickets. Führe /private/tmp/stockportfolio-t65/_tickets/.agents/CODEX-IN-CONTEXT-SCHEDULER.md aus.
```

```text
Deine Instanzkennung ist codex-observer. Board: /private/tmp/stockportfolio-t65/_tickets. Führe /private/tmp/stockportfolio-t65/_tickets/.agents/CODEX-IN-CONTEXT-SCHEDULER.md aus.
```

## Claude-Scheduler

Paket: Abschnitt „Claude-Scheduler“.

Im Claude-Chat des Coders eingeben; vorher mit `CronList` prüfen, ob der
Board-Job bereits läuft:

```text
/loop 5m Deine Instanzkennung ist claude-coder. Board: /private/tmp/stockportfolio-t65/_tickets. Lies /private/tmp/stockportfolio-t65/_tickets/.agents/AGENT-ACTIVATION.md und führe einmal den Abschnitt „Arbeitsdurchlauf“ aus.
```

Beim Start aus einem normalen Prompt richtet Claude denselben Auftrag per
`CronCreate` (`*/5 * * * *`, wiederkehrend) mit vollständiger Kennung und
absolutem Board-Pfad ein und führt sofort einen ersten Durchlauf aus.

### Arbeitsdurchlauf

Paket: gleichnamiger Abschnitt. Lokal zusätzlich: Prüfen, dass die STATUS-Kopie
im Hauptverzeichnis dieselbe Zuordnung zeigt wie das Board im Worktree.

## Rollen-Shortcuts im Terminal

Paket: gleichnamiger Abschnitt. Die acht Befehle (`codex-`/`claude-` mit
`observer`, `verifier`, `coder`, `neutral`) sind Symlinks auf
`~/.local/bin/agent-session.sh`; Farben in `~/.local/bin/.agent-session.conf.sh`.

**Lokale Abweichung · Kennung nach einem Shortcut-Start.** Die Shortcuts geben
Coder und Verifier die Kennung `codex` beziehungsweise `claude`; nur Observer
erhalten `-observer`. In StockPortfolio passen deshalb nur `codex-observer`
und `claude-observer` direkt. Nach `claude-coder` oder `codex-verifier` meldet
die Instanz zunächst einen Zuordnungskonflikt und startet keinen Scheduler.
Dann im selben Chat die vollständige Startzeile aus
[Codex-Scheduler](#codex-scheduler) beziehungsweise
[Claude-Scheduler](#claude-scheduler) mit der STATUS-Kennung senden. Die
Rollenfarbe des Shortcuts bleibt erhalten.

Für einen Rollenwechsel die bisherige Instanz beenden, die Kennung in STATUS
setzen und die neue Instanz starten. Keine zweite Instanz mit derselben
Kennung parallel starten.

## Observer-Durchlauf

Paket: gleichnamiger Abschnitt. Lokal: Belegte Fehlermuster pflegt der Observer
direkt in den Lessons ([Workflow](AGENT-WORKFLOW.md#belegte-erfahrungen)).

## Stoppen und Wiedereinstieg

Paket: gleichnamiger Abschnitt. Lokal: Nach `/clear` die Startzeile mit der
STATUS-Kennung erneut senden; eine nur im ersten Prompt genannte Kennung gilt
danach nicht als erhalten.
