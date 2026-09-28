# T-62 · Offene Browser über Depotänderungen benachrichtigen

Serverseitige Speicherung allein aktualisiert eine bereits geöffnete Seite
nicht. **StockPortfolio meldet Änderungen per SSE** an andere Browser
desselben Benutzers. Die Seite lädt die Daten danach per REST neu; SSE
transportiert keine Depotinhalte. StockInfo ist an diesem Weg nicht beteiligt.

**Beispiel:** Eine Person ändert eine Zielquote am Laptop. Das bereits
geöffnete Tablet erhält ein Ereignis, ruft den neuen Stand beim
StockPortfolio-Server ab und zeigt die Quote ohne manuelles Neuladen.

**Stand am 2026-09-28:** Es gibt noch keinen StockPortfolio-Datendienst.
T-60 liefert Konten und Server, T-61 die maßgeblichen REST-Daten und
Revisionen. Dieses Ticket folgt darauf; Produktcode ist noch nicht geändert.

**Für dich:** Jetzt ist kein Handgriff nötig. Die spätere Abnahme prüft zwei
gleichzeitig geöffnete Browser mit demselben Konto.

## Für dich

### Nach der technischen Übergabe

Der Coder stellt eine isolierte Testinstanz mit zwei Testkonten bereit und
dokumentiert ihre URL. Zwei Browser oder Browserprofile auf getrennten
Geräten können denselben Testbenutzer öffnen. Keine echten Depots verwenden.

| Frage | Prüfpunkt # | Handgriff | Dein Urteil | Human |
|---|---|---|---|---|
| A · Live-Abgleich | [1](#pruefpunkt-1) | Dasselbe Testdepot in zwei Browsern öffnen, in Browser A eine Zielquote ändern | Erscheint die Änderung in B ohne manuelles Neuladen? | |
| B · Trennung | [2](#pruefpunkt-2) | Browser C mit anderem Testkonto öffnen und in A eine weitere Änderung speichern | Bleibt C unverändert und ohne fremde Meldung? | |

## Umsetzung und technische Nachweise

| Repo | Umfang | GH-Issue |
|---|---|---|
| StockPortfolio | Benutzergebundene SSE-Ereignisse und REST-Nachladen im bestehenden Container | — |

### Schnitt und Abhängigkeiten

1. Browser speichern ausschließlich über die REST-API aus T-61. Erst nach
   erfolgreichem Datenbank-Commit sendet der StockPortfolio-Server ein
   Ereignis mit Ressourcentyp, Kennung und neuer Revision an Sitzungen
   **desselben Kontos**. Weder Positionen noch Passwort- oder Sitzungsdaten
   stehen im Ereignis.
2. Der Browser vergleicht die Revision und lädt nur betroffene Daten per
   REST neu. Ein Ereignis ist ein Hinweis, kein zweiter Speicherweg. Der
   schreibende Browser darf sein eigenes Ereignis ignorieren, wenn seine
   lokale Revision bereits aktuell ist.
3. Beim Öffnen, Wiederverbinden, Wiedererscheinen des Tabs und nach einer
   verpassten Verbindung wird der maßgebliche Stand über REST geprüft.
   Ausfall der SSE-Verbindung darf nicht dauerhaft unbemerkt zu einem
   veralteten Stand führen; der Zustand oder ein Ersatzabruf macht das klar.
4. Der Ereignisstrom prüft die Sitzung wie jede private API. Logout,
   Deaktivierung und abgelaufene Sitzung schließen den Strom. Ein Nutzer
   erhält keine Ereignisse oder Kennungen eines anderen Nutzers.
5. Gleichzeitige Bearbeitungen bleiben durch die T-61-Revisionen geschützt.
   Ein Ereignis hebt einen sichtbaren Konflikt nicht stillschweigend auf.
   Reverse-Proxy- und Containerbetrieb mit dauerhafter SSE-Verbindung
   werden dokumentiert und in der Testumgebung geprüft.

### Akzeptanzkriterien

- [ ] Zwei offene Browser desselben Kontos zeigen gespeicherte Änderungen
  ohne manuelles Neuladen; der eigentliche Datentransfer erfolgt per REST.
- [ ] Ereignisse werden nur nach erfolgreichem Commit und nur an denselben
  Benutzer gesendet; fremde Konten erhalten nichts.
- [ ] Nach Unterbrechung und Wiederverbindung wird der aktuelle Serverstand
  geladen, auch wenn ein Ereignis verloren ging.
- [ ] Logout oder Sitzungsablauf beendet den Zugriff auf Ereignisse und Daten.
- [ ] Ein veralteter Schreibstand wird weiterhin als Konflikt behandelt.

### Verify

Isolierter StockPortfolio-Server mit zwei Konten und drei Browserkontexten;
Netzunterbrechung im Browser simulieren. Kein echter StockInfo-Aufruf in
Tests. SSE- und REST-Antworten enthalten keine fremden Depotdaten.

Legende: ✅ live bestätigt · ⚠️ mit Einschränkung · ◑ teilweise ·
➖ noch kein Live-Nachweis. `AI` wird erst nach der Prüfung gesetzt.

| # | Handgriff | Nachweis | AI |
|---|---|---|:--:|
| 1 | <a id="pruefpunkt-1"></a>In Browser A schreiben, Browser B offen lassen | Ereignis nach Commit; B lädt gezielt per REST und zeigt den neuen Wert | ➖ |
| 2 | <a id="pruefpunkt-2"></a>Mit anderem Konto C mithören und A ändern | C bekommt weder Ereignis noch fremde Kennung oder Daten | ➖ |
| 3 | SSE trennen, währenddessen ändern, wieder verbinden | B lädt den neuesten Stand; verpasste Ereignisse gehen nicht als Zustand verloren | ➖ |
| 4 | Schreibkonflikt, Logout und Sitzungsablauf prüfen | Konflikt sichtbar; privater Stream endet oder weist Zugriff ab | ➖ |
| 5 | `make test`, `make lint`, `make typecheck`, Build, Browser- und Doku-Abgleich | Ergebnisse und mögliche Bestandsfehler sind konkret dokumentiert | ➖ |

### Doku-Abgleich

`README.md` (**Where the data lives**, **Docker**) und `docker/README.md`
(**Configuration**, **Data and backups**) gemeinsam auf den tatsächlichen
Live-Abgleich und seine Grenzen prüfen. `unraid/README.md` und die zentrale
Vorlage prüfen, falls der Stream Reverse-Proxy- oder Port-Anforderungen
ändert. Kein StockInfo-Dokument und keine StockInfo-API-Änderung. Keine
Board-/Lessons-Konventionsänderung; kein Nachtrag im zentralen Ticket-Skill.

### Side-Effects

Jeder offene Browser hält eine dauerhafte Verbindung zum StockPortfolio-Server.
Ein vorgeschalteter Proxy muss sie durchreichen; bei Verbindungsabbruch lädt
die App nach dem Wiederverbinden neu. Die SSE-Nachricht ersetzt weder
Versionsprüfung noch die Datenbank-Sicherung.

## Konzeptprüfung Runde 1

`claude`, 2026-09-28, an Handoff-Commit `6a33e6fb72a27cb46edcaa82361004b9b0854b9e`.
Teil derselben Kettenprüfung wie
[T-60](T-60-stockportfolio-server-und-benutzerkonten.md#konzeptprüfung-runde-1).
Kein Produktcode vorhanden, keine technische Freigabe.

**SSE-Zustellung:** Sauber auf „Hinweis, kein zweiter Speicherweg“ begrenzt —
das Ereignis enthält nur Ressourcentyp, Kennung und Revision, keinen
Positions-, Passwort- oder Sitzungsinhalt; der eigentliche Datentransfer
bleibt REST mit den T-61-Revisionen. Die Sitzungsprüfung wird von T-61
übernommen statt neu erfunden. Kein Befund.

**Wiederverbindung — offene Entscheidung:** Punkt 3 verlangt, dass ein
SSE-Ausfall nicht „dauerhaft unbemerkt zu einem veralteten Stand“ führt, und
verlässt sich dafür auf Öffnen/Wiederverbinden/Tab-Sichtbarkeit als Auslöser
für einen REST-Abgleich. Nicht benannt ist ein **Keep-Alive/Heartbeat** der
SSE-Verbindung selbst: Reverse-Proxies (z. B. nginx in Standardkonfiguration)
schließen idle gehaltene Verbindungen häufig nach kurzer Zeit, ohne dass
Browser oder App das sofort bemerken, solange der Tab nicht sichtbar
wechselt. Die Side-Effects benennen den Proxy als Betriebsvoraussetzung,
aber nicht diese konkrete Gefahr. Für die Spezifikation empfehlenswert:
periodische serverseitige Keep-Alive-Events oder eine vergleichbare
Absicherung, statt sich allein auf Sichtbarkeits-/Öffnen-Ereignisse zu
verlassen.

**Trennung/Datenschutz im Stream:** Ein Konto erhält nur eigene Ereignisse;
Logout, Deaktivierung und abgelaufene Sitzung beenden den Strom. Mit
Prüfpunkt B (Handgriff mit fremdem Konto C) menschlich testbar angelegt.
Kein Befund.

### Gesamturteil zur Kette T-60–T-62

Der Zuschnitt ist tragfähig, die Reihenfolge stimmt, StockInfo bleibt sauber
getrennt, und die sicherheitsrelevanten Kernentscheidungen (Sitzungen statt
Tokens, serverseitige Eigentümerprüfung, Revisionen/Konflikte,
ereignisarmer Datentransport über SSE) sind konzeptionell richtig gewählt.
Vor dem ersten Produktedit sollte die in T-60 angekündigte
Architektur-Spezifikation zusätzlich zu den dort bereits genannten Punkten
folgende offene Entscheidungen mitregeln: Login-Rate-Limit
([T-60](T-60-stockportfolio-server-und-benutzerkonten.md#konzeptprüfung-runde-1)),
Cookie-Flags/HTTP-Verhalten (T-60), Selbstdeaktivierung eines Admins (T-60),
Schutz gegen mehrfache Altbestandsübernahme
([T-61](T-61-benutzergebundene-depotdaten-per-rest.md#konzeptprüfung-runde-1)),
konkrete Reichweite der Cache-Bereinigung beim Logout/Kontowechsel (T-61) und
SSE-Keep-Alive gegen Proxy-Timeouts (oben). Keiner dieser Punkte stellt den
gewählten Ansatz infrage; alle sind vor der Umsetzung entscheidbar.

Dies ist eine konzeptionelle Einschätzung ohne Codeprüfung — kein bestandener
Produkttest, keine technische Umsetzungsfreigabe und kein menschlicher
Ticketabschluss. Rückgabe an den Coder über STATUS-INBOX.

### Observer · Lessons-Einordnung zur Konzeptprüfung

Die offenen Entscheidungen zu Anmeldung, Browserdaten, Altbestandsübernahme
und SSE sowie der fehlende menschliche Export-/Restore-Prüfpunkt in T-61 sind
konkrete Lücken dieser ersten Konzeptfassung. Es gibt dazu weder zwei
unabhängige belegte Fehlervorfälle noch eine falsche Behauptung über bereits
geprüftes Produktverhalten; sie bleiben deshalb Einzelfälle in den betroffenen
Tickets und erzeugen keine neue Lesson. Die vorhandene Gegenprobe
[SP-CX-02](../.agents/lessons/SP-CX-02-entscheidungen-in-allen-aktuellen-aussagen-nachziehen.md)
wurde im Review für die Übereinstimmung von Ticket und STATUS angewendet.
[SP-R-02](../.agents/lessons/SP-R-02-pruefaussagen-den-tatsaechlich-ausgefuehrten-schritten-zuordnen.md)
ist ebenfalls erfüllt: Claudes Urteil grenzt Konzept, Codeprüfung und
Produkttest ausdrücklich voneinander ab. Fassung der beiden Lessons: Stand
2026-09-28; kein Lessons-Nachtrag nötig.
