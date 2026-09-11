---
schema_version: 1
id: SP-CX-03
project: stockportfolio
kind: pattern
discovery_phase: observation
affected_work:
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
  heading: Laufende Wartezelle belegt keinen regelmäßigen Durchlauf
  revision: 85d6472f4848dc71f78ac1d99dce01ec7fd35d88
  file_sha256: 32d9229e032e8200fe711c1fc3a2b6a8a5b062562bab0e3ba39474a545cf5422
  section_sha256: 7d45417b869ca32b02cb2d31b07a01aece5e8d1e985f4bcca3d707195419ed2a
  captured_at: '2026-09-11'
---

# SP-CX-03 · Laufende Wartezelle belegt keinen regelmäßigen Durchlauf

**Erkennung:** Die Zelle meldet weiter `Script running`, aber zwischen zwei
Heartbeats liegen mehrere geplante Takte. Ihre Existenz ist kein Nachweis
einer durchgehenden Beobachtung.

**Implementer-Regel:** Beim Betrieb eines In-Context-Schedulers tatsächliche
Heartbeat-Zeiten mit dem geplanten Takt vergleichen. Beobachtungslücken offen
nennen, versäumte Takte überspringen und keine Hintergrundgarantie aus einer
Cell-ID ableiten. Ursache und beobachtete Auswirkung getrennt halten; ein
fehlender Takt allein beweist weder einen Codefehler noch einen Rechner-Ruhezustand.
Bei wiederholten Lücken zuerst die Laufzeit- und Betriebssystemprotokolle mit
den Heartbeat-Zeiten abgleichen, statt wiederholt nur den Timer neu zu starten.
Ist durchgehender lokaler Betrieb gewünscht und Systemruhe als Ursache belegt,
eine an die eigene Sitzung gebundene Ruhezustandssperre vorsehen; keine
pauschale dauerhafte Änderung der Energieeinstellungen daraus ableiten.

**Verifier-Prüfung:** Startsignal und mindestens einen Folgedurchlauf anhand
realer Zeiten prüfen. Bei Unterbrechungen den letzten und den nächsten belegten
Durchlauf nennen. Das bestätigt die Fortsetzung, keine rückwirkende Abdeckung
der Lücke. Maßgeblich bleibt der [Scheduler-Vertrag](../CODEX-IN-CONTEXT-SCHEDULER.md).

**Belege · eigener Codex-Observer, 2026-09-10:** Zelle `57`, geplant alle
300 Sekunden. Sichtbare Heartbeats um `11:18:23Z` und erst wieder `11:36:19Z`,
danach erst `11:52:25Z`. Beide Abstände überschritten mehrere Takte; die
Warteaufrufe zeigten die Zelle weiterhin als laufend. Die Ursache war bei
dieser Aufnahme nicht ermittelt. Der unveränderte Dateistand nach der Lücke belegt keine Beobachtung
während der ausgefallenen Zeit.

**Ursachenabgleich · 2026-09-10, 20:05 Uhr Ortszeit:** Auf Mikes Nachfrage
`pmset -g log` gelesen. Zwei spätere Lücken der Zelle `99` passen zu protokollierter
Systemruhe: `Idle Sleep` um 19:18:31, nach kurzem Wartungsaufwachen weiterer
Ruhezustand bis zum vollständigen Aufwachen um 19:33:33; nächster Heartbeat
19:33:58. Erneut `Idle Sleep` um 19:47:24, anschließend Wartungsruhe bis zum
Aufwachen um 20:03:37; nächster Heartbeat 20:04:00. Die langen Unterbrechungen
dieser beiden Durchläufe sind damit durch Rechner-Ruhezustand erklärt.
Das erklärt nicht automatisch jede frühere Verzögerung. Der Observer hatte
zuvor seinen Timer neu gestartet, ohne die verfügbaren Ruheprotokolle zu prüfen;
ein Timer-Neustart verhindert diesen Ruhezustand nicht. Keine Systemeinstellung
geändert und keine Ruhezustandssperre als bereits eingerichtet behauptet.
