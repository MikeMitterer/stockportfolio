# T-62 · Offene Browser über Depotänderungen benachrichtigen

**Rollenwechsel am 2026-10-01:** Mike hat `claude` als Coder und Owner,
`codex-verifier` als Verifier und `codex-observer` als Observer festgelegt.
Claude übernimmt Codex' unfertigen Stand im Worktree
`/private/tmp/stockportfolio-t62` auf Branch
`t-62-sse-benachrichtigung-fuer-depots`. **Die Arbeit hat damit gemischte
Autorenschaft:** API-Ereignisse, Store-Abgleich, Ladeanzeigen und die ersten
Browsertests stammen von `codex`; die Korrekturen und Ergänzungen vom
2026-10-01 unten von `claude`.

Serverseitige Speicherung allein aktualisiert eine bereits geöffnete Seite
nicht. **StockPortfolio meldet Änderungen per SSE** an andere Browser
desselben Benutzers. Die Seite lädt die Daten danach per REST neu; SSE
transportiert keine Depotinhalte. StockInfo ist an diesem Weg nicht beteiligt.

**Beispiel:** Eine Person ändert eine Zielquote am Laptop. Das bereits
geöffnete Tablet erhält ein Ereignis, ruft den neuen Stand beim
StockPortfolio-Server ab und zeigt die Quote ohne manuelles Neuladen.

**Stand am 2026-10-01:** Umsetzung abgeschlossen und an den Verifier
übergeben. Der sichtbare Smoketest `npm --prefix frontend run smoke:live-sync`
besteht alle Schritte: Live-Abgleich A → B, Kontentrennung zu C samt
erzwungenem Passwortwechsel, Backup und Restore, Unterbrechung und
Wiederverbindung, Keep-Alive über den Proxy, Konflikt und Logout.

**Für dich:** Die Fenster des bestandenen Smoketests sind noch offen und
schließen sich nach deinem OK. Der Teststack mit synthetischen Konten läuft
weiter auf 5175/8080/8899; die Zugangsdaten liegen nur im temporären
Testverzeichnis.

### Änderungen von `codex` bis 2026-09-30

- API: Ereignisverteiler je Konto, Route `/api/data/events` mit
  Sitzungsprüfung bei jedem Ereignis und 15-Sekunden-Keep-Alive; Ereignisse
  nach Commit von Speichern, Löschen, Altimport und Restore (`0bbf80b`).
- Frontend: `LiveEventsClient`, Store `liveSync` mit gezieltem REST-Nachladen,
  Abgleich bei Verbindung, Tab-Rückkehr und alle 30 s; eigenes Ereignis wird
  über die geschriebene Revision erkannt; Statuszeile meldet getrennte
  Verbindung.
- Kurs-Hinweis: Nach **Aktualisieren** in einem Fenster schreibt die App die
  Ressource `quote-refresh`; andere Fenster holen daraufhin selbst Kurse.
  **Nachweis:** nur Codex' sichtbarer Lauf am 2026-09-30 mit einem Skript
  außerhalb des Projekts (`/private/tmp/t62-browser-test/refresh.mjs`): B lud
  nach dem Kursabruf in A fünf Kurse ohne Navigation, Gesamtwert und Gruppen
  stimmten überein. Der Projekt-Smoketest deckt diesen Weg **nicht** ab, und
  Claude hat ihn am 2026-10-01 nicht erneut geprüft. Auf Hinweis von
  `codex-observer` zugeordnet; die frühere widersprüchliche Doppelaussage
  („steht aus“ / „geprüft“) ist entfernt.
- Auf Mikes Rückmeldungen: Fortschrittsleiste 4 px ohne Verschieben des
  Inhalts, kein Spinner im Aktualisieren-Knopf, Platzhalter statt Spinner beim
  ersten Laden, Anmeldeprüfung erst nach 350 ms sichtbar, Trennlinien der
  Kennzahlen bei zwei Spalten.
- Nebenbei: `docker/build.sh` ohne Bash-4-Syntax `${VAR,,}`, Teststack startet
  Vite über `node …/vite.js`, Beispieldepot-Kurse als Fixture
  `scripts/fixtures/demo-quotes.json` mit Abgleichtest.

### Änderungen von `claude` am 2026-10-01

1. **Testbruch behoben:** Die HMR-Korrektur von Codex las
   `import.meta.hot.data` ohne Prüfung; in Vitest fehlt `data`, 14 Testdateien
   brachen ab.
2. **HMR-Fehler „PrivateDataClient fehlt“ behoben:** Vite lädt abhängige
   Module wie `settings.ts` neu, ohne für `client.ts` den Dispose-Aufruf
   auszulösen. Der aktive Client steht jetzt bei jeder Änderung in
   `import.meta.hot.data`. Headless-Nachtest: drei Module per HMR ersetzt,
   danach Speichern mit PUT 200, keine Navigation, kein Seitenfehler.
3. **Wiederverbindung nach endgültig geschlossenem Stream (SP-R-04):**
   Antwortet der Server beim Wiederverbinden mit einem Fehler, etwa 502 des
   Proxys bei einem Neustart, schließt der Browser die `EventSource`
   endgültig. Bisher blieb dann nur der 30-Sekunden-Ersatzabruf bis zum
   Neuladen der Seite. `LiveEventsClient` baut den Stream jetzt nach 5 s neu
   auf, bei weiteren Fehlern mit verdoppelter Pause bis höchstens 30 s.
   Test: `tests/data/liveEvents.spec.ts`.
4. **Teststack erkannte eigene Prozesse nicht (SP-R-04, SP-R-05):** Die
   Prozesskennung enthält `ps -o lstart`, dessen Format der Spracheinstellung
   folgt. Codex startete den Stack mit englischer, Claudes Shell nutzt
   `de_AT`. `--status` meldete laufende Prozesse als beendet, `--stop` hätte
   sie stehen lassen. `ps` läuft jetzt mit `LC_ALL=C`. Die doppelte Kopie der
   Funktion in `stockinfo-test-server.py` ist entfernt; sie nutzt die aus
   `local_test_stack.py`. Der verwaiste Katalogeintrag ist mitentfernt.
   Gegenprobe: `--status` mit `de_AT` und `en_US` meldet alle drei Prozesse
   laufend.
5. **Smoketest dauerhaft im Projekt (SP-CX-04):**
   `frontend/scripts/live-sync-smoke.mjs`, Aufruf über
   `npm --prefix frontend run smoke:live-sync`. `playwright-core` ist
   Dev-Abhängigkeit des Frontends und nutzt das installierte Chrome. Fenster:
   links 80 px frei, Rest 50:50 auf dem Hauptbildschirm (Screen-Details-API;
   `window.screen` meldete den kleineren Zweitmonitor). Die Fenster bleiben
   bis Enter offen.
6. **Gesamtwert-Kennzahl auf Mikes Rückmeldung:** Die Verlaufsgrafik steht
   rechts neben dem Betrag; statt „Basiswährung: EUR“ steht „EUR“ mit
   Fragezeichen. Dessen Hinweis verweist auf **Einstellungen → Daten**, wo
   die Basiswährung je Depot gesetzt wird. Die Karte ist kein `<button>` mehr,
   weil ein Verweis darin verschachtelte Bedienung wäre; Knopf ist die Gruppe
   aus Grafik und Pfeil, ein Klick auf die Karte klappt weiterhin auf.
   Headless geprüft bei 1440, 1024, 768 und 390 px: Hover öffnet den Hinweis
   ohne Aufklappen, Klick und Enter schalten `aria-expanded`.

**Springender Inhalt nach Enter (Mikes Beobachtung):** Mit Layout-Shift-Messung
in A und B nicht reproduzierbar. Sechs gespeicherte Stückzahländerungen
ergaben je Fenster höchstens 0,0003 (sichtbar störend ab etwa 0,1).
Wahrscheinliche Ursache waren Claudes gleichzeitige Codeänderungen, die Vite
per HMR in die offenen Fenster übertrug. Bleibt das Springen in frisch
geöffneten Fenstern, ist es neu zu untersuchen.

**Native Datei-Dialoge:** Der Smoketest bedient sie nicht. Der Download wird
von Playwright direkt abgefangen, die Datei für den Restore direkt in das
Dateifeld gesetzt. Geprüft ist der App-Weg von der Datei bis zur Anzeige in
B, nicht der Dialog des Betriebssystems.

## Für dich

### Nach der technischen Übergabe

Der Coder stellt eine isolierte Testinstanz mit zwei Testkonten bereit und
dokumentiert ihre URL. Zwei Browser oder Browserprofile auf getrennten
Geräten können denselben Testbenutzer öffnen. Keine echten Depots verwenden.

| Frage | Prüfpunkt # | Handgriff | Dein Urteil | Human |
|---|---|---|---|---|
| A · Live-Abgleich | [1](#pruefpunkt-1) | Dasselbe Testdepot in zwei Browsern öffnen, in Browser A eine Zielquote ändern | Erscheint die Änderung in B ohne manuelles Neuladen? | |
| B · Trennung | [2](#pruefpunkt-2) | Browser C mit anderem Testkonto öffnen und in A eine weitere Änderung speichern | Bleibt C unverändert und ohne fremde Meldung? | |

## Umsetzung und technische Nachweise

| Repo | Umfang | GH-Issue |
|---|---|---|
| StockPortfolio | Benutzergebundene SSE-Ereignisse und REST-Nachladen im bestehenden Container | — |

### Schnitt und Abhängigkeiten

1. Browser speichern ausschließlich über die REST-API aus T-61. Erst nach
   erfolgreichem Datenbank-Commit sendet der StockPortfolio-Server ein
   Ereignis mit Ressourcentyp, Kennung und neuer Revision an Sitzungen
   **desselben Kontos**. Weder Positionen noch Passwort- oder Sitzungsdaten
   stehen im Ereignis.
2. Der Browser vergleicht die Revision und lädt nur betroffene Daten per
   REST neu. Ein Ereignis ist ein Hinweis, kein zweiter Speicherweg. Der
   schreibende Browser darf sein eigenes Ereignis ignorieren, wenn seine
   lokale Revision bereits aktuell ist.
3. Beim Öffnen, Wiederverbinden, Wiedererscheinen des Tabs und nach einer
   verpassten Verbindung wird der maßgebliche Stand über REST geprüft.
   Ausfall der SSE-Verbindung darf nicht dauerhaft unbemerkt zu einem
   veralteten Stand führen; der Zustand oder ein Ersatzabruf macht das klar.
   Alle 15 Sekunden sendet der Server einen SSE-Kommentar als Keep-Alive.
4. Der Ereignisstrom prüft die Sitzung wie jede private API. Logout,
   Deaktivierung und abgelaufene Sitzung schließen den Strom. Die
   Sitzungsprüfung erfolgt auch bei jedem Keep-Alive. Ein Nutzer
   erhält keine Ereignisse oder Kennungen eines anderen Nutzers.
5. Gleichzeitige Bearbeitungen bleiben durch die T-61-Revisionen geschützt.
   Ein Ereignis hebt einen sichtbaren Konflikt nicht stillschweigend auf.
   Reverse-Proxy- und Containerbetrieb mit dauerhafter SSE-Verbindung
   werden dokumentiert und in der Testumgebung geprüft.

### Akzeptanzkriterien

- [ ] Zwei offene Browser desselben Kontos zeigen gespeicherte Änderungen
  ohne manuelles Neuladen; der eigentliche Datentransfer erfolgt per REST.
- [ ] Ereignisse werden nur nach erfolgreichem Commit und nur an denselben
  Benutzer gesendet; fremde Konten erhalten nichts.
- [ ] Nach Unterbrechung und Wiederverbindung wird der aktuelle Serverstand
  geladen, auch wenn ein Ereignis verloren ging.
- [ ] Logout oder Sitzungsablauf beendet den Zugriff auf Ereignisse und Daten.
- [ ] Ein veralteter Schreibstand wird weiterhin als Konflikt behandelt.

### Verify

Isolierter StockPortfolio-Server mit zwei Konten und drei Browserkontexten;
Netzunterbrechung im Browser simulieren. Kein echter StockInfo-Aufruf in
Tests. SSE- und REST-Antworten enthalten keine fremden Depotdaten.

Legende: ✅ live bestätigt · ⚠️ mit Einschränkung · ◑ teilweise ·
➖ noch kein Live-Nachweis. `AI` wird erst nach der Prüfung gesetzt.

| # | Handgriff | Nachweis | AI |
|---|---|---|:--:|
| 1 | <a id="pruefpunkt-1"></a>In Browser A schreiben, Browser B offen lassen | Ereignis nach Commit; B lädt gezielt per REST und zeigt den neuen Wert | ✅ |
| 2 | <a id="pruefpunkt-2"></a>Mit anderem Konto C mithören und A ändern | C bekommt weder Ereignis noch fremde Kennung oder Daten | ✅ |
| 3 | SSE trennen, währenddessen ändern, wieder verbinden und Keep-Alive hinter dem Proxy prüfen | B lädt den neuesten Stand; verpasste Ereignisse gehen nicht als Zustand verloren; Verbindung bleibt auch ohne Nutzereignisse offen | ✅ |
| 4 | Schreibkonflikt, Logout und Sitzungsablauf während offenem Stream prüfen | Konflikt sichtbar; privater Stream endet oder weist spätestens beim nächsten Keep-Alive Zugriff ab | ⚠️ |
| 5 | `make test`, `npm --prefix frontend run lint`, `npm --prefix api run lint`, `npm --prefix frontend run typecheck`, `npm --prefix api run typecheck`, Build, Browser- und Doku-Abgleich | Ergebnisse und mögliche Bestandsfehler sind konkret dokumentiert | ✅ |
| 6 | In A sichern, die Hälfte der Positionen löschen, Sicherung wieder einspielen | B zeigt erst den reduzierten, dann den vollständigen Stand ohne Seiten-Refresh | ✅ |

**Prüfstand 2026-10-01 (`claude`, Worktree `/private/tmp/stockportfolio-t62`):**

- `make test`: 825 Frontend- und 19 API-Tests grün.
- `npm --prefix frontend run lint`, `npm --prefix api run lint`: ohne Befund.
- `npm --prefix frontend run typecheck`, `npm --prefix api run typecheck`: ohne Befund.
- `npm --prefix frontend run build`: grün (bekannte Chunk-Größen-Warnung).
- Sichtbarer Smoketest, dritter Lauf, alle Schritte bestanden:
  Prüfpunkt 1/2 (A → B ohne Refresh, C ohne Ereignis und Daten),
  Backup/Restore (B zeigt 3 statt 6, danach wieder 6 Positionen),
  Prüfpunkt 3 (B zeigt die Unterbrechung, verbindet sich nach 502 selbst
  wieder und lädt den verpassten Stand; Stream über den Vite-Proxy 35 s mit
  2 Keep-Alives offen), Prüfpunkt 4 (veralteter Schreibstand → 409 und
  sichtbarer Konflikt, der nach dem Nachladen stehen bleibt; Stream endet
  15,0 s nach Logout, Datenabruf danach 401).
- **Grenze zu Prüfpunkt 4:** Den Sitzungsablauf prüft nur der API-Weg; er
  läuft über dieselbe Sitzungsprüfung bei Ereignis und Keep-Alive wie der
  Logout. Ein abgelaufener Sitzungszeitpunkt wurde im Browser nicht erzeugt.
- **Grenze zu Prüfpunkt 3:** Der Proxy ist Vites Entwicklungsproxy, kein
  nginx oder Unraid-Proxy. Die Konfiguration eines echten Reverse-Proxys ist
  dokumentiert, nicht geprüft.

### Doku-Abgleich

Inventar: `README.md`, `docker/README.md`, `unraid/README.md`, `AGENTS.md`,
`docs/`, zentrale Unraid-Vorlage.

- `README.md` **Where the data lives**: Live-Abgleich, Kurs-Hinweis und jetzt
  auch Restore in anderen Fenstern. **Setup**: neuer Absatz zum Smoketest
  samt Aufruf und Umfang. **Docker**: Reverse-Proxy-Anforderung für den Stream.
- `docker/README.md` **Configuration**: Live-Abgleich und Proxy wie oben.
  **Data and backups**: Restore erscheint in anderen offenen Browsern ohne
  Neuladen. Die gemeinsamen Aussagen beider READMEs stimmen überein; der
  Smoketest steht nur im Projekt-README, weil er Entwicklern dient.
  Hub-Vorschau geprüft: 10.423 Bytes, unter der Grenze von 25.000.
- `unraid/README.md` **Configuration**: Proxy-Hinweis für den Stream (Codex).
- `AGENTS.md` **Bauen und prüfen**: Smoketest-Aufruf und Fensteranordnung.
- `docs/`: keine Aussage zum Live-Abgleich betroffen.
- **Offen:** Die zentrale Vorlage
  `/Volumes/DevLocal/DevUnraid/Production/Templates/templates/stockportfolio.xml`
  nennt den Reverse-Proxy, aber nicht, dass der SSE-Stream ungepuffert
  durchgereicht werden muss. Sie liegt in einem eigenen Repository; die
  Ergänzung ist nicht vorgenommen und braucht Mikes Entscheidung.
- Keine Board- oder Lessons-Konventionsänderung; kein Nachtrag im Skill
  `task-verification-workflow`.

### Lessons

Gelesen vor Umsetzung und Übergabe: alle lokalen Lessons unter
`.agents/lessons/` (Stand 2026-10-01). Einschlägig:
[SP-R-04](../.agents/lessons/SP-R-04-erkannte-potenzielle-fehler-beheben-scout-rule.md)
(Wiederverbindung nach `CLOSED`, `ps`-Sprache als potenzielle Fehler behoben, Punkte 3 und 4),
[SP-R-05](../.agents/lessons/SP-R-05-nach-dem-stopp-alle-reste-der-gestarteten-prozesse-pruefen.md)
(Statusprüfung in zwei Sprachen),
[SP-CX-04](../.agents/lessons/SP-CX-04-wiederverwendete-pruefhilfen-vom-ticket-lebenszyklus-loesen.md)
(Smoketest unter `frontend/scripts/`, nicht im Ticket- oder Temp-Ordner),
[SP-CX-07](../.agents/lessons/SP-CX-07-entfernen-mit-aufruferinventar-abschliessen.md)
(entfernte `process_identity`-Kopie: keine weiteren Aufrufer, Katalogeintrag
„Process inspection failed“ mitentfernt; `dispose`-Weg in `client.ts` ohne
Restaufrufer),
[SP-CX-01](../.agents/lessons/SP-CX-01-einfache-startbefehle-nicht-zu-einem-eigenen-system-ausbauen.md)
(ein Skript, ein npm-Aufruf, keine eigene Testsuite). Kein neuer Lessons-Eintrag.

### Side-Effects

Jeder offene Browser hält eine dauerhafte Verbindung zum StockPortfolio-Server.
Ein vorgeschalteter Proxy muss sie durchreichen; bei Verbindungsabbruch lädt
die App nach dem Wiederverbinden neu. Die SSE-Nachricht ersetzt weder
Versionsprüfung noch die Datenbank-Sicherung.

Das Keep-Alive-Intervall und die Sitzungsprüfung sind in der
[T-60-Architekturspezifikation](../../docs/superpowers/specs/2026-09-29-stockportfolio-server-design.md#verbindliche-grenzen-für-t-61-und-t-62)
entschieden. Der Proxy muss Streaming ohne Pufferung und ein längeres
Idle-Timeout erlauben. Die Konzeptprüfung unten hält den früher offenen
Stand fest; die Produktnachweise stehen im Prüfstand oben.

## Konzeptprüfung Runde 1

`claude`, 2026-09-28, an Handoff-Commit `6a33e6fb72a27cb46edcaa82361004b9b0854b9e`.
Teil derselben Kettenprüfung wie
[T-60](T-60-stockportfolio-server-und-benutzerkonten.md#konzeptprüfung-runde-1).
Kein Produktcode vorhanden, keine technische Freigabe.

**SSE-Zustellung:** Sauber auf „Hinweis, kein zweiter Speicherweg“ begrenzt —
das Ereignis enthält nur Ressourcentyp, Kennung und Revision, keinen
Positions-, Passwort- oder Sitzungsinhalt; der eigentliche Datentransfer
bleibt REST mit den T-61-Revisionen. Die Sitzungsprüfung wird von T-61
übernommen statt neu erfunden. Kein Befund.

**Wiederverbindung — offene Entscheidung:** Punkt 3 verlangt, dass ein
SSE-Ausfall nicht „dauerhaft unbemerkt zu einem veralteten Stand“ führt, und
verlässt sich dafür auf Öffnen/Wiederverbinden/Tab-Sichtbarkeit als Auslöser
für einen REST-Abgleich. Nicht benannt ist ein **Keep-Alive/Heartbeat** der
SSE-Verbindung selbst: Reverse-Proxies (z. B. nginx in Standardkonfiguration)
schließen idle gehaltene Verbindungen häufig nach kurzer Zeit, ohne dass
Browser oder App das sofort bemerken, solange der Tab nicht sichtbar
wechselt. Die Side-Effects benennen den Proxy als Betriebsvoraussetzung,
aber nicht diese konkrete Gefahr. Für die Spezifikation empfehlenswert:
periodische serverseitige Keep-Alive-Events oder eine vergleichbare
Absicherung, statt sich allein auf Sichtbarkeits-/Öffnen-Ereignisse zu
verlassen.

**Trennung/Datenschutz im Stream:** Ein Konto erhält nur eigene Ereignisse;
Logout, Deaktivierung und abgelaufene Sitzung beenden den Strom. Mit
Prüfpunkt B (Handgriff mit fremdem Konto C) menschlich testbar angelegt.
Kein Befund.

### Gesamturteil zur Kette T-60–T-62

Der Zuschnitt ist tragfähig, die Reihenfolge stimmt, StockInfo bleibt sauber
getrennt, und die sicherheitsrelevanten Kernentscheidungen (Sitzungen statt
Tokens, serverseitige Eigentümerprüfung, Revisionen/Konflikte,
ereignisarmer Datentransport über SSE) sind konzeptionell richtig gewählt.
Vor dem ersten Produktedit sollte die in T-60 angekündigte
Architektur-Spezifikation zusätzlich zu den dort bereits genannten Punkten
folgende offene Entscheidungen mitregeln: Login-Rate-Limit
([T-60](T-60-stockportfolio-server-und-benutzerkonten.md#konzeptprüfung-runde-1)),
Cookie-Flags/HTTP-Verhalten (T-60), Selbstdeaktivierung eines Admins (T-60),
Schutz gegen mehrfache Altbestandsübernahme
([T-61](T-61-benutzergebundene-depotdaten-per-rest.md#konzeptprüfung-runde-1)),
konkrete Reichweite der Cache-Bereinigung beim Logout/Kontowechsel (T-61) und
SSE-Keep-Alive gegen Proxy-Timeouts (oben). Keiner dieser Punkte stellt den
gewählten Ansatz infrage; alle sind vor der Umsetzung entscheidbar.

Dies ist eine konzeptionelle Einschätzung ohne Codeprüfung — kein bestandener
Produkttest, keine technische Umsetzungsfreigabe und kein menschlicher
Ticketabschluss. Rückgabe an den Coder über STATUS-INBOX.

### Observer · Lessons-Einordnung zur Konzeptprüfung

Die offenen Entscheidungen zu Anmeldung, Browserdaten, Altbestandsübernahme
und SSE sowie der fehlende menschliche Export-/Restore-Prüfpunkt in T-61 sind
konkrete Lücken dieser ersten Konzeptfassung. Es gibt dazu weder zwei
unabhängige belegte Fehlervorfälle noch eine falsche Behauptung über bereits
geprüftes Produktverhalten; sie bleiben deshalb Einzelfälle in den betroffenen
Tickets und erzeugen keine neue Lesson. Die vorhandene Gegenprobe
[SP-CX-02](../.agents/lessons/SP-CX-02-entscheidungen-in-allen-aktuellen-aussagen-nachziehen.md)
wurde im Review für die Übereinstimmung von Ticket und STATUS angewendet.
[SP-R-02](../.agents/lessons/SP-R-02-pruefaussagen-den-tatsaechlich-ausgefuehrten-schritten-zuordnen.md)
ist ebenfalls erfüllt: Claudes Urteil grenzt Konzept, Codeprüfung und
Produkttest ausdrücklich voneinander ab. Fassung der beiden Lessons: Stand
2026-09-28; kein Lessons-Nachtrag nötig.
