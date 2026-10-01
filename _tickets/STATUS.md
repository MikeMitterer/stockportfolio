# StockPortfolio · Rollen und Kommunikationsstatus

**Aktuelle Tätigkeit:** [ACTIVITY.md](ACTIVITY.md). Kurze Meldungen für Mike,
neueste oben. Alle drei Rollen schreiben über den globalen `agent-activity`;
ACTIVITY nicht als Agentenkontext lesen. Pflege nach
[Workflow](.agents/AGENT-WORKFLOW.md#aktuelle-tätigkeit).

**Arbeitsort:** nur der Projekt-Root
`/Volumes/DevLocal/DevWeb/Production/StockPortfolio`, keine Worktrees (Mike,
2026-10-01; [Regel](../AGENTS.md#ein-arbeitsort-der-projekt-root)). Der Root
hat den Branch aus dem Feld `branch` ausgecheckt.

**Aktuelle Arbeit:** keine aktive Umsetzung; der Root steht auf `master`.
[T-68 · Aktuelle Screenshots mit Login](30-doing/T-68-aktuelle-screenshots-mit-login.md)
(Runde 2, `efc290f`) und [T-71 · Keine Standard-Platzhalter](30-doing/T-71-keine-standard-platzhalter.md)
(Runde 1, `509881e`) sind technisch freigegeben und lokal nach `master`
gemergt (kein Push). Mikes Bildurteil und Abnahme stehen aus. Die drei neuen
Screenshots der Unraid-Vorlage (`9670339`) warten auf
`t-60-stockportfolio-template` auf den nächsten Image-Release.

**Abgeschlossen am 2026-10-01:** Mike: „T-70 passt und ist erledigt - so wie alle anderen Tickets in doing auch.“
Damit sind T-60 bis T-67, T-69 und T-70 abgeschlossen und liegen unter
`40-done/`. Offene Reste stehen im jeweiligen Abschluss: T-65 → AgentLessons
T-51; T-67 → Template-Commit `ca7ae2d` wartet auf StockInfo T-84; T-70 ohne
unabhängige technische Prüfung; T-64 ohne rechtliche Prüfung des Wortlauts.

**Sichtbarkeit von Tickets und Source · Mike, 2026-10-01:** Jedes Ticket soll
vom Projektverzeichnis aus sichtbar sein, auch bevor sein Branch integriert
ist. Mike will den Source-Stand testen können, an dem der Coder gerade arbeitet,
und auf einen Blick erkennen, welchen Branch und Commit er vor sich hat und
ob noch Änderungen offen sind. Der Startweg muss zu genau diesem Stand führen.
Seit dem Abschluss vom 2026-10-01 enthält `master` alle abgeschlossenen
Tickets und ist zu `origin` gepusht. Im Root ist jetzt der aktive
`t-68-aktuelle-screenshots`-Branch ausgecheckt; die Bild- und README-Fassung
`efc290f`, die Platzhalter-Korrektur `509881e` und die Reviews sind dort
sichtbar.
`active-work.local` und `tickets.local` sind lokale Zugänge,
keine dauerhafte Board-Lösung. Der Namenskonflikt der beiden T-67-Tickets wurde
so aufgelöst: Internet-Hinweise behalten T-67, das später angelegte
Screenshot-Ticket heißt T-68.

Die Mehradmin-Regel ist in T-61 Konzept Runde 2 entschieden: Jedes Konto hat
eigene Daten, die Vorschau des alten Browserbestands gehört nur dem
serverseitig markierten Setup-Konto. Die Architektur-Spezifikation liegt unter
`docs/superpowers/specs/`. Die Projektstruktur bleibt bei `frontend/` und
`api/`, je mit eigenem Manifest; die Version steht in `frontend/package.json`.

**Abgeschlossener Auftrag:** [T-58 · About und Datenhinweise](40-done/T-58-about-data-use-notice.md)
ist am 2026-09-28 nach Claudes technischer Freigabe in Runde 1 und Mikes
Bestätigung „Von mir aus ist das Ticket durch“ abgeschlossen. Die Fassung
umfasst Mikes Screenshot-Rückmeldung zur lesbaren Fehlseite im dunklen Theme.
Eine rechtliche Prüfung des endgültigen öffentlichen Wortlauts wird damit
nicht behauptet.

[T-59 · Unraid-Katalogstand](40-done/T-59-unraid-katalog-in-anleitung-korrigieren.md)
ist am 2026-09-28 nach Claudes technischer Freigabe in Runde 1 und Mikes
Bestätigung „von mir aus ist das OK“ abgeschlossen. Die Unraid-Anleitung nennt
die Listung unter Apps; ein praktischer Start auf Unraid wurde nicht geprüft.
[T-57 · EUPL-Lizenz](40-done/T-57-eupl-lizenz.md)
ist am 2026-09-27 nach Claudes technischer Freigabe in Runde 3 und Mikes
Bestätigung „Ticket ist damit erledigt“ abgeschlossen. EUPL 1.2 ersetzt die
eigene Lizenz, COMMERCIAL-LICENSE.md ist entfernt. Michael Mitterer bleibt
Urheber; MangoLila GmbH ist Anbieterin und Lizenzgeberin. Die Hinweise zur
internen Rechtevereinbarung und österreichischen Rechtsprüfung bleiben auf
Mikes Wunsch als persönliche Wiedervorlage im archivierten Ticket erhalten.
Ihr rechtlicher Abschluss wird damit nicht behauptet.
Der Abschluss ist nach `master` integriert. `make tag-minor` hat Version
`0.4.0` und Tag `v0.4.0+260927.2137.6687a` erstellt und gepusht; die
Release-Message wurde auf Mikes Nachtrag ergänzt. Das Changelog ist aktualisiert.

[T-56 · Changelog-Generator](40-done/T-56-changelog-generator.md) ist am
2026-09-27 nach Claudes technischer Freigabe in Runde 3 einschließlich der
nachgeholten Quellenprüfung und Mikes Bestätigung „T-56 sollte durch sein
-oder?“ abgeschlossen. Die frühere Prüffassung und sämtliche Nachweise
bleiben im archivierten Ticket erhalten.
[T-55 · Kurze Versionierungs-Targets](40-done/T-55-kurze-versionierungs-targets.md)
ist am 2026-09-27 nach Claudes technischer Gesamtfreigabe in Runde 2 und
Mikes Bestätigung „T-55 sollte erledigt sein“ abgeschlossen.
[T-54 · Backup im leeren Depot](40-done/T-54-sicherung-im-leeren-depot.md)
ist am 2026-09-27 in Runde 1 durch `claude` technisch freigegeben und nach
Mikes bedingter Abschlussentscheidung abgeschlossen. Der Coder hat die
Prüfaussage zum Abbruchpfad gemäß Observer-Hinweis begrenzt; kein Produktbefund.
[T-53 · Medienproduktion](/Volumes/Daten/Projekte/MangoLila_000000_SocialMedia/StockApps/_tickets/30-doing/T-01-blogposts-und-erklaervideo-fuer-beide-apps.md)
wurde auf Mikes Auftrag am 2026-09-27 mit allen Nachweisen in das eigenständige
StockApps-Board unter `Daten` übertragen und heißt dort T-01. Die Produktion bleibt dort pausiert;
hier wird keine zweite Ticketfassung weitergeführt.

[T-52 · API-Link direkt zum Status-Tab](40-done/T-52-statuszeile-api-link-zum-status-tab.md)
ist in Runde 1 durch `claude` technisch freigegeben und am 2026-09-27 von
Mike mit „T-52 passt“ abgeschlossen. Die beauftragte Kette T-51 → T-52 ist erledigt.

[T-51 · Relative Bandabweichung im Rebalancing](40-done/T-51-rebalancing-bandabweichung-als-zahl.md)
ist nach Claudes Freigabe in Runde 8 und Mikes bedingter Abschlussentscheidung
am 2026-09-27 abgeschlossen und archiviert.

[T-50 · GitHub-Link in der Statuszeile](40-done/T-50-github-link-statuszeile.md)
ist in Runde 2 durch `claude` technisch freigegeben und auf Mikes Bestätigung
vom 2026-09-27 abgeschlossen: „T-50 ist erledigt“.

Der vorherige Auftrag ist abgeschlossen. Mike hat am 2026-09-26 ausdrücklich bestätigt:
„T-49 ist erledigt“. Das Ticket liegt unter
[`40-done/T-49-dockerhub-veroeffentlichung.md`](40-done/T-49-dockerhub-veroeffentlichung.md).
Die technischen Freigaben der Runden 1 bis 4 und die nachfolgenden README-/
Screenshot-Commits bleiben dokumentiert. Mike bestätigt außerdem:
„Docker-Hub-Push habe ich erledigt“. Die Veröffentlichung ist damit durch Mike
gemeldet; ein unabhängiger Registry-/README-Nachweis wurde hier nicht ergänzt.
T-35/T-36 bleiben im Backlog und sind nicht aktiviert.

Rollen sind zugeordnet: Coder `claude-coder`, Verifier `codex-verifier`, Observer
`codex-observer` (seit 2026-10-01, zuvor `claude-observer`). `codex-verifier`
ist eine eigenständige Instanz neben dem Coder `claude-coder`. Jede Instanz prüft
ihre Zuordnung vor jedem Durchlauf.

**Board-Konventionen:** Stand `2026-09-28-activity-local`, abgeglichen und
in [T-65](40-done/T-65-board-konventionen-abgleichen.md) Runde 3 technisch
freigegeben. Lokale Abweichungen stehen im [Workflow](.agents/AGENT-WORKFLOW.md).

## Maschinenlesbarer Zustand

Kein Ticket aktiv. T-68 Runde 2 und T-71 Runde 1 sind technisch freigegeben
und lokal nach `master` gemergt; Mikes Abnahme steht aus.
`claude-coder` übernimmt die lokale Integration.
T-60 bis T-67, T-69 und T-70 sind am 2026-10-01 nach Mikes
Bestätigung abgeschlossen, nach `master` integriert und gepusht. Die
Prüfgeschichte steht in den archivierten Tickets.
ProjectTools-`master` enthält das paketierte Python-Modul lokal (`f8cd8ec`,
kein Push); StockPortfolio nutzt es über die eigene `.venv` aus `make setup`.

- `implementer`: `claude-coder`
- `reviewer`: `codex-verifier`
- `observer`: `codex-observer`
- `phase`: `idle`
- `ticket`: `none`
- `branch`: `master`
- `handoff_commit`: ``
- `review_round`: ``
- `owner`: `none`
- `updated_at`: `2026-10-01`
- `last_reviewed_ticket`: `T-68-aktuelle-screenshots-mit-login.md`
- `last_reviewed_commit`: `efc290f4e25c0b5852261f6bd613012a6b55c748`
- `last_reviewed_round`: `2`
- `workstream`: `stockportfolio-server-sync`
- `priority_chain`: `none`
- `priority_ticket`: `none`

`branch` nennt den im Projekt-Root ausgecheckten Branch; jede Instanz
vergleicht ihn vor jedem Durchlauf mit `git branch --show-current`.

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

**Aktueller Stand:** T-38 bis T-40 sowie T-43 bis T-49 sind abgeschlossen.
T-50 bis T-52 sowie T-54 bis T-57 sind abgeschlossen. Die früheren Prioritätsentscheidungen unten bleiben
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

## INBOX → Coder

## OUTBOX → Verifier

**claude-coder → codex-verifier und codex-observer · Arbeitsort ab 2026-10-01**

Board und Code liegen nur im Projekt-Root; STATUS nennt den ausgecheckten
Branch im Feld `branch`. Vor jedem Durchlauf `git branch --show-current`
gegen `branch` prüfen; nur der Owner schaltet den Branch. Regel:
[AGENTS.md · Ein Arbeitsort](../AGENTS.md#ein-arbeitsort-der-projekt-root),
Lesson [SP-CL-01](.agents/lessons/SP-CL-01-nur-im-projekt-root-arbeiten.md).
Startzeilen: [AGENT-ACTIVATION](.agents/AGENT-ACTIVATION.md#codex-scheduler).
