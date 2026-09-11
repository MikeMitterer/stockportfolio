---
schema_version: 1
id: SP-R-01
project: stockportfolio
kind: case
discovery_phase: verification
affected_work:
- review
subject_author: claude
discovered_by: unknown
recorded_by: unknown
structured_by: codex
prevention_roles:
- implementer
- reviewer
provenance:
  project: stockportfolio
  file: _tickets/.agents/CLAUDE-LESSONS.md
  heading: Zusätzlicher lokaler Beleg · StockPortfolio, 2026-09-10
  revision: 85d6472f4848dc71f78ac1d99dce01ec7fd35d88
  file_sha256: 09fba2411e6703d26343527ed769cd211c03ce84dcb3dc0afe5a94ea9e31042d
  section_sha256: 094c775b40a746091e7d9b691b4869253ebc36b121a5a88dfb0e7a944e66f8a1
  captured_at: '2026-09-11'
---

# SP-R-01 · Datenerhalt im Review nur am Lesepfad begründet

**Erkennung:** Ein Lesefilter wird als Beweis für Datenerhalt beim Schreiben verwendet.

**Implementer-Regel:** Bei Zustandswechseln Lese- und Schreibpfad einschließlich Speicherkennung und Überschreibverhalten gemeinsam prüfen.

**Verifier-Prüfung:** Vor und nach einem Wechsel den persistierten Bestand prüfen; Rückwechsel und gleiche Zeitkennung einbeziehen.

**Zusätzlicher lokaler Beleg · StockPortfolio, 2026-09-10:** Claude erklärt in
[T-38, Review Runde 1](../../30-doing/T-38-basiswaehrung-und-devisenkurse.md#review-runde-1--verifier-claude--2026-09-10)
zur Produktfassung `674b3705c07220c19613c5a88b1a02d3512d0699`, die Tageswerte
blieben beim nun gewünschten Währungswechsel automatisch erhalten und der
Verlauf brauche keine Anpassung. Als Begründung dient der Währungsfilter in
`useValueHistoryStore.load`. Der Schreibpfad `ValueSnapshotRepository.put`
verwendet jedoch nur `portfolioId::date` als Schlüssel. Ein USD-Tageswert
ersetzt damit einen EUR-Tageswert desselben Depots und Tages; der Lesefilter
kann den überschriebenen Wert nicht erhalten. Dies ist eine am Quellstand
belegte Einschränkung der Reviewaussage, kein behaupteter ausgeführter
Browsertest oder beobachteter Verlust echter Nutzerdaten. Gegenprobe für die
Nacharbeit: EUR → USD → EUR am selben Tag, jeweils speichern und den
persistierten Bestand prüfen. Die ursprüngliche Umsetzung sperrte diesen
Wechsel noch; der Beleg betrifft die Vollständigkeitsbehauptung im Review,
nicht einen Verstoß gegen den vorherigen Coder-Auftrag.
