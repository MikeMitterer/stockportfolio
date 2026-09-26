# T-49 · Docker-Hub-Veröffentlichung prüfen und vervollständigen

Der aktuelle App-Stand soll als Docker-Image mit passender Docker-Hub-Übersicht
veröffentlicht werden. Bisher fehlen die automatische README-Übertragung und
eine klare Trennung zwischen lokalem Build und Veröffentlichung. Das README
ist bereits vor der Konvertierung größer als 25.000 Bytes.

**Auftrag · Mike, 2026-09-26:** Dockerfile prüfen, passende Make-Ziele und
Docker-Hub-Push erledigen; StockInfo T-77 als Vorlage für den zentralen
README-Helfer nutzen und das Größenlimit in AGENTS.md verankern.

**Stand:** Aktiviert; Codex prüft und implementiert. Rollen aus STATUS gelten.
StockInfo/ProjectTools werden nur als bestehende Abhängigkeiten gelesen;
keine parallele Implementierung oder Änderung in deren Arbeitsbäumen.

**Für Mike:** Momentan keine Entscheidung nötig. Veröffentlichung, lokale
Prüfung und unabhängiger Review werden mit ihren tatsächlichen Ergebnissen
getrennt dokumentiert. Kein Versionssprung oder Master-Merge impliziert.

## Umfang und Umsetzung

1. Dockerfile, Laufzeitkonfiguration, Build-Kontext und bestehende Targets prüfen.
2. Aktuellen BashLib-Buildablauf übernehmen: lokaler Testbuild, expliziter
   Build/Push, unveränderliche Image-ID für späteren Push; amd64 als Serverziel.
3. ProjectTools-README-Helfer einmal nach erfolgreichem Hub-Push anbinden.
   Vorschau und 25.000-UTF-8-Byte-Grenze vor Veröffentlichung prüfen;
   README kürzen/Details auslagern, AGENTS.md und Anleitungen nachziehen.
4. Befehle/Fehlerpfade und echtes Containerverhalten prüfen, Review übergeben,
   autorisierte Veröffentlichung ausführen und Registry/README nachweisen.

## Verify

| # | Prüfung | AI |
|---|---|:--:|
| 1 | Dockerfile, saubere Eingaben, Laufzeit-API und Healthcheck geprüft | ➖ |
| 2 | Help, Make-Ziele, Plattformwahl und Build-/Push-Fehler korrekt | ➖ |
| 3 | Zentraler README-Helfer; nur nach erfolgreichem Docker-Hub-Push | ➖ |
| 4 | Konvertierte Übersicht ≤ 25.000 UTF-8-Bytes; Links und AGENTS-Regel geprüft | ➖ |
| 5 | Echten Container und App im Browser geprüft | ➖ |
| 6 | Tests, Lint, Typecheck, Doku und Lessons abgeglichen | ➖ |
| 7 | Image auf Docker Hub, Architektur/Tag und README-Rücklesen belegt | ➖ |

## Konventionsstand und Abhängigkeit

T-77 liegt im StockInfo-Board unter `30-doing/`; Implementierung des Helfers
in ProjectTools, aktueller dort benannter Prüfstand `3005e11`, unabhängiger
Review noch offen. Keine lokale Kopie. Das StockPortfolio-Board bleibt auf
`2026-09-11-activity-feed`; offene Übernahme von `lessons-follow-through`
bleibt sichtbar und benötigt ihren eigenen Board-Auftrag.
