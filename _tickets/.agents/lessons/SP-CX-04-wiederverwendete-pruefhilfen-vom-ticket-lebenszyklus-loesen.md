---
schema_version: 1
id: SP-CX-04
project: stockportfolio
kind: pattern
discovery_phase: mixed
affected_work:
- implementation
- documentation
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
  heading: Wiederverwendete Prüfhilfen vom Ticket-Lebenszyklus lösen
  revision: 85d6472f4848dc71f78ac1d99dce01ec7fd35d88
  file_sha256: 32d9229e032e8200fe711c1fc3a2b6a8a5b062562bab0e3ba39474a545cf5422
  section_sha256: b2e7c33376eb7234d44e81525c4f0537c9f0abc43c901a6602313613ade18885
  captured_at: '2026-09-11'
---

# SP-CX-04 · Wiederverwendete Prüfhilfen vom Ticket-Lebenszyklus lösen

**Erkennung:** Ein Helfer liegt bei seinem Ursprungsticket, wird aber von
weiteren Tickets verwendet und erweitert. Das Archivieren des Ursprungstickets
kann dadurch aktuelle Startbefehle und Links der anderen Tickets entwerten.
Eine bereits eingetretene Ausführungspanne ist damit nicht behauptet.

**Belege · Codex-Arbeit, 2026-09-10:**

- T-40, Produktfassung `71a4ff8a5bba963134039a6840250800f13a4192`, erweitert
  den bei T-39 abgelegten StockInfo-Testserver für Detail-Fixtures und nutzt
  ihn in seinen eigenen Startbefehlen.
- T-38, Produktfassung `674b3705c07220c19613c5a88b1a02d3512d0699`, ergänzt
  denselben Helfer um FX-Szenarien. Auch dessen Anleitung verweist weiterhin
  auf die Ablage unter T-39. Mike bestätigt die gemeinsame Ablage und weitere
  Nutzung ausdrücklich. Die Nacharbeit ist im T-38-Ticket festgehalten.

**Implementer-Regel:** Sobald ein Prüfhelfer ticketübergreifend verwendet wird,
einen dauerhaften Projektort wie `scripts/` nutzen und alle aktuellen Aufrufer
gemeinsam nachziehen. Eine gepflegte Datei erhalten; keine Kopien je Ticket.
Eine bereits übergebene Prüffassung während ihres Reviews stabil lassen und
die Ablageänderung im nächsten zuständigen Arbeitsschritt nachweisen.

**Verifier-Prüfung:** Referenzen auf den alten Pfad vollständig inventarisieren.
Die weiterhin benötigten Szenarien vom neuen Ort aus starten und prüfen, dass
aktuelle Anleitungen keine Datei aus einem aktiven Ticketordner voraussetzen.
Historische Nachweise bleiben auf ihre damalige Fassung bezogen; eine reine
Verschiebung belegt keine zusätzliche fachliche Testabdeckung.
