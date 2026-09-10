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
im Ticket. Bereits vor der Umsetzung und erneut vor der Übergabe die Sammlung
zur eigenen Autorenschaft lesen:
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
festen Rollen. Ein Muster mit zwei konkreten Belegen oder bei einer ausdrücklich
falschen Vollständigkeitsbehauptung aufnehmen. Eine ausdrücklich vom Nutzer
beauftragte Einzelfall-Lehre ebenfalls erfassen und als solche kennzeichnen;
keine weiteren Vorfälle erfinden. Sonstige einzelne Fehler bleiben im Ticket.

**Aus jeder Erkenntnis folgt eine Handlung für beide Arbeitsrollen.** Ein neuer
oder wesentlich ergänzter Eintrag enthält Herkunft und Geltungsbereich,
Erkennungsregel, eine konkrete Implementer-Regel zur Vorbeugung, eine
Verifier-Prüfung samt erwartbarem Beleg sowie die ursprünglichen Fundstellen.
Allgemeine Zuständigkeiten stehen hier, Projektvorgaben in AGENTS.md; Lessons
verweisen darauf und halten den Anlass fest. Bestehende passende Einträge
ergänzen. Unklare Autorenschaft offenlassen, nicht aus dem aktuellen Owner ableiten.

- **Implementer:** Vor Beginn die einschlägigen Muster auswählen und ihre
  Vorbeugung in die Arbeit einbeziehen. Bei Übergabe knapp im Ticket nennen,
  welche Lessons einschlägig waren und welche Prüfung sie abdeckt; vorhandene
  Prüfnachweise verlinken. Daraus entsteht kein zusätzlicher pauschaler Testlauf.
- **Verifier:** Die Sammlung des Autors vor dem Review lesen und die passenden
  Gegenproben an der übergebenen Fassung prüfen. Eine zitierte Lesson oder ein
  grüner Gesamtlauf allein beweist ihre Einhaltung nicht. Ergebnis oder Lücke
  bei den betreffenden Ticketbefunden festhalten.
- **Observer:** Beide Sammlungen kennen, neue Befunde mit vorhandenen Mustern
  vergleichen und daraus konkrete Vorbeugungs- und Prüfregeln ableiten. Bei
  Wiederholung prüfen, ob eine Regel fehlt, unklar ist oder nicht angewendet
  wurde; genau diese Lücke verbessern und im Chat mit Beleg benennen.

**Ein neues Board beginnt mit der kuratierten Startbasis des Ticket-Skills.**
Die lokal enthaltenen Regeln funktionieren ohne andere Projekte. Bei Einrichtung
oder Übernahme zusätzlich die Lessons eines benannten, verfügbaren Quellprojekts
sichten. Übertragbare Regeln mit Quelle, Fassung und ursprünglicher
Autorenschaft kuratiert in die lokalen Sammlungen aufnehmen; sie ausdrücklich
als externe Startbasis kennzeichnen. Das ist keine Behauptung lokaler Vorfälle.
Übernahme, Anpassung und Auslassungen mit Grund in den Lessons festhalten.
Quellrollen, Reviewzähler und projektspezifische Regeln nicht mitkopieren.
Die lokale Fassung muss ohne Zugriff auf das Quellprojekt verständlich bleiben.
Ohne Quellprojekt die allgemeine Startbasis des Ticket-Skills prüfen und
passend übernehmen; verbleibende Wissenslücken offen nennen. Bestehende lokale
Erfahrungen erhalten. Spätere Übernahmen erfolgen gezielt, ohne automatische
Synchronisation oder Vorrang fremder Regeln.
**Eigenständige Entwicklung und Wissenstransfer:** Jedes Board entwickelt
seine Lessons eigenständig weiter, auch zuvor übernommene Regeln. Der Observer
unterscheidet projektspezifische Erkenntnisse von übertragbaren Ursachen und
formuliert für Letztere einen konkreten Nachtrag zur Startbasis im Ticket-Skill.
Der Nachtrag enthält allgemeine Erkennung, Vorbeugung, Gegenprobe und Herkunft.
Globale Übernahme nur im Rahmen eines entsprechenden Auftrags; lokale
Lessons-Erlaubnis allein reicht dafür nicht.

Die Skill-Vorlagen sind eine kuratierte Startbasis für weitere Projekte.
Sie überschreiben keine eigenständig weiterentwickelten Projekt-Lessons.
Beim beauftragten Abgleich Herkunft und Übernahmestand berücksichtigen und
inhaltlich entscheiden: ergänzen, lokal anpassen, bereits abgedeckt oder
nicht passend. Lokale Belege und Anpassungen erhalten. Widersprechen sich
Erfahrungen, zunächst deren Geltungsbereiche prüfen; keine Fassung allein
wegen ihres Datums bevorzugen. Unterschiedliche Anforderungen dürfen
unterschiedliche Regeln ergeben. Keine automatische Synchronisation.

## Observer

Der Observer betrachtet den Ticketablauf, widersprüchliche aktuelle Aussagen,
fehlende Übergaben, Unterschiede zwischen Dokumentation und belegtem Stand
sowie wiederkehrende Probleme über mehrere Tickets hinweg. Bei Folgetickets
vergleicht er außerdem Reihenfolge, Abhängigkeiten und gemeinsam betroffene
Funktionen: Dieselbe Validierung, Datenhaltung oder Anzeige darf nicht in
mehreren Tickets unabhängig neu entstehen. Er unterstützt
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

**Belegte Fehlermuster pflegt der Observer direkt in den Lessons-Dateien**
(Mike, 2026-09-10: „Wenn du Fehlermuster entdeckst - die gehören in die
jeweiligen -Lessons.md-Files“). Die Datei richtet sich nach der belegten
Autorenschaft der untersuchten Arbeit, nicht nach der Rolle des Entdeckers.
Bestehende Einträge ergänzen statt doppelte Regeln anzulegen. Es gelten die
[Belegregeln und Rollenpflichten](#belegte-erfahrungen). Der Auftrag umfasst
ausdrücklich das Erkennen und Erfassen von Fehlermustern sowie das Aufstellen
konkreter Regeln für Implementer und Verifier zur Vermeidung weiterer Fehler
(Mike, 2026-09-10). Diese Regeln bleiben innerhalb des vereinbarten Umfangs;
sie vergeben keine neue Arbeit und ersetzen kein unabhängiges Review.

Diese laufende Erlaubnis umfasst die Lessons-Pflege. Andere Board- oder
Produktänderungen entstehen daraus nicht; gesonderte Aufträge von Mike
gelten im jeweils benannten Umfang. Im Chat den neuen oder ergänzten
Lessons-Eintrag kurz nennen.

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
