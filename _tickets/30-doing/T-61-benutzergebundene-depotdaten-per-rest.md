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
5. Vorhandene Browserdepots können **einmalig und ausdrücklich** nach Login
   einem gewählten Konto zugeordnet werden. Die App zeigt Quelle, Ziel und
   Wirkung vorher an. Ein leerer neuer Browser lädt den Serverstand und
   überschreibt ihn nicht. Unterschiedliche Altbestände verschiedener Browser
   werden niemals automatisch zusammengeführt. Ein dauerhafter
   Übernahmemarker wird mit den importierten Depots in derselben Transaktion
   gespeichert. Ein zweiter pauschaler Importversuch für dasselbe Konto,
   auch aus einem anderen Browser, erhält `409` und schreibt nichts.
6. Nach Logout oder Kontowechsel bleiben keine privaten Daten des vorigen
   Nutzers in der App oder einem geteilten Browsercache zugänglich. Private
   IndexedDB-Daten, lokale Kurs-, FX- und Verlaufscaches sowie private
   Pinia-Zustände werden beim Logout und vor dem Kontowechsel gelöscht. Der
   bestehende Backup-/Restore-Weg arbeitet mit den serverseitigen Daten des
   angemeldeten Kontos; der Export bleibt ein Depot pro Datei.
7. T-62 übernimmt die zeitnahe Benachrichtigung geöffneter Browser. Dieses
   Ticket liefert verlässliches Laden beim Öffnen und erneuten Laden, noch
   keinen Live-Abgleich.

### Akzeptanzkriterien

- [ ] Gleicher Nutzer sieht auf zwei Browsern dieselben Depots und Einstellungen
  nach Neuladen; verschiedene Nutzer sehen getrennte Daten.
- [ ] Lesen, Schreiben und Löschen fremder Depot-IDs wird serverseitig
  verweigert, auch bei direktem API-Aufruf.
- [ ] Veraltete Revisionen führen zu sichtbarem Konflikt statt Datenverlust.
- [ ] Browserdaten werden nur nach expliziter Zuordnung und ohne automatische
  Überschreibung bestehender Serverdaten übernommen.
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
| 1 | <a id="pruefpunkt-1"></a>Im Browser A speichern, Browser B mit demselben Konto neu laden | Depot, Einstellungen, Auswahl und Tageswerte stimmen überein | ➖ |
| 2 | <a id="pruefpunkt-2"></a>Mit Konto B IDs und API-Routen von Konto A lesen und ändern | Kein Inhalt und keine Änderung an Konto A; passende 403/404-Antworten | ➖ |
| 3 | <a id="pruefpunkt-3"></a>Altbestand, leeren zweiten Browser und zweiten Importversuch durchspielen | Nur bestätigter Erstimport schreibt; leerer Browser überschreibt nichts; zweiter Versuch erhält `409` ohne Änderung | ➖ |
| 4 | Zwei gleichzeitige Bearbeitungen und Serverausfall auslösen | Konflikt und Offline-Zustand sichtbar; keine stille Überschreibung | ➖ |
| 5 | <a id="pruefpunkt-5"></a>Abmelden, Konto wechseln, lokale Speicher und Caches, Backup und Restore prüfen | Keine privaten Rohdaten des vorigen Kontos; Restore schreibt nur in das angemeldete Konto | ➖ |
| 6 | `make test`, `npm --prefix frontend run lint`, `npm --prefix api run lint`, `npm --prefix frontend run typecheck`, `npm --prefix api run typecheck`, Build, Browser- und Doku-Abgleich | Ergebnisse und mögliche Bestandsfehler sind konkret dokumentiert | ➖ |

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
