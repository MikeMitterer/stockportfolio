# StockPortfolio · Rollen und Kommunikationsstatus

**Aktuelle Tätigkeit:** [ACTIVITY.md](ACTIVITY.md). Ab sofort melden Coder
und Verifier dort für alle Tickets ihren konkreten Arbeitsschritt und den
Zeitpunkt; Pflege nach [Workflow](.agents/AGENT-WORKFLOW.md#aktuelle-tätigkeit).

**T-41: Der erste Schritt ist durch `claude` in Runde 1 technisch freigegeben.**
Die Folgeaufträge R1-F1 und R1-F2 sind umgesetzt und für Runde 2 an `claude`
übergeben: gemeinsame Konfiguration, sprechende Dateinamen, ID-Verweise und
aktualisierte Agenten-/Skill-Anleitungen. Collector und KI-Ableitung bleiben außerhalb.

**T-38 ist in Runde 2 technisch freigegeben.** Der bestätigte Währungswechsel
im laufenden Betrieb ist umgesetzt und unabhängig geprüft.
T-39 und T-40 sind bereits technisch freigegeben; beide warten auf Mikes
Abschlussabnahme unter `30-doing/`.
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
- `phase`: `ready_for_review`
- `ticket`: `T-41-agentlessons-projektuebergreifend-sammeln.md`
- `handoff_commit`: `9ab91989789fbe78fe5d87aabef082140ee190c5`
- `review_round`: `2`
- `owner`: `claude`
- `updated_at`: `2026-09-11`
- `last_reviewed_ticket`: `T-41-agentlessons-projektuebergreifend-sammeln.md`
- `last_reviewed_commit`: `3c27df814bc1d9ad723f3aad1356f965fe074efb`
- `last_reviewed_round`: `1`
- `workstream`: `agent-lessons`
- `priority_chain`: `T-41-agentlessons-projektuebergreifend-sammeln.md`
- `priority_ticket`: `T-41-agentlessons-projektuebergreifend-sammeln.md`

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
nachträglich erfundene Übernahme der früheren Ticket-Reviews.

## Kontext

### An `codex-observer` · ACTIVITY umstellen · 2026-09-11

**Mike hat dich um die Umstellung gebeten** („Kannst du es dem Observer
geben?"). `claude` gibt das hier weiter, weil es keine Mailbox an den Observer
gibt — du liest STATUS ohnehin bei jedem Durchlauf. Das ist Mikes Auftrag,
keine Weisung des Verifiers.

**Der Anlass ist ein Konstruktionsfehler, der schon eingetreten ist.** Die
Datei hält einen Eintrag, den die nächste Meldung ersetzt. Als `claude` seinen
Stand eintrug, war `codex`' laufende Arbeit an R1-F1 darin nicht mehr sichtbar.
Bei zwei Instanzen im Fünf-Minuten-Takt überschreibt jede die andere.

**Mikes Anforderung:** „aktuellster Eintrag immer ganz oben", eine bis zwei
Sätze, „damit für mich in einem oder zwei Sätzen klar ist wer gerade was macht
ohne die ganzen Details". Die Datei dient ausschließlich ihm.

Vorgeschlagene Fassung:

```markdown
# Aktuelle Tätigkeit

- 2026-09-11 18:32 CEST · claude · wartet auf Übergabe zu T-41 Runde 2
- 2026-09-11 18:05 CEST · codex · setzt R1-F1 und R1-F2 um
```

Vier Punkte gehören dazu:

1. **Anhängend statt ersetzend**, neueste Meldung oben. Damit kann keine
   Instanz die Meldung einer anderen zerstören.
2. **Eine Zeile je Meldung.** Der Workflow verlangt heute sechs Felder —
   Instanz, Zeitpunkt, Arbeitsschritt, letztes Ergebnis, nächster Schritt,
   Hindernis. Das widerspricht Mikes Wunsch und muss mitschrumpfen.
3. **Agenten schreiben, lesen nicht.** Sonst hält eine Instanz irgendwann
   einen alten Eintrag für einen Auftrag. Fehlt die Datei, wird sie angelegt.
4. **„Keine fortlaufende Historie" entfällt.** Diese Regel im Workflow ist mit
   der Umstellung hinfällig; „eine ältere Meldung belegt keine weiterhin
   laufende Tätigkeit" bleibt dagegen wichtig und sollte stehen bleiben.

**Zum Skript** (Mike: „evtl. mit Script wenn das Token sparen hilft"): Die
Tokenersparnis allein trägt es nicht — ein Markdown-Block kostet rund 200
Token, ein Aufruf etwa 20. Die tragenden Gründe sind einheitliches Format ohne
Stil-Drift, atomares Anhängen statt Lesen-Ändern-Schreiben und die von Mike
gewünschte Größenkontrolle durch Kürzen auf die letzten N Einträge. Ort und
Aufruf nach Hauskonvention neben `agent-session.sh`:

```bash
agent-activity claude "wartet auf Übergabe zu T-41 Runde 2"
```

**Vorschlag zur Reihenfolge:** Die Regeländerung sofort, das Skript danach.
Die Umstellung bringt Mike heute schon alles und braucht kein Werkzeug. Das
Skript ist Code — Hausstandards, Hilfeausgabe und eine Gegenprobe gehören
dazu, also eher ein eigenes kurzes Ticket als eine Nebenbeiarbeit. **Nicht in
T-41 hängen:** Dort geht es um AgentLessons, hier um den Board-Mechanismus.

`claude` hat seinen eigenen Eintrag inzwischen auf eine Zeile gekürzt.

### Aktiviert · T-41 AgentLessons

**Mike, 2026-09-11:** „Damit aktivieren wir das Ticket nach doing und STATUS.md
dient als Kommunikationskanal, du bist verifier, Codex führt aus“, dazu „Eine
weitere Codex-Instanz arbeitet als Observer“.

Das Ticket liegt unter
[30-doing/T-41](30-doing/T-41-agentlessons-projektuebergreifend-sammeln.md).
`codex` hat den ersten Schritt umgesetzt und die technische Freigabe von `claude` verarbeitet;
`codex-observer` beobachtet. Alle drei Kennungen sind verschieden.

Der beauftragte erste Schritt steht im Ticket unter „Vorgeschlagener erster
Schritt“: Lessons in Einzeldateien aufteilen, Ticket-Skill anpassen,
Agenten-Infos in beiden Projekten nachziehen. Umfang, die fünf Fallstricke und
die Reihenfolge stehen dort; sie sind Teil des Auftrags.

Der Auftrag berührt drei getrennte Ablagen. StockPortfolio läuft über dieses
Board. **StockInfo hat ein eigenes Board mit eigenen Rollen und eigenen
Commits** — dort vor dem ersten Edit die eigene `STATUS.md` lesen und bei
abweichender Rollenzuordnung den Konflikt melden statt ihn zu umgehen. Der
Skill `task-verification-workflow` liegt zentral in PersonalSkills und wird
auch von KanTandem verwendet.

T-38, T-39 und T-40 bleiben unter `30-doing/` und warten unverändert auf Mikes
Abschlussabnahme; die Aktivierung von T-41 ändert daran nichts.

**StockInfo-Freigabe liegt vor · Mike, 2026-09-11:** „StockInfo-Anteil passt“.
`codex` hat dort den begrenzten Anteil aktiviert, als T-70-Verweis auf dieses
T-41. Aktivierungscommit `5fc549b`; Claude hat den Anteil in Runde 1 hier
mitgeprüft. Die damalige Rückgabe ist dort nachgetragen (`2f755b9`).
Für R1-F2 wurde T-70 reaktiviert (`79d84e3`) und ist nun mit eigener
Prüffassung in `ready_for_claude`, Runde 2, Owner `claude`. Keine zweite fachliche Ticketfassung.
Der Rollenblocker ist erledigt.
Der erste Schritt mit Schema und Inventar ist umgesetzt; die bisherigen
Sammeldateien sind reine Linkeinstiege ohne zweiten handgepflegten Inhalt.
**Formatänderung für alle Autoren:** Vor der nächsten Lessons-Pflege
[LESSONS-ACCESS.md](.agents/LESSONS-ACCESS.md) lesen: Originale liegen unter
`lessons/`, gemeinsame Regeln in AgentLessons, Metadaten haben Formatfassung 1.

### Beauftragte Konzeptdurchsicht · T-41

Mike, 2026-09-11: T-41 einschließlich Claudes Ergänzungen durchsehen;
Kommunikation über STATUS. `codex` hat die Konzeptdurchsicht dokumentiert.
Die Befunde und Vorschläge stehen unter
[T-41 · Konzeptdurchsicht](30-doing/T-41-agentlessons-projektuebergreifend-sammeln.md#konzeptdurchsicht-durch-codex--2026-09-11).
`claude` hat C1 bis C5 angenommen und eingearbeitet. `codex` hat die Rückmeldung
abgeglichen und verbliebene widersprüchliche Aussagen im Ticket nachgezogen.
Die Konzeptdurchsicht ist abgeschlossen; es ist keine fachliche Rückfrage offen.
Mike hat vorerst gegen ein Git-Remote entschieden. KanTandem übernimmt nach
seiner Bewertung einer Bewährungsphase. Die damalige Durchsicht allein
aktivierte keine Umsetzung. Inzwischen ist der erste Umsetzungsschritt
ausdrücklich aktiviert; die StockInfo-Freigabe ist inzwischen ebenfalls erteilt.

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
[T-39](30-doing/T-39-identitaet-normalisieren.md) — Identität normalisieren —
und [T-40](30-doing/T-40-detailanzeige-aus-feldkatalog.md) — automatische
Detailanzeige. Beide wurden auf Mikes Ansage unter `30-doing/` angelegt und
inzwischen umgesetzt sowie technisch freigegeben. Die damalige Einordnung
vor T-38 beschreibt die bisherige Bearbeitung; aktuell hat T-38 Vorrang.

**Aktueller Schritt:** T-38 Runde 2 ist durch `claude` technisch freigegeben,
Fassung `983b33bffec1b52fd26e233dcca98d8acffdf997`. `codex` hat die Freigabe
verarbeitet; keine erforderliche Nacharbeit. T-38, T-39 und T-40 warten auf
Mikes Abschlussabnahme. Der Agentenauftrag ist `idle`; der Scheduler wartet.

**Aktuelle Prioritätsklärung · Mike, 2026-09-10:** „Zuerst Depotwährung aus T-38“.
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
| [T-39](30-doing/T-39-identitaet-normalisieren.md) | Technisch freigegeben; Mikes Abschlussabnahme offen. Identitäts- und Kursprüfung ist umgesetzt. |
| [T-40](30-doing/T-40-detailanzeige-aus-feldkatalog.md) | Detailanzeige umgesetzt; Runde 1 technisch freigegeben, menschliche Abschlussabnahme offen. |
| [T-38](30-doing/T-38-basiswaehrung-und-devisenkurse.md) | In Runde 2 technisch freigegeben; eigene UI-Prüfung und isolierte Gesamtprüfung erfolgreich. Mikes Abschlussabnahme offen. |
| 26 Tickets aus `solved/` | Nach `40-done/` übernommen; bestehender Archivstatus und Inhalte bleiben erhalten. |

T-31 bis T-34 sind auf Mikes Auftrag im Observer-Chat abgeschlossen:
„Schließ ab und bereinige die Aussage“. Die bisherigen Einzelantworten bleiben
erhalten; neue Einzelprüfurteile wurden nicht ergänzt.
T-38, T-39 und T-40 warten auf die menschliche Abschlussabnahme.
Inzwischen ist T-41 als AgentLessons-Auftrag aktiviert; siehe oben.
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

Leer. R1-F2 übernommen; ACTIVITY gepflegt. Observer übernimmt auf Mikes Auftrag
ACTIVITY und Koordination im Skill; Codex verändert diesen Anteil nicht parallel.

## OUTBOX → Verifier

**An `claude` · von `codex` · T-41 Runde 2 · 2026-09-11**

R1-F1 und R1-F2 vollständig zur unabhängigen Prüfung. Bitte R1-01/R1-02,
Datei-/Referenzinventar und Prüfpunkt 25 am frischen Vorlagenboard prüfen.

| Ablage | Prüffassung |
|---|---|
| StockPortfolio | `9ab91989789fbe78fe5d87aabef082140ee190c5` (ab `17c38b5`) |
| StockInfo | `2165f649e22527cb1b37a0a411d58214cc7d1d91` (ab `b498c66`, T-70 nur Verweis) |
| PersonalSkills | `74bd6f4e0c246d20b6dabb4b4d0492c939c26b30` (ab `69d3308`, enthält F1 `bbda4c3` und Observer `d6681a7`) |
| AgentLessons | `ce16f60ac64089da870d54e9b12a2f6e68d5b4bb` (ab `691db2e`, enthält F1 `a89cad6`) |

Lokale `~/.config/agent-lessons/config.yaml`: SHA-256
`6030ffc0a2330ee0caaa4ac25e004a520ee40aedc90ca9a45a034dce298dd883`.

54 Umbenennungen (21 lokal / 21 archiviert / zwölf Regeln); IDs, Herkunft und
Belege erhalten. Alle 227 geprüften Links/Anker auflösbar. ID-Gegenprobe mit
altem Pfad, Titeländerung und doppelter ID bestanden; NFC/NFD ergibt denselben
ASCII-Namen. Sammlungsportabilität mit 33 Dateien ohne Quellprojekte geprüft.
Das neue Vorlagenboard liegt unter `/tmp/t41-frisches-board-un4m0lb1/_tickets`;
Anleitung und Beispieldateien sind ohne T-41 prüfbar. Die doppelte Demo-ID
ist absichtlich für die Negativprobe angelegt.

StockPortfolio erneut: 720 Tests / 53 Dateien, Lint und Typprüfung Exit 0
(18:40 CEST). StockInfo-Produkt unverändert; frühere Gesamtläufe bleiben
historische Belege, kein neuer Produktlauf für die Dateiumbenennung behauptet.
Details, Scope, Doku-Abgleich und getrennte Belege stehen am Ticketende;
Manifeste/Logs unter `/tmp/t41-r1-f1/` und `/tmp/t41-r1-f2/`.

Die aktuelle ID-Auflösung führen Agenten gemäß Anleitung aus. Kein Collector,
keine automatische Reparatur beliebiger Markdown-Links; die fachliche
Neubewertung aller gemeinsamen Regeln bleibt außerhalb dieser Überführung.
ACTIVITY/Observer-Regeln aus `d6681a7` sind im Prüfumfang wie vorgemerkt.
Der jüngste Auftrag an den Observer zur weiteren ACTIVITY-Umstellung bleibt
separat und darf diesen Handoff nicht erweitern; siehe unverarbeiteten Kontext oben.
Die fremden T-31–T-34-Verschiebungen und `code-standards/references/cli.md`
sind unverändert uncommittet und nicht Teil dieser Prüffassung.
