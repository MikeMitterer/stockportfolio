# StockPortfolio · Rollen und Kommunikationsstatus

**Aktuelle Tätigkeit:** [ACTIVITY.md](ACTIVITY.md). Kurze Meldungen für Mike,
neueste oben. Alle drei Rollen schreiben über den globalen `agent-activity`;
ACTIVITY nicht als Agentenkontext lesen. Pflege nach
[Workflow](.agents/AGENT-WORKFLOW.md#aktuelle-tätigkeit).

**T-46 ist der aktive Auftrag:** kompaktere Detailansicht, passende Tabs, SVG-Gruppensymbole,
mehr Platz in der Löschbestätigung und sichtbare Positionsnotizen.
Claude hat Fassung `573d15b` in Runde 1 technisch freigegeben. Der in Runde 2
(`fd52010`) bestätigte Übersetzungsfehler ist in `c48f212` korrigiert und von
Claude in Runde 3 technisch freigegeben. Die weiteren Nachträge (Löschbestätigungs-Abstand bei Verweisen, leere
Depotgruppen ausblenden) sind in `0a26ed0` von Claude in Runde 4 technisch
freigegeben. Die Nachträge zur Typanzeige mit dezenten unterschiedlichen SVGs
und sichtbarer Basiswährung sind in `1124b4b` von Claude in Runde 5 mit
`changes_requested` zurückgegeben: der neue Basiswährungs-Hinweis an der
Gesamtwert-Karte wird bei üblicher Desktop-Breite auf „Basiswährung: E…“
abgeschnitten. Korrektur, Stückrundung und die Behebung der Zielmarkierung
hinter dem Header sind in `4367acf` von Claude in Runde 6 technisch freigegeben.
Mikes Abschlussabnahme bleibt offen.
Der neue API-Auftrag zu dynamischen Asset-Typen ist in T-48 erfasst;
StockInfo-Ticket T-73 fordert die vollständige REST-Typauskunft an.
T-47 ist durch Claude technisch freigegeben (`4c51480`), menschliche Abnahme offen.
T-45 ist nach technischer Freigabe und Mikes „T-45 ist OK und passt so“ abgeschlossen.
T-44 ist technisch freigegeben (`d38a8f5`), menschliche Abnahme offen.
T-43 wurde von Claude in
Runde 3 technisch freigegeben und von Mike mit „Passt, mach mit dem nächsten
Ticket weiter“ am 2026-09-25 abgeschlossen. T-41 und T-42 bleiben im
eigenen AgentLessons-Repository; Einzelheiten stehen unter
[AgentLessons ist umgezogen](#agentlessons-ist-umgezogen--2026-09-11).

**T-38 ist abgeschlossen.** Nach technischer Freigabe in Runde 2 hat Mike am
2026-09-26 bestätigt: „T-38 ist erledigt“. Das Ticket liegt unter `40-done/`.
T-39 ist ebenfalls abgeschlossen: Mike bestätigte am 2026-09-26
„T-39 ist erledigt“. T-40 ist technisch freigegeben und wartet unter
`30-doing/` auf Mikes Abschlussabnahme.
T-37 ist als Bewertung technisch freigegeben und durch Mike am 2026-09-10
abgeschlossen: „T-37 ist damit erledigt“. Es liegt unter `40-done/`.
T-31 bis T-34 sind durch Mike am 2026-09-10 abgeschlossen und liegen unter
`40-done/`; T-35 und T-36 bleiben im Backlog.

**Der Observer ist als `codex-observer` zugeordnet.** Er beaufsichtigt und
koordiniert Coder und Verifier unabhängig vom Owner, kommuniziert bei Bedarf
über die Mailboxen und berichtet wesentliche Eingriffe im eigenen Chat.
Die Startbefehle und beide
Scheduler-Varianten stehen in [AGENT-ACTIVATION.md](.agents/AGENT-ACTIVATION.md).
Eine Zuordnung ist noch kein Nachweis eines laufenden Prozesses.

## Maschinenlesbarer Zustand

- `implementer`: `codex`
- `reviewer`: `claude`
- `observer`: `codex-observer`
- `phase`: `approved`
- `ticket`: `T-46-detailtabs-und-felder-kompakter.md`
- `handoff_commit`: `4367acf3d8db7f4ceca9554377e30bfed5fb7e51`
- `review_round`: `6`
- `owner`: `codex`
- `updated_at`: `2026-09-26`
- `last_reviewed_ticket`: `T-46-detailtabs-und-felder-kompakter.md`
- `last_reviewed_commit`: `4367acf3d8db7f4ceca9554377e30bfed5fb7e51`
- `last_reviewed_round`: `6`
- `workstream`: `compact-position-details`
- `priority_chain`: `T-46-detailtabs-und-felder-kompakter.md`
- `priority_ticket`: `T-46-detailtabs-und-felder-kompakter.md`

`unassigned` und `none` sind ausdrücklich inaktive Werte, keine Instanznamen
oder Ticketdateien. Vor einer Agentenübergabe Rollen und Auftrag ausdrücklich
zuordnen. `owner` bezeichnet die Instanz, die gerade am Zug ist.
Keine Rollen oder Übergabefassungen aus StockInfo übernehmen.

Für künftige Übergaben gelten neutrale Phasen: `implementing` →
`ready_for_review` → `reviewing` → `changes_requested` oder `approved`.
Bei Arbeitsbeginn hat der Coder den Owner, bei Übergabe und Review der
Verifier, nach dem Prüfurteil wieder der Coder. `blocked` bezeichnet einen
konkret dokumentierten Entscheidungsbedarf; `idle` enthält keinen Auftrag.
Eine technische Freigabe ist noch kein Ticketabschluss.

`ticket`, `priority_ticket`, `priority_chain` und `last_reviewed_ticket`
enthalten bei Belegung Dateinamen ohne Ordner. Aktive Arbeit wird unter
`30-doing/` aufgelöst. Der letzte Review kann zu einem archivierten Ticket
gehören und startet keine erneute Arbeit. Die Felder oben enthalten keine
nachträglich erfundene Übernahme der früheren Ticket-Reviews. Die Reviewfelder
stehen auf `none`, seit der zuletzt geprüfte Auftrag nach AgentLessons
umgezogen ist; sein Reviewstand wird auf dem dortigen Board geführt.

## Kontext

### AgentLessons ist umgezogen · 2026-09-11

Mike: „OK - wir ziehen um: /Volumes/DevLocal/DevKI/Production/AgentLessons …
Du kannst t-41 und t-42 dorthin mitnehmen“.

T-41 und T-42 werden in `/Volumes/DevLocal/DevKI/Production/AgentLessons`
weitergeführt; hier stehen nur noch Verweise. Das neue Board ist vollständig
eingerichtet, die Rollen sind wie hier zugeordnet (`codex`, `claude`,
`codex-observer`), und der Reviewbezug aus Runde 2 ist übernommen, damit kein
abgeschlossenes Review wiederholt wird.

**In StockPortfolio bleibt der erledigte Anteil:** lokale Lessons als
Einzeldateien unter `.agents/lessons/`, die Linkeinstiege,
`LESSONS-ACCESS.md`, `LESSONS-PROCESS.md` und `ACTIVITY.md`. Diese Umstellung
ist in Runde 1 und 2 technisch freigegeben; **Mikes Abschlussabnahme erfolgt
auf dem AgentLessons-Board**.

Der Workstream dieses Boards ist damit wieder frei. T-38 wurde inzwischen am 2026-09-26 durch Mike abgeschlossen. T-39 ist seit demselben Tag ebenfalls abgeschlossen. Offen bleiben
T-40 mit ausstehender Abschlussabnahme sowie T-35 und T-36 im Backlog.

**Formatänderung für alle Autoren:** Vor der nächsten Lessons-Pflege
[LESSONS-ACCESS.md](.agents/LESSONS-ACCESS.md) lesen. Originale liegen unter
`lessons/`, gemeinsame Regeln in AgentLessons, Metadaten haben Formatfassung 1.
Die bisherigen Sammeldateien sind reine Linkeinstiege ohne zweiten
handgepflegten Inhalt.

### ACTIVITY · zentraler Helfer · 2026-09-11

Mikes Auftrag und Claudes weitergeleitete Anforderungen sind in
T-42 festgehalten und umgesetzt; das Ticket liegt seit dem Umzug im
AgentLessons-Board.
`~/.local/bin/agent-activity` verweist auf die einzige Quelle im Tickets-Skill.
Alle Projekte verwenden denselben Befehl; keine Kopie unter `.agents/bin`.
Neue Einträge oben, ein bis zwei Sätze, Standard letzte 50. Agenten schreiben
nur eigene Meldungen und lesen ACTIVITY nicht als Kontext. Übernahme nach dem
Workflow, Konventionsstand `2026-09-11-activity-feed`. Eine Meldung nennt den
konkreten Gegenstand, nicht nur Ticket und Phase.

### Historischer Integrationsauftrag · bis 2026-09-10

Mike, 2026-09-10: „T-37 und T-38 sind die nächsten Tickets die du abarbeiten sollst“.
Ursprüngliche Reihenfolge: T-37 vor T-38. T-37 liefert zunächst den im Ticket beschriebenen
Integrationsvorschlag. Mike hat eine automatische Detailanzeige gewählt:
Felder der tatsächlichen Hauptzeile einschließlich dynamischer Felder
werden nicht wiederholt. Für T-38 hat Mike am 2026-09-10 eine vom Nutzer konfigurierbare
Basiswährung **je Depot** festgelegt. Typische Wahl: EUR im Euroraum, USD in
den USA; Hauptfall ist das Depot mit gewählter Währung. Veraltete FX-Kurse
werden mit sichtbarer Warnung weiterverwendet. T-39 übernimmt die gemeinsame
Kursprüfung einschließlich Währung aus T-35. T-40 zeigt Detailwerte in ihrer
Originalwährung; T-38 ergänzt danach Depotbewertung und FX. T-35 bleibt mit
seinem Generationsauftrag im Backlog.

Arbeitsbranch: `t-38-basiswaehrung-und-devisenkurse`, auf der freigegebenen
T-40-Fassung. Der frühere geplante Worktree wurde nicht angelegt.
Das maßgebliche Board liegt unter
`/Volumes/DevLocal/DevWeb/Production/StockPortfolio/_tickets`.
Vorgefundene fremde Produktänderungen im Hauptarbeitsbaum gehören nicht zu
diesem Integrationsauftrag.

Projektweite Entscheidung vom 2026-09-10: keine Migrationspfade zwischen
StockPortfolio-Versionen. Einfach passende Daten übernehmen; inkompatible
Entwicklungsdaten dürfen zurückgesetzt und neu angelegt werden. Maßgeblich
ist der Abschnitt „Tatsächlicher Entwicklungsstand“ in `AGENTS.md`.

Mike, 2026-09-10: „Leg die Umsetzungs-Tickets in doing an - das hat prio“.
Aus dem freigegebenen T-37-Vorschlag entstanden dafür
[T-39](40-done/T-39-identitaet-normalisieren.md) — Identität normalisieren —
und [T-40](30-doing/T-40-detailanzeige-aus-feldkatalog.md) — automatische
Detailanzeige. Beide wurden auf Mikes Ansage unter `30-doing/` angelegt und
inzwischen umgesetzt sowie technisch freigegeben. Die damalige Einordnung
vor T-38 beschreibt die frühere Bearbeitung; damals hatte T-38 Vorrang.

**Aktueller Schritt:** T-44 wurde aus `d38a8f5` von Claude in Runde 1
technisch freigegeben. Mikes Bedien- und Abschlussentscheidung bleibt offen. T-45 ist abgeschlossen; T-47 ist technisch freigegeben. T-46 ist aktiv.
T-43 wurde nach drei freigegebenen
Reviewrunden am 2026-09-25 von Mike abgeschlossen. T-38 Runde 2 ist durch `claude` technisch
freigegeben, Fassung `983b33bffec1b52fd26e233dcca98d8acffdf997`;
T-38 und T-39 sind seit 2026-09-26 durch Mike abgeschlossen; T-40 wartet weiter auf seine Abschlussabnahme.
T-40 ist die technisch freigegebene Grundlage für Zusatzwerte und deren
zeilengenauen Dublettenabgleich. T-43 hat diese Darstellung neu geordnet
und ist abgeschlossen. T-40 wird dafür weder erneut implementiert noch neu
reviewed; seine menschliche Abschlussabnahme bleibt getrennt.
Der aktive Auftrag ist [T-46](30-doing/T-46-detailtabs-und-felder-kompakter.md).
Mike hat T-45 am 2026-09-25 hinter T-44 eingeplant und am 2026-09-26 zur
Fortsetzung aufgefordert. Die technische Freigabe von T-44 ist verarbeitet;
dessen offene menschliche Abnahme hält die weitere Prioritätskette nicht auf.

**Frühere Prioritätsklärung · Mike, 2026-09-10:** „Zuerst Depotwährung aus T-38“.
Diese Priorität ist mit der technischen Freigabe von T-38 bearbeitet. Die
vorhandene Umsetzung braucht keine weiteren Folgetickets für denselben Umfang. Mike erlaubt,
offene Fragen zur sinnvollen Ticketreihenfolge mit dem Observer zu klären,
damit dafür die laufende Session nicht unterbrochen werden muss. Derzeit ist
keine Reihenfolgefrage offen.

**Frühere Reihenfolgeentscheidung:**
Mike hat im Observer-Chat am 2026-09-10 ausdrücklich geschrieben:
„Aktuell sollen die Folgetickets von T-37 erledigt werden erst dann T-38
überprüfe die Reihenfolge, ich glaube das macht sinn“.
Die damalige Kette war T-39 → T-40 → T-38. Für die weitere Arbeit gilt die
oben festgehaltene jüngste Prioritätsklärung.
Der Observer hat auf Mikes anschließenden Auftrag „Pass die Info entsprechend
an“ die Ticketabgrenzung und Verweise aktualisiert. Auf Mikes weiteren Hinweis
„Phase - immer noch blocked“ hat er den erledigten Klärungsblocker aufgehoben
und `implementing` gesetzt. Rollen, Owner und Reviewzähler bleiben unverändert.

T-39 liefert die gemeinsame Pflichtfeldprüfung einschließlich Kurswährung.
T-40 und T-38 verwenden dieselben Typen, Mapper, Cache- und Anzeigebausteine
weiter. T-40 erhält die Originalwerte; T-38 leitet daraus Depotwerte ab.
Die konkreten Prüfpunkte stehen vollständig in den drei Tickets. Mike hat
am 2026-09-10 klargestellt, dass die gesamte benötigte Information im
entsprechenden Ticket liegen soll. Der T-37-Integrationsvorschlag bleibt
ausschließlich als historische Bewertung erhalten.
Die Freigabe von T-37 Runde 1 durch `claude` ist verarbeitet; keine Nacharbeit. T-38 war
noch nicht begonnen — Branch und Worktree existierten beim Vorziehen nicht,
es geht also keine angefangene Arbeit verloren. T-37 ist mit Mikes
Bestätigung „T-37 ist damit erledigt“ nach `40-done/` verschoben.
Der Scheduler bleibt aktiv.

### Übernahmestand

Umstellung am 2026-09-10 nach dem Auftrag, die Struktur von StockInfo zu
übernehmen. Die Einordnung folgt den vorhandenen Tickets; sie erteilt weder
eine neue Umsetzungsgenehmigung noch eine zusätzliche Abnahme.

| Tickets | Übernommener Stand und offener Rest |
|---|---|
| [T-31](40-done/T-31-refresh-erzwingt-frische-kurse.md) | Umsetzung vorhanden; am 2026-09-10 durch Mike abgeschlossen. Ursprüngliche Prüfnachweise und Antworten erhalten. |
| [T-32](40-done/T-32-fortschrittsleiste.md) | Umsetzung vorhanden; am 2026-09-10 durch Mike abgeschlossen. Ursprüngliche Prüfnachweise und Antworten erhalten. |
| [T-33](40-done/T-33-schonfrist-automatisches-laden.md) | Umsetzung vorhanden; am 2026-09-10 durch Mike abgeschlossen. Einstellung ist durch T-34 bedienbar. |
| [T-34](40-done/T-34-einstellungen-fuers-aktualisieren.md) | Umsetzung vorhanden; am 2026-09-10 durch Mike abgeschlossen. Beide Aktualisierungseinstellungen sind bedienbar. |
| [T-35](10-backlog/T-35-stockinfo-generation-und-waehrung.md) | Bisher `offen`; ausführlicher Entwurf mit bisherigen Prüfnotizen, Implementierungsnachweise leer. Keine belegte Einplanung der Umsetzung. Abhängigkeiten vor Aufnahme neu prüfen. |
| [T-36](10-backlog/T-36-eslint-waechter-aus-dem-fundament.md) | Bisher `blocked`; wartet laut Ticket auf eine installierbare ux-foundation-Fassung. Keine begonnene Umsetzung; Voraussetzung vor Einplanung neu prüfen. |
| [T-37](40-done/T-37-stockinfo-quote-vertrag-und-dynamische-felder.md) | Bewertung durch claude in Runde 1 technisch freigegeben; am 2026-09-10 durch Mike abgeschlossen. Umsetzung separat in T-39 und T-40. |
| [T-39](40-done/T-39-identitaet-normalisieren.md) | In Runde 1 technisch freigegeben; am 2026-09-26 durch Mike abgeschlossen: „T-39 ist erledigt“. |
| [T-40](30-doing/T-40-detailanzeige-aus-feldkatalog.md) | Detailanzeige umgesetzt; Runde 1 technisch freigegeben, menschliche Abschlussabnahme offen. |
| [T-38](40-done/T-38-basiswaehrung-und-devisenkurse.md) | In Runde 2 technisch freigegeben; am 2026-09-26 durch Mike abgeschlossen: „T-38 ist erledigt“. |
| 26 Tickets aus `solved/` | Nach `40-done/` übernommen; bestehender Archivstatus und Inhalte bleiben erhalten. |

T-31 bis T-34 sind auf Mikes Auftrag im Observer-Chat abgeschlossen:
„Schließ ab und bereinige die Aussage“. Die bisherigen Einzelantworten bleiben
erhalten; neue Einzelprüfurteile wurden nicht ergänzt.
T-38 und T-39 sind abgeschlossen; T-40 wartet auf die menschliche Abschlussabnahme.
T-37 ist als Bewertung abgeschlossen.
`80-iced/` und `90-rejected/` sind leer.
Eine wartende Abhängigkeit allein ist kein Beschluss zum Einfrieren.

### Gemeinsame Regeln

Rollen werden ausschließlich oben zugeordnet. Fachliche Regeln stehen in
[AGENT-WORKFLOW.md](.agents/AGENT-WORKFLOW.md), Laufzeit-Einstiege in
[AGENT-ACTIVATION.md](.agents/AGENT-ACTIVATION.md). Alle Autoren lesen vor
Board-Arbeit die neue [Ablageanleitung](README.md#ablage); die früheren
Root- und `solved/`-Pfade gelten für StockPortfolio nicht mehr.

INBOX und OUTBOX enthalten nur unverarbeitete Nachrichten. Befunde und
dauerhafte Entscheidungen gehören ins Ticket; verarbeitete Nachrichten
werden entfernt.

T-47 behebt Mikes neuen Befund vom 2026-09-26: gelöschtes Verrechnungskonto
kann nicht wieder hinzugefügt werden. Die Funktionskorrektur ist technisch freigegeben; Mikes Abschlussabnahme ist offen.
T-46 ist auf Mikes Auftrag vom 2026-09-26 jetzt aktiv: Kursverlauf
zuerst, leere Informations-Tabs ausblenden und Detailfelder kompakter darstellen.

## INBOX → Coder

**claude → codex · T-46 · Runde 6 · Commit `4367acf3d8db7f4ceca9554377e30bfed5fb7e51`**

Technisch freigegeben. `make test` (58 Dateien, 750 Tests), `make lint` und
`make typecheck` selbst gegen die Übergabefassung grün. Diff gelesen: alle
drei Korrekturen minimal und zielgerichtet. KPI-Hinweis live gemessen
(`clientWidth === scrollWidth === 101px`, vorher 97/101) — „Basiswährung: EUR“
vollständig sichtbar. Zielmarkierung/Header: Quellcode-Gegenprobe bestätigt
`UxTopbar.vue` mit `position: sticky; z-index: 10`, exakt die genannte
Ursache; `isolation: isolate` ist die richtige minimale Eindämmung, Gruppen-
balken rendern live unverändert. Den ursprünglichen Scroll-Überlapp konnte
ich im kleinen Testdepot nicht erneut provozieren (zu wenig Seitenhöhe) —
verifiziert über den bestätigten Quellcode-Fund, keine Einschränkung der
Freigabe. Delta Bestand: `Math.round(...) || 0` live an allen vier bepreisten
Positionen als „0“ statt „-0“ bestätigt; zugrunde liegende Berechnung
unverändert und bereits domainseitig getestet. Details im Ticket unter
„Reviewer-Prüfung (Claude, Runde 6, Fassung `4367acf`)“.

Damit sind alle Runde-5-Befunde und der Delta-Bestand-Nachtrag abgearbeitet.
Owner geht zurück an Codex; Mikes Abschlussabnahme für T-46 insgesamt bleibt offen.

## OUTBOX → Verifier

Leer.
