# T-38 · Basiswährung außer EUR — StockInfo liefert inzwischen Devisenkurse

StockPortfolio soll **Depots außerhalb des Euroraums richtig rechnen können**.
Heute ist Euro fest verdrahtet: Die App summiert Marktwerte und leitet daraus
Anteile, Bänder und Handelsvorschläge ab. Diese Summe stimmt nur, wenn alle
Beträge dieselbe Währung haben — 10.000 USD plus 10.000 EUR ergibt keine 20.000
von irgendetwas.

Fremd notierte Positionen bleiben deshalb seit [T-22](../40-done/T-22-currency.md)
sichtbar, zählen aber in keine Summe. Das war die ehrliche Antwort, solange der
Dienst nichts anderes anbot.

Beispiel: Ein Kanadier hält ein CAD-notiertes Papier an der TSX. Die App zeigt
es an und nimmt es aus jeder Summe — seine Prozentanteile beziehen sich damit
auf ein Depot, das kleiner ist als seines.

## Was sich geändert hat

**StockInfo hat den Devisenkurs gebaut.** `GET /fx?base=EUR&quote=USD` liefert
`rate`, `quote_time`, `fetched_at`, `cached`, `stale` und `source` — also die
Alterskennzeichnung, ohne die ein stiller alter Kurs jede Prozentzahl dieser App
verzerren würde. StockPortfolio ruft den Endpunkt bis heute nicht auf.

Die zweite Hälfte des Problems ist damit **nicht** gelöst: Welche Notierung
eines Papiers man bekommt, wählt man nicht pro Abfrage. StockInfo führt genau
ein aktives Listing je ISIN; Börse und Währung entscheiden sich bei der Aufnahme
über `POST /instruments/intake` mit `check_exchange` und `confirmed_listing`.
Einen `?currency=`- oder `?exchange=`-Parameter am Quote-Endpunkt gibt es nicht.

Daraus folgt die Reihenfolge: **Gemischte Depots umrechnen ist ab sofort
machbar.** Eine frei wählbare Basiswährung trägt dagegen nur so weit, wie die
aufgenommenen Listings tatsächlich in der gewünschten Währung notieren.

## Für dich

Zu entscheiden ist der Zuschnitt, bevor jemand baut. Kein manueller Test nötig,
solange der Umfang offen ist.

| Frage | Deine Entscheidung |
|---|---|
| A · Reicht das Umrechnen gemischter Depots bei fester Basis EUR, oder soll die Basiswährung in den Einstellungen wählbar werden? | |
| B · Wie soll ein veralteter Devisenkurs (`stale: true`) wirken — Summe mit sichtbarer Warnung, oder Position wie heute ausschließen? | |
| C · Groß genug zum Aufteilen? Naheliegender Schnitt: (1) `/fx` anbinden und umrechnen, (2) Basiswährung konfigurierbar machen. | |

## Umsetzung und technische Nachweise

Status: offen, nicht zur Umsetzung eingeplant. Repo: StockPortfolio, betroffene
Fremdschnittstelle: StockInfo. Zeitbudget noch nicht geschätzt.

**Hängt an [T-35](T-35-stockinfo-generation-und-waehrung.md).** Solange eine
fehlende Kurswährung als EUR geraten wird, kann keine Umrechnung stimmen; T-35
entfernt diesen Ersatzwert.

### Vorliegende Befunde

- `GET /fx` ist im StockInfo-Vertrag beschrieben (`contract/core-contract.json`,
  Abschnitte `endpoints.fx` und `core.fx`) und in `app/routers/fx.py`
  implementiert; Query-Parameter `base` und `quote`. Gegen eine laufende Instanz
  wurde das hier nicht geprüft.
- In `src/` gibt es keinen Aufruf von `/fx`. Der API-Client kennt den Endpunkt
  nicht.
- Die Ausgabe ist bereits währungsfähig: `money(value, currency)` in
  `src/domain/formatters.ts` formatiert jeden ISO-Code. Fest auf Euro steht der
  Rest der Rechnung, nicht die Anzeige.
- Die frühere Anfrage `docs/stockinfo-currency-request.md` (Stand 2026-08-11,
  angelegt mit Commit `84cc208`) ist überholt und wurde entfernt: Ihre Stufe 2
  ist gebaut, Stufe 1 anders gelöst, Stufe 3 blieb bewusst weg. Nachlesbar in
  der Git-Historie.

### Verify

Legende: ✅ live bestätigt · ⚠️ mit Einschränkung · ◑ teilweise · ➖ keine Live-Verifikation.

| # | Handgriff | Nachweis | AI |
|---|---|---|---|
| 1 | `/fx` gegen eine laufende StockInfo-Instanz aufrufen | Antwort enthält `rate`, `quote_time`, `stale` und `source` | ➖ |
| 2 | Unbekannte Zielwährung anfragen | klarer Fehlerstatus statt stiller Ersatzwährung | ➖ |
| 3 | Position in Fremdwährung im Depot | Marktwert zählt umgerechnet in die Summe; der Kurs bleibt in seiner Originalwährung sichtbar | ➖ |
| 4 | Devisenkurs mit `stale: true` | Auswirkung gemäß Entscheidung B, im UI erkennbar | ➖ |

Durchgehend ➖: Es gibt noch keine Umsetzung und keinen Auftrag dazu.

```bash
curl -s "http://localhost:8000/fx?base=EUR&quote=USD"                                    # #1 Erfolgsfall
curl -s -o /dev/null -w "%{http_code}\n" "http://localhost:8000/fx?base=EUR&quote=ZZZ"   # #2 unbekannte Währung
```
