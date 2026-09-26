# StockPortfolio · Rollen und Kommunikationsstatus

**Aktuelle Tätigkeit:** [ACTIVITY.md](ACTIVITY.md). Kurze Meldungen für Mike,
neueste oben. Alle drei Rollen schreiben über den globalen `agent-activity`;
ACTIVITY nicht als Agentenkontext lesen. Pflege nach
[Workflow](.agents/AGENT-WORKFLOW.md#aktuelle-tätigkeit).

**Aktiver Auftrag: T-49 · Docker-Hub-Veröffentlichung.** Mike hat am
2026-09-26 Dockerfile-Prüfung, Make-Anbindung, Veröffentlichung und die
README-Übernahme nach StockInfo T-77 beauftragt. Claude hat Runde 1
(`f70516e`) technisch freigegeben — mit eigenem arm64-Testbuild und echtem
Container, nicht nur den Coder-Angaben. Mikes Nachtrag (eigenes
`docker/README.md`, früher GitHub-Link, gegenseitige Links, README-Pflegeregel)
ist in Runde 2 (`c059f4d`) ebenfalls technisch freigegeben. Der anschließende
Abgleich mit den neuen Docker-Skills (Marker-Entwertung, zentrale
Unraid-Vorlage, vereinheitlichter README-Vorschaupfad, Dashboard-Screenshot)
ist in Runde 3 (`bbcb9e0`) und Runde 4 (`7aef019`) ebenfalls technisch
freigegeben — Runde 3 war zwischenzeitlich bereits geprüft, aber wegen einer
Sitzungsunterbrechung nicht rechtzeitig schriftlich dokumentiert; beides ist
jetzt im Ticket nachgetragen. Git-Integration (Merge/Push nach master) ist auf
Mikes Auftrag erfolgt. Docker-Hub-Veröffentlichung steht weiter aus; bisher
kein Image-Push. T-48 ist durch Mike abgeschlossen. T-35/T-36 bleiben im Backlog.

Rollen bleiben zugeordnet: Coder `codex`, Verifier `claude`, Observer
`codex-observer`. Der bestehende Rollen-Scheduler beobachtet das Board;
`idle` erzeugt keine fachliche Arbeit.

**Offene Übernahme:** lokaler Board-Stand `2026-09-11-activity-feed`,
Skill-Stand `2026-09-11-lessons-follow-through`. Allgemeine Übernahme weiterhin
nur mit entsprechendem Board-Auftrag; bestehende Schreibgrenzen gelten.

## Maschinenlesbarer Zustand

- `implementer`: `codex`
- `reviewer`: `claude`
- `observer`: `codex-observer`
- `phase`: `approved`
- `ticket`: `T-49-dockerhub-veroeffentlichung.md`
- `handoff_commit`: `7aef0196b7e298cb667afaac50c7353816128958`
- `review_round`: `4`
- `owner`: `codex`
- `updated_at`: `2026-09-26`
- `last_reviewed_ticket`: `T-49-dockerhub-veroeffentlichung.md`
- `last_reviewed_commit`: `7aef0196b7e298cb667afaac50c7353816128958`
- `last_reviewed_round`: `4`
- `workstream`: `dockerhub-release`
- `priority_chain`: `T-49-dockerhub-veroeffentlichung.md`
- `priority_ticket`: `T-49-dockerhub-veroeffentlichung.md`

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
gehören und startet keine erneute Arbeit. Die `last_reviewed_*`-Felder
erhalten die letzte abgeschlossene Prüfung; die Übergabefelder sind ohne
aktiven Auftrag leer. Reviews im AgentLessons-Board bleiben dort.

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

Der Workstream dieses Boards ist damit wieder frei. T-38 wurde inzwischen am 2026-09-26 durch Mike abgeschlossen. T-39 ist seit demselben Tag ebenfalls abgeschlossen. Auch T-40 ist inzwischen abgeschlossen; T-35 und T-36 bleiben im Backlog.

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
und [T-40](40-done/T-40-detailanzeige-aus-feldkatalog.md) — automatische
Detailanzeige. Beide wurden auf Mikes Ansage unter `30-doing/` angelegt und
inzwischen umgesetzt sowie technisch freigegeben. Die damalige Einordnung
vor T-38 beschreibt die frühere Bearbeitung; damals hatte T-38 Vorrang.

**Aktueller Stand:** T-38 bis T-40 sowie T-43 bis T-48 sind abgeschlossen.
T-49 ist aktiviert. Die früheren Prioritätsentscheidungen unten bleiben
als historische Begründung erhalten.

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
| [T-40](40-done/T-40-detailanzeige-aus-feldkatalog.md) | Runde 1 technisch freigegeben; am 2026-09-26 durch Mike abgeschlossen. |
| [T-38](40-done/T-38-basiswaehrung-und-devisenkurse.md) | In Runde 2 technisch freigegeben; am 2026-09-26 durch Mike abgeschlossen: „T-38 ist erledigt“. |
| 26 Tickets aus `solved/` | Nach `40-done/` übernommen; bestehender Archivstatus und Inhalte bleiben erhalten. |

T-31 bis T-34 sind auf Mikes Auftrag im Observer-Chat abgeschlossen:
„Schließ ab und bereinige die Aussage“. Die bisherigen Einzelantworten bleiben
erhalten; neue Einzelprüfurteile wurden nicht ergänzt.
T-38, T-39 und T-40 sind abgeschlossen.
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

T-47 (Verrechnungskonto wieder hinzufügen) und T-46 (Detailansicht) sind
technisch freigegeben und durch Mike abgeschlossen.

## INBOX → Coder

**claude → codex · T-49 · Runden 3+4 · Commits `bbcb9e0` und `7aef0196b7e298cb667afaac50c7353816128958`**

Beide technisch freigegeben. Entschuldigung für die verzögerte schriftliche
Rückgabe: Runde 3 (`bbcb9e0`) war zum damaligen Zeitpunkt bereits vollständig
geprüft — automatisierte Checks grün, Diff gelesen, die frühe Marker-Entwertung
live selbst nachvollzogen (eigener fehlschlagender `--build`-Versuch, Marker
verschwand, `--push` verweigerte korrekt; Codex' Original-Marker danach
byteidentisch wiederhergestellt) —, aber wegen einer Sitzungsunterbrechung
nicht in Echtzeit ins Ticket geschrieben. Jetzt vollständig nachgetragen.

Runde 4 (`7aef019`): Diff seit `b058682` geprüft plus die dazwischenliegenden
`9c1d6d1` (zentrale Unraid-Vorlage — Datei existiert, wohlgeformt, inhaltlich
unverändert gegenüber der in Runde 1 geprüften lokalen Kopie) und `bbcb9e0`
eingeordnet. README-Vorschaupfad-Vereinheitlichung und Dashboard-Screenshot
live selbst nachvollzogen: Vorschau schreibt tatsächlich nach
`docker/preview/README.md` (4.734 Bytes, exakt wie behauptet), Bild-URL
`raw.githubusercontent.com/.../docs/images/dashboard.png` liefert selbst
geprüft HTTP 200. 61 Dateien/783 Tests, Lint/Typecheck,
`bash -n`/ShellCheck/`diff --check` grün.

**Korrektur:** Der Observer hat zu Recht angemerkt, dass HTTP 200 auf
`dashboard.png` keinen aktuellen Master-Push belegt — die Datei stammt
unverändert aus `2ea5e62` (2026-08-11), lange vor T-49. Richtig nachgeprüft:
`git fetch origin master` + `git ls-tree origin/master -- docker/README.md`
zeigt Blob `0f72b8f4…`, byteidentisch mit `git show 7aef019:docker/README.md`;
`git merge-base --is-ancestor bbcb9e0 origin/master` bestätigt auch Runde 3
dort enthalten. Der gemeldete Master-Push ist damit tatsächlich korrekt
verifiziert — nur nicht durch mein ursprüngliches Argument. Ändert nichts an
der technischen Freigabe. Details und vollständige Korrektur im Ticket.

Details im Ticket unter „Reviewer-Prüfung (Claude, Runde 3, Fassung `bbcb9e0`)
— nachträglich dokumentiert“ und „…Runde 4, Fassung `7aef019`) — begrenzter
Umfang“. Kein Push durch mich in beiden Runden. Owner geht zurück an Codex für
die weiterhin ausstehende Docker-Hub-Veröffentlichung.

## OUTBOX → Verifier

Leer.
