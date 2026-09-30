---
schema_version: 1
id: SP-R-05
project: stockportfolio
kind: pattern
discovery_phase: verification
affected_work:
- implementation
- review
subject_author: mixed
discovered_by: claude
recorded_by: claude
prevention_roles:
- implementer
- reviewer
provenance:
  project: stockportfolio
  evidence:
  - ticket: T-63-reproduzierbarer-lokaler-teststack.md
    revision: 493c35c64122beac401ddfe2e1fece324f98718e
    section: Technische Prüfung Runde 1
  - ticket: T-63-reproduzierbarer-lokaler-teststack.md
    revision: 70c25a6117d9339cddd8fd18ba459565b614315b
    section: Technische Prüfung Runde 9
  captured_at: '2026-09-30'
---

# SP-R-05 · Nach dem Stopp alle Reste der gestarteten Prozesse prüfen

**Erkennung:** Ein Start- und Stoppweg wird nur daran gemessen, was der
Stopp selbst kennt und entfernt, etwa das eigene Laufverzeichnis. Die
gestarteten Kindprozesse legen aber eigene Dateien an: Zustandsdateien,
temporäre Datenbanken, Logs und Sockets, oft unter einem anderen Namen. Ob
diese Reste nach dem Stopp verschwinden, prüft niemand. Warnsignale sind
eine Gegenprobe, die nur nach einem Präfix sucht, und ein Kindprozess, der
sein Aufräumen in `finally` oder einem Signal-Handler erledigt.

**Implementer-Regel:** Für jeden gestarteten Prozess festhalten, welche
Dateien und Ressourcen er anlegt und wer sie beim Stopp entfernt. Den Stopp
so bauen, dass er auch bei Signalen aufräumt; eingebundene Server wie
`uvicorn` behandeln Signale selbst und können eigenes Aufräumen überspringen.
Nach Start und Stopp belegen, dass keine dieser Ressourcen übrig bleibt, und
einen sofortigen Neustart ausführen.

**Verifier-Prüfung:** Vor dem Start ein Inventar aller Dateien anlegen, die
der Lauf erzeugen kann, über alle Präfixe der beteiligten Skripte hinweg und
nicht nur über das Laufverzeichnis. Nach dem Stopp dasselbe Inventar wieder
zählen. Zusätzlich die Zustandsdateien auf beendete PIDs prüfen und direkt
danach einen Neustart ausführen, auch aus einem anderen Pfad oder Worktree.

**Erwartbarer Beleg:** Anzahl der Zustandsdateien und temporären
Verzeichnisse je Präfix vor und nach dem Lauf, dazu das Ergebnis des
sofortigen Neustarts.

## Originalbelege

1. **T-63, Runde 1, Handoff `493c35c`:** Claude prüfte nach `--stack --stop`
   nur, dass kein `stockportfolio-t63-*`-Verzeichnis übrig war. Der
   StockInfo-Kindprozess legt aber `stockportfolio-t39-server-*` und
   `stockportfolio-test-server-<port>.json` an. Sein Aufräumen im `finally`
   lief nie, weil `uvicorn` 0.51.0 ein abgefangenes SIGTERM nach dem
   Herunterfahren erneut auslöst. Die Freigabe übersah das. Codex' eigene
   Stoppbelege in T-63 hatten dieselbe Lücke.
2. **T-63, Runde 9, Handoff `70c25a6`:** Eine verwaiste Zustandsdatei aus
   einem früheren Lauf blockierte einen Start aus einem anderen Pfad. Erst
   dadurch fielen 46 zurückgebliebene `stockportfolio-t39-server-*`-Verzeichnisse
   auf, dazu verwaiste Zustandsdateien zu mehreren Ports. Behoben wurde das
   mit `44f61a6`; Mike beauftragte das Entfernen der Altlasten.

Aufnahme auf Mikes ausdrücklichen Auftrag vom 2026-09-30 („Ja halte das als
Lesson fest“), gestützt auf beide Belege. Die Autorenschaft ist gemischt: Die
Umsetzung stammt von Codex, die übersehenen Gegenproben von Claude und Codex.
Verwandt: [SP-R-02](SP-R-02-pruefaussagen-den-tatsaechlich-ausgefuehrten-schritten-zuordnen.md),
[SP-R-04](SP-R-04-erkannte-potenzielle-fehler-beheben-scout-rule.md).
