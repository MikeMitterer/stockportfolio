---
schema_version: 1
id: SP-CX-01
project: stockportfolio
kind: pattern
discovery_phase: mixed
affected_work:
- implementation
- documentation
- observation
subject_author: codex
discovered_by: unknown
recorded_by: unknown
structured_by: codex
prevention_roles:
- implementer
- reviewer
provenance:
  project: stockportfolio
  file: _tickets/.agents/CODEX-LESSONS.md
  heading: Einfache Startbefehle nicht zu einem eigenen System ausbauen
  revision: 85d6472f4848dc71f78ac1d99dce01ec7fd35d88
  file_sha256: 32d9229e032e8200fe711c1fc3a2b6a8a5b062562bab0e3ba39474a545cf5422
  section_sha256: 3ed540aa15cad602c5600513180db68710a5b076e2ad256ec97ed2248f878616
  captured_at: '2026-09-11'
---

# SP-CX-01 · Einfache Startbefehle nicht zu einem eigenen System ausbauen

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

Aktuelle Verwendung: [Observer-Shortcuts](../AGENT-ACTIVATION.md#observer-shortcuts-im-terminal).

**Implementer-Regel:** Vorhandene CLI direkt aufrufen; jede zusätzliche
Komponente mit einem konkreten Bedarf begründen.
Wiederkehrende eigene Hilfschecks einmal als lokale Datei ablegen und danach
kurz aufrufen. Den vollständigen Quelltext nicht in jedem Tool-Aufruf erneut
übertragen. Eine spätere allgemeine Wiederverwendung ist eine eigene Entscheidung.
**Verifier-Prüfung:** Den gesamten Lösungsumfang am Auftrag messen und die
Portabilität der Startbefehle aus einem zweiten Verzeichnis prüfen.

**Ergänzender lokaler Beleg · eigener Observer, 2026-09-10:** Der Filecheck war
einmal in Zelle `99` definiert, wurde jedoch bei jedem Takt als vollständiger
`python3 -c`-Befehl an das Werkzeug übertragen. Mike verlangte die Ablage in
`.agents/bin`, um wiederholte Quelltextübertragung und unnötigen Tokenverbrauch
zu vermeiden. Daraufhin nach `.agents/bin/observer-filecheck.py` ausgelagert;
der Scheduler verwendet den kurzen Dateiaufruf. Keine erneute KI-Generierung
je Takt behaupten: Wiederholt wurde hier die Übertragung desselben Codes.
