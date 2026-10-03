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

**Abgeschlossen am 2026-10-03:** Mike: „T-78, T-79 und T-83 sind abgenommen“. Technisch freigegeben und nach `master` gemergt (`bfc178a`).

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

### Verifier-Prüfung · Runde 1 · codex-verifier · 2026-10-03

**Technisches Urteil:** Übergabe `6fc6a2d` freigegeben. Das ist keine
menschliche Abnahme und kein Ticketabschluss.

**Eigene Prüfung:** Branch und Übergabecommit gegen STATUS abgeglichen;
Diff der drei Watcher, Tests, Browserprüfung und Doku gelesen. Der neue
Watcher vergleicht Positions-ID und Gruppe einzeln. Der Komponententest
prüft dieselbe Position als neues Objekt und den Wechsel der ID; für einen
reinen Gruppenwechsel gibt es keinen eigenen Test, die Rücksetzung folgt
hier aus dem zweiten beobachteten Wert. Feldkatalog und Wertentwicklung
beobachten ebenfalls einzelne Werte; die übrigen beiden Array-Getter
reagieren absichtlich auf neue Ergebnisobjekte. `make test` bestand mit
866 Frontend- und 20 API-Tests; beide Lints, beide Typechecks und
`git diff --check` endeten mit Exit 0. Den sichtbaren
`check:demo-data`-Lauf habe ich selbst am isolierten Stack ausgeführt:
Exit 0, zehn Assets, neun Positionen und nach 35 Sekunden weiterhin
„Informationen“ bei EUNL.DE. Nach dem Stopp waren die drei gestarteten
PIDs und das temporäre Verzeichnis weg; ein direkter Neustart bestand die
Stack-Prüfungen. Die drei vorher roten Unit-Tests und den roten Browserlauf
mit altem Getter habe ich aus der Coder-Übergabe bewertet, nicht selbst
wiederholt.

**Doku-Abgleich:** `README.md` und `AGENTS.md` nennen die Grenze der
Demo-Detailwerte nach einem echten Refresh; `AGENTS.md` nennt den neuen
Browser-Prüfschritt. `docker/README.md` beschreibt den Live-Abgleich
allgemein und verspricht kein Reiterverhalten. `docs/` und `unraid/`
enthalten hierzu keine betroffene Nutzungszusage.

#### Lessons-Einordnung

| Befund oder Gruppe | Einordnung | Lesson-ID/Fassung oder Einzelfallgrund | Tatsächliche Übernahme / offener Rest |
|---|---|---|---|
| Neuer Array-Wert im `watch`-Getter löst drei unnötige Reaktionen aus | Vorhandene Lesson angewendet | [SP-R-04](../.agents/lessons/SP-R-04-erkannte-potenzielle-fehler-beheben-scout-rule.md), Blob `86c9b9e`; Coder nennt ergänzend SI-P-02/12 | Drei berührte Fundstellen in `717e43b` korrigiert; zwei andere Fundstellen bewusst beibehalten. Keine zusätzliche lokale Lesson für denselben Inventar- und Korrekturgrund angelegt. |
| Demo-Detailwerte verschwinden nach echtem Refresh | Einzelfall außerhalb der Reiterkorrektur | Testquelle liefert keine Detailwerte; [T-84](../10-backlog/T-84-demodetails-ueberstehen-kursabruf.md) beschreibt Ursache und Entscheidungswege | Grenze in README und AGENTS beschrieben; T-84 bleibt im Backlog und ist nicht durch diese Freigabe erledigt. Zuständig nach Aktivierung: StockPortfolio-Coder. |

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
