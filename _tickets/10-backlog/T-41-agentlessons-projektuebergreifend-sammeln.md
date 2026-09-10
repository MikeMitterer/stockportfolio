# T-41 · AgentLessons: Projekterfahrungen sammeln und in prüfbare Regeln überführen

Lessons entstehen in mehreren Projekten unabhängig voneinander. Bisher fehlt
sowohl eine gemeinsame Übersicht als auch ein verlässlicher Nachweis, welche
Erkenntnis bereits in eine vorbeugende Arbeitsregel eingeflossen ist. Neue
Projekte sollen vorhandenes Wissen nutzen, ohne die Repositories ihrer
Vorgänger lesen oder deren Lessons in eigene Quelldateien kopieren zu müssen.

**Beispiel:** StockInfo und StockPortfolio halten unterschiedliche Erfahrungen
mit Negativtests fest. Die zentrale Sammlung erhält beide Fassungen samt
Entstehungskontext. Eine daraus abgeleitete Regel verweist auf die ausgewerteten
Lessons. Ändert sich eine davon, wird der Zusammenhang zur erneuten Prüfung
markiert; keine lokale Erfahrung wird automatisch überschrieben.

**Stand:** Konzept am 2026-09-10 im Observer-Chat besprochen. Mike hat den Namen
`AgentLessons` und den separaten Ablageort im Bereich `DevKI/Production/`
bestätigt. Der Zielordner ist vorhanden und noch leer. Einzeldateien,
Aggregation und zentrale Regelableitung sind noch nicht umgesetzt.
Das Vorhaben ist als eines der nächsten eigenständigen Teilprojekte vorgemerkt;
seine konkrete Aktivierung und Reihenfolge stehen noch aus.

Dieses Ticket erfasst den Auftrag vorerst im vorhandenen Board. Bei Aufnahme
in ein eigenes AgentLessons-Board das Ticket samt Nachweisen dorthin übergeben
und hier nur einen Verweis erhalten; keine zwei fortgeschriebenen Ticketkopien.

## Für dich

Aktuell ist keine zusätzliche Entscheidung nötig. Der nächste Schritt ist die
Einplanung des Teilprojekts. Bei der späteren Abnahme soll nachvollziehbar sein,
welche Projekt-Lessons vorliegen, welche Regeln daraus entstanden sind und
welche Änderungen erneut bewertet werden müssen.

Festgehaltene Rückmeldungen aus dem Observer-Chat, 2026-09-10:

- „Die Lessons entwickeln sich unabhängig voneinander“.
- „Stockinfo hat seine Lessons, StockPortfolio auch - agregiert werden sie
  in einem anderen Folder.“
- „AgentLessons - passt“.
- „Abgesehen davon macht es einen Unterschied ob eine Lesson während der
  Entwicklung entstanden ist oder während der Verify-Session“.
- „wenn es verweise innerhalb der Files auf andere Files in AgentLessons gibt
  - dann nur relative. Verwende keine Absoluten Pfadnamen“.

## Konzept und Grenzen

### Gepflegte Quellen und erzeugte Sammlung

Jede Lesson bekommt eine eigene Markdown-Datei unter
`_tickets/.agents/lessons/` ihres Herkunftsprojekts. Die Observer bearbeiten
nur ihre dafür freigegebenen lokalen Quellen. StockInfo-Lessons bleiben in
StockInfo, StockPortfolio-Lessons in StockPortfolio. Die gemeinsame Sammlung
liegt im eigenständigen Projekt `AgentLessons`:

```text
AgentLessons/
├── projects.yaml          # registrierte Projektquellen
├── collected/             # durch Aggregation erzeugt
│   ├── stockinfo/
│   └── stockportfolio/
├── shared/                # kuratierte Regeln mit Quellenbezügen
└── INDEX.md               # erzeugte Übersicht und Auswertungsstand
```

`collected/` und `INDEX.md` werden nicht von Hand gepflegt. `shared/` enthält
bewusst abgeleitete, projektübergreifende Regeln; Einsammeln allein macht aus
einer lokalen Erfahrung noch keine allgemeine Vorgabe. Der Ticket-Skill
beschreibt Verfahren, Format und Zugriff; der Wissensbestand liegt separat
in AgentLessons. Implementer und Verifier berücksichtigen die gemeinsame
Basis sowie die einschlägigen Lessons ihres aktuellen Projekts.

Die vorhandenen Sammeldateien können als erzeugte Einstiege nach Autorenschaft
weiterverwendet werden. Gepflegt werden die Einzeldateien; keine zweite
manuell bearbeitete Fassung derselben Erkenntnis.

### Kontext einer Lesson

Eine Lesson enthält eine stabile Kennung, Herkunft und Belege, Geltungsbereich,
Fehlererkennung, vorbeugende Implementer-Regel und Verifier-Gegenprobe.
Kennungen und Metadatenfelder sind englisch, die Erklärungen deutsch.
Zusätzlich müssen diese Angaben getrennt erkennbar sein:

| Angabe | Zweck |
|---|---|
| Entdeckungsphase | Entwicklung, Verifikation oder Beobachtung unterscheiden. |
| Betroffene Arbeit | Produktimplementierung, Tests, Review oder Übergabe benennen. |
| Autorenschaft der betroffenen Arbeit | Den untersuchten Stand zuordnen; nicht aus dem aktuellen Owner ableiten. |
| Entdecker und Erfasser | Festhalten, wer den Befund erkannt beziehungsweise dokumentiert hat. |
| Zuständige Rollen für die Vorbeugung | Konkrete Handlungen für Implementer und/oder Verifier zuordnen. |

Ein im Review entdeckter mangelhafter Negativtest betrifft die Testimplementierung.
Eine unverhältnismäßige Blockerbewertung betrifft dagegen das Review selbst.
Die Entdeckungsphase entscheidet deshalb nicht allein über die zuständige Rolle.
Unklare Autorenschaft bleibt ausdrücklich ungeklärt. Für die Aufnahme gelten
weiterhin die [Belegregeln](../.agents/AGENT-WORKFLOW.md#belegte-erfahrungen).

### Ableitung und Anwendung einer Regel nachweisen

Eine Regel unter `shared/` hat eine stabile Kennung und verweist auf ihre
Quell-Lessons samt **ausgewertetem Inhaltsstand**, etwa per Hash. Die Zuordnung
benennt, welche Erkenntnis abgedeckt ist und welcher Rest gegebenenfalls offen
bleibt. Eine Lesson kann mehrere Regeln begründen, eine Regel mehrere Lessons.

Diese Beziehungen werden zentral gepflegt. Das Skript erzeugt daraus die
Rückverweise im Index; kein unabhängig gepflegtes `processed: true` in jeder
Projektdatei. Folgende Zustände müssen unterscheidbar sein:

| Anzeige | Aussage |
|---|---|
| Offen | Eine Auswertung ist noch nicht nachgewiesen. |
| Teilweise abgedeckt | Regeln decken einen benannten Teil ab; ein benannter Rest bleibt offen. |
| Abgedeckt | Die aktuelle Fassung wurde inhaltlich bewertet und den betreffenden Regeln zugeordnet. |
| Erneut prüfen | Die Lesson wurde seit der dokumentierten Auswertung verändert. |
| Bleibt lokal | Bewusste Entscheidung gegen eine allgemeine Regel, mit Begründung. |

Fehlende Zuordnung beweist nicht, dass historisch nie eine Regel abgeleitet
wurde. Bestehende Regeln bei der Erstaufnahme gegenprüfen und verknüpfen.
Das Skript erkennt neue oder geänderte Inhalte; ein Agent bewertet Bedeutung,
Abdeckung und Geltungsbereich. Textähnlichkeit allein beweist keine Ableitung.

**Abgeleitet und im Ablauf verankert bleiben getrennt.** Zur Regel den
Wirkungsort beziehungsweise den verbindlichen Lesekanal festhalten, zum
Beispiel einen Workflow-Abschnitt. Eine Datei in `shared/` allein belegt noch
keine Einführung oder tatsächliche Einhaltung. Den Prüfbeleg liefert weiterhin
die zuständige Arbeitsinstanz im jeweiligen Ticket.

### Skript und KI erzeugen die gemeinsamen Lessons zusammen

Der periodische Ablauf umfasst ausdrücklich auch die KI-Auswertung. Ein
reiner Dateisammler erfüllt den Auftrag nicht. Dafür einen konfigurierten
Aufruf vorhandener Agentenwerkzeuge verwenden; keine zweite Agentenlaufzeit
oder eigene allgemeine Orchestrierungsplattform bauen.

1. Das Skript sammelt die Projekt-Lessons, erkennt neue beziehungsweise
   geänderte Inhalte und stellt nur noch nicht ausgewertete Fassungen bereit.
2. Die KI vergleicht sie mit vorhandenen gemeinsamen Lessons und Regeln.
   Sie ergänzt eine passende Regel oder erstellt einen belegten Vorschlag
   unter `shared/`. Herkunft, ausgewertete Fassung, Geltungsbereich,
   Implementer-Handlung und Verifier-Gegenprobe gehören in das Ergebnis.
   Widersprüche und bewusst lokale Erkenntnisse bleiben ausdrücklich sichtbar.
3. Der im AgentLessons-Auftrag zuständige Verifier prüft die Ableitung gegen
   die Quellen. Erst die fachlich geprüfte Fassung wird zur Übernahme angeboten;
   Entwurf und verwendbare Fassung bleiben unterscheidbar. Dazu ist keine
   zusätzliche pauschale menschliche Freigabe je Lesson vorgesehen.
4. Das Skript aktualisiert die Quellenzuordnung und den Index. Ohne neue
   Eingaben oder offenen Prüfauftrag startet es keine wiederholte KI-Auswertung.
   Scheitert der KI-Aufruf oder die Prüfung, bleibt die Auswertung offen;
   vorhandene geprüfte Fassungen bleiben erhalten.

Gemeinsame Lessons enthalten die verallgemeinerte Erkenntnis und ihre
konkreten Regeln. Die KI kann einen passenden Guard vorschlagen, also eine
automatisierte Prüfung, die eine Wiederholung erkennen soll. Die tatsächliche
Implementierung dieses Guards erfolgt im jeweiligen Zielprojekt.

### Rückführung in laufende Projekte

Die Einbindung ist Teil des Auftrags und gilt auch für bestehende Boards.
Ein einmaliger Export der gemeinsamen Lessons genügt nicht.

- **Fester Lesekanal:** Der lokale Workflow verpflichtet Coder vor Umsetzung
  und Verifier vor Review, den gemeinsamen Index sowie die für ihre Rolle
  und ihr Projekt einschlägigen Regeln zu prüfen. Eine relative Referenz oder
  relative Konfiguration verbindet das Board mit AgentLessons.
- **Laufende Erkennung:** Der Observer beachtet zusätzlich Änderungen am
  gemeinsamen Index. Neue oder veränderte einschlägige Regeln werden als
  noch zu bewertende Übernahme sichtbar, auch wenn das Projekt bereits läuft.
- **Lokale Einordnung:** Die zuständige Arbeitsinstanz prüft, ob die Regel
  passt, lokal angepasst werden muss, bereits erfüllt ist oder nicht zutrifft.
  Lokale Erfahrung und konkrete Projektvorgaben bleiben maßgeblich.
- **Umsetzung:** Der Implementer verankert die angenommene Regel am richtigen
  Ort: als Workflow-Schritt, Projektvorgabe, Lint-Regel oder konkreter Test.
  Ein automatisierter Guard entsteht nur, wenn das Fehlermuster sinnvoll
  maschinell prüfbar ist. Bestehende passende Prüfungen wiederverwenden.
  Zum aktiven Auftrag passende Maßnahmen dort behandeln; zusätzlicher
  Produktumfang braucht einen eigenen eingeplanten Auftrag.
- **Gegenprüfung:** Der Verifier prüft die tatsächliche Verankerung und den
  Nachweis. Bei einem neuen Guard muss eine gezielt falsche Fassung fehlschlagen
  und die richtige bestehen. Eine reine Lesebestätigung reicht nicht.

Jedes Projekt hält diese Entscheidungen in
`_tickets/.agents/rule-adoptions.yaml` fest. Pro gemeinsamer Regel sind Kennung,
bewertete gemeinsame Fassung, lokale Entscheidung und Begründung sowie relative
Verweise auf Wirkungsort und Ticketbelege erforderlich. Ein vorhandener Guard
wird verknüpft; er muss nicht kopiert oder erneut implementiert werden.
Regel und Nachweis müssen denselben geprüften Produktstand betreffen.

Das Sammelskript liest diese Übernahmenachweise ebenfalls ein. Der zentrale
Index kann damit getrennt zeigen: **Regel abgeleitet**, **im Projekt bewertet**,
**lokal verankert und geprüft** beziehungsweise **noch offen**. Eine neue
gemeinsame Fassung macht die bisherige lokale Übernahme sichtbar prüfbedürftig,
überschreibt aber weder lokale Entscheidungen noch Produktdateien.

Eine während eines offenen Reviews eintreffende Regeländerung wird kenntlich
gemacht, ohne die übergebene Produktfassung oder Prüfbasis still zu verändern.
Ein konkreter neuer Fehlerhinweis wird regulär eingeordnet; zusätzliche
Umsetzung folgt erst im zuständigen Arbeitsschritt. Ist AgentLessons nicht
erreichbar, den fehlenden Abgleich benennen und keine Aktualität behaupten.
Bereits lokal verankerte Regeln gelten weiter.

**Beispiel:** Eine gemeinsame Lesson verlangt, dass ein Prüfskript nach einem
frühen Fehler keinen Erfolg meldet. Der Coder prüft das vorhandene lokale
Skript und ergänzt bei Bedarf eine Gegenprobe mit absichtlichem Startfehler.
Der Verifier bestätigt Fehlerstatus und Abschlussmeldung. Die lokale
Übernahme verknüpft gemeinsame Regel, Skript, Gegenprobe und Ticketfassung.
Ein anderes Projekt, dessen vorhandener Test-Runner das bereits nachweislich
erfüllt, verknüpft diesen Nachweis und benötigt keinen zusätzlichen Guard.

### Periodische Aggregation ohne Überschreiben lokaler Erfahrungen

Das Skript liest ausschließlich registrierte Projektquellen, sammelt neue und
geänderte Lessons und aktualisiert den zentralen Index. Wiederholte Läufe mit
denselben Eingaben liefern denselben fachlichen Bestand. Unterschiedliche
Projektfassungen derselben Lesson bleiben mit Herkunft und Inhaltsstand
unterscheidbar; keine Entscheidung nach dem jüngsten Datum.

Identische Inhalte dürfen in der Übersicht zusammengefasst werden, solange
alle Herkünfte erhalten bleiben. Ähnliche oder widersprüchliche Erkenntnisse
werden zur inhaltlichen Einordnung vorgelegt. Unterschiedliche Anforderungen
können unterschiedliche Regeln rechtfertigen. Die Aggregation schreibt keine
Regeln oder Änderungen zurück in die Quellprojekte und aktiviert keine Arbeit.

Vorgesehen sind ein manueller Aufruf und ein periodischer Lauf. Ein täglicher
Takt ist ein Vorschlag, noch kein gestarteter Job. Die tatsächliche Einrichtung
muss den verwendeten Mechanismus, letzte erfolgreiche Verarbeitung und Fehler
sichtbar machen. Lokale erzeugte Einstiege sollen nach Lessons-Änderungen
aktualisiert werden. Ein fehlendes Quellprojekt darf nicht unbemerkt als leerer
Bestand gelten oder bereits gesammeltes Wissen löschen.

### Ausschließlich relative Dateiverweise

Innerhalb von AgentLessons sind alle Dateiverweise relativ zum jeweiligen
Dokument beziehungsweise zur ausdrücklich benannten Konfigurationsbasis.
Das gilt auch für generierte Dateien, Quellenbezüge, Regelzuordnungen und
Beispiele. Keine fest eingebauten Benutzerverzeichnisse, Volumes oder anderen
absoluten Dateipfade. Absolute Pfade auch nicht indirekt als Datei-URLs ablegen.

Beispiele: Vom Index auf `shared/R-012-fresh-state.md`, aus dieser Regel auf
`../collected/stockinfo/L-026.md`. Projektpfade in `projects.yaml` werden relativ
zu dieser Datei aufgelöst, unabhängig vom Aufrufverzeichnis. Der zentrale
Katalog bleibt ohne Zugriff auf die ursprünglichen Projekte lesbar; deren
Unerreichbarkeit wird beim nächsten Sammellauf separat ausgewiesen.

### Tokenverbrauch begrenzen und Qualität nachweisen

Die Auswertung erfolgt schrittweise auf Änderungen. Unveränderte Quellen,
Regeln und Prüfentscheidungen werden wiederverwendet. Tokenersparnis darf
weder Quellbelege verdecken noch eine ausgelassene Prüfung als erledigt markieren.

| Maßnahme | Einsparung | Erhalt der Aussagekraft |
|---|---|---|
| Inhalte und Abhängigkeiten per Hash vergleichen | Keine erneute KI-Auswertung ohne relevante Änderung | Geänderte Quellen, Regeln oder Auswertungsvorgaben machen die betroffenen Ergebnisse prüfbedürftig; erzeugte Zeitstempel lösen keinen fachlichen Neulauf aus. |
| Formale Prüfungen im Skript ausführen | IDs, Pflichtfelder, Links und identische Inhalte benötigen keine KI | Fehlerhafte Eingaben sichtbar zurückweisen; gleiche Kennung mit anderem Inhalt als Variante erhalten. |
| Kleinen Suchindex aus Kennungen, Thema, Rollen, Geltungsbereich und Quellenbeziehungen verwenden | Nur passende bestehende Regeln als Vergleichskontext laden | Auswahl dokumentieren; neue Themen zulassen und bei unklarem Treffer weitere Originalbelege nachladen. Fehlender Suchtreffer beweist keine fachliche Neuheit. |
| Zusammengehörige Änderungen gebündelt auswerten | Gemeinsame Anweisungen und Vergleichsregeln nur einmal übertragen | Jede Quellfassung bleibt einzeln zugeordnet; widersprüchliche Belege und ihre Geltungsbereiche erhalten. |
| Knappe strukturierte Ergebnisse verlangen | Weniger wiederholte Quellenwiedergabe und Erklärungstext | Entscheidung, Quellenstand, konkrete Regel, Abdeckung und offene Unsicherheit bleiben Pflicht. |
| Bereits geprüfte Ergebnisse wiederverwenden | Keine erneute unabhängige Prüfung unveränderter Regeln | Neue oder inhaltlich geänderte Regeln weiterhin unabhängig prüfen; Verifier erhält Originalbelege, nicht nur die Zusammenfassung des Autors. |
| Gemeinsame Regeln im Zielprojekt gezielt lesen | Keine vollständige Sammlung bei jedem Scheduler-Takt laden | Indexänderungen und lokale Übernahmen vergleichen; vor dem Arbeitsschritt einschlägige Regeln tatsächlich kennen. Nach Kontextverlust diese erneut lesen. |

Der Scheduler prüft Änderungen zunächst mit Skriptmitteln. KI-Arbeit entsteht
bei einem relevanten neuen Inhalt oder einem offenen fachlichen Auftrag;
ein Timer-Tick allein rechtfertigt keine vollständige Auswertung. Der Index
ist eine Auswahlhilfe, kein Ersatz für die zur Entscheidung nötigen Belege.
Wird für eine zuverlässige Einordnung mehr Kontext benötigt, wird er gezielt
nachgeladen und der Verbrauch als Teil dieses Falls erfasst.

Budgetgrenzen für einzelne Auswertungen und den gesamten Lauf konfigurierbar
machen. Konkrete Werte anhand repräsentativer Fälle festlegen; noch ist kein
Tokenbudget beschlossen. Bei Erreichen einer Grenze verbleibende Arbeit offen
lassen und sichtbar zur Fortsetzung vormerken. Quellen nicht still abschneiden,
keine unbegrenzten Wiederholungsaufrufe starten und keine vollständige
Abdeckung behaupten, wenn Teile nicht verarbeitet wurden.

Die Wirkung mit einem kleinen, versionierten Bestand erwarteter Ergebnisse
prüfen: echte Dublette, ähnliche Lesson mit anderem Geltungsbereich,
widersprüchliche Projektfassungen, bislang unbekanntes Thema, geänderte
bereits abgedeckte Lesson sowie unterschiedliche Entwicklungs-/Reviewkontexte.
Prüfen, ob relevante Erkenntnisse erhalten bleiben, Zusammenführungen stimmen
und Rollen beziehungsweise Guards richtig zugeordnet sind. Eine ausführlichere
KI-Antwort ist dabei nicht automatisch die korrekte Referenz.

Für dieselben Prüffälle die Zahl der KI-Aufrufe, Ein-/Ausgabetokens und den
Anteil wiederverwendeter Ergebnisse vor und nach der Optimierung erfassen,
soweit die Laufzeit diese Werte liefert. Schätzungen ausdrücklich kennzeichnen.
Qualität anhand der erwarteten Ergebnisse und Originalbelege vergleichen,
nicht anhand der Textlänge. Die Messung benötigt eine einfache Laufübersicht;
der Prüfbestand wird nur bei neuen Fehlerklassen gezielt erweitert.

### Übernahme des vorhandenen Bestands und Ticket-Skill

Die bisherige Zwischenlösung enthält externe Start-Lessons in den lokalen
Sammeldateien und in Skill-Vorlagen. Bei der Umstellung lokale Originalbelege,
übernommene Quellbelege und allgemein abgeleitete Regeln auseinanderhalten.
Nichts als neuen lokalen Vorfall ausgeben. Bereits hinzugefügte lokale
Erfahrungen, insbesondere spätere Änderungen, erhalten.

Der Auftrag umfasst den Abgleich des Skills `task-verification-workflow`
einschließlich Einrichtung, Lessons-Referenz, Vorlagen und Rollenpflichten.
Der bisherige Ansatz einer vollständig im Skill liegenden Wissenssammlung
wird durch dieses separate AgentLessons-Konzept abgelöst, sobald es umgesetzt
ist. Keine unveränderten alten und neuen Pflichten nebeneinander stehen lassen.
Die nötigen Anpassungen in den Quellprojekten bei Aktivierung ausdrücklich
zuordnen; dieses Planungsticket allein ändert dort weder Dateien noch Rollen.

## Umsetzung und technische Nachweise

| Repo / Ziel | Budget | Umfang | GH-Issue |
|---|---|---|---|
| AgentLessons; Anpassungen an Ticket-Skill und eingebundenen Boards | nicht beziffert | Eigenständiges Teilprojekt für Wissenstransfer und Regelableitung | — |

### Verify

Eine aktuelle technische Matrix. Alle Punkte sind Zielprüfungen der späteren
Umsetzung; bisher keine Implementierung, kein gestarteter Aggregationsjob.

Legende: ✅ bestätigt · ⚠️ mit Einschränkung · ◑ teilweise · ➖ nicht verifiziert.

| # | Handgriff | Erwarteter Nachweis | AI |
|---|---|---|:--:|
| 1 | Zwei getrennte Testprojekte mit eigenen Einzel-Lessons registrieren und einsammeln | Beide Quellen erscheinen zentral mit richtiger Herkunft; Quelldateien bleiben unverändert | ➖ |
| 2 | Eine Lesson nur in Projekt A verändern und erneut aggregieren | A wird aktualisiert; die eigenständige Fassung aus B bleibt erhalten | ➖ |
| 3 | Identische und widersprüchliche Fassungen derselben Kennung einsammeln | Alle Herkünfte erhalten; Varianten unterscheidbar; keine automatische inhaltliche Vorrangentscheidung | ➖ |
| 4 | Eine Lesson während Entwicklung, eine während Review erfassen; zusätzlich Implementierungsfehler im Review entdecken | Phase, betroffene Arbeit, Autorenschaft und vorbeugende Rollen bleiben getrennt und korrekt | ➖ |
| 5 | Eine Regel aus mehreren Lessons ableiten und eine Lesson mehreren Regeln zuordnen | Hin- und erzeugte Rückverweise stimmen überein; Abdeckung und Wirkungsort sind sichtbar | ➖ |
| 6 | Eine bereits ausgewertete Lesson ändern | Index zeigt erneut nötige Prüfung; die vorhandene Regel wird weder still gelöscht noch als aktuell bestätigt ausgegeben | ➖ |
| 7 | Teilabdeckung und bewusst lokale Erkenntnis erfassen | Benannter Rest beziehungsweise begründete lokale Einordnung bleiben sichtbar | ➖ |
| 8 | Sammlung samt Testprojektstruktur verschieben und aus anderem Arbeitsverzeichnis ausführen | Relative Verweise und Konfigurationspfade lösen korrekt auf; keine absoluten Dateipfade in Quellen oder erzeugten Ausgaben | ➖ |
| 9 | Unverändert erneut ausführen, eine Quelle unerreichbar machen und einen Lesefehler auslösen | Wiederholbarkeit; sichtbarer Fehler beziehungsweise veralteter Stand; kein Verlust vorhandener Erkenntnisse | ➖ |
| 10 | Periodischen Lauf tatsächlich starten, einen Folgelauf beobachten und wieder stoppen | Mechanismus und Laufbelege vorhanden; bloße Konfiguration wird nicht als laufender Betrieb ausgegeben | ➖ |
| 11 | Ein weiteres Projekt mit Zugriff nur auf AgentLessons einrichten | Gemeinsame Regeln und eigene lokale Lessons sind nutzbar, ohne StockInfo oder StockPortfolio lesen zu müssen | ➖ |
| 12 | Vorhandene Lessons und Skill-Regeln auf die neue Struktur überführen | Belege und lokale Ergänzungen erhalten; Regeln, Vorlagen und Anleitungen beschreiben denselben realen Stand | ➖ |
| 13 | Neue Lessons periodisch einsammeln, KI-Ableitung und fachliche Prüfung ausführen; danach unverändert wiederholen | Belegte neue oder ergänzte gemeinsame Regel; Entwurf und geprüfte Fassung getrennt; kein weiterer KI-Aufruf ohne neuen Anlass | ➖ |
| 14 | KI-Aufruf oder fachliche Prüfung scheitern lassen | Offener Auswertungsstand und Fehler sichtbar; keine ungeprüfte Regel als verwendbar ausgeben; letzte geprüfte Fassung erhalten | ➖ |
| 15 | Gemeinsame Regel ändern, während zwei Zielprojekte bereits laufen | Observer beziehungsweise nächster Coder-/Verifier-Einstieg erkennt die Änderung; beide Projekte bewerten sie unabhängig; keine stille Produktänderung | ➖ |
| 16 | Angenommene Regel in einem Projekt durch einen Guard verankern, im anderen einen vorhandenen Nachweis zuordnen | Falsche Fassung scheitert am Guard; richtige besteht; lokale Übernahmen und zentraler Index weisen Wirkungsort, gemeinsame Fassung und Prüfbeleg korrekt aus | ➖ |
| 17 | Regeländerung während eines Reviews sowie fehlende Erreichbarkeit von AgentLessons nachstellen | Übergabefassung bleibt stabil; offene Übernahme beziehungsweise fehlender Abgleich sichtbar; keine behauptete Aktualität | ➖ |
| 18 | Gleichen Bestand zweimal verarbeiten, danach eine Quelle oder eine Auswertungsvorgabe ändern | Unveränderter Lauf ohne KI-Aufruf; Wiederverwendung nur bei gültigen Abhängigkeiten; gezielte erneute Verarbeitung betroffener Ergebnisse | ➖ |
| 19 | Begrenzten Vergleichskontext und gebündelte Auswertung am festen Prüffallbestand bewerten | Relevante Quellen, Konflikte, Rollen und erwartete Entscheidungen bleiben erhalten; nachgeladener Kontext und tatsächlicher Tokenverbrauch ausgewiesen | ➖ |
| 20 | Auswertungsbudget ausschöpfen und im Zielprojekt den Agentenkontext verlieren | Restarbeit bleibt offen statt fälschlich abgedeckt; nach Kontextverlust werden einschlägige Regeln erneut gelesen, ohne unveränderte zentrale Ableitungen neu zu erzeugen | ➖ |

### Side-Effects

Die spätere Umsetzung betrifft den Lessons-Zugriff und die Pflegeprozesse der
beteiligten Projekte. Sie ändert keine fachlichen Produktfunktionen und
übernimmt keine fremden Rollen, Ticketphasen oder Freigaben. Der konkrete
Dateiumfang und die Autorisierung je betroffenem Repository werden beim
Arbeitsbeginn festgehalten.

**Doku-Abgleich dieser Erfassung:** Das Board-README verlinkt dieses geplante
Teilprojekt. Die Produktanleitungen benötigen keine Anpassung, weil sich
kein App-Verhalten ändert. Die Aktualisierung von Agentenregeln und Ticket-Skill
ist als Bestandteil der späteren Umsetzung ausdrücklich erfasst.

### Auflösung

Offen. Dieses Ticket dokumentiert das gewünschte Teilprojekt; technische
Freigabe und menschliche Abschlussabnahme liegen noch nicht vor.
