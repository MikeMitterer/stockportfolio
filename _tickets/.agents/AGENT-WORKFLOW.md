# Coder-/Verifier-Workflow · StockPortfolio

**Diese Datei ist ein kurzer Einstieg.** Der gemeinsame Vertrag für Coder,
Verifier und Observer liegt im installierten Paket:
`${XDG_DATA_HOME:-$HOME/.local/share}/agent-workflow/current/templates/board/.agents/AGENT-WORKFLOW.md`.
Ein leerer XDG-Wert verwendet den Home-Standard, ein relativer ist ungültig.
Vor jedem fachlichen Durchlauf `current/VERSION` prüfen und den Vertrag nach
einer Änderung neu lesen. Fehlt das Paket, das melden; keine ältere Kopie als
Ersatz verwenden. Rollen, Auftrag, Phase und Übergaben stehen ausschließlich
in [STATUS](../STATUS.md).

Hier stehen nur StockPortfolios lokale Entscheidungen und Ergänzungen. Die
Überschriften bleiben als Sprungziele bestehender Verweise erhalten; jede nennt
den passenden Abschnitt des Paketvertrags.

**Übernahmestand der Board-Konventionen: `2026-09-28-activity-local`.**
Am 2026-10-01 in [T-65](../40-done/T-65-board-konventionen-abgleichen.md)
übernommen: Paketeinstieg in `AGENTS.md`, `_tickets/.gitignore` für ACTIVITY,
Lessons-Einordnung, Rollen-Shortcuts, kurze Einstiege für Workflow,
Aktivierung, Codex-Scheduler und Lessons-Zugriff.
**Lokale Abweichungen:** Mikes dauerhafte Freigabe von Merge **und Push** nach
Ticketabschluss (AGENTS.md, 2026-09-27); die Rollenkennungen in STATUS
(`claude-coder`, `codex-verifier`) weichen von den Standardkennungen der
Shortcuts ab, siehe [Aktivierung](AGENT-ACTIVATION.md#rollen-shortcuts-im-terminal).

## Einstieg und Rollen

Paket: Abschnitt „Rollen und Arbeitsbeginn“.

Lokal: Vor fachlicher Arbeit [README](../README.md), STATUS und das Ticket
lesen. Neue Tickets folgen der [Ticketvorlage](TICKET-TEMPLATE.md); für
Produktcode gelten der Skill `code-standards` und die passenden Hausregeln.
Das Board wurde am 2026-09-10 aus StockInfo übernommen und wird seither
eigenständig geführt; keine Rollen oder Übergaben von dort übernehmen.

## Aktuelle Tätigkeit

Paket: Abschnitt „Aktuelle Tätigkeit“.

Lokal (Mike, 2026-09-28): `ACTIVITY.md` bleibt lokal und ist über
`_tickets/.gitignore` sowie weiterhin über die Root-`.gitignore` von Git
ausgenommen. Alle Schreiber verwenden die Vorgabe von 50 Einträgen.

## Ticketpfade und Arbeitsbeginn

Paket: Abschnitt „Rollen und Arbeitsbeginn“.

Lokal: Die sechs Statusordner `10-backlog` bis `90-rejected` ersetzen die
frühere Ablage im Root und in `solved/` ([Ablage](../README.md#ablage)).
Gearbeitet wird nur im Projekt-Root, ohne Worktrees; STATUS nennt im Feld
`branch` den dort ausgecheckten Ticketbranch. Vollständige Regel:
[AGENTS.md · Ein Arbeitsort](../../AGENTS.md#ein-arbeitsort-der-projekt-root)
(Mike, 2026-10-01).

## Übergabe und Review

Paket: Abschnitt „Umsetzung, Review und Abschluss“.

Lokal: Vor einer Übergabe laufen die Pflichtprüfungen aus
[AGENTS.md](../../AGENTS.md#bauen-und-prüfen) samt Doku-Abgleich; die
Ergebnisse stehen im Ticket. Browsertests laufen sichtbar. Die
Lessons-Linkeinstiege für die Autorenschaft sind
[Claude](CLAUDE-LESSONS.md) und [Codex](CODEX-LESSONS.md).

Lokal, **Review-Verlauf neueste Runde zuerst** (Mike, 2026-10-02; gilt, bis
das Paket es übernimmt:
[AgentLessons T-53](../../../../../DevKI/Production/AgentLessons/_tickets/20-ready/T-53-review-verlauf-neueste-runde-zuerst.md)).
Wer ein Ticket öffnet, liest zuerst die aktuelle Rückmeldung:

1. Oben bleibt der feste Kopf mit Warum, Beispiel, Stand, Arbeitsbereich und
   Akzeptanzkriterien. Der „Stand“ fasst den aktuellen Zustand zusammen.
2. Darunter steht `## Review-Verlauf (neueste Runde zuerst)`.
3. Jede neue Übergabe, Nacharbeit oder Verifier-Prüfung kommt **direkt unter
   diese Überschrift**, nie ans Dateiende; ihre Unterabschnitte bleiben in
   ihrer Runde.

Beispiel: Verifier-Prüfung · Runde 3 steht oben, Übergabe Runde 1 unten.
Überschriften bleiben unverändert, damit Links weiter gelten. Aktive Tickets
werden beim nächsten Anfassen umgestellt, Tickets in `40-done/` bleiben, wie
sie sind. Das Umstellen ändert weder Phase noch Owner noch Freigabestand.

## Abschluss und Mailbox

Paket: Abschnitte „Umsetzung, Review und Abschluss“ und „Mailbox und
Erfahrungen“.

Lokal: Nach technischer Freigabe und Mikes Abschluss werden die Änderungen
sofort committet, nach `master` gemergt und gepusht (AGENTS.md, Mike
2026-09-27). Die Kette T-60 bis T-64 nimmt Mike gesammelt am Ende ab; bis
dahin kein Abschluss, Merge oder Push dieser Tickets.

## Belegte Erfahrungen

Paket: Abschnitte „Mailbox und Erfahrungen“ und „Inhalt und Anwendung der
Lessons“.

Lokal: Lessons liegen einzeln unter [`lessons/`](lessons/); Zugriff und Pflege
nach [LESSONS-ACCESS](LESSONS-ACCESS.md). Belegte Fehlermuster pflegt der
Observer direkt in den Lessons (Mike, 2026-09-10: „Wenn du Fehlermuster
entdeckst - die gehören in die jeweiligen -Lessons.md-Files“).

### Lessons-Einordnung bei neuen Befunden

Paket: gleichnamiger Abschnitt.

Lokal: Die Einordnung steht im Ticket in der Tabelle „Lessons-Einordnung“ der
Ticketvorlage.

## Observer

Paket: Abschnitt „Observer“.

Lokal (Mike, 2026-09-11): Der Observer beaufsichtigt und koordiniert Coder
und Verifier und braucht dafür keine erneute Erlaubnis je Nachricht. Sein
Loop läuft im Abstand von fünf Minuten. Der Codex-Observer nutzt den
[lokalen Filecheck](CODEX-IN-CONTEXT-SCHEDULER.md#lokaler-filecheck).
