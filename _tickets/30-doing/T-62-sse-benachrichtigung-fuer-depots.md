# T-62 · Offene Browser über Depotänderungen benachrichtigen

**Rollenwechsel am 2026-10-01:** Mike hat `claude-coder` als Coder und Owner,
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

**Stand am 2026-10-01:** Die technische Prüfung in Runde 1 verlangt Nacharbeit
am Kurs-Hinweis. Der sichtbare Smoketest
`npm --prefix frontend run smoke:live-sync`
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
  **Nachweis:** Codex' sichtbarer Lauf am 2026-09-30 mit einem Skript
  außerhalb des Projekts (`/private/tmp/t62-browser-test/refresh.mjs`): B lud
  nach dem Kursabruf in A fünf Kurse ohne Navigation, Gesamtwert und Gruppen
  stimmten überein. Seit der Nacharbeit zu Runde 1 deckt auch der
  Projekt-Smoketest diesen Weg ab (siehe dort). Auf Hinweis von
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
- Zentrale Vorlage
  `/Volumes/DevLocal/DevUnraid/Production/Templates/templates/stockportfolio.xml`:
  Auf Mikes Auftrag vom 2026-10-01 ergänzt die `Overview` den Satz „Behind a
  reverse proxy, the live update stream must not be buffered; nginx-based
  proxies handle this automatically.“ Begründung: Die Konto-API sendet
  `X-Accel-Buffering: no`, nginx schaltet das Puffern damit selbst ab.
  `xmllint --noout` ohne Befund; Commit `c828e24` im Templates-Repo auf
  `t-60-stockportfolio-template`, nicht gepusht.
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

## Technische Prüfung Runde 1

`codex-verifier`, 2026-10-01, Übergabefassung `625e22d28f33dcfc75fdc72327ede4ec7c4d1073`.
Nachfolgende Commits bis zur Prüfung änderten nur Ticket und STATUS; der
Produktstand blieb stabil. **Urteil: Nacharbeit erforderlich.** Keine
menschliche Abnahme und kein Ticketabschluss.

**Eigene Prüfungen:** `make test` mit 825 Frontend- und 19 API-Tests,
beide Lints, beide Typprüfungen, `npm --prefix frontend run build` und
`git diff --check 749743b..625e22d` mit Exitcode 0. Der Build meldet die
bekannte Warnung zum großen UI-Chunk. API-Ereignisweg, Sitzungsprüfung beim
Keep-Alive, Frontend-Wiederverbindung, 30-Sekunden-Ersatzabruf,
Konfliktanzeige und die zugehörigen Tests wurden am Quellstand geprüft.
`README.md`, `docker/README.md`, `unraid/README.md` und die zentrale
Unraid-Vorlage wurden inhaltlich verglichen; die Aussagen zum Stream und
Proxy widersprechen sich nicht. Die offene Übernahme der Board-Konventionen
bleibt in STATUS sichtbar; daraus wurde kein zusätzlicher Auftrag abgeleitet.

**Grenze des eigenen Nachweises:** Der sichtbare Browser-Smoketest und die
KPI-Darstellung bei 390/1440 px stammen aus den ausdrücklich zugeordneten
Coder-Belegen; ich habe sie in dieser Runde nicht selbst im Browser
wiederholt. Die Playwright-Fenster waren über die verfügbare Browseransicht
nicht erreichbar. Ein echter nginx-/Unraid-Proxy und ein im Browser
herbeigeführter Sitzungsablauf sind auch in den Coder-Belegen nicht geprüft.
Die statische KPI-Prüfung bestätigt Knopf, `aria-expanded` und den getrennten
Info-Hinweis; sie ersetzt keinen eigenen visuellen Vergleich nach SP-R-03.

### Befund 1 · Kurs-Hinweis verliert nach erlaubtem Löschen seine Revision

Die neue Ressource `quote-refresh/current` läuft durch den generischen
DELETE-Weg in `api/src/routers/api.ts:267` und darf mit gültiger Revision
gelöscht werden. Ein späterer PUT legt sie mit Revision 1 neu an. Ein bereits
offenes Fenster merkt sich in `frontend/src/stores/liveSync.ts:42` und `:90`
die frühere höhere Revision. Sowohl das SSE-Ereignis als auch der regelmäßige
Abruf des Hinweises werden bei `:47` und `:88` verworfen, solange die neue
Revision nicht höher ist. Der 30-Sekunden-Ersatzabruf lädt Kurse dann nur
nach der normalen Schonfrist (Vorgabe: 60 Minuten), obwohl ein anderes
Fenster ausdrücklich **Aktualisieren** gedrückt hat.

**Gegenprobe:** Isolierter API-Aufruf mit temporärer SQLite-Datenbank:
`PUT` erzeugte Revision 1, der nächste `PUT` Revision 2, `DELETE` antwortete
200, und ein neuer `PUT` erzeugte wieder Revision 1. Der Lauf gab
`{"first":1,"second":2,"deleteStatus":200,"recreated":1}` aus. Keine
Produktdatei wurde für diese Probe geändert.

**Erwartete Korrektur:** Das Löschen des internen Kurs-Hinweises verhindern
oder seine Revisionsfolge auch nach Löschen monoton halten. Eine Gegenprobe
soll DELETE und anschließenden Refresh sowie die Reaktion eines bereits
offenen Fensters abdecken. Der Fehlerpfad ist über die Konto-API tatsächlich
erreichbar; gemäß SP-R-04 bleibt er blockierend, auch wenn die aktuelle
Oberfläche keinen Löschen-Knopf dafür anbietet. Der Befund gehört zum
bestehenden Muster SP-R-04 (Stand 2026-09-30); keine neue Lesson-ID.

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

## Nacharbeit zu Runde 1

`claude-coder`, 2026-10-01, zu [Befund 1](#befund-1--kurs-hinweis-verliert-nach-erlaubtem-löschen-seine-revision).

**Ursache bestätigt:** `DELETE /api/data/quote-refresh/current` lief durch den
allgemeinen Löschweg. Ein späterer `PUT` legte die Ressource mit Revision 1
neu an; offene Fenster verglichen auf „höher als bekannt“ und ignorierten
den Hinweis.

**Korrektur:**

1. `api/src/routers/api.ts`: Der Löschweg weist `quote-refresh` mit
   `405 not_deletable` ab, bevor die Datenbank berührt wird. Andere Wege
   löschen die Ressource nicht: `restoreBackup` und `importLegacy` entfernen
   nur `portfolio`, `allowlist` und `snapshots`; das Löschen eines Kontos
   entfernt das Konto selbst.
2. `frontend/src/stores/liveSync.ts` (SP-R-04, verwandter Pfad): Das Fenster
   vergleicht die Revision des Hinweises auf Gleichheit statt auf „höher“.
   Fällt sie auf dem Server zurück, etwa nach dem Zurückspielen einer älteren
   Datenbank unter `/data`, reagiert ein offenes Fenster trotzdem. Die eigene
   Revision nach dem Schreiben wird direkt übernommen statt per `Math.max`.

**Tests:**

- `api/tests/events.spec.ts` „lässt den internen Kurs-Hinweis nicht löschen,
  damit seine Revision weiterzählt“: Revision 1 → 2, DELETE → 405
  `not_deletable`, nächster PUT → 3 und SSE-Ereignis mit Revision 3. Vor der
  Korrektur rot (DELETE 200).
- `frontend/tests/stores/liveSync.spec.ts` „folgt dem Kurs-Hinweis auch, wenn
  seine Revision auf dem Server zurückfällt“: Revision 5, dann 1 lädt erneut
  Kurse, eine wiederholte 1 nicht. Vor der Korrektur rot.

**Gegenprobe mit offenem Fenster:** Neuer Schritt im sichtbaren Smoketest,
Teststack frisch gestartet (alter Stopp ohne Reste, nur fremde
`overmind`-Verzeichnisse vom 2026-09-30 im Temp-Verzeichnis): In A ergab
der DELETE-Versuch 405; nach **Aktualisieren** in A holte das offene Fenster
B 5 Kurse ohne Seiten-Refresh. Alle übrigen Schritte des Smoketests
bestanden erneut (Live-Abgleich, Kontentrennung mit Passwortwechsel,
Backup/Restore 3 → 6 Positionen, Unterbrechung und Wiederverbindung,
2 Keep-Alives in 35 s, Konflikt bleibt sichtbar, Stream endet 15,0 s nach
Logout, danach 401).

**Prüfungen:** `make test` mit 826 Frontend- und 20 API-Tests grün; beide
Lints und beide Typprüfungen ohne Befund; `npm --prefix frontend run build`
grün (bekannte Chunk-Warnung); `git diff --check` ohne Befund.

**Doku-Abgleich:** `README.md` **Setup** nennt den Kurs-Hinweis jetzt unter
den Smoketest-Schritten. Der Löschschutz ist ein internes API-Detail; keine
Anleitung beschreibt das Löschen von Ressourcen, daher bleiben
`docker/README.md`, `unraid/README.md` und die Unraid-Vorlage unverändert.

**Lessons:** SP-R-04 (Löschpfad und zurückfallende Revision behoben, Tests
für beide Seiten), SP-R-05 (Temp-Inventar nach dem Stopp). Kein neuer Eintrag.
