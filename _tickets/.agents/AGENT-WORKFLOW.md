# Coder-/Verifier-Workflow

Die Rollen und der aktive Auftrag stehen ausschließlich in
[STATUS.md](../STATUS.md). Dieser Vertrag gilt für StockPortfolio;
die Umstellung des Boards aktiviert keine Umsetzung und keinen Review.

Ein optionaler Observer ist eine dritte, eigenständige Instanz. Seine Zuordnung
steht im Feld `observer` derselben STATUS-Datei; sein Auftrag ist unten definiert.

**Übernahmestand der Board-Konventionen: `2026-09-11-activity-observer`.**
Am 2026-09-11 inhaltlich abgeglichen: ACTIVITY, Observer-Koordination und
installierter Rollen-Launcher. Keine lokale Abweichung von diesen beiden Regeln.

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

## Aktuelle Tätigkeit

**Gilt ab sofort für alle Tickets** (Mike, 2026-09-11): Die jeweils arbeitende
Instanz hält ihre aktuelle Tätigkeit knapp in [ACTIVITY.md](../ACTIVITY.md)
fest. Das gilt für den Coder bei der Umsetzung und den Verifier beim Review.

Die Meldung nennt Instanz, Zeitpunkt mit Zeitzone, aktuellen Arbeitsschritt,
letztes Ergebnis, nächsten Schritt und gegebenenfalls ein Hindernis. Bei
Arbeitsbeginn, wesentlichem Fortschritt, Übergabe oder Wechsel ins Warten
aktualisieren; die vorherige Meldung ersetzen. Keine fortlaufende Historie
und keine Aktualisierung allein wegen eines verstrichenen Scheduler-Takts.
Eine ältere Meldung belegt keine weiterhin laufende Tätigkeit.

STATUS bleibt allein verbindlich für Rollen, Auftrag, Phase und Übergaben.
ACTIVITY meldet die tatsächliche Tätigkeit und vergibt keinen Auftrag.
Der Observer schreibt keine Tätigkeitsmeldungen für andere Instanzen.
Dauerhafte Ergebnisse und Prüfnachweise bleiben im Ticket. Der sichtbare Link
oben in STATUS führt zur kurzen Datei; für reine Fortschrittsmeldungen muss
STATUS nicht geändert werden. Die Rollenprüfung vor jedem Turn bleibt nötig.

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

**Lokale Lessons liegen einzeln unter `lessons/`; gemeinsame Regeln in
AgentLessons.** [Zugriff, Herkunft und Pflege](LESSONS-ACCESS.md) regeln die
Lesepflicht einschließlich Verzeichnisinventar, fehlender Sammlung und neuer
Fassungen. Die früheren Sammeldateien sind nur Linkeinstiege. Der Ticket-Skill
liefert das Format und die Einrichtung, keine eigene Kopie des Wissens.
Die übernommene [Verfahrensempfehlung](LESSONS-PROCESS.md) bleibt als solche
gekennzeichnet. Globale Pflege braucht einen Auftrag; keine automatische
Synchronisation oder Übernahme fremder Rollen und Betriebsvorgaben.

## Observer

Der Observer betrachtet den Ticketablauf, widersprüchliche aktuelle Aussagen,
fehlende Übergaben, Unterschiede zwischen Dokumentation und belegtem Stand
sowie wiederkehrende Probleme über mehrere Tickets hinweg. Bei Folgetickets
vergleicht er außerdem Reihenfolge, Abhängigkeiten und gemeinsam betroffene
Funktionen: Dieselbe Validierung, Datenhaltung oder Anzeige darf nicht in
mehreren Tickets unabhängig neu entstehen.

**Der Observer beaufsichtigt und koordiniert Coder und Verifier** (Mike,
2026-09-11). Er darf bei Bedarf beiden Hinweise und konkrete Anweisungen im
bestehenden Auftrag geben, Rückmeldungen anfordern, die Arbeitsreihenfolge
innerhalb des vereinbarten Umfangs klären und auf fehlende Fortschrittsmeldungen,
Übergaben oder Nachweise hinweisen. Dafür braucht er keine erneute Erlaubnis
für jede Nachricht. Umsetzung bleibt beim Coder, unabhängige Abnahme beim
Verifier; Mikes Entscheidungen haben Vorrang.

Seine vollständige Kennung steht in `observer` in STATUS. Sie muss von
`implementer`, `reviewer` und `owner` verschieden sein. Die Standardnamen für
Arbeitsinstanzen bleiben `codex` und `claude`; zusätzliche Instanzen erhalten
einen eindeutigen Zusatz. Ein Produktname allein bestimmt keine Rolle.

Der Observer liest unabhängig vom Owner und auch bei `phase: idle`. Vor jedem
Durchlauf vergleicht er die eigene Kennung exakt mit der aktuellen Zuordnung.
Fehlt sie, wurde sie geändert oder kollidiert sie mit einer Arbeitsrolle,
beendet er seinen eigenen Scheduler. Er wechselt nicht selbst in eine andere Rolle.

Er kommuniziert über die vorhandenen Mailboxen in STATUS: INBOX an den Coder,
OUTBOX an den Verifier. Nachrichten nennen Absender, Empfänger, Ticket/Fassung,
Beleg und die erwartete Handlung. Bestehende unverarbeitete Nachrichten bleiben
erhalten; verarbeitete Nachrichten entfernt der Empfänger. Dauerhafte Befunde
und Entscheidungen darf der Observer im Ticket festhalten. Wesentliche
Eingriffe und Hinweise berichtet er zusätzlich in seinem eigenen Chat.

Eine Koordinationsnachricht erzeugt keine neue Reviewrunde. Der Observer
ändert keine Produktdateien, menschlichen Antworten, Rollenzuordnungen,
Phasen, Prioritätsfelder, Freigaben oder Reviewzähler. Er aktiviert keine
unbeauftragten Tickets und startet keine zusätzlichen Verifier. Ein fehlender
oder beendeter Observer blockiert die übrige Arbeit nicht und schafft keine
neue Abnahmestufe. Konkrete weitergehende Aufträge von Mike bleiben möglich.

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

Lessons-Pflege und die oben beschriebene Koordination sind laufend erlaubt.
Weitere Board- oder Produktänderungen brauchen einen entsprechenden Auftrag
von Mike. Im Chat den neuen oder ergänzten Lessons-Eintrag kurz nennen.
Ein ausdrücklich engerer Nur-Lese-Auftrag hat Vorrang: dann Hinweise und
Nachträge ausschließlich im Chat melden, keine Dateien oder Mailboxen ändern.

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
