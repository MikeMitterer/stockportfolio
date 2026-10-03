# T-84 · Demo-Detailwerte überstehen einen Kursabruf

**Warum dieses Ticket:** Im Teststack mit `--demo-details` leert ein Klick auf
„Aktualisieren“ alle Demo-Detailwerte. Für Screenshots und Sichtprüfungen,
den Zweck des Demomodus aus T-78, ist der Stack danach nicht mehr brauchbar.

**Beispiel:** Bei der Prüfung von T-83 am 2026-10-03 zeigte EUNL.DE nach
„Aktualisieren“ TER, Fondsvolumen, Anbieter und „Thesaurierend“ als „—“ und
eine Volatilität von 0,03 % statt 13,5 %. `GET /instruments` lieferte für
EUNL.DE danach nur noch `volatility: 0.03` und leere justETF-Felder.

**Stand:** Angelegt am 2026-10-03 von `claude-coder` als Befund aus T-83.
Noch nicht eingeplant; die Grenze steht in README und AGENTS.md
(Abschnitt Teststack). Für Mike ist aktuell kein Handgriff nötig.

## Ursache

- Der echte Kursabruf (`/refresh`) läuft im Testserver über StockInfos
  `QuoteService` mit `EmptyEtfEnricher`. Die ETF-Quelle liefert also keine
  Detailwerte; StockInfo ersetzt die vorbelegten justETF-Werte.
- StockInfo berechnet die Volatilität danach aus der Tagesreihe neu
  (`quote_cache._save_fresh_with_volatility`). Die künstliche Reihe des
  Testservers fällt linear um 0,1 % pro Tag und ergibt rund 0,03 %.

## Mögliche Wege (Entscheidung offen)

1. **Testquelle liefert Demowerte:** eine Demo-ETF-Quelle statt
   `EmptyEtfEnricher` und eine Tagesreihe, deren Volatilität dem Demowert
   entspricht. Greift tiefer in StockInfos Innenleben; siehe StockInfo T-99.
2. **Auf StockInfo T-99 warten:** Ein offizieller Testmodus mit Testdaten
   aus einer Datei löst das mit.
3. **Grenze dokumentiert lassen:** Neustart des Stacks stellt die Werte
   wieder her (heutiger Stand).

### Akzeptanzkriterien

- [ ] Nach „Aktualisieren“ zeigt der Demomodus dieselben Detailwerte wie
      vorher, oder die Entscheidung für Weg 3 ist im Ticket festgehalten.
