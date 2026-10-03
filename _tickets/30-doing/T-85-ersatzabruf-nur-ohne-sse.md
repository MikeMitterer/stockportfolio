# T-85 · Ersatzabruf des Live-Abgleichs nur ohne SSE-Verbindung

**Warum dieses Ticket:** Jedes offene Fenster lädt Depot und Einstellungen
alle 30 Sekunden neu, auch wenn der SSE-Strom steht und jede Änderung ohnehin
meldet. Das kostet Abrufe und war der Auslöser, der den Reiterfehler aus
T-83 sichtbar gemacht hat.

**Beispiel:** Mike hat StockPortfolio in einem einzigen Fenster offen. Die
SSE-Verbindung steht. Trotzdem lädt die App alle 30 Sekunden alles neu.
Danach soll sie bei stehender Verbindung nur auf SSE-Ereignisse reagieren und
den Ersatzabruf erst dann nutzen, wenn die Verbindung fehlt.

**Stand:** Angelegt am 2026-10-03 auf Mikes Auftrag („ja, leg ein Ticket an
und setz es um“, nach „Dazu haben wir ja SSE eingeführt“). Die Umsetzung
beginnt nach dem Prüfurteil zu T-83, weil der Verifier den im Root
ausgecheckten Stand prüft. Am 2026-10-03 nach T-83s Freigabe auf Branch
`t-85-ersatzabruf-nur-ohne-sse` aktiviert, umgesetzt und nach Nacharbeit in
Runde 4 technisch freigegeben. Mikes Abnahme steht aus.

## Ausgangslage (claude-coder, 2026-10-03)

- `stores/liveSync.ts` startet mit dem SSE-Strom einen festen Timer:
  `setInterval(() => queue(refreshAll, true), fallbackMs)`, `fallbackMs =
  30_000`. Er läuft unabhängig vom Verbindungszustand.
- Herkunft: T-62 verlangt, dass ein SSE-Ausfall nicht dauerhaft unbemerkt zu
  einem veralteten Stand führt. Anfangs schloss der Browser einen abgebrochenen
  Strom bei einem Fehler beim Wiederverbinden endgültig; dann blieb nur der
  Ersatzabruf.
- Seither vorhanden: `LiveEventsClient` verbindet sich selbst neu (5 s, dann
  verdoppelt bis 30 s); nach jedem Verbinden lädt die App den Stand einmal
  neu (`connected` → `refreshAll`); beim Wiedererscheinen des Tabs ebenso;
  der Server sendet alle 15 s ein Keep-Alive.

## Was zu tun ist

- Der Ersatzabruf läuft nur, solange der Zustand nicht `connected` ist
  (`connecting` oder `disconnected`). Steht die Verbindung, endet er; reißt
  sie ab, beginnt er wieder.
- Unverändert bleiben: Neuladen nach jedem (Wieder-)Verbinden, beim
  Wiedererscheinen des Tabs und auf SSE-Ereignisse; Wiederverbinden mit
  Pause; Abmelden beendet alles.
- Doku: README und `docker/README.md` beschreiben den Live-Abgleich; Aussagen
  zum regelmäßigen Abruf angleichen.

### Akzeptanzkriterien

- [x] Test: Bei stehender Verbindung löst der Ablauf von 30 s keinen
      Ersatzabruf aus; im Zustand `disconnected` weiterhin.
- [x] Test: Nach dem Wiederverbinden lädt die App einmal neu und der
      Ersatzabruf endet.
- [x] Die bestehenden Live-Abgleich-Tests bleiben grün; der T-62-Test zum
      scheinbar verbundenen Stream ist nach Mikes Entscheidung umgeschrieben.
- [x] **Sichtbare Prüfung** mit dem Live-Abgleich-Smoketest
      (`smoke:live-sync`) gegen den Teststack.
- [x] Doku-Abgleich: README und `docker/README.md` gemeinsam geprüft.

### Side-Effects

Weniger Abrufe bei stehender Verbindung. Fällt der SSE-Strom aus, verhält
sich die App wie bisher.

## Entscheidung (Mike, 2026-10-03)

Ein bestehender Test aus T-62 (`625e22d`) verlangte, dass der Ersatzabruf
auch bei **scheinbar** stehender SSE-Verbindung verpasste Änderungen
nachholt. Auf Nachfrage mit drei Optionen (SSE vertrauen / langsamer Abruf bei
Verbindung / nur bei Änderung neu laden) hat Mike gewählt: **„SSE vertrauen
(Empfohlen)“**. Bei stehender Verbindung gibt es keinen Ersatzabruf mehr;
abgedeckt bleiben ein toter Strom (Keep-Alive alle 15 s, Wiederverbinden mit
einmaligem Neuladen) und die Rückkehr zum Tab. Die T-62-Zusage für „Verbindung
offen, Ereignis fehlt“ entfällt.

## Review-Verlauf (neueste Runde zuerst)

### Lessons-Hinweis · claude-coder · 2026-10-03

Der Verifier hat jede Runde eingeordnet (SP-R-04). Für den Observer: Drei
Befunde in Folge (R1 Abruffehler schaltet den Ersatzabruf ein, R2 No-op-
Ereignis hebt die Warnung auf, R3 Testmock bleibt aktiv) betrafen dieselbe
neue Zustandslogik. Gemeinsames Muster bei R1 und R2: Eine Zustandsänderung
wurde nur am beabsichtigten Ereignispfad geprüft, nicht an allen Pfaden, die
`queue()` und `setStatus()` erreichen. Ob daraus eine Lesson mit
Vorbeugungsregel (alle Ereignispfade einer Zustandsänderung als Tabelle
durchgehen) wird, entscheidet `codex-observer`.


### Technische Prüfung Runde 4 · codex-verifier · 2026-10-03 · freigegeben

Geprüft wurde die Übergabefassung `ebf7af7`. Die einzige Codeänderung
dieser Runde betrifft den Regressionstest: `console.error` wird im `finally`
mit `mockRestore()` wiederhergestellt. Eine von mir temporär am Dateiende
ergänzte Gegenprobe `vi.isMockFunction(console.error) === false` lief nach
allen zehn vorhandenen Tests grün (11/11, Exit 0). Dieselbe Gegenprobe war
in Runde 3 vor der Korrektur rot. Sie wurde wieder entfernt; der Test ist
byte-gleich zur übergebenen Fassung. Store und übriger Produktcode sind
gegenüber der fachlich geprüften Runde 3 unverändert.

Die Pflichtprüfungen des Coders für `ebf7af7` sind im Abschnitt direkt
darunter belegt: `make test` 868 Frontend- und 20 API-Tests, Lint und
Typprüfung beider Pakete, jeweils Exit 0. Mein unabhängiger Gesamtlauf in
Runde 3 war ebenfalls grün. Ein erneuter Browserlauf ist für die reine
Testbereinigung nicht erforderlich; der sichtbare Smoketest aus Runde 3
hatte Exit 0. `README.md` und `docker/README.md` enthalten unveränderte,
übereinstimmende Aussagen zum Live-Abgleich. Die Setup-Code-Hilfetexte
gehören nach Mikes Entscheidung zu T-86.

**Urteil:** T-85 ist technisch freigegeben. Das ist weder Mikes Abnahme noch
der Ticketabschluss. Die Integration nach `master` und die Rückkehr des
Projekt-Roots auf `master` liegen beim Owner gemäß AGENTS.md; T-86 folgt
danach.

**Lessons:** SP-R-04 wurde an den Befunden der Runden 1 bis 3 angewendet.
Die Testressourcen-Lücke aus Runde 3 ist behoben; der Observer ordnet einen
etwaigen wiederverwendbaren Nachtrag ein. Keine neue Lesson wird hier
behauptet.

### Nacharbeit Runde 4 · claude-coder · 2026-10-03

**Testbefund aus Runde 3 · `console.error` blieb gemockt:** behoben.
Der Regressionstest „startet den Ersatzabruf nicht, wenn bei stehendem Stream
ein Datenabruf fehlschlägt (T-85)“ hält den Spy jetzt als `consoleError` und
stellt ihn im `finally` mit `mockRestore()` wieder her, auch wenn der Test
abbricht. Produktcode unverändert gegenüber `e1a948f`.

**Gegenprobe** (vorübergehender Probe-Test direkt danach,
`expect(vi.isMockFunction(console.error)).toBe(false)`, danach entfernt):

| Stand | Ergebnis | Exit |
|---|---|---|
| vor der Korrektur | Probe rot („PROBE: console.error ist nach dem vorigen Test wieder echt“) | 1 |
| nach der Korrektur | alle 11 grün | 0 |

**Inventar:** In den in dieser Sitzung angelegten oder geänderten Testdateien
gibt es keinen weiteren `vi.spyOn(console, …)`; `dashboardRemount.spec.ts`
räumt mit `vi.restoreAllMocks()` im `afterEach` auf.

**Pflichtprüfungen:** `make test` Exit 0 (Frontend 84 / 868, API 5 / 20);
Lint und Typecheck für Frontend und API je Exit 0; `git diff --check` ohne
Befund. Kein Smoketest-Lauf nötig: Nur ein Test hat sich geändert.

**Doku-Abgleich:** keine Änderung; nur Testcode betroffen.


### Technische Prüfung Runde 3 · codex-verifier · 2026-10-03 · Rückgabe

Geprüft wurde `e1a948f`. Befund 3 aus Runde 2 ist behoben: Ein irrelevantes
oder einzelnes SSE-Ereignis hebt die Warnung nicht mehr auf; nur ein
erfolgreicher Gesamtabgleich tut das. `make test` lief mit 84/868 Frontend-
und 5/20 API-Tests grün; Frontend-Lint und Typprüfung ebenfalls. Der
übergebene Store und sein Test waren im Arbeitsbaum gegenüber `e1a948f`
unverändert. Die sichtbare Browserprüfung aus der Übergabe meldet Exit 0;
ich habe sie in dieser Runde nicht selbst wiederholt. Die Aussagen in
`README.md` und `docker/README.md` zum Live-Abgleich blieben unverändert
und stimmen überein.

**Befund 4 · blockierend: Test unterdrückt spätere Konsolenfehler.** Der in
Runde 2 ergänzte Regressionstest ersetzt `console.error` über
`vi.spyOn(...).mockImplementation(...)`, stellt den Spy in seinem `finally`
aber nicht wieder her. Die Datei hat kein `vi.restoreAllMocks()` in
`afterEach`, und die Vitest-Konfiguration aktiviert `restoreMocks` nicht.
Der Mock bleibt für die folgenden acht Tests derselben Datei aktiv und kann
deren Fehlerausgaben verbergen.

**Gegenprobe:** Ein temporär am Dateiende ergänzter Test erwartete nach den
zehn vorhandenen Tests `vi.isMockFunction(console.error) === false`.
Beobachtet wurde `true`, Exit 1; alle zehn vorhandenen Tests waren grün.
Der temporäre Test wurde anschließend entfernt, die Datei ist wieder
byte-gleich zur Übergabe. Erwartete Nacharbeit: Den Spy auch bei
Testabbruch zuverlässig wiederherstellen und die gleiche Gegenprobe danach
grün ausführen. Eine neue dauerhafte Prüfung ist für diese kleine
Testbereinigung nicht nötig.

**Lessons-Einordnung:** SP-R-04 angewendet: Ein Test, der spätere
Fehlerausgaben verdeckt, bleibt nicht als bloßer Hinweis stehen. Der
Observer prüft, ob diese Testressourcen-Lücke eine bestehende Lesson
ergänzt; als einzelner Fund wird keine neue Sammlung behauptet.

### Nacharbeit Runde 3 · claude-coder · 2026-10-03

**Befund 3 · Warnung verschwindet ohne Datenabgleich:** behoben.

- `liveSync.ts` · `queue()`: Die Warnung (`status = 'disconnected'` nach
  einem Fehler) hebt nur noch ein erfolgreicher **Gesamtabgleich**
  (`action === refreshAll`) bei offenem Strom auf. Ein einzelnes Ereignis,
  ob es nichts lädt (Allowlist eines anderen Depots) oder nur ein Depot
  nachlädt, hebt sie nicht auf. `refreshAll` läuft nach jedem (Wieder-)
  Verbinden, bei Rückkehr zum Tab und, ohne Strom, im Ersatzabruf.
- Der Ersatzabruf richtet sich unverändert allein nach dem Strom
  (`streamConnected`); bei offenem Strom läuft er auch nach einem Fehler
  nicht an.
- Folge: Nach einem Fehler bei offenem Strom bleibt die Warnung stehen, bis
  ein Gesamtabgleich gelingt, also spätestens bei Rückkehr zum Tab oder
  nach einem Wiederverbinden.
- Regressionstest erweitert („startet den Ersatzabruf nicht, wenn bei
  stehendem Stream ein Datenabruf fehlschlägt (T-85)“): nach dem Fehler
  (1) Allowlist-Ereignis für ein fremdes Depot → kein Abruf, Warnung bleibt;
  (2) Depot-Ereignis lädt nach → Warnung bleibt; (3) `visibilitychange` →
  Gesamtabgleich gelingt → `connected`; danach kein Ersatzabruf.

**Pflichtprüfungen** (nach letzter Änderung):

| Befehl | Ergebnis |
|---|---|
| `make test` | Exit 0; Frontend 84 Dateien / 868 Tests, API 5 / 20 |
| `npm --prefix frontend run lint`, `npm --prefix api run lint` | je Exit 0 |
| `npm --prefix frontend run typecheck`, `npm --prefix api run typecheck` | je Exit 0 |
| `git diff --check` (eigene Dateien) | ohne Befund |

**Rote Gegenprobe** (Datei danach byte-gleich zurück, `cmp -s`):

| # | Eingebauter Fehler | Beobachtet | Exit |
|---|---|---|---|
| R6 | `liveSync.ts` aus `67706f2` (Runde 2) | erweiterter Regressionstest rot an `liveSync.spec.ts:121` (`connected` statt `disconnected` nach dem Allowlist-Ereignis); übrige 9 grün | 1 |
| R7 | Bedingung `action === refreshAll` entfernt | derselbe Test rot an Zeile 121 | 1 |

**Sichtbare Prüfung:** `smoke:live-sync` gegen frischen Teststack, mit
`timeout 240`: „Alle Prüfschritte bestanden.“, Exit 0, 83 s. Stack gestoppt,
Ports frei.

**Doku-Abgleich:** `README.md` und `docker/README.md` sagen weiter nur, dass
die Statuszeile bei fehlender Verbindung warnt und wann die App abfragt;
keine Aussage betrifft, wann die Warnung nach einem Abruffehler verschwindet.
Unverändert.

**Lessons:** SP-R-04 angewendet (dritter Fehlerpfad im selben Zustand,
diesmal vorab mit dem No-op-Ereignis als roter Fall belegt). Einordnung
übernimmt der Observer.


### Technische Prüfung Runde 2 · codex-verifier · 2026-10-03 · Rückgabe

Geprüft wurde die übergebene Fassung `67706f2`. Die zehn bestehenden
`liveSync.spec.ts`-Tests liefen mit Exit 0. Der Ersatzabruf folgt jetzt dem
SSE-Stream statt der Statuswarnung; Befund 1 aus Runde 1 ist damit behoben.
`Makefile`, `README.md` und `AGENTS.md` enthalten in der übergebenen Fassung
denselben `dev-up`/`dev-down`-Startweg; Befund 2 ist ebenfalls behoben. Die
uncommitteten App-Hilfetexte und T-86 gehören nicht zu diesem Review.

**Befund 3 · blockierend: Eine Warnung verschwindet ohne Datenabgleich.**
Nach einem fehlgeschlagenen `refreshAll()` bei offenem Stream setzt `queue()`
den Status auf `disconnected`. Ein nachfolgendes SSE-Ereignis für eine
unbeteiligte Allowlist führt in `refreshResource()` keine Datenabfrage aus;
die Promise gilt dennoch als erfolgreich. `queue()` setzt daraufhin den
Status wieder auf `connected`. Die Warnung verschwindet, obwohl der zuvor
fehlgeschlagene Abgleich nicht nachgeholt wurde. Der neue Regressionstest
deckt nur ein nachfolgendes, tatsächlich erfolgreiches Portfolio-Ereignis ab.

**Gegenprobe:** Ein temporärer Vitest ließ den initialen Datenabruf einmal
fehlschlagen und sendete danach bei offenem Stream ein irrelevantes
`allowlist`-Ereignis. `refreshFromServer()` wurde kein weiteres Mal
aufgerufen; trotzdem wechselte `live.status` von `disconnected` zu
`connected`. Erwartet war der fortbestehende Warnstatus, beobachtet
`connected`, Exit 1. Die temporäre Testdatei wurde entfernt. Erwartete
Nacharbeit: Warnung erst nach einem tatsächlich erfolgreichen Abgleich der
fehlgeschlagenen Daten aufheben; einen No-op-Ereignispfad als rote und danach
grüne Regression prüfen. Der Ersatzabruf darf dabei bei offenem SSE-Stream
weiterhin nicht anlaufen.

**Doku-Abgleich:** Die Aussagen zum Live-Abgleich in `README.md` und
`docker/README.md` sind in der geprüften Fassung inhaltlich gleich. Die
Korrektur des Setup-Code-Hinweises gehört nach Mikes Entscheidung zu T-86.

**Lessons-Einordnung:** SP-R-04 erneut angewendet: Der mit einem plausiblen
Ereignis erreichbare Fehlerpfad ist ein blockierender Befund. Die Ursache
liegt in der neuen Wiederherstellung der Statusanzeige; dieser Einzelbeleg
erfordert noch keine neue Lesson.

### Nacharbeit Runde 2 · claude-coder · 2026-10-03

**Befund 1 · Ersatzabruf bei offenem SSE-Stream:** behoben.

- `liveSync.ts`: Neuer Zustand `streamConnected`, gesetzt nur von
  `LiveEventsClient` (`connected` / `disconnected`), zurückgesetzt bei
  `start` und `stop`. Der Ersatzabruf richtet sich allein danach
  (`client !== null && !streamConnected`), nicht mehr nach dem angezeigten
  `status`.
- Ein fehlgeschlagener Abruf setzt weiter `status = 'disconnected'` (Warnung
  in der Statuszeile), schaltet den Ersatzabruf aber nicht ein. Der nächste
  erfolgreiche Abruf bei offenem Strom stellt `connected` wieder her; bisher
  blieb die Warnung bis zum nächsten Wiederverbinden stehen.
- Neuer Regressionstest „startet den Ersatzabruf nicht, wenn bei stehendem
  Stream ein Datenabruf fehlschlägt (T-85)“: Strom offen, ein Abruf schlägt
  fehl, 120 ms mit 20-ms-Takt kein weiterer Abruf, das nächste Ereignis lädt
  erfolgreich und zeigt wieder `connected`.

**Befund 2 · Doku und Makefile widersprüchlich:** Ursache war mein Fehler.
`2984a96` hatte `README.md` und `AGENTS.md` als ganze Dateien übernommen,
darin Mikes damals uncommittete `dev-up`/`dev-down`-Texte. Folge:

- `8316c15` nahm Mikes Abschnitte aus dem T-85-Commit heraus; committet
  blieben nur die T-85-Aussagen (Live-Abgleich, 100 px). Mikes Arbeitsstand
  wurde danach byte-gleich wiederhergestellt (`cmp -s`).
- Mike hat inzwischen das `Makefile` selbst committet (`dcd274d`; `dev`
  entfällt, `dev-up`/`dev-down` kommen dazu). Auf seinen Wunsch („Ja, als
  eigenen Commit“) stehen seine README-/AGENTS-Texte jetzt als eigener Commit
  `50f5c4d` („docs(dev): …“), getrennt von T-85. Damit passen Makefile und
  dokumentierter Startweg in derselben Fassung zusammen.
- Inventar `git grep "make dev\b"`: übrig sind `AGENTS.md:90` (StockInfos
  eigenes `make dev`, richtig) und das Backlog-Ticket T-80 (Beschreibung von
  damals, unverändert).
- **Bekannter Rest, nicht Teil von T-85:** Der committete Setup-Code-Hinweis
  in `frontend/src/i18n/de.ts`/`en.ts` (`auth.setupCodeHelp`) nennt noch
  „make dev“. Mikes uncommittete Änderung ersetzt ihn durch `make dev-up` und
  `overmind echo api`; sie bleibt nach seiner Entscheidung uncommittet.

**Pflichtprüfungen** (nach letzter Änderung):

| Befehl | Ergebnis |
|---|---|
| `make test` | Exit 0; Frontend 84 Dateien / 868 Tests (+1), API 5 / 20 |
| `npm --prefix frontend run lint`, `npm --prefix api run lint` | je Exit 0 |
| `npm --prefix frontend run typecheck`, `npm --prefix api run typecheck` | je Exit 0 |
| `git diff --check` (eigene Dateien) | ohne Befund |

**Rote Gegenprobe:**

| # | Eingebauter Fehler | Beobachtet | Exit |
|---|---|---|---|
| R4 | `liveSync.ts` aus `2984a96` (Runde 1) | nur der neue Regressionstest rot (zu viele Abrufe nach dem Fehler); übrige 9 grün | 1 |
| R5 | Wiederherstellung von `connected` nach erfolgreichem Abruf entfernt | neuer Regressionstest rot am letzten Schritt | 1 |

Datei danach byte-gleich zurück (`cmp -s`).

**Sichtbare Prüfung:** `smoke:live-sync` gegen frischen Teststack: „Alle
Prüfschritte bestanden.“, Exit 0, Dauer 82 s (Playwright-Protokoll
11:45:05–11:46:27 UTC). **Einschränkung:** Ein Lauf davor hing über 10 Minuten
nach „Anmeldung“, ohne Fehlermeldung; ich habe ihn abgebrochen (eigener
Prozess, `kill`), Stack gestoppt. Die Ursache ist nicht gefunden; der
nächste Lauf mit `DEBUG=pw:api` und `timeout 120` lief ohne Hänger durch.

**Doku-Abgleich:** Live-Abgleich-Aussagen in `README.md` und
`docker/README.md` unverändert gegenüber Runde 1 und weiterhin
gleichlautend; das neue Verhalten nach einem Abruffehler (Warnung, kein
Ersatzabruf, Rückkehr nach Erfolg) ändert keine dort gemachte Aussage.


### Technische Prüfung Runde 1 · codex-verifier · 2026-10-03 · Rückgabe

Geprüft wurde die übergebene Produktfassung `2984a96`. Die uncommitteten
Änderungen an `Makefile` und `frontend/src/i18n/` aus Mikes gesondertem
`dev-up`-Auftrag gehören nicht zu diesem Prüfurteil. Die neun bestehenden
`liveSync.spec.ts`-Tests liefen mit Exit 0.

**Befund 1 · blockierend: Ersatzabruf bei offenem SSE-Stream.** Wenn ein
Datenabruf während einer stehenden SSE-Verbindung einmal fehlschlägt, setzt
`queue()` über `setStatus('disconnected')` den Ersatzabruf wieder in Gang.
`LiveEventsClient` hat dabei weder ein `error`-Ereignis erhalten noch den
Stream geschlossen. Ein weiterer erfolgreicher Datenabruf setzt den Zustand
nicht auf `connected` zurück. Damit läuft der 30-s-Ersatzabruf dauerhaft
weiter, obwohl die SSE-Verbindung steht. Der Fehlerpfad ist erreichbar:
`portfolio.refreshFromServer()` gibt einen Fehler aus der Konto-API weiter.

**Gegenprobe:** Ein nur für die Prüfung angelegter Vitest ließ den Stream
offen, ließ `refreshFromServer()` einmal fehlschlagen und prüfte danach 110 ms
lang mit 20-ms-Ersatzintervall auf weitere Abrufe. Erwartet waren null;
beobachtet wurden fünf. Exit 1; die temporäre Testdatei wurde anschließend
entfernt. Erwartete Nacharbeit: SSE-Verbindungszustand und Fehler eines
einzelnen Datenabrufs trennen, den Ersatzabruf am tatsächlichen
Verbindungszustand ausrichten und diesen Fall als dauerhafte Regression
prüfen. Der neue Test soll vor der Korrektur rot und danach grün sein.

**Befund 2 · blockierend: Übergabecommit ist beim Entwicklungsstart
widersprüchlich.** `2984a96:README.md` und `2984a96:AGENTS.md` nennen
`make dev-up` und `make dev-down`; `2984a96:Makefile` enthält nur `dev`.
Die beiden neuen Targets liegen bislang ausschließlich uncommittet im
Arbeitsbaum und stammen aus Mikes gesondertem Auftrag. Für die nächste
Übergabe müssen dokumentierter Startweg und Makefile in derselben prüfbaren
Fassung übereinstimmen; die gesonderte Änderung ist als solche kenntlich zu
halten. Die Live-Abgleich-Aussagen in beiden READMEs stimmen für sich
inhaltlich überein.

**Lessons-Einordnung:** SP-R-04 auf Befund 1 angewendet: Der plausibel
erreichbare Fehlerpfad blockiert die Freigabe und braucht eine ausdrückliche
Gegenprobe. Befund 2 ist ein Einzelfall durch die zeitgleiche Änderung ohne
Ticket; aus dieser Runde allein folgt keine neue Lesson. Der Observer kann
die Einordnung auf wiederkehrende Muster prüfen.

### Übergabe Runde 1 · claude-coder · 2026-10-03

**Umfang** (Produktcommit siehe STATUS `handoff_commit`):

- `stores/liveSync.ts`: Neue Funktion `setStatus` setzt den Zustand und
  startet oder beendet den Ersatzabruf: Er läuft, solange ein Client aktiv
  und der Zustand nicht `connected` ist. Alle bisherigen Zuweisungen an
  `status` laufen darüber (Start `connecting`, `connected`, `disconnected`,
  fehlgeschlagene Synchronisierung, `stop`). Der feste `setInterval` in
  `start` ist entfallen; der Parameter heißt jetzt `fallbackIntervalMs`.
  Unverändert: Neuladen nach jedem Verbinden, beim Wiedererscheinen des
  Tabs und auf SSE-Ereignisse; Wiederverbinden mit Pause in
  `LiveEventsClient`.
- `tests/stores/liveSync.spec.ts`:
  - Neu „nutzt den Ersatzabruf nur, solange keine SSE-Verbindung steht
    (T-85)“: vor dem Verbinden Abruf; verbunden kein Abruf; getrennt wieder
    Abruf; nach dem Wiederverbinden einmal neu laden, dann Ruhe; nach `stop`
    nichts mehr. Mit `try/finally`, damit ein Abbruch keinen 20-ms-Takt in
    den nächsten Test trägt.
  - Umgeschrieben (Mikes Entscheidung): „holt eine bei stehendem Stream
    verpasste Änderung bei der Rückkehr zum Tab ab“ statt „… bei scheinbar
    verbundenem Stream …“. Prüft, dass ohne Tab-Wechsel nichts nachgeladen
    wird und mit `visibilitychange` schon.
- `frontend/scripts/live-sync-smoke.mjs`: **Nebenfund behoben.** Der
  Smoketest scheiterte bei der Anmeldung (`page.waitForFunction: Timeout
  20000ms exceeded` in `login`, Exit 1), weil er den Pflichthinweis im Login
  nicht anhakte; er stammt aus der Zeit davor. Er klickt jetzt
  `form [role="checkbox"]` wie die anderen Skripte. Dabei wie in AGENTS.md
  vorgesehen den linken Rand von 80 auf 100 px angeglichen.
- Doku: `README.md` und `docker/README.md` beschreiben das neue Verhalten
  gleichlautend; `AGENTS.md` nennt 100 px für den Smoketest, der Hinweis auf
  die ausstehende Angleichung ist entfernt.

**Pflichtprüfungen** (nach letzter Änderung):

| Befehl | Ergebnis |
|---|---|
| `make test` | Exit 0; Frontend 84 Dateien / 867 Tests (+1), API 5 / 20 |
| `npm --prefix frontend run lint`, `npm --prefix api run lint` | je Exit 0 |
| `npm --prefix frontend run typecheck`, `npm --prefix api run typecheck` | je Exit 0 |
| `git diff --check` | ohne Befund |

**Rote Gegenprobe** (Dateien danach byte-gleich zurück, `cmp -s`):

| # | Eingebauter Fehler | Beobachtet | Exit |
|---|---|---|---|
| R1 | `liveSync.ts` aus `HEAD` (fester 30-s-Timer, im Test 20 ms) | genau die zwei Tests rot: „nutzt den Ersatzabruf nur …“ und „holt eine … bei der Rückkehr zum Tab ab“; übrige 7 grün | 1 |
| R2 | Neuladen bei `visibilitychange` entfernt | „holt eine … bei der Rückkehr zum Tab ab“ rot | 1 |
| R3 | Smoketest ohne Checkbox-Klick (Stand vor dem Fix) | Anmeldung: `page.waitForFunction: Timeout 20000ms exceeded` | 1 |

Beim ersten R1-Lauf (vor `try/finally`) schlug zusätzlich „ignoriert das
eigene Ereignis …“ fehl: Der neue Test brach ab und ließ seinen 20-ms-Takt
laufen. Nach `try/finally` sind bei R1 nur noch die zwei gewollten Tests rot.

**Sichtbare Prüfung:** `smoke:live-sync` gegen den Teststack
(`--stack --run --demo-accounts`), Fenster 50:50, links 100 px: „Alle
Prüfschritte bestanden.“, Exit 0. Darunter: Änderung von A erscheint in B
ohne Seiten-Refresh; Konto C sieht nichts; Kurs-Hinweis lässt B Kurse holen;
Backup-Löschen und -Einspielen kommen in B an; B zeigt die unterbrochene
Verbindung, verbindet sich selbst wieder und lädt den verpassten Stand;
Stream bleibt 35 s mit 2 Keep-Alives offen; veralteter Schreibstand ergibt
sichtbaren Konflikt; Logout beendet den Stream. Stack danach gestoppt, Ports
frei. Ein erster Startversuch des Stacks lieferte keine Zugangsdatei; die
Ausgabe war weggefiltert, die Ursache ist unbekannt. Der zweite Start meldete
„All local endpoints and CORS checks passed“.

**Doku-Abgleich:**

| Datei · Abschnitt | Ergebnis |
|---|---|
| `README.md` · Konten und Live-Abgleich | „checks the server periodically to catch missed changes“ ersetzt: kein Abruf bei stehender Verbindung, alle 30 s ohne Verbindung, einmal nach Wiederverbinden und bei Rückkehr zum Tab |
| `docker/README.md` · Betrieb (Live-Abgleich) | gleiche Aussage; Docker-Hub-Vorschau 12.471 von 25.000 Bytes |
| `AGENTS.md` · Bauen und prüfen / Browserprüfung | Smoketest lässt 100 px frei; Hinweis auf ausstehende Angleichung entfernt |

**Lessons:** SI-P-04/08 (jeder neue und umgeschriebene Test gegen den alten
Code rot; Testleck erkannt und behoben); SP-R-04 (veralteter Smoketest
behoben statt umgangen); SP-R-05 (Stack nach dem Stopp geprüft). Fremde
Änderung im `Makefile` (`dev-up`/`dev-down`) gehört nicht zu T-85 und ist
nicht committet.
