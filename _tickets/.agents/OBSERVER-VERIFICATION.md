# Observer-Start · vereinfachte Fassung vom 2026-09-10

Die Shortcuts liegen als eigenständige Dateien direkt in `~/.local/bin/`,
ohne Projektpfad oder Projektsymlink. Sie bestehen aus je einer
Bash-`exec`-Zeile plus Shebang.
Sie geben Instanzkennung und Startauftrag an die vorhandene CLI weiter.
Rollenprüfung und Scheduler-Verhalten stehen in den Agentenregeln.
Die früheren Launcher-Optionen und die Prozesssperre sind entfallen.

Die Einzeiler werden mit ShellCheck sowie CLI-Doubles aus Bash und Zsh
auf Argumentübergabe, Arbeitsverzeichnis und Exit-Code geprüft.
Ein fortlaufender Timerbetrieb und `/clear` sind nicht live nachgewiesen.

## Historie · abgelöster Python-Launcher

Die folgenden Nachweise betreffen ausschließlich die vorherige Fassung.
Die damaligen Testbefehle und Zusatzoptionen sind nicht mehr aktuell.

<details>
<summary>Frühere Prüfnachweise, kein aktueller Startauftrag</summary>

# Observer-Einrichtung · Prüfnachweise vom 2026-09-10

Die Observer-Rolle, beide Aktivierungswege und die Bash-/Zsh-Shortcuts sind
eingerichtet. Die echten CLIs haben jeweils einen einzelnen Observer-Durchlauf
auf einem isolierten Testboard ausgeführt. **Ein fortlaufender Fünf-Minuten-Lauf
und automatischer Identitätserhalt nach `/clear` sind damit nicht nachgewiesen.**
Der dokumentierte Wiedereinstieg beendet die CLI und startet denselben Shortcut neu.

## Technische Nachweise

| # | Prüfung | Ergebnis | AI |
|---|---|---|:--:|
| 1 | Zehn Prozessgrenzen-Tests mit lokalen CLI-Doubles | Namen, CWD, Argumentgrenzen, Zusatzanweisungen, Exit-Code, Rollenabweisung, historische/doppelte Zustandsfelder, Prozesssperre, Hilfe, Einzeldurchlauf und Bash/Zsh-Aufruf geprüft | ✅ |
| 2 | Installierte Shortcuts in Bash und Zsh sowie ShellCheck | Beide Namen werden unter `~/.local/bin/` aufgelöst; Hilfe aufrufbar, Wrapper ohne ShellCheck-Befund | ✅ |
| 3 | Codex CLI 0.154.0, echter Einzeldurchlauf | `codex-observer` liest seine Zuordnung, erkennt das leere Testboard und fehlende Testreferenzen; beendet ohne Scheduler, Exit 0 | ✅ |
| 4 | Claude Code 2.1.236, echter Einzeldurchlauf | `claude-observer` prüft seine Zuordnung und meldet belegte Testboard-Hinweise; beendet ohne Scheduler, Exit 0. Umgebungsvariable war in der nichtinteraktiven Sitzung nicht freigegeben; Kennung aus Startprompt und STATUS korrekt geprüft | ⚠️ |
| 5 | Dauerbetrieb, Rollenwechsel während eines echten Timers und `/clear` | Verträge und Stop-/Neustartweg vorhanden; kein vollständiger Live-Lauf dieser Lebenszyklusfälle | ➖ |

Die CLI-Doubles prüfen nur den Launcher, nicht das Verhalten eines Modells.
Codex und Claude wurden zusätzlich real auf getrennten Testboards unter
`/tmp/stockportfolio-observer-live` und `/tmp/stockportfolio-observer-claude-live`
gestartet. Ein Modellurteil ersetzt keine technische Garantie der Rollenbegrenzung.

Die Shell-Sandbox verhinderte zunächst Codex' lokalen App-Server und Claudes
Zugriff auf seine Anmeldung. Die Wiederholungen mit genehmigtem Zugriff liefen
erfolgreich. Es wurden keine Produktinstanzen oder fremden Agenten beendet.

## Prüfungen wiederholen

Im StockPortfolio-Projektroot ausführen:

```bash
python3 _tickets/.agents/bin/test_observer_start.py  # #1
bash -c 'codex-observer --help'                    # #2
zsh -c 'claude-observer --help'                    # #2
shellcheck _tickets/.agents/bin/observer-start.sh  # #2
```

Einen echten einmaligen Observer-Lauf im eigenen Projekt starten:

```bash
codex-observer --observer-once  # #3, setzt observer: codex-observer voraus
claude-observer --observer-once # #4, setzt observer: claude-observer voraus
```

Die beiden Befehle sind Alternativen entsprechend der Rollenquelle, keine
Aufforderung, beide gleichzeitig demselben Board zuzuordnen. Der normale
Shortcut ohne `--observer-once` beauftragt den jeweiligen Scheduler.

</details>
