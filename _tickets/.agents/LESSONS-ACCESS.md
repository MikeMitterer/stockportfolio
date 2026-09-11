# Lessons lesen und pflegen

Lokale Originalerfahrungen stehen einzeln in [lessons/](lessons/).
`CLAUDE-LESSONS.md` und `CODEX-LESSONS.md` sind eingefrorene Linkeinstiege für
bisherige Verweise. Sie enthalten keine zweite bearbeitete Wissensfassung.
**Vor jedem Einstieg die Dateien unter `lessons/` inventarisieren:** Neue
Einträge müssen nicht in den alten Linklisten stehen. Autorenschaft steht im
YAML-Kopf unter `subject_author`, nicht in der aktuellen Rollenzuordnung.

1. Der Coder liest vor Umsetzung und Übergabe die zu seiner Autorenschaft
   gehörenden Lessons und die für den Auftrag einschlägigen gemeinsamen Regeln.
2. Der Verifier liest vor dem Review die Lessons des Autors der Prüffassung;
   bei gemischter Arbeit beide. Vorbeugung und Gegenprobe an der Fassung prüfen.
3. Der Observer berücksichtigt alle lokalen Lessons und den gemeinsamen Stand.
   Er ergänzt passende lokale Einzeldateien; neue IDs sind projektweit eindeutig.
   Globale Änderungen verlangen weiterhin einen entsprechenden Auftrag.

Die alten Einstiege allein erfüllen die Lesepflicht nicht. Im Ticket genügen
Kennung, benutzte Fassung und der zugehörige Prüfbeleg. Unklare Herkunft bleibt
`unknown`; die aktuelle Rolle belegt weder Autorenschaft noch Entdecker.

## Übersicht

- [Gemeinsame Regeln](#gemeinsame-regeln)
- [Einzeldateien](#einzeldateien)
- [Lokale Einordnung · StockPortfolio](#lokale-einordnung--stockportfolio)

## Gemeinsame Regeln

Der gemeinsame Bestand liegt unter `${XDG_DATA_HOME:-$HOME/.local/share}/agent-lessons/`.
`INDEX.md` erschließt `shared/`; `collected/` enthält den ersten Archivstand.
Diese Fassung wurde einmalig aus bestehenden Lessons und bereits kuratierten
Regeln überführt. Collector, automatische Aktualisierung und KI-Ableitung sind
noch nicht implementiert. `needs_review` kennzeichnet die ausstehende Prüfung
der überführten Fassung; keine bereits geprüfte globale Aktualität behaupten.

Bei gesetztem absolutem `XDG_DATA_HOME` diesen Ort verwenden; bei leerem oder
ungültigem relativem Wert den Standardort unter Home. Dasselbe gilt für
`XDG_CONFIG_HOME`, `XDG_STATE_HOME` und `XDG_CACHE_HOME` mit `.config`,
`.local/state` und `.cache`. Grundlage ist die
[XDG Base Directory Specification](https://specifications.freedesktop.org/basedir/latest/).
Keinen relativen Verzeichnisaufstieg vom Projektvolume zum Home fest einbauen.

Die Sammlung ist ein eigenständiges Git-Repository ohne Remote. Ihre Quellen
sind relativ zu der benannten Projektbasis registriert. Zum Lesen gemeinsamer
Regeln sind die Quell-Repositories nicht erforderlich: kompakte Belege und der
Archivstand liegen in der Sammlung. Dortige Projektbelege nennen ergänzend die
ursprüngliche Herkunft; sie sind keine lokal auflösbaren Sammlungslinks.

Fehlt der gemeinsame Bestand, die Lücke im Ticket nennen und die lokalen
Lessons weiter verwenden. Keinen erfolgreichen Abgleich behaupten. Daraus
entsteht kein pauschaler Arbeitsstopp; ein ausdrücklich erforderlicher und
fehlender Nachweis bleibt jedoch offen. Änderungen während eines Reviews für
den nächsten zuständigen Schritt vormerken, die Prüffassung stabil halten.

Neue Projekte wählen passende Regeln nach Architektur, Betrieb und Testgrenzen.
Übernahme, Anpassung oder Auslassung mit Regel-ID, Fassung und Grund lokal
festhalten, ohne Quellbelege als eigene Vorfälle zu zählen. Lokale Originale
werden durch eine spätere Aggregation nicht überschrieben.

[↑ Übersicht](#übersicht)

## Einzeldateien

Eine Lesson ist eine Markdown-Datei mit YAML-Kopf, `schema_version: 1`,
projektweit eindeutiger `id` und `project`. Getrennt erfassen: `kind`,
`discovery_phase`, `affected_work`, `subject_author`, `discovered_by`,
`recorded_by`, `prevention_roles` und `provenance`. Der Text enthält Erkennung,
Implementer-Regel, Verifier-Prüfung und Originalbelege. Eine ausdrückliche
menschliche Vorgabe bleibt eine Vorgabe; ein Vorschlag wird nicht allein wegen
seines Absenders zur geprüften Regel. Der Workflow bestimmt die Aufnahme.

Die vollständige Formatbeschreibung liegt im Skill `task-verification-workflow`
unter `references/lesson-format.md`. Formatänderungen in den Lesekanälen aller
Autoren ankündigen; unbekannte Fassungen nicht still als Fassung 1 behandeln.
Verfahrensregeln gehören in den Workflow, nicht als Lessons in dieses Verzeichnis.

[↑ Übersicht](#übersicht)

## Lokale Einordnung · StockPortfolio

Die zwölf Startregeln `AL-R-01` bis `AL-R-12` wurden am 2026-09-11 aus den
bisherigen übernommenen Abschnitten nach `shared/` verschoben. Ihre erste
Kuratierung stammt vom 2026-09-10 aus StockInfo, Fassung
`778e449296e92bb46c0b430d9f0f9365442bf4b6`. Die lokale T-38-Ergänzung ist
[SP-R-01](lessons/SP-R-01.md), keine weitere StockInfo-Episode.

Die bisherige Auswahl bleibt erhalten: injiziertes `fetch` und
`fake-indexeddb` nach AGENTS.md. StockInfos Online-Testpflichten,
SQLite-Migrationen, HTTP-Betriebsregeln und Rundenlimits sind ausgelassen.
Entwicklungsstand, Inventar und Übergabe richten sich nach den lokalen Regeln.
Es entsteht keine weitere Abnahmestufe. Die Verfahrenszusammenfassung steht
separat in [LESSONS-PROCESS.md](LESSONS-PROCESS.md).

[↑ Übersicht](#übersicht)
