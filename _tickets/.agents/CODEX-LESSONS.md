# Erfahrungen aus Codex-Arbeit · StockPortfolio

Die Sammlung betrifft die Autorenschaft geprüfter Arbeit, nicht die aktuelle
Coder-/Verifier-Rolle. Für die Aufnahme gelten die
[Belegregeln](AGENT-WORKFLOW.md#belegte-erfahrungen).

## Einfache Startbefehle nicht zu einem eigenen System ausbauen

**Erkennungsregel:** Gewünscht sind kurze Aufrufe vorhandener Werkzeuge;
die Lösung führt dafür eine weitere Laufzeit, Argumentparser, Prozesssperren,
Sprachkataloge oder eine eigene Testsuite ein. Die Zusatzmechanik löst
Anforderungen, die nicht beauftragt wurden. Auch globale Shortcuts, deren
Symlinks in ein einzelnes Projekt zeigen, sind ein Warnsignal.

**Prüffrage vor der Umsetzung:** Erfüllen wenige direkte Shell-Aufrufe den
Auftrag vollständig? Welche zusätzliche Mechanik ist konkret erforderlich?
Kann derselbe Befehl ohne Codekopie und ohne festen Projektpfad in einem
anderen Projekt verwendet werden?

**Konsequenz:** Mit der kleinsten vollständigen Lösung beginnen. Für die
Observer genügen zwei eigenständige Bash-Dateien in `~/.local/bin/`, jeweils
mit einer `exec`-Zeile plus Shebang. Die Agenten lesen die Regeln des aktuellen
Boards. Vorhandene CLI-Funktionen verwenden; zusätzliche Infrastruktur nur
für einen belegten Bedarf ergänzen. Prüfaufwand an der tatsächlichen Lösung
ausrichten. Eine Dateistruktur mit Platzhaltern nicht als vollständige
Einrichtung melden.

**Belege · 2026-09-10:**

- Codex baute für `codex-observer` und `claude-observer` einen Python-Launcher
  samt Parser, Prozesssperre, Promptdatei, Sprachkatalog und zehn Tests.
  Mike: „Poah - ich dachte das wird ein Bash-Einzeiler. Wozu die riesen action
  mit Python-Script usw?“
- Die globalen Befehle waren zusätzlich mit StockPortfolios `.agents/bin/`
  verknüpft. Mike: „Abgesehen davon - Portabilität ist was anderes.“ Die
  Lösung wurde daraufhin auf zwei direkt installierte, projektunabhängige
  Bash-Einzeiler reduziert; der Launcher wurde aus dem Projekt entfernt.
- Mike ordnete die Aufnahme ausdrücklich an: „Das Problem kannst du gleich
  in Codex-Lessons festhalten - absolute Over-Construction“.

Aktuelle Verwendung: [Observer-Shortcuts](AGENT-ACTIVATION.md#observer-shortcuts-im-terminal).
