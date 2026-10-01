# T-78 · Lesbare Testdaten im Teststack und Fondsgröße in den Fixtures

**Warum dieses Ticket:** Die Testdaten für StockInfo taugen nicht für
Screenshots und sichtbare Browserprüfungen, und eine Kopie der
StockInfo-Vertragsbeispiele ist veraltet.

1. **Demodaten im Teststack.** `scripts/stockinfo-test-server.py` legt auch
   mit `--demo-details` Instrumente mit Testfallnamen an: „T39 Kryptopaar“,
   „T39 OTC Anleihe“, „T39 Mehrdeutig XNAS“ und „T39 Mehrdeutig XNYS“ (zweimal
   `DUAL`), „T39 Pence Listing“. Fast alle tragen TER 0,2 %, auch BTC. Das
   sind wertvolle Randfälle für Tests, aber kein verständliches Bild für
   Screenshots oder für Mikes Sichtprüfung.
2. **Fondsgröße in den Fixtures.** StockInfo führt die Fondsgröße seit
   [StockInfo T-88](/Volumes/DevLocal/DevWeb/Production/StockInfo/_tickets/30-doing/T-88-fondsgroesse-in-euro.md)
   einheitlich in Mio. EUR. StockInfos Vertragsbeispiele stehen dort auf
   `"fund_size": 89123.0`. Unsere Kopie unter
   `frontend/tests/fixtures/stockinfo/` (`instruments-200.json`,
   `quote-200.json`) steht noch auf `89123000000.0`.

**Beispiel:** Für die StockInfo-Screenshots am 2026-10-01 musste Claude eine
eigene StockInfo-Instanz mit echten Livedaten aufsetzen. Der Teststack
zeigte 14 Einträge, darunter „T39 Kryptopaar“ für 50.000 EUR mit TER 0,2 %.

**Stand:** Angelegt am 2026-10-01 aus StockInfo heraus (Mike: „Leg ein Ticket
in StockPortfolio an zum Thema Testdaten … Das Ticket in StockPortfolio soll
gleich nach doing“). Liegt in `30-doing/`; Rollen und Aktivierung legt
StockPortfolios `STATUS.md` fest. Punkt 2 wartet auf die technische Freigabe
von StockInfo T-88.

## Was zu tun ist

- **Lesbarer Demomodus:** Mit `--demo-details` zeigt der Teststack nur
  verständliche Instrumente mit echten Namen und plausiblen Werten: etwa
  zwei ETFs mit TER, Anbieter, Fondsgröße und Volatilität, eine Aktie ohne
  TER, Gold. Keine Testfallnamen, keine Dubletten.
- **Randfälle bleiben:** Ohne `--demo-details` bleiben die T39-Fälle
  (Kryptopaar, OTC-Anleihe, mehrdeutiges Symbol, Pence-Listing) erhalten;
  die Tests, die sie brauchen, laufen unverändert.
- **Fixture-Abgleich:** `fund_size` in beiden Fixtures auf `89123.0`, sobald
  StockInfo T-88 freigegeben ist. Prüfen, ob ein Test oder Normalizer eine
  Größenordnung annimmt.

### Akzeptanzkriterien

- [ ] `--stack --run --demo-details` zeigt im Browser nur lesbare
      Instrumente ohne „T39“ im Namen und ohne doppelte Symbole.
- [ ] Die Randfälle stehen ohne `--demo-details` weiter zur Verfügung; die
      betroffenen Tests sind grün.
- [ ] `frontend/tests/fixtures/stockinfo/` stimmt bei `fund_size` mit
      StockInfos Vertragsbeispielen überein.
- [ ] **Sichtbare Prüfung im Browser** (nicht headless): Teststack mit
      `--demo-details` starten, Assets-Übersicht und eine Detailansicht
      ansehen; Ergebnis mit Screenshot im Ticket.
- [ ] Doku-Abgleich: `AGENTS.md` und `README.md` beschreiben, was
      `--demo-details` zeigt.

### Side-Effects

StockInfos Screenshots können danach mit dem Teststack entstehen statt mit
einer eigenen Live-Instanz.
