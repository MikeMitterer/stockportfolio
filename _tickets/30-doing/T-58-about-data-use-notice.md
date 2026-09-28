# T-58 · Datenhinweis in StockPortfolio erreichbar machen

StockPortfolio zeigt Bestandswerte, berechnete Anteile und Kauf- oder
Verkaufsvorschläge. Die Oberfläche erklärt an keinem gut auffindbaren Ort,
welche Daten diesen Anzeigen zugrunde liegen und weshalb Nutzer wichtige
Zahlen vor einer Entscheidung prüfen sollten.

**Stand:** Für diesen Auftrag noch kein Produktcode geändert. Das gemeinsame
Ziel und die StockInfo-Seite stehen in
[StockInfo T-80](https://github.com/MikeMitterer/stockinfo/blob/master/_tickets/30-doing/T-80-about-data-use-notice.md).
StockPortfolios Statuszeile verlinkt bereits `legal.html` mit Lizenz und
Quellcode. Dieser Zugang bleibt erhalten.

**Nächster Schritt:** Codex ergänzt einen adressierbaren About-Reiter in den
Einstellungen und einen direkten Link aus der Statuszeile. Claude prüft die
fertige Fassung unabhängig. Die rechtliche Prüfung des endgültigen Texts
bleibt Mikes persönliche Wiedervorlage.

## Umfang und Prüfpunkte

Der Hinweis nennt externe Kursdaten aus StockInfo, eigene Bestands- und
Zielwerte, Berechnungen und die angezeigten Handelsvorschläge. Er erklärt
mögliche Verzögerungen, Fehler und Datenlücken. Er behauptet keinen pauschalen
Haftungsausschluss und widerspricht nicht der Verbraucherklärung in
`LICENSING.md`.

Deutsch führt zum deutschen EUPL-Text, Englisch zum englischen. Beide Links
nutzen die bereits mit der App ausgelieferten Dateien. Der bisherige
Statuszeilenlink zu `legal.html` und zum Quellarchiv bleibt nutzbar.

| # | Prüfung | Erwartetes Ergebnis | AI |
|---|---|---|:--:|
| 1 | Statuszeilenlink in DE und EN öffnen | Der About-Reiter erscheint in der gewählten Sprache und lässt sich direkt neu laden | ➖ |
| 2 | Lizenzlinks im About-Reiter öffnen | DE öffnet `LICENSE.de.txt`, EN `LICENSE.txt`; Verbraucherklärung erreichbar | ➖ |
| 3 | Bisherigen Lizenz-/Quellcode-Link öffnen | `legal.html` und Quellarchiv bleiben erreichbar | ➖ |
| 4 | Text mit Dashboard und Rebalancing vergleichen | Daten- und Berechnungsgrenzen sowie Vorschläge sind zutreffend beschrieben | ➖ |
| 5 | Sprache, schmale Ansicht und Tastatur prüfen | Link und Reiter bleiben beschriftet und bedienbar | ➖ |
| 6 | Root-, Docker- und Unraid-Anleitungen abgleichen | Der neue Zugang ist beschrieben, bestehende Lizenzangaben stimmen überein | ➖ |

`➖` bedeutet: noch nicht umgesetzt oder live geprüft. Die Umsetzung ändert
keine API, Persistenz oder Lizenztexte.
