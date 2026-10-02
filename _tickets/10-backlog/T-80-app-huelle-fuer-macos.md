# T-80 · App-Hülle für macOS

**Warum dieses Ticket:** StockPortfolio läuft auf dem Mac bisher über
`make dev` oder als Docker-Container und wird im Browser geöffnet. Gewünscht
ist eine normale Mac-App mit eigenem Fenster und Dock-Symbol, die ihre
Konto-API selbst startet und StockInfo als Kursdienst nutzt.

**Beispiel:** Ein Doppelklick auf „StockPortfolio“ öffnet ein Fenster mit dem
Depot. Läuft StockInfo nicht, zeigt die App „StockInfo läuft nicht – starten?“
statt leerer Kurse. Beim Schließen beendet sie ihre eigene Konto-API;
StockInfo läuft weiter.

**Stand:** Idee und Technikwahl, noch nicht eingeplant. Angelegt am
2026-10-02 auf Mikes Auftrag („Die Idee wären schlussendlich 2 Apps.
StockInfo in der Menüzeile und StockPortfolio mit App-Hülle“). Setzt
StockInfo T-96 (Menüzeilen-App) voraus oder zumindest dessen Prototyp.

Für Mike steht kein Handgriff an.

## Umsetzung und technische Nachweise

| Repo | Time-box | Scope | GH-Issue |
|---|---|---|---|
| StockPortfolio | Prototyp 1–2 Tage | neue Mac-Hülle; Frontend und Konto-API fachlich unverändert | — |

### Kontext / Ziel

**Technik: Deno Desktop** (`deno desktop`, ab Deno 2.9, aktuelle LTS-Linie),
dieselbe Wahl wie in StockInfo T-96, damit beide Hüllen gleich gebaut sind.

- Fenster mit dem gebauten Vue-Frontend; Dock-Symbol bleibt sichtbar.
- Die Konto-API (Hono, TypeScript) läuft als Kindprozess. Zu prüfen: Ob Deno
  sie direkt ausführen kann (Hono unterstützt Deno), statt Node mitzuliefern.
- Beim Start Health-Check gegen die konfigurierte StockInfo-Adresse
  (`/health`, `/ready`). Läuft StockInfo nicht, Hinweis mit Startknopf
  (`open -a StockInfo`).
- Daten unter `~/Library/Application Support/StockPortfolio/`, getrennt von
  StockInfo. Pfade je System über eine Funktion; Windows und Linux sind für
  später mitgedacht.

**Gemeinsamer Code mit T-96** (Kindprozess starten und überwachen, Port
prüfen, Logs, sauber beenden): zuerst in StockInfo T-96 bauen und hier erst
übernehmen, wenn es sich bewährt hat. Keine gemeinsame Bibliothek auf
Vorrat.

### Windows später (Ausblick, nicht Teil dieses Tickets)

`deno desktop` baut auch für Windows; ein normales Fenster funktioniert
dort ebenso, `Deno.dock` steuert die Taskleiste. StockPortfolio selbst ist
TypeScript: Läuft die Hono-Konto-API direkt unter Deno, braucht Windows
keine weitere Laufzeit. Sonst ist das vorhandene Docker-Image die
Alternative.

Die eigentliche Windows-Hürde liegt bei StockInfo (Python). Dessen Abwägung
steht in StockInfo T-96, Abschnitt „Windows später“: bevorzugt ein
App-Ordner mit `uv`, Docker als Alternative, PyInstaller verworfen. Für
StockPortfolio zählt nur, dass der Health-Check gegen die konfigurierte
StockInfo-Adresse unabhängig davon funktioniert, wie StockInfo gestartet
wurde. Datenort unter Windows: `%LOCALAPPDATA%\StockPortfolio\`.

### Offene Fragen vor der Aktivierung

- Ports im App-Betrieb (bisher Vite 5175, Konto-API 8080 im Entwicklerbetrieb).
- Anmeldung und Setup-Code: Wie der einmalige Setup-Code im App-Betrieb
  angezeigt wird.
- Signatur und Notarisierung für eine weitergegebene `.app`.

### Akzeptanzkriterien

- [ ] Die App öffnet ein Fenster mit StockPortfolio und startet die eigene
      Konto-API.
- [ ] Läuft StockInfo nicht, erscheint ein verständlicher Hinweis mit Start.
- [ ] Schließen beendet nur die eigenen Prozesse; StockInfo läuft weiter.
- [ ] Arbeitsdaten aus `.local-data` werden nicht verwendet.
- [ ] `README.md` und `docker/README.md` sind abgeglichen: Die Mac-App ist
      ein weiterer Betriebsweg.
- [ ] Die Browserprüfung folgt `AGENTS.md`, Abschnitt „Browserprüfung“.

### Side-Effects

Neuer Betriebsweg mit eigenem Datenort. Docker und Unraid bleiben unverändert.
