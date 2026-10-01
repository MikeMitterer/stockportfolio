# Ein Ticket anlegen

Die aktuelle Vorlage liegt im gemeinsamen Paket unter
`${XDG_DATA_HOME:-$HOME/.local/share}/agent-workflow/current/templates/ticket.md`.
Bei leerem XDG-Wert gilt der Home-Standard; relative Werte sind ungültig.
Vor dem Anlegen `current/VERSION` und `current/references/ticket-format.md`
lesen. Die Vorlagendatei als neues Ticket in `10-backlog/` übernehmen, eine
freie Ticketnummer und einen sprechenden Dateinamen wählen und alle Felder
für den konkreten Auftrag ausfüllen. Die Vorlage enthält die Lessons-Einordnung.

Ein neues Backlog-Ticket aktiviert keine Arbeit. Beauftragung, Rollen und
Übergabe stehen in [STATUS](../STATUS.md) und im
[Workflow](AGENT-WORKFLOW.md). Nur eingeplante Tickets werden nach Ready und
bei ausdrücklicher Aktivierung nach Doing verschoben.
