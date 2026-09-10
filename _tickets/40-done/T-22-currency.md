# T-22 · Fremdwährung — und alle Meldungen als Toast

| Repo | Status | Time-box | Scope | GH-Issue |
|---|---|---|---|---|
| root | done | ~2 h | Richtigkeit der Zahlen | — |

**Löst:** Die App summierte Marktwerte, ohne die Währung zu prüfen. Ein
USD-Papier im Depot machte jede Summe und damit jeden Prozentsatz still
falsch.

---

## Die Entscheidung: warnen statt rechnen

Zwei Wege wären möglich gewesen. Umrechnen bräuchte Devisenkurse — mit Quelle,
Zeitstempel und Alter, sonst verzerrt ein stiller alter Kurs jede Kennzahl,
ohne dass es jemand sieht. Die hat StockInfo heute nicht.

Also: Die App rechnet in genau einer Währung und sagt es, wenn etwas nicht
hineinpasst. Fremd notierte Positionen bleiben sichtbar, zählen aber in keine
Summe. Das ist keine Notlösung — für ein Werkzeug, in dem man bewusst
EUR-notierte Papiere kauft, ist es die ehrlichere Antwort als eine Zahl, die
niemand nachrechnen kann.

Was dafür an StockInfo ginge, steht in
[`docs/stockinfo-currency-request.md`](../../docs/stockinfo-currency-request.md).

## Sichtbar ausschließen, nicht verschwinden lassen

Ein unsichtbarer Ausschluss ist schlimmer als eine falsche Summe: Man kann ihn
nicht einmal suchen. Deshalb:

- Die Zeile bleibt, mit rotem Währungskürzel neben dem Symbol.
- Ihr Marktwert steht in **ihrer** Währung — „31.410 €" für einen USD-Betrag
  wäre schlicht falsch. Dafür gibt es `money(value, currency)`.
- Status heißt „fremde Währung", nicht „zählt nicht mit" wie bei einer
  abgeschalteten Position. `excludedReason` trennt beides: abgeschaltet ist
  eine Entscheidung des Nutzers, fremde Währung ein Zustand, den er so nicht
  gewollt hat.
- Der Kopf nennt sie namentlich, samt Währung.

Ausdrücklich **nicht** behauptet wird etwas über Währungs*risiko*. Ein
EUR-notierter MSCI World steckt zu zwei Dritteln in US-Dollar — eine ganz
andere Frage.

## Meldungen einheitlich als Toast

Die verbliebenen Kästen im Seitenfluss (fehlende Kurse, Ziele über 100 %,
Ladefehler der Assets, Ergebnis einer Sicherung) sind jetzt Toasts wie im
Rebalancing. Ein Kasten über einer Tabelle schiebt sie beim Erscheinen nach
unten — genau dann, wenn man liest.

**Zwei Ausnahmen, bewusst:** Im „Position hinzufügen"-Dialog bleiben die
Hinweise stehen, wo sie stehen. „Alle freigegebenen Papiere sind bereits im
Depot" ist keine Meldung, sondern ein Leerzustand; und eine Warnung zum Feld,
in das man gerade tippt, gehört neben das Feld, nicht in die Fensterecke.

`useAppNotification` nimmt dabei die Verdrahtung ab — API und Zähler aus den
Einstellungen. Ohne das stünde in jeder Ansicht dasselbe, und eine davon wäre
irgendwann anders.

## DRY: Singular und Plural

An zehn Stellen stand `count === 1 ? 'Position' : 'Positionen'`. Jetzt gibt es
`counted(3, 'Position')` → „3 Positionen" und `pluralize` für Sätze, in denen
die Zahl woanders steht.

## Verify

Legende: ✅ live bestätigt.

| # | Where | Look for | AI | Human |
|---|---|---|:--:|---|
| 1 | Kurs auf USD manipuliert | Zeile bleibt, rotes „USD" neben dem Symbol | ✅ | |
| 2 | Marktwert der Zeile | „31.410 $", nicht „31.410 €" | ✅ | |
| 3 | Kurs der Zeile | „628 $" | ✅ | |
| 4 | Status | „fremde Währung" statt „zählt nicht mit" | ✅ | |
| 5 | Gesamtwert | Von 160.000 € auf 128.000 € gefallen — Position ist draußen | ✅ | |
| 6 | Anteile | Auf den verbleibenden Bestand neu gerechnet | ✅ | |
| 7 | Toast | Nennt Symbol und Währung, mit Zähler | ✅ | |
| 8 | Warnungen-Kennzahl | Zählt fehlende Kurse und Fremdwährungen zusammen | ✅ | |
| 9 | Investitionsreserve | Enthält keine fremd notierte Liquidität (Unit-Test) | ✅ | |
| 10 | Unbekannter Währungscode | Zahl plus Kürzel statt Ausnahme (Unit-Test) | ✅ | |
| 11 | Seitenfluss | Keine Meldung schiebt mehr eine Tabelle nach unten | ✅ | |

## Offen

- **Basiswährung** ist fest EUR. Sie umzustellen ist eine Stunde Arbeit, bringt
  aber nichts, solange StockInfo Kurse auf Xetra/EUR auflöst: Ein Kanadier
  bekäme CAD-Beschriftungen auf EUR-Kursen, und das ist schlechter als der
  heutige Zustand, in dem wenigstens beides zusammenpasst.
- **Umrechnung** gemischter Depots — nur mit Devisenkursen aus StockInfo,
  samt Alter in der Statuszeile.
