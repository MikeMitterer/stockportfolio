# T-77 · Zugriffsweg für StockInfo mit StockInfo T-87 abgleichen

**Warum dieses Ticket:** Unsere Anleitungen sagen, StockInfo müsse für den
Zugriff von außen eigens geschützt werden, nennen aber keinen Weg, der mit
StockPortfolio funktioniert. StockInfos Anleitungen empfehlen dafür unter
anderem einen Reverse Proxy mit Login. Der sperrt StockPortfolio aus, weil der
Browser StockInfo direkt und ohne Zugangsdaten aufruft. StockInfo klärt das in
[StockInfo T-87](/Volumes/DevLocal/DevWeb/Production/StockInfo/_tickets/10-backlog/T-87-login-proxy-sperrt-stockportfolio-aus.md).
Danach sollen unsere Texte dieselbe, geprüfte Aussage treffen.

**Beispiel:** Ein Unraid-Nutzer liest in unserer Vorlage „Protect StockInfo
separately and verify that browser API requests work through your access
path“. Er setzt StockInfo hinter einen Login-Proxy und sieht in StockPortfolio
eine leere Kurstabelle. Nach diesem Ticket nennen unsere Texte den Weg, der
tatsächlich funktioniert, oder benennen die Grenze klar.

**Stand:** StockInfo hat T-87 am 2026-10-01 abgeschlossen: StockInfo nicht
ins Internet, nur im Heimnetz, von außen per VPN (WireGuard oder Tailscale);
kein Reverse Proxy mehr als Zugriffsweg. Claude hat unsere vier Stellen
daran angeglichen und Runde 1 an `codex-verifier` übergeben.

Für Mike steht aktuell kein Handgriff an. Abschluss und Veröffentlichung
folgen nach der technischen Prüfung.

T-87 verlangt keine Codeänderung in StockPortfolio: Im Heimnetz und per VPN
erreicht der Browser StockInfo ohne Anmeldung davor.

## Umsetzung und technische Nachweise

| Repo | Time-box | Scope | GH-Issue |
|---|---|---|---|
| root | 0,5–1 h | `README.md`, `docker/README.md`, `unraid/README.md` | — |
| Unraid-Templates | 0,5 h | `templates/stockportfolio.xml` (`Overview`, `Description`, Portfeld) | — |

Betroffene Stellen beim Anlegen (Stand `master`, Templates-Branch
`docs/internet-zugriff-hinweis`):

| Datei | Abschnitt | Heutige Aussage |
|---|---|---|
| `README.md` | Docker, Absatz vor „Run it“ | „external access through an HTTPS reverse proxy needs … separate protection for StockInfo“ |
| `docker/README.md` | Einleitung („Network access“) und Quick start | Port nicht freigeben; Login schützt StockInfo nicht |
| `unraid/README.md` | Installing through Unraid Apps | „Protect StockInfo separately: the browser connects to its API directly“ |
| `templates/stockportfolio.xml` | `Overview` (Security), `Description` | „Protect StockInfo separately and verify that browser API requests work through your access path“ |

Inventar vor der Umsetzung: `git ls-files` über alle Markdown-, HTML- und
XML-Dateien außerhalb von `_tickets/`, `CHANGELOG.md` und
`docs/superpowers/` nach „reverse proxy“, „internet“, „VPN“ und „protect
StockInfo“ durchsucht, dazu `frontend/src` und `api/src`. Zusätzlich zu den
vier Stellen oben trafen nur zu: `README.md` Docker, Absatz „The web
interface has a login …“, und `docker/README.md` Absatz „An HTTPS web
address …“ mit „Protect StockInfo …“. Die übrigen Treffer betreffen den
SSE-Puffer hinter einem Proxy und `STOCKPORTFOLIO_PUBLIC_ORIGIN`; sie bleiben
richtig und unverändert. Im App-Code gibt es keine solchen Texte.

**Umsetzung (Claude, 2026-10-01):**

- Kernaussage überall gleich und wie bei StockInfo: StockPortfolio und
  StockInfo nicht ins Internet, nur im Heimnetz, von außen per VPN (etwa
  WireGuard oder Tailscale).
- Der Reverse Proxy erscheint nur noch als HTTPS-Weg **im Heimnetz**,
  zusammen mit `STOCKPORTFOLIO_PUBLIC_ORIGIN` und Secure Cookies.
- „Protect StockInfo separately and verify …“ entfällt überall.
- Der Hinweis, dass StockPortfolios Login StockInfo nicht schützt, bleibt.

| Repo | Commit | Dateien |
|---|---|---|
| StockPortfolio | Übergabecommit in STATUS (`handoff_commit`), Branch `t-77-stockinfo-zugriffsweg` | `README.md`, `docker/README.md`, `unraid/README.md`, dieses Ticket |
| Unraid-Templates | `b250a2c` auf `t-77-stockportfolio-zugriffsweg`, Basis lokales `master` `25d395c` (enthält T-84/T-87, nicht gepusht) | `templates/stockportfolio.xml` |

### Verify

Legende: ✅ live bestätigt · ⚠️ bestätigt mit Einschränkung (Fußnote) ·
◑ teilweise (Fußnote) · ➖ keine Live-Verifikation (nur Unit/Review).

| # | Lauf | Handgriff | Nachweis | woher | AI |
|---|:--:|---|---|---|:--:|
| 1 | — | <a id="pruefpunkt-1"></a>Ergebnis von StockInfo T-87 lesen | Empfohlener Zugriffsweg und seine Grenzen sind bekannt | T-87 | ✅¹ |
| 2 | — | <a id="pruefpunkt-2"></a>Die Stellen aus dem Inventar anpassen | Sie sagen dasselbe wie StockInfos Anleitungen und Vorlage | AGENTS.md, Doku-Abgleich | ✅² |
| 3 | — | <a id="pruefpunkt-3"></a>Den beschriebenen Weg mit StockPortfolio prüfen | Kurse laden über den beschriebenen Weg | Ticketziel | ➖³ |
| 4 | — | <a id="pruefpunkt-4"></a>`xmllint --noout` auf die Vorlage, Docker-Hub-Vorschau erzeugen | XML gültig; Vorschau unter 25.000 UTF-8-Bytes | AGENTS.md | ✅⁴ |
| 5 | — | <a id="pruefpunkt-5"></a>Pflichtläufe vor Übergabe | `make test`, Lint und Typecheck beider Pakete grün | AGENTS.md | ✅⁵ |

¹ StockInfo `_tickets/40-done/T-87-…md`, Merge `e04a116`; Wortlaut aus
StockInfo `docker/README.md` und Templates `25d395c:templates/stockinfo.xml`.
² Siehe Umsetzung oben; `git diff --check` ohne Befund in beiden Repos.
³ Bewusst kein Live-Lauf: Die Änderung ist reiner Text. Heimnetz und VPN
ändern am Browserzugriff auf StockInfo nichts gegenüber dem bisherigen
LAN-Betrieb; ein VPN-Aufbau war nicht Teil des Auftrags.
⁴ `xmllint --noout templates/stockportfolio.xml` auf `b250a2c` ok.
`dockerhub-readme.sh --preview --ref master`: 12.141 UTF-8-Bytes.
⁵ `make test`: Frontend 82 Dateien/852 Tests, API 5 Dateien/20 Tests grün;
`npm --prefix frontend run lint`, `npm --prefix api run lint`,
`npm --prefix frontend run typecheck`, `npm --prefix api run typecheck`
ohne Befund.

### Akzeptanzkriterien

- [ ] Unsere Texte empfehlen keinen Zugriffsweg, der StockPortfolio ausschließt.
- [ ] `README.md`, `docker/README.md`, `unraid/README.md` und
      `templates/stockportfolio.xml` stimmen untereinander und mit StockInfos
      Ergebnis aus T-87 überein.
- [ ] Der Doku-Abgleich nennt alle betroffenen Dateien und Abschnitte.

### Side-Effects

Nur Dokumentation und Vorlagentext. Die Vorlage liegt im eigenen
Templates-Repository; deren Veröffentlichung ist ein eigener Schritt.
Der Templates-Branch baut auf dem lokalen, noch nicht gepushten
Templates-`master` mit T-84/T-87 auf; er wird erst danach integriert.

**Doku-Abgleich:** `README.md` (Docker: Einleitung und Absatz zum Login),
`docker/README.md` (Network access, Absatz „An HTTPS web address …“),
`unraid/README.md` (Installing through Unraid Apps) und
`templates/stockportfolio.xml` (Overview, Description, WebUI Port)
angepasst; beide READMEs sagen dasselbe. Unverändert und weiter richtig:
SSE-Hinweise hinter einem Proxy, Tabellen zu Public origin und Secure
cookies. `docs/` enthält keine betroffene Aussage. Die zentrale
Unraid-Vorlage ist die Templates-Datei; eine zweite Kopie gibt es nicht.
