# T-59 · Unraid-Katalogstand in der Anleitung korrigieren

## Problem und Ziel

Die Unraid-Anleitung stellt die Aufnahme von StockPortfolio in Community
Applications noch als ungeprüft dar. Mike bestätigt am 2026-09-28, dass die App
bereits unter **Apps** gelistet ist. Die Anleitung soll den tatsächlich
verfügbaren Installationsweg klar und ohne Vorbehalt beschreiben.

## Auftrag und Grenzen

- `unraid/README.md` korrigieren; Lizenz und Katalogstatus getrennt erklären.
- Projekt- und Docker-README auf widersprüchliche Aussagen prüfen.
- Keine App-, Template- oder Docker-Änderung; kein Unraid-Livetest behaupten.
- Die unabhängige technische Gegenprüfung und Mikes redaktionelle Abnahme
  bleiben vor Abschluss erforderlich.

## Für Mike

Die korrigierte Unraid-Anleitung prüfen. Die Katalogaufnahme ist bereits durch
Mike bestätigt; eine weitere Bestätigung dieser Tatsache ist nicht nötig.

## Verify

| # | Prüfkriterium | AI |
|---|---|---|
| 1 | Aktueller Unraid-Katalog nennt StockPortfolio | ✅ |
| 2 | Anleitung nennt Apps als normalen Startweg und keinen alten Vorbehalt | ✅ |
| 3 | Projekt- und Docker-README widersprechen dem aktuellen Stand nicht | ✅ |
| 4 | Markdown-Diff und Links geprüft | ✅ |
| 5 | Unabhängiger Review der übergebenen Fassung | ➖ |

## Nachweise

Mikes Korrektur vom 2026-09-28 im StockApps-Medienauftrag. Der öffentliche
[Community-Apps-Katalog](https://ca.unraid.net/) führt `stockportfolio`.
Ein praktischer Start auf einem Unraid-Server wurde hier nicht geprüft.
Die Vorlage liegt separat in `MikeMitterer/unraid-templates`.

**Doku-Abgleich:** `unraid/README.md` ist betroffen. `README.md` und
`docker/README.md` verlinken auf die Unraid-Anleitung und behaupten selbst
keine ausstehende Katalogaufnahme. Weitere Anpassungen sind dort nicht nötig.

**Lessons:** SP-CX-02 auf aktuelle Aussagen angewandt; frühere Behauptung
in der Unraid-Anleitung wird ersetzt. SP-R-02 begrenzt den Prüfnachweis:
Katalogsichtbarkeit ist kein praktischer Unraid-Starttest.

**Prüfungen des Coders:** Öffentlicher Unraid-Katalog per Websuche am
2026-09-28 geprüft; `stockportfolio` wird dort genannt. `README.md` und
`docker/README.md` geprüft: Beide verlinken nur auf die Unraid-Anleitung.
`git diff --check` ohne Befund; lokale Links der bearbeiteten Datei zeigen
auf vorhandene Dateien. `make lint` und `make typecheck` auf demselben
`master`-Quellstand erfolgreich. `make test` dort: 794 von 795 Tests
bestanden; `tests/dockerBuild.spec.ts` schlägt für den `ghcr`-Push mit
„expected 1 to be +0“ fehl. Der Einzeltest reproduziert diesen Fehler
(18 von 19 bestanden). Die README-Korrektur war bei beiden Läufen nur im
getrennten Worktree und konnte den Test nicht beeinflussen. Kein
Containerstart oder Unraid-Livetest.

## Menschliche Antwort

Offen.
