---
schema_version: 1
id: SP-CX-06
project: stockportfolio
kind: pattern
discovery_phase: review
affected_work:
- implementation
- review
subject_author: codex
discovered_by: claude
recorded_by: claude-observer
prevention_roles:
- implementer
- reviewer
provenance:
  project: stockportfolio
  evidence:
  - ticket: T-63-reproduzierbarer-lokaler-teststack.md
    revision: 33e9602
    section: Technische Prüfung Runde 4 · mit erneuter T-60-Prüfung
  - ticket: T-63-reproduzierbarer-lokaler-teststack.md
    revision: a0ae160
    section: Technische Prüfung Runde 5
  captured_at: '2026-09-30'
---

# SP-CX-06 · Gemeinsame Kopfzeile über alle Breiten prüfen

**Erkennung:** Ein neuer oder breiterer Eintrag kommt in eine gemeinsame
Leiste (Kopfzeile, Navigation, Statuszeile). Geprüft wird nur die Breite, an
der ein Fehler gemeldet wurde, oder nur die im Ticket genannten Breiten. Bei
einer anderen Breite überlappen danach Einträge, und Links sind nicht mehr
klickbar.

**Belege · 2026-09-30:** Die Codex-Fassung `1d534ce` fügte der Kopfzeile ein
Personen-Icon hinzu und zeigte im Konto-Knopf den Benutzernamen. Claude fand in
Runde 4, dass bei 390 px Assets, Einstellungen und Benutzerverwaltung unter
den Knöpfen lagen. Die Korrektur `7eb4224` behob genau 390 px (und 320 px).
In Runde 5 zeigte Claudes Scan von 360 bis 1280 px dieselbe Ursache erneut
zwischen etwa 768 und 860 px: Die Leiste schaltet dort wieder alle
Beschriftungen und den Benutzernamen ein, der Platz reicht aber nicht.

**Lücke:** Die Korrektur zielte auf den gemeldeten Messpunkt statt auf die
Ursache: zusätzlicher Platzbedarf in einer Leiste, deren Umschaltpunkte
(`sm`, `md`) unverändert blieben.

**Implementer-Regel:** Wer einer gemeinsamen Leiste etwas hinzufügt oder
einen Eintrag breiter macht, prüft die Leiste vor der Übergabe über den
ganzen Breitenbereich, mindestens an jedem Umschaltpunkt und direkt darüber
und darunter. Beleg ist ein Scan, der für jeden sichtbaren Eintrag meldet, ob
er klickbar ist (etwa per `elementFromPoint`), nicht ein einzelner
Screenshot. Eine Korrektur nach einem Befund behebt die Ursache für alle
Breiten, nicht nur den gemeldeten Wert.

**Verifier-Gegenprobe:** Bei jeder Änderung an einer gemeinsamen Leiste
selbst über die Breiten scannen, nicht nur die im Ticket genannten prüfen.
Bei einer Korrektur eines Breitenbefunds ausdrücklich die Nachbarbereiche und
Umschaltpunkte nachmessen.

Erfasst von `claude-observer`; beide Funde durch `claude` in den Runden 4
und 5; Autor der untersuchten Fassungen `codex`. Verwandt:
[SP-R-03](SP-R-03-neue-ansichten-gegen-bestehende-nachbarn-pruefen.md)
für den Vergleich mit Nachbaransichten.
