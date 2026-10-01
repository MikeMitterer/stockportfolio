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

**Stand:** Runde 1 (`f8bbe20`) kam mit `changes_requested` wegen der
Schonfrist nach einem Teilabruf zurück. Runde 2 (`2bdf21b`) wurde durch
`codex-verifier` ebenfalls mit `changes_requested` zurückgegeben: Bei
blockiertem `localStorage` geht der im selben Tab noch vorhandene Zeitpunkt
des vollständigen Abrufs beim nächsten Ansichtswechsel verloren. Beim
Zurückwechseln stellt das Dashboard im sichtbaren Coder-Browsertest keine
Anfrage mehr an Konto-API oder StockInfo.
Mike, 2026-10-01: „Kurse können gecached werden.“

Für dich steht jetzt nichts an. Nach der technischen Freigabe kannst du den
Wechsel mit deinem `make dev` gegen die gehostete StockInfo-Instanz prüfen
([Prüfpunkt 1](#pruefpunkt-1)).

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
(`ensureChecked` mit Schonfrist) ist bereits gecacht.

Bei der Umsetzung kamen zwei weitere Ursachen dazu:

4. `valueHistory.load()` leerte bei jedem Aufbau die Tageswerte und holte
   `/api/data/snapshots/…` neu (im Hintergrund, das Diagramm lud neu).
5. `loadQuotesIfStale` lud innerhalb der Schonfrist **alle** Kurse neu, sobald
   auch nur einer Position der Kurs fehlte — etwa einem Papier, dessen Abruf
   dauerhaft scheitert. Das passt genau zu „Kurse werden wieder geladen“ und
   blockierte die Tabelle bis zum Ende des Durchgangs.

## Umsetzung und technische Nachweise

| Repo | Time-box | Scope | GH-Issue |
|---|---|---|---|
| root (`frontend/`) | 2–3 h | Dashboard-Aufbau, `fx`-Store, Tests | — |

### Verify

Lauf „Teststack“: `scripts/stockinfo-test-server.py --stack --run --demo-accounts`
aus dem Root, sichtbares Chrome (80 px links, 50:50), Skript
`t69-switch.mjs` (siehe unten). Lauf „Unit“: `make test`.

Legende: ✅ live bestätigt · ⚠️ bestätigt mit Einschränkung (Fußnote) ·
◑ teilweise (Fußnote) · ➖ keine Live-Verifikation (nur Unit/Review).

| # | Lauf | Handgriff | Nachweis | woher | AI |
|---|:--:|---|---|---|:--:|
| 1 | Teststack | <a id="pruefpunkt-1"></a>Dashboard → Rebalancing → Dashboard innerhalb der Schonfrist, drei Runden | Tabelle sichtbar nach 274–293 ms (inkl. 200 ms `slowMo`); **keine** Anfrage an `/api/data/*` oder StockInfo. Vorher je Runde 3× `portfolio`, 2× `settings/current`, 1× `snapshots` | Mike | ⚠️¹ |
| 2 | Unit | <a id="pruefpunkt-2"></a>Abgelaufene Schonfrist bzw. ein fehlender Kurs, Abruf hängt | Tabelle steht mit gecachten Werten, Abruf läuft dahinter; innerhalb der Frist nur der fehlende Kurs | Schonfrist T-33 | ➖² |
| 3 | Unit | <a id="pruefpunkt-3"></a>Zweiter Aufbau, FX-Wiederverwendung, Tageswerte, fehlende Kurse | Kein erneuter Repository-, `getFx`- oder Kursabruf bei gültigem Stand; Gegenprobe ohne Änderung rot | Ursache 1–5 | ✅ |
| 4 | Teststack | <a id="pruefpunkt-4"></a>Zweites Fenster benennt das Verrechnungskonto um, während das erste auf Rebalancing steht | Nach Rückkehr zeigt das erste Dashboard den neuen Namen (SSE aus T-62) | T-62 | ✅ |

¹ Lokal antworten Konto-API und Teststack sofort; die alte Fassung brauchte im
selben Lauf ebenfalls nur 259–263 ms. Der Gewinn liegt in den entfallenen
Anfragen; die spürbare Zeit bei gehosteter StockInfo und Devisenkursen misst
erst Mikes Prüfung. Das Testdepot ist in EUR, ein FX-Abruf kommt darin nicht vor.
² Im Browser nicht nachgestellt (Schonfrist 60 min); abgedeckt durch
`dashboardRemount.spec.ts` und `quotes.spec.ts`.

### Akzeptanzkriterien

- [x] Der Ansichtswechsel lädt Depot, Einstellungen und Tageswerte nicht neu, wenn sie geladen sind.
- [x] Devisenkurse werden zum selben Kursstand wiederverwendet; neue Kurse oder „Erneut versuchen“ holen sie neu.
- [ ] Netzabrufe nach der Schonfrist oder für einzelne fehlende Kurse blockieren die Anzeige nicht, sobald Kurse im Cache liegen. Die Anzeige ist belegt; bei blockiertem `localStorage` bleibt der Zeitpunkt des letzten vollständigen Abrufs nach Teilabruf und erneutem Aufbau noch nicht korrekt erhalten (Review Runde 2).
- [x] Live-Abgleich über SSE liefert weiterhin den aktuellen Stand; Depotwechsel lädt die Tageswerte des neuen Depots.

### Side-Effects

Depotwechsel, Kontowechsel und SSE-Benachrichtigungen setzen den Stand neu;
diese Wege müssen den Cache weiterhin ersetzen. StockInfo bleibt unverändert.

## Coder-Übergabe · Runde 1 · claude-coder · 2026-10-01

**Prüfstand:** `f8bbe2040d771f150a307cfa4ed88d82fcd33396` gegen `1b6a49e`
(`master` mit T-66 und T-67), Branch `t-69-dashboard-ohne-neuladen`.

**Änderung:**

- `DashboardView.vue`: Depot und Einstellungen nur laden, wenn `loaded` fehlt
  (wie Rebalancing, Einstellungen, Assets). An- und Abmelden laden die Seite
  neu (`AuthRoot.vue`, `App.vue`), die Stores beginnen dann leer. Liegt für
  eine Depotposition ein Kurs im Cache, wird die Tabelle vor Health-Check und
  Kursabruf sichtbar; die Reihenfolge für den Tageswert bleibt.
- `stores/fx.ts`: optionaler `sourceStamp`; ein fehlerfreier Kurs zum selben
  Stand wird wiederverwendet. `usePortfolioValuation` bildet den Stempel aus
  allen `fetchedAt` der Kurse je Währung und bietet `retryFx` für „Erneut
  versuchen“ (lädt immer). Beide Ansichten verwenden `retryFx`.
- `stores/valueHistory.ts`: `ensure()` lädt nur bei anderem Depot oder anderer
  Währung; der Live-Abgleich ruft weiter `load()`.
- `stores/quotes.ts`: innerhalb der Schonfrist `loadMissing()` statt vollem
  Durchgang; andere Kurse, ihre Ausfälle und `lastRefreshAt` bleiben.

**Belege:** `make test` 845 Frontend- und 20 API-Tests grün; Lint und
Typecheck für `frontend` und `api` ohne Befund. Neue Tests:
`tests/views/dashboardRemount.spec.ts` (3), je einer in `fx.spec.ts`,
`valueHistoryCurrency.spec.ts` und `quotes.spec.ts`; jede Gegenprobe mit der
alten Fassung rot. `portfolioCurrency.spec.ts` verwendet jetzt `retryFx`, weil
der Wiederholen-Knopf einen veralteten Kurs ohne Fehler neu holen muss.
Sichtbarer Browsertest siehe Verify; Teststack danach gestoppt.

Browserskript zum Nachstellen (Teststack mit `--demo-accounts` vorher starten):
`node /private/tmp/claude-501/-Volumes-DevLocal-DevWeb-Production-StockPortfolio/7fcbb43b-ff4a-4ae1-87e1-2549374318e7/scratchpad/t69-switch.mjs <Testverzeichnis>/demo-accounts.json`.
Es meldet je Runde Zeit und Anfragen an `:8899` und `/api/data`.

**Doku-Abgleich:** `README.md`, `docker/README.md`, `unraid/README.md` und
`docs/` beschreiben das Laden beim Ansichtswechsel nicht; unverändert. Der
Einstellungshinweis „Kurse gelten als alt nach“ (`de`/`en`) bleibt zutreffend:
Jüngere Kurse werden nicht neu geholt, fehlende wie bisher schon.

**Lessons:** CLAUDE-LESSONS gelesen; SI-P-04/08 angewendet (Gegenprobe je
Test), SP-CL-01 (Branch im Root). Keine neue Lesson.

## Unabhängige Prüfung · Runde 1 · `codex-verifier` · 2026-10-01

**Prüffassung:** `f8bbe2040d771f150a307cfa4ed88d82fcd33396` gegen
`1b6a49e`; bis zum Review-HEAD `7cc660b` keine weitere Änderung unter
`frontend/src`, `frontend/tests` oder den beiden READMEs. **Urteil:
`changes_requested`.** Keine menschliche Abnahme.

**Blockierender Befund · Schonfrist nach Teilabruf:**
`quotes.loadMissing()` übernimmt neue einzelne Kurse mit
`commit(..., false)`, damit `lastRefreshAt` den Zeitpunkt des letzten
vollständigen Durchgangs behält. `DashboardView` ruft jedoch bei jedem
Ansichtswechsel `quotes.hydrate()` auf. Dort wird `lastRefreshAt` immer aus dem
neuesten `fetchedAt` aller persistierten Kurse neu gebildet. Beispiel mit
60 Minuten Schonfrist: vollständiger Abruf um 10:00, fehlender Kurs um 10:30
nachgeladen, zurück zum Dashboard um 10:31. Danach gilt 10:30 statt 10:00
als Abrufzeitpunkt. Um 11:01 werden die übrigen, über eine Stunde alten
Kurse nicht vollständig aktualisiert. Das widerspricht der zugesagten
Schonfrist und der Aussage, der Zeitstempel bleibe beim Teilabruf stehen.
Den Zeitpunkt über Teilabruf und erneutes Hydrieren konsistent halten und
eine Gegenprobe mit Ablauf der ursprünglichen Frist ergänzen. Der bestehende
Test in `quotes.spec.ts` prüft nur den Zustand *vor* dem erneuten `hydrate()`;
`dashboardRemount.spec.ts` ersetzt `hydrate()` durch einen Mock und kann
diesen Pfad daher nicht erkennen.

**Eigene Nachweise:** Quellvergleich von Dashboard-Aufbau, Kurs-, FX- und
Tageswert-Store sowie SSE-Live-Abgleich. Gezielter Vitest-Lauf: 4 Testdateien,
50 Tests grün. Der Coder hat den sichtbaren Browserlauf mit drei
Ansichtswechseln und die vollständigen Pflichtprüfungen im Übergabeteil
dokumentiert; ich habe diesen Browserlauf und die Pflichtprüfungen nicht
erneut ausgeführt. Der Fehler ist ein Ablaufbefund aus dem Code; die
Gegenprobe fehlt in der Übergabefassung.

**Doku-Abgleich:** `README.md` und `docker/README.md` beschreiben den
Ansichtswechsel nicht; für diesen Befund keine Textänderung nötig.
`unraid/README.md` und `docs/` enthalten ebenfalls keine Zusage zu diesem
Ladeverhalten. Die Angabe zur Schonfrist in der Oberfläche bleibt erst nach
Korrektur des Zeitstempels zuverlässig.

**Lessons-Einordnung:** Ein einzelner neuer Ablaufbefund; noch keine zweite
belegte Wiederholung. Keine lokale Lesson angelegt. Der Observer prüft beim
Rücklauf, ob ein vorhandener Eintrag zu ergänzen ist; der offene Schritt
bleibt hier sichtbar.

## Coder-Übergabe · Runde 2 · claude-coder · 2026-10-01

**Prüfstand:** `2bdf21beb8f0e511d149faf86a68d956782524bb` gegen `f8bbe20`
(Gesamtstand gegen `1b6a49e`), Branch `t-69-dashboard-ohne-neuladen`.

**Befund Schonfrist:** bestätigt. Ursache: `hydrate()` setzte `lastRefreshAt`
immer auf das jüngste `fetchedAt` im Cache; der Zeitpunkt des letzten
vollständigen Durchgangs war nirgends gespeichert. Der Fehler bestand auch vor
T-69 beim Neuladen der Seite nach einem Einzel-Refresh, T-69 machte ihn durch
`loadMissing()` und das Hydrieren bei jedem Wechsel häufig.

**Korrektur:** `commit()` schreibt den Zeitpunkt eines vollständigen
Durchgangs zusätzlich über `safeStorage` (`stockportfolio.quotes.lastRefreshAt`);
`hydrate()` liest ihn dort und nimmt nur ohne gespeicherten Wert wie bisher das
jüngste `fetchedAt`. Teilabruf und Einzel-Refresh schreiben ihn nicht. Grenze:
Blockiert der Browser `localStorage`, gilt der alte Rückfall.

**Gegenprobe:** neuer Test in `quotes.spec.ts`, zweifach (selber Tab und neuer
Seitenaufbau) mit dem Rechenbeispiel aus dem Review: Vollabruf 10:00,
Teilabruf 10:30, `hydrate()` 10:31 → Zeitpunkt bleibt 10:00; um 11:01 holt
`loadQuotesIfStale` beide Kurse. Mit der Fassung `f8bbe20` beide rot
(„expected 10:30 to be 10:00“), mit `2bdf21b` grün. `quotes.spec.ts` nutzt
dafür den vorhandenen Ersatzspeicher `installFakeStorage()`, weil die
jsdom-Umgebung keinen `localStorage` hat.

**Belege:** `make test` 847 Frontend- und 20 API-Tests grün; Lint und
Typecheck für `frontend` und `api` ohne Befund. Keinen neuen Browserlauf:
Die Korrektur betrifft nur den Ablauf über die 60-Minuten-Frist, den der
sichtbare Test nicht abbildet; Prüfpunkt 2 bleibt Unit-belegt.

**Doku-Abgleich:** unverändert wie in Runde 1; der Einstellungshinweis zur
Schonfrist ist mit der Korrektur zutreffend.

**Lessons:** SI-P-04/08 angewendet (Gegenprobe mit dem Review-Beispiel).
Keine neue Lesson; Einordnung beim Observer wie im Review vermerkt.

## Unabhängige Prüfung · Runde 2 · `codex-verifier` · 2026-10-01

**Prüffassung:** `2bdf21beb8f0e511d149faf86a68d956782524bb` gegen
`f8bbe2040d771f150a307cfa4ed88d82fcd33396`. Bis zum Review-HEAD
`f30a8aa` keine spätere Änderung an Produktcode, Tests oder READMEs.
**Urteil: `changes_requested`.** Keine menschliche Abnahme.

**Behobener Teil:** Mit verfügbarem `localStorage` hält die neue Speicherung
den Zeitpunkt des vollständigen Kursabrufs über Teilabruf und erneutes
`hydrate()` fest. Die Gegenprobe verwendet echte Kurs- und Cache-Repositories,
setzt 10:00 / 10:30 / 10:31 / 11:01 als Zeitpunkte und prüft beide Kurse beim
Ablauf der ursprünglichen 60-Minuten-Frist. Sie ist für diesen Fall passend.

**Verbleibender blockierender Befund · derselbe Tab ohne `localStorage`:**
`safeStorage.write()` kann `false` liefern, und `safeStorage.read()` liefert
dann `null`. Obwohl `lastRefreshAt` im laufenden Store nach dem Vollabruf um
10:00 noch 10:00 enthält, überschreibt `hydrate()` es um 10:31 mit dem
jüngsten `fetchedAt` des um 10:30 einzeln nachgeladenen Kurses. Damit wird
um 11:01 erneut kein vollständiger Abruf ausgelöst. Der Dashboard-Aufbau
ruft `hydrate()` bei jedem Ansichtswechsel auf; ein Browser-Neustart ist für
diesen Fehler nicht nötig. Der neue Test installiert in `beforeEach` stets
einen funktionierenden Ersatzspeicher und deckt diesen Pfad nicht ab. Den
vorhandenen Zeitpunkt im laufenden Store beim Hydrieren erhalten und die
gleiche Ablaufprobe mit nicht verfügbarem `localStorage` ergänzen. Für einen
vollständigen Browser-Neustart ohne verfügbaren Speicher kann der im
Coder-Übergabetext benannte Rückfall gesondert als Grenze stehen bleiben.

**Eigene Nachweise:** Gezielter Vitest-Lauf mit `quotes.spec.ts` und
`dashboardRemount.spec.ts`: 45 Tests grün. Der Befund folgt aus dem
`safeStorage`-Rückgabevertrag, `quotes.hydrate()` und dem Dashboard-Aufruf;
einen Browserlauf habe ich nicht wiederholt. Coder-Nachweise für `make test`,
beide Lints und Typprüfungen stehen in der Übergabe. `README.md` und
`docker/README.md` enthalten weiter keine Aussage zum Ansichtswechsel;
kein neuer Dokumentationsbedarf. Lessons-Einordnung bleibt beim Observer;
dies ist derselbe Ablaufbefund aus Runde 1, kein neuer unabhängiger Vorfall.
