# T-61 · Private Depotdaten über die StockPortfolio-API speichern

Ein Benutzerkonto allein macht ein Depot noch nicht auf anderen Browsern
verfügbar. **Der StockPortfolio-Server wird zur maßgeblichen Datenquelle** für
Depots und Einstellungen. Jeder angemeldete Nutzer sieht nur seine Daten;
StockInfo liefert unverändert ausschließlich Marktdaten.

**Beispiel:** Eine Person ergänzt im Büro eine Position und öffnet später
StockPortfolio zu Hause. Nach der Anmeldung steht die Position dort, ohne
Dateiexport. Eine zweite Person mit eigenem Konto sieht sie nicht.

**Stand am 2026-09-28:** Die App schreibt Portfolios, Einstellungen,
Instrumentauswahl und Tageswerte direkt in IndexedDB. Das bestehende Backup
enthält nur das aktive Depot. T-60 schafft Server und Konten; dieses Ticket
ist danach an der Reihe. Produktcode für diese Aufgabe ist noch nicht geändert.

**Stand am 2026-09-30:** Nach Claudes technischer Runde 3 ist die
kontoübergreifende ID-Sperre entfernt; die Nachprüfung dieser Korrektur steht
aus. Der Stand vom 2026-09-28 beschreibt den Ausgangspunkt.

**Mikes Präzisierung vom 2026-09-28:** Der Datenaustausch mit dem eigenen Server
muss sicher und verständlich bedienbar sein. Für vorhandene Browserdepots
braucht es den unten beschriebenen ausdrücklichen Übernahmeweg. Nutzer müssen
ihre Daten weiterhin selbst exportieren und per Restore wiederherstellen können.
Diese Prüfung gehört zunächst zu T-61; ein Folgeticket braucht einen konkret
abgrenzbaren Rest und soll die Kette nicht unnötig erweitern.

**Für dich:** Jetzt ist kein Handgriff nötig. Für die spätere Abnahme braucht
es einen Test mit zwei Browsern und zwei getrennten Testkonten.

## Für dich

### Nach der technischen Übergabe

Der Coder stellt eine isolierte Testinstanz und zwei Testkonten bereit und
dokumentiert URL und Zugang sicher außerhalb des Tickets. Keine echten
Depots in der Testinstanz verwenden.

| Frage | Prüfpunkt # | Handgriff | Dein Urteil | Human |
|---|---|---|---|---|
| A · Gerätewechsel | [1](#pruefpunkt-1) | Mit demselben Testkonto in zwei Browsern anmelden, Depot ändern und im zweiten Browser neu öffnen | Ist derselbe Stand sichtbar? | |
| B · Privatsphäre | [2](#pruefpunkt-2) | Zweites Testkonto im selben Browser anmelden und eine fremde Depot-ID direkt aufrufen | Sind fremde Depots unsichtbar? | |
| C · Altbestand | [3](#pruefpunkt-3) | Mit eigens angelegtem lokalem Testdepot am ersten Browser anmelden und die einmalige Übernahme ausführen | Ist die Zuordnung zum richtigen Konto verständlich und sicher? | |
| D · Backup/Restore | [5](#pruefpunkt-5) | Im Testkonto A ein Depot exportieren und wiederherstellen, dann zu Testkonto B wechseln | Hat nur A den wiederhergestellten Stand, während B unverändert bleibt? | |

## Umsetzung und technische Nachweise

| Repo | Umfang | GH-Issue |
|---|---|---|
| StockPortfolio | Benutzergebundene REST-Datenhaltung, Browserumstellung, Altbestand und Dokumentation | — |

### Schnitt und Abhängigkeiten

1. T-60 liefert angemeldete Sitzungen und die persistente Datenbank. Der
   Server speichert je Konto alle Depots, Positionen, Zielwerte,
   Instrumentauswahlen, allgemeinen Einstellungen und gemessenen Tageswerte.
   Kurs-, FX- und Kursverlaufscaches bleiben abrufbare Browser-Caches und
   werden nicht zu privaten Stammdaten erklärt.
2. Jede REST-Route leitet die Benutzerkennung aus der geprüften Sitzung ab.
   Angegebene Depot-IDs werden zusätzlich gegen diesen Besitzer geprüft.
   Daten lesen, ändern und löschen benötigen jeweils diese Prüfung.
3. Änderungen erhalten serverseitige Revisionen. Ein veralteter Schreibstand
   wird mit Konfliktantwort abgelehnt und in der App verständlich gezeigt;
   es gibt kein stilles Überschreiben. Aktualisieren oder bewusstes erneutes
   Bearbeiten ist möglich. Schreibvorgänge sind atomar.
4. Beim Start lädt die App den Serverstand. Ein nicht erreichbarer Server
   verhindert Depotänderungen und wird sichtbar erklärt. Lokale IndexedDB ist
   nicht mehr die maßgebliche Quelle für private Daten.
5. Vorhandene Browserdepots können **einmalig und ausdrücklich** durch das
   serverseitig markierte Setup-Konto übernommen werden. Die App zeigt Quelle, Ziel und
   Wirkung vorher an. Ein leerer neuer Browser lädt den Serverstand und
   überschreibt ihn nicht. Unterschiedliche Altbestände verschiedener Browser
   werden niemals automatisch zusammengeführt. Ein dauerhafter
   Übernahmemarker wird mit den importierten Depots in derselben Transaktion
   gespeichert. Ein zweiter pauschaler Importversuch für dasselbe Konto,
   auch aus einem anderen Browser, erhält `409` und schreibt nichts.
6. Nach Logout oder Kontowechsel bleiben keine nach T-61 entstandenen privaten
   Daten des vorigen Nutzers in der App oder einem geteilten Browsercache zugänglich.
   Lokale Kurs-, FX- und Verlaufscaches sowie private Pinia-Zustände werden
   bereinigt. Der noch besitzerlose Altbestand bleibt bis zur Übernahme oder zum
   ausdrücklichen Verwerfen im Browserprofil erhalten. Der
   bestehende Backup-/Restore-Weg arbeitet mit den serverseitigen Daten des
   angemeldeten Kontos; der Export bleibt ein Depot pro Datei.
7. T-62 übernimmt die zeitnahe Benachrichtigung geöffneter Browser. Dieses
   Ticket liefert verlässliches Laden beim Öffnen und erneuten Laden, noch
   keinen Live-Abgleich.

### Akzeptanzkriterien

- [ ] Gleicher Nutzer sieht auf zwei Browsern dieselben Depots und Einstellungen
  nach Neuladen; verschiedene Nutzer sehen getrennte Daten.
- [ ] Ein Konto kann fremde Depotdaten weder lesen, ändern noch löschen,
  auch bei direktem API-Aufruf. Dieselbe Depot-ID darf in zwei Konten
  vorkommen; jeder Zugriff bleibt auf das eigene Konto begrenzt.
- [ ] Veraltete Revisionen führen zu sichtbarem Konflikt statt Datenverlust.
- [ ] Nur das Setup-Konto sieht und importiert den Altbestand nach ausdrücklicher
  Bestätigung; weitere Konten sehen weder Daten noch Metadaten. Der Import
  überschreibt keine bestehenden Serverdaten.
- [ ] Offline, Logout und Kontowechsel zeigen keinen fremden oder scheinbar
  gespeicherten privaten Stand.
- [ ] Backup, Restore, Löschen und Tageswerte funktionieren je Benutzerkonto;
  StockInfo-Client und Marktdatenvertrag bleiben unabhängig.

### Verify

Isolierte Datenbank, zwei Testkonten und zwei Browserkontexte. Direkte
Negativaufrufe gegen alle privaten REST-Routen. Kein Test ruft echte StockInfo
auf oder verwendet echte Browserdepots.

Legende: ✅ live bestätigt · ⚠️ mit Einschränkung · ◑ teilweise ·
➖ noch kein Live-Nachweis. `AI` wird erst nach der Prüfung gesetzt.

| # | Handgriff | Nachweis | AI |
|---|---|---|:--:|
| 1 | <a id="pruefpunkt-1"></a>Im Browser A speichern, Browser B mit demselben Konto neu laden | Depot, Einstellungen, Auswahl und Tageswerte stimmen überein | ◑ |
| 2 | <a id="pruefpunkt-2"></a>Mit Konto B dieselbe ID wie in A lesen, schreiben, löschen und ein Backup wiederherstellen | Vor dem eigenen Anlegen `404` beim Lesen; spätere Änderungen betreffen nur B. Derselbe Restore gelingt in A und B | ✅ |
| 3 | <a id="pruefpunkt-3"></a>Altbestand mit Setup- und zweitem Admin-Konto, leeren zweiten Browser und zweiten Importversuch durchspielen | Nur Setup-Konto sieht die Vorschau; fremder Import `403`; bestätigter Erstimport schreibt; leerer Browser überschreibt nichts; zweiter Versuch `409`. Nach gesetztem Marker Export je altem Depot statt Pauschalimport | ◑ |
| 4 | Zwei gleichzeitige Bearbeitungen und Serverausfall auslösen | Konflikt und Offline-Zustand sichtbar; keine stille Überschreibung | ◑ |
| 5 | <a id="pruefpunkt-5"></a>Vor und nach dem Altimport abmelden, Konto wechseln, lokale Speicher und Caches, Backup und Restore prüfen | Besitzerloser Altbestand übersteht Logout vor Import; danach entfernt. Keine neuen privaten Browserkopien des vorigen Kontos; Restore schreibt nur ins angemeldete Konto. Deaktiviertes Setup-Konto kann von anderem Admin reaktiviert werden | ◑ |
| 6 | `make test`, `npm --prefix frontend run lint`, `npm --prefix api run lint`, `npm --prefix frontend run typecheck`, `npm --prefix api run typecheck`, Build, Browser- und Doku-Abgleich | Ergebnisse und mögliche Bestandsfehler sind konkret dokumentiert | ✅ |

### Doku-Abgleich

`README.md` (**Where the data lives**, **Several portfolios**, **Setup**,
**Docker**), `docker/README.md` (**Data and backups**, **Configuration**),
`unraid/README.md` (**Data, API and verification**) und die zentrale
Unraid-Vorlage auf serverseitige Daten, Volume, Backup, Altbestand und
Offline-Grenze prüfen. Beide READMEs gemeinsam abgleichen. `AGENTS.md` muss
den neuen Speicherort und die weiterhin getrennte StockInfo-Verantwortung
zutreffend beschreiben. Keine Änderung an Board-/Lessons-Konventionen; der
zentrale Ticket-Skill braucht dafür keinen Nachtrag.

### Side-Effects

Browserdaten werden beim Übergang nicht automatisch zu Serverdaten. Wer die
Übernahme auslässt, sieht zunächst seinen serverseitigen Stand. Die
StockPortfolio-Datenbank im Volume braucht eine eigene Sicherung; ein Backup
des Docker-Images reicht nicht. Ein gemeinsam genutzter Browser benötigt
saubere Abmeldung und Trennung der lokalen Caches.

Die verbindlichen Entscheidungen zu Übernahmemarker und Cache-Bereinigung
stehen in der [T-60-Architekturspezifikation](../../docs/superpowers/specs/2026-09-29-stockportfolio-server-design.md#verbindliche-grenzen-für-t-61-und-t-62).
Die Konzeptprüfung unten dokumentiert den älteren offenen Stand; für T-61
liegt noch kein Produktnachweis vor.

## Konzeptprüfung Runde 1

`claude`, 2026-09-28, an Handoff-Commit `6a33e6fb72a27cb46edcaa82361004b9b0854b9e`.
Teil derselben Kettenprüfung wie
[T-60](T-60-stockportfolio-server-und-benutzerkonten.md#konzeptprüfung-runde-1);
dort auch Zuschnitt/Reihenfolge und der Architekturwechsel gegen AGENTS.md
eingeordnet. Kein Produktcode vorhanden, keine technische Freigabe.

**REST-Revisionen/Konflikte:** Klar entschieden — serverseitige Revision,
Ablehnung veralteter Schreibstände mit sichtbarem Konflikt statt stillem
Überschreiben, atomare Schreibvorgänge. Kein Befund.

**Datenschutz zwischen Benutzern:** Eigentümerprüfung auf jeder Route
einschließlich angegebener Depot-IDs, mit expliziten Negativtests (403/404)
in der Verify-Matrix. Kein Befund.

**Datenschutz im selben Browser — offene Entscheidung:** Punkt 6 verlangt,
dass nach Logout/Kontowechsel „keine privaten Daten des vorigen Nutzers…
zugänglich“ bleiben; die Side-Effects benennen „saubere Abmeldung und
Trennung der lokalen Caches“ als nötig, ohne zu entscheiden, *was* das
konkret umfasst. Die App hält private Daten heute in IndexedDB. Ob dieser
Speicher beim Logout/Kontowechsel aktiv geleert wird oder nur die
Oberfläche keine fremden Daten mehr zeigt — während Rohdaten im
Browser-Speicher verbleiben und über Entwicklertools einsehbar wären — ist
nicht festgelegt. Für ein gemeinsam genutztes Gerät ist das ein reales
Datenschutzrisiko und sollte in der Spezifikation konkret entschieden werden.

**Altbestandsübernahme:** Einmalig, ausdrücklich, mit Vorschau von
Quelle/Ziel/Wirkung, kein automatisches Zusammenführen unterschiedlicher
Altbestände — gut spezifiziert und mit eigenem menschlichem Prüfpunkt (C)
versehen. **Offene Frage:** Ist die Übernahme gegen Mehrfachausführung
abgesichert (zweiter Browser mit eigenem Altbestand, oder ein versehentlicher
zweiter Übernahmeversuch am selben Browser)? Das Ticket entscheidet nur den
Fall „ein Altbestand, eine Übernahme“; ein Schutz gegen doppelte oder
duplizierte Depots bei mehrfacher Übernahme ist nicht benannt.

Befunde zu T-62 und das Gesamturteil über die Kette stehen dort.

## Ergänzung zur Observer-Anfrage · Export/Restore-Zusage

Der Observer fragt an, ob die in diesem Ticket genannten Zusagen zu
Altbestand, Backup und Restore einschließlich Benutzerprüfung tatsächlich
abnehmbar sind (Mikes Präzisierung oben: sicherer, verständlicher
Datenaustausch, weiterhin eigener Export und Restore der Nutzer).

Inhaltlich ist das eindeutig entschieden: Export bleibt ein Depot pro Datei,
Restore schreibt nur ins angemeldete Konto (Akzeptanzkriterien, Punkt 6).
Technisch ist das über Verify #5 abgedeckt. **Es fehlt aber ein eigener
menschlicher Prüfpunkt dafür** — die Tabelle „Für dich“ kennt nur A
(Gerätewechsel), B (Privatsphäre) und C (Altbestand), keinen für
Backup/Restore, obwohl Mike diesen Punkt ausdrücklich als wichtig benennt.

**Empfehlung:** einen vierten Prüfpunkt D · Backup/Restore in der Tabelle
„Für dich“ ergänzen — Handgriff: Export im angemeldeten Konto ziehen,
abmelden beziehungsweise Konto wechseln, mit dem Export-File wiederherstellen
und prüfen, dass nur das eigene Konto betroffen ist. Kein zusätzliches
Folgeticket nötig; die Ergänzung passt in den bestehenden Umfang dieses
Tickets und hält den Zuschnitt der Kette eng, wie vom Observer gewünscht.

**Coder-Nacharbeit · 2026-09-28:** Prüfpunkt D ist oben ergänzt und auf Verify
#5 bezogen. Die Empfehlung der Konzeptprüfung ist damit im Ticket enthalten;
der Produktnachweis und Mikes Urteil bleiben offen.

## Vormerkung für Claudes Prüfung · 2026-09-30

Bei Mikes gemeinsamer T-60/T-63-Abnahme wurde der heutige Zwischenstand
sichtbar: Die Depotdaten liegen in der IndexedDB des Browserprofils. Ein
normales Konto sieht nach dem ersten Passwortwechsel „Depotzugriff folgt“;
alle Admin-Konten im selben Browserprofil können derzeit denselben lokalen
Bestand öffnen. Die T-60-Architekturspezifikation sagt dagegen „nur der erste
Admin“. Mike möchte die Mehradmin-Regel erst bei T-61 von Claude beurteilen
lassen. Dort sind kontogebundene Depotdaten, Altbestandsübernahme und die
Trennung lokaler Caches ohnehin Teil des Auftrags. Bis zu dieser Prüfung
bleibt das laufende T-60-Verhalten unverändert; hier wird keine Umsetzung
oder vorgezogene technische Freigabe für T-61 behauptet.

## Aktivierung · 2026-09-30

Mike hat den Beginn von T-61 und anschließend T-62 nach den Abnahmekorrekturen
ohne weiteren Warteschritt beauftragt. T-61 läuft auf
`t-61-benutzergebundene-depotdaten-per-rest`, abgezweigt vom technisch
freigegebenen T-60/T-63-Stand. T-60 und T-63 bleiben bis zu Mikes ausdrücklicher
T-63-Abschlussentscheidung in `30-doing/`; kein gemeinsamer Merge oder Push.
Die Mehradmin-Frage oben wird vor der betroffenen Produktentscheidung in die
Claude-Prüfung gegeben. Produktnachweise für T-61 stehen noch aus.

## Entscheidungsvorlage · mehrere Admin-Konten · 2026-09-30

**Vorschlag des Coders:** Nach T-61 besitzt jedes Konto, auch ein weiteres
Admin-Konto, einen eigenen privaten Serverbestand. Die Rolle `admin` erlaubt
zusätzlich die Kontenverwaltung, aber keinen Zugriff auf fremde Depots. Ein
neues Admin-Konto beginnt daher mit einem leeren Depot. Das folgt der
Besitzerprüfung aus Kriterium 2 und vermeidet eine versteckte gemeinsame
Admin-Datenhaltung.

**Altbestand:** Der bisherige Browserbestand hat keine Besitzerkennung.
Vor einer Übernahme darf er nicht automatisch irgendeinem angemeldeten Konto
gezeigt oder zugeordnet werden. Die Übernahme braucht eine ausdrücklich
angezeigte Quelle und ein Zielkonto; nach Bestätigung wird die lokale private
Kopie bereinigt. Für einen weiteren Admin ohne Altbestandsberechtigung bleibt
der Serverstand leer. Wie die Berechtigung zur einmaligen Vorschau im bisher
gemeinsam genutzten Browser sicher bestimmt wird, gehört zur Entscheidung.

**An Claude:** Mike hat die Mehradmin-Frage für T-61 ausdrücklich an dich
verwiesen. Bitte den vorgeschlagenen privaten Stand je Admin gegen T-60/T-61,
den heutigen IndexedDB-Zustand und die Übernahmegrenze beurteilen. Nenne eine
konkrete Regel für die Sichtbarkeit der Altbestandsvorschau vor der ersten
Übernahme. Dies ist eine konzeptionelle Prüfung vor T-61-Produktcode; die
vollständige technische Prüfung folgt nach der Umsetzung.

## Übergabe an Claude · Konzept Runde 2 · 2026-09-30

Prüffassung ist `44bcb72`. Bitte ausschließlich die Mehradmin-Regel und die
sichere Sichtbarkeit des lokalen Altbestands aus der Entscheidungsvorlage
beurteilen. Mikes Frage wurde ausdrücklich auf T-61 verschoben; ein
Produktstand für T-61 ist noch nicht entstanden. Nach deiner Antwort setzt
Codex die REST-Datenhaltung um und übergibt später den Produktstand zur
unabhängigen technischen Prüfung. Der Basisstand bestand mit 806 Frontend-
und 8 API-Tests.

## Konzeptprüfung Runde 2 · mehrere Admin-Konten

`claude`, 2026-09-30, an Handoff-Commit `44bcb726f851fae53d40184d5956e42ce5527518`.
Ich beurteile ausschließlich die Mehradmin-Regel und die Sichtbarkeit des
lokalen Altbestands. Grundlage sind dieses Ticket, die T-60-Spezifikation
(„Verbindliche Grenzen für T-61 und T-62“), das Schema `api/src/persistence/schema.ts`
und die heutige Freigabelogik in `frontend/src/auth/AuthRoot.vue`. Einen
Produktstand gibt es noch nicht.

**Privater Bestand je Konto, auch für Admins: zugestimmt.** Die Rolle `admin`
erlaubt die Kontenverwaltung, aber keinen Zugriff auf fremde Depots. Das folgt
direkt aus Kriterium 2 (Besitzerprüfung auf jeder Route). Eine gemeinsame
Admin-Datenhaltung wäre eine zweite, versteckte Zugriffsregel neben dieser
Prüfung. Ein neues Admin-Konto beginnt deshalb leer. Die heutige
T-60-Übergangsregel, nach der jeder Admin im selben Browser den lokalen
Bestand sieht, endet mit T-61.

**Regel für den Altbestand.** Die Vorlage lässt offen, wer den Altbestand
sehen darf. Außerdem steht sie in Konflikt mit Punkt 6: Wird beim Logout
alles Private in IndexedDB gelöscht, geht ein noch nicht übernommener
Altbestand verloren, sobald sich jemand vor der Übernahme abmeldet. Deshalb
gilt verbindlich:

1. **Berechtigt ist nur das Setup-Konto.** Der Altbestand entstand, bevor es
   Konten gab. Die einzige nachweisbare Verbindung zu ihm hat das Konto, das
   bei der Einrichtung dieser Instanz angelegt wurde. Das wird **auf dem
   Server festgehalten**: ein eigenes Feld, gesetzt in derselben Transaktion
   wie `setup()`. Heute fehlt ein solches Feld, das Schema kennt nur `role`
   und `createdAt`. Weder „ältestes Admin-Konto“ noch eine Entscheidung im
   Browser genügen. Die Sitzungsantwort meldet dem Client, ob das Konto
   berechtigt ist und ob sein Übernahmemarker schon gesetzt ist.
2. **Vorschau nur für das berechtigte Konto.** Nur diesem Konto liest die App
   den Altbestand und zeigt Quelle, Ziel und Wirkung. Alle anderen Konten
   sehen weder Inhalt noch Namen, Anzahl oder Werte. Sie sehen also weder
   einen Hinweis noch eine leere Vorschau; ihr Serverbestand ist einfach leer.
3. **Der Server prüft die Berechtigung erneut.** Der Import-Endpunkt nimmt nur
   Anfragen des Setup-Kontos an; andere Konten erhalten `403`, ein gesetzter
   Marker `409`, jeweils ohne Schreibzugriff. Eine versteckte Vorschau
   ersetzt diese Prüfung nicht (wie T-60, Kriterium 5).
4. **Der Altbestand ist kein privater Kontobestand im Sinne von Punkt 6.** Die
   Bereinigung bei Logout und Kontowechsel löscht nur Daten, die die App nach
   T-61 unter einem Konto anlegt: Serverkopien, Kurs-, FX- und
   Verlaufscaches, Pinia. Der besitzerlose Altbestand bleibt unverändert
   liegen, bis das berechtigte Konto ihn übernimmt oder ausdrücklich
   verwirft. Danach löscht die App ihn. Das ist keine neue Schwachstelle: Den
   Altbestand konnte bisher ohnehin jede Person mit Zugriff auf dieses
   Browserprofil lesen. In der Doku steht das als bekannte Grenze.
5. **Weitere Browser mit Altbestand.** Ist der Marker schon gesetzt, zeigt die
   Vorschau des berechtigten Kontos keinen zweiten Pauschalimport. Sie bietet
   stattdessen je Depot einen Dateiexport an. Diese Dateien laufen über den
   regulären Restore; so ist die Zusage „einzelne Depots später über Export
   und Restore“ aus der Spezifikation praktisch einlösbar. Ohne diesen
   Export käme man nach T-61 an einen zweiten lokalen Bestand nicht mehr
   heran.
6. **Grenzfall deaktiviertes Setup-Konto.** Dann übernimmt niemand, und der
   Altbestand bleibt unverändert. Der Weg zurück ist die Reaktivierung durch
   einen Admin. Die Berechtigung wird bewusst nicht an ein anderes Konto
   übertragen.

**Doku und Spezifikation:** Die T-60-Spezifikation sagt „nur der erste
Admin“; T-60 hat „jeder Admin“ umgesetzt. Beides ersetzt jetzt diese Regel.
Der Abschnitt „Verbindliche Grenzen für T-61 und T-62“ bekommt Punkt 1 bis 6.
Die READMEs bekommen die Grenzen aus Punkt 4 und 6.

**Prüfpunkte für den späteren technischen Review** (ergänzen Verify #3 und #5):
Ein zweites Admin-Konto sieht im selben Browser keinen Altbestand, und
`POST` auf den Import-Endpunkt liefert `403`. Logout des Setup-Kontos vor
der Übernahme lässt den Altbestand unverändert. Nach der Übernahme ist er
lokal entfernt. Bei gesetztem Marker gibt es einen Export je Depot und keinen
Pauschalimport.

**Urteil:** Das Konzept ist **freigegeben** mit der Regel in Punkt 1 bis 6.
Das ist keine technische Freigabe; ein Produktstand fehlt noch.

## Umsetzung und Eigenprüfung · 2026-09-30

Die Konto-API speichert Depots, Einstellungen, Instrumentauswahl und Tageswerte
je Benutzer in SQLite. Jede Route nimmt die Benutzerkennung aus der Sitzung;
Depot-IDs anderer Konten liefern bei Lesen, Schreiben und Löschen `404`.
Revisionen schützen Änderungen vor veralteten Schreibständen. Restore und
einmaliger Altimport laufen jeweils in einer Transaktion. Das Setup-Konto
und der Importmarker liegen dauerhaft in der Konto-Datenbank. Neue Konten,
auch weitere Admins, beginnen ohne Depotdaten.

Die App lädt private Daten über die Konto-API. Beim Abmelden werden private
Pinia-Zustände durch den anschließenden Neustart verworfen und Marktcaches
geleert. Besitzerloser IndexedDB-Altbestand bleibt bis Import oder bewusstem
Verwerfen im Browser. Nur das Setup-Konto bekommt dessen Vorschau; nach
gesetztem Marker stehen einzelne Dateiexporte statt eines zweiten
Pauschalimports bereit. Scheitert ein privater REST-Zugriff, verdeckt die App
den möglicherweise veralteten Depotstand und zeigt den Fehler.

| Prüffrage | Eigener Nachweis | Grenze |
|---|---|---|
| Gleiches Konto, zwei Browser | Isolierter Teststack mit zwei Browserkontexten und synthetischem Setup-Konto: ein angelegtes Beispieldepot erschien nach Neuladen im zweiten Browser. | Einstellungen, Auswahl und Tageswerte sind auf API-Ebene geprüft, nicht in beiden Browsern einzeln durchgeklickt. |
| Getrennte Konten | Synthetischer Normalnutzer sah ein leeres Dashboard, keinen Admin-Zugang und keinen zuvor im selben Browser gesetzten lokalen Altbestand. Direkte `GET`- und `PUT`-Aufrufe mit der fremden Depot-ID lieferten `404`. API-Tests decken zwei Admins sowie Lesen und Schreiben aller privaten Arten und fremdes Löschen ab. | Zweiter Admin wurde per API-Test geprüft, nicht als zusätzlicher Browserkontext. |
| Altbestand | Setup-Konto sah die Vorschau eines synthetischen IndexedDB-Depots; bestätigter Import schrieb es auf den Server und leerte den lokalen Bestand. Ein zweiter Browser desselben Kontos mit weiterem Altdepot zeigte nur den Dateiexport. API-Test: fremder Import `403`, zweiter Import `409`. | Der Abmeldeschritt vor dem Import ist durch die getrennte Datenbehandlung im Code und den IndexedDB-Test belegt, nicht im Browser durchgeklickt. |
| Konflikt, Offline und Restore | API-Tests zeigen `409` für veraltete Revision und atomaren Restore; der Client-Test prüft den Fehlerweg. Im Browser wurde die Fehleransicht mit einem simulierten Konfliktereignis kontrolliert. | Kein echter paralleler Browser-Schreibkonflikt ausgelöst. |

Der Browserlauf nutzte nur temporäre Testdaten. Der isolierte Stack wurde mit
`--stack --stop` beendet; eigene Prozesse und temporäre Kontodaten sind
entfernt. Keine echten StockInfo-Daten oder persönlichen Depots verwendet.

**Prüfbefehle nach dem letzten Produktcommit:** `make test` (69 Dateien,
809 Frontend-Tests; 4 Dateien, 13 API-Tests), Frontend- und API-Lint,
Frontend- und API-Typecheck, beide Builds und `git diff --check`: jeweils
Exit 0. Der Frontend-Build meldet weiterhin nur die bekannte Warnung für
einen Vendor-Chunk über 500 kB. Die Docker-Hub-README-Vorschau mit Größenlimit
bestand. Die Tests greifen weder auf echte StockInfo-Daten noch auf das Netz
zu.

**Doku-Abgleich:** `README.md` (**Where the data lives**, **Layout**, **Docker**),
`docker/README.md` (**Data and backups**), `unraid/README.md` (**Updating**,
**Data, API and verification**) und `AGENTS.md` (**StockPortfolio hängt an
StockInfo**, **Tatsächlicher Entwicklungsstand**) nennen dieselbe Trennung:
Marktdaten aus StockInfo, private Daten in der Konto-API, Altbestand nur beim
Setup-Konto. Die zentrale Unraid-Vorlage wurde im eigenen Templates-Repository
mit `5cb8440` angepasst und mit `xmllint --noout` geprüft; kein Push. Die
T-60-Spezifikation beschreibt die jetzt geltenden Grenzen für T-61/T-62.
Keine Board- oder Lessons-Konvention wurde geändert; der
`task-verification-workflow`-Skill braucht keine Anpassung.

**Lessons-Abgleich:** SP-CX-02 angewandt: aktuelle Ticketkriterien, STATUS,
beide READMEs, AGENTS und Unraid-Aussagen gegen die T-61-Entscheidung
abgeglichen. SP-CX-03: der laufende In-Context-Scheduler ist kein Beleg für
unterbrechungsfreie Beobachtung. Historische Konzept- und Reviewaussagen
bleiben auf ihre jeweilige Fassung bezogen.

## Übergabe an Claude · technische Runde 3 · 2026-09-30

Prüffassung ist `0ad4a6af2e259a90302042597a4116bd23c537d3`, aufgebaut auf
der technisch freigegebenen T-63-Fassung. Bitte T-61 vollständig gegen die
Konzeptfreigabe der Runde 2 und die Kriterien oben prüfen: Besitzergrenzen
auch zwischen zwei Admins, Revisionen, atomaren Altimport und Restore,
Browserzustand nach Kontowechsel, den Exportweg für einen zweiten Altbrowser
sowie die Doku. Die Eigenprüfung und ihre Grenzen stehen im Abschnitt zuvor.

Die T-60/T-63-Freigabe bleibt unberührt; Mike hält T-63 weiter in Abnahme.
Keine Integration und kein Push. Die zentrale Unraid-Vorlage liegt mit
`5cb8440` im getrennten Templates-Repository und ist noch nicht gepusht.

## Technische Prüfung Runde 3

`claude`, 2026-09-30, an Handoff-Commit `0ad4a6af2e259a90302042597a4116bd23c537d3`
(Diff seit `26b59ed`, 42 Dateien). Geprüft habe ich in einem eigenen,
abgetrennten Worktree auf genau dieser Fassung, gegen meine Konzeptregel aus
Runde 2 und die T-61-Kriterien. Gelesen: Codex-Lessons SP-CX-01, SP-CX-02 und
SP-CX-05 sowie meine Lessons SP-R-02 und SP-R-03.

| Prüfpunkt | Eigener Schritt | Ergebnis |
|---|---|---|
| Tests, Lint, Typen | `npm run test` für beide Pakete, beide Lints mit `--no-cache`, beide Typprüfungen, `git diff --check` | 69 / 809 Frontend- und 4 / 13 API-Tests grün, alles Exit 0 |
| Schema, Migration | `0001`/`0002` und `schema.ts` gelesen | `is_setup_account` und `legacy_imported` am Konto; `private_resources` mit PK (Besitzer, Art, ID) und `ON DELETE CASCADE`. Das Setup-Konto wird in derselben Transaktion wie `createFirstAdmin` markiert |
| Besitzerprüfung | Router und Repository gelesen; eigene Probe gegen das echte SQLite-Repository | Jede `/api/data`-Route nimmt den Besitzer aus der Sitzung. Die Herkunftsprüfung gilt für alle schreibenden `/api/*`-Routen, und `mustChangePassword` sperrt den Datenzugriff (403). Die Probe mit zwei Admins: `findResource` gibt `null`, fremdes `save` und `delete` geben `not_found` |
| Revisionen | Repository und `PrivateDataClient` gelesen | Depot und Einstellungen schreiben mit der zuletzt gelesenen Revision, bei veraltetem Stand kommt `409`. Auswahl und Tageswerte lesen vor dem Schreiben frisch (`update`) und ändern nur den eigenen Schlüssel. Schreiben je Ressource ist serialisiert. Löschen eines Depots entfernt Auswahl und Tageswerte in derselben Transaktion |
| Restore | Repository gelesen, Probe | Eine Transaktion mit Revisionsprüfung aller vier Teile und des ersetzten Depots. Eigener Restore liefert `done`. Befund 1 betrifft denselben Restore in einem zweiten Konto |
| Altbestand, Regeln 1–6 | Probe und eigener Browserdurchlauf (`playwright-core`, isolierter Stack mit synthetischen Konten, ein Browserprofil mit synthetischem IndexedDB-Depot „Altdepot-Probe“) | Normaler Nutzer: App ohne Vorschau, Import `403`. Zweiter Admin (per API angelegt, im selben Browserprofil): ohne Vorschau, Import `403`. Nach jeder Abmeldung, auch des Setup-Kontos nach „Später entscheiden“, ist der Altbestand weiter lokal vorhanden. Das Setup-Konto sieht Quelle, Ziel, Anzahl und Wirkung. Nach dem Import ist er lokal leer und auf dem Server; ein weiterer Import liefert `imported`/`409`. Export je Depot bei gesetztem Marker und die Reaktivierung sind im Code gelesen, nicht im Browser geklickt |
| Logout und Kontowechsel | `AuthRoot.logout`, `cache.ts`, Store-Lebenszyklus gelesen | Marktcaches werden geleert, der Datenclient abgemeldet, und das Neuladen verwirft Pinia. Vor der Anmeldung wird kein Store angelegt (`main.ts`, `AuthRoot`) |
| Offline und Konflikt | `App.vue` gelesen | Jeder fehlgeschlagene private Zugriff ersetzt die Ansicht durch eine Meldung mit „neu laden“; der veraltete Stand bleibt verdeckt. Einen echten parallelen Konflikt habe ich wie Codex nicht ausgelöst |
| Altbestands-Ansicht (SP-R-03) | Screenshot bei 1440 px neben dem Anmeldedialog | Dieselbe Karte, dasselbe Logo, dieselbe Titelgestaltung |
| Doku | `README.md`, `docker/README.md` und `unraid/README.md` zu Daten, Altbestand und bestehender Datenbank gelesen; Ticketbelege | Stimmen überein. Dass eine Kontodatenbank von vor der Markierung kein Setup-Konto hat, ist als Grenze mit Reset-Weg beschrieben; das ist nach `AGENTS.md` („Keine Migrationspfade“) zulässig |

**Befund (blockierend):**

1. **Dieselbe Backup-Datei lässt sich nicht in einem zweiten Konto
   wiederherstellen.** `restoreBackup`, `saveResource` (neues Depot) und
   `importLegacy` verlangen, dass eine Depot-ID über **alle** Konten eindeutig
   ist (`occupied`). Probe: Restore von Depot `p-1` in das Setup-Konto ergibt
   `done`; derselbe Restore in ein anderes Konto ergibt `not_found`. In der App
   ist das eine allgemeine Ablehnung ohne Erklärung. So scheitert etwa ein
   Depot, das Mike exportiert und einem weiteren Konto gibt, oder ein
   Altimport, dessen Depot schon ein anderes Konto per Restore hat (dort sogar
   mit `409` für den ganzen Import). Außerdem verrät die Antwort, dass ein
   anderes Konto diese ID besitzt. Nötig ist die Sperre nicht: Der
   Primärschlüssel gilt schon je Besitzer, und alle Abfragen filtern nach
   `owner_id`.
   **Erwartet:** Die drei kontoübergreifenden `occupied`-Prüfungen entfallen.
   Ein API-Test belegt denselben Restore in zwei Konten und dass A dabei
   unverändert bleibt.

**Hinweis, nicht blockierend:**

1. **Eine verwaiste Zustandsdatei hat meinen Start blockiert.** Beim Start
   aus dem Worktree lag `stockportfolio-test-server-8899.json` aus einem Lauf
   des Hauptverzeichnisses um 15:29 herum, zu einem nicht mehr laufenden
   Prozess. Das Skript des Hauptverzeichnisses hat sie mit `-t` als verwaist
   erkannt und entfernt. Aus einem anderen Pfad meldet das Skript nur „gehört
   nicht zu diesem Testserver“. Das betrifft T-63 und nicht diese Fassung.

**Nachtrag 2026-09-30 · Befund 2 auf Mikes Entscheidung:** Mike hat den
ursprünglichen Hinweis „stiller Rückfall auf IndexedDB“ als Befund eingestuft:
„Wenn ein potentieller Fehler erkannt wird muss er gelöst werden.“

2. **Die Repository-Fabriken fallen still auf IndexedDB zurück.**
   `createPortfolioRepository`, `createSettingsRepository`,
   `createAllowlistRepository` und `createValueSnapshotRepository` in
   `frontend/src/data/repository.ts` liefern die IndexedDB-Repositories, wenn
   `privateDataClient()` `null` ist. Die Stores wählen ihr Repository einmal
   beim Anlegen. Heute entsteht kein Store vor der Anmeldung, also greift der
   Rückfall nicht. Würde künftig vor dem Login ein Store angelegt, etwa auf der
   Anmeldeseite, schriebe er nach der Anmeldung alle Änderungen still in die
   Tabellen des besitzerlosen Altbestands. Die Folgen: Die Änderung fehlt auf
   anderen Geräten, erscheint später dem Setup-Konto als Altbestand zur
   Übernahme und bleibt nach dem Abmelden im Browser lesbar. Das widerspricht
   Kriterium 4 und den Regeln 2 und 4 aus Runde 2.
   **Erwartet:** Ohne aktiven Datenclient werfen die Fabriken einen Fehler
   statt zurückzufallen. Den Altbestand greift nur noch `db/legacy.ts`
   direkt an. Ein Test belegt, dass eine Fabrik ohne aktiven Datenclient
   wirft und mit aktivem Client das Server-Repository liefert. Sieben
   Testdateien in `frontend/tests` legen Stores ohne aktiven Datenclient an
   und laufen heute über genau diesen Rückfall. Sie brauchen einen
   ausdrücklichen Testaufbau, etwa einen `PrivateDataClient` mit injiziertem
   `fetch`. Der Rückfall darf nicht als Testhilfe im Produktcode bleiben.

**Urteil:** `changes_requested` für `0ad4a6a`. Außer den Befunden 1 und 2
ist die Konzeptregel aus Runde 2 vollständig und nachprüfbar umgesetzt. Die
Nachprüfung beschränkt sich auf beide Befunde und ihre Tests.

## Nacharbeit zu Runde 3 · 2026-09-30

Die drei globalen `occupied`-Abfragen in `saveResource`, `importLegacy` und
`restoreBackup` sind entfernt. Der Primärschlüssel
`(owner_id, kind, resource_id)` und die Besitzerfilter trennen identische
Depot-IDs. Ein zuerst roter API-Test belegt den gleichen Restore in zwei
Konten und eine anschließende Änderung nur in B. Der Altimport-Test belegt
dieselbe ID bei einem zweiten Admin ohne Eingriff in dessen Daten. Die frühere
Eigenprüfung mit `404` auf `PUT` bezog sich auf die Runde-3-Fassung: Jetzt
kann B unter dieser ID ein **eigenes** Depot anlegen; A bleibt unverändert.
Die aktuellen Kriterien oben sind entsprechend präzisiert.

Auf Mikes Frage zum Store-Weg wurden die Zugriffe inventarisiert. Der normale
Depotfluss ging bereits über die Pinia-Stores. Der atomare Backup-Restore aus
`BackupPanel` und der Altbestand aus `AuthRoot` griffen noch direkt auf den
Datenclient beziehungsweise IndexedDB zu. Diese Aktionen liegen jetzt in
`useBackupStore` und `useLegacyStore`; die Komponenten bedienen sie nur.
Die vier Repository-Fabriken in `frontend/src/data/repository.ts` werfen ohne
aktiven Datenclient immer einen Fehler. Es gibt auch im Testmodus keinen
Rückfall im Produktcode. `db/legacy.ts` liest den Altbestand ausdrücklich
für den Setup-Dialog. Die betroffenen Store- und Komponententests stellen
lokale Repositories einzeln per Vitest-Mock bereit. Ein eigener Test belegt
den Fehler aller vier Fabriken ohne Datenclient und einen REST-Aufruf mit
aktivem Client.

**Prüfung:** `make test` bestand mit 811 Frontend- und 14 API-Tests. Beide
Lints, beide Typechecks, beide Builds und `git diff --check` bestanden.
Der Frontend-Build meldet weiter den bereits bekannten großen Vendor-Chunk.
Der Datenweg wurde über Imports in `frontend/src/` geprüft: Komponenten und
Auth-Ansichten rufen private REST-Routen oder alte Repositories nicht mehr
direkt auf. Ein zusätzlicher Browserlauf fand für diese API- und
Strukturkorrektur nicht statt.

**Doku-Abgleich:** `README.md` (**Where the data lives**, **Layout**),
`docker/README.md` (**Data and backups**), `unraid/README.md` (**Data, API and
verification**) und `AGENTS.md` (**StockPortfolio hängt an StockInfo**)
beschreiben die Trennung nach Konto und den Datenweg über Stores und
Konto-API. Keine Datei verspricht global eindeutige Depot-IDs; daher ist
dort keine Textänderung nötig. Die Unraid-Vorlage beschreibt nur den
Speicherort; `5cb8440` bleibt gültig. Board- und Lessons-Konventionen sind
unberührt.

**Lessons-Abgleich:** SP-CX-02 auf aktuelle Kriterien und Doku angewandt;
Claudes Runde-3-Belege bleiben auf `0ad4a6a` bezogen. Der neue Store-Einstieg
vor der Anmeldung hält nur die Altbestandsvorschau und aktiviert keine
private Konto-Datenhaltung vor erfolgreicher Anmeldung.

## Übergabe an Claude · technische Runde 4 · 2026-09-30

Prüffassung ist `2880d1d69161412c1b36cb735862bc23e3ae451d` nach dem
Runde-3-Handoff `0ad4a6a`. Bitte die beiden blockierenden Befunde gezielt
nachprüfen: dieselbe Depot-ID und dieselbe Backup-Datei in zwei Konten ohne
fremden Zugriff sowie keinen IndexedDB-Rückfall der vier Repo-Fabriken.
Mikes zusätzliche Frage nach dem Store-Weg ist durch die zwei neuen
Pinia-Stores und das Importinventar beantwortet. Der Nachtrag oben enthält
die roten Gegenproben, die Korrektur und den Doku-Abgleich.

Vor Übergabe bestanden `make test` (811/14), beide Lints, beide Typechecks,
beide Builds und `git diff --check`. Kein Merge nach `master` und kein Push.

## Technische Prüfung Runde 4

`claude`, 2026-09-30, an Handoff-Commit `2880d1d69161412c1b36cb735862bc23e3ae451d`
(Diff seit `0ad4a6a`). Geprüft habe ich in einem eigenen, abgetrennten
Worktree die beiden Befunde aus Runde 3 und die neuen Stores. Angewandt
habe ich SP-R-04 (Scout Rule).

| Punkt | Eigener Schritt | Ergebnis |
|---|---|---|
| Befund 1 · Depot-IDs | Diff gelesen; meine Probe aus Runde 3 gegen das echte SQLite-Repository wiederholt | **Behoben.** Die drei kontoübergreifenden `occupied`-Prüfungen sind entfernt. Restore derselben Datei ergibt im Setup-Konto `done` und im zweiten Konto `done`, die Stände bleiben getrennt („Depot“ gegenüber „User-Kopie“). Ein zweiter Admin liest fremde Depots weiterhin nicht (`null`) und kann sie nicht löschen (`not_found`, Original unverändert). Neuer API-Test „stellt dieselbe Backup-Datei in zwei Konten getrennt wieder her“ |
| Befund 2 · Rückfall | `data/repository.ts`, Testhilfe, neuer Test, Importe in `src/` | **Behoben.** Die Fabriken rufen zuerst `activeClient()` auf und werfen ohne Client „PrivateDataClient fehlt“. Die IndexedDB-Repositories importiert in `src/` nur noch `db/`; private Stores beziehen sie nicht mehr. Die Store- und Komponententests mocken `@/data/repository` ausdrücklich über `tests/helpers/localRepositories.ts`. Der Test `data/repository.spec.ts` deckt beide Seiten ab |
| Tests, Lint, Typen | beide Testläufe, beide Lints mit `--no-cache`, beide Typprüfungen, `git diff --check` | 70 / 811 Frontend- und 4 / 14 API-Tests grün, alles Exit 0 |
| Neue Stores | `stores/backup.ts`, `stores/legacy.ts`, `AuthRoot`, `BackupPanel` gelesen | `useLegacyStore` entsteht vor der Anmeldung, liest aber nur über `db/legacy.ts` und berührt keine Kontodaten; die Regeln aus Runde 2 bleiben erhalten. Zu `useBackupStore` siehe Befund 3 |

**Befund (blockierend, nach SP-R-04):**

3. **`useBackupStore.restore` behält einen toten lokalen Zweig, und beide
   neuen Stores sind ungetestet.** Ohne aktiven Datenclient schreibt `restore`
   über die Stores „lokal“ und meldet `'local'`. Diesen Modus gibt es nach
   T-61 nicht mehr. Erreichbar ist der Zweig auch nicht: Ohne Client werfen
   schon die Fabriken beim Anlegen der Stores, die `useBackupStore` braucht.
   Der Code täuscht damit einen zweiten Speicherweg vor. Das ist dieselbe Art
   Rückfall wie in Befund 2; fiele die Fabrikprüfung künftig weg, würde er
   wieder still aktiv. Dazu kommt: Kein Test deckt `useBackupStore` oder
   `useLegacyStore` ab (`grep` in `frontend/tests`). Import, Verwerfen,
   Export je Depot und Restore sind nur über den Browserdurchlauf aus Runde 3
   belegt.
   **Erwartet:** `restore` verlangt einen aktiven Datenclient und wirft sonst;
   der Rückgabewert `'server' | 'local'` und der Zweig in `BackupPanel`
   entfallen. Unit-Tests belegen für `useBackupStore` den Serverweg und den
   Fehler ohne Client, für `useLegacyStore` `inspect`, Import samt lokalem
   Leeren, Verwerfen und `exportAt`, jeweils mit injiziertem `fetch` und
   `fake-indexeddb`.

**Urteil:** `changes_requested` für `2880d1d`. Die Befunde 1 und 2 aus
Runde 3 sind behoben. Die Nachprüfung beschränkt sich auf Befund 3.

## Nacharbeit zu Runde 4 · 2026-09-30

`useBackupStore.restore` verlangt jetzt ausdrücklich den aktiven
`PrivateDataClient` und ruft nur `restoreBackup` der Konto-API auf. Der tote
lokale Schreibzweig und der Modus-Rückgabewert sind entfernt; `BackupPanel`
lädt nach erfolgreichem Server-Restore neu. Der Produktfix und die Tests
stehen in `c40dd40`.

Ein zuerst roter Store-Test belegte den alten Rückgabewert `'server'`; nach
dem Entfernen des Zweigs ist er grün. Zwei Tests für `useBackupStore` prüfen
den POST mit injiziertem `fetch` und den Fehler ohne aktiven Client. Vier
Tests für `useLegacyStore` verwenden `fake-indexeddb`: Vorschau und Export
einschließlich Auswahlliste und Tageswert, Import über die Konto-API mit
anschließendem lokalen Leeren, Erhalt der Daten bei fehlgeschlagenem Import
und bewusstes Verwerfen. Die Vorschau wird nach den jeweiligen Aktionen
zurückgesetzt.

**Prüfung:** `make test` bestand mit 817 Frontend- und 14 API-Tests. Beide
Lints ohne Cache, beide Typechecks und `git diff --check` bestanden. Die
gezielten Store-Tests bestanden mit 6 Tests. Für die Nacharbeit wurde kein
weiterer Browserlauf ausgeführt.

**Doku-Abgleich:** `README.md` (**Where the data lives**, **Layout**),
`docker/README.md` (**Data and backups**), `unraid/README.md` (**Data, API and
verification**) und `AGENTS.md` (**Tatsächlicher Entwicklungsstand**)
beschreiben bereits Serverdaten und den bestätigten Restore. Ihr Verhalten
ändert sich durch das Entfernen des unerreichbaren Zweigs nicht; Textänderungen
sind dort nicht nötig. Veraltete Einleitungskommentare in
`frontend/src/domain/backup.ts` und `frontend/src/db/repository.ts` wurden
an diesen Datenweg angepasst. Board- und Lessons-Konventionen sind unberührt.

**Lessons-Abgleich:** SP-CX-02 auf aktuelle Aussagen in Quellkommentaren,
Anleitungen, Ticket und STATUS angewandt. Die historischen Reviewbefunde
bleiben auf ihre jeweiligen Prüffassungen bezogen.

## Übergabe an Claude · technische Runde 5 · 2026-09-30

Bitte Befund 3 aus Runde 4 nachprüfen: Es gibt keinen lokalen Restore-Zweig
mehr, und die neuen Store-Tests decken Serverweg, fehlenden Client sowie
Altbestandsvorschau, Import, Verwerfen und Export ab. Die Nachprüfung kann
sich auf diese Fassung seit `2880d1d` beschränken. T-60/T-63 bleiben bis zu
Mikes ausdrücklicher T-63-Entscheidung ohne Merge und Push.

## Technische Prüfung Runde 5

`claude`, 2026-09-30, an Handoff-Commit `238723a1b9ff169a9eac2a54d65632e4d0282724`
(Diff seit `2880d1d`). Geprüft habe ich Befund 3 aus Runde 4 in einem
eigenen, abgetrennten Worktree. Angewandt habe ich SP-R-04 (Scout Rule).

| Punkt | Eigener Schritt | Ergebnis |
|---|---|---|
| Befund 3 · lokaler Zweig | Diff von `stores/backup.ts` und `BackupPanel.vue` gelesen | **Behoben.** `restore` wirft ohne Client „PrivateDataClient fehlt“ und läuft sonst nur über `client.restoreBackup`. Der Rückgabewert `'server' \| 'local'` und der lokale Zweig in `BackupPanel` sind entfernt |
| Befund 3 · Tests | `tests/stores/backup.spec.ts` und `tests/stores/legacy.spec.ts` gelesen | **Behoben.** Backup: Restore nur per `POST /api/data/restore` mit `same-origin`; ohne Client ein Fehler und kein `fetch`. Legacy: `inspect`, `exportAt` samt Grenzindex, Import mit lokalem Leeren erst nach Erfolg, **fehlgeschlagener Import behält den Altbestand**, Verwerfen leert alle vier Tabellen |
| Tests, Lint, Typen | Frontend- und API-Tests, Frontend-Lint mit `--no-cache`, Typprüfung, `git diff --check` | 72 / 817 Frontend- und 14 API-Tests grün, alles Exit 0. API-Code unverändert |
| Reste der Entfernung | Aufrufer per `git grep` auf `238723a` gesucht | siehe Befund 4 |

**Befund (blockierend, nach SP-R-04):**

4. **Die Entfernung des lokalen Zweigs hinterlässt toten Code.** Diese
   Stellen hatten nur den alten lokalen Restore als Nutzer:
   - `instrumentsStore.replaceAllowlist` (`stores/instruments.ts:105`),
     `settingsStore.replaceAll` (`stores/settings.ts:167`) und
     `valueHistoryStore.replaceAll` (`stores/valueHistory.ts:101`) haben
     keinen Aufrufer mehr.
   - `portfolioStore.replacePortfolio` (`stores/portfolio.ts:355`) wird nur
     noch von `tests/stores/portfolio.spec.ts` aufgerufen.
   - Der Übersetzungsschlüssel `backup.restored` (`i18n/de.ts:490`,
   `i18n/en.ts:477`) hat keinen Nutzer mehr.
   Die vier Methoden sind Ersetzungswege am atomaren Server-Restore vorbei
   (`/api/data/restore`, eine Transaktion mit Revisionsprüfung). Ein künftiger
   Aufrufer bekäme damit wieder ein nicht atomares Restore in mehreren
   Einzelschreibvorgängen. Das ist derselbe Befundtyp wie 2 und 3.
   **Erwartet:** Die vier Methoden, ihre Tests in `portfolio.spec.ts` und der
   verwaiste Schlüssel entfallen. Ein Inventar belegt, dass nach der Änderung
   kein Aufrufer mehr existiert: `git grep` auf die vier Namen und
   `backup.restored`.

**Urteil:** `changes_requested` für `238723a`. Befund 3 ist behoben. Die
Nachprüfung beschränkt sich auf Befund 4.

## Nacharbeit zu Runde 5 · 2026-09-30

Die vier aufruflosen Store-Methoden `replaceAllowlist`, `replaceAll` in
Settings und ValueHistory sowie `replacePortfolio` sind entfernt. Damit
entfallen auch die nur noch dafür vorhandenen Store-Tests. Die
Allowlist-Repositories hatten ebenfalls nur für diesen alten Restore-Weg
eine vollständige `replaceAll`-Methode; diese und zwei reine Methodentests
sind entfernt. Das weiterhin verwendete `replaceAll` des Kurs-Caches bleibt.
Der verwaiste Schlüssel `backup.restored` ist aus beiden Sprachkatalogen
entfernt. Der Produkt- und Teststand steht in `b2235b8`.

**Aufruferinventar:** `git grep -n -E 'replaceAllowlist|replacePortfolio|backup\.restored|settingsStore\.replaceAll|valueHistoryStore\.replaceAll' -- frontend`
ergibt keinen Treffer. `git grep -n 'replaceAll(' -- frontend/src/data frontend/src/db frontend/src/stores` zeigt nur
`QuoteCacheRepository.replaceAll` und seinen Aufruf in `stores/quotes.ts`.
Das atomare Einspielen bleibt ausschließlich bei `POST /api/data/restore`.

**Prüfung:** `make test` bestand mit 808 Frontend- und 14 API-Tests. Beide
Lints ohne Cache und beide Typechecks bestanden ohne Warnung; Frontend- und
API-Build sowie `git diff --check` bestanden. Der Frontend-Build meldet den
bereits bekannten großen Vendor-Chunk. Die neun entfernten Tests prüften
ausschließlich die beseitigten Methoden. Ein zusätzlicher Browserlauf fand
für diese Entfernung nicht statt.

**Doku-Abgleich:** `README.md` (**Where the data lives**, **Layout**),
`docker/README.md` (**Data and backups**), `unraid/README.md` (**Data, API and
verification**) und `AGENTS.md` (**Tatsächlicher Entwicklungsstand**)
beschreiben Konto-Daten und Backup bereits richtig; ihre Aussagen bleiben
gültig. In `frontend/src/i18n/de.ts` und `en.ts` versprach der sichtbare
Backup-Einstieg dagegen fälschlich reine Browserdaten und ein Backup als
einzigen Gerätewechselweg. Beide Texte nennen jetzt den Server als Datenort
und das Backup als zusätzliche Sicherung. Veraltete Quellkommentare im
Instrumenten-Store sind ebenfalls korrigiert. Keine Änderung an Board- oder
Lessons-Konventionen.

**Lessons-Abgleich:** SP-CX-02 auf Aufrufer, aktuelle App-Texte und
Anleitungen angewandt; frühere Befunde und Belege bleiben auf ihre Fassung
bezogen.

## Übergabe an Claude · technische Runde 6 · 2026-09-30

Bitte den aufruflosen Code aus Befund 4 und das Aufruferinventar gezielt
nachprüfen. Die entfernten Store-Methoden sind keine zulässige Alternative
zur atomaren Server-Wiederherstellung. Die Prüfungen und der Doku-Abgleich
stehen unmittelbar oben. T-60/T-63 bleiben bis zu Mikes ausdrücklicher
T-63-Entscheidung ohne Merge und Push.

## Technische Prüfung Runde 6

`claude`, 2026-09-30, an Handoff-Commit `094802bb63b7d5f38bdcb4cba1f7b349a462cd95`
(Diff seit `238723a`). Geprüft habe ich Befund 4 aus Runde 5 in einem eigenen,
abgetrennten Worktree. Angewandt habe ich SP-R-04 (Scout Rule).

| Punkt | Eigener Schritt | Ergebnis |
|---|---|---|
| Befund 4 · tote Methoden | Diff gelesen; `git grep` auf `094802b` in `frontend` und `api` nach `replacePortfolio`, `replaceAllowlist`, `replaceAll` und `backup.restored` | **Behoben.** Die ersten beiden haben keinen Treffer mehr. `replaceAll` gibt es nur noch als `QuoteCacheRepository.replaceAll` mit echtem Aufrufer `stores/quotes.ts:183`; das ist der Kurs-Cache, kein privater Datenweg. Zusätzlich entfernt sind die nur vom alten Restore genutzten `replaceAll` der Server- und IndexedDB-Allowlist-Repositories |
| Befund 4 · Schlüssel | `i18n/de.ts`, `i18n/en.ts` | **Behoben.** `backup.restored` ist entfernt. Die Backup-Einleitung beschreibt jetzt in beiden Sprachen den Serverstand samt zusätzlicher Dateisicherung statt „nur in diesem Browser“ |
| Reste der Entfernung | Frontend-Lint ohne Cache mit `--max-warnings 0` | Exit 0, keine Warnung zu ungenutzten Importen oder Variablen |
| Tests, Typen | Frontend- und API-Tests, Typprüfung, `git diff --check` | 72 / 808 Frontend- und 14 API-Tests grün, alles Exit 0. Die neun entfallenen Frontend-Tests betrafen ausschließlich die entfernten Methoden. API-Code unverändert |

**Urteil:** `approved` für `094802b`. Die Befunde 1 bis 4 aus den Runden 3
bis 5 sind behoben. Die Konzeptregel aus Runde 2 ist umgesetzt und in
Runde 3 im Browser sowie gegen das SQLite-Repository geprüft. Nicht selbst
geklickt sind Export je Depot nach gesetztem Marker, die Reaktivierung und
ein echter paralleler Schreibkonflikt; sie sind durch Code und Tests belegt.
Mikes menschliche Prüfpunkte A bis D stehen aus.

## Zeitpunkt der menschlichen Prüfung · Mike, 2026-09-30

Mike: „T-61 teste ich wenn t-62 auch fertig ist“. Die Prüfpunkte A bis D
prüft Mike gemeinsam mit T-62, nicht vorher. Bis dahin bleibt T-61 technisch
freigegeben (Runde 6, `094802b`) in `30-doing/`, ohne Abschluss und ohne
Integration. Die Arbeit an T-62 wartet darauf nicht. Festgehalten von
`claude-observer`.
