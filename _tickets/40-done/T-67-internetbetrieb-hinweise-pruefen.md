# T-67 · Hinweise zum Internetbetrieb unabhängig prüfen

**Abgeschlossen am 2026-10-01** durch Mike: „T-70 passt und ist erledigt - so wie alle anderen Tickets in doing auch.“ Offener Rest: Der gemeinsame Template-Commit `ca7ae2d` im Unraid-Templates-Repository ist nicht integriert; er wartet auf das StockInfo-Prüfurteil aus T-84. Docker Hub und Unraid-Listing zeigen die neuen Hinweise erst nach einer eigenen Veröffentlichung. Die folgenden Abschnitte beschreiben den Stand vor dem Abschluss.

Die neuen Warnungen für StockPortfolio liegen als Dokumentations-Commits vor.
Der unabhängige Review von Runde 1 steht unten. Vor einer Übernahme oder
Veröffentlichung war zu prüfen, ob die Hinweise zur
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

Die menschliche Abnahme steht aus. Abschluss und Veröffentlichung bleiben
getrennte Entscheidungen; eine Veröffentlichung der neuen Fassung ist in
diesem Ticket nicht belegt.

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

Die Dokumentationsfassung wurde auf dem mit T-66 integrierten `master`
erstellt und mit `50a6924` übergeben; die OUTBOX nennt auch den unveränderten
Template-Commit `ca7ae2d`. Der unabhängige Review gehört `codex-verifier`.
Der frühere T-61-basierte Branch ist nur noch Vorgeschichte.

### Verify

Legende: ➖ unabhängige Prüfung steht aus. Die Autorprüfung ist unten genannt
und ersetzt kein Verifier-Urteil.

| # | Handgriff | Erwarteter Nachweis | AI |
|---|---|---|:--:|
| 1 | StockPortfolio-Diff gegen den aktuellen Login-, Cookie-, Origin- und StockInfo-Zugriffsweg lesen | Keine falsche Sicherheitszusage; direkte Portfreigabe und separater Schutz der API sind zutreffend beschrieben | ✅ |
| 2 | `README.md`, `docker/README.md` und `unraid/README.md` inhaltlich abgleichen | Gleiche Grenze für Internetzugriff; HTTPS-Proxy-Einstellungen und Browserzugriff widersprechen sich nicht | ✅ |
| 3 | `templates/stockportfolio.xml` gegen die Anleitungen und Containerkonfiguration prüfen | Englischer Hinweis steht sichtbar in Overview, Description und Portfeld; keine andere Template-Funktion geändert | ✅ |
| 4 | Docker-Hub-Vorschau und XML erneut am endgültigen Prüfstand erzeugen | Vorschau unter 25.000 UTF-8-Bytes, Links korrekt; XML gültig | ✅ |
| 5 | Git-Fassung und Veröffentlichungsstand trennen | Review benennt geprüfte Commit-IDs und hält fest, dass kein Merge, Push oder Hub-/Unraid-Update belegt ist | ✅ |

**Vorbereitungsbelege vor der aktuellen Übergabe:** `git diff --check` ohne Befund;
`xmllint --noout` für beide Templates erfolgreich. Die Docker-Hub-Vorschau
von StockPortfolio wurde erzeugt und hatte 10.239 UTF-8-Bytes. Das sind
Vorprüfungen, keine unabhängige Freigabe.

### Akzeptanzkriterien

- [x] `codex-verifier` prüft die eindeutig benannte Endfassung unabhängig und hält Befunde oder Freigabe im Ticket fest.
- [x] Der Doku-Abgleich umfasst beide READMEs, die Unraid-Anleitung und den StockPortfolio-Teil der zentralen Vorlage.
- [x] Die tatsächlich geprüfte Fassung ist auf dem aktuellen Branch übergeben; keine Korrektur erforderlich.
- [ ] Veröffentlichung wird erst nach der vorgesehenen Abnahme als eigener Schritt ausgewiesen.

### Side-Effects

Nur Dokumentation und Template-Beschreibung. Der freigegebene T-66-Stand, der
StockInfo-Dienst und die Containerkonfiguration bleiben außerhalb dieses
Reviewauftrags. Kein Produktcode wird durch das Ticket geändert.

### Auflösung

Technisch freigegeben in Runde 1 für den StockPortfolio-Commit und den
StockPortfolio-Teil des Template-Commits. Das Ticket bleibt in Doing;
Mikes Abnahme und Veröffentlichung stehen aus. Der StockInfo-Teil des
Template-Commits gehört zu dessen eigenem Review.

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

## Unabhängige Prüfung · Runde 1 · `codex-verifier` · 2026-10-01

**Prüffassungen:** StockPortfolio `50a6924fb13e36a6a9b8467c880ac14f84413608`
gegen `fd0b22a1419b220a94ad0106612f7fc3503e5a9e`; Unraid-Templates
`ca7ae2d7b15331bf84a0fa344f436c37e3863e9c` gegen
`c828e24671a81fd53824f67e3fea21b4e35b280b`, ausschließlich
`templates/stockportfolio.xml`. **Urteil: technisch `approved` für genau
diese Teile.** Keine menschliche Abnahme, keine Freigabe des
`templates/stockinfo.xml` aus demselben Template-Commit.

**Inhaltliche Gegenprobe:** `frontend/src/api/client.ts` ruft StockInfo per
Browser-`fetch` unter der konfigurierten API-Adresse auf. Anmeldung und
Sitzung liegen dagegen in `api/src/routers/api.ts`; dessen Origin-Prüfung
verwendet `STOCKPORTFOLIO_PUBLIC_ORIGIN`, das Cookie-Flag
`STOCKPORTFOLIO_SECURE_COOKIES`. Die Texte sagen deshalb zutreffend, dass
das StockPortfolio-Login StockInfo nicht schützt. Die Anweisungen zu einer
browsererreichbaren HTTPS-API, passendem CORS-Origin, exaktem öffentlichen
Origin und sicheren Cookies stimmen mit diesen Pfaden überein. Das
ungeschützte Veröffentlichen von `-p 8080:8080` ist durch den Hinweis
oberhalb des Beispiels und die spätere Erklärung eingeordnet. Laut
[Docker-Dokumentation](https://docs.docker.com/get-started/docker-concepts/running-containers/publishing-ports/)
bindet ein veröffentlichter Port standardmäßig an alle Host-Schnittstellen.
[MDN zu CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS)
und [Mixed Content](https://developer.mozilla.org/en-US/docs/Web/Security/Defenses/Mixed_content)
bestätigen die Browsergrenzen. Das ist ein Quellen- und Dokumentationsreview,
kein Test einer öffentlich betriebenen Instanz.

**Doku-Abgleich:** `README.md` (Docker-Abschnitt), `docker/README.md`
(Kopfhinweis, Portbindung, API-Adresse, Proxy und SSE) und
`unraid/README.md` (Installation und Konfiguration) geben dieselbe
Zugriffsgrenze wieder. Der StockPortfolio-Teil der Vorlage nennt sie in
`Overview`, `Description` und am `WebUI Port`. Der Diff dieser XML-Datei
ändert nur diese drei Beschreibungsstellen. Die ältere Aussage zu nginx und
SSE bleibt bestehen; der Server sendet `X-Accel-Buffering: no`, das nginx
laut [Proxy-Dokumentation](https://nginx.org/en/docs/http/ngx_http_proxy_module.html)
standardmäßig berücksichtigt. `docs/` braucht für diese Portwarnung keinen
Nachtrag. Für den StockInfo-Teil der Vorlage ist T-84 zuständig.

**Eigene Prüfungen:** `git diff --check` für beide geprüften Diffs ohne
Befund; `xmllint --noout` auf `ca7ae2d:templates/stockportfolio.xml`
erfolgreich. Die Docker-Hub-Vorschau wurde mit dem Projektwerkzeug und
`--ref master` neu erzeugt: 11.112 UTF-8-Bytes, unter 25.000; der
GitHub-Link und das Bild zeigen auf die vorgesehenen Projektpfade. Nur
Dokumentation und XML wurden geändert; ein Produkt-Testlauf war für diese
Fassung nicht nötig. Im lokalen Git liegt `50a6924` weder auf
StockPortfolio-`master` noch `ca7ae2d` auf Templates-`master`;
`origin/master` beider Repositories enthält die Änderungen ebenfalls nicht.
Ein Docker-Hub- oder Unraid-Push wurde nicht ausgeführt oder als Erfolg
übernommen. Lessons: SP-R-02/AL-R-01 (Prüftiefe und Veröffentlichungsgrenze),
SP-CX-02 (aktuelle Boardaussagen nachgezogen).

## Abschluss · 2026-10-01

Mike: „T-70 passt und ist erledigt - so wie alle anderen Tickets in doing auch.“
Integration: Abschluss nach `master` gemergt und zu `origin` gepusht.
Offener Rest: Der gemeinsame Template-Commit `ca7ae2d` im Unraid-Templates-Repository ist nicht integriert; er wartet auf das StockInfo-Prüfurteil aus T-84. Docker Hub und Unraid-Listing zeigen die neuen Hinweise erst nach einer eigenen Veröffentlichung.
