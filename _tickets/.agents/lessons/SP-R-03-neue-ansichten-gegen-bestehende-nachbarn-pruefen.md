---
schema_version: 1
id: SP-R-03
project: stockportfolio
kind: pattern
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
  - ticket: T-60-stockportfolio-server-und-benutzerkonten.md
    revision: 7b4cbbe7587a2969bc4d85ae427f47acb383466b
    section: Technische Prüfung Runde 2
  - ticket: T-50-github-link-statuszeile.md
    revision: 75cac676
    section: Runde 1
  captured_at: '2026-09-30'
---

# SP-R-03 · Neue Ansichten gegen bestehende Nachbarn prüfen

**Erkennung:** Eine neue Route, Hauptansicht oder sichtbare Komponente wird
im Review nur auf Funktion, Sicherheit oder Tests geprüft. Ob sie Aufbau,
Rahmen und Abstände der vorhandenen Ansichten gleicher Art übernimmt, prüft
niemand. Eine Layoutaussage des Coders wird dabei ohne eigenen Vergleich
übernommen und nicht als übernommen gekennzeichnet.

**Implementer-Regel:** Vor einer neuen Hauptansicht eine bestehende
Nachbaransicht als Vorlage wählen und deren Grundgerüst übernehmen. Bei
StockPortfolio sind das Wurzelelement, `@include content-frame(...)` aus
`ux-foundation`, Kopfbereich und Abstände. Eine Abweichung im Ticket
begründen. Eine Aussage wie „Abstände und Ausrichtung geprüft“ nur mit einem
konkreten Vergleich gegen eine benannte Nachbaransicht machen.

**Verifier-Prüfung:** Bei jeder neuen oder umgebauten Ansicht:

1. Die Struktur neben einer bestehenden Ansicht derselben Art lesen:
   Wurzelelement, gemeinsamer Rahmen (`content-frame`), Kopf und Abstände.
   Beispiel: `SettingsView.vue`, `StatusView.vue` und `DashboardView.vue`
   nutzen `content-frame`; eine neue Hauptansicht ohne ihn ist ein Befund.
2. Selbst einen Screenshot der neuen Ansicht neben einer bekannten Seite
   machen, bei 390 und 1440 px, wenn das Ticket diese Breiten verlangt.
3. Übernimmt der Review die Layoutaussage des Coders statt eines eigenen
   Vergleichs, das im Ergebnis ausdrücklich so benennen (siehe SP-R-02).

**Erwartbarer Beleg:** Im Review stehen die Vergleichsansicht, die
übereinstimmenden Strukturmerkmale und ein eigener Screenshot, oder ein
ausdrücklicher Vermerk, dass dieser Teil nur aus Coder-Belegen stammt. Eine
statische Prüfung über alle Routen (etwa ein Wächter-Test für den
Seitenrahmen) ersetzt den Einzelvergleich für genau diese Regel.

## Originalbelege

1. **T-60, Runde 2, Handoff `7b4cbbe`:** Claude las
   `frontend/src/views/UserAdminView.vue` und prüfte die API ausführlich auf
   Sicherheit. Die neue Benutzerverwaltung begann mit `<div class="user-admin">`
   ohne `content-frame`, während `SettingsView.vue` im selben Commit
   `@include content-frame(var(--space-8))` nutzte. Ihre Überschrift saß
   dadurch direkt unter der Kopfzeile. Claude machte keinen eigenen Screenshot
   der Ansicht und übernahm Codex' Aussage, Login, Setup und Admin seien bei
   390 und 1440 px „einschließlich Abstände und Ausrichtung“ geprüft, ohne sie
   als übernommen zu kennzeichnen. Runde 3 war auf den Login-Fix begrenzt.
   Mike fand die Abweichung am 2026-09-30 bei seiner Abnahme; Codex ergänzt den
   Rahmen und `frontend/tests/pageFrame.spec.ts`.
2. **T-50, Runde 1, Fassung `75cac676`:** Claude gab den GitHub-Link frei,
   ohne ihn mit der von Mike genannten StockInfo-Statuszeile zu vergleichen
   (Einzelheiten in SP-CX-05). Auch dort fehlte der Abgleich mit einer
   vorhandenen Oberfläche.

Aufnahme auf Mikes ausdrücklichen Auftrag vom 2026-09-30 („Halte das in den
Lessons fest“), gestützt auf zwei Belege. Der Produktcode stammt in beiden
Fällen von Codex; diese Lesson betrifft die Reviewlücke. Codex' ungenaue
Layoutaussage in T-60 gehört zur Einordnung durch den Observer.
