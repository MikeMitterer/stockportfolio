# T-31 · „Aktualisieren" holt wirklich frische Kurse

| Repo | Status | Time-box | Scope | GH-Issue |
|---|---|---|---|---|
| root | in-progress | ~1 h | UI + Store + Client | — |

**Löst:** Der Knopf tat je nach Zeitpunkt etwas anderes. `GET /quote/{isin}`
respektiert im Dienst eine TTL von sechs Stunden — innerhalb davon kam der Kurs
aus dessen SQLite-DB, der Klick änderte also nichts. Für das automatische Laden
ist die TTL richtig, für einen ausdrücklichen Klick nicht.

---

## Verify

Legende: ✅ live bestätigt · ⚠️ bestätigt mit Einschränkung (Fußnote) ·
◑ teilweise (Fußnote) · ➖ keine Live-Verifikation (nur Unit/Review).
`AI` = nur KI · `Human` = nur Mensch (nie überschreiben).

| # | Where | Look for | AI | Human |
|---|---|---|:--:|-------|
| 1 | Netzwerk-Tab, Klick auf „Aktualisieren" | Je Position ein `POST /refresh/…`, kein `GET /quote/…` | ✅¹ | okute |
| 2 | dito, Seite neu laden (F5) | Weiterhin `GET /quote/…` — die TTL gilt beim automatischen Laden unverändert | ✅¹ | ok    |
| 3 | dito, Ansicht wechseln (Dashboard ↔ Ausgleichen) | Ebenfalls `GET`, kein erzwungener Abruf | ➖² |       |
| 4 | Kopfzeile | Der Klick dauert jetzt spürbar; der Spinner läuft die ganze Zeit und der Knopf bleibt gesperrt | ➖² |       |
| 5 | Papier **ohne** ISIN, Drilldown → „Kurs neu laden" | `POST /refresh/by-symbol/…` statt `GET /quote?symbol=…` | ✅¹ |       |
| 6 | Zweimal kurz hintereinander aktualisieren | Kein doppelter Durchgang — der Knopf ist während des Abrufs gesperrt | ➖² |       |
| 7 | Dienst gestoppt | Der Abruf scheitert wie bisher; alte Kurse bleiben stehen, Fehler erscheinen als Toast | ➖² |       |
| 8 | Terminal | `npm run typecheck && npm run lint && npm run test && npm run build` | ✅³ |       |

> ¹ **(CC):** Test-first, `tests/stores/quotes.spec.ts` — geprüft wird, welcher Client-Aufruf ergeht: mit `force` `refreshByIsin`/`refreshBySymbol`, ohne `force` `getQuoteByIsin`/`getQuoteBySymbol`. Der Client ist dabei eine Attrappe; dass die Adressen stimmen, sagt nur der Netzwerk-Tab.
> ² **(CC):** Reine Sichtprüfung, dafür gibt es keinen Test.
> ³ **(CC):** Am 2026-08-19 gelaufen: typecheck ✓, lint ✓, vitest 34 Dateien / 542 Tests ✓, build ✓.

### Kurz-Testblock

```bash
npm run dev     # #1–#7 unter http://localhost:5175/#/
npm run test    # #1, #2, #5, #8
```

Für #1/#2/#5 die Entwicklerwerkzeuge auf „Netzwerk" stellen und nach `refresh`
bzw. `quote` filtern.

---

## Details

### Kontext / Ziel

Nachgesehen im Dienst (`${DEV_LOCAL}/DevWeb/Production/StockInfo`):

- `GET /quote/{isin}` geht über `CachedQuoteService._get` — frischer Cache wird
  genutzt, sonst live beschafft (`app/services/quote_cache.py:509`).
- `POST /refresh/{isin}` „umgeht die TTL bewusst" (`quote_cache.py:268`).
- TTL ist `Settings.cache_ttl_hours`, Vorgabe sechs Stunden (`app/config.py:27`).

`loadQuotes` bekommt daher `{ force }`. Gesetzt wird es an genau einer Stelle —
dem Klick in `App.vue`. Die vier übrigen Aufrufer (Seitenaufruf,
Ansichtswechsel in Dashboard und Ausgleichen, Depotwechsel) bleiben unverändert
und damit TTL-freundlich.

Die Wahl des Endpunkts steht jetzt in **einer** Funktion `requestQuote(client,
position, force)` — zwei Achsen, ISIN oder Symbol und TTL oder erzwungen.
`refreshOne` nutzt sie mit `force: true` mit; vorher stand die Auswahl zweimal
da, mit einem Unterschied, den niemand beabsichtigt hatte (siehe unten).

**Mitgenommene Lücke:** Der Dienst kennt `POST /refresh/by-symbol/{symbol}`,
der Client dieser App nicht. Ein Papier ohne ISIN fiel deshalb auf
`getQuoteBySymbol` zurück — der Knopf hieß „Kurs neu laden" und las den Cache.
`refreshBySymbol` ist ergänzt, beide Wege nutzen ihn.

**Nicht genommen:** `POST /refresh` für alle Instrumente. Es aktualisiert auch
Papiere, die in keinem Depot stehen, und bringt mit seinem Lock ein `409` mit,
das behandelt werden müsste.

### Akzeptanzkriterien

- [x] Der Klick löst je Position einen erzwungenen Abruf aus.
- [x] Automatisches Laden bleibt bei der TTL.
- [x] Papiere ohne ISIN bekommen ebenfalls einen echten Refresh — global wie einzeln.
- [x] Die Endpunkt-Wahl steht an einer Stelle.
- [ ] #3, #4, #6, #7 vom Menschen gesehen.

### Side-Effects

**Der Klick dauert jetzt länger, und zwar mit Absicht.** Statt einer
SQLite-Abfrage im Dienst sind es n Live-Abrufe gegen yfinance und justETF. Die
bestehende Begrenzung auf sechs gleichzeitige Anfragen
(`MAX_CONCURRENT_REQUESTS`) greift weiter, aber bei zwanzig Papieren sind das
spürbar mehrere Sekunden. Der Spinner aus T-30 hat damit erstmals einen echten
Grund — und die Mindestanzeigedauer bleibt trotzdem sinnvoll, weil das
automatische Laden weiterhin in Millisekunden fertig sein kann.

Der Fehlerfall ist unverändert: Scheitert die Live-Beschaffung, liefert der
Dienst den alten Wert als `stale` statt eines Fehlers.

### Auflösung

Wird zuletzt gefüllt. Commit-Hash(es), Lint-Status, Findings.
