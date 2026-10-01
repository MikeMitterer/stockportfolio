# StockPortfolio — Ticket-Board

Kleine, verifizierbare Arbeitspakete für die MVP-Umsetzung nach
[`docs/superpowers/specs/2026-08-06-rebalancing-webapp-design.md`](../docs/superpowers/specs/2026-08-06-rebalancing-webapp-design.md).

Der Ablageort zeigt den Arbeitsstand. Rollen, Reihenfolge und genaue Phase
stehen in [STATUS.md](STATUS.md). Seit dem 2026-09-10 verwendet StockPortfolio
dieselbe Board-Struktur wie StockInfo und der Skill `task-verification-workflow`.

**Was gerade passiert:** [ACTIVITY.md](ACTIVITY.md) zeigt kurze
Tätigkeitsmeldungen, neueste oben. Coder, Verifier und Observer schreiben sie über `agent-activity` nach dem
[Workflow](.agents/AGENT-WORKFLOW.md#aktuelle-tätigkeit); das gilt für alle Tickets.
Die Datei bleibt lokal und wird auf Mikes Beschluss vom 2026-09-28 nicht in
Git versioniert (`_tickets/.gitignore`). Der Helfer legt sie bei Bedarf an.

## Übersicht

- [Ablage](#ablage)
- [Von der Aufnahme bis zum Abschluss](#von-der-aufnahme-bis-zum-abschluss)
- [Nachweise und Agentenregeln](#nachweise-und-agentenregeln)
- [Aktive Kette: private Depots auf dem StockPortfolio-Server](#aktive-kette-private-depots-auf-dem-stockportfolio-server)
- [Roadmap (MVP-Reihenfolge)](#roadmap-mvp-reihenfolge)
- [Offen](#offen)
- [Neu erfasste Integrationsbewertung](#neu-erfasste-integrationsbewertung)
- [Umgezogen: AgentLessons](#umgezogen-agentlessons)

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
├── ACTIVITY.md    # kurze Tätigkeitsmeldungen, neueste oben (nicht in Git)
├── .gitignore     # nimmt ACTIVITY.md von Git aus
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
regelt Vorbeugung, unabhängige Gegenprüfung und Lessons-Pflege. Neue Befunde
werden nach der [Lessons-Einordnung](.agents/AGENT-WORKFLOW.md#lessons-einordnung-bei-neuen-befunden)
im Ticket zugeordnet; neue Tickets folgen der [Ticketvorlage](.agents/TICKET-TEMPLATE.md).

Der optionale Observer beaufsichtigt Coder und Verifier unabhängig vom Owner.
Er koordiniert bei Bedarf über die STATUS-Mailboxen und berichtet wesentliche
Hinweise und Eingriffe in seinem Chat. Seine Instanzkennung steht in STATUS. Die
[Aktivierung](.agents/AGENT-ACTIVATION.md) enthält beide Scheduler-Varianten,
die Startbefehle `codex-observer` und `claude-observer` sowie Stoppen und
Wiedereinstieg. Eine technische Abnahme bleibt Aufgabe des Verifiers.

[QUESTIONS.md](QUESTIONS.md) sammelt kurzfristige Fragen. Erledigte Einträge
nach Übertragung in Ticket, Dokumentation oder GitHub-Issue entfernen.

[↑ Übersicht](#übersicht)

## Serverdepots und laufende Folgearbeit

Mike hat die serverseitige Synchronisation mit getrennten privaten
Benutzerkonten und SSE am 2026-09-28 beauftragt. T-60 und der vorgezogene
lokale Teststack T-63 sind technisch freigegeben. Mike hat T-60 für sich
abgeschlossen; T-63 wartet noch auf seine menschliche Abschlussentscheidung.
T-61, T-62, T-64 und T-65 sind ebenfalls technisch freigegeben und auf Mikes
Auftrag lokal nach `master` integriert. Die offenen menschlichen Abnahmen
bleiben davon getrennt. T-66 liegt dem Verifier vor. T-67 prüft die
Internet-Hinweise nach einer aktualisierten Coder-Übergabe; T-68 mit den
Screenshots steht bereit.
Verbindlich ist die Zuordnung in [STATUS.md](STATUS.md#maschinenlesbarer-zustand).

1. [T-60 · Server und Benutzerkonten](30-doing/T-60-stockportfolio-server-und-benutzerkonten.md)
   liefert App und eigene API im StockPortfolio-Container sowie Setup,
   Anmeldung und Admin-Verwaltung.
2. [T-63 · Lokaler Teststack](30-doing/T-63-reproduzierbarer-lokaler-teststack.md)
   verbindet StockInfos vorhandene Testkurse, die Konto-API und Vite
   reproduzierbar ohne Docker.
3. [T-61 · Private Depotdaten per REST](30-doing/T-61-benutzergebundene-depotdaten-per-rest.md)
   macht den Server zur Datenquelle und übernimmt vorhandene Browserdaten
   ausdrücklich in das richtige Konto.
4. [T-62 · SSE-Benachrichtigung](30-doing/T-62-sse-benachrichtigung-fuer-depots.md)
   meldet gespeicherte Änderungen an andere Browser desselben Kontos, die
   daraufhin per REST neu laden.

StockInfo bleibt für Kurse und Instrumente zuständig; diese Kette ändert dort
nichts. Der jeweils aktive Auftrag, die Rolle am Zug und der Worktree stehen
in STATUS.

[↑ Übersicht](#übersicht)

## Roadmap (MVP-Reihenfolge)

Stand nach dem Release 0.1.0. „Teilweise“ heißt: Das Ticket ist nicht
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
[T-39 · Identität normalisieren](40-done/T-39-identitaet-normalisieren.md) und
[T-40 · Detailanzeige aus dem Feldkatalog](40-done/T-40-detailanzeige-aus-feldkatalog.md).
Beide sind bereits umgesetzt und technisch freigegeben. Anschließend wurde
auch die Depotwährung aus T-38 technisch freigegeben und am 2026-09-26
durch Mike abgeschlossen; der aktive Auftrag steht in
[STATUS](STATUS.md#maschinenlesbarer-zustand).
T-39 ist technisch freigegeben und durch Mike am 2026-09-26 abgeschlossen: „T-39 ist erledigt“.
T-40 ist ebenfalls technisch freigegeben und am 2026-09-26 durch Mike abgeschlossen.

| Ticket | Zuständiger Umfang |
|---|---|
| T-39 | Identität und gemeinsame Prüfung der Kurs-Pflichtfelder einschließlich Währung |
| T-40 | Detailwerte mit Einheit und Originalwährung anzeigen; keine FX-Umrechnung |
| T-38 | Depot-Basiswährung, Devisenkurse und daraus abgeleitete Depotbewertung |
| T-43 | Positionsdetails nach Aufgabe gliedern; die freigegebene T-40-Feldanzeige dabei erhalten |

Typen, Mapper, Cache und Formatierung werden gemeinsam weiterverwendet.
Der Generationsauftrag aus T-35 bleibt im Backlog; seine allgemeine
Kursprüfung ist in T-39 umgesetzt.
T-40 sowie T-43 bis T-47 sind nach technischer Freigabe durch Mike
abgeschlossen. Auch [T-48](40-done/T-48-assettypen-dynamisch-aus-stockinfo.md)
ist durch Mike abgeschlossen. [T-49](40-done/T-49-dockerhub-veroeffentlichung.md)
ist am 2026-09-26 auf Mikes ausdrückliche Entscheidung abgeschlossen. Der
Docker-Hub-Push ist durch Mike als erledigt bestätigt; die technischen
Prüfnachweise bleiben im Ticket getrennt ausgewiesen.
[T-50 · GitHub-Link in der Statuszeile](40-done/T-50-github-link-statuszeile.md) ist abgeschlossen.
T-51 ist [abgeschlossen](40-done/T-51-rebalancing-bandabweichung-als-zahl.md).
[T-52 · API-Link zum Status-Tab](40-done/T-52-statuszeile-api-link-zum-status-tab.md)
ist ebenfalls abgeschlossen.
[T-54 · Backup im leeren Depot](40-done/T-54-sicherung-im-leeren-depot.md)
ist nach Claudes Freigabe und Mikes bedingtem Abschluss erledigt.
[T-57 · EUPL-Lizenz](40-done/T-57-eupl-lizenz.md) ist nach Claudes technischer
Freigabe in Runde 3 und Mikes Bestätigung „Ticket ist damit erledigt“ am
2026-09-27 abgeschlossen. Rechtliche Wiedervorlagen bleiben im Ticket erhalten.
[T-56 · Changelog-Generator](40-done/T-56-changelog-generator.md)
ist nach Claudes Gesamtfreigabe in Runde 3 und Mikes Bestätigung am
2026-09-27 abgeschlossen.
[T-55 · Kurze Versionierungs-Targets](40-done/T-55-kurze-versionierungs-targets.md)
ist nach Claudes Gesamtfreigabe und Mikes Bestätigung am 2026-09-27 abgeschlossen.

[T-38 · Basiswährung außer EUR](40-done/T-38-basiswaehrung-und-devisenkurse.md):
Depotwahl und FX-Bewertung sind umgesetzt und von Codex im Browser geprüft.
Veraltete verwendbare FX-Kurse bleiben mit dauerhafter Warnung aktiv; fehlende
Kurse schließen Positionen aus Bewertung und Trades aus. Isolierte Prüfung:
712 Tests, Lint und Typecheck erfolgreich. Runde 2 ist durch Claude technisch
freigegeben; Mike hat T-38 am 2026-09-26 mit „T-38 ist erledigt“ abgeschlossen.

[↑ Übersicht](#übersicht)

## Umgezogen: AgentLessons

**T-41 und T-42 werden seit dem 2026-09-11 in einem eigenen Repository geführt:**
`/Volumes/DevLocal/DevKI/Production/AgentLessons`. Dort liegen die vollständigen
Tickets samt Reviewgeschichte, dort erfolgt auch Mikes Abschlussabnahme. Dieses
Board hält nur noch den Verweis.

In StockPortfolio bleibt der fertige Anteil: die lokalen Lessons als
Einzeldateien unter `.agents/lessons/`, die Sammeldateien als Linkeinstiege,
`LESSONS-ACCESS.md`, `LESSONS-PROCESS.md` und `ACTIVITY.md`. Der gemeinsame
Bestand liegt unter `~/.local/share/agent-lessons/`; Collector und automatische
Regelableitung sind geplant und noch nicht aktiviert. KanTandem beschreibt
dasselbe Thema in seinem Konzeptabschnitt 0d — die Abgrenzung steht im
umgezogenen Ticket.

[↑ Übersicht](#übersicht)
