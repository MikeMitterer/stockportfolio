# StockPortfolio · Rollen und Kommunikationsstatus

**T-37 ist zur Bearbeitung aktiviert, danach folgt T-38.** Mike hat diese
Reihenfolge am 2026-09-10 im Codex-Chat beauftragt. T-37 beginnt mit der
Vertragsbewertung und der Klärung des Feldbedarfs; T-38 ist eingeplant.
T-31 bis T-34 behalten ihre offenen Abnahmen; T-35 und T-36 bleiben im Backlog.

**Der Observer ist als `codex-observer` zugeordnet.** Er beobachtet unabhängig
vom Owner und meldet Hinweise im eigenen Chat. Die Startbefehle und beide
Scheduler-Varianten stehen in [AGENT-ACTIVATION.md](.agents/AGENT-ACTIVATION.md).
Eine Zuordnung ist noch kein Nachweis eines laufenden Prozesses.

## Maschinenlesbarer Zustand

- `implementer`: `codex`
- `reviewer`: `claude`
- `observer`: `codex-observer`
- `phase`: `blocked`
- `ticket`: `T-37-stockinfo-quote-vertrag-und-dynamische-felder.md`
- `handoff_commit`: `none`
- `review_round`: `0`
- `owner`: `codex`
- `updated_at`: `2026-09-10`
- `last_reviewed_ticket`: `none`
- `last_reviewed_commit`: `none`
- `last_reviewed_round`: `0`
- `workstream`: `stockinfo-integration`
- `priority_chain`: `T-37-stockinfo-quote-vertrag-und-dynamische-felder.md, T-38-basiswaehrung-und-devisenkurse.md`
- `priority_ticket`: `T-37-stockinfo-quote-vertrag-und-dynamische-felder.md`

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
Reihenfolge: T-37 vor T-38. T-37 liefert zunächst den im Ticket beschriebenen
Integrationsvorschlag; seine Feldentscheidungen bleiben bis zu Mikes Antwort
offen. Für T-38 hat Mike am 2026-09-10 eine vom Nutzer konfigurierbare
Basiswährung **je Depot** festgelegt. Typische Wahl: EUR im Euroraum, USD in
den USA; Hauptfall ist das Depot mit gewählter Währung. Der Umgang mit
veralteten FX-Kursen bleibt offen. T-38 folgt mit Umrechnung. Die Abhängigkeit zu
T-35 wird geprüft; damit ist T-35 nicht insgesamt aktiviert.

Arbeitsbranch: `t-37-stockinfo-integrationsvertrag`. Bereits vorgefundene
uncommittete Produktänderungen gehören nicht zu dieser Bewertungsübergabe.

**Offener Entscheidungsbedarf:** Der technische Vorschlag zu T-37 liegt unter
`docs/stockinfo-integration-proposal.md`. Für den Abschluss fehlen die im
Ticket geforderten Antworten A/B: zusätzliche Kennzahlen und Auswahl gegenüber
automatischer Zusatzanzeige. Die Fragen wurden im Codex-Chat gestellt.
Bis dahin keine endgültige Feldauswahl, Produktimplementierung oder Übergabe
als vollständig abgestimmter Vorschlag. Der Scheduler bleibt aktiv.

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
| [T-37](30-doing/T-37-stockinfo-quote-vertrag-und-dynamische-felder.md) | Erste Bewertung liegt vor; seit 2026-09-10 zur Bearbeitung aktiviert, Umfangsentscheidungen A/B werden geklärt. |
| [T-38](20-ready/T-38-basiswaehrung-und-devisenkurse.md) | Seit 2026-09-10 nach T-37 eingeplant; konfigurierbare Basiswährung je Depot entschieden, veraltete Kurse und notwendiger Währungsanteil aus T-35 werden geklärt. |
| 26 Tickets aus `solved/` | Nach `40-done/` übernommen; bestehender Archivstatus und Inhalte bleiben erhalten. |

T-31 bis T-34 sind übernommene offene Arbeit, keine gleichzeitig aktivierten
Agentenaufträge. T-37 ist aktiv, T-38 liegt unter `20-ready/`.
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

Leer. Empfänger ist bei aktiver Zuordnung `implementer`.

## OUTBOX → Verifier

Leer. Empfänger ist bei aktiver Zuordnung `reviewer`.
