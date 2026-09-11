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

Projektbasis und Quellenregistrierung stehen gemeinsam in
`${XDG_CONFIG_HOME:-$HOME/.config}/agent-lessons/config.yaml` unter
`project_root` und `projects`. Die Projektpfade unter `projects` sind relativ
zu `project_root`, der Lessons-Pfad relativ zum jeweiligen Projekt. Im
Wissensbestand liegt keine zweite Registrierungsdatei. Bei fehlender
Konfiguration nicht aus einer Restdatei im Bestand ergänzen oder Werte erraten;
die fehlende Konfiguration sichtbar nennen. Ein Collector, der das automatisch
prüft, ist noch nicht implementiert.

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

Eine Datei heißt `<ID>-<titel-in-kleinschreibung>.md`. Die ID bleibt exakt
erhalten; der Titelteil verwendet nur `a-z`, `0-9` und einfache Bindestriche.
Leerzeichen und Satzzeichen werden Bindestriche; `ä/ö/ü/ß` werden `ae/oe/ue/ss`.
Der erste Markdown-Titel nach dem YAML-Kopf lautet `# <ID> · <Titel>` und
liefert denselben Titel. Beispiel:
`SP-CX-02-entscheidungen-in-allen-aktuellen-aussagen-nachziehen.md` mit
`# SP-CX-02 · Entscheidungen in allen aktuellen Aussagen nachziehen`.

Umlaute können als zusammengesetztes Zeichen (NFC) oder als Grundbuchstabe
mit kombinierendem Zeichen (NFD) vorliegen. Die Behandlung hängt von
Dateisystem und Werkzeug ab; nicht jedes macOS-Dateisystem speichert pauschal
NFD. Git beschreibt dafür auf macOS `core.precomposeUnicode`; APFS erhält die
angelieferte Normalisierung. ASCII-Dateinamen vermeiden diese Unterschiede.
[Git-Konfiguration](https://git-scm.com/docs/git-config#Documentation/git-config.txt-coreprecomposeUnicode),
[Apple-Dateisystembeschreibung](https://developer.apple.com/library/archive/documentation/FileManagement/Conceptual/APFS_Guide/FAQ/FAQ.html).

Die ID ist der Referenzschlüssel. Zum Auflösen die YAML-Köpfe der passenden
Einzeldateien inventarisieren und nach `id` suchen; Kommentare und Belegtext
sind keine Kennungsquelle. `sources[].id` verweist auf die Archiv-Lesson.
`sources[].path` wird daraus relativ zur Regeldatei erzeugt und darf jederzeit
regeneriert werden. Ein alter Pfad entscheidet nicht über die gefundene Lesson.
Den angegebenen Original-Hash anschließend mit `archive.source_sha256` prüfen;
fehlende oder mehrdeutige Kennungen beziehungsweise eine andere Fassung melden,
statt anhand eines Dateinamens zu raten.

Bei Titeländerung ID beibehalten, Datei und Überschrift zusammen ändern und
den Index sowie Markdown-Verweise aus dem ID-Inventar nachziehen. Bis der
Collector existiert, führen die zuständigen Agenten diese Schritte aus.
Es gibt derzeit keine automatische Reparatur beliebiger alter Markdown-URLs.

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
[SP-R-01](lessons/SP-R-01-datenerhalt-im-review-nur-am-lesepfad-begruendet.md), keine weitere StockInfo-Episode.

Die bisherige Auswahl bleibt erhalten: injiziertes `fetch` und
`fake-indexeddb` nach AGENTS.md. StockInfos Online-Testpflichten,
SQLite-Migrationen, HTTP-Betriebsregeln und Rundenlimits sind ausgelassen.
Entwicklungsstand, Inventar und Übergabe richten sich nach den lokalen Regeln.
Es entsteht keine weitere Abnahmestufe. Die Verfahrenszusammenfassung steht
separat in [LESSONS-PROCESS.md](LESSONS-PROCESS.md).

[↑ Übersicht](#übersicht)
