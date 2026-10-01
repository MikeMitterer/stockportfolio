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

**Stand:** Mike hat am 2026-10-01 T-67 als nächstes Ticket freigegeben
(„OK T-67“). Die Dokumentationsfassung liegt als `50a6924` auf dem aktuellen
Stand (`master` mit T-66) und ist an `codex-verifier` übergeben. Der zentrale
Template-Commit `ca7ae2d` ist unverändert.

Für Mike steht jetzt kein Handgriff an. Nach der technischen Prüfung bleiben
Abschluss und Veröffentlichung getrennte Entscheidungen; Docker Hub und das
Unraid-Listing zeigen die neue Fassung derzeit nicht.

## Prüfgegenstand

| Repo | Time-box | Scope | GH-Issue |
|---|---|---|---|
| StockPortfolio | 0,5–1 h | `README.md`, `docker/README.md`, `unraid/README.md`; Commit `50a6924fb13e36a6a9b8467c880ac14f84413608` gegen `fd0b22a1419b220a94ad0106612f7fc3503e5a9e` | — |
| Unraid-Templates | 0,5 h | ausschließlich `templates/stockportfolio.xml` aus Commit `ca7ae2d7b15331bf84a0fa344f436c37e3863e9c` gegen `c828e24671a81fd53824f67e3fea21b4e35b280b` | — |

Die StockPortfolio-Fassung liegt auf `t-67-internetbetrieb-hinweise-pruefen`
im Projekt-Root; der frühere Branch `docs/internet-zugriff-hinweis` (`18c3776`)
ist überholt. Der Template-Commit liegt auf `docs/internet-zugriff-hinweis`
im Templates-Repository. Die Unraid-Fassung liegt weiter in
`/private/tmp/unraid-internet-hinweis` (Templates-Repository, gemeinsam mit
StockInfo T-84; nicht von dieser Regel erfasst). Das Gegenstück für StockInfo wird im
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

## Coder-Übergabe · Runde 1 · claude-coder · 2026-10-01

**Prüfstand:** StockPortfolio `50a6924fb13e36a6a9b8467c880ac14f84413608` gegen `fd0b22a1419b220a94ad0106612f7fc3503e5a9e`
(`master` mit gemergtem T-66), Branch `t-67-internetbetrieb-hinweise-pruefen`.
Templates `ca7ae2d` gegen `c828e24`, nur `templates/stockportfolio.xml`.

**Übertrag:** `18c3776` per Cherry-Pick übernommen. Einziger Konflikt im
Projekt-README, Abschnitt Docker: Der neue Login-Satz („does not protect
StockInfo“, beide Dienste schützen) ersetzt den alten; der SSE-Absatz zu
`/api/data/events` aus T-62 bleibt unverändert dahinter. `docker/README.md`
und `unraid/README.md` ließen sich ohne Konflikt übernehmen; ihre
SSE-Abschnitte stehen unberührt weiter unten. Der Template-Commit braucht
keinen Übertrag, weil `c828e24` weiterhin die Spitze von
`t-60-stockportfolio-template` ist.

**Belege:** `git diff --check fd0b22a` ohne Befund; `xmllint --noout` für
`ca7ae2d:templates/stockportfolio.xml` erfolgreich; Docker-Hub-Vorschau
(`--ref master`) 11.112 UTF-8-Bytes, unter 25.000. Reine Dokumentation, kein
Produktcode, deshalb kein `make test`/Lint/Typecheck-Lauf.

**Doku-Abgleich:** `README.md` (Docker-Abschnitt), `docker/README.md`
(Kopfhinweis, Portbindung, Browserzugriff) und `unraid/README.md`
(Installation) nennen dieselbe Grenze: Port nicht direkt freigeben, VPN oder
vertrauenswürdiges Netz, beim HTTPS-Proxy genaue Origin und sichere Cookies,
StockInfo eigens schützen. Die Unraid-Vorlage sagt dasselbe in Overview,
Description und Portfeld. `docs/` nennt Reverse-Proxy-Einstellungen nur in der
Architektur-Spezifikation (Cookies, Origin), ohne Aussage zur Portfreigabe;
unverändert.

**Lessons:** CLAUDE-LESSONS gelesen; SP-CL-01 angewendet (Branch im Root).
Keine neue Lesson.
