# StockPortfolio · Rollen und Kommunikationsstatus

**T-38 ist umgesetzt und zur unabhängigen Prüfung an Claude übergeben.**
T-39 und T-40 sind technisch freigegeben. Beide warten
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
- `phase`: `ready_for_review`
- `ticket`: `T-38-basiswaehrung-und-devisenkurse.md`
- `handoff_commit`: `674b3705c07220c19613c5a88b1a02d3512d0699`
- `review_round`: `1`
- `owner`: `claude`
- `updated_at`: `2026-09-10`
- `last_reviewed_ticket`: `T-40-detailanzeige-aus-feldkatalog.md`
- `last_reviewed_commit`: `71a4ff8a5bba963134039a6840250800f13a4192`
- `last_reviewed_round`: `1`
- `workstream`: `stockinfo-integration`
- `priority_chain`: `T-38-basiswaehrung-und-devisenkurse.md`
- `priority_ticket`: `T-38-basiswaehrung-und-devisenkurse.md`

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
Detailanzeige. Beide liegen auf Mikes Ansage direkt unter `30-doing/` und
stehen vor T-38. Angelegt hat sie `claude`; das ist Board-Arbeit auf
ausdrücklichen Auftrag, keine begonnene Implementierung und kein Reviewurteil.

**Aktueller Schritt:** `codex` setzt T-38 auf der von Claude freigegebenen
T-40-Fassung `71a4ff8a5bba963134039a6840250800f13a4192` um. T-39 und
T-40 haben keine erforderliche Nacharbeit. Ihre ersten Sichtprüfungen sind
dokumentiert; beide bleiben bis zu Mikes Abschlussabnahme unter `30-doing/`.
Die bereits eingeplante Folgearbeit wird fortgesetzt.

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
| [T-40](30-doing/T-40-detailanzeige-aus-feldkatalog.md) | Detailanzeige umgesetzt; Runde 1 technisch freigegeben, menschliche Abschlussabnahme offen. |
| [T-38](30-doing/T-38-basiswaehrung-und-devisenkurse.md) | Umgesetzt; eigene UI-Prüfung und isolierte Gesamtprüfung erfolgreich. Runde 1 an Claude übergeben. |
| 26 Tickets aus `solved/` | Nach `40-done/` übernommen; bestehender Archivstatus und Inhalte bleiben erhalten. |

T-31 bis T-34 sind übernommene offene Arbeit, keine gleichzeitig aktivierten
Agentenaufträge. T-38 liegt zum Review bei Claude; T-39 und T-40 warten auf die
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

Leer. T-40 Runde 1 verarbeitet; Befunde bleiben im Ticket.

## OUTBOX → Verifier

**An `claude`: T-38, Runde 1**, Produktfassung
`674b3705c07220c19613c5a88b1a02d3512d0699`.

Depot-Basiswährung über UI, FX-Konvertierung für alle Rechenwege, Stale-Warnung,
Währung in Tageswerten und Backup sind umgesetzt. Vollständiger Umfang,
Ausführungsentscheidungen und Nachweise stehen ausschließlich im
[T-38-Ticket](30-doing/T-38-basiswaehrung-und-devisenkurse.md).

Eigene Browserprüfung mit echtem StockInfo-Testserver und lokalen Quellen:
EUR/USD/GBp, Stale/fehlend/Rate 0, Handel, Depotwechsel, leere Währungsänderung,
Backup/Reload, Desktop/Mobil, DE/EN. Isolierte eigene Fassung: **52 Dateien,
711 Tests**, Lint und Typecheck erfolgreich; 163 Dateien bytegleich zum Index.

Bitte die Produktfassung unabhängig prüfen, insbesondere FX-Richtung und
Pence-Skalierung, Ausschluss ohne FX, historische Währungstrennung und Schutz
bestehender Beträge. Historische FX-Daten sind nicht verfügbar; daher bleibt
der entsprechende Rückblick mit Erklärung aus. Keine allgemeine Migration.
Fremde Änderungen im gemeinsamen Arbeitsbaum sind nicht Teil der Übergabe.
Die erste UI-Prüfung wurde wie von Mike verlangt durch Codex erledigt.
