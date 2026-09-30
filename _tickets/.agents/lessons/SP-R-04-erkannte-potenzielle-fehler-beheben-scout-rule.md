---
schema_version: 1
id: SP-R-04
project: stockportfolio
kind: case
discovery_phase: human_feedback
affected_work:
- review
- implementation
subject_author: claude
discovered_by: mike
recorded_by: claude
prevention_roles:
- implementer
- reviewer
provenance:
  project: stockportfolio
  evidence:
  - ticket: T-61-benutzergebundene-depotdaten-per-rest.md
    revision: 0ad4a6af2e259a90302042597a4116bd23c537d3
    section: Technische Prüfung Runde 3
  captured_at: '2026-09-30'
---

# SP-R-04 · Erkannte potenzielle Fehler beheben (Scout Rule)

**Grundsatz (Mike, 2026-09-30):** „Verlasse Code immer sauberer als du ihn
betrittst.“ Ein erkannter potenzieller Fehler wird gelöst und nicht als
Hinweis liegen gelassen: „Wenn ein potentieller Fehler erkannt wird muss er
gelöst werden.“

**Erkennung:** Ein Review oder eine Umsetzung stößt auf ein Konstrukt, das
heute niemand auslöst, das aber bei einer plausiblen späteren Änderung still
falsch arbeitet. Typische Formen sind stille Rückfälle, verdeckte Weichen,
Daten, die in einen falschen Speicher geraten, und Prüfungen, die nur zufällig
greifen. Das Warnsignal ist eine Begründung wie „heute führt kein Pfad
dorthin“, mit der der Fund als nicht blockierend eingestuft wird.

**Implementer-Regel:** Stößt du beim Arbeiten auf einen solchen potenziellen
Fehler, behebe ihn im selben Auftrag, soweit er den bearbeiteten Code
berührt. Liegt er klar außerhalb des Auftrags, halte ihn im Ticket als offenen
Punkt fest. Ihn stillschweigend stehen zu lassen, ist keine Option. Ein
Rückfall oder Sonderweg im Produktcode ist keine Testhilfe; Tests brauchen
einen ausdrücklichen Aufbau.

**Verifier-Prüfung:** Einen erkannten potenziellen Fehler als **blockierenden
Befund** melden, mit erwarteter Korrektur und Testbeleg. Das gilt auch, wenn
er heute nicht auslösbar ist. Nicht blockierende Hinweise bleiben reinen
Stil-, Doku- und Gestaltungsfragen ohne Fehlerpotenzial vorbehalten. Bei der
Nachprüfung belegt der Test, dass der Fehlerpfad jetzt ausdrücklich
scheitert oder richtig arbeitet.

**Erwartbarer Beleg:** Im Review steht, welches Konstrukt unter welcher
plausiblen Änderung falsch arbeiten würde, die erwartete Korrektur und ein
Test, der beide Seiten zeigt.

## Originalbeleg und Grenze

In [T-61](../../30-doing/T-61-benutzergebundene-depotdaten-per-rest.md),
technische Runde 3, Fassung `0ad4a6a`, fand Claude, dass die
`create…Repository()`-Fabriken ohne aktiven Datenclient still auf IndexedDB
zurückfallen. Ein Store, der künftig vor der Anmeldung angelegt würde, hätte
Kontodaten unbemerkt in den besitzerlosen Altbestand geschrieben. Claude
stufte das zunächst als nicht blockierenden Hinweis ein, weil heute kein
Store vor der Anmeldung entsteht. Mike korrigierte die Einstufung; der Fund
steht jetzt als Befund 2 im Ticket.

Aufnahme auf Mikes ausdrücklichen Auftrag („Merk dir das auch als Lesson –
Scout Rule“) als Einzelfall-Lehre; weitere Vorfälle werden nicht behauptet.
Verwandt: [SP-R-02](SP-R-02-pruefaussagen-den-tatsaechlich-ausgefuehrten-schritten-zuordnen.md),
[SP-R-03](SP-R-03-neue-ansichten-gegen-bestehende-nachbarn-pruefen.md).
