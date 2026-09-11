# T-42 · Tätigkeiten aller Instanzen kurz sichtbar halten

Die bisherige ACTIVITY-Regel ersetzt bei jeder Meldung den einzigen Eintrag.
Dadurch verschwand Codex' Tätigkeit, als Claude seinen Stand meldete. Mike will
sehen, wer gerade was macht: kurze Meldungen mit der neuesten oben.

**Direktauftrag an `codex-observer`, 2026-09-11:** Regeln projektübergreifend im
Tickets-Skill festhalten und einen globalen Schreibhelfer bereitstellen.
Mike: „Das mit dem Script um activity.md zu schreiben ist von mir aus ok“;
„Es soll für alle Projekte verfügbar sein - keine Kopie“;
„In .agents/bin funktioniert das nicht - das Script muss bei StockInfo und
bei StockPortfolio funktionieren und keine Kopie sein“.

**Stand:** Globaler Helfer installiert und geprüft; zentrale und lokale Regeln
sind aktualisiert. Keine menschliche Entscheidung zur Umsetzung
offen. Eine spätere Abschlussabnahme bleibt getrennt.

Dies ist der ausdrücklich beauftragte Observer-Anteil am Board-Werkzeug.
Er erweitert weder den AgentLessons-Auftrag T-41 noch dessen abgeschlossene Runde 2
und weist die dortigen Arbeitsrollen nicht neu zu.

## Vereinbarter Umfang

- Ein globaler CLI-Einstieg `~/.local/bin/agent-activity` als Symlink auf die
  einzige Quelle `task-verification-workflow/assets/agent-activity` in
  PersonalSkills. Keine Projektkopien. Nächstes Board ab Arbeitsverzeichnis.
- Je Eintrag eine Zeile: Zeitpunkt mit Zeitzone, eigene Instanzkennung,
  ein bis zwei kurze Sätze. Neue Einträge oben, ältere erhalten; Standard
  letzte 50, über `-k N` beziehungsweise `--keep N` einstellbar.
- Alle Rollen schreiben ihre eigene Tätigkeit. Agenten lesen ACTIVITY nicht
  als Kontext oder Auftrag; nur der Helfer liest intern zum Erhalten der
  Einträge. Keine periodischen Leermeldungen. Fehlende ACTIVITY wird angelegt.
- Sperre für gleichzeitige Aufrufe und atomarer Dateiersatz. Bei Fehler bleibt
  die bestehende Datei erhalten. Ein harter Prozessabbruch kann eine Sperre
  hinterlassen; Prüfung und manuelle Entfernung sind dokumentiert.
- Skill-Einstieg, Vorlagen, Übernahmeanleitung, Rollen-Launcher und lokale
  Board-Regeln folgen `2026-09-11-activity-feed`. Bestehende Projekte übernehmen
  gezielt beim nächsten Board-Einstieg; kein Überschreiben anderer Boards.

## Technische Verify-Matrix

| # | Prüfung | Nachweis | AI |
|---|---|---|---|
| 1 | Ein Helfer, zwei Boards, Aufruf aus Unterordnern mit Leerzeichen | Temporäre Boards getrennt beschrieben; derselbe globale PATH-Link aus StockInfo und StockPortfolio aufrufbar | ✅ |
| 2 | Neue Meldung oben, andere Instanz erhalten, Grenze N | Testscript: Reihenfolge und `--keep 3` / `-k 1` bestanden | ✅ |
| 3 | Gleichzeitige Aufrufe | 30 parallele Prozesse, 30 unterschiedliche Meldungen je genau einmal erhalten | ✅ |
| 4 | Fehler ohne Datenverlust | Ungültige Argumente, fehlendes/defektes Board, Datei-Symlink, belegte Sperre, Werkzeugfehler sowie INT/TERM/HUP beim Sperrerwerb geprüft | ✅ |
| 5 | Syntax, ShellCheck, Regeln und Installation | Bash-Syntax, ShellCheck, neue Linkziele/Anker und acht Launcher-Fälle bestanden; tatsächliche Installation geprüft | ✅ |

Reproduzierbare Prüfungen (#1–5):

```bash
bash /tmp/agent-activity-update/test-activity.sh ~/.local/bin/agent-activity
bash /tmp/agent-activity-update/test-failures.sh ~/.local/bin/agent-activity
bash -n ~/.local/bin/agent-activity
shellcheck ~/.local/bin/agent-activity ~/.local/bin/agent-session.sh
```

Unabhängige Gegenprüfung durch `skill_consistency`: INT/TERM/HUP exakt beim
Sperrerwerb, TERM während fremder Sperre, Fehler von mktemp/date/awk/chmod/mv,
getrennte Testboards über einen einzigen PATH-Symlink. Alle bestanden.
Der ursprüngliche Test scheiterte vor der Implementierung am fehlenden Helfer.
Zwei während der Durchsicht gefundene Fehler (Signal zwischen mkdir und
Besitzmarkierung, verdeckter date-Fehler) sind korrigiert und nachgeprüft.
Die Tests verwenden ausschließlich temporäre Boards. Keine fiktiven Meldungen
in StockInfo oder StockPortfolio. Reale Board-Schreibrechte und Rollen werden
durch den globalen Befehl nicht erweitert.

**Doku-Abgleich:** Lokaler Projekteinstieg, Board-README, Workflow und Aktivierung;
im Tickets-Skill Einstieg, Board-Vorlagen, Übernahmeanleitung, Einrichtung und
Startprompt. Produktanleitungen sind unbetroffen: keine Änderung der App,
ihrer API-Verträge oder Installation.

Zentrale Quelle und Regeln: PersonalSkills-Commit `9eb87b5`. Globaler
CLI-Link zeigt direkt auf diese Quelle; installierter Rollen-Launcher stimmt
mit seiner Skill-Quelle überein. StockInfo und StockPortfolio lösen denselben
Befehl auf. StockInfo-Boarddateien werden durch diese Bereitstellung nicht
automatisch migriert; die Übernahmeanleitung im Skill gilt beim nächsten Einstieg.
