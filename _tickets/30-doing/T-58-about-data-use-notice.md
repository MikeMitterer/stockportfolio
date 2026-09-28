# T-58 · Datenhinweis in StockPortfolio erreichbar machen

StockPortfolio zeigt Bestandswerte, berechnete Anteile und Kauf- oder
Verkaufsvorschläge. Die Oberfläche erklärt an keinem gut auffindbaren Ort,
welche Daten diesen Anzeigen zugrunde liegen und weshalb Nutzer wichtige
Zahlen vor einer Entscheidung prüfen sollten.

**Stand:** Die Oberfläche ist im Ticket-Worktree umgesetzt und vom Coder
geprüft; Claudes unabhängiges Review steht aus. Das gemeinsame
Ziel und die StockInfo-Seite stehen in
[StockInfo T-80](https://github.com/MikeMitterer/stockinfo/blob/master/_tickets/30-doing/T-80-about-data-use-notice.md).
StockPortfolios Statuszeile verlinkt bereits `legal.html` mit Lizenz und
Quellcode. Dieser Zugang bleibt erhalten.

**Nächster Schritt:** Codex übergibt die Fassung an Claude. Die rechtliche
Prüfung des endgültigen Texts
bleibt Mikes persönliche Wiedervorlage.

## Umfang und Prüfpunkte

Der Hinweis nennt externe Kursdaten aus StockInfo, eigene Bestands- und
Zielwerte, Berechnungen und die angezeigten Handelsvorschläge. Er erklärt
mögliche Verzögerungen, Fehler und Datenlücken. Er behauptet keinen pauschalen
Haftungsausschluss und widerspricht nicht der Verbraucherklärung in
`LICENSING.md`.

Der Reiter heißt in beiden Sprachen „About“. Der Statuszeilenlink steht direkt
nach „powered by MangoLila“, nutzt dieselbe Schrift und führt zum Reiter.
Unter Dashboard- und Rebalancing-Tabelle steht in kleiner Schrift, dass
berechnete Kauf- und Verkaufswerte Orientierungshilfen und keine Empfehlung
zum Handeln sind.

Deutsch führt zum deutschen EUPL-Text, Englisch zum englischen. Beide Links
nutzen die bereits mit der App ausgelieferten Dateien. Der bisherige
Statuszeilenlink zu `legal.html` und zum Quellarchiv bleibt nutzbar.
Ein zusätzlicher Link führt zu MangoLilas Hinweis für Finanzinhalte auf
Website und in Publikationen. Dieser Text nennt die App nicht und ersetzt
weder ihre Lizenz noch die Verbraucherklärung.

| # | Prüfung | Erwartetes Ergebnis | AI |
|---|---|---|:--:|
| 1 | Statuszeilenlink in DE und EN öffnen | Der About-Reiter erscheint in der gewählten Sprache und lässt sich direkt neu laden | ➖ |
| 2 | Lizenzlinks im About-Reiter öffnen | DE öffnet `LICENSE.de.txt`, EN `LICENSE.txt`; Verbraucherklärung erreichbar | ➖ |
| 3 | Bisherigen Lizenz-/Quellcode-Link öffnen | `legal.html` und Quellarchiv bleiben erreichbar | ➖ |
| 4 | Text mit Dashboard und Rebalancing vergleichen | Daten- und Berechnungsgrenzen sowie Vorschläge sind zutreffend beschrieben | ➖ |
| 5 | Sprache, schmale Ansicht und Tastatur prüfen | Link und Reiter bleiben beschriftet und bedienbar | ➖ |
| 6 | Root-, Docker- und Unraid-Anleitungen abgleichen | Der neue Zugang ist beschrieben, bestehende Lizenzangaben stimmen überein | ➖ |

Die Tabelle hält die ursprünglichen Prüffälle fest. Die Umsetzung ändert
keine API, Persistenz oder Lizenztexte; die Coder-Nachweise stehen darunter.

## Coder-Prüfung · 2026-09-28

- Gezielt: `tests/components/aboutNotice.spec.ts` (3/3) bestanden.
  `make lint`, `make typecheck` und Production-Build bestanden. Der Build
  enthält `LICENSE.txt`, `LICENSE.de.txt`, `LICENSING.md`, `legal.html`
  und das Quellarchiv.
- Browser mit `scripts/stockinfo-test-server.py` und temporärer Datenbank:
  `Settings → About` direkt geladen; Statuslink steht nach MangoLila und vor
  GitHub, berechnete Schrift beider Links identisch (11 px). Der Hinweis steht
  nach der Dashboard-Tabelle und nach der Rebalancing-Tabelle (12 px).
  Der Link bleibt in schmaler Ansicht fokussierbar.
  MangoLilas separate Finanzinhalte-Seite antwortet mit HTTP 200.
- `make test` mit synthetischer `VITE_STOCKINFO_API_URL`: 797/798 bestanden.
  Ein unabhängiger, bereits vorhandener macOS-Bash-3.2-Fehler im GHCR-Fall
  von `tests/dockerBuild.spec.ts` (`${GITHUB_OWNER,,}`: `bad substitution`)
  bleibt. Ohne diese Datei: 779/779 bestanden.
- **Doku-Abgleich:** `README.md`, `docker/README.md`, `unraid/README.md`
  beschreiben About, die Tabellenhinweise und die Lizenzlinks konsistent.
  Die Docker-Hub-Vorschau besteht die Größen- und Linkprüfung.
  `AGENTS.md` dokumentiert Start und Stop des Testservers.
