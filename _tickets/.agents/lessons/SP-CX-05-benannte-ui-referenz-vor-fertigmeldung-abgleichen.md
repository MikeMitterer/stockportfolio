---
schema_version: 1
id: SP-CX-05
project: stockportfolio
kind: case
discovery_phase: human_feedback
affected_work:
- implementation
- handoff
- review
subject_author: codex
discovered_by: Mike
recorded_by: codex-observer
prevention_roles:
- implementer
- reviewer
provenance:
  project: stockportfolio
  evidence:
  - ticket: T-50-github-link-statuszeile.md
    revision: 75cac676c36f15d5041ce15c47e09a968d975670
    section: Umsetzung und technische Nachweise / Auflösung
  - ticket: T-50-github-link-statuszeile.md
    revision: 9910e5a7f60192345fb66abc25ad9493011bc68b
    section: Unabhängige Prüfung / Auflösung
  - ticket: T-50-github-link-statuszeile.md
    revision: a8a6eb039903865e881f0ba69ac1a2eef774196b
    section: Auftrag / Neuer Befund
  captured_at: '2026-09-27'
---

# SP-CX-05 · Benannte UI-Referenz vor Fertigmeldung abgleichen

**Erkennung:** Der Nutzer nennt eine vorhandene Oberfläche als Referenz.
Umsetzung und Prüfung belegen die allgemeine Funktion, lassen aber deren
sichtbare Merkmale weg. Selbst formulierte Akzeptanzkriterien verkürzen dadurch
den ursprünglichen Auftrag; ein grüner Testlauf ersetzt den Vergleich nicht.

**Implementer-Regel:** Vor Umsetzung die betreffende Referenz lesen und die
zu übernehmenden Merkmale knapp festhalten: Symbol oder Text, Reihenfolge,
Trenner und Verhalten bei schmaler Darstellung. Vor der Fertigmeldung genau
diese Merkmale an der tatsächlichen Ausgabe vergleichen. Lokale Regeln weiter
einhalten; die Referenz erlaubt nicht pauschal das Kopieren fremder Stile.

**Verifier-Prüfung:** Nutzerauftrag samt Referenz gegen die Prüffassung halten,
nicht nur die Kriterien des Coders. Bei T-50: Herkunft · GitHub-Symbol · Depot
· Kursalter, mobil Herkunft samt erstem Punkt ausgeblendet, zugänglicher Name
und korrektes Linkziel. DOM-Reihenfolge und sichtbare Darstellung belegen;
Quelltextprüfung und eigene Browserprüfung getrennt benennen. Kein zusätzlicher
pauschaler Testlauf folgt daraus.

## Originalbeleg und Grenze

Mike beauftragte in [T-50](../../40-done/T-50-github-link-statuszeile.md) den
GitHub-Link mit „vergleiche mit StockInfo“. Codex setzte in `75cac676` einen
Textlink um und erklärte Umsetzung und eigene Verifikation für abgeschlossen.
Die Kriterien prüften Ziel und Bedienbarkeit, aber weder das Referenzsymbol
noch dessen Position vor dem Depot. StockInfos
`dashboard/src/components/StatusBar.vue`, gelesen bei HEAD `a26fbbf`, enthält
Symbol, Trennpunkte und anschließend den Kontext im linken Slot.

Claude gab `75cac676` in Runde 1 ohne Befund frei (`9910e5a`) und kennzeichnete
offen, keinen eigenen Browserdurchlauf ausgeführt zu haben. Die Prüflücke war
der fehlende Referenzabgleich, kein erfundener Browsertest. Mike stellte danach
klar: „Github-Symbol zwischen Powered by... und Depot“ und „Getrennt durch
einen Punkt“. Codex erkannte im Ticket ausdrücklich an, dass die frühere
Fertigmeldung die Vorgabe nicht vollständig erfüllte. Nacharbeit `d7244d9`
ergänzt den Vergleich.

Aufnahme wegen der belegten unvollständigen Fertigmeldung: **ein Vorfall**,
keine Wiederholung behauptet. Produktautor ist Codex, Autor der zitierten
Reviewrückgabe Claude. AL-R-01/02 passen ergänzend; diese Datei hält den lokalen
Beleg fest. Keine Änderung gemeinsamer Regeln oder Board-Konventionen.
