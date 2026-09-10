# T-05 · Persistenz — IndexedDB-Schema + Pinia-Stores

| Repo | Status | Time-box | Scope | GH-Issue |
|---|---|---|---|---|
| root | done | ~2 h | Persistenz + Editier-Funktionen | — |

**Löst:** Macht Positionen editierbar und dauerhaft. Bestand, Ziel-%,
Bezeichnung, Gruppe, Aktiv-Flag und Notizen werden in IndexedDB gespeichert
und überleben den Reload. Der Trade-Simulator bekommt einen funktionierenden
„Übernehmen"-Button. Damit verschwindet `MOCK_PORTFOLIO` aus dem Dashboard.

---

## Verify

Legende: ✅ live bestätigt · ⚠️ bestätigt mit Einschränkung (Fußnote) ·
◑ teilweise (Fußnote) · ➖ keine Live-Verifikation (nur Unit/Review).

| # | Where | Look for | AI | Human |
|---|---|---|:--:|---|
| 1 | `src/db/schema.ts` | 4 Object-Stores (`portfolios`, `settings`, `quoteCache`, `instrumentAllowlist`), DB-Version 1, `upgrade`-Callback | ✅¹ | |
| 2 | `src/db/repository.ts` | 4 Repository-Klassen kapseln jeden IndexedDB-Zugriff — `idb` wird nirgends außerhalb `src/db/` importiert | ✅² | |
| 3 | `src/stores/portfolio.ts` | Pinia-Store: `load`, `updatePosition`, `addPosition`, `removePosition`, `applyTrade`; schreibt bei jeder Änderung durch | ✅³ | |
| 4 | `src/stores/settings.ts` | Pinia-Store für Bänder, Save-Asset-Grenze, Reserve, Budget, Rundung, Refresh, UI-Spalten | ✅¹ | |
| 5 | Erst-Start (leere DB) | Portfolio wird einmalig aus der Excel-Vorlage geseedet; der zweite Start lädt das gespeicherte, seedet **nicht** erneut | ✅³ | |
| 6 | Drilldown → Bestand ändern | Wert wird sofort gespeichert; Marktwert, IST-%, Delta-Balken und Status aktualisieren sich live | ◑⁴ | |
| 7 | Drilldown → Ziel-% ändern | Bänder und Vorschlag rechnen neu | ◑⁴ | |
| 8 | Drilldown → Aktiv-Toggle | Deaktivierte Position fliegt aus Total und Tabelle, ohne gelöscht zu werden | ✅³ | |
| 9 | Trade-Simulator → „Übernehmen" | Bestand wird um die Trade-Menge angepasst, Eingabefeld springt auf 0 | ◑⁴ | |
| 10 | Browser-Reload (F5) | Alle Änderungen sind noch da | ◑⁵ | |
| 11 | `tests/db/repository.spec.ts` | 20 Tests gegen `fake-indexeddb`: CRUD je Store, Rundlauf verschachtelter Positionen, Überschreiben statt Duplizieren, Store-Isolation | ✅³ | |
| 12 | `tests/stores/portfolio.spec.ts` | 16 Tests: Seeding nur einmal, Änderungen überleben Neustart, ID unveränderlich, `applyTrade` +/−, Bestand nie negativ | ✅³ | |
| 13 | `npm run test` / `typecheck` / `build` / `lint` | **148 Tests grün**, typecheck grün, build grün, lint sauber (0 Fehler, 0 Warnungen) | ✅³ | |

> ¹ **(CC):** Beim Anlegen gegen das Design-Doc §5 geprüft.
> ² **(CC):** `grep -rn "from 'idb'" src/` trifft nur `src/db/schema.ts` und `src/db/repository.ts`.
> ³ **(CC):** Lokal ausgeführt (2026-08-07) — `npm run test` 148/148, `typecheck`, `build`, `lint` alle grün. Seeding-Einmaligkeit, Persistenz über Neustart und `applyTrade`-Grenzfälle sind explizit als Tests abgedeckt.
> ⁴ **(CC):** Die **Logik** dahinter ist getestet (`updatePosition` persistiert und ändert nur das angegebene Feld, `applyTrade` addiert/subtrahiert korrekt und klemmt bei 0). Die **Bedienung im Browser** — Eingabefeld tippen, Balken springt, Simulator setzt auf 0 zurück — habe ich nicht selbst gesehen. Bitte gegenprüfen.
> ⁵ **(CC):** Der Reload-Pfad ist auf Store-Ebene getestet (frische Pinia-Instanz + `load()` liefert die geänderten Werte), ein echtes F5 im Browser habe ich nicht ausgeführt.

---

## Details

### Kontext / Ziel
Bis jetzt sind alle Positionen hartkodiert. Der Nutzer muss Bestände pflegen
können — das ist der Kern des Werkzeugs. Persistenz liegt im Browser
(IndexedDB), kein Backend.

### Architektur (nach `code-standards`)
```
Komponente  →  Pinia-Store  →  Repository  →  IndexedDB
(Darstellung)  (State+Logik)   (DB-Zugriff)   (idb)
```
Kein `idb`-Import außerhalb von `src/db/`.

### Seeding-Entscheidung
Beim allerersten Start ist die DB leer. Da der Add-Position-Dialog erst in
T-10 kommt, wäre ein leeres Portfolio eine Sackgasse. Deshalb: einmaliges
Seeding aus der Excel-Vorlage. Sobald T-10 steht, kann das Seeding auf ein
leeres Portfolio umgestellt werden (dann ist es eine bewusste Wahl, keine
Notlösung).

### Akzeptanzkriterien
- [ ] `src/db/schema.ts` + `src/db/repository.ts`
- [ ] `src/stores/portfolio.ts` + `src/stores/settings.ts`
- [ ] Drilldown-Felder editierbar und persistent
- [ ] Trade-Simulator „Übernehmen" funktioniert
- [ ] `MOCK_PORTFOLIO` wird vom Dashboard nicht mehr gelesen
- [ ] Tests für Repository und Store
- [ ] Ticket-Close + Commit

### Side-Effects
- Neue Dev-Dependency `fake-indexeddb` (nur Tests)
- Der Browser hält jetzt Nutzerdaten — Export/Import kommt in T-11

### Auflösung
Commit folgt nach Close.

**Bug gefunden und behoben — betraf auch den Browser:** Vue verpackt Store-State
in reaktive Proxies. IndexedDB serialisiert mit dem Structured-Clone-Algorithmus,
der daran scheitert (`DataCloneError: [object Array] could not be cloned`). Ohne
Fix wäre **jedes Speichern** fehlgeschlagen — der Test hat es aufgedeckt, bevor es
jemand im Browser gemerkt hätte. Fix: `toStorable()` an der Persistenz-Grenze im
Repository, das per JSON-Rundlauf eine proxy-freie Kopie erzeugt. Unser Datenmodell
ist reines JSON, daher verlustfrei.

**Abweichung vom Ticket-Plan — `quoteCache` wurde ein echter Store:** Das Schema
sah einen `quoteCache`-Object-Store vor, und `QuoteCacheRepository` wäre sonst tote
Code geblieben. Statt das aus T-04 stammende `useQuotes`-Composable
danebenstehen zu lassen, ist daraus `src/stores/quotes.ts` geworden — mit
Persistenz. Zwei Vorteile: die App zeigt beim Start sofort die zuletzt bekannten
Kurse (`hydrate()`), und ein fehlgeschlagener Refresh reißt keine Lücke mehr,
sondern behält den alten Kurs und markiert ihn `stale`. `useQuotes.ts` und
`useSharedQuotes.ts` sind entfallen; ihre Tests sind in
`tests/stores/quotes.spec.ts` aufgegangen (16 Tests).

**ESLint-Konfiguration korrigiert:** Die Basis-Regeln `no-undef` und
`no-unused-vars` verstehen TypeScript nicht und meldeten 31 Fehlalarme —
`defineEmits`-Typsignaturen als „unbenutzte Variablen", `Response`/`crypto` als
„undefiniert". Beide Basis-Regeln abgeschaltet, die TS-Varianten übernehmen; die
Browser-Globals sind jetzt vollständig deklariert. Ein echter Fund blieb übrig:
ein unbenutztes `const props =` in `AppTopbar.vue`.

**`src/mock/portfolio.ts` ist entfallen** — die Positionen kommen jetzt aus
IndexedDB, geseedet über `src/db/seed.ts`.

**Für T-10 vormerken:** Sobald der Add-Position-Dialog steht, kann das Seeding auf
ein leeres Portfolio umgestellt werden. Dann ist es eine bewusste Wahl statt einer
Notlösung — und Erstnutzer starten nicht mit fremden Beständen.
