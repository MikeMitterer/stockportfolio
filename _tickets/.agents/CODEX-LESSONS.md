# Erfahrungen aus Codex-Arbeit · StockPortfolio

Die Sammlung betrifft die Autorenschaft geprüfter Arbeit, nicht die aktuelle
Coder-/Verifier-Rolle. Für die Aufnahme gelten die
[Belegregeln](AGENT-WORKFLOW.md#belegte-erfahrungen).

## Einfache Startbefehle nicht zu einem eigenen System ausbauen

**Erkennungsregel:** Gewünscht sind kurze Aufrufe vorhandener Werkzeuge;
die Lösung führt dafür eine weitere Laufzeit, Argumentparser, Prozesssperren,
Sprachkataloge oder eine eigene Testsuite ein. Die Zusatzmechanik löst
Anforderungen, die nicht beauftragt wurden. Auch globale Shortcuts, deren
Symlinks in ein einzelnes Projekt zeigen, sind ein Warnsignal.

**Prüffrage vor der Umsetzung:** Erfüllen wenige direkte Shell-Aufrufe den
Auftrag vollständig? Welche zusätzliche Mechanik ist konkret erforderlich?
Kann derselbe Befehl ohne Codekopie und ohne festen Projektpfad in einem
anderen Projekt verwendet werden?

**Konsequenz:** Mit der kleinsten vollständigen Lösung beginnen. Für die
Observer genügen zwei eigenständige Bash-Dateien in `~/.local/bin/`, jeweils
mit einer `exec`-Zeile plus Shebang. Die Agenten lesen die Regeln des aktuellen
Boards. Vorhandene CLI-Funktionen verwenden; zusätzliche Infrastruktur nur
für einen belegten Bedarf ergänzen. Prüfaufwand an der tatsächlichen Lösung
ausrichten. Eine Dateistruktur mit Platzhaltern nicht als vollständige
Einrichtung melden.

**Belege · 2026-09-10:**

- Codex baute für `codex-observer` und `claude-observer` einen Python-Launcher
  samt Parser, Prozesssperre, Promptdatei, Sprachkatalog und zehn Tests.
  Mike: „Poah - ich dachte das wird ein Bash-Einzeiler. Wozu die riesen action
  mit Python-Script usw?“
- Die globalen Befehle waren zusätzlich mit StockPortfolios `.agents/bin/`
  verknüpft. Mike: „Abgesehen davon - Portabilität ist was anderes.“ Die
  Lösung wurde daraufhin auf zwei direkt installierte, projektunabhängige
  Bash-Einzeiler reduziert; der Launcher wurde aus dem Projekt entfernt.
- Mike ordnete die Aufnahme ausdrücklich an: „Das Problem kannst du gleich
  in Codex-Lessons festhalten - absolute Over-Construction“.

Aktuelle Verwendung: [Observer-Shortcuts](AGENT-ACTIVATION.md#observer-shortcuts-im-terminal).

**Implementer-Regel:** Vorhandene CLI direkt aufrufen; jede zusätzliche
Komponente mit einem konkreten Bedarf begründen.
Wiederkehrende eigene Hilfschecks einmal als lokale Datei ablegen und danach
kurz aufrufen. Den vollständigen Quelltext nicht in jedem Tool-Aufruf erneut
übertragen. Eine spätere allgemeine Wiederverwendung ist eine eigene Entscheidung.
**Verifier-Prüfung:** Den gesamten Lösungsumfang am Auftrag messen und die
Portabilität der Startbefehle aus einem zweiten Verzeichnis prüfen.

**Ergänzender lokaler Beleg · eigener Observer, 2026-09-10:** Der Filecheck war
einmal in Zelle `99` definiert, wurde jedoch bei jedem Takt als vollständiger
`python3 -c`-Befehl an das Werkzeug übertragen. Mike verlangte die Ablage in
`.agents/bin`, um wiederholte Quelltextübertragung und unnötigen Tokenverbrauch
zu vermeiden. Daraufhin nach `.agents/bin/observer-filecheck.py` ausgelagert;
der Scheduler verwendet den kurzen Dateiaufruf. Keine erneute KI-Generierung
je Takt behaupten: Wiederholt wurde hier die Übertragung desselben Codes.

## Entscheidungen in allen aktuellen Aussagen nachziehen

**Erkennungsregel:** Nach einer geklärten Entscheidung stimmen einzelne
Verweise oder Zustandsfelder, aber Einstieg, Kontext, Ticket oder README
beschreiben noch eine alte Priorität, einen offenen Umfang oder einen
erledigten Blocker. Eine korrekte Datei oder ein angepasster Link genügt nicht.

**Prüffrage:** Beschreiben Zustandsblock, aktueller Kontext, Ticket und
betroffene Anleitungen dieselbe Entscheidung? Ist bei einem ausdrücklich
beauftragten Zustandswechsel auch das wirksame Feld geändert, oder wurde
nur die Erklärung angepasst? Historische Reviewfassungen dabei von aktuellen
Aussagen unterscheiden.

**Belege · 2026-09-10:**

- In der Codex-Bearbeitung von T-38, Fassung `54da9da`, wurde der README-Link
  auf `30-doing/` angepasst. Dieselbe Zeile unter „Not there yet“ blieb bei
  „scope under discussion“, obwohl Basiswährung je Depot und Umgang mit
  veralteten FX-Kursen bereits im Ticket entschieden waren. Der Pfad stimmte,
  die Beschreibung des Umfangs nicht.
- Die im Observer-Chat selbst ausgeführte Dokumentationsanpassung stellte
  anschließend T-39 → T-40 → T-38 klar, ließ aber `phase: blocked` stehen und
  verwies die Verarbeitung an den Coder. Mike musste mit „Phase - immer noch
  blocked“ nachfassen. Erst danach wurden Phase und überholte Blockertexte
  gemeinsam korrigiert. Die dokumentierte Bestätigung lag schon vor.

**Konsequenz:** Den in [AGENTS.md](../../AGENTS.md#dokumentation-gehört-zur-änderung)
geforderten Doku-Abgleich bis zu den wirksamen Zustandsangaben durchführen.
Gesondert autorisierte Änderungen vollständig ausführen; eine eng begrenzte
Observer-Ausnahme bleibt auf diesen Auftrag begrenzt. Fehlende Autorisierung
nicht selbst erzeugen. Frühere Nachweise bleiben auf ihre geprüfte Fassung
bezogen und werden durch redaktionelle Fortschreibung nicht erweitert.

**Implementer-Regel:** Betroffene Aussagen und wirksame Zustandsfelder gemeinsam
nachziehen, soweit der Auftrag die Änderung autorisiert.
**Verifier-Prüfung:** Entscheidung, aktuelles Feld und alle betroffenen
Einstiegstexte gegeneinander lesen; historische Belege getrennt einordnen.

## Laufende Wartezelle belegt keinen regelmäßigen Durchlauf

**Erkennung:** Die Zelle meldet weiter `Script running`, aber zwischen zwei
Heartbeats liegen mehrere geplante Takte. Ihre Existenz ist kein Nachweis
einer durchgehenden Beobachtung.

**Implementer-Regel:** Beim Betrieb eines In-Context-Schedulers tatsächliche
Heartbeat-Zeiten mit dem geplanten Takt vergleichen. Beobachtungslücken offen
nennen, versäumte Takte überspringen und keine Hintergrundgarantie aus einer
Cell-ID ableiten. Ursache und beobachtete Auswirkung getrennt halten; ein
fehlender Takt allein beweist weder einen Codefehler noch einen Rechner-Ruhezustand.
Bei wiederholten Lücken zuerst die Laufzeit- und Betriebssystemprotokolle mit
den Heartbeat-Zeiten abgleichen, statt wiederholt nur den Timer neu zu starten.
Ist durchgehender lokaler Betrieb gewünscht und Systemruhe als Ursache belegt,
eine an die eigene Sitzung gebundene Ruhezustandssperre vorsehen; keine
pauschale dauerhafte Änderung der Energieeinstellungen daraus ableiten.

**Verifier-Prüfung:** Startsignal und mindestens einen Folgedurchlauf anhand
realer Zeiten prüfen. Bei Unterbrechungen den letzten und den nächsten belegten
Durchlauf nennen. Das bestätigt die Fortsetzung, keine rückwirkende Abdeckung
der Lücke. Maßgeblich bleibt der [Scheduler-Vertrag](CODEX-IN-CONTEXT-SCHEDULER.md).

**Belege · eigener Codex-Observer, 2026-09-10:** Zelle `57`, geplant alle
300 Sekunden. Sichtbare Heartbeats um `11:18:23Z` und erst wieder `11:36:19Z`,
danach erst `11:52:25Z`. Beide Abstände überschritten mehrere Takte; die
Warteaufrufe zeigten die Zelle weiterhin als laufend. Die Ursache war bei
dieser Aufnahme nicht ermittelt. Der unveränderte Dateistand nach der Lücke belegt keine Beobachtung
während der ausgefallenen Zeit.

**Ursachenabgleich · 2026-09-10, 20:05 Uhr Ortszeit:** Auf Mikes Nachfrage
`pmset -g log` gelesen. Zwei spätere Lücken der Zelle `99` passen zu protokollierter
Systemruhe: `Idle Sleep` um 19:18:31, nach kurzem Wartungsaufwachen weiterer
Ruhezustand bis zum vollständigen Aufwachen um 19:33:33; nächster Heartbeat
19:33:58. Erneut `Idle Sleep` um 19:47:24, anschließend Wartungsruhe bis zum
Aufwachen um 20:03:37; nächster Heartbeat 20:04:00. Die langen Unterbrechungen
dieser beiden Durchläufe sind damit durch Rechner-Ruhezustand erklärt.
Das erklärt nicht automatisch jede frühere Verzögerung. Der Observer hatte
zuvor seinen Timer neu gestartet, ohne die verfügbaren Ruheprotokolle zu prüfen;
ein Timer-Neustart verhindert diesen Ruhezustand nicht. Keine Systemeinstellung
geändert und keine Ruhezustandssperre als bereits eingerichtet behauptet.

## Wiederverwendete Prüfhilfen vom Ticket-Lebenszyklus lösen

**Erkennung:** Ein Helfer liegt bei seinem Ursprungsticket, wird aber von
weiteren Tickets verwendet und erweitert. Das Archivieren des Ursprungstickets
kann dadurch aktuelle Startbefehle und Links der anderen Tickets entwerten.
Eine bereits eingetretene Ausführungspanne ist damit nicht behauptet.

**Belege · Codex-Arbeit, 2026-09-10:**

- T-40, Produktfassung `71a4ff8a5bba963134039a6840250800f13a4192`, erweitert
  den bei T-39 abgelegten StockInfo-Testserver für Detail-Fixtures und nutzt
  ihn in seinen eigenen Startbefehlen.
- T-38, Produktfassung `674b3705c07220c19613c5a88b1a02d3512d0699`, ergänzt
  denselben Helfer um FX-Szenarien. Auch dessen Anleitung verweist weiterhin
  auf die Ablage unter T-39. Mike bestätigt die gemeinsame Ablage und weitere
  Nutzung ausdrücklich. Die Nacharbeit ist im T-38-Ticket festgehalten.

**Implementer-Regel:** Sobald ein Prüfhelfer ticketübergreifend verwendet wird,
einen dauerhaften Projektort wie `scripts/` nutzen und alle aktuellen Aufrufer
gemeinsam nachziehen. Eine gepflegte Datei erhalten; keine Kopien je Ticket.
Eine bereits übergebene Prüffassung während ihres Reviews stabil lassen und
die Ablageänderung im nächsten zuständigen Arbeitsschritt nachweisen.

**Verifier-Prüfung:** Referenzen auf den alten Pfad vollständig inventarisieren.
Die weiterhin benötigten Szenarien vom neuen Ort aus starten und prüfen, dass
aktuelle Anleitungen keine Datei aus einem aktiven Ticketordner voraussetzen.
Historische Nachweise bleiben auf ihre damalige Fassung bezogen; eine reine
Verschiebung belegt keine zusätzliche fachliche Testabdeckung.

## Übernommene Startbasis · StockInfo

Kuratiert am 2026-09-10 aus StockInfo, Quellstand
`778e449296e92bb46c0b430d9f0f9365442bf4b6`, Dateien
`_tickets/.agents/CODEX-LESSONS.md` und `_tickets/.agents/CLAUDE-LESSONS.md`.
Die folgenden Belege stammen aus StockInfo, **nicht aus diesem Projekt**.
Die Quellenkennungen bleiben erhalten; Rollen und Zustände werden nicht übernommen.
Die Regeln sind selbstständig lesbar. Lokale Projektregeln und konkrete
Nutzeraufträge bestimmen ihren Geltungsbereich. Neue lokale Belege als solche
ergänzen, ohne die Herkunft der Startbasis umzuschreiben.

**Lokale Einordnung:** Die Startbasis ist auf StockPortfolio geprüft.
Testdatenzugriff bleibt bei injiziertem `fetch` und `fake-indexeddb` nach
AGENTS.md. StockInfos Online-Testpflichten, SQLite-Migrationen, HTTP-Betriebsregeln
und Rundenlimits wurden ausgelassen. Übernommen sind allgemeine Fehler bei
Umfang, Belegen, Zustandsübergängen und Zusammenarbeit. Bestehende Regeln zu
Entwicklungsstand, Inventar und Übergabe bleiben maßgeblich; die Quellbelege
begründen ihre Anwendung. Es entsteht keine weitere Abnahmestufe.

### SI-CX-01 · Frischer Zustand statt unbemerkter Testreste

**Erkennung:** Ein grüner Lauf verwendet einen Datenpfad oder Speicher, den
vorherige Läufe bereits vorbereitet haben.
**Implementer-Regel:** Bei Änderungen an Initialisierung oder Speicherung
auch den leeren Ausgangszustand mit den projektüblichen Testmitteln prüfen.
Vorbereitung und verbleibende Abhängigkeiten im Beleg nennen.
**Verifier-Prüfung:** Den betroffenen Einstieg mit nachweislich leerem
Testspeicher ausführen; erwarteten Startzustand und Ergebnis mit dem Beleg
vergleichen. Ein wiederverwendeter Pfad belegt keinen Frischstart.
**Quellbeleg:** StockInfo CX-01, T-26 Runde 1, `fe323ff`: gemeldet wurden
1065 erfolgreiche Tests; frisch ergaben sich 7 Fehler und 1058 Erfolge.
Ausdrücklich falsche Vollständigkeitsbehauptung. Die dortigen SQLite-Kommandos
und zusätzlichen Abnahmeregeln gehören nicht zur Übernahme.

### SI-R-02 · Aufwand braucht einen tatsächlich betroffenen Verbraucher

**Erkennung:** Hypothetische Verbreitung begründet Migrationen, Übergangstexte
oder zusätzliche Abnahmearbeit.
**Implementer-Regel:** Den tatsächlichen Betriebsstand aus den Projektregeln
verwenden. Zusatzaufwand einem konkreten Nutzer, Datenbestand oder beauftragten
Verbraucher zuordnen; ohne Bedarf den vereinbarten Umfang fertigstellen.
**Verifier-Prüfung:** Für den geforderten Zusatz den belegten Schaden nennen.
Die Veröffentlichung allein beweist weder breite Nutzung noch Migrationsbedarf.
**Quellbeleg:** StockInfo R-02, T-21 `1166745`, `f0fb8c8`, Korrektur
`4bacaf2`; ausdrückliche Nutzerlehre zum Entwicklungsstand. Keine zusätzlich
erfundenen Vorfälle. Die Regel ist an den tatsächlichen Zielbetrieb anzupassen.

### SI-T-66 und SI-P-09 · Auch eine übernommene Schlussfolgerung prüfen

**Erkennung:** Ein sachlich richtiger Reviewbefund wird ungeprüft zur
Architekturvorgabe; oder der Reviewer verbessert ein unbeauftragtes Subsystem.
**Implementer-Regel:** Bei Reviewübernahme Befund, tatsächliche Wirkung und
verhältnismäßige Korrektur getrennt prüfen. Die Zustimmung eines Reviewers
erweitert den Nutzerauftrag nicht.
**Verifier-Prüfung:** Die Wirkung über den tatsächlichen Aufrufweg belegen
und den Lösungsumfang am Auftrag messen. Siehe die vollständigen Regeln
SI-R-01 und SI-P-09 in [Claude-Lessons](CLAUDE-LESSONS.md).
**Quellbelege zur Codex-Mitverantwortung:** StockInfo T-66, voreilige
Übernahme `26590c8`, Korrektur `e4b793e`, bestätigt `e5e0b20`, ausdrücklich
beauftragte Einzelfall-Lehre. Außerdem P-09/T-27b: Codex billigte den Ausbau
über drei Reviews bis zu Mikes Korrektur (`ebf8a14`, `8698aa0`). Das sind die
jeweils gleichen Ereignisse wie in der Claude-Sammlung, keine Doppelbelege.
