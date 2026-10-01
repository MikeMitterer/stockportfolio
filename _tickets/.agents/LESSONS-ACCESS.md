# Lessons lesen und pflegen · StockPortfolio

**Diese Datei ist ein kurzer Einstieg.** Die gemeinsamen Regeln zu Lesepflicht,
gemeinsamem Bestand und Lessons-Format liegen im installierten Paket:
`${XDG_DATA_HOME:-$HOME/.local/share}/agent-workflow/current/templates/board/.agents/LESSONS-ACCESS.md`.
Vor jedem fachlichen Durchlauf `current/VERSION` prüfen und die Regeln nach
einer Änderung neu lesen. Fehlt das Paket, das melden. Wann eine Lesson
entsteht und wie Befunde eingeordnet werden, regelt der
[Workflow](AGENT-WORKFLOW.md#belegte-erfahrungen).

Lokal gilt: Originale stehen einzeln in [lessons/](lessons/). Vor jedem
Einstieg dieses Verzeichnis inventarisieren; neue Einträge müssen nicht in
den alten Linklisten stehen. [Claude](CLAUDE-LESSONS.md) und
[Codex](CODEX-LESSONS.md) sind eingefrorene Linkeinstiege ohne eigene
Wissensfassung. Autorenschaft steht im YAML-Kopf unter `subject_author`, nicht
in der aktuellen Rollenzuordnung.

## Übersicht

- [Gemeinsame Regeln](#gemeinsame-regeln)
- [Einzeldateien](#einzeldateien)
- [Lokale Einordnung · StockPortfolio](#lokale-einordnung--stockportfolio)

## Gemeinsame Regeln

Paket: Abschnitt „Gemeinsame Regeln“ (gemeinsamer Bestand unter
`${XDG_DATA_HOME:-$HOME/.local/share}/agent-lessons/`, Quellenregistrierung,
Lesepflicht je Rolle). Keine lokale Abweichung.

[↑ Übersicht](#übersicht)

## Einzeldateien

Paket: Abschnitt „Einzeldateien“ (YAML-Kopf, Dateiname, ID als
Referenzschlüssel). Lokal: IDs beginnen mit `SP-` und sind projektweit
eindeutig. Bisher vergeben sind `SP-CX-` (untersuchte Arbeit von Codex) und
`SP-R-` (überwiegend Reviews); maßgeblich für die Autorenschaft bleibt
`subject_author` im YAML-Kopf.

[↑ Übersicht](#übersicht)

## Lokale Einordnung · StockPortfolio

Die zwölf Startregeln `AL-R-01` bis `AL-R-12` wurden am 2026-09-11 aus den
bisherigen übernommenen Abschnitten nach `shared/` verschoben. Ihre erste
Kuratierung stammt vom 2026-09-10 aus StockInfo, Fassung
`778e449296e92bb46c0b430d9f0f9365442bf4b6`. Die lokale T-38-Ergänzung ist
[SP-R-01](lessons/SP-R-01-datenerhalt-im-review-nur-am-lesepfad-begruendet.md), keine weitere StockInfo-Episode.

Die bisherige Auswahl bleibt erhalten: injiziertes `fetch` und
`fake-indexeddb` nach AGENTS.md. StockInfos Online-Testpflichten,
SQLite-Migrationen, HTTP-Betriebsregeln und Rundenlimits sind ausgelassen.
Entwicklungsstand, Inventar und Übergabe richten sich nach den lokalen Regeln.
Es entsteht keine weitere Abnahmestufe. Die Verfahrenszusammenfassung steht
separat in [LESSONS-PROCESS.md](LESSONS-PROCESS.md).

[↑ Übersicht](#übersicht)
