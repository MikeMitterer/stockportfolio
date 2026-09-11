---
schema_version: 1
id: SP-CX-02
project: stockportfolio
kind: pattern
discovery_phase: mixed
affected_work:
- documentation
- observation
subject_author: codex
discovered_by: unknown
recorded_by: unknown
structured_by: codex
prevention_roles:
- implementer
- reviewer
provenance:
  project: stockportfolio
  file: _tickets/.agents/CODEX-LESSONS.md
  heading: Entscheidungen in allen aktuellen Aussagen nachziehen
  revision: 85d6472f4848dc71f78ac1d99dce01ec7fd35d88
  file_sha256: 32d9229e032e8200fe711c1fc3a2b6a8a5b062562bab0e3ba39474a545cf5422
  section_sha256: b2854f54bb7606997838256bbbc5abf256bebaf0bfae0815b5627b78d1ff4fe4
  captured_at: '2026-09-11'
---

# SP-CX-02 · Entscheidungen in allen aktuellen Aussagen nachziehen

**Erkennungsregel:** Nach einer geklärten Entscheidung stimmen einzelne
Verweise oder Zustandsfelder, aber Einstieg, Kontext, Ticket oder README
beschreiben noch eine alte Priorität, einen offenen Umfang oder einen
erledigten Blocker. Eine korrekte Datei oder ein angepasster Link genügt nicht.

**Prüffrage:** Beschreiben Zustandsblock, aktueller Kontext, Ticket und
betroffene Anleitungen dieselbe Entscheidung? Ist bei einem ausdrücklich
beauftragten Zustandswechsel auch das wirksame Feld geändert, oder wurde
nur die Erklärung angepasst? Historische Reviewfassungen dabei von aktuellen
Aussagen unterscheiden.

**Belege · 2026-09-10:**

- In der Codex-Bearbeitung von T-38, Fassung `54da9da`, wurde der README-Link
  auf `30-doing/` angepasst. Dieselbe Zeile unter „Not there yet“ blieb bei
  „scope under discussion“, obwohl Basiswährung je Depot und Umgang mit
  veralteten FX-Kursen bereits im Ticket entschieden waren. Der Pfad stimmte,
  die Beschreibung des Umfangs nicht.
- Die im Observer-Chat selbst ausgeführte Dokumentationsanpassung stellte
  anschließend T-39 → T-40 → T-38 klar, ließ aber `phase: blocked` stehen und
  verwies die Verarbeitung an den Coder. Mike musste mit „Phase - immer noch
  blocked“ nachfassen. Erst danach wurden Phase und überholte Blockertexte
  gemeinsam korrigiert. Die dokumentierte Bestätigung lag schon vor.

**Konsequenz:** Den in [AGENTS.md](../../../AGENTS.md#dokumentation-gehört-zur-änderung)
geforderten Doku-Abgleich bis zu den wirksamen Zustandsangaben durchführen.
Gesondert autorisierte Änderungen vollständig ausführen; eine eng begrenzte
Observer-Ausnahme bleibt auf diesen Auftrag begrenzt. Fehlende Autorisierung
nicht selbst erzeugen. Frühere Nachweise bleiben auf ihre geprüfte Fassung
bezogen und werden durch redaktionelle Fortschreibung nicht erweitert.

**Implementer-Regel:** Betroffene Aussagen und wirksame Zustandsfelder gemeinsam
nachziehen, soweit der Auftrag die Änderung autorisiert.
**Verifier-Prüfung:** Entscheidung, aktuelles Feld und alle betroffenen
Einstiegstexte gegeneinander lesen; historische Belege getrennt einordnen.
