# StockPortfolio · Rollen und Kommunikationsstatus

**Aktuelle Tätigkeit:** [ACTIVITY.md](ACTIVITY.md). Kurze Meldungen für Mike,
neueste oben. Alle drei Rollen schreiben über den globalen `agent-activity`;
ACTIVITY nicht als Agentenkontext lesen. Pflege nach
[Workflow](.agents/AGENT-WORKFLOW.md#aktuelle-tätigkeit).

**T-60 und T-63 technisch freigegeben:** [Konten und eigene API](30-doing/T-60-stockportfolio-server-und-benutzerkonten.md)
sowie [lokaler Teststack](30-doing/T-63-reproduzierbarer-lokaler-teststack.md)
hat Claude in Runde 6 geprüft. Mike hat T-60 für sich abgeschlossen. Seine
ausdrückliche T-63-Abschlussentscheidung steht noch aus; deshalb bleiben
beide Tickets in `30-doing/` und werden noch nicht gemeinsam integriert.
Der Teststack verbindet StockInfos vorhandene Testkurse, Konto-API und Vite.
StockInfo wurde nicht geändert.

**Aktuelle Arbeit:** [T-63 · lokaler Teststack](30-doing/T-63-reproduzierbarer-lokaler-teststack.md)
mit Mikes neuem Theme-Abnahmepunkt in der technischen Nachprüfung; danach
[T-62 · SSE-Benachrichtigung](30-doing/T-62-sse-benachrichtigung-fuer-depots.md).
Mike hat den unmittelbaren Beginn nach den Anpassungen ohne weiteren
Warteschritt beauftragt. Claude hat die Konzepte beider Tickets geprüft;
Produktnachweise stehen noch aus. Die Mehradmin-Regel und die Sichtbarkeit des
alten Browserbestands sind in T-61 Konzept Runde 2 von Claude entschieden:
jedes Konto hat eigene Daten, die Altbestandsvorschau gehört nur dem
serverseitig markierten Setup-Konto.
Die Architektur-Spezifikation liegt unter
`docs/superpowers/specs/`. Die Projektstruktur bleibt bei `frontend/` und
`api/`, je mit eigenem Manifest; die Version steht in `frontend/package.json`.

**Abgeschlossener Auftrag:** [T-58 · About und Datenhinweise](40-done/T-58-about-data-use-notice.md)
ist am 2026-09-28 nach Claudes technischer Freigabe in Runde 1 und Mikes
Bestätigung „Von mir aus ist das Ticket durch“ abgeschlossen. Die Fassung
umfasst Mikes Screenshot-Rückmeldung zur lesbaren Fehlseite im dunklen Theme.
Eine rechtliche Prüfung des endgültigen öffentlichen Wortlauts wird damit
nicht behauptet.

[T-59 · Unraid-Katalogstand](40-done/T-59-unraid-katalog-in-anleitung-korrigieren.md)
ist am 2026-09-28 nach Claudes technischer Freigabe in Runde 1 und Mikes
Bestätigung „von mir aus ist das OK“ abgeschlossen. Die Unraid-Anleitung nennt
die Listung unter Apps; ein praktischer Start auf Unraid wurde nicht geprüft.
[T-57 · EUPL-Lizenz](40-done/T-57-eupl-lizenz.md)
ist am 2026-09-27 nach Claudes technischer Freigabe in Runde 3 und Mikes
Bestätigung „Ticket ist damit erledigt“ abgeschlossen. EUPL 1.2 ersetzt die
eigene Lizenz, COMMERCIAL-LICENSE.md ist entfernt. Michael Mitterer bleibt
Urheber; MangoLila GmbH ist Anbieterin und Lizenzgeberin. Die Hinweise zur
internen Rechtevereinbarung und österreichischen Rechtsprüfung bleiben auf
Mikes Wunsch als persönliche Wiedervorlage im archivierten Ticket erhalten.
Ihr rechtlicher Abschluss wird damit nicht behauptet.
Der Abschluss ist nach `master` integriert. `make tag-minor` hat Version
`0.4.0` und Tag `v0.4.0+260927.2137.6687a` erstellt und gepusht; die
Release-Message wurde auf Mikes Nachtrag ergänzt. Das Changelog ist aktualisiert.

[T-56 · Changelog-Generator](40-done/T-56-changelog-generator.md) ist am
2026-09-27 nach Claudes technischer Freigabe in Runde 3 einschließlich der
nachgeholten Quellenprüfung und Mikes Bestätigung „T-56 sollte durch sein
-oder?“ abgeschlossen. Die frühere Prüffassung und sämtliche Nachweise
bleiben im archivierten Ticket erhalten.
[T-55 · Kurze Versionierungs-Targets](40-done/T-55-kurze-versionierungs-targets.md)
ist am 2026-09-27 nach Claudes technischer Gesamtfreigabe in Runde 2 und
Mikes Bestätigung „T-55 sollte erledigt sein“ abgeschlossen.
[T-54 · Backup im leeren Depot](40-done/T-54-sicherung-im-leeren-depot.md)
ist am 2026-09-27 in Runde 1 durch `claude` technisch freigegeben und nach
Mikes bedingter Abschlussentscheidung abgeschlossen. Der Coder hat die
Prüfaussage zum Abbruchpfad gemäß Observer-Hinweis begrenzt; kein Produktbefund.
[T-53 · Medienproduktion](/Volumes/Daten/Projekte/MangoLila_000000_SocialMedia/StockApps/_tickets/30-doing/T-53-blogposts-und-erklaervideo-fuer-beide-apps.md)
wurde auf Mikes Auftrag am 2026-09-27 mit allen Nachweisen in das eigenständige
StockApps-Board unter `Daten` übertragen. Die Produktion bleibt dort pausiert;
hier wird keine zweite Ticketfassung weitergeführt.

[T-52 · API-Link direkt zum Status-Tab](40-done/T-52-statuszeile-api-link-zum-status-tab.md)
ist in Runde 1 durch `claude` technisch freigegeben und am 2026-09-27 von
Mike mit „T-52 passt“ abgeschlossen. Die beauftragte Kette T-51 → T-52 ist erledigt.

[T-51 · Relative Bandabweichung im Rebalancing](40-done/T-51-rebalancing-bandabweichung-als-zahl.md)
ist nach Claudes Freigabe in Runde 8 und Mikes bedingter Abschlussentscheidung
am 2026-09-27 abgeschlossen und archiviert.

[T-50 · GitHub-Link in der Statuszeile](40-done/T-50-github-link-statuszeile.md)
ist in Runde 2 durch `claude` technisch freigegeben und auf Mikes Bestätigung
vom 2026-09-27 abgeschlossen: „T-50 ist erledigt“.

Der vorherige Auftrag ist abgeschlossen. Mike hat am 2026-09-26 ausdrücklich bestätigt:
„T-49 ist erledigt“. Das Ticket liegt unter
[`40-done/T-49-dockerhub-veroeffentlichung.md`](40-done/T-49-dockerhub-veroeffentlichung.md).
Die technischen Freigaben der Runden 1 bis 4 und die nachfolgenden README-/
Screenshot-Commits bleiben dokumentiert. Mike bestätigt außerdem:
„Docker-Hub-Push habe ich erledigt“. Die Veröffentlichung ist damit durch Mike
gemeldet; ein unabhängiger Registry-/README-Nachweis wurde hier nicht ergänzt.
T-35/T-36 bleiben im Backlog und sind nicht aktiviert.

Rollen bleiben zugeordnet: Coder `codex`, Verifier `claude`, Observer
`codex-observer`. Der bestehende Rollen-Scheduler beobachtet das Board;
er prüft die Zuordnung vor jedem Durchlauf.

**Offene Übernahme:** lokaler Board-Stand `2026-09-11-activity-feed`,
installiertes AgentLessons-Paket `df699dd1d7583c59030030ad44e3ab896d4660be8d84575662e652f754624da1`
(Konventionsstand `2026-09-28-activity-local`). `ACTIVITY.md` bleibt nach
Mikes Beschluss vom 2026-09-28 lokal und wird bereits über die Root-`.gitignore`
ignoriert; die Paketvorlage sieht dafür eine noch fehlende
`_tickets/.gitignore` vor. Die allgemeine Übernahme ist nicht beauftragt und
bleibt offen; Mikes Entscheidung und die bestehenden Schreibgrenzen gelten.

## Maschinenlesbarer Zustand

T-63 ist in Runde 2 für Commit `6459dca` technisch freigegeben. Diese Fassung
umfasst die von Mike beauftragten Änderungen an `make dev`, der Paketstruktur
und dem Testskript. Mike hat vor seiner Abnahme die Korrektur der fünf
Review-Hinweise beauftragt; diese Fassung `a8c7402` ist in Runde 3 technisch
freigegeben.
T-63 ist in Runde 6 für `26b59ed` technisch freigegeben; dieselbe Prüfung
gibt T-60 samt Paketumbau technisch erneut frei. Mike hat die T-60-Abnahme
erklärt und die anschließende Umsetzung von T-61 und T-62 beauftragt.
Mikes Abschlussentscheidung für T-63 und die gemeinsame Integration beider
Tickets stehen aus. Die letzte technische Reviewreferenz ist T-63 Runde 6.
T-61 ist auf dem eigenen Branch `t-61-benutzergebundene-depotdaten-per-rest`
von der freigegebenen Fassung abgezweigt. Die zwei Befunde aus Claudes
technischer Runde 3 zu kontoübergreifenden Depot-IDs und dem stillen
IndexedDB-Rückfall sind in Runde 4 (`2880d1d`) als behoben bestätigt. Den
verbliebenen Befund 3 zum lokalen Restore-Zweig und zu fehlenden Store-Tests
hat Codex mit `238723a` behoben. Die aufruflosen Store-Methoden und den
verwaisten i18n-Schlüssel aus Runde 5 hat Codex mit `094802b` entfernt. Claude hat
T-61 in Runde 6 technisch freigegeben; Mikes Prüfpunkte A bis D stehen aus.
Mike hält T-63 weiter in Abnahme. Die Hilfe mit Beispielen untereinander
liegt als `1c7f37c` auf dem T-63-Branch. Der neue Theme-Abnahmepunkt ist
dort mit `bd4faec` umgesetzt. ProjectTools-`master` enthält das paketierte
Python-Modul lokal als `f8cd8ec`; es erfolgte kein Push.
Claudes Runde 7 für `bd4faec` endete mit `changes_requested`: Das Theme
funktioniert, aber die Anleitungen schreiben die Installation in StockInfos
`.venv` vor, die StockInfo-T-82 erst klären soll.
Runde 8 (`e4db84b`, Variante a) ist durch Mikes Entscheidung für eine eigene
`.venv` in StockPortfolio (Variante c) überholt und zurückgegeben.
Variante (c) liegt mit `ca9c74b` und `d7e1607` auf dem T-63-Branch:
StockPortfolios eigene `.venv` trägt das ProjectTools-Paket aus der allgemeinen
`requirements.txt`; `make clean` behält sie. Der StockInfo-Kindprozess nutzt
weiter dessen unveränderte `.venv`. Runde 9 prüft diese Fassung. Der volle
Stack wurde für die Umstellung nicht erneut gestartet; die Prüffassung nennt
den letzten Live-Nachweis und die neuen Preflight- und Theme-Proben.
Claudes Runde 9 bestätigte die eigene `.venv` live, fand aber Restdateien
nach dem Stopp und einen falschen Portkonflikt bei `TIME_WAIT`. Die Korrekturen
`44f61a6` und `05ccd7b` sind nach Einzelserver- und doppeltem Stack-Lauf
in Runde 10 zur Nachprüfung übergeben. Mikes T-63-Abnahme bleibt offen.
T-62 hat einen eigenen Branch und folgt auf die T-63-Nachprüfung. Für
T-60/T-63 erfolgen bis zu Mikes T-63-Entscheidung weder Merge noch Push.

- `implementer`: `codex`
- `reviewer`: `claude`
- `observer`: `claude-observer`
- `phase`: `ready_for_review`
- `ticket`: `T-63-reproduzierbarer-lokaler-teststack.md`
- `handoff_commit`: `e596e1b76b08d629fac979544fa2ef1ff8d22252`
- `review_round`: `10`
- `owner`: `claude`
- `updated_at`: `2026-09-30`
- `last_reviewed_ticket`: `T-63-reproduzierbarer-lokaler-teststack.md`
- `last_reviewed_commit`: `70c25a6117d9339cddd8fd18ba459565b614315b`
- `last_reviewed_round`: `9`
- `workstream`: `stockportfolio-server-sync`
- `priority_chain`: `T-63-reproduzierbarer-lokaler-teststack.md, T-62-sse-benachrichtigung-fuer-depots.md`
- `priority_ticket`: `T-63-reproduzierbarer-lokaler-teststack.md`

`unassigned` und `none` sind ausdrücklich inaktive Werte, keine Instanznamen
oder Ticketdateien. Vor einer Agentenübergabe Rollen und Auftrag ausdrücklich
zuordnen. `owner` bezeichnet die Instanz, die gerade am Zug ist.
Keine Rollen oder Übergabefassungen aus StockInfo übernehmen.

Für künftige Übergaben gelten neutrale Phasen: `implementing` →
`ready_for_review` → `reviewing` → `changes_requested` oder `approved`.
Bei Arbeitsbeginn hat der Coder den Owner, bei Übergabe und Review der
Verifier, nach dem Prüfurteil wieder der Coder. `blocked` bezeichnet einen
konkret dokumentierten Entscheidungsbedarf; `idle` enthält keinen Auftrag.
Eine technische Freigabe ist noch kein Ticketabschluss.

`ticket`, `priority_ticket`, `priority_chain` und `last_reviewed_ticket`
enthalten bei Belegung Dateinamen ohne Ordner. Aktive Arbeit wird unter
`30-doing/` aufgelöst. Der letzte Review kann zu einem archivierten Ticket
gehören und startet keine erneute Arbeit. Die `last_reviewed_*`-Felder
erhalten die letzte abgeschlossene Prüfung; die Übergabefelder sind ohne
aktiven Auftrag leer. Reviews im AgentLessons-Board bleiben dort.

## Kontext

### AgentLessons ist umgezogen · 2026-09-11

Mike: „OK - wir ziehen um: /Volumes/DevLocal/DevKI/Production/AgentLessons …
Du kannst t-41 und t-42 dorthin mitnehmen“.

T-41 und T-42 werden in `/Volumes/DevLocal/DevKI/Production/AgentLessons`
weitergeführt; hier stehen nur noch Verweise. Das neue Board ist vollständig
eingerichtet, die Rollen sind wie hier zugeordnet (`codex`, `claude`,
`codex-observer`), und der Reviewbezug aus Runde 2 ist übernommen, damit kein
abgeschlossenes Review wiederholt wird.

**In StockPortfolio bleibt der erledigte Anteil:** lokale Lessons als
Einzeldateien unter `.agents/lessons/`, die Linkeinstiege,
`LESSONS-ACCESS.md`, `LESSONS-PROCESS.md` und `ACTIVITY.md`. Diese Umstellung
ist in Runde 1 und 2 technisch freigegeben; **Mikes Abschlussabnahme erfolgt
auf dem AgentLessons-Board**.

Der Workstream dieses Boards ist damit wieder frei. T-38 wurde inzwischen am 2026-09-26 durch Mike abgeschlossen. T-39 ist seit demselben Tag ebenfalls abgeschlossen. Auch T-40 ist inzwischen abgeschlossen; T-35 und T-36 bleiben im Backlog.

**Formatänderung für alle Autoren:** Vor der nächsten Lessons-Pflege
[LESSONS-ACCESS.md](.agents/LESSONS-ACCESS.md) lesen. Originale liegen unter
`lessons/`, gemeinsame Regeln in AgentLessons, Metadaten haben Formatfassung 1.
Die bisherigen Sammeldateien sind reine Linkeinstiege ohne zweiten
handgepflegten Inhalt.

### ACTIVITY · zentraler Helfer · 2026-09-11

Mikes Auftrag und Claudes weitergeleitete Anforderungen sind in
T-42 festgehalten und umgesetzt; das Ticket liegt seit dem Umzug im
AgentLessons-Board.
`~/.local/bin/agent-activity` verweist auf die einzige Quelle im Tickets-Skill.
Alle Projekte verwenden denselben Befehl; keine Kopie unter `.agents/bin`.
Neue Einträge oben, ein bis zwei Sätze, Standard letzte 50. Agenten schreiben
nur eigene Meldungen und lesen ACTIVITY nicht als Kontext. Übernahme nach dem
Workflow, Konventionsstand `2026-09-11-activity-feed`. Eine Meldung nennt den
konkreten Gegenstand, nicht nur Ticket und Phase.

### Historischer Integrationsauftrag · bis 2026-09-10

Mike, 2026-09-10: „T-37 und T-38 sind die nächsten Tickets die du abarbeiten sollst“.
Ursprüngliche Reihenfolge: T-37 vor T-38. T-37 liefert zunächst den im Ticket beschriebenen
Integrationsvorschlag. Mike hat eine automatische Detailanzeige gewählt:
Felder der tatsächlichen Hauptzeile einschließlich dynamischer Felder
werden nicht wiederholt. Für T-38 hat Mike am 2026-09-10 eine vom Nutzer konfigurierbare
Basiswährung **je Depot** festgelegt. Typische Wahl: EUR im Euroraum, USD in
den USA; Hauptfall ist das Depot mit gewählter Währung. Veraltete FX-Kurse
werden mit sichtbarer Warnung weiterverwendet. T-39 übernimmt die gemeinsame
Kursprüfung einschließlich Währung aus T-35. T-40 zeigt Detailwerte in ihrer
Originalwährung; T-38 ergänzt danach Depotbewertung und FX. T-35 bleibt mit
seinem Generationsauftrag im Backlog.

Arbeitsbranch: `t-38-basiswaehrung-und-devisenkurse`, auf der freigegebenen
T-40-Fassung. Der frühere geplante Worktree wurde nicht angelegt.
Das maßgebliche Board liegt unter
`/Volumes/DevLocal/DevWeb/Production/StockPortfolio/_tickets`.
Vorgefundene fremde Produktänderungen im Hauptarbeitsbaum gehören nicht zu
diesem Integrationsauftrag.

Projektweite Entscheidung vom 2026-09-10: keine Migrationspfade zwischen
StockPortfolio-Versionen. Einfach passende Daten übernehmen; inkompatible
Entwicklungsdaten dürfen zurückgesetzt und neu angelegt werden. Maßgeblich
ist der Abschnitt „Tatsächlicher Entwicklungsstand“ in `AGENTS.md`.

Mike, 2026-09-10: „Leg die Umsetzungs-Tickets in doing an - das hat prio“.
Aus dem freigegebenen T-37-Vorschlag entstanden dafür
[T-39](40-done/T-39-identitaet-normalisieren.md) — Identität normalisieren —
und [T-40](40-done/T-40-detailanzeige-aus-feldkatalog.md) — automatische
Detailanzeige. Beide wurden auf Mikes Ansage unter `30-doing/` angelegt und
inzwischen umgesetzt sowie technisch freigegeben. Die damalige Einordnung
vor T-38 beschreibt die frühere Bearbeitung; damals hatte T-38 Vorrang.

**Aktueller Stand:** T-38 bis T-40 sowie T-43 bis T-49 sind abgeschlossen.
T-50 bis T-52 sowie T-54 bis T-57 sind abgeschlossen. Die früheren Prioritätsentscheidungen unten bleiben
als historische Begründung erhalten.

**Frühere Prioritätsklärung · Mike, 2026-09-10:** „Zuerst Depotwährung aus T-38“.
Diese Priorität ist mit der technischen Freigabe von T-38 bearbeitet. Die
vorhandene Umsetzung braucht keine weiteren Folgetickets für denselben Umfang. Mike erlaubt,
offene Fragen zur sinnvollen Ticketreihenfolge mit dem Observer zu klären,
damit dafür die laufende Session nicht unterbrochen werden muss. Derzeit ist
keine Reihenfolgefrage offen.

**Frühere Reihenfolgeentscheidung:**
Mike hat im Observer-Chat am 2026-09-10 ausdrücklich geschrieben:
„Aktuell sollen die Folgetickets von T-37 erledigt werden erst dann T-38
überprüfe die Reihenfolge, ich glaube das macht sinn“.
Die damalige Kette war T-39 → T-40 → T-38. Für die weitere Arbeit gilt die
oben festgehaltene jüngste Prioritätsklärung.
Der Observer hat auf Mikes anschließenden Auftrag „Pass die Info entsprechend
an“ die Ticketabgrenzung und Verweise aktualisiert. Auf Mikes weiteren Hinweis
„Phase - immer noch blocked“ hat er den erledigten Klärungsblocker aufgehoben
und `implementing` gesetzt. Rollen, Owner und Reviewzähler bleiben unverändert.

T-39 liefert die gemeinsame Pflichtfeldprüfung einschließlich Kurswährung.
T-40 und T-38 verwenden dieselben Typen, Mapper, Cache- und Anzeigebausteine
weiter. T-40 erhält die Originalwerte; T-38 leitet daraus Depotwerte ab.
Die konkreten Prüfpunkte stehen vollständig in den drei Tickets. Mike hat
am 2026-09-10 klargestellt, dass die gesamte benötigte Information im
entsprechenden Ticket liegen soll. Der T-37-Integrationsvorschlag bleibt
ausschließlich als historische Bewertung erhalten.
Die Freigabe von T-37 Runde 1 durch `claude` ist verarbeitet; keine Nacharbeit. T-38 war
noch nicht begonnen — Branch und Worktree existierten beim Vorziehen nicht,
es geht also keine angefangene Arbeit verloren. T-37 ist mit Mikes
Bestätigung „T-37 ist damit erledigt“ nach `40-done/` verschoben.
Der Scheduler bleibt aktiv.

### Übernahmestand

Umstellung am 2026-09-10 nach dem Auftrag, die Struktur von StockInfo zu
übernehmen. Die Einordnung folgt den vorhandenen Tickets; sie erteilt weder
eine neue Umsetzungsgenehmigung noch eine zusätzliche Abnahme.

| Tickets | Übernommener Stand und offener Rest |
|---|---|
| [T-31](40-done/T-31-refresh-erzwingt-frische-kurse.md) | Umsetzung vorhanden; am 2026-09-10 durch Mike abgeschlossen. Ursprüngliche Prüfnachweise und Antworten erhalten. |
| [T-32](40-done/T-32-fortschrittsleiste.md) | Umsetzung vorhanden; am 2026-09-10 durch Mike abgeschlossen. Ursprüngliche Prüfnachweise und Antworten erhalten. |
| [T-33](40-done/T-33-schonfrist-automatisches-laden.md) | Umsetzung vorhanden; am 2026-09-10 durch Mike abgeschlossen. Einstellung ist durch T-34 bedienbar. |
| [T-34](40-done/T-34-einstellungen-fuers-aktualisieren.md) | Umsetzung vorhanden; am 2026-09-10 durch Mike abgeschlossen. Beide Aktualisierungseinstellungen sind bedienbar. |
| [T-35](10-backlog/T-35-stockinfo-generation-und-waehrung.md) | Bisher `offen`; ausführlicher Entwurf mit bisherigen Prüfnotizen, Implementierungsnachweise leer. Keine belegte Einplanung der Umsetzung. Abhängigkeiten vor Aufnahme neu prüfen. |
| [T-36](10-backlog/T-36-eslint-waechter-aus-dem-fundament.md) | Bisher `blocked`; wartet laut Ticket auf eine installierbare ux-foundation-Fassung. Keine begonnene Umsetzung; Voraussetzung vor Einplanung neu prüfen. |
| [T-37](40-done/T-37-stockinfo-quote-vertrag-und-dynamische-felder.md) | Bewertung durch claude in Runde 1 technisch freigegeben; am 2026-09-10 durch Mike abgeschlossen. Umsetzung separat in T-39 und T-40. |
| [T-39](40-done/T-39-identitaet-normalisieren.md) | In Runde 1 technisch freigegeben; am 2026-09-26 durch Mike abgeschlossen: „T-39 ist erledigt“. |
| [T-40](40-done/T-40-detailanzeige-aus-feldkatalog.md) | Runde 1 technisch freigegeben; am 2026-09-26 durch Mike abgeschlossen. |
| [T-38](40-done/T-38-basiswaehrung-und-devisenkurse.md) | In Runde 2 technisch freigegeben; am 2026-09-26 durch Mike abgeschlossen: „T-38 ist erledigt“. |
| 26 Tickets aus `solved/` | Nach `40-done/` übernommen; bestehender Archivstatus und Inhalte bleiben erhalten. |

T-31 bis T-34 sind auf Mikes Auftrag im Observer-Chat abgeschlossen:
„Schließ ab und bereinige die Aussage“. Die bisherigen Einzelantworten bleiben
erhalten; neue Einzelprüfurteile wurden nicht ergänzt.
T-38, T-39 und T-40 sind abgeschlossen.
T-37 ist als Bewertung abgeschlossen.
`80-iced/` und `90-rejected/` sind leer.
Eine wartende Abhängigkeit allein ist kein Beschluss zum Einfrieren.

### Gemeinsame Regeln

Rollen werden ausschließlich oben zugeordnet. Fachliche Regeln stehen in
[AGENT-WORKFLOW.md](.agents/AGENT-WORKFLOW.md), Laufzeit-Einstiege in
[AGENT-ACTIVATION.md](.agents/AGENT-ACTIVATION.md). Alle Autoren lesen vor
Board-Arbeit die neue [Ablageanleitung](README.md#ablage); die früheren
Root- und `solved/`-Pfade gelten für StockPortfolio nicht mehr.

INBOX und OUTBOX enthalten nur unverarbeitete Nachrichten. Befunde und
dauerhafte Entscheidungen gehören ins Ticket; verarbeitete Nachrichten
werden entfernt.

## INBOX → Coder

Keine offene Nachricht.

## OUTBOX → Verifier

- **Von `codex` an `claude`, T-63 technische Runde 10, Fassung `e596e1b`:** Bitte die zwei Befunde aus Runde 9 prüfen: `44f61a6` räumt den StockInfo-Kindzustand nach Uvicorns SIGTERM auf, `05ccd7b` erlaubt den Port-Probe-Bind bei `TIME_WAIT`. Einzelserver und vollständiger Stack wurden auf Port 18987 je zweimal gestartet und gestoppt; eigene Zustandsdateien und neue Testdaten waren danach weg. `make test` (806/8), beide Lints und Typechecks, Ruff und Doku-Abgleich stehen im Ticket. Branch `t-63-reproduzierbarer-lokaler-teststack`, Worktree `/private/tmp/stockportfolio-t63-help`. Mikes T-63-Abschlussentscheidung ist weiter offen.
