# T-69 · Dashboard ohne Neuladen beim Ansichtswechsel

**Warum dieses Ticket:** Wer vom Dashboard zu Rebalancing und wieder zurück
wechselt, wartet jedes Mal, bis die Tabelle wieder erscheint. Kurse, Depot und
Einstellungen sind zu diesem Zeitpunkt längst geladen; der Wechsel zwischen
Ansichten soll sofort den vorhandenen Stand zeigen.

**Beispiel:** Dashboard öffnen, auf Rebalancing klicken, zurück auf Dashboard.
Bisher: Ladeanzeige, bis Depot, Einstellungen, Health-Check und Devisenkurse
erneut über das Netz beantwortet sind. Danach: Die Tabelle steht sofort mit
den zwischengespeicherten Werten; eine Aktualisierung läuft nur, wenn die
eingestellte Schonfrist abgelaufen ist, und dann im Hintergrund.

**Stand:** Ursache im Code eingegrenzt, noch nicht umgesetzt und nicht im
Browser gemessen. Mike, 2026-10-01: „Kurse können gecached werden.“

Für dich: Entscheiden, wann das Ticket nach T-67 drankommt.

## Ursache (Codeanalyse, 2026-10-01)

Die Kurse selbst sind schon zwischengespeichert: `quotesStore.hydrate()` liest
den Cache, `loadQuotesIfStale` lädt nur nach Ablauf der Schonfrist. Gewartet
wird an anderer Stelle. `DashboardView.vue` setzt `initialLoading` erst am
Ende von `onMounted` zurück und blendet bis dahin die Tabelle aus (`ready`).
Davor wartet die Ansicht bei jedem Aufbau auf:

1. `portfolioStore.load()` — immer, auch wenn `loaded` schon gilt; seit T-61
   ein REST-Abruf beim Konto-API, dazu ein zweiter Abruf der Einstellungen.
2. `settingsStore.load()` — immer, ebenfalls REST.
3. `loadFx()` — `fxStore.load` fragt StockInfo bei jedem Aufruf neu, auch wenn
   der Kurs in dieser Sitzung schon vorliegt.

`RebalancingView.vue` prüft dagegen `loaded` vor dem Laden. Der Health-Check
(`ensureChecked` mit Schonfrist) und `loadQuotesIfStale` sind bereits gecacht.

## Umsetzung und technische Nachweise

| Repo | Time-box | Scope | GH-Issue |
|---|---|---|---|
| root (`frontend/`) | 2–3 h | Dashboard-Aufbau, `fx`-Store, Tests | — |

### Verify

| # | Lauf | Handgriff | Nachweis | woher | AI |
|---|:--:|---|---|---|:--:|
| 1 | Teststack | <a id="pruefpunkt-1"></a>Dashboard → Rebalancing → Dashboard innerhalb der Schonfrist | Tabelle sofort sichtbar; keine Anfragen an `/api/data/*`, `/fx` oder `/quote` im Netzwerkprotokoll | Mike | ➖ |
| 2 | Teststack | <a id="pruefpunkt-2"></a>Dasselbe nach abgelaufener Schonfrist | Tabelle sofort mit altem Stand, Aktualisierung im Hintergrund mit Fortschrittsanzeige | Schonfrist T-33 | ➖ |
| 3 | Unit | <a id="pruefpunkt-3"></a>Zweiter Aufbau der Ansicht und zweiter FX-Abruf | Kein erneuter Repository- bzw. `getFx`-Aufruf bei gültigem Stand | Ursache 1–3 | ➖ |
| 4 | Teststack | <a id="pruefpunkt-4"></a>Änderung in einem zweiten Browser während Rebalancing offen ist | Nach Rückkehr zeigt das Dashboard den neuen Stand (SSE-Abgleich aus T-62 bleibt wirksam) | T-62 | ➖ |

### Akzeptanzkriterien

- [ ] Der Ansichtswechsel lädt Depot und Einstellungen nicht neu, wenn sie geladen sind.
- [ ] Devisenkurse werden je Sitzung wiederverwendet und nur nach der Schonfrist neu geholt.
- [ ] Netzabrufe nach der Schonfrist blockieren die Anzeige nicht.
- [ ] Live-Abgleich über SSE und Depotwechsel liefern weiterhin den aktuellen Stand.

### Side-Effects

Depotwechsel, Kontowechsel und SSE-Benachrichtigungen setzen den Stand neu;
diese Wege müssen den Cache weiterhin ersetzen. StockInfo bleibt unverändert.
