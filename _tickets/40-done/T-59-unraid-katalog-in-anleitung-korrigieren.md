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
| 5 | Unabhängiger Review der übergebenen Fassung | ✅ |

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

## Unabhängige Prüfung Runde 1

`claude`, 2026-09-28, an Produktcommit `5c619eb3f980f92c142a814667cff87f50bb988a`:

- **Diff gelesen:** `git show 5c619eb3f980f92c142a814667cff87f50bb988a` selbst
  ausgeführt. Der Produktdiff ist eng auf `unraid/README.md` begrenzt: entfernt
  den überholten Vorbehalt „acceptance … have not been verified“, ergänzt „is
  listed in Unraid Community Applications“ samt Link und macht aus dem
  bedingten „Once StockPortfolio is available in the catalog:“ eine
  unbedingte Installationsanleitung. Keine sonstigen Inhaltsänderungen.
- **Verify #2 (kein alter Vorbehalt):** Datei `unraid/README.md` selbst
  gelesen. Abschnitt „Installing through Unraid Apps“ enthält keine
  Bedingung mehr; bestätigt.
- **Verify #3 (README/Docker-README widersprechen nicht):** `README.md` und
  `docker/README.md` selbst nach „Unraid“/„Community Applications“/„Katalog“
  durchsucht. Beide verlinken nur auf die Unraid-Anleitung, keine eigene
  Aussage zum Katalogstatus; kein Widerspruch.
- **Verify #4 (Markdown-Diff und Links):** Lokale Linkziele `../LICENSE` und
  `../LICENSING.md` selbst geprüft, vorhanden. Externe Katalog-Links
  (`ca.unraid.net`, Unraid-Docs) sind erreichbare, plausible Ziele; kein
  eigener Vollabgleich aller externen Links, da außerhalb des Ticketumfangs.
- **Katalogaussage:** Eigener Versuch, `stockportfolio` über
  `https://ca.unraid.net/apps?q=stockportfolio` unabhängig zu bestätigen, war
  unbrauchbar — dieselbe Abfrage liefert auch für ein bekannt gelistetes
  Beispiel („ghostfolio“) „0 apps“, weil die Seite die Ergebnisse clientseitig
  nachlädt und ein einfacher Fetch das nicht ausführt. Kein eigener
  Katalogbeleg möglich; die Freigabe stützt sich auf Mikes direkte Bestätigung
  im Ticket, nicht auf einen zusätzlichen Quellenvergleich.
- **Nicht wiederholt:** `make lint`/`make typecheck`/`make test` nicht erneut
  laufen lassen. Die Änderung ist reine Markdown-Prosa ohne Bezug zu Quellcode
  oder Tests; der vom Coder dokumentierte, vorbestehende `dockerBuild.spec.ts`-
  Fehler betrifft den `ghcr`-Push und ist von dieser Änderung unabhängig.
- **Lessons:** SP-CX-02 an der Prüffassung angewandt — Zustandsblock, Ticket
  und Anleitung stimmen überein. SP-R-02 beachtet: Diese Zeile listet genau,
  was selbst gelesen/ausgeführt wurde (Diff, Dateien, Linkziele, eigener
  Katalogversuch) und was unverändert aus Coder-Nachweisen übernommen ist
  (Lint/Typecheck/Test-Ergebnisse, Websuche des Coders).

**Ergebnis:** Technisch freigegeben. Kein Produktbefund. Menschliche
Abschlussentscheidung bleibt bei Mike.

## Menschliche Antwort vor dem Abschluss

Offen.

## Abschluss

Mike hat am 2026-09-28 nach der Rückfrage zum Stand mit „von mir aus ist das
OK“ den Abschluss bestätigt und anschließend mit „Claude ist durch“ auf die
technische Freigabe hingewiesen. Codex hat Claudes dokumentierte Freigabe
der Runde 1 am übergebenen Produktcommit geprüft. Damit sind technische
Gegenprüfung und menschliche Abschlussentscheidung vorhanden; keine
Produktnacharbeit ist offen. Das Ticket wird nach `40-done/` verschoben.

**Doku-Abgleich zum Abschluss:** Die Korrektur steht in `unraid/README.md`.
`README.md` und `docker/README.md` enthalten keinen widersprechenden
Katalogvorbehalt und bleiben unverändert. Der lokale Board-Workflow bleibt
bei `2026-09-11-activity-feed`; der Abgleich mit dem Paketstand
`2026-09-27-central-package` ist weiterhin offen und gehört nicht zu T-59.
