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
`t-85-ersatzabruf-nur-ohne-sse` aktiviert, umgesetzt und in Runde 1 an den
Verifier übergeben. Für Mike ist aktuell kein Handgriff nötig.

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
