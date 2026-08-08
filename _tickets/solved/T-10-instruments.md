# T-10 · Instrumente-View + Position hinzufügen

| Repo | Status | Time-box | Scope | GH-Issue |
|---|---|---|---|---|
| root | done | ~2 h | Instruments-View + Add-Dialog + Whitelist | — |

**Löst:** Macht die App ohne Beispiel-Depot benutzbar. Die Instrumente-Seite
zeigt den Katalog aus `GET /instruments` mit Suche und Filtern; ein Toggle je
Papier steuert, was im Hinzufügen-Dialog auftaucht (Whitelist). Vom Dashboard
aus lassen sich Positionen anlegen.

---

## Verify

Legende: ✅ live bestätigt · ⚠️ bestätigt mit Einschränkung (Fußnote) ·
◑ teilweise (Fußnote) · ➖ keine Live-Verifikation (nur Unit/Review).

| # | Where | Look for | AI | Human |
|---|---|---|:--:|---|
| 1 | `/instruments` | Tabelle mit allen Papieren aus der API: Symbol, ISIN, Name, Typ, Kurs, TER, Volatilität, Anzahl Kurspunkte | ✅¹ | |
| 2 | `/instruments` | Suchfeld filtert über Symbol, ISIN und Name | ✅² | |
| 3 | `/instruments` | Filter nach Typ (ETF / Aktie) | ◑³ | |
| 4 | `/instruments` | Toggle je Zeile („In Auswahl"), Zustand überlebt den Reload | ✅⁴ | |
| 5 | `/instruments` | Papiere, die bereits im Depot liegen, sind als solche markiert und nicht doppelt hinzufügbar | ✅⁵ | |
| 6 | Dashboard | Knopf „Position hinzufügen" öffnet den Dialog — in der Positionen-Überschrift und im Leer-Zustand | ✅¹ | |
| 7 | Add-Dialog | Auswahl nur aus freigegebenen (Whitelist) und noch nicht enthaltenen Papieren | ✅⁵ | |
| 8 | Add-Dialog | Felder: Instrument, Bestand, Ziel-%, Assetklasse (per Namens-Heuristik vorbelegt) | ✅⁶ | |
| 9 | Add-Dialog → Anlegen | Position erscheint in der richtigen Gruppe, Kurs wird geladen, Werte stimmen | ✅⁷ | |
| 10 | Leeres Depot | Der Leer-Zustand führt zum Add-Dialog, nicht in eine Sackgasse | ✅¹ | |
| 11 | `tests/stores/instruments.spec.ts` | 9 Tests: Katalog laden, API-Fehler ohne Werfen, Whitelist-Default „erlaubt", Toggle persistiert und überlebt Neustart, Symbol-Fallback als Schlüssel | ✅⁸ | |
| 12 | `npm run test` / `typecheck` / `build` / `lint` | **176 Tests grün**, alles sauber | ✅⁸ | |

> ¹ **(CC):** Im Browser gesehen (2026-08-08) — Instrumente-Seite zeigt alle 8 Papiere mit Kursen, TER und Volatilität; Leer-Zustand bietet „Position hinzufügen" neben „Beispiel-Depot laden".
> ² **(CC):** Eingabe „Gold" filterte live auf 4GLD.DE herunter.
> ³ **(CC):** Der Typ-Filter ist verdrahtet und typgeprüft, aber im Browser habe ich nur die Suche ausprobiert, nicht das Typ-Dropdown.
> ⁴ **(CC):** Toggle für BRYN.DE umgelegt, danach direkt aus IndexedDB gelesen: `[{"key":"US0846707026","enabled":false}]`.
> ⁵ **(CC):** Nach dem Anlegen trug 4GLD.DE das Kennzeichen „im Depot"; im Add-Dialog erschienen danach 6 statt 8 Papiere — BRYN fehlte (gesperrt), 4GLD fehlte (bereits enthalten). Beide Filter greifen also gleichzeitig.
> ⁶ **(CC):** Auswahl von „Xetra-Gold" setzte die Gruppe selbsttätig auf Edelmetalle; das Kontext-Panel zeigte ISIN, Kurs 121,10 € und Volatilität 25,1 %.
> ⁷ **(CC):** 80 Stück angelegt → Position landete unter Edelmetalle, Kurs wurde nachgeladen (121,10 €), Marktwert 9.688 €, Delta −3,1 % innerhalb des Bands → Status „OK". Rechnerisch stimmig.
> ⁸ **(CC):** Lokal ausgeführt (2026-08-08).

---

## Details

### Kontext / Ziel
Seit dem Onboarding-Umbau startet die App leer. Ohne diesen Schritt kommt ein
neuer Nutzer nur über das Beispiel-Depot zu Daten — das ist keine Lösung.

### API-Fakten (live geprüft, 2026-08-08)
`GET /instruments` liefert aktuell 8 Papiere, alle in EUR:
- Typen: `etf` (6), `stock` (2)
- Anbieter: iShares, Vanguard, Invesco, `null` (bei Einzelaktien)
- `ter`, `provider`, `replication`, `fund_size` sind bei Aktien `null`
- `latest_price` kann `null` sein, wenn noch kein Kurs abgerufen wurde

### Assetklassen-Zuordnung
Die API kennt nur `etf` / `stock` — unsere vier Gruppen (Aktien, Anleihen,
Edelmetalle, Cash) sind feiner. Der Dialog schlägt anhand von Name und Typ
eine Gruppe vor (z.B. „Bond" im Namen → Anleihen, „Gold" → Edelmetalle) und
lässt sie ändern. Ein Vorschlag, keine Automatik.

### Whitelist-Verhalten
Beim ersten Laden ist der Allowlist-Store leer. Dann gilt: **alles
freigegeben**. Ausblenden ist damit ein bewusster Akt, kein Zwang zum
Freischalten von acht Papieren vor der ersten Nutzung.

### Akzeptanzkriterien
- [ ] `src/stores/instruments.ts` — Katalog + Whitelist
- [ ] `src/views/InstrumentsView.vue` — Tabelle, Suche, Filter, Toggle
- [ ] `src/components/AddPositionDialog.vue`
- [ ] Dashboard: Knopf in der Positionen-Überschrift + im Leer-Zustand
- [ ] Tests für Store und Gruppen-Vorschlag
- [ ] Ticket-Close + Commit

### Side-Effects
- `AllowlistRepository` wird erstmals benutzt (lag seit T-05 ungenutzt)

### Auflösung
Commit folgt nach Close.

**Assetklassen-Vorschlag als eigenes Domain-Modul:** Die API kennt nur
`etf`/`stock`, unsere vier Gruppen sind feiner. `src/domain/assetGroup.ts`
leitet aus dem Namen ab (Metall-Hinweise vor Anleihe-Hinweisen, sonst
„Aktien"). Bewusst ein Vorschlag, kein Automatismus — der Dialog setzt die
Gruppe vor, der Nutzer kann sie ändern. Als reine Funktion getestet
(11 Fälle), nicht über die Oberfläche.

**Whitelist-Default „erlaubt":** Ein leerer Allowlist-Store heißt „noch nichts
ausgeblendet", nicht „nichts erlaubt". Sonst müsste man vor der ersten Nutzung
acht Papiere freischalten. Ausblenden ist damit ein bewusster Akt.

**Zwei Filter im Add-Dialog, die zusammenwirken:** Whitelist *und* „schon im
Depot". Im Browser gegengeprüft: nach dem Sperren von BRYN und dem Anlegen von
4GLD blieben 6 von 8 Papieren übrig.

**Cash bleibt außen vor:** Die Gruppen-Auswahl im Dialog bietet nur Aktien,
Anleihen und Edelmetalle an — die Cash-Position gibt es je Depot genau einmal
und sie wird beim Anlegen des Depots erzeugt, nicht über Instrumente.

**`AllowlistRepository` ist jetzt in Benutzung** — es lag seit T-05 ungenutzt
im Code.

**Nicht umgesetzt, bewusst:** Ein Papier, das die API nicht kennt, lässt sich
nicht anlegen (freie ISIN-Eingabe). Der Katalog ist laut Entscheidung im
Brainstorming die Basis; wächst der Bedarf, wäre `GET /quote/{isin}` als
Live-Prüfung der nächste Schritt.
