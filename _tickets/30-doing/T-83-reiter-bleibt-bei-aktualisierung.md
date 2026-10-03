# T-83 · Gewählter Reiter bleibt bei der Aktualisierung offen

**Warum dieses Ticket:** In einer aufgeklappten Position springt der Reiter
nach einer Weile von selbst auf „Kursverlauf“ zurück. Wer gerade die
Zusatzinformationen liest, verliert sie mitten im Lesen.

**Beispiel:** Mike öffnet im Dashboard eine Position, wählt
„Informationen“ und liest. Nach einiger Zeit aktualisiert sich die Seite
im Hintergrund, und statt der Informationen steht wieder der Kursverlauf da.

**Stand:** Angelegt und aktiviert am 2026-10-03 auf Mikes Meldung
(„StockPortfolio scheint periodisch die Seite zu aktualisieren … wenn ich in
den Details zb. In Informations-Tab offen habe, der verschwindet und der
Kursverlauf angezeigt wird - check das“). Branch
`t-83-reiter-bleibt-bei-aktualisierung`. Befund per Test bestätigt, behoben
und in Runde 1 an den Verifier übergeben (siehe Review-Verlauf).

Für Mike ist aktuell kein Handgriff nötig.

## Befund (claude-coder, 2026-10-03)

- **Wer aktualisiert:** Der Live-Abgleich (`stores/liveSync.ts`) lädt Depot
  und Kurse regelmäßig neu (Ersatz-Timer `refreshAll`) und bei Ereignissen
  anderer Browser. Danach entstehen die Positionszeilen als neue Objekte,
  auch wenn sich nichts geändert hat.
- **Warum der Reiter springt (per Test bestätigt):**
  `PositionReadDetails.vue` setzt den Reiter zurück, wenn sich Position oder
  Gruppe ändert:
  `watch(() => [props.row.position.id, props.row.position.group], …)`.
  Der Getter liefert bei jedem Lauf ein neues Array. Vue vergleicht hier die
  Referenz, nicht den Inhalt. Jede neue Zeile löst deshalb den Rücksprung
  auf „Kursverlauf“ aus.

## Was zu tun ist

- Den Rücksprung nur auslösen, wenn sich Position oder Gruppe tatsächlich
  ändern.
- Andere absichtliche Wechsel bleiben: Fällt der gewählte Reiter weg (etwa
  weil keine Zusatzinformationen mehr da sind), wählt die Ansicht weiter den
  ersten verfügbaren; ein Klick auf den Verlauf (`historyRequest`) öffnet den
  Kursverlauf.

### Akzeptanzkriterien

- [x] Ein Test belegt den Fehler zuerst rot: Neue Zeile mit gleicher
      Position und Gruppe lässt den gewählten Reiter stehen.
- [x] Wechsel zu einer anderen Position oder Gruppe setzt den Reiter
      weiterhin zurück; die bestehenden Tests dazu bleiben grün.
- [x] **Sichtbare Prüfung im Browser** (Teststack): Reiter „Informationen“
      offen lassen, eine Aktualisierung auslösen; der Reiter bleibt. Geprüft
      mit dem Live-Abgleich nach 30 Sekunden; „Aktualisieren“ siehe T-84.
- [x] Doku-Abgleich: README und `docker/README.md` geprüft.

### Side-Effects

Keine Verhaltensänderung außer dem ausbleibenden Rücksprung.

## Review-Verlauf (neueste Runde zuerst)

### Übergabe Runde 1 · claude-coder · 2026-10-03

**Befund bestätigt:** Ein neuer Komponententest war vor der Korrektur rot,
genau nach dem Neuladen einer gleichen Zeile
(`positionReadDetails.spec.ts:130`, „expected false to be true“). Damit ist
der Verdacht aus dem Befund belegt: Der Getter `() => [id, group]` liefert
jedes Mal ein neues Array, und Vue löst den Rücksprung bei jeder neu
gelieferten Zeile aus. Auslöser im Betrieb ist der Ersatz-Timer des
Live-Abgleichs (`liveSync.ts`, `fallbackMs = 30_000`), der Depot und
Einstellungen alle 30 Sekunden neu lädt.

**Umfang** (Produktcommit siehe STATUS `handoff_commit`):

- `PositionReadDetails.vue`: Der Rücksprung beobachtet `id` und `group` als
  zwei einzelne Quellen; Vue vergleicht dann die Werte. Eine andere Position
  oder Gruppe setzt den Reiter weiter zurück.
- **Inventar desselben Musters** (`grep "watch(() => \["` über `src/`, vier
  weitere Stellen):
  - `PositionReadDetails.vue` · Feldkatalog: lud bei jeder neuen Zeile
    `/fields` neu; jetzt nur bei neuem Kurs (`symbol`, `fetchedAt`). Behoben.
  - `DashboardView.vue` · Wertentwicklung: stieß bei jedem neu geladenen
    Depot `loadValueHistory` an; jetzt nur bei Depotwechsel oder neuer
    Basiswährung. Behoben.
  - `App.vue:81` (Typabgleich bei neuer Kursliste) und `DashboardView.vue:440`
    (Rückrechnung bei neuem Ergebnis): Hier ist die Reaktion auf jede neue
    Liste beziehungsweise jedes neue Ergebnis gewollt; unverändert.
- **Tests:** drei neue, alle vor der Korrektur rot (Reiter bleibt; Katalog
  nur bei neuem Kurs; Wertentwicklung nur bei Depot- oder Währungswechsel),
  danach grün.
- **Prüfskript `demo-data-check.mjs`, neuer Schritt 4:** Reiter
  „Informationen“ öffnen, 35 Sekunden auf den Live-Abgleich warten, Reiter
  muss offen sein. „Aktualisieren“ klickt der Schritt bewusst nicht (siehe
  Nebenfund).

**Nebenfund, nicht in T-83 behoben:** Im Teststack mit `--demo-details`
leert ein echter Kursabruf („Aktualisieren“) alle Demo-Detailwerte, und die
Volatilität fällt auf 0,03 %. Das fiel auf, weil ein erster Entwurf von
Schritt 4 „Aktualisieren“ klickte und der folgende Lauf darauf leere Werte
sah. Ursache und Wege stehen im neuen Backlog-Ticket
[T-84](../10-backlog/T-84-demodetails-ueberstehen-kursabruf.md); die Grenze
steht in README und AGENTS.md. Der Reiterfehler selbst trat im Entwurf auch
nach „Aktualisieren“ auf.

**Pflichtprüfungen** (nach letzter Änderung):

| Befehl | Ergebnis |
|---|---|
| `make test` | Exit 0; Frontend 84 Dateien / 866 Tests (+3), API 5 / 20 |
| `npm --prefix frontend run lint`, `npm --prefix api run lint` | je Exit 0 |
| `npm --prefix frontend run typecheck`, `npm --prefix api run typecheck` | je Exit 0 |
| `git diff --check` | ohne Befund |

**Sichtbare Browserprüfung** (frischer Teststack `--stack --run
--demo-accounts --demo-details`, nachdem Mike `make dev` gestoppt hatte):

| Lauf | Stand | Ergebnis | Exit |
|---|---|---|---|
| grün | mit Korrektur | alle Schritte `OK`, darunter `OK Reiter nach Aktualisierung: „Informationen“ bleibt offen (EUNL.DE)` | 0 |
| rot | alter Getter `() => [id, group]` eingesetzt | nur `FEHLER Reiter nach Aktualisierung: nach dem Live-Abgleich nicht mehr „Informationen“`; alle anderen Schritte `OK` | 1 |
| grün | Datei byte-gleich zurück (`cmp -s`) | Reiter-Schritt `OK` | 0 |

Stack danach gestoppt, Ports 5175/8080/8899 frei.

**Doku-Abgleich:**

| Datei · Abschnitt | Ergebnis |
|---|---|
| `README.md` · Test stack (`--demo-details`) | Grenze ergänzt: **Refresh** leert die Demowerte, Neustart stellt sie her |
| `AGENTS.md` · Bauen und prüfen / Browserprüfung | dieselbe Grenze; `demo-data-check.mjs` prüft auch den Reiter beim Live-Abgleich |
| `README.md` / `docker/README.md` · Live-Abgleich | beschreiben den Abgleich allgemein, ohne Aussage zu Reitern; kein Widerspruch, unverändert |

**Lessons:** SI-P-02/12 (Inventar aller `watch(() => [...])` statt nur der
gemeldeten Stelle); SI-P-04/08 (Test und Prüfschritt je einmal gegen den
alten Code rot); SP-R-04 (zwei weitere Fundstellen behoben, Nebenfund als
Ticket festgehalten); SP-R-05 (Stack nach dem Stopp geprüft).
