# Erfahrungen aus Claude-Arbeit · StockPortfolio

Die Sammlung betrifft die Autorenschaft untersuchter Arbeit, keine feste
Rolle. Aufnahme und Verwendung regelt der
[Workflow](AGENT-WORKFLOW.md#belegte-erfahrungen).

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

### SI-P-01 und SI-P-10 · Nur die tatsächlich geprüfte Tiefe behaupten

**Erkennung:** Der Beleg verspricht eine vollständige Kette, während ein
Test ihren Kern ersetzt oder vor der behaupteten Grenze zurückkehrt.
Auch ein einzelner korrekt gelesener Pfad belegt keine Aussage über die
gesamte Datenhaltung: Ein Lesefilter beweist etwa keinen Erhalt beim Schreiben.
**Implementer-Regel:** Tatsächlich durchlaufene Komponenten, Testdoubles und
Aussagegrenzen benennen. Die Eingabe muss den behaupteten Pfad erreichen.
Bei neuen Zustandswechseln Lese- und Schreibpfad einschließlich Speicherkennung
und Überschreibverhalten gemeinsam berücksichtigen.
**Verifier-Prüfung:** Vom Testeinstieg bis zum relevanten Ergebnis verfolgen,
welcher eigene Code wirklich lief und was ersetzt wurde. Synthetische Daten
nicht als historische Echtdaten, injizierte Antworten nicht als Netzabruf ausgeben.
Für behaupteten Datenerhalt vor und nach einem Wechsel auch den gespeicherten
Bestand prüfen, einschließlich Rückwechsel und gleicher Zeitkennung.
**Quellbelege:** P-01/T-17 Runde 1 `84c9c2d`: der eigene Resolver war ersetzt,
obwohl nur HTTP-Mocking behauptet wurde; T-21 Teil 1 `fce1bab`: synthetischer
Altbestand als historische Daten bezeichnet. P-10/T-23 `e6ca003`: EUR→EUR
kehrte vor dem behaupteten Providerkontakt zurück. Zielprojektgerecht:
Integration kann bewusst mit injizierten Antworten geprüft werden; daraus
folgt keine Pflicht zu echten Netzaufrufen.

**Zusätzlicher lokaler Beleg · StockPortfolio, 2026-09-10:** Claude erklärt in
[T-38, Review Runde 1](../30-doing/T-38-basiswaehrung-und-devisenkurse.md#review-runde-1--verifier-claude--2026-09-10)
zur Produktfassung `674b3705c07220c19613c5a88b1a02d3512d0699`, die Tageswerte
blieben beim nun gewünschten Währungswechsel automatisch erhalten und der
Verlauf brauche keine Anpassung. Als Begründung dient der Währungsfilter in
`useValueHistoryStore.load`. Der Schreibpfad `ValueSnapshotRepository.put`
verwendet jedoch nur `portfolioId::date` als Schlüssel. Ein USD-Tageswert
ersetzt damit einen EUR-Tageswert desselben Depots und Tages; der Lesefilter
kann den überschriebenen Wert nicht erhalten. Dies ist eine am Quellstand
belegte Einschränkung der Reviewaussage, kein behaupteter ausgeführter
Browsertest oder beobachteter Verlust echter Nutzerdaten. Gegenprobe für die
Nacharbeit: EUR → USD → EUR am selben Tag, jeweils speichern und den
persistierten Bestand prüfen. Die ursprüngliche Umsetzung sperrte diesen
Wechsel noch; der Beleg betrifft die Vollständigkeitsbehauptung im Review,
nicht einen Verstoß gegen den vorherigen Coder-Auftrag.

### SI-P-02 und SI-P-12 · Eine vollständige Korrektur braucht ein Inventar

**Erkennung:** Beispiele werden korrigiert, weitere Wege oder Fundstellen
bleiben übrig; eine gekürzte Suchausgabe wird zur angeblich vollständigen Liste.
**Implementer-Regel:** Den von der Regel betroffenen Bestand vollständig
erheben, auch Tests, Nebenpfade und Dokumentation. Nicht nur Reviewbeispiele
abarbeiten. Für sprachliche Bezeichner vorhandene Compiler-Inventare nutzen.
**Verifier-Prüfung:** Inventar, Anzahl und behandelte Pfade vergleichen.
Abgeschnittene Ausgaben als unvollständig kennzeichnen und vor einer
Vollständigkeitsbehauptung vervollständigen.
**Quellbelege:** P-02/T-17 `84c9c2d`: zwei Namen korrigiert, weitere deutsche
Bezeichner und alte Dokumentation blieben; T-24 Teil 2 `d792ce9`: Currency im
Cachepfad übersehen. P-12/T-21 Runde 1, Prüfgegenstand `1166745`: Claude als
Verifier listete nach gekürzter Ausgabe 11 statt 18 Dateien. Autorenschaft
betrifft hier den Reviewtext; sie erteilt keinem Verifier Produktedit-Rechte.

### SI-P-03 · Nur eigene Testressourcen aufräumen

**Erkennung:** Ein Prüfwerkzeug beendet alles auf einem Port oder verwendet
unbemerkt einen fremden, bereits laufenden Dienst.
**Implementer-Regel:** Eigene Prozesse und temporäre Verzeichnisse pro Lauf
festhalten; bei belegtem Port den Start abbrechen und den Konflikt melden.
Einen anderen Port vor einem neuen Start ausdrücklich konfigurieren. Nur die
selbst gestarteten Ressourcen beenden.
**Verifier-Prüfung:** Start, Gesundheitsprüfung und Cleanup demselben eigenen
Prozess zuordnen. Eine fremde Portbelegung darf weder als eigener Prüflauf
zählen noch einen fremden Prozess beenden.
**Quellbeleg:** P-03/T-17 Runde 1 `84c9c2d`: Smoke-Skript räumte pauschal
Port 8766 und konnte den falschen Dienst prüfen. Übernommene Quelllehre mit
einem dokumentierten Anlass; keine Wiederholung im Zielprojekt behauptet.

### SI-P-04 und SI-P-08 · Die Gegenprobe muss richtig und falsch unterscheiden

**Erkennung:** Ein Negativtest trägt nur einen Fehlernamen; Erwartung und
Produktcode teilen dieselbe Berechnung oder die Eingabe verdeckt den Fehler.
**Implementer-Regel:** Eine tatsächlich regelwidrige Eingabe und ein unabhängig
bestimmtes Ergebnis verwenden. Eine Sortierprobe braucht unterscheidbare
Elemente; leere Daten belegen keine vollständige Verarbeitung.
**Verifier-Prüfung:** Prüfen, ob der konkret vermutete Fehler den Test rot
machen würde; bei Zweifel eine kleine isolierte Gegenprobe ausführen. Den
erwarteten Unterschied nennen, keine allgemeine Mutationssuite daraus ableiten.
**Quellbelege:** P-04/T-24 Teil 1 `403020b`: angeblich abweichende Kennungen
waren gleich; T-21 Teil 1 Runde 2 `48cdaf9`: leerer Bestand bestand sechs
Prüfungen. P-08/T-22: Umordnung nur mit einer einelementigen Liste geprüft.

### SI-P-05 · Ein abgebrochener Lauf ist kein Erfolg

**Erkennung:** Ein Skript zählt nur bisherige Erfolge, unterdrückt Fehlerausgabe
oder meldet Erfolg trotz ausgelassener Prüfungen.
**Implementer-Regel:** Fehlerstatus weiterreichen und geplante gegen tatsächlich
ausgeführte Fälle abgleichen. Startfehler und Abbrüche sichtbar als solche melden.
**Verifier-Prüfung:** Bei betroffener Prüflogik einen frühen Fehler auslösen;
Exit-Code und Abschlussmeldung müssen einen unvollständigen Lauf anzeigen.
**Quellbelege:** P-05/T-21 Teil 2b, 2026-08-23: Abbruch nach 4 von 9 Prüfungen
als fehlerfrei gemeldet; T-22 Runde 1 `20af8fa`: Serverstart scheiterte,
die nachfolgende Erfolgsmeldung berücksichtigte die fehlende Prüfung nicht.

### SI-P-06 und SI-P-11 · Erst einen fertigen Stand übergeben, dann stabil halten

**Erkennung:** Die Mailbox behauptet eine Übergabe vor dem fertigen Commit;
danach verändert sich der Produktstand ohne verarbeitete Reviewrückgabe.
**Implementer-Regel:** Die lokale Übergabereihenfolge im Workflow befolgen.
Commit, Ticketbelege und übergebener Umfang müssen denselben Stand beschreiben;
nach der Übergabe die geprüfte Produktfassung stabil halten.
**Verifier-Prüfung:** Übergabereferenz auflösen und Belege sowie spätere
Produktänderungen damit abgleichen. Kommunikationscommits gemäß lokalem
Workflow einordnen, keine fremde Commit- oder Rundenregel übernehmen.
**Quellbelege:** P-06/T-21: nach `6abce88` folgte `556c23d`, nach `2583c7a`
folgte `89e003a` während offener Übergaben. P-11/T-31 Runde 6: Übergabe
`5b3c406` schon gemeldet, bevor der Produktstand nach `6635c0e` fertig war.

### SI-P-07 · Zwischenzustände ausdrücklich benennen

**Erkennung:** Neue asynchrone Abläufe erzeugen Flag-Kombinationen, in denen
etwas als bereit erscheint, obwohl ein vorausgesetzter Schritt noch läuft.
**Implementer-Regel:** Die tatsächlich möglichen Zustände und erlaubten
Übergänge benennen; während ausstehender Operationen keine Bereitschaft
ableiten, die noch nicht hergestellt ist.
**Verifier-Prüfung:** Den Ablauf an der betroffenen Zwischenstelle anhalten,
zum Beispiel mit kontrolliert aufgelösten Promises, und sichtbaren Zustand
sowie erlaubte Folgeaktionen vor Erfolg und nach Fehler prüfen.
**Quellbelege:** P-07/T-21 Teil 2A: Runde 30 Freigabe vor Migration; Runde 32
`21865c0`: hängender Start erschien bereits bereit. Backend-Endpunkte und
Migrationsregeln werden nicht übernommen; hier geht es um Zustandsübergänge.

### SI-P-09 · Einfache Anforderungen nicht zum Subsystem ausbauen

**Erkennung:** Eine Prüfanforderung wächst zu eigener Laufzeit, CLI, Parsern
oder umfangreicher dauerhafter Testinfrastruktur ohne entsprechenden Auftrag.
**Implementer-Regel:** Die kleinste vollständige Lösung mit vorhandenen
Projektmitteln bauen. Zusätzliche Mechanik braucht einen konkreten Bedarf.
**Verifier-Prüfung:** Vor Detailverbesserungen den Gesamtumfang am Nutzerziel
prüfen. Technische Stimmigkeit legitimiert keine unbeauftragte Grundannahme.
**Quellbeleg:** P-09/T-27b, `a1ac605` bis `af72b5a`: vier Testkit-Module mit
Record/Replay und weiterer Infrastruktur; ausdrückliche Nutzerkorrektur,
verworfen in `ebf8a14`, Neufassung `8698aa0`. Codex' Review-Mitverantwortung
steht in seiner Sammlung. Die damalige Forderung nach echten Online-Tests
wird nicht übertragen; die Testgrenzen bestimmt das Zielprojekt.

### SI-R-01 · Befund und Gewichtung getrennt belegen

**Erkennung:** Eine richtige technische Einzelbeobachtung begründet einen
Architekturwechsel, ohne dass ihre behauptete Wirkung nachgewiesen wurde.
**Implementer-Regel:** Befund, erreichbaren Aufrufweg, Nutzerauswirkung und
mögliche Korrektur getrennt beschreiben; Alternativen an gleichen Kriterien messen.
**Verifier-Prüfung:** Den tatsächlich benutzten Weg bis zur Wirkung verfolgen
und prüfen, ob ein begrenzter Integrationsschritt den Befund bereits löst.
**Quellbeleg:** R-01/T-66 `eb628f9`, Review `a2193e7`: fehlende
HTTP-Middleware wurde als Transportveto gewichtet, obwohl die Datenänderungen
weiter über geschütztes REST liefen. Korrektur `e4b793e`, bestätigt `e5e0b20`.
Ausdrücklich beauftragte Einzelfall-Lehre, keine erfundene Wiederholungsserie.

### SI-Leitplanken · Bei wiederholter Nacharbeit den Zuschnitt prüfen

**Erkennung:** Spezifikation und Review wachsen, ohne dass ein kleiner
nutzbarer Durchlauf oder ein neuer Erkenntnisgewinn entsteht.
**Implementer-Regel:** Eine ausführbare, fachlich zusammenhängende Teilstrecke
früh belegen. Technische Fragen selbst untersuchen; nur echte Nutzerentscheidungen
vorlegen. Entscheidungen in allen aktuellen Zusagen nachziehen.
**Verifier-Prüfung:** Bei wiederkehrender Nacharbeit die gemeinsame Ursache
und den Fortschritt prüfen, statt dieselbe unklare Anforderung weiter
aufzuteilen. Ticketüberschneidungen und tatsächliche Wirkung benennen.
**Quellbelege:** Abschnitt „Leitplanken für das spätere Skill-Proposal“:
StockInfo T-21 Teil 3, Runden 8–24 mit 936-zeiliger Spezifikation; weiterer
Vertragsumfang über 52 Runden trotz sehr schmaler ausführbarer Grundlage.
Die Beobachtung wird übernommen, feste Rundenlimits oder zusätzliche
Abnahmestufen werden daraus nicht abgeleitet.
