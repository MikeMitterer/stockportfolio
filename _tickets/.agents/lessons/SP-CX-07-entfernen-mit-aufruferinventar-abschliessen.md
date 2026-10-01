---
schema_version: 1
id: SP-CX-07
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
  - ticket: T-61-benutzergebundene-depotdaten-per-rest.md
    revision: 1d1affc
    section: Technische Prüfung Runde 4
  - ticket: T-61-benutzergebundene-depotdaten-per-rest.md
    revision: 9f9e824
    section: Technische Prüfung Runde 5
  captured_at: '2026-09-30'
---

# SP-CX-07 · Entfernen mit Aufruferinventar abschließen

**Erkennung:** Eine Korrektur oder ein Umbau entfernt einen Zweig, eine
Funktion oder einen Weg. Was nur von diesem Weg genutzt wurde, bleibt stehen:
Methoden ohne Aufrufer, Funktionen, die nur noch Tests aufrufen, verwaiste
i18n-Schlüssel. Der nächste Review findet genau diese Reste.

**Belege · 2026-09-30, T-61:**

- Runde 4 (`2880d1d`): Der Umbau auf `useBackupStore` ließ in
  `restore` einen unerreichbaren `'local'`-Zweig zurück (Befund 3).
- Runde 5 (`238723a`): Die Korrektur entfernte diesen Zweig, aber nicht seine
  Abhängigkeiten. `replaceAllowlist`, `settingsStore.replaceAll` und
  `valueHistoryStore.replaceAll` hatten keinen Aufrufer mehr,
  `replacePortfolio` nur noch Tests, der Schlüssel `backup.restored` war
  verwaist (Befund 4).

Zwei Runden hintereinander entstand der Befund also erst durch das
Entfernen selbst.

**Lücke:** Entfernt wurde genau die gemeldete Stelle. Welche Symbole dadurch
ihren letzten produktiven Nutzer verloren, wurde nicht geprüft.

**Implementer-Regel:** Nach jedem Entfernen die direkt und indirekt
genutzten Symbole inventarisieren (`git grep` je Name, bei TypeScript auch
ungenutzte Exporte) und alles mitentfernen, was keinen produktiven Aufrufer
mehr hat. Ein Aufruf nur aus Tests zählt nicht als Nutzung; der Test fällt
mit weg oder testet den verbleibenden Weg. Verwaiste i18n-Schlüssel gehören
dazu. Das Inventar steht als Beleg im Ticket.

**Verifier-Gegenprobe:** Bei jeder Entfernung die Aufrufer der berührten
Symbole selbst suchen, einschließlich Test-only-Aufrufen und i18n-Schlüsseln.
Nach SP-R-04 ist jeder Rest ein Befund.

Erfasst von `claude-observer`; beide Funde durch `claude` in T-61 Runde 4
und 5; Autor der untersuchten Fassungen `codex`. Verwandt:
[SP-R-04](SP-R-04-erkannte-potenzielle-fehler-beheben-scout-rule.md) und
[SP-CX-06](SP-CX-06-gemeinsame-kopfzeile-ueber-alle-breiten-pruefen.md)
(Ursache statt gemeldeter Stelle beheben).
