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
   werden niemals automatisch zusammengeführt.
6. Nach Logout oder Kontowechsel bleiben keine privaten Daten des vorigen
   Nutzers in der App oder einem geteilten Browsercache zugänglich. Der
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
| 3 | <a id="pruefpunkt-3"></a>Altbestand und leeren zweiten Browser durchspielen | Nur bestätigter Import schreibt; leerer Browser überschreibt nichts | ➖ |
| 4 | Zwei gleichzeitige Bearbeitungen und Serverausfall auslösen | Konflikt und Offline-Zustand sichtbar; keine stille Überschreibung | ➖ |
| 5 | Abmelden, Konto wechseln, Backup und Restore prüfen | Keine private Altanzeige; Restore schreibt nur in das angemeldete Konto | ➖ |
| 6 | `make test`, `make lint`, `make typecheck`, Build, Browser- und Doku-Abgleich | Ergebnisse und mögliche Bestandsfehler sind konkret dokumentiert | ➖ |

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
