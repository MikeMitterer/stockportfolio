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
`t-83-reiter-bleibt-bei-aktualisierung`.

Für Mike ist aktuell kein Handgriff nötig.

## Befund (claude-coder, 2026-10-03)

- **Wer aktualisiert:** Der Live-Abgleich (`stores/liveSync.ts`) lädt Depot
  und Kurse regelmäßig neu (Ersatz-Timer `refreshAll`) und bei Ereignissen
  anderer Browser. Danach entstehen die Positionszeilen als neue Objekte,
  auch wenn sich nichts geändert hat.
- **Warum der Reiter springt (Verdacht, per Test zu belegen):**
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

- [ ] Ein Test belegt den Fehler zuerst rot: Neue Zeile mit gleicher
      Position und Gruppe lässt den gewählten Reiter stehen.
- [ ] Wechsel zu einer anderen Position oder Gruppe setzt den Reiter
      weiterhin zurück; die bestehenden Tests dazu bleiben grün.
- [ ] **Sichtbare Prüfung im Browser** (Teststack): Reiter „Informationen“
      offen lassen, eine Aktualisierung auslösen; der Reiter bleibt.
- [ ] Doku-Abgleich: README und `docker/README.md` geprüft.

### Side-Effects

Keine Verhaltensänderung außer dem ausbleibenden Rücksprung.

## Review-Verlauf (neueste Runde zuerst)
