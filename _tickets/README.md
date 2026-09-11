# StockPortfolio — Ticket-Board

Kleine, verifizierbare Arbeitspakete für die MVP-Umsetzung nach
[`docs/superpowers/specs/2026-08-06-rebalancing-webapp-design.md`](../docs/superpowers/specs/2026-08-06-rebalancing-webapp-design.md).

Der Ablageort zeigt den Arbeitsstand. Rollen, Reihenfolge und genaue Phase
stehen in [STATUS.md](STATUS.md). Seit dem 2026-09-10 verwendet StockPortfolio
dieselbe Board-Struktur wie StockInfo und der Skill `task-verification-workflow`.

**Was gerade passiert:** [ACTIVITY.md](ACTIVITY.md) zeigt kurze
Tätigkeitsmeldungen, neueste oben. Coder, Verifier und Observer schreiben sie über `agent-activity` nach dem
[Workflow](.agents/AGENT-WORKFLOW.md#aktuelle-tätigkeit); das gilt für alle Tickets.

## Übersicht

- [Ablage](#ablage)
- [Von der Aufnahme bis zum Abschluss](#von-der-aufnahme-bis-zum-abschluss)
- [Nachweise und Agentenregeln](#nachweise-und-agentenregeln)
- [Roadmap (MVP-Reihenfolge)](#roadmap-mvp-reihenfolge)
- [Offen](#offen)
- [Neu erfasste Integrationsbewertung](#neu-erfasste-integrationsbewertung)
- [Aktives projektübergreifendes Teilprojekt](#aktives-projektübergreifendes-teilprojekt)

## Ablage

```text
_tickets/
├── .agents/       # Workflow, Aktivierung, Scheduler und Erfahrungen
├── 10-backlog/    # gewollt, noch nicht eingeplant
├── 20-ready/      # beauftragt, als Nächstes vorgesehen
├── 30-doing/      # begonnen, einschließlich Review und Nacharbeit
├── 40-done/       # abgeschlossen
├── 80-iced/       # auf Eis, keine Wiederaufnahme eingeplant
├── 90-rejected/   # bewusst verworfen
├── README.md      # Board-Anleitung
├── STATUS.md      # Rollen, Reihenfolge, Phase und Mailbox
├── ACTIVITY.md    # kurze Tätigkeitsmeldungen, neueste oben
└── QUESTIONS.md   # kurzfristige Fragen
```

Tickets und Begleitdateien liegen gemeinsam im jeweiligen Ordner. Im Root
bleiben die vier Board-Dateien. Leere Statusordner enthalten `.gitkeep`,
damit sie in einem neuen Checkout vorhanden sind. Bei Inventaren und
Linkprüfungen den versteckten Ordner [.agents/](.agents/) einschließen.

[↑ Übersicht](#übersicht)

## Von der Aufnahme bis zum Abschluss

1. Neue gewollte Arbeit in `10-backlog/` erfassen. Eine Ticketnummer oder
   Konzeptbewertung ist noch kein Auftrag zur Umsetzung.
2. Ausdrücklich eingeplante Arbeit nach `20-ready/` verschieben und ihre
   Reihenfolge in STATUS festhalten. Ordnernummern bestimmen keine Priorität.
3. Vor Arbeitsbeginn Ticket und Begleitdateien nach `30-doing/` verschieben.
   Aktives Ticket, Priorität und Arbeitsphase in derselben Übergabe setzen;
   neue Tickets beginnen mit Reviewrunde 0. Bestehende Reviewhistorie erhalten.
4. Umsetzung, Review, Nacharbeit und Warten auf Abschlussbestätigung bleiben
   in `30-doing/`. Nur das ausdrücklich in STATUS aktivierte Ticket erzeugt
   einen Agentenauftrag.
5. Nach den nötigen Prüfungen und der erforderlichen menschlichen Bestätigung
   Ticket samt Begleitdateien nach `40-done/` verschieben. Eine technische
   Freigabe ersetzt die Bestätigung nicht; offene Blocker verhindern den Abschluss.
6. Aufschub nach `80-iced/`, Verwerfung nach `90-rejected/`: Grund und Datum
   festhalten. Eine Wiederaufnahme braucht eine ausdrückliche Einplanung.

Bei jedem Wechsel aktuelle Verweise mitführen. Prüfskripte bleiben beim
Ticket und müssen den Projekt-Root unabhängig von ihrer Ordnertiefe finden.
Vor dem Abschluss das gesamte Ticket auf widersprüchliche Aussagen prüfen.

[↑ Übersicht](#übersicht)

## Nachweise und Agentenregeln

Jedes Ticket hat eine verbindliche aktuelle technische Verify-Matrix.
`AI` füllt die prüfende KI anhand konkreter Belege: ✅ bestätigt,
⚠️ mit Einschränkung, ◑ teilweise, ➖ ohne Live-Nachweis.
**Menschliche Antworten schreibt ausschließlich der Mensch.**
Neue und fachlich überarbeitete Tickets erklären zuerst Problem und Ziel,
danach aktuellen Stand, menschliche Aufgaben und technische Nachweise.

Die bestehenden Tickets behalten bei dieser Ordnerumstellung ihren Inhalt,
einschließlich Antwortfeldern und früheren Befunden. Ihre alten Statusangaben
werden im [Übernahmestand](STATUS.md#übernahmestand) eingeordnet; bei künftiger
fachlicher Überarbeitung entfällt die zusätzliche Ticket-Statusspalte.

Der gemeinsame [Workflow](.agents/AGENT-WORKFLOW.md) regelt Rollen und Übergaben.
[Aktivierung](.agents/AGENT-ACTIVATION.md) und
[Codex-Scheduler](.agents/CODEX-IN-CONTEXT-SCHEDULER.md) bleiben davon getrennt.
Die Linkeinstiege [Claude](.agents/CLAUDE-LESSONS.md) und
[Codex](.agents/CODEX-LESSONS.md) verweisen auf lokale Einzeldateien.
[Zugriff und Pflege](.agents/LESSONS-ACCESS.md) beschreiben das vollständige
Verzeichnisinventar und den gemeinsamen Bestand in AgentLessons. Der Workflow
regelt Vorbeugung, unabhängige Gegenprüfung und Lessons-Pflege.

Der optionale Observer beaufsichtigt Coder und Verifier unabhängig vom Owner.
Er koordiniert bei Bedarf über die STATUS-Mailboxen und berichtet wesentliche
Hinweise und Eingriffe in seinem Chat. Seine Instanzkennung steht in STATUS. Die
[Aktivierung](.agents/AGENT-ACTIVATION.md) enthält beide Scheduler-Varianten,
die Startbefehle `codex-observer` und `claude-observer` sowie Stoppen und
Wiedereinstieg. Eine technische Abnahme bleibt Aufgabe des Verifiers.

[QUESTIONS.md](QUESTIONS.md) sammelt kurzfristige Fragen. Erledigte Einträge
nach Übertragung in Ticket, Dokumentation oder GitHub-Issue entfernen.

[↑ Übersicht](#übersicht)

## Roadmap (MVP-Reihenfolge)

Stand nach dem Release 0.1.0. „Teilweise" heißt: Das Ticket ist nicht
geschlossen — was fehlt, steht in der Zeile.

| # | Titel | Stand |
|---|---|---|
| T-01 | Scaffolding — Vue 3 + Vite + TS + Tailwind + Naive UI + Pinia | [erledigt](40-done/T-01-scaffolding.md) |
| T-02 | Makefile + BashLib/MakeLib-Setup + `.env.example` | [erledigt](40-done/T-02-makefile-bashlib.md) |
| T-03 | Domain-Modul — Vitest-Tests je Formel | [erledigt](40-done/T-03-domain-tests.md) |
| T-04 | API-Client für StockInfo + typisierte Response-Modelle | [erledigt](40-done/T-04-api-client.md) |
| T-05 | Persistenz — IndexedDB-Schema + Pinia-Stores | [erledigt](40-done/T-05-persistence.md) |
| T-06 | UI-Shell — vue-router, vue-i18n, Naive UI Theme, Topbar | erledigt, ohne eigenes Ticket |
| T-07 | Dashboard — KPI-Row + Gruppen-Balken | erledigt, ohne eigenes Ticket |
| T-08 | Dashboard — Positions-Tabelle + Delta-Balken + Inline-Edit | [erledigt](40-done/T-08-row-grouping.md) |
| T-09 | Dashboard — Drilldown-Panel | erledigt; der Trade-Simulator wurde zugunsten von T-19 wieder entfernt |
| T-10 | Assets-View + Add-Position-Dialog | [erledigt](40-done/T-10-instruments.md) |
| T-11 | Settings-View + Export/Import + Health-Check | [erledigt](40-done/T-21-portfolios.md) — Bänder, Puffer, Themes, Verweise, Status, [Export/Import](40-done/T-20-backup.md) und Depot-Verwaltung |
| T-12 | Warnings + Toast + leere/Fehler-Zustände | [erledigt](40-done/T-22-currency.md) |
| T-13 | Docker — Multi-Stage-Image + `docker/build.sh` | [erledigt](40-done/T-13-docker.md) |
| T-14 | Version-Bump auf `0.1.0` + finale README/Docs | [erledigt](40-done/T-14-release.md) |

### Nachgezogen während der Umsetzung

| # | Titel | Stand |
|---|---|---|
| T-15 | Inline-Edit + Ziel-Summen-Prüfung | [erledigt](40-done/T-15-inline-edit-target-sum.md) |
| T-16 | Theming — sechs Themes, Token als RGB-Tripel | [erledigt](40-done/T-16-theming.md) |
| T-17 | Mobile — Leseansicht | [erledigt](40-done/T-17-mobile-readonly.md) |
| T-18 | Geldmarkt als eigene Klasse + Investitionsreserve | [erledigt](40-done/T-18-geldmarkt-reserve.md) |
| T-19 | Rebalancing als eigener Tab | [erledigt](40-done/T-19-rebalancing-tab.md) |
| T-20 | Sichern und Wiederherstellen | [erledigt](40-done/T-20-backup.md) |
| T-21 | Verwaltung mehrerer Depots | [erledigt](40-done/T-21-portfolios.md) |
| T-22 | Fremdwährung + Meldungen einheitlich als Toast | [erledigt](40-done/T-22-currency.md) |
| T-23 | Kursverlauf + Unraid-Template | [erledigt](40-done/T-23-history.md) |
| T-24 | Sprachumschaltung DE/EN + Konventions-Durchgang | [erledigt](40-done/T-24-i18n.md) |
| T-25 | Erklärung in der App — Begriffe und Methodenseite | [erledigt](40-done/T-25-doku.md) |
| T-UI | Frühe UI-Vorschau | [erledigt](40-done/T-UI-preview.md) |
| T-26 | Wertentwicklung des Depots — Rückblick und Tageswerte | [erledigt](40-done/T-26-wertentwicklung.md) |

[↑ Übersicht](#übersicht)

## Offen

Kein Ticket, aber notiert, damit es nicht verloren geht:

| Thema | Stand |
|---|---|
| CORS gegen die produktive API | ungeprüft — nur auf dem Zielsystem möglich |
| Unraid-Vorlage | nie auf einer echten Instanz gelaufen |
| Verlaufs-Zwischenspeicher | wird nie aufgeräumt, wächst nur |
| Feste Spaltenbreiten in der Positionstabelle | zehn Stück; blockieren einen späteren Schriftwechsel |

[↑ Übersicht](#übersicht)

## Neu erfasste Integrationsbewertung

[T-37 · StockInfo-Vertrag und dynamische Felder](40-done/T-37-stockinfo-quote-vertrag-und-dynamische-felder.md):
Identitätszuordnung, zusätzliche Kennzahlen und Nutzen einer flachen
Quote-Ansicht bewertet. Technisch freigegeben und durch Mike am 2026-09-10 abgeschlossen.

Aus dem freigegebenen Vorschlag entstanden die beiden Umsetzungstickets
[T-39 · Identität normalisieren](30-doing/T-39-identitaet-normalisieren.md) und
[T-40 · Detailanzeige aus dem Feldkatalog](30-doing/T-40-detailanzeige-aus-feldkatalog.md).
Beide sind bereits umgesetzt und technisch freigegeben. Anschließend wurde
auch die Depotwährung aus T-38 technisch freigegeben; der aktive Auftrag steht in
[STATUS](STATUS.md#maschinenlesbarer-zustand).
T-39 ist technisch freigegeben und wartet auf Mikes Abschlussabnahme.
T-40 ist ebenfalls technisch freigegeben; Mikes Abschlussabnahme ist offen.

| Ticket | Zuständiger Umfang |
|---|---|
| T-39 | Identität und gemeinsame Prüfung der Kurs-Pflichtfelder einschließlich Währung |
| T-40 | Detailwerte mit Einheit und Originalwährung anzeigen; keine FX-Umrechnung |
| T-38 | Depot-Basiswährung, Devisenkurse und daraus abgeleitete Depotbewertung |

Typen, Mapper, Cache und Formatierung werden gemeinsam weiterverwendet.
Der Generationsauftrag aus T-35 bleibt im Backlog; seine allgemeine
Kursprüfung ist in T-39 umgesetzt.

[T-38 · Basiswährung außer EUR](30-doing/T-38-basiswaehrung-und-devisenkurse.md):
Depotwahl und FX-Bewertung sind umgesetzt und von Codex im Browser geprüft.
Veraltete verwendbare FX-Kurse bleiben mit dauerhafter Warnung aktiv; fehlende
Kurse schließen Positionen aus Bewertung und Trades aus. Isolierte Prüfung:
712 Tests, Lint und Typecheck erfolgreich. Runde 2 ist durch Claude technisch
freigegeben; Mikes Abschlussabnahme steht noch aus. Dieser technische Auftrag
ist bearbeitet; auch der erste Schritt von T-41 ist inzwischen technisch freigegeben.

[↑ Übersicht](#übersicht)

## Aktives projektübergreifendes Teilprojekt

[T-41 · AgentLessons](30-doing/T-41-agentlessons-projektuebergreifend-sammeln.md)
hält das Konzept für lokale Einzel-Lessons, eine separate zentrale Aggregation
und nachvollziehbar abgeleitete Regeln fest. Mike hat es am 2026-09-11 aktiviert
und nach `30-doing/` verschoben; erster Schritt ist die Aufteilung der Lessons
in Einzeldateien samt Abgleich von Ticket-Skill und Agenten-Infos. Dieser
Bestand ist überführt und durch Claude in Runde 1 technisch freigegeben.
Mikes Abschlussabnahme ist offen. Collector und automatische Regelableitung
sind weiterhin geplant und noch nicht aktiviert. Verweise
innerhalb von AgentLessons bleiben relativ; registrierte Projektquellen werden
über eine benannte Basis aufgelöst.

Der Bestand liegt seit Mikes Entscheidung vom 2026-09-11 unter
`~/.local/share/agent-lessons/`. KanTandem beschreibt dasselbe Thema in seinem
Konzeptabschnitt 0d; beide Fassungen sollen sich ergänzen statt auseinander
zu laufen. Die Abgrenzung steht im Ticket.

[↑ Übersicht](#übersicht)
