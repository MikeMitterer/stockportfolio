# T-60 · StockPortfolio-Server und private Benutzerkonten

StockPortfolio speichert Depots bislang nur im Browser. Für private Depots
mehrerer Personen braucht der Server, der die App ausliefert, eigene Konten
und eine verlässliche Anmeldung. **StockInfo bleibt ausschließlich Quelle für
Marktdaten**; seine API und sein Repository werden nicht geändert.

**Beispiel:** Mike richtet auf seiner StockPortfolio-Instanz ein Konto für eine
zweite Person ein. Beide melden sich an. Die zweite Person kann Mikes Depots
weder durch Raten einer ID noch durch direktes Öffnen einer Admin-Adresse sehen.

**Stand am 2026-09-28:** Der Container liefert derzeit statische Dateien mit
`serve` aus; eine eigene API, Datenbank, Anmeldung und Benutzerseite fehlen.
Mike hat getrennte private Depots, vom Admin angelegte Konten und die
StockPortfolio-eigene Serverlösung im Gespräch beauftragt. Dieses Ticket ist
der erste Schritt der Kette T-60 → T-61 → T-62; Produktcode ist noch nicht
geändert.

**Für dich:** Jetzt ist kein Handgriff nötig. Nach technischer Freigabe folgt
die menschliche Prüfung des einmaligen Setups und der Benutzerverwaltung.

## Für dich

### Nach der technischen Übergabe

Die Testinstanz startet der Coder mit leerem, getrenntem Datenverzeichnis auf
`http://127.0.0.1:18080`; er dokumentiert den genauen Startbefehl. Der
einmalige Einrichtungscode wird nur aus ihrem Container-Log gelesen und nicht
ins Ticket kopiert. Keine bestehenden Depots für diese Prüfung verwenden.

| Frage | Prüfpunkt # | Handgriff | Dein Urteil | Human |
|---|---|---|---|---|
| A · Erstes Admin-Konto | [1](#pruefpunkt-1) | Einrichtungsseite öffnen, mit dem einmaligen Code Admin-Konto anlegen, abmelden und erneut anmelden | Ist der Einstieg ohne Terminalarbeit nach dem Start verständlich? | |
| B · Benutzerverwaltung | [2](#pruefpunkt-2) | Als Admin **Einstellungen → Benutzerverwaltung** öffnen, Testkonto anlegen und deaktivieren | Sind Zugang und Aktionen klar benannt? | |

## Umsetzung und technische Nachweise

| Repo | Umfang | GH-Issue |
|---|---|---|
| StockPortfolio | Eigener Server im bestehenden Container, Authentifizierung, Admin-Oberfläche, Betrieb und Dokumentation | — |

### Schnitt und Abhängigkeiten

1. Der StockPortfolio-Container liefert Web-App und eigene `/api` unter
   derselben Webadresse aus. Ein persistentes Datenverzeichnis hält SQLite,
   Konten und Sitzungen über Container-Updates. Die öffentliche
   StockInfo-Adresse bleibt eine getrennte Konfiguration; kein Depot- oder
   Kontenaufruf geht an StockInfo.
2. Beim ersten Start ohne Admin erzeugt der Server einen einmaligen
   Einrichtungscode im Container-Log. Nur damit kann die Einrichtungsseite
   das erste Admin-Konto anlegen. Danach ist die Einrichtung gesperrt.
   Es gibt keine öffentliche Selbstregistrierung.
3. Der Admin gelangt nach Anmeldung über **Einstellungen → Benutzerverwaltung**
   und die bestehende Hash-Navigation `/#/admin/users` zur Benutzerseite.
   Die direkte Eingabe von `/admin/users` leitet dorthin. Er kann Konten anlegen,
   deaktivieren und Passwörter zurücksetzen. Ein temporäres Passwort verlangt
   beim nächsten Login eine Änderung. Das letzte aktive Admin-Konto darf
   nicht deaktiviert werden.
4. Passwörter liegen nur als geeignete langsame Hashes vor. Der Server hält
   Sitzungen; der Browser verwendet ein geschütztes Cookie, keine Tokens in
   `localStorage`. Logout, Deaktivierung und Passwort-Reset beenden betroffene
   Sitzungen. Schreibende Routen prüfen Herkunft und Sitzung.
5. Admin-Rechte gelten serverseitig für jede Admin-API. Ein versteckter
   Menüpunkt oder eine bekannte URL ist keine Zugriffsprüfung. Die
   Administrationsoberfläche zeigt keine fremden Depotinhalte.
6. T-61 ergänzt benutzergebundene Depotdaten und T-62 die SSE-Benachrichtigung.
   Dieses Ticket darf deren Fertigstellung nicht behaupten.

Vor dem ersten Produktedit die übergreifende Architektur als prüfbare
Spezifikation und Umsetzungsschritte festhalten. Die bisherige Gesprächszusage
deckt Richtung und Umfang ab; technische Details wie Sitzungsablauf,
Revisionsgrenzen und Container-Start werden darin überprüfbar entschieden.

### Akzeptanzkriterien

- [ ] Der bestehende Container bedient Web-App und eigene API; Daten bleiben
  nach Neustart und Container-Neuerstellung mit demselben Volume erhalten.
- [ ] Erst-Einrichtung benötigt einen einmaligen Code, ist nach Anlage des
  ersten Admins geschlossen und legt keine Standard-Zugangsdaten an.
- [ ] Admin kann Konten anlegen, deaktivieren und Passwörter zurücksetzen;
  ein normaler Nutzer kann keine Admin-Funktion aufrufen.
- [ ] Deaktivierte Konten und beendete Sitzungen erhalten keinen API-Zugriff;
  das letzte aktive Admin-Konto bleibt erhalten.
- [ ] Die App funktioniert für die Anmeldung ohne erreichbaren StockInfo-Dienst;
  dessen Marktdatenzugriff bleibt fachlich unverändert.
- [ ] DE/EN, Tastatur und schmale Ansicht der Login-, Setup- und Admin-Seiten
  sind geprüft.

### Verify

Isolierter Testcontainer mit eigener Datenbank und zwei synthetischen Konten;
keine echten Passwörter oder Einrichtungscodes in Nachweisen. Tests verwenden
keine produktive StockInfo-API. Die Browserprüfung erfolgt bei 390 und 1440 px.

Legende: ✅ live bestätigt · ⚠️ mit Einschränkung · ◑ teilweise ·
➖ noch kein Live-Nachweis. `AI` wird erst nach der Prüfung gesetzt.

| # | Handgriff | Nachweis | AI |
|---|---|---|:--:|
| 1 | <a id="pruefpunkt-1"></a>Frischen Testcontainer einrichten, Admin anlegen, Setup erneut öffnen | Code nur einmal nutzbar; erneutes Setup abgewiesen; Admin-Login funktioniert | ➖ |
| 2 | <a id="pruefpunkt-2"></a>Admin-Seite als Admin und normaler Nutzer öffnen; Konten verwalten | Admin-Aktionen funktionieren; normale Sitzung und direkter API-Aufruf erhalten 403 | ➖ |
| 3 | Passwort-Reset, Deaktivierung, Logout und letztes Admin-Konto prüfen | Alte Sitzungen verlieren Zugriff; letztes Admin-Konto bleibt aktiv | ➖ |
| 4 | Container mit demselben Volume neu erstellen | Konten bleiben, ohne Volume beginnt ein unabhängiges Setup | ➖ |
| 5 | `make test`, `make lint`, `make typecheck`, Frontend-/Container-Build und Browserprüfung | Ergebnisse und mögliche Bestandsfehler sind konkret dokumentiert | ➖ |
| 6 | Doku und Namen prüfen | README, Docker-README, Unraid-Anleitung und Vorlage stimmen; Bezeichnerinventar ist englisch | ➖ |

### Doku-Abgleich

`README.md` (**Where the data lives**, **Docker**), `docker/README.md`
(**Quick start**, **Configuration**, **Data and backups**), `unraid/README.md`
(**Installing through Unraid Apps**, **Configuration**, **Data, API and
verification**) und die zentrale Unraid-Vorlage auf Einrichtung, Login, Volume
und Zugriff abgleichen. Geplante Synchronisation bis T-61/T-62 ausdrücklich
als noch nicht verfügbar kennzeichnen. `AGENTS.md` nach dem Architekturwechsel
auf die neue StockPortfolio-eigene API prüfen; StockInfo bleibt getrennt.
Board-/Lessons-Konventionen ändern sich durch dieses Produktmerkmal nicht;
für den zentralen Ticket-Skill ist kein fachlicher Nachtrag vorgesehen.

### Side-Effects

Der Container benötigt künftig ein persistentes Datenverzeichnis und eine
eigene Laufzeit-API. Bestehende Installationen brauchen beim Update einen
Einrichtungsweg und ein Volume. HTTPS und Zugriffsschutz der Instanz sind für
Sitzungscookies zu berücksichtigen. Die bisherigen Browser-Depots bleiben bis
T-61 lokal; ihre Übernahme gehört nicht in dieses Ticket.

## Konzeptprüfung Runde 1

`claude`, 2026-09-28, an Handoff-Commit `6a33e6fb72a27cb46edcaa82361004b9b0854b9e`
(Branch `t-60-stockportfolio-server-und-konten`). Mike hat ausdrücklich eine
**konzeptionelle** Prüfung der Kette T-60–T-62 angefordert, keinen Produkttest.
`git diff --name-only master...t-60-stockportfolio-server-und-konten` zeigt
ausschließlich Ticket- und Board-Dateien (T-60–T-62, `README.md`, `STATUS.md`);
die Zusage „noch kein Produktcode“ ist damit selbst geprüft bestätigt. Diese
Prüfung ersetzt keine technische Freigabe von Produktcode und keinen
menschlichen Ticketabschluss (Codex-Auftrag in der ehemaligen OUTBOX).

**Zuschnitt, Reihenfolge, Abhängigkeiten:** Die Kette T-60 → T-61 → T-62 ist
folgerichtig: Sitzungen/Konten vor kontogebundenen Daten vor Live-Hinweis auf
deren Änderung. Jedes Ticket grenzt seinen Umfang gegen die Nachbarn ab und
behauptet nicht deren Fertigstellung. Einstieg, Stand und STATUS beschreiben
durchgängig dieselbe Zuordnung; kein Widerspruch gefunden (SP-CX-02-Gegenprobe).
T-62 prüft Sitzungen über denselben Mechanismus wie T-61 statt eigener Logik —
keine doppelt entstehende Validierung über die Kette.

**Vollständige Trennung von StockInfo:** In allen drei Tickets ausdrücklich
und mehrfach festgehalten; T-61 grenzt zusätzlich Marktdaten-Caches
(Kurs/FX/Verlauf) bewusst von den neuen privaten Server-Stammdaten ab. Kein
Befund.

**Architekturwechsel gegen AGENTS.md:** Der Kern von AGENTS.md nennt
StockPortfolio eine „Vue-3-App ohne eigenes Backend“; T-60 hebt das bewusst
auf. Das ist eine von Mike im Gespräch beauftragte Richtungsentscheidung,
keine Unstimmigkeit der Tickets. Alle drei Doku-Abgleich-Abschnitte benennen
die nötige AGENTS.md-Korrektur bereits konkret — hier nur diese Einordnung,
kein zusätzlicher Nachtrag nötig.

**Konto- und Admin-Verwaltung — offene Entscheidung:** Keines der drei
Tickets nennt einen Schutz gegen wiederholte Fehlanmeldungen
(Rate-Limit/Lockout). Bei einer über Unraid potenziell erreichbaren Instanz
mit Passwort-Login ist das vor dem ersten Produktedit in der angekündigten
Architektur-Spezifikation mitzuentscheiden.

**Sitzungscookies — bereits als offen benannt:** Das Ticket verschiebt
Sitzungsablauf, Revisionsgrenzen und Container-Start selbst ausdrücklich in
eine noch zu schreibende, prüfbare Spezifikation. Empfehlung dafür: konkrete
Cookie-Flags (`Secure`/`HttpOnly`/`SameSite`) und das Verhalten bei reinem
HTTP-Betrieb (lokal/Dev ohne TLS) dort explizit festlegen.

**Sitzung statt Token — Gegenprobe auf Mikes Nachfrage:** Serverseitige
Sitzung mit geschütztem Cookie ist hier die richtige Wahl gegenüber einem
selbsttragenden Token (z. B. JWT), nicht nur eine unbegründete Vorgabe.
Ausschlaggebend: sofortiger Widerruf bei Logout/Deaktivierung/Passwort-Reset
ist mit einer Sitzungszeile trivial, mit einem signierten Token dagegen nur
über eine zusätzliche Sperrliste möglich — genau das verlangen die
Akzeptanzkriterien. Ein `HttpOnly`-Cookie ist für eingeschleustes JavaScript
unerreichbar; ein Token in `localStorage` wäre es nicht. T-62 profitiert
zusätzlich vom automatischen Cookie-Versand bei `EventSource`, das keine
eigenen Header setzen kann. Ein-Container-Betrieb mit SQLite braucht keine
zustandslose Mehrknoten-Skalierung, und es gibt keinen Client außer dem
eigenen Browser — die üblichen Vorteile von Tokens entfallen hier also.
**Die Sitzungswahl bringt aber CSRF-Exposition mit**, die Tokens nicht hätten:
Cookies werden vom Browser automatisch mitgeschickt. Das ist in der
Spezifikation zusammen mit den Cookie-Flags mitzuentscheiden, etwa über
`SameSite=Lax`/`Strict` und/oder einen expliziten CSRF-Schutz für
zustandsändernde Routen.

**Kleine offene Frage:** Darf ein Admin sein eigenes, nicht-letztes Konto
deaktivieren oder sich selbst die eigene aktive Sitzung entziehen? Nicht
spezifiziert; vermutlich unkritisch, aber für die Spezifikation nennenswert.

Befunde zu T-61 und T-62 stehen in den jeweiligen Tickets; das Gesamturteil
über die Kette steht dort in T-62 am Ende der Prüfung.
