# StockPortfolio · Rollen und Kommunikationsstatus

**T-39 und T-40 sind technisch freigegeben; danach folgt T-38.** Beide warten
auf Mikes Abschlussabnahme und bleiben bis dahin unter `30-doing/`.
Mike hat die Reihenfolge im Observer-Chat bestätigt.
T-37 ist als Bewertung technisch freigegeben und durch Mike am 2026-09-10
abgeschlossen: „T-37 ist damit erledigt“. Es liegt unter `40-done/`.
T-31 bis T-34 behalten ihre offenen Abnahmen; T-35 und T-36 bleiben im Backlog.

**Der Observer ist als `codex-observer` zugeordnet.** Er beobachtet unabhängig
vom Owner und meldet Hinweise im eigenen Chat. Die Startbefehle und beide
Scheduler-Varianten stehen in [AGENT-ACTIVATION.md](.agents/AGENT-ACTIVATION.md).
Eine Zuordnung ist noch kein Nachweis eines laufenden Prozesses.

## Maschinenlesbarer Zustand

- `implementer`: `codex`
- `reviewer`: `claude`
- `observer`: `codex-observer`
- `phase`: `approved`
- `ticket`: `T-40-detailanzeige-aus-feldkatalog.md`
- `handoff_commit`: `71a4ff8a5bba963134039a6840250800f13a4192`
- `review_round`: `1`
- `owner`: `codex`
- `updated_at`: `2026-09-10`
- `last_reviewed_ticket`: `T-40-detailanzeige-aus-feldkatalog.md`
- `last_reviewed_commit`: `71a4ff8a5bba963134039a6840250800f13a4192`
- `last_reviewed_round`: `1`
- `workstream`: `stockinfo-integration`
- `priority_chain`: `T-40-detailanzeige-aus-feldkatalog.md, T-38-basiswaehrung-und-devisenkurse.md`
- `priority_ticket`: `T-40-detailanzeige-aus-feldkatalog.md`

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

### Aktueller Auftrag

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

Arbeitsbranch: `t-40-detailanzeige-aus-feldkatalog`. Der geplante T-38-Worktree
wurde nicht angelegt; auch der zugehörige Branch existiert nicht.
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
Detailanzeige. Beide liegen auf Mikes Ansage direkt unter `30-doing/` und
stehen vor T-38. Angelegt hat sie `claude`; das ist Board-Arbeit auf
ausdrücklichen Auftrag, keine begonnene Implementierung und kein Reviewurteil.

**Aktueller Schritt:** `claude` hat T-40 Runde 1 an der Fassung
`71a4ff8a5bba963134039a6840250800f13a4192` geprüft und technisch freigegeben;
keine Nacharbeit. Vier Befunde ohne Nacharbeitsbedarf stehen im Ticket. Für
T-39 gilt dasselbe seit Runde 1. Beide Tickets warten auf Mikes
Abschlussabnahme und bleiben unter `30-doing/`; die eingeplante Folgearbeit
T-38 kann davon unabhängig beginnen.

Mike hat im Observer-Chat am 2026-09-10 ausdrücklich geschrieben:
„Aktuell sollen die Folgetickets von T-37 erledigt werden erst dann T-38
überprüfe die Reihenfolge, ich glaube das macht sinn“.
Die Folgetickets sind T-39 und T-40. Das bestätigt die bestehende Kette
T-39 → T-40 → T-38; neue Folgetickets von T-38 sind daraus nicht beauftragt.
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
| [T-31](30-doing/T-31-refresh-erzwingt-frische-kurse.md) | Bisher `in-progress`; Umsetzung beschrieben, menschliche Sichtprüfungen #3, #4, #6, #7 offen. Vorhandene Antworten bleiben erhalten. |
| [T-32](30-doing/T-32-fortschrittsleiste.md) | Bisher `in-progress`; Umsetzung beschrieben, menschliche Sichtprüfungen #3, #5, #6, #8 offen. |
| [T-33](30-doing/T-33-schonfrist-automatisches-laden.md) | Bisher `in-progress`; Umsetzung beschrieben, menschliche Sichtprüfungen #4, #5 offen. |
| [T-34](30-doing/T-34-einstellungen-fuers-aktualisieren.md) | Bisher `in-progress`; Umsetzung beschrieben, menschliche Sichtprüfungen #1–#4 und #6 offen. |
| [T-35](10-backlog/T-35-stockinfo-generation-und-waehrung.md) | Bisher `offen`; ausführlicher Entwurf mit bisherigen Prüfnotizen, Implementierungsnachweise leer. Keine belegte Einplanung der Umsetzung. Abhängigkeiten vor Aufnahme neu prüfen. |
| [T-36](10-backlog/T-36-eslint-waechter-aus-dem-fundament.md) | Bisher `blocked`; wartet laut Ticket auf eine installierbare ux-foundation-Fassung. Keine begonnene Umsetzung; Voraussetzung vor Einplanung neu prüfen. |
| [T-37](40-done/T-37-stockinfo-quote-vertrag-und-dynamische-felder.md) | Bewertung durch claude in Runde 1 technisch freigegeben; am 2026-09-10 durch Mike abgeschlossen. Umsetzung separat in T-39 und T-40. |
| [T-39](30-doing/T-39-identitaet-normalisieren.md) | Technisch freigegeben; Mikes Abschlussabnahme offen. Identitäts- und Kursprüfung ist umgesetzt. |
| [T-40](30-doing/T-40-detailanzeige-aus-feldkatalog.md) | Detailanzeige umgesetzt; Runde 1 an Claude übergeben, menschliche Abschlussabnahme offen. |
| [T-38](30-doing/T-38-basiswaehrung-und-devisenkurse.md) | Nach T-40 eingeplant; Depot-Basiswährung und FX-Bewertung mit Warnung bei veralteten Kursen. |
| 26 Tickets aus `solved/` | Nach `40-done/` übernommen; bestehender Archivstatus und Inhalte bleiben erhalten. |

T-31 bis T-34 sind übernommene offene Arbeit, keine gleichzeitig aktivierten
Agentenaufträge. T-40 ist im Review; T-38 folgt danach. T-39 wartet auf die
menschliche Abschlussabnahme.
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
werden entfernt. Die Umstellung enthält keine neue Review-Übergabe.

## INBOX → Coder

**An `codex` · T-40 · Runde 1 · 2026-09-10 · `approved`**

Geprüfte Fassung `71a4ff8a5bba963134039a6840250800f13a4192`. Keine Nacharbeit.

Eigene Ausfertigung des Commits, 46 Dateien / 679 Tests grün, Lint und
Typprüfung Exit 0 — wie angegeben. Vierzehn eigene Zusicherungen gegen
`projectDetailFields` bestätigen Hauptzeilenabgleich, `0`/`false`/`null`,
getrennte Schlüssel bei gleicher Beschriftung, Betragswährung am Wert,
wirksamen gegen manuellen Wert, widersprüchliche Einheit, Prozentmaßstab,
Scope und den Fall ohne Kurs.

Die Anwendbarkeitsprüfung spiegelt StockInfos `applies()` exakt, einschließlich
leerer Scope-Liste. Der zeilengenaue `stockInfoFields`-Ansatz erfüllt die
Vorgabe ohne zweite Pflegeliste. Katalogausfall lässt die Kurse unberührt;
fehlend und leer sind unterschieden; kein `v-html`; keine Detailwerte in der
Domainrechnung. Kein Browserlauf durch mich.

Vier Befunde ohne Nacharbeitsbedarf stehen im Ticket unter „Review Runde 1“:
serverbestimmte Feldreihenfolge, ungenutzte `minimum`/`maximum`, mehrfache
Projektion je Zeile und der weiterhin offene Punkt zu den beiden
`apiBaseUrl`-Tests aus dem T-39-Review.

Offen bleiben Mikes Abnahmen für T-39 und T-40. Kein Verschieben nach
`40-done/` durch den Verifier.

## OUTBOX → Verifier

Leer. Empfänger ist bei aktiver Zuordnung `reviewer`.
