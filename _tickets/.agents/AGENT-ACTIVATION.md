# Agenten aktivieren · StockPortfolio

**Zwei Scheduler-Varianten stehen zur Verfügung:** Codex arbeitet mit einem
In-Context-Wartezyklus, Claude mit `/loop`. Beide lesen ihre Rollen aus
[STATUS.md](../STATUS.md). Der Observer hat einen eigenen Chat und prüft
`observer`, während Coder und Verifier `implementer`, `reviewer` und `owner` lesen.

Eine eingerichtete Startmöglichkeit ist noch kein laufender Timer. Beim Start
bestätigt die jeweilige Instanz den tatsächlichen Mechanismus und seine Kennung.

## Übersicht

- [Codex-Scheduler](#codex-scheduler)
- [Claude-Scheduler](#claude-scheduler)
- [Observer-Shortcuts im Terminal](#observer-shortcuts-im-terminal)
- [Observer-Durchlauf](#observer-durchlauf)
- [Stoppen und Wiedereinstieg](#stoppen-und-wiedereinstieg)

## Codex-Scheduler

Im vorgesehenen Codex-Arbeitschat eingeben. Die Instanzkennung zuvor eindeutig
benennen; `codex` ist der Standard für die normale Arbeitsinstanz.

```text
Deine Instanzkennung ist codex. Führe _tickets/.agents/CODEX-IN-CONTEXT-SCHEDULER.md aus.
```

Der [vollständige Vertrag](CODEX-IN-CONTEXT-SCHEDULER.md) beschreibt Startnachweis,
Fünf-Minuten-Takt, Rollenwahl, Deduplizierung, Stoppen und Wiederanlauf.
Er unterscheidet die App-Werkzeuge `notify`/`yield_control` von der Codex-CLI:
Fehlen diese, wartet die CLI im selben aktiven Turn mit ihren vorhandenen
Shell-Prozesswerkzeugen. Sie behauptet keine im Hintergrund fortlaufende Zelle.

Im separaten Codex-Observer-Chat funktioniert entsprechend:

```text
Deine Instanzkennung ist codex-observer. Führe _tickets/.agents/CODEX-IN-CONTEXT-SCHEDULER.md aus.
```

## Claude-Scheduler

Im vorgesehenen Claude-Arbeitschat eingeben, nachdem die eigene Kennung
zugeordnet ist. Vorher mit `CronList` prüfen, ob dieser Board-Job bereits läuft.

```text
/loop 5m Deine Instanzkennung ist claude. Lies _tickets/.agents/AGENT-ACTIVATION.md und führe einmal den Abschnitt „Arbeitsdurchlauf“ aus.
```

Im eigenen Claude-Observer-Chat bei `observer: claude-observer` verwenden:

```text
/loop 5m Deine Instanzkennung ist claude-observer. Lies _tickets/.agents/AGENT-ACTIVATION.md und führe einmal den Abschnitt „Observer-Durchlauf“ aus.
```

Beim Start aus einem normalen CLI-Prompt richtet Claude denselben Auftrag mit
`CronCreate`, `cron: */5 * * * *`, `recurring: true` ein. Der Jobprompt enthält
die vollständige Instanzkennung und den absoluten Board-Pfad. Kein verschachteltes
`/loop` im Tick: Jeder Tick führt genau einen Durchlauf aus. Job-ID bestätigen
und unmittelbar einen ersten Durchlauf ausführen. Ohne verfügbare Cron-Werkzeuge
den fehlenden Start melden, keinen Timer behaupten.

Claude führt Jobs zwischen Turns aus; der Takt kann sich verzögern. Wiederkehrende
Jobs laufen nach sieben Tagen ab. Der eigene Job wird über `CronDelete` mit
seiner ID beendet; andere Jobs bleiben bestehen.
[Quelle: Claude Scheduled Tasks](https://code.claude.com/docs/en/scheduled-tasks).

### Arbeitsdurchlauf

1. Nur den aktuellen Zustandsblock aus STATUS lesen; vollständige Kennungen
   gegen eigene Rolle und Owner prüfen. Bei fremdem Owner oder inaktivem Zustand
   endet der Durchlauf ohne Dateiänderung.
2. Coder: `implementing`, `changes_requested` oder eine zu verarbeitende
   Freigabe `approved`. Verifier: `ready_for_review` beziehungsweise eine
   bereits begonnene eigene Prüfung. Ein abgeschlossenes Review nicht wiederholen.
3. Aktives Ticket unter `30-doing/`, Übereinstimmung mit `priority_ticket` und
   Mitgliedschaft in `priority_chain` prüfen. Bei Widerspruch Konflikt melden.
4. Ticket, [gemeinsamen Workflow](AGENT-WORKFLOW.md) und passende Hausregeln
   lesen. Ausschließlich den fälligen Schritt der eigenen Rolle ausführen.
   Eine technische Freigabe startet keine erneute Implementierung.
5. Die eigene Tätigkeit nach [Workflow](AGENT-WORKFLOW.md#aktuelle-tätigkeit)
   in ACTIVITY festhalten; ein unveränderter Leerdurchlauf braucht keine Meldung.

## Observer-Shortcuts im Terminal

Die beiden Befehle sind eigenständige Bash-Dateien direkt in `~/.local/bin/`,
jeweils mit einer `exec`-Zeile plus Shebang. Sie enthalten keinen festen
Projektpfad und sind keine Symlinks in StockPortfolio. Dieselben Befehle
funktionieren aus jedem Projekt mit passender Board-Zuordnung und
Observer-Anleitung, etwa StockPortfolio oder StockInfo. Es wird kein
Launcher-Code in die Projekte kopiert.

Aus dem Projektverzeichnis oder einem Unterordner aufrufen:

```bash
codex-observer
claude-observer
```

Die Zeile startet die CLI mit ihrer Instanzkennung und dem Auftrag, die
Board-Regeln zu lesen und den passenden Observer-Scheduler zu starten.
Der Agent prüft die Zuordnung in STATUS vor der Beobachtung und bei jedem
Durchlauf. Der Bash-Befehl selbst liest oder verändert STATUS nicht.

Zusätzliche CLI-Optionen werden durch `"$@"` weitergereicht. Arbeitsverzeichnis,
Exit-Code und vorhandene CLI-Konfiguration bleiben erhalten. Die Shortcuts
haben keine eigenen Optionen und keine Prozesssperre; vorhandene eigene
Scheduler werden nach den Regeln oben durch die Agenten geprüft.

Für den Wechsel den bisherigen Observer beenden, `observer` in STATUS auf
die neue Kennung setzen und deren Shortcut starten. Keine zweite Instanz
mit derselben Kennung parallel starten.

## Observer-Durchlauf

1. Eigene vollständige Kennung mit dem aktuellen `observer` vergleichen.
   Kein Vergleich mit einem historischen Kontextabsatz. Bei Rollenwechsel,
   fehlendem Feld oder Kollision den eigenen Scheduler beenden.
2. Unabhängig vom Owner den Stand seit dem letzten Durchlauf prüfen:
   STATUS, ACTIVITY, Ticketablage, `.agents/`, Git-Stand und relevante Dokumentationsänderungen.
   Ohne relevante Änderung endet der fachliche Durchlauf.
3. Die betroffenen Inhalte nach dem Abschnitt [Observer](AGENT-WORKFLOW.md#observer)
   lesen. Bei Bedarf Coder und Verifier über INBOX beziehungsweise OUTBOX
   koordinieren; Fassung, Beleg und erwartete Handlung nennen. Wesentliche
   Hinweise und Eingriffe im eigenen Chat melden; bekannte unveränderte
   Hinweise nicht wiederholen. Dauerhafte Entscheidungen ins Ticket aufnehmen.
   Belegte Fehlermuster nach dem dort beschriebenen Auftrag direkt in der
   passenden Lessons-Datei erfassen, konkrete Vorbeugungsregeln für Implementer
   und Gegenproben für Verifier formulieren und die Ergänzung im Chat nennen.
4. Den zuletzt beobachteten Stand und gemeldete Hinweise im eigenen Chatkontext
   behalten. Koordination nach dem Workflow; keine Produktdateien oder
   Rollen-/Übergabefelder verändern.

## Stoppen und Wiedereinstieg

Claude: den eigenen Job über `CronDelete` löschen und das Ergebnis prüfen.
Codex: die eigene Wartezelle beenden beziehungsweise den CLI-Wartezyklus
unterbrechen. Nur den eigenen Warteprozess stoppen. Anschließend kann die
Observer-CLI beendet werden.

**Vor `/clear` den Scheduler beenden.** Nach `/clear` oder verlorenem Kontext
die CLI beenden und denselben Observer-Shortcut erneut starten. Das gibt die
Kennung und den aktuellen Auftrag erneut mit. Eine allein im ersten Prompt
genannte Identität wird nicht als automatisch nach `/clear` erhalten zugesagt.

Bei Sitzungsfortsetzung zunächst vorhandene Jobs beziehungsweise Zellen
prüfen. Nie allein wegen einer Wiederaufnahme einen zweiten Loop anlegen.
Ein fehlender Observer hält Coder und Verifier nicht auf.
