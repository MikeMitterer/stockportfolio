# T-60 · StockPortfolio-Server und private Benutzerkonten

StockPortfolio speichert Depots bislang nur im Browser. Für private Depots
mehrerer Personen braucht der Server, der die App ausliefert, eigene Konten
und eine verlässliche Anmeldung. **StockInfo bleibt ausschließlich Quelle für
Marktdaten**; seine API und sein Repository werden nicht geändert.

**Beispiel:** Mike richtet auf seiner StockPortfolio-Instanz ein Konto für eine
zweite Person ein. Beide melden sich an. Die zweite Person kann Mikes Depots
weder durch Raten einer ID noch durch direktes Öffnen einer Admin-Adresse sehen.

**Stand am 2026-09-29:** Die eigene Konto-API, Anmeldung und
Benutzerverwaltung sind implementiert und lokal geprüft. Der Container-Build
und eine isolierte Volume-Probe waren erfolgreich; die unabhängige technische
Freigabe steht noch aus. Private Depotdaten und SSE gehören weiterhin zu
T-61/T-62. Das vorbereitende Teststack-Ticket T-63 liegt in `20-ready/`.

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

- [x] Der bestehende Container bedient Web-App und eigene API; Daten bleiben
  nach Neustart und Container-Neuerstellung mit demselben Volume erhalten.
- [x] Erst-Einrichtung benötigt einen einmaligen Code, ist nach Anlage des
  ersten Admins geschlossen und legt keine Standard-Zugangsdaten an.
- [x] Admin kann Konten anlegen, deaktivieren und Passwörter zurücksetzen;
  ein normaler Nutzer kann keine Admin-Funktion aufrufen.
- [x] Deaktivierte Konten und beendete Sitzungen erhalten keinen API-Zugriff;
  das letzte aktive Admin-Konto bleibt erhalten.
- [x] Die App funktioniert für die Anmeldung ohne erreichbaren StockInfo-Dienst;
  dessen Marktdatenzugriff bleibt fachlich unverändert.
- [x] DE/EN, Tastatur und schmale Ansicht der Login-, Setup- und Admin-Seiten
  sind geprüft.

### Verify

Isolierter Testcontainer für Setup und Volume, lokale Browserinstanz mit zwei
synthetischen Konten; keine echten Passwörter oder Einrichtungscodes in
Nachweisen. Tests verwenden keine produktive StockInfo-API. Die
Browserprüfung erfolgt bei 390 und 1440 px.

Legende: ✅ live bestätigt · ⚠️ mit Einschränkung · ◑ teilweise ·
➖ noch kein Live-Nachweis. `AI` wird erst nach der Prüfung gesetzt.

| # | Handgriff | Nachweis | AI |
|---|---|---|:--:|
| 1 | <a id="pruefpunkt-1"></a>Frischen Testcontainer einrichten, Admin anlegen, Setup erneut öffnen | Code nur einmal nutzbar; erneutes Setup abgewiesen; Admin-Login funktioniert | ✅ |
| 2 | <a id="pruefpunkt-2"></a>Admin-Seite als Admin und normaler Nutzer öffnen; Konten verwalten | Admin-Aktionen funktionieren; normale Sitzung und direkter API-Aufruf erhalten 403 | ✅ |
| 3 | Passwort-Reset, Deaktivierung, Logout und letztes Admin-Konto prüfen | Alte Sitzungen verlieren Zugriff; letztes Admin-Konto bleibt aktiv | ✅ |
| 4 | Container mit demselben Volume neu erstellen | Konten bleiben, ohne Volume beginnt ein unabhängiges Setup | ✅ |
| 5 | `make test`, `make lint`, `make typecheck`, Frontend-/Container-Build und Browserprüfung | Ergebnisse und mögliche Bestandsfehler sind konkret dokumentiert | ✅ |
| 6 | Doku und Namen prüfen | README, Docker-README, Unraid-Anleitung und Vorlage stimmen; Bezeichnerinventar ist englisch | ✅ |

**Technische Belege vom 2026-09-29:** `npm ci --prefix api` installierte aus
Manifest und Lockfile. `make test` bestand mit 803 Frontend- und 6 API-Tests;
`make lint`, `make typecheck` und `make build-frontend` bestanden. Das
Docker-Image wurde mit `docker build -f docker/Dockerfile -t
stockportfolio:t60-local .` gebaut; nach Produktcommit `7b4cbbe` bestand
auch der reguläre Aufruf `make build`. Zuvor verweigerte dessen bestehende
Schutzprüfung den Build im uncommitteten Arbeitsbaum. Im isolierten Container
lieferten `/`, `/healthz` und
`/api/setup/status` erwartete Antworten; Setup, Login und Sitzung funktionierten.
Nach Neuerstellung mit demselben Volume blieb das Konto erhalten; ohne dieses
Volume meldete `/api/setup/status` wieder `required: true`. Container und
Testvolumes wurden anschließend entfernt.

Die Browserprobe nutzte StockInfos vorhandenes Testserver-Script mit temporären
Kursdaten auf `127.0.0.1:8899`, die lokale Konto-API und Vite auf
`localhost:5175` — keinen Docker-Dienst. Der Browser rief `/health` tatsächlich
dort ab; der bekannte Testkurs war abrufbar. Setup, Kontoanlage,
Passwortwechsel, Admin-Navigation und erneuter Login nach Stoppen von StockInfo
funktionierten. Ein normales Konto sah den Hinweis auf T-61 statt fremder
Depots; die API gab für seine Admin-Anfrage `403`. Login und Admin-Seite wurden
bei 390 und 1440 px geprüft, Setup bei 390 px auf Englisch und breiter auf
Deutsch. Die Tab-Reihenfolge der Login-Felder sowie DE/EN auf der Login-Seite
wurden geprüft. Die Konto-Felder haben zugängliche Namen. StockInfo-Produktcode
und sein Board wurden nicht geändert. Der lokale Filecheck enthält nun
`frontend/` und `api/` im Hash-Snapshot, lässt `node_modules` und `dist` aus.
Das Login-Limit verwendet den normalisierten Benutzernamen und die direkte
Verbindungs-IP. Der Test sperrt nach fünf Fehlversuchen ein bestehendes Konto,
während ein zweites bestehendes Konto über dieselbe IP weiter einloggen kann.
Proxy-Header werden für diesen Schlüssel nicht vertraut; es gibt keine Liste
vertrauenswürdiger Proxies.

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

**Doku-Abgleich am 2026-09-29:** `README.md` (**Where the data lives**,
**Setup**, **Layout**, **Docker**) und `docker/README.md` (**Quick start**,
**Configuration**, **Data and backups**, **Updating**) stimmen zu eigener
Konto-API, `/data`, Browser-Depots bis T-61, StockInfo-Adresse und erstem
Admin-Setup überein. `unraid/README.md` (**Configuration**, **Updating**,
**Data, API and verification**) nennt dieselben Grenzen. Die zentrale Vorlage
im getrennten Templates-Repository ergänzt `/data`, Public Origin, Secure
Cookies, Setup und den neuen Icon-Pfad; Review-Commit
`746a6a49e3a81dd557c4184db21e2beb0e0b087d` auf Branch
`t-60-stockportfolio-template`, noch nicht veröffentlicht. `AGENTS.md`
(**StockPortfolio hängt an StockInfo**, **Bauen und prüfen**) und `SOURCE.md`
(Build aus beiden Paket-Lockfiles) wurden nachgeführt. Die Docker-Hub-Vorschau
für `docker/README.md` bestand mit dem ProjectTools-Helfer. Der gemeinsame
Ticket-Skill benötigt keinen Konventionsnachtrag; T-63 ist ein konkreter
Teststack-Auftrag, keine Board-Regel. Ein praktischer Unraid-Start wurde nicht
behauptet.

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

## Architekturberatung · Paketgrenze `server/` · 2026-09-29

`claude`, auf Anfrage von `codex` in der OUTBOX (uncommitteter Arbeitsstand,
Branch `t-60-stockportfolio-server-und-konten`). Beratung, keine technische
Freigabe; Reviewrunde, Rollen und Owner bleiben unverändert.

**Abwägung anhand von Komplexität, Modularität, Docker-Nähe und einfacher
Installation** (Mikes ausdrückliche Vorgabe für diese Beratung), drei
realistische Schnitte:

| Kriterium | A · eigenständiges `server/`-Paket (aktueller Stand) | B · vollständig in Root integriert | C · npm-Workspaces |
|---|---|---|---|
| Komplexität | Zwei `package.json`/Lockfiles, `--prefix`-Skripte, zwei TS-/Lint-Konfigurationen zu pflegen | Ein `package.json`, aber ein einzelnes `tsconfig.json` kann `NodeNext` (Server) und `bundler` (Vite) nicht gleichzeitig abbilden — bräuchte TS Project References, die intern wieder zwei Konfigurationen erzeugen: Komplexität wandert, verschwindet nicht | Ein Root-Lockfile, aber das `workspaces`-Feld plus ggf. TS Project References sind zusätzliche Konzeptlast gegenüber der bereits funktionierenden `--prefix`-Lösung |
| Modularität | Server-Quellen, Tests und Abhängigkeiten vollständig unter `server/`, unabhängig test- und versionierbar | Frontend- und Backend-Abhängigkeiten vermischen sich in einem Baum; native Module „verschmutzen“ die Frontend-Installation | Wie A, zusätzlich dedupliziertes gemeinsames Tooling (`typescript`, `vitest`, `@types/node`) über den Workspace-Root |
| Docker-Nähe | Server-Build-Stage bekommt gezielt die native Build-Toolchain (`argon2`, `better-sqlite3`), Frontend-Stage bleibt schlank | Stage 1 (`npm ci` + `vite build`) müsste die native Toolchain mitschleppen, obwohl der Browser-Build sie nie lädt | `npm ci --workspace=server` bzw. `--include-workspace-root` lässt sich ähnlich gezielt in eine Docker-Stage lenken wie `--prefix` heute |
| Einfache Installation | Zwei Befehle (`npm ci`, `npm ci --prefix server`) — **aktuell nicht hinter `make setup` gebündelt, siehe Lücke unten** | Ein Befehl `npm ci` — nur um den Preis der Docker-/Modulsystem-Nachteile oben | Ein Befehl `npm install` am Root deckt beide ab — löst den Installationsnachteil von A, ohne die Nachteile von B |

**Ergebnis der Abwägung:** A bleibt die richtige Wahl. Die Docker- und
Modulsystem-Nachteile von B wiegen für eine Instanz, die auf Unraid als
fertiges Container-Image läuft, schwerer als der einmalige Zusatzbefehl bei
der Installation — und genau dieser Nachteil lässt sich ohne Paketwechsel
beheben (siehe Makefile-Lücke unten). C wäre bei „einfacher Installation“
gleichwertig zu A-mit-Makefile-Fix, bringt aber echte zusätzliche
Werkzeugkomplexität (Workspace-Auflösung, ggf. Project References) für einen
Nutzen, den die Makefile-Bündelung schon ohne diese Umstellung liefert.

**Drei Verdrahtungslücken vor der Übergabe schließen** (Prüfschritt 4 der
Spezifikation verlangt `make lint`, `make typecheck` und einen funktionierenden
Build für den Gesamtstand — `make setup` ist die dazugehörige Installations-
voraussetzung):

- `make setup` (`Makefile:114-117`) ruft nur `npm install` am Root auf; kein
  `npm ci --prefix server`. Wer frisch klont, hat nach `make setup` keinen
  lauffähigen Server. Das ist genau die Installationslücke aus der Tabelle
  oben — sie widerlegt nicht den Paketschnitt, sondern eine fehlende
  Verdrahtung. Vorschlag: `make setup` um den Server-Install ergänzen
  (und, sobald der Server läuft, `make dev` um den parallelen Serverstart,
  damit ein Befehl weiterhin für lokale Entwicklung reicht).
- `make lint` (`eslint . --ext .vue,.ts,.tsx`) durchsucht aktuell auch
  `server/**`, aber `eslint.config.js` kennt nur Browser-Globals — kein
  `process`, `Buffer` oder Node-Typisierung. Serverdateien laufen damit für
  Node-Belange faktisch ungeprüft mit. Vorschlag: `server/` aus dem
  Root-`ignores` ausschließen und im Server-Paket eine eigene, node-taugliche
  ESLint-Konfiguration führen (oder ein scoped Override für `server/**` mit
  Node-Globals im Root-Config), `make lint` entsprechend erweitern.
- `make typecheck` läuft aktuell nur `vue-tsc --noEmit` gegen die
  Root-`tsconfig.json`, deren `include` `server/**` nicht enthält. Der bereits
  vorhandene Server-Typecheck (`npm run typecheck --prefix server`) ist
  nirgends verdrahtet. Vorschlag: das Root-`"typecheck"`-Skript um
  `&& npm run typecheck --prefix server` ergänzen, analog zum bestehenden
  `"test"`-Skript.

Alle drei Lücken sind reine Verdrahtung, keine Neubewertung des Paketschnitts.

**Nebenbefund, kein Bestandteil dieser Beratung:** `server/src/auth/service.ts`
und `server/src/routers/api.ts`, die `server/tests/api.spec.ts` importiert,
existieren im Arbeitsbaum noch nicht — konsistent mit der in STATUS.md
genannten „uncommitteten Teilumsetzung“; kein Handlungsbedarf daraus.

## Architekturberatung · Frontend nach `frontend/`? · 2026-09-29

`claude`, auf ergänzende Anfrage von `codex` in der OUTBOX (Mikes Frage, ob
bei eigenständigem `server/`-Paket auch das bestehende Frontend nach
`frontend/` ziehen sollte). Beratung, kein Produktreview; Reviewrunde, Rollen
und Owner bleiben unverändert.

**Empfehlung: Frontend bleibt im Root. Kein Umzug nach `frontend/`.**

Abwägung entlang derselben vier Kriterien wie in der vorigen Beratung:

| Kriterium | Aktuell: Frontend im Root, `server/` als Unterpaket | Variante: `frontend/` + `server/` symmetrisch |
|---|---|---|
| Komplexität | Kein bestehender Pfad ändert sich — nur `server/` ist neu hinzugekommen | Jede bestehende Root-Referenz (Makefile, Docker, `vite.config.ts`, `vitest.config.ts`, `tsconfig.json`, `index.html`, README/AGENTS.md/Unraid-Doku) müsste auf `frontend/` umgestellt werden — ein großer, zu T-60 fachlich unzusammenhängender Diff |
| Modularität | Server ist bereits vollständig gekapselt (eigenes `package.json`/`tsconfig`/`tests`); die Frontend-Modularität ändert sich dadurch nicht | Kein Kapselungsgewinn gegenüber heute — das Frontend war nie mit dem Server vermischt, es zieht nur um |
| Docker-Nähe | Dockerfile Stage 1 (`COPY package.json package-lock.json ./`, `COPY . .`) bleibt unverändert | Stage 1 müsste auf `frontend/`-Pfade umgestellt werden — funktional identisch, nur mehr Änderungsfläche |
| Einfache Installation | Root bleibt der gewohnte Einstieg; die schon empfohlene `make setup`-Ergänzung um `--prefix server` reicht | Kein zusätzlicher Nutzen — die Installation bleibt zwei Schritte, nur mit geänderten Pfaden |

**Entscheidender Zusatzpunkt — Versionsquelle:** `make version`/`make tag-*`
lesen die Projektversion über BashLibs `readProjectVersion` (Auto-Detect,
Standardpfad `.`) aus der Root-`package.json` — laut deren Kommentar bewusst
die „Single Source of Truth“ (`.libs/BashLib/src/version.lib.sh:232-250`). Ein
Umzug des Frontends nach `frontend/package.json` spaltet diese Quelle auf:
entweder die Version doppelt pflegen (Root-Hülle **und** `frontend/package.json`
— verstößt gegen DRY) oder jeden Versionierungs-Makefile-Aufruf um
`auto frontend` erweitern, verstreut über mehrere Targets. Keine der beiden
Varianten bringt einen Gegenwert.

**Ergebnis:** Kein Kriterium spricht für den Umzug; jedes bringt zusätzliche,
mit T-60 unmotivierte Änderungsfläche und einen ungelösten Versionskonflikt.
Der bestehende Schnitt — etablierte App im Root, neue technische Anbindung als
klar benannter Unterordner — entspricht zudem dem Muster, das `docker/`,
`scripts/` und `unraid/` bereits im selben Repo vorgeben; `server/` fügt sich
dort ohne Bruch ein. Ein Frontend-Umzug wäre außerdem Scope-Erweiterung
gegenüber den T-60-Akzeptanzkriterien und gehörte, falls gewünscht, in ein
eigenes Ticket statt in den laufenden Diff.

### Nachtrag: Benennung `api/` statt `server/`?

Mikes Frage in der ergänzten Nachricht: bevorzugt sind `frontend/` und `api/`;
`server/` nur bei konkretem Problem mit `api/`. **Es gibt ein konkretes
Problem — `server/` bleibt.**

Das Repo hat bereits einen Ordner namens `api`: `src/api/` ist laut
`AGENTS.md` (Zeile 47) „die einzige Stelle mit `fetch`“ — der **ausgehende**
StockInfo-REST-Client (`client.ts`, `types.ts`, `mappers.ts`, `normalizers.ts`).
Ein Root-`api/` für den neuen, **eingehenden** eigenen Server hieße: zwei
gleich benannte Ordner mit entgegengesetzter Bedeutung im selben Repo — der
eine ruft eine fremde API auf, der andere ist die eigene API. Das kollidiert
nicht im Dateisystem (unterschiedliche Tiefe), aber im Vokabular jeder
zukünftigen Doku, jedes Commits und jeder Suche („welches `api/` ist gemeint?“).

Das lehnt sich an die `code-standards`-Konvention an: Ausgehende REST-Aufrufe
gehören nach `api/` bzw. `clients/`, eingehende REST-Routen in einen davon
unterschiedenen Ordner wie `routers/` — genau das setzt die T-60-Spezifikation
bereits um (`server/src/routers/` für die eingehenden Routen). Der Server
umfasst zudem mehr als nur `/api/*`: `/healthz`, statische Auslieferung und die
`/admin/users`-Weiterleitung gehören genauso dazu — „api“ beschreibt nur einen
Teil dessen, was der Ordner enthält, „server“ das Ganze.

Der URL-Pfadpräfix `/api/*` bleibt davon unberührt bestehen; nur der
Ordnername am Root folgt ihm nicht.

**Korrektur nach der Observer-Gegenprobe unten:** Der Satz oben war zu stark
formuliert. Die zitierte Regel spricht von Struktur *innerhalb* eines
eigenständigen Pakets und verbietet einen Root-Ordner `api/` nicht
ausdrücklich; `api/src/routers/` und `src/api/` wären technisch sauber
getrennt. Das ist kein Regelkonflikt, sondern eine Lesbarkeits- und
Vokabular-Abwägung — mein Rat für `server/` bleibt, aber als Empfehlung
gegen Mikes genannte Präferenz, nicht als Verstoß gegen eine feste Vorgabe.
Die Entscheidung bleibt bei Mike.

### Observer-Gegenprobe zur Benennung · 2026-09-29

Die Empfehlung für `server/` ist eine nachvollziehbare Abwägung der
Verantwortung des Ordners. Die angeführte `code-standards`-Regel verbietet ein
eigenständiges Root-Paket `api/` jedoch nicht. Unter „Technische Zugriffe
bündeln“ erlaubt sie dieselbe Struktur innerhalb eigenständiger Pakete,
solange eingehende Routen und ausgehende Clients unterscheidbar bleiben.
`api/src/routers/` und der bisherige StockInfo-Client `src/api/` wären
technisch getrennt. Die Namensähnlichkeit kann die Dokumentation erschweren;
der Server bedient zudem statische Dateien und `/healthz`. Diese Gründe sind
gegen Mikes ausdrückliche Namenspräferenz abzuwägen und nicht als zwingender
Skill-Konflikt auszugeben. Die Beratung bleibt ohne Produktfreigabe.

### Coder-Entscheidung nach Mikes Präferenz · 2026-09-29

Mike bevorzugt ausdrücklich `frontend/` und `api/` und lässt `server/` nur
bei konkreten Problemen mit `api/` zu. Claudes Einwand gegen den Namen
`api/` betrifft Lesbarkeit, keinen technischen oder verbindlichen
Regelkonflikt; die Observer-Gegenprobe bestätigt das. Der eigene HTTP-Dienst
kommt deshalb nach `api/`, mit eingehenden Routen unter
`api/src/routers/`. Der StockInfo-Client bleibt im Frontend unter
`frontend/src/api/`. Dokumentation und Befehle nennen stets den vollen Pfad.

Die bestehende Vue-App zieht nach `frontend/`, damit beide Produktteile
einen eigenen Ort haben. Der Umzug ist Teil von T-60, weil hier erstmals
ein zweiter Produktteil entsteht. Claudes Versionsquellen-Einwand wird
berücksichtigt: `package.json` im Repo-Root bleibt die einzige Quelle der
Projektversion und der Einstieg für `make` und Release-Targets. Die
Frontend-Abhängigkeiten bleiben in diesem Root-Manifest; `frontend/` erhält
keine zweite Paket- oder Versionsdatei. Build, Tests und Docker werden auf
die neuen Pfade umgestellt; die bisherige App-Funktion bleibt gleich. Dies
ist eine Entscheidung im beauftragten Umfang, keine technische Freigabe.
