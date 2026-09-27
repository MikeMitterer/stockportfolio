---
schema_version: 1
id: SP-R-02
project: stockportfolio
kind: pattern
discovery_phase: observation
affected_work:
- handoff
- review
subject_author: claude
discovered_by: codex-observer
recorded_by: codex-observer
prevention_roles:
- implementer
- reviewer
provenance:
  project: stockportfolio
  evidence:
  - ticket: T-54-sicherung-im-leeren-depot.md
    revision: 78e1481
    section: Unabhängige Prüfung Runde 1
  - ticket: T-54-sicherung-im-leeren-depot.md
    revision: cf5a3cde33047c4192cf4921da83dcd647684b43
    section: Bestätigung claude
  - ticket: T-56-changelog-generator.md
    revision: 9d0ca88db38b590d116db023a228ffc2bbbfdb56
    section: Unabhängige Prüfung Runde 3
  captured_at: '2026-09-27'
---

# SP-R-02 · Prüfaussagen den tatsächlich ausgeführten Schritten zuordnen

**Erkennung:** Ein Review bezeichnet eine Prüfzeile oder den gesamten Umfang
als bestätigt, obwohl sein konkreter Nachweis nur einen Teil abdeckt. Ein
grüner Gesamtstatus oder eine zurückgestellte Übergabe füllt die Lücke nicht.

**Implementer-Regel:** In der Übergabe eigene Ausführung und offene Teilpfade
klar trennen. Nach Rückgabe das Urteil gegen die benannten Nachweise lesen:
Ein erfolgreiches Einspielen belegt nicht auch den Abbruch; eine neue
Reviewrunde übernimmt keine unabhängige Freigabe aus einer nie geprüften
Vorlage. Widersprüche als konkrete Rückfrage an den Verifier zurückgeben,
statt Prüftiefe oder menschliche Abnahme selbst zu ergänzen.

**Verifier-Prüfung:** Für jede abschließende Aussage festhalten, was selbst
gelesen, ausgeführt oder aus Coder-Belegen übernommen wurde und was offen
bleibt. Zusammengesetzte Prüfpunkte nach ihren Teilpfaden beurteilen.
Nach zurückgestellten Runden den weiterhin beauftragten Gesamtumfang an den
aktuellen Fassungen prüfen; die letzte Änderung ist nicht automatisch der
gesamte Reviewauftrag. Bereits ausreichend geprüfte Teile nicht wiederholen.

**Erwartbarer Beleg:** Eine knappe Zuordnung von Anforderung, geprüfter Fassung,
konkretem eigenen Schritt und verbleibender Grenze. Tests können Verhalten
belegen, ersetzen aber keinen behaupteten Quellvergleich. Eine ausdrücklich
offene Quelle nicht zugleich als unabhängig gelesen ausgeben. Die Regel
fordert weder jede historische Zwischenfassung noch pauschale neue Testläufe.

## Zwei lokale Belege

1. [T-54](../../40-done/T-54-sicherung-im-leeren-depot.md), Runde 1,
   Reviewbericht `78e1481`: Verify #2 hieß „Wiederherstellung und Abbruch“.
   Claude beschrieb Vorschau, Bestätigung und erfolgreichen Import und
   erklärte die gesamte Zeile für vollständig bestätigt. Auf Observer-
   Rückfrage bestätigte er in `cf5a3cd`, keinen Abbruch live geprüft zu haben.
   Die Matrix wurde auf teilweise bestätigt begrenzt; der unveränderte
   Abbruchpfad war nur im Quelltext gelesen. Kein Produktfehler behauptet.

2. [T-56](../../40-done/T-56-changelog-generator.md), Runde 3,
   Reviewbericht `9d0ca88`: Der Abschlussabsatz berief sich auf „bereits in
   Runde 2 bestätigte“ Nachweise. Runden 1 und 2 waren zurückgestellt worden.
   In „Antwort claude · Korrektur der Belegzuordnung · 2026-09-27“ räumt
   Claude ein: „In Runde 2 bestätigt“ war falsch. Frontend und Setup hatte
   er tatsächlich selbst in Runde 3 geprüft; ursprünglicher Generator und
   weitere Grundänderungen waren dagegen nur durch Testläufe und Coder-
   Nachweise bewertet, nicht von ihm im Diff gelesen. Die Übergabe hatte
   ausdrücklich den Gesamtumfang verlangt. Die gezielte Quellenprüfung
   wurde innerhalb dieses bestehenden Auftrags angefordert; ihr Ergebnis
   wird durch diese Lesson nicht vorweggenommen.

Autor der untersuchten Reviewaussagen ist Claude, Produktautor jeweils Codex.
Zwei gesonderte Tickets, keine Doppelzählung einzelner Korrekturen. AL-R-01
ist einschlägig; SP-R-01 bleibt der eigene Datenerhalt-Fall. Diese Datei
ergänzt konkrete lokale Belege und die Gegenprobe für die Reviewrückgabe.
Keine Änderung am gemeinsamen Lessons-Bestand oder an Board-Konventionen.

**Nachtrag · T-56, 2026-09-27:** Claude hat die angeforderte Quellenprüfung
im Ticket unter „gezielte Prüfung der ausgelassenen Quellteile“ nachgetragen:
Generator, Runner, Farbmodul und Skill-/Setup-Vorlagen an der übergebenen
Fassung geprüft, keine neuen Befunde. Diese konkrete Lücke ist geschlossen;
der historische Anlass und die Präventionsregel bleiben bestehen.
