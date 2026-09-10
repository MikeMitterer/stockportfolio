# Coder-/Verifier-Workflow

Die Rollen und der aktive Auftrag stehen ausschließlich in
[STATUS.md](../STATUS.md). Dieser Vertrag gilt für StockPortfolio;
die Umstellung des Boards aktiviert keine Umsetzung und keinen Review.

Ein optionaler Observer ist eine dritte, eigenständige Instanz. Seine Zuordnung
steht im Feld `observer` derselben STATUS-Datei; sein Auftrag ist unten definiert.

## Einstieg und Rollen

Vor fachlicher Arbeit [README.md](../README.md), STATUS und das betreffende
Ticket lesen. Die sechs Statusordner ersetzen die frühere Ablage im Root
und in `solved/`. Bei Änderungen Links und Begleitdateien mitführen.
Für Ticketformate gilt `task-verification-workflow`, für Produktcode
`code-standards` samt den zur Aufgabe passenden Hausregeln.

`implementer` bezeichnet den Coder, `reviewer` den unabhängigen Verifier und
`owner` die aktuell zuständige Instanz. Rolle und Produktname sind getrennt.
Der Autor kann seine eigene Fassung nicht unabhängig abnehmen. Eine nicht
zugeordnete Rolle oder inaktive Phase erzeugt keinen Arbeitsauftrag.

## Ticketpfade und Arbeitsbeginn

Nur ausdrücklich eingeplante Arbeit aus `20-ready/` beginnen. Vor dem ersten
Produktedit Ticket und Begleitdateien nach `30-doing/` verschieben und
`ticket`, `priority_ticket`, `priority_chain`, Arbeitsphase und Owner setzen.
Diese Änderungen gehören in denselben Commit. Neue Tickets beginnen mit
Reviewrunde 0; vorhandene Nachweise und Runden bleiben erhalten.

Vor jedem Arbeitsschritt muss `30-doing/<ticket>` existieren und das Ticket
dem Prioritätsticket sowie einem Eintrag in der Prioritätskette entsprechen.
Bei widersprüchlichem Zustand den Konflikt melden und keine fachliche Arbeit
aus dem vermuteten Auftrag ableiten. Andere Doing-Tickets sind nicht automatisch
aktiv. Backlog, Done, Iced und Rejected starten keine Arbeit.

## Übergabe und Review

Der Coder bearbeitet den vereinbarten Umfang und dokumentiert prüfbare Belege
im Ticket. Vor der Übergabe die Sammlung zur eigenen Autorenschaft lesen:
[Claude](CLAUDE-LESSONS.md), [Codex](CODEX-LESSONS.md), bei gemischter Arbeit beide.
Vorhandene menschliche Antworten, Kennungen und historische Befunde erhalten.

Für einen ausdrücklich beauftragten unabhängigen Review den Produktstand
committen, die OUTBOX mit Umfang, Prüfungen und Einschränkungen füllen und
zuletzt `handoff_commit`, `review_round`, `phase: ready_for_review` und Owner
auf den Verifier setzen. Danach bleibt der Produktstand bis zum Review stabil.

Der Verifier liest das Ticket und die Sammlung des Autors, setzt `reviewing`
und prüft die übergebene Fassung. Er ändert keinen Produktcode, keine
Human-Antworten und keinen Archivstatus. Ergebnis und Belege kommen ins Ticket,
die knappe Rückgabe in die INBOX. Danach `approved` oder `changes_requested`
setzen und Owner an den Coder zurückgeben; verarbeitete OUTBOX entfernen.

Abgeschlossene Reviews werden anhand von Ticket, Übergabecommit, Runde und
Prüferidentität erkannt und nicht erneut ausgeführt. Rollenwechsel erhalten
offene Befunde und verbrauchte Runden. Die `last_reviewed_*`-Felder nach einem
abgeschlossenen Review aktualisieren; Prüferidentität im Ticket festhalten.

## Abschluss und Mailbox

Technische Freigabe, menschliche Abschlussentscheidung und offene Nacharbeit
auseinanderhalten. Vor Abschluss das ganze Ticket auf Widersprüche prüfen.
Erst nach den erforderlichen Prüfungen und der menschlichen Bestätigung
Ticket samt Begleitdateien nach `40-done/` verschieben. Eine nötige fehlende
Abnahme bleibt offen; keine Human-Antworten ergänzen.

Verarbeitete Nachrichten entfernen; Befunde bleiben im Ticket. Es gibt keine
Mailbox-Historie neben Git. Nach dem letzten Auftrag die aktiven Ticket- und
Prioritätsfelder leeren und `idle` setzen; die letzte Reviewreferenz erhalten.
Neue Arbeit braucht eine ausdrückliche Einplanung.

## Belegte Erfahrungen

Die Lessons-Dateien benennen die Autorenschaft untersuchter Arbeit, keine
festen Rollen. Ein Muster erst mit zwei Belegen oder bei einer ausdrücklich
falschen Vollständigkeitsbehauptung aufnehmen. Pro Eintrag Erkennungsregel,
Prüffrage und Belege nennen. Einzelne Fehler bleiben im Ticket.

## Observer

Der Observer betrachtet den Ticketablauf, widersprüchliche aktuelle Aussagen,
fehlende Übergaben, Unterschiede zwischen Dokumentation und belegtem Stand
sowie wiederkehrende Probleme über mehrere Tickets hinweg. Er unterstützt
Mike mit Hinweisen; technische Abnahme bleibt beim Verifier.

Seine vollständige Kennung steht in `observer` in STATUS. Sie muss von
`implementer`, `reviewer` und `owner` verschieden sein. Die Standardnamen für
Arbeitsinstanzen bleiben `codex` und `claude`; zusätzliche Instanzen erhalten
einen eindeutigen Zusatz. Ein Produktname allein bestimmt keine Rolle.

Der Observer liest unabhängig vom Owner und auch bei `phase: idle`. Vor jedem
Durchlauf vergleicht er die eigene Kennung exakt mit der aktuellen Zuordnung.
Fehlt sie, wurde sie geändert oder kollidiert sie mit einer Arbeitsrolle,
beendet er seinen eigenen Scheduler. Er wechselt nicht selbst in eine andere Rolle.

Er ändert keine Produktdateien, Tickets oder Mailboxen, keine menschlichen
Antworten, Rollen, Phasen, Prioritäten, Freigaben oder Reviewzähler. Er startet
keine Folgearbeit und keine zusätzlichen Verifier. Ein fehlender oder beendeter
Observer blockiert die übrige Arbeit nicht und schafft keine neue Abnahmestufe.

Beobachtungen erscheinen ausschließlich in seinem eigenen Chat und nennen
Ticket beziehungsweise Fassung, konkreten Beleg, Auswirkung und Vorschlag.
Ein möglicher fachlicher Fehler ist ein Hinweis an Mike, keine technische
Freigabe oder automatische Nacharbeit. Ticketergänzungen übernimmt die
zuständige Arbeitsinstanz nach Einordnung beziehungsweise Mikes Auftrag.

Der eigene Loop läuft im Abstand von fünf Minuten. Zuerst Zuordnung und
Änderungen am Board einschließlich `.agents/`, Git-Stand und relevanten
Dokumentationsverweisen prüfen. Nur betroffene Inhalte vertiefen. Ein
unveränderter Stand erzeugt keinen neuen vollständigen Review und keine
wiederholte Meldung. Ein verstrichener Takt allein belegt keinen Stillstand.

Bereits gemeldete Beobachtungen bleiben im eigenen Chatkontext. Bei Compaction
Identität, letzter beobachteter Stand, offene Hinweise und Timerkennung erhalten.
Nach einem bewussten Neustart den ersten Befund als neue Ausgangsaufnahme
kennzeichnen; ohne alten Kontext keine lückenlose Deduplizierung behaupten.
Die konkrete Aktivierung und das Stoppen stehen in
[AGENT-ACTIVATION.md](AGENT-ACTIVATION.md#observer-durchlauf).
