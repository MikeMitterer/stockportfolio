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
`t-85-ersatzabruf-nur-ohne-sse` aktiviert. Für Mike ist aktuell kein Handgriff
nötig.

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

- [ ] Test: Bei stehender Verbindung löst der Ablauf von 30 s keinen
      Ersatzabruf aus; im Zustand `disconnected` weiterhin.
- [ ] Test: Nach dem Wiederverbinden lädt die App einmal neu und der
      Ersatzabruf endet.
- [ ] Die bestehenden Live-Abgleich-Tests bleiben grün.
- [ ] **Sichtbare Prüfung** mit dem Live-Abgleich-Smoketest
      (`smoke:live-sync`) gegen den Teststack.
- [ ] Doku-Abgleich: README und `docker/README.md` gemeinsam geprüft.

### Side-Effects

Weniger Abrufe bei stehender Verbindung. Fällt der SSE-Strom aus, verhält
sich die App wie bisher.

## Review-Verlauf (neueste Runde zuerst)
