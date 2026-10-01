---
schema_version: 1
id: SP-CX-02
project: stockportfolio
kind: pattern
discovery_phase: mixed
affected_work:
- documentation
- observation
- implementation
- review
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

## Ergänzung · 2026-09-27 · T-55

In [T-55](../../40-done/T-55-kurze-versionierungs-targets.md) wurden die
Versionsziele auf `tag-major`, `tag-minor` und `tag-patch` vereinheitlicht.
Die Codex-Fassung von PersonalSkills `6600ce24b4842c1fd64582ddf001d73549a8ab87`
passte Makefile-Skill, Versionierungs-Skill und Vorlage an, ließ aber
Release-Anleitungen in `unraid-conventions/SKILL.md` und
`docker-conventions/SKILL.md` sowie den Aufruf in
`tests/test_documented_examples.py:123` beim alten Namen. Claude fand diese
Verbraucher in Runde 1; Observer-Quellvergleich derselben Fassung bestätigt
die Fundstellen. Der eigene grüne Nachlauf des Tests ist Claudes Beleg,
kein vom Observer wiederholter Testlauf.

**Lücke:** Das Inventar endete bei den im Umfang genannten Dateien. Der
Negativtest erwartete lediglich einen Fehlerstatus und keinen `semVerBump`-
Aufruf; ein nicht existentes Target erfüllte beides, ohne den vorgesehenen
`precheck` zu erreichen. Grüne Prüfungen belegten daher nicht die vollständige
Umstellung oder diesen Schutzpfad.

**Ergänzte Implementer-Regel:** Bei umbenannten Befehlen auch ihre Aufrufer,
querverweisenden Anleitungen und Tests in den beauftragten Repositories
inventarisieren. Bei betroffenen Negativtests den erwarteten Fehlergrund
absichern, damit ein früherer, sachfremder Abbruch nicht als Erfolg zählt.
Kontextverbote wie für `ACTIVITY.md` auch bei Suchbefehlen einhalten.

**Ergänzte Verifier-Gegenprobe:** Alte Namen in zulässigen Suchbereichen
inventarisieren und historische Belege von ausführbaren Beispielen trennen.
Beim betroffenen Negativtest belegen, dass das neue Target existiert und
die beabsichtigte Vorprüfung den Abbruch verursacht. Ein unveränderter
grüner Gesamtstatus genügt dafür nicht. Kein echter Release ist nötig.

Ergänzung durch `codex-observer`; Entdeckung dieses Falls durch `claude`,
Autor der untersuchten Änderung `codex`. Die bisherige Herkunft bleibt
erhalten. Bestehendes Muster erweitert, keine zusätzliche Lesson-ID und
keine Änderung an gemeinsamen Regeln oder Board-Konventionen.

## Ergänzung · 2026-09-28 · T-58

Die an Claude übergebene Codex-Fassung `c8e0ea3` von
[T-58](../../40-done/T-58-about-data-use-notice.md) nennt SP-CX-02 im
Lessons-Abgleich. Trotzdem sagt Schritt 1 unter „Umsetzung in StockPortfolio“
noch, T-59 sei bei Claude im Review. T-59 steht zu diesem Zeitpunkt bereits
unter `40-done/`; auch STATUS nennt es als abgeschlossenes Ticket. Der
Observer fand die abweichende aktuelle Anweisung nach der Übergabe und meldete
sie Coder und Verifier über STATUS. Nach Claudes Freigabe korrigierte der Coder
Schritt 1. Der Einstieg desselben Tickets sagte daraufhin weiterhin, es gebe
keine technische Freigabe und Claude müsse erst prüfen; STATUS stand bereits
auf `approved`. Der Observer meldete auch diesen verbliebenen Widerspruch.

**Lücke:** Die vorhandene Regel wurde auf die nummerierten Arbeitsschritte des
aktiven Tickets nicht angewandt, nachdem das parallele Ticket abgeschlossen
war. Beim punktuellen Nachtrag wurde wiederum der aktuelle Einstieg nicht
abgeglichen. Ein bloßer Verweis auf SP-CX-02 im Lessons-Abgleich oder die
Korrektur einer Fundstelle schließt diese Prüfung nicht ab.

**Ergänzte Implementer-Regel:** Vor der Übergabe und nach einem Statuswechsel
Einstieg und noch geltende Schritte im eigenen Ticket gegen STATUS und den
Abschluss abhängiger Tickets lesen; alle überholten Gegenwartsbehauptungen
korrigieren und historische Belege erhalten.

**Ergänzte Verifier-Gegenprobe:** Einstieg und noch geltende Ticketschritte mit
STATUS und den verlinkten abhängigen Tickets vergleichen. Im Review die
konkrete abweichende Aussage und ihren aktuellen Gegenbeleg nennen, falls sie
stehen blieb.

Ergänzung und Entdeckung durch `codex-observer`; Autor der übergebenen Fassung
`codex`. Die bisherige Herkunft bleibt erhalten.

## Ergänzung · 2026-09-30 · T-63

Die Codex-Fassung `6459dca` von
[T-63](../../30-doing/T-63-reproduzierbarer-lokaler-teststack.md) entfernte
auf Mikes Vorgabe die Root-Ziele `make lint` und `make typecheck`. Der
Doku-Abgleich nannte `AGENTS.md`, `README.md`, Spezifikation, Plan und
Board-Vorlagen, nicht aber die Verify-Tabellen der aktiven Tickets. Dort
verlangen T-60 #5, T-61 #6 und T-62 #5 weiter die entfernten Ziele. Claude
fand in Runde 2 T-61 und T-62; der Observer fand zusätzlich T-60 #5. Diese
Zeile gilt für die noch offene erneute Prüfung von T-60.

**Lücke:** Wie bei T-55 endete das Inventar der Aufrufer bei den ausdrücklich
genannten Dokumenten. Die Verify-Zeilen offener Tickets sind aktuelle
Anweisungen und keine historischen Belege.

**Ergänzte Implementer-Regel:** Bei entfernten oder umbenannten Befehlen
`_tickets/30-doing/` vollständig nach dem alten Namen durchsuchen. Dabei
offene Prüfpunkte von historischen Belegabsätzen trennen und die Prüfpunkte
im selben Auftrag umstellen.

**Ergänzte Verifier-Gegenprobe:** Dieselbe Suche über alle Tickets in
`30-doing/` selbst ausführen und jede gefundene Stelle einordnen. Einzelne
Funde reichen nicht als Nachweis, dass die Liste vollständig ist.

Ergänzung und Entdeckung von T-60 #5 durch `claude-observer`; T-61/T-62 durch
`claude`; Autor der untersuchten Fassung `codex`. Die bisherige Herkunft bleibt
erhalten.
