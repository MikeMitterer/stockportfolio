# T-60 · StockPortfolio-Server und Konten

## Ziel und Grenze

Ein StockPortfolio-Container liefert die Web-App und eine eigene API unter
derselben Adresse. Ein Admin richtet die erste Anmeldung mit einem einmaligen
Code aus dem Container-Log ein und verwaltet danach weitere private Konten.
Ohne Anmeldung gibt die API keine Kontodaten aus. StockInfo bleibt ausschließlich
für Marktdaten zuständig. Depotdaten bleiben bis T-61 im jeweiligen Browser;
T-60 behauptet noch keine Trennung oder Synchronisation dieser lokalen Daten.

## Aufbau

- `api/src/routers/` enthält die eingehenden HTTP-Routen. `api/src/auth/`
  enthält Passwortprüfung, Sitzungslogik und die gemeinsame Autorisierung.
  `api/src/persistence/` enthält allein Drizzle, SQLite-Schema, Migrationen und
  Repositories. Router erhalten Repository-Schnittstellen; SQL und ORM-Typen
  verlassen den Persistenzordner nicht.
- `api/package.json` und seine Lockdatei deklarieren Build-, Test- und
  Laufzeitpakete des Servers. Serverquellen, Drizzle-Migrationen und Tests
  liegen vollständig unter `api/`. Der Container installiert daraus nur
  Produktionsabhängigkeiten. Das bestehende Frontend zieht mit Quellen,
  Tests und Vite-Konfiguration nach `frontend/`; `frontend/package.json`
  ist die einzige Quelle der Projektversion.
- Node 22 betreibt den Server im bestehenden Container. Er bedient `/api/*`,
  `/healthz`, statische Dateien und die Weiterleitung von `/admin/users` nach
  `/#/admin/users`. Vite bleibt Frontend-Build und Dev-Server; in der lokalen
  Entwicklung leitet Vite `/api` an den lokalen Server weiter.
- SQLite liegt standardmäßig unter `/data/stockportfolio.sqlite`; der Pfad ist
  über `STOCKPORTFOLIO_DATA_DIR` wählbar. Das Verzeichnis muss beschreibbar und
  als Volume eingebunden sein. Der Server startet nicht mit stillschweigendem
  temporärem Speicher, wenn das konfigurierte Verzeichnis nicht schreibbar ist.
  Datenbankinitialisierung und Schemaänderungen laufen vor dem HTTP-Start.
- Die bisherige StockInfo-Konfiguration in `config.js` bleibt getrennt. Die
  Anmeldung startet auch ohne erreichbares StockInfo. Der StockInfo-Client wird
  erst im angemeldeten App-Zweig verwendet; seine bestehende Fehlermeldung bei
  fehlender Adresse bleibt dort sichtbar.

## Einrichtung und Konten

- Solange kein Admin existiert, erzeugt jeder Serverstart einen zufälligen
  Einrichtungscode (mindestens 128 Bit) und zeigt ihn genau einmal im
  Container-Log. Im Speicher liegt nur sein Hash. `GET /api/setup/status`
  liefert lediglich `required: true|false`, nie den Code. `POST /api/setup`
  nimmt Code, Admin-Namen und Passwort an. Die Anlage und die dauerhafte
  Sperre des Setups sind eine Transaktion. Nach Erfolg wird der Code im
  Prozess verworfen. Kein Konto und kein Passwort sind voreingestellt.
- Benutzernamen sind eindeutig, werden beim Anlegen normalisiert und haben
  eine begrenzte Länge. Passwörter erfordern mindestens 12 Zeichen und werden
  mit Argon2id samt individuellem Salt gehasht. Passwort-Hashes erscheinen
  weder in API-Antworten noch in Logs.
- `POST /api/admin/users` legt ein Konto mit einem vom Admin vergebenen
  temporären Passwort an. `POST /api/admin/users/:id/reset-password` ersetzt
  es durch ein neues temporäres Passwort. Beides setzt
  `must_change_password`; die erste Anmeldung erlaubt nur Passwortwechsel und
  Logout. `POST /api/admin/users/:id/deactivate` deaktiviert das Konto. Ein
  Admin kann sein eigenes Konto deaktivieren, wenn danach ein anderer aktiver
  Admin verbleibt; sonst antwortet die API mit einem Konflikt. Die Prüfung
  erfolgt in derselben Transaktion wie die Änderung.

## Sitzungen und Zugriff

- Eine Anmeldung erzeugt einen zufälligen 256-Bit-Sitzungswert. Nur dessen
  Hash liegt in SQLite. Das Cookie ist `HttpOnly`, `SameSite=Lax`, `Path=/`;
  `Secure` wird bei `STOCKPORTFOLIO_SECURE_COOKIES=true` gesetzt. Im lokalen
  HTTP-Testbetrieb ist die Vorgabe `false`; für öffentliches HTTPS hinter einem
  Reverse Proxy muss sie `true` sein. Die API vertraut keinem frei gesetzten
  `X-Forwarded-*`-Header für diese Entscheidung.
- Sitzungen laufen nach 12 Stunden Inaktivität und spätestens nach sieben
  Tagen ab. Nur eine erfolgreiche authentifizierte Anfrage verlängert die
  Inaktivitätsfrist. Logout löscht die Sitzung. Deaktivierung und Reset löschen
  alle Sitzungen des betroffenen Kontos. Der Passwortwechsel löscht die alten
  Sitzungen und stellt eine neue Sitzung aus.
- Jede schreibende Route verlangt JSON, eine gültige Sitzung (außer Setup und
  Login) und einen `Origin`, der exakt zu `STOCKPORTFOLIO_PUBLIC_ORIGIN` passt.
  Diese Einstellung bezeichnet die Browseradresse einschließlich Protokoll
  und Port; im lokalen HTTP-Betrieb wird sie aus der direkten Anfrage
  ermittelt. Hinter einem Reverse Proxy ist sie ausdrücklich zu setzen. Das
  ist zusätzlich zu `SameSite=Lax` der CSRF-Schutz. Fehlende oder fremde
  Herkunft wird abgewiesen. Setup und Login sind ebenso geschützt.
- Fehlanmeldungen werden nach normalisiertem Benutzernamen **und** direkter
  Verbindungs-IP begrenzt. Fünf Fehlschläge für genau dieses Paar in 15 Minuten
  sperren es für 15 Minuten (`429` mit `Retry-After`). Andere Konten derselben
  IP bleiben benutzbar, auch wenn ein Reverse Proxy alle Verbindungen mit
  derselben IP an den Server weitergibt. Unbekannte Namen erhalten dieselbe
  Antwort und Begrenzung; die API verrät nicht, ob das Konto existiert.
  Falsche Einrichtungscodes haben einen eigenen Schlüssel für die direkte IP.
  Es werden keine Proxy-Adressen als vertrauenswürdig konfiguriert und keine
  `X-Forwarded-*`-Header für das Limit ausgewertet. Die Zähler liegen in SQLite,
  damit ein Neustart die Sperre nicht aufhebt.
- `GET /api/auth/session` gibt nur Identität, Rolle und
  `mustChangePassword` des eigenen Kontos aus. Alle `/api/admin/*`-Routen
  prüfen serverseitig die aktuelle aktive Admin-Rolle. Normale Nutzer
  erhalten 403, unbekannte oder beendete Sitzungen 401. Die Admin-Antworten
  enthalten keine Depotdaten.

## Oberfläche

Die App prüft beim Start Setup-Status und Sitzung. Setup, Login und erzwungener
Passwortwechsel erscheinen ohne StockInfo-Verbindung. Bis T-61 öffnet die
bestehende App nur für den ersten Admin mit seinem lokalen Browserbestand;
andere Konten sehen einen klaren Hinweis auf die noch ausstehende
Depotfreigabe. Unter **Einstellungen → Benutzerverwaltung** führt
ein Link zu `/#/admin/users`; nur Admins sehen ihn. Die Seite erlaubt Anlegen,
Deaktivieren und Passwort-Reset. Alle neuen sichtbaren Texte stehen in den
DE/EN-Katalogen. Formulare, Fehler und Dialoge funktionieren per Tastatur
und bei 390 px Breite. Ein versteckter Link ersetzt keine API-Prüfung.

## Prüfschritte und Übergabe

1. Servertests für Erst-Setup, einmalige Nutzung, Login, Rate-Limit mit zwei
   Konten an derselben IP, Passwortwechsel, Sitzungsablauf und Widerruf mit
   temporärer SQLite-Datei.
2. API-Gegenproben mit zwei synthetischen Konten: 401/403, fremder Origin,
   fehlendes JSON, letztes aktives Admin-Konto, direkte Admin-URL.
3. Frontendtests für Auth-Gate und Admin-Aktionen; kein echter StockInfo-Aufruf.
4. `make test`, Lint und Typprüfung per npm in Frontend und API,
   Frontend- und Container-Build.
   Container mit demselben Volume neu erstellen und Kontoerhalt belegen.
5. Browserdurchlauf bei 390 und 1440 px in DE/EN. Mikes Abnahme nutzt
   `make dev` mit Vite auf 5175 und Konto-API auf 8080. Den konkreten
   Datenaufbau für die Abnahme bestimmt Mike.
6. README, Docker-README, Unraid-Anleitung und zentrale Vorlage auf Setup,
   Cookies, Volume und die T-61/T-62-Grenze abgleichen. Bezeichnerinventar
   für angefasste TypeScript/Vue/Bash-Dateien durchführen.

Die technische Freigabe von T-60 und Mikes Prüfung der Testinstanz sind
getrennte Schritte. Die offenen T-61- und T-62-Tickets erhalten durch diese
Umsetzung keine Produktfreigabe.

## Verbindliche Grenzen für T-61 und T-62

Diese Entscheidungen schließen die Punkte aus der Konzeptprüfung der Kette,
ohne T-61 oder T-62 jetzt als Produktauftrag zu aktivieren.

- T-61 bindet die einmalige Altbestandsübernahme an das angemeldete Konto.
  Die API speichert in derselben Transaktion wie die importierten Depots einen
  dauerhaften Übernahmemarker pro Konto. Ein zweiter Importversuch, auch aus
  einem anderen Browser mit anderem lokalen Bestand, endet mit `409` und
  schreibt nichts. Die Vorschau zeigt diesen Zustand vor der Bestätigung.
  Weitere einzelne Depots können später über den regulären Export und Restore
  übernommen werden; sie sind kein zweiter pauschaler Altbestandsimport.
- T-61 löscht beim Logout und vor dem Wechsel zu einem anderen Konto alle
  privaten IndexedDB-Daten und die lokalen Kurs-, FX- und Verlaufscaches der
  App sowie private Pinia-Zustände. Das gilt auch für Rohdaten, die sonst über
  Entwicklertools erreichbar blieben. Bis T-61 werden vorhandene lokale
  Browser-Depots nicht als zwischen Konten sicher getrennt behauptet. T-60
  zeigt diese Altbestände deshalb nur dem ersten eingerichteten Admin; andere
  Konten erhalten bis T-61 eine klare Noch-nicht-verfügbar-Ansicht.
- T-62 sendet alle 15 Sekunden einen SSE-Kommentar als Keep-Alive. Im selben
  Takt prüft der Server die Sitzung erneut und beendet den Stream nach
  Logout, Deaktivierung oder Ablauf. Beim Wiederverbinden und Sichtbarwerden
  des Tabs lädt der Client den aktuellen Stand per REST; ein verpasstes
  Ereignis bleibt dadurch kein dauerhafter Datenstand. Proxies müssen
  Streaming ohne Pufferung und ein Idle-Timeout oberhalb des Keep-Alive-
  Intervalls erlauben.
