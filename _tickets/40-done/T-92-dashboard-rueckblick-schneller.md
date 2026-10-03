# T-92 · Dashboard: Rückblick ohne Wartezeit

**Abgeschlossen am 2026-10-03** (Mike: „T-92 ist freigegeben“). Technisch freigegeben in Runde 1 (`fac7055`), nach `master` gemergt und zu `origin` gepusht.

**Warum dieses Ticket:** Beim Wechsel von Rebalancing zum Dashboard zeigte
die App auf Mikes Server rund eine Sekunde lang graue Platzhalter. Das Netz
war daran nicht beteiligt. Der Browser rechnete in dieser Zeit den Rückblick
für Wertlinie und Diagramm: den heutigen Bestand über den gesamten
Kursverlauf (`max`). `buildBacktest()` suchte dafür für jeden Handelstag den
Kurs jeder Position von vorn in deren Kursreihe. Der Aufwand wuchs mit Tage ×
Positionen × Kurspunkte.

**Beispiel:** 25 Positionen mit je 20 Jahren Verlauf: vorher 1.252 ms, danach
13 ms. Im Teststack (61 Tage Verlauf) fiel das nicht auf.

**Stand:** Abgeschlossen. Technische Freigabe in Runde 1 durch
`codex-verifier`, Freigabe durch Mike am 2026-10-03. Eine Messung auf Mikes
Server ist nicht belegt; die Wirkung dort zeigt sich mit dem nächsten Image.

Kein offener menschlicher Schritt.

**Herkunft:** Mike, 2026-10-03: „Wenn ich bei der Installation über Unraid von
Rebalancing auf Dashboard schalte dauert es eine Weile bis der Content
gezeigt wird“; „Graue Platzhalter - ca 1sec“; „Der Netzwerkreiter bleibt beim
Umschalten leer“. Vorschlag mit drei Punkten vorgelegt; Mike: „Ja, leg T-92
an und setz es gleich um“. Das Ticket wurde erst nach Beginn der Umsetzung
angelegt (Mike: „Wo ist das Ticket dass du gerade umsetzt?“).

## Umsetzung und technische Nachweise

| Repo | Time-box | Scope | GH-Issue |
|---|---|---|---|
| root (`frontend/`) | klein | `buildBacktest()` | — |

**Umsetzung:** `frontend/src/domain/portfolioHistory.ts` — `buildBacktest()`
führt je Position einen Zeiger, der mit der aufsteigenden Datumsachse
vorrückt. Jede Kursreihe wird einmal durchlaufen. Die Summierreihenfolge
(erst Positionen, dann fester Betrag) bleibt wie bisher, damit die Werte
bitgenau gleich sind. `closeOnOrBefore()` entfällt.

**Abweichung vom Vorschlag:** Punkt 2 („nicht unnötig neu rechnen“) entfällt.
Nach Punkt 1 kostet die Rechnung bei 25 × 20 Jahren 13 ms; ein Cache brächte
keine spürbare Verbesserung, nur zusätzlichen Code.

### Verify

Legende: ✅ live bestätigt · ➖ nur Unit/Review.

| # | Lauf | Handgriff | Nachweis | woher | AI |
|---|:--:|---|---|---|:--:|
| 1 | Unit | <a id="pruefpunkt-1"></a>`frontend/tests/domain/portfolioHistory.spec.ts` | 12 Tests grün; neu: Vergleich mit der alten Fassung (8 Positionen ab 2018–2020, 8 % Lücken, Bruchstücke, fester Betrag) mit `toEqual`; 25 Positionen × 20 Jahre unter 250 ms | Mike | ➖ |
| 2 | Unit rot | <a id="pruefpunkt-2"></a>Gegenproben | Alte Fassung eingesetzt → Zeittest rot (1.369 ms), Exit 1. Fehler eingebaut (`<` statt `<=` beim Vorrücken) → 5 Tests rot, darunter der Vergleichstest, Exit 1. Danach zurückgesetzt (`cmp` gleich), 12/12 grün | Pflicht Gegenprobe | ➖ |
| 3 | Messung | <a id="pruefpunkt-3"></a>`buildBacktest()` mit künstlichen Handelstagen | vorher/nachher: 10 × 1 J. 3/0 ms, 10 × 10 J. 128/3 ms, 15 × 20 J. 744/8 ms, 25 × 20 J. 1.252/13 ms | Mike | ➖ |
| 4 | Pflicht | <a id="pruefpunkt-4"></a>`make test`, Lint, Typecheck | `make test` Exit 0 (Frontend 84/870, API 7/53); Lint und Typecheck für Frontend und API je Exit 0; `git diff --check` sauber | AGENTS.md | ➖ |
| 5 | Browser | <a id="pruefpunkt-5"></a>Ansichtswechsel mit langem Verlauf | nicht geprüft: Der Teststack liefert nur 61 Tage Verlauf; dafür bräuchte der Testserver eine neue Option. Gemessen wurde im Teststack nur der kurze Fall (Wechsel 40–80 ms, keine `/api/`-Anfrage) | Mike | ➖ |

### Akzeptanzkriterien

- [x] `buildBacktest()` liefert dieselben Werte wie bisher (Vergleichstest).
- [x] 25 Positionen × 20 Jahre unter 250 ms (gemessen 13 ms).
- [x] Mike sieht auf seinem Server beim Wechsel zum Dashboard keine
      spürbaren Platzhalter mehr (nach dem nächsten Image). Durch Mikes
      Freigabe ersetzt; eine Prüfung auf dem Server ist nicht belegt.

### Side-Effects

Keine Verhaltensänderung, nur Rechenzeit.

**Doku-Abgleich:** Anleitungen beschreiben den Rückblick, nicht seine
Rechenweise; keine Änderung nötig. Board-Konventionen unverändert; Skill
`task-verification-workflow` braucht keine Übernahme.

## Review-Verlauf (neueste Runde zuerst)

### Verifier-Prüfung Runde 1 · codex-verifier · 2026-10-03

**Technisch freigegeben:** Prüffassung `fac7055` auf
`t-92-dashboard-rueckblick-schneller`. Ich habe den alten Suchlauf mit dem
Zeigerlauf verglichen: Die Achse und die Summierreihenfolge bleiben erhalten;
der Zeiger übernimmt an jedem Datum den letzten vorhandenen Kurs. Der
Vergleichstest deckt verschiedene Startjahre, Lücken und den festen Betrag ab.
Der gezielte Lauf von `frontend/tests/domain/portfolioHistory.spec.ts` endete
mit Exit 0 (12/12). Die dortige Zeitgrenze von 250 ms wurde eingehalten.

Der entfallene Cache-Schritt ist bei der gemessenen kurzen Rechenzeit
nachvollziehbar. Den langen Verlauf habe ich nicht im Browser nachgestellt:
Der Teststack liefert dafür nur 61 Tage. Mikes Prüfung auf seinem Server ist
deshalb weiterhin ein offenes Akzeptanzkriterium. Die vollständigen
Pflichtprüfungen und die roten Gegenproben sind Coder-Belege, nicht eigene
Läufe des Verifiers.

**Doku-Abgleich:** Projekt-README („Value history“) und Docker-README
beschreiben die Ansicht, nicht den Rechenweg oder eine zugesagte Wartezeit;
keine Anpassung nötig. Lessons SP-R-02 für die begrenzte Prüfaussage
angewendet; kein neuer Befund und keine neue Lesson. Der lokale
Board-Konventionsstand `2026-09-28-activity-local` bleibt unverändert.

### Übergabe Runde 1 · claude-coder · 2026-10-03

Prüffassung siehe STATUS `handoff_commit` auf `t-92-dashboard-rueckblick-schneller`.
Belege oben unter Verify. Zu prüfen: Gleichheit der Werte (auch Fortschreibung
über Feiertage und Start beim spätesten Erstkurs), Zeittest, Begründung für
den entfallenen Punkt 2, fehlende Browserprüfung mit langem Verlauf.
