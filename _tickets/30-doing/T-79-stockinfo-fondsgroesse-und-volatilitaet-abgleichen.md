# T-79 · Fondsgröße und Volatilität aus StockInfo T-88/T-89 abgleichen

**Warum dieses Ticket:** StockInfo behebt zwei Fehler in seinen Detailwerten.
Beide wirken auf StockPortfolio, weil StockPortfolio StockInfos Detailwerte
generisch anzeigt (`frontend/src/domain/detailFields.ts`,
`projectDetailFields`). Dieses Ticket hält die Auswirkungen fest und sorgt
dafür, dass StockPortfolio nach beiden StockInfo-Tickets richtig anzeigt.

- [StockInfo T-88](/Volumes/DevLocal/DevWeb/Production/StockInfo/_tickets/30-doing/T-88-fondsgroesse-in-euro.md):
  Die Fondsgröße kam in Millionen, war aber als absoluter Betrag
  deklariert (`unit: absolute`). Neu: überall `unit: millions`, Währung
  aus der Quelle (justETF: EUR) oder aus der manuellen Eingabe.
- [StockInfo T-89](/Volumes/DevLocal/DevWeb/Production/StockInfo/_tickets/30-doing/T-89-volatilitaet-fuer-alle-typen.md):
  StockInfo berechnet die Volatilität für alle Instrumente, deklariert sie
  in `GET /fields` aber nur für `etf` und `etc` (über justETF). Neu:
  StockInfo deklariert `volatility` selbst für alle Typen mit Kursen.

**Stand:** Angelegt am 2026-10-02 aus StockInfo (Mike: „Verifiziere ob das
Problem aus T-88 nicht auf StockPortfolio durchschlägt … Das selbe gilt
auch für T-89 … erstell in StockPortfolio in doing ein entsprechendes
Ticket“). Liegt in `30-doing/`; Rollen und Aktivierung legt
StockPortfolios `STATUS.md` fest. StockInfo T-88 ist in Runde 2 bei Codex,
T-89 noch nicht begonnen.

## Analyse (Claude, 2026-10-02, mit StockPortfolios Code geprüft)

Prüfweg: StockInfo mit temporärer Datenbank (EUNL.DE, APC.DE, GOLD.SG,
VTI mit manueller Fondsgröße 30 USD). Dessen echte Antworten von
`GET /fields` und `GET /instruments` liefen durch StockPortfolios
`normalizeFields`, `normalizeInstruments`, `toFieldCatalog`,
`instrumentToQuoteCacheEntry` und `projectDetailFields` (`vite-node`,
Skript außerhalb des Repos; StockPortfolio blieb unverändert). Den Stand
vor T-88 stellte das Skript nach, indem es die Einheit auf `absolute`
zurücksetzte.

### Fondsgröße (T-88)

| Instrument | vor T-88 | nach T-88 |
|---|---|---|
| EUNL.DE (justETF, 129.791 Mio. EUR) | **129.791,00 €** — um den Faktor 1 Mio. zu klein | 129.791,00 € million |
| VTI (manuell 30 Mio. USD) | 30,00 $ | 30,00 $ million |

- **Der Fehler schlug durch.** Die Zusatzinformationen einer Position
  zeigten vor T-88 dieselbe falsche Größenordnung wie StockInfo selbst.
- **T-88 behebt ihn ohne Codeänderung hier.** `valueText` kennt die Einheit
  `millions` bereits (`detailFields.millions`: „Mio.“ / „million“).
- **Kurzzeitig „—“ nach dem Update:** Der Kurs-Cache liegt in IndexedDB
  (`stores/quotes.ts`). Ein gespeicherter Detailwert mit alter Einheit
  `absolute` trifft auf die neue Definition `millions`; `valueText` gibt
  bei abweichender Einheit „—“ aus. Das endet mit dem nächsten Kursabruf.
- **Darstellung:** Die Reihenfolge ist „129.791,00 € Mio.“ (deutsch).
  StockInfo zeigt „129.791 Mio. EUR“. Ob StockPortfolio die Einheit vor die
  Währung stellt, ist hier zu entscheiden.
- **Fixtures:** Die Kopie unter `frontend/tests/fixtures/stockinfo/` steht
  noch auf `fund_size: 89123000000.0`; der Abgleich ist Teil von T-78.
- Die flachen Felder `fund_size` (`api/types.ts`, `normalizers.ts`) zeigt
  StockPortfolio nirgends an.

### Volatilität (T-89)

| Instrument | flacher Wert | Zusatzinformationen heute |
|---|---|---|
| EUNL.DE (ETF) | 10,67 | 10,67 % |
| APC.DE (Aktie) | 26,11 | **nicht gezeigt** |
| GOLD.SG (Fonds) | 27,0 | **nicht gezeigt** |

- **Heute fehlt die Volatilität bei Aktien und Fonds in den
  Zusatzinformationen.** `projectDetailFields` hat einen eigenen Rückfall
  für `ter` und `volatility` aus den flachen Feldern. Weil `GET /fields`
  aber `volatility` (justETF, Typen `etf`, `etc`) schon deklariert, ersetzt
  diese Definition den Rückfall, und die Gattungsprüfung blendet den Wert
  bei `stock` und `fund` aus.
- **Die Instrumentenansicht ist nicht betroffen.** `InstrumentsView.vue`
  zeigt die Spalte aus dem flachen Wert `row.volatility`; ebenso
  `AddPositionDialog.vue`.
- **Nach T-89** deklariert StockInfo `volatility` für alle Typen. Dann
  erscheint der Wert auch hier, **sofern** die Deklaration die Gattungen
  `stock` und `fund` und die passenden Identitätsarten in `scopes` nennt.
  Das ist als Anforderung an StockInfo T-89 vermerkt.

### Nebenbefund

`InstrumentsView.vue` zeigt TER aus dem flachen Wert `row.ter`, auch bei
Aktien. StockInfo blendet alte TER-Werte bei Aktien seit seinem T-56 aus,
wenn das Feld für die Gattung nicht deklariert ist. Ob StockPortfolio
dieselbe Regel braucht, ist hier offen.

## Was zu tun ist

1. Nach StockInfo T-88: Fondsgröße in einer Position sichtbar prüfen (ETF mit
   justETF, ETF mit manueller USD-Angabe), Darstellung „€ Mio.“ bewerten.
2. Nach StockInfo T-89: Volatilität einer Aktie und eines Fonds in den
   Zusatzinformationen sichtbar prüfen.
3. Entscheiden, ob das kurzzeitige „—“ aus dem IndexedDB-Cache hingenommen
   wird oder der Cache bei einem neuen Feldkatalog verworfen wird.
4. Nebenbefund TER bei Aktien bewerten.

### Akzeptanzkriterien

- [ ] Die Zusatzinformationen zeigen die Fondsgröße eines justETF-ETFs in
      der richtigen Größenordnung und eine manuelle Angabe in ihrer Währung.
- [ ] Nach StockInfo T-89 zeigen die Zusatzinformationen die Volatilität
      bei Aktie und Fonds.
- [ ] **Sichtbare Prüfung im Browser** (nicht headless) mit Teststack bzw.
      StockInfo-Temp-Instanz; Screenshots als Beleg im Ticket.
- [ ] Entscheidungen zu Darstellung, Cache und Nebenbefund sind im Ticket
      festgehalten.

### Side-Effects

Hängt an StockInfo T-88 und T-89; der Fixture-Abgleich gehört zu T-78.
