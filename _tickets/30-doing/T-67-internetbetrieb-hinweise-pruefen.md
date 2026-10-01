# T-67 · Hinweise zum Internetbetrieb unabhängig prüfen

Die neuen Warnungen für StockPortfolio liegen als Dokumentations-Commits vor,
wurden aber noch nicht unabhängig geprüft. Vor einer Übernahme oder
Veröffentlichung soll der zugeordnete Verifier prüfen, ob die Hinweise zur
Anmeldung, zum direkten Browserzugriff auf StockInfo und zur Proxy-Konfiguration
fachlich stimmen und in allen Auslieferungstexten übereinstimmen.

**Beispiel:** Ein Unraid-Nutzer sieht Port 8088 und möchte ihn am Router
freigeben. Anleitung und Vorlage sollen ihn davor warnen und zugleich
erklären, dass StockPortfolios Login die separat erreichbare StockInfo-API
nicht schützt.

**Stand:** Mike hat am 2026-10-01 den Reviewauftrag erneut priorisiert und
dieses Ticket nach `30-doing/` beordert. Der Dokumentations-Commit `18c3776`
und der zentrale Template-Commit `ca7ae2d` sind lokal vorbereitet; eine
unabhängige Review-Übergabe oder Freigabe hat noch nicht stattgefunden.
T-66 bleibt bis zu seiner Reviewrückgabe das aktive Ticket in STATUS. Der Coder
muss danach den T-67-Textstand auf die aktuelle Source-Basis bringen und mit
den endgültigen Commit-IDs übergeben. T-67 ist in Doing, aber noch nicht als
geprüfte Fassung ausgewiesen.

Für Mike steht jetzt kein Handgriff an. Nach der technischen Prüfung bleiben
Abschluss und Veröffentlichung getrennte Entscheidungen; Docker Hub und das
Unraid-Listing zeigen die neue Fassung derzeit nicht.

## Prüfgegenstand

| Repo | Time-box | Scope | GH-Issue |
|---|---|---|---|
| StockPortfolio | 0,5–1 h | `README.md`, `docker/README.md`, `unraid/README.md`; Commit `18c3776e6a03380e5d07fb61493e6b85ca80b2c3` gegen `e1be8daacd25220336792609bd73ddc5edc32fa3` | — |
| Unraid-Templates | 0,5 h | ausschließlich `templates/stockportfolio.xml` aus Commit `ca7ae2d7b15331bf84a0fa344f436c37e3863e9c` gegen `c828e24671a81fd53824f67e3fea21b4e35b280b` | — |

Beide Commits liegen auf dem jeweiligen Branch `docs/internet-zugriff-hinweis`.
Lokale Arbeitskopien: `/private/tmp/stockportfolio-internet-hinweis` und
`/private/tmp/unraid-internet-hinweis`. Das Gegenstück für StockInfo wird im
dortigen T-84 mit dessen Rollen geprüft. Der gemeinsame Template-Commit wird
pro Ticket nur für die eigene XML-Datei bewertet.
Eine Freigabe des gesamten Template-Commits braucht auch das StockInfo-
Prüfergebnis aus T-84.

Vor einer formellen Übergabe stellt der zuständige Coder `claude-coder` die
Dokumentationsfassung auf dem dann aktuellen StockPortfolio-Stand bereit und
schreibt die OUTBOX mit den endgültigen Commit-IDs. Der unabhängige Review
gehört `codex-verifier`. Der bisherige Branch baut auf T-61 auf; er ist nicht
automatisch mit dem laufenden T-66-Stand abgeglichen. Keine Reviewphase allein
aus diesen vorbereiteten Commits ableiten.

### Verify

Legende: ➖ unabhängige Prüfung steht aus. Die Autorprüfung ist unten genannt
und ersetzt kein Verifier-Urteil.

| # | Handgriff | Erwarteter Nachweis | AI |
|---|---|---|:--:|
| 1 | StockPortfolio-Diff gegen den aktuellen Login-, Cookie-, Origin- und StockInfo-Zugriffsweg lesen | Keine falsche Sicherheitszusage; direkte Portfreigabe und separater Schutz der API sind zutreffend beschrieben | ➖ |
| 2 | `README.md`, `docker/README.md` und `unraid/README.md` inhaltlich abgleichen | Gleiche Grenze für Internetzugriff; HTTPS-Proxy-Einstellungen und Browserzugriff widersprechen sich nicht | ➖ |
| 3 | `templates/stockportfolio.xml` gegen die Anleitungen und Containerkonfiguration prüfen | Englischer Hinweis steht sichtbar in Overview, Description und Portfeld; keine andere Template-Funktion geändert | ➖ |
| 4 | Docker-Hub-Vorschau und XML erneut am endgültigen Prüfstand erzeugen | Vorschau unter 25.000 UTF-8-Bytes, Links korrekt; XML gültig | ➖ |
| 5 | Git-Fassung und Veröffentlichungsstand trennen | Review benennt geprüfte Commit-IDs und hält fest, dass kein Merge, Push oder Hub-/Unraid-Update belegt ist | ➖ |

**Autorbelege vom 2026-10-01:** `git diff --check` ohne Befund;
`xmllint --noout` für beide Templates erfolgreich. Die Docker-Hub-Vorschau
von StockPortfolio wurde erzeugt und hatte 10.239 UTF-8-Bytes. Das sind
Vorprüfungen, keine unabhängige Freigabe.

### Akzeptanzkriterien

- [ ] `codex-verifier` prüft die eindeutig benannte Endfassung unabhängig und hält Befunde oder Freigabe im Ticket fest.
- [ ] Der Doku-Abgleich umfasst beide READMEs, die Unraid-Anleitung und den StockPortfolio-Teil der zentralen Vorlage.
- [ ] Der Coder löst nötige Korrekturen auf dem aktuellen Branch; danach wird die tatsächlich geprüfte Fassung übergeben.
- [ ] Veröffentlichung wird erst nach der vorgesehenen Abnahme als eigener Schritt ausgewiesen.

### Side-Effects

Nur Dokumentation und Template-Beschreibung. Die aktive T-66-Umsetzung, der
StockInfo-Dienst und die Containerkonfiguration bleiben außerhalb dieses
Reviewauftrags. Kein Produktcode wird durch das Ticket geändert.

### Auflösung

Offen. Das Ticket liegt auf Mikes Anweisung in Doing; die formelle
Coder-Übergabe auf dem aktuellen Stand und das unabhängige Prüfurteil fehlen.
