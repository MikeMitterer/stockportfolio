# T-93 · Unraid-Template vor dem Image-Push prüfen

**Warum dieses Ticket:** `make push` kann ein neues Docker-Image veröffentlichen,
obwohl die zugehörige Unraid-Vorlage nur lokal geändert wurde. Nutzer laden
weiterhin die ältere XML von GitHub. Vor der Veröffentlichung soll ein
gemeinsames ProjectTools-Skript den tatsächlich auf GitHub verfügbaren Stand
der passenden Vorlage prüfen und bei einer Abweichung abbrechen.

**Beispiel:** `templates/stockportfolio.xml` enthält lokal einen neuen Hinweis
zu „Public origin“, `origin/master` im Templates-Repo noch nicht. Die Prüfung
für StockPortfolio endet mit Fehler, bevor ein Image gepusht wird. Nach dem
Template-Push besteht sie. Für StockInfo wählt eine andere Einstellung
`templates/stockinfo.xml`; der Prüfcode bleibt derselbe.

**Stand:** Mike hat T-93 am 2026-10-03 für `30-doing/` beauftragt. Ticket und
Prüfumfang sind erfasst; Skript, Einstellungen und Push-Anbindung sind noch
nicht umgesetzt. Nach T-92 steht der Root wieder auf `master`; STATUS ist
`idle`. Der zuständige Coder aktiviert T-93 mit eigenem Branch und
eindeutiger Zuordnung im STATUS, bevor die Umsetzung beginnt.

Für Mike steht derzeit keine weitere Entscheidung an. „bush“ in der Anfrage
wird als vorhandenes Makefile-Target `push` verstanden.

## Umsetzung und technische Nachweise

| Repo | Time-box | Scope | GH-Issue |
|---|---|---|---|
| cross: ProjectTools, StockPortfolio, später StockInfo | mittel | Bash-Prüfung, Einstellungen, Push-Aufruf | — |

**Gemeinsames Skript:** In ProjectTools entsteht ein Bash-Skript unter
`src/bash/`, das aus dem Verbraucher-Root läuft. Es folgt dessen
Konvention für eine projektspezifische `.unraid-template-check.conf.sh` und
einen `--config`-Override. Einstellungen benennen die lokale Arbeitskopie
des zentralen Templates-Repos, den relativen XML-Pfad sowie Remote und
Branch. StockPortfolio und StockInfo erhalten je eigene Einstellungen;
der Skriptcode enthält keine Fallunterscheidung nach App-Namen und keinen
fest eingebauten Pfad zu Mikes Rechner.

**Prüfentscheidung:** Das Skript holt den aktuellen Remote-Stand von GitHub.
Es vergleicht die Bytes der lokalen XML mit der Datei auf dem gewählten
Remote-Branch. Nur Gleichheit nach erfolgreichem Abruf ergibt Exit 0. Ein
uncommitteter oder noch nicht gepushter Unterschied, eine lokal veraltete
Vorlage, fehlende Einstellungen und ein fehlgeschlagener Remote-Abruf ergeben
Exit ungleich 0 mit einer konkreten Meldung. Änderungen an anderen Dateien
im Templates-Repo sollen die passende, gleiche XML nicht blockieren. Der
Check veröffentlicht selbst nichts und verändert keine Git-Arbeitskopie
außer dem üblichen Remote-Tracking-Stand durch `git fetch`.

**Push-Anbindung (offen):** Das gemeinsame Skript soll später im
veröffentlichenden Pfad vor `make push` beziehungsweise vor den ersten
Docker-Tag-, Registry- oder README-Schritt von `docker/build.sh --push`
laufen. Ein bloßer Makefile-Hook wäre über den direkten Skriptaufruf
umgehbar. Diese Anbindung ist Teil des Ticketabschlusses, aber noch kein
erledigter Schritt. Die bereits geltende Template-Prüfung **nach** dem
Image-Push bleibt bestehen: Erst dann lässt sich das veröffentlichte Image
gegen die Vorlage prüfen.

StockInfo hat ein eigenes Repository und Board. Änderungen an dessen
Einstellungen oder Push-Pfad werden dort nach eigener Aktivierung, Regeln
und Commit-Historie durchgeführt. ProjectTools erhält einen eigenen Commit;
die Repositories werden nicht in einem Commit vermischt.

### Verify

Legende: ✅ live bestätigt · ⚠️ mit Einschränkung · ◑ teilweise ·
➖ noch ohne Ausführung.

| # | Lauf | Handgriff | Erwarteter Nachweis | woher | AI |
|---|:--:|---|---|---|:--:|
| 1 | Unit/CLI | <a id="pruefpunkt-1"></a>Skript mit StockPortfolio- und StockInfo-Einstellungen aufrufen | Beide wählen die richtige XML; gleiche lokale und veröffentlichte Bytes ergeben Exit 0 | Mike | ➖ |
| 2 | Fehlerfälle | <a id="pruefpunkt-2"></a>Lokale XML ändern, nur lokal committen, Remote-Datei ändern, Abruf scheitern lassen | Jeder Fall endet vor einem Push mit Exit ungleich 0 und unterscheidbarer Meldung; irrelevante andere Dateien blockieren nicht | Mike | ➖ |
| 3 | Gegenprobe | <a id="pruefpunkt-3"></a>Je Fehlerbedingung einen absichtlich falschen Stand testen | Die Prüfung wird rot; nach Wiederherstellung der richtigen Fassung grün | Board-Workflow | ➖ |
| 4 | Integration | <a id="pruefpunkt-4"></a>`make push` und direkten `docker/build.sh --push` mit Docker-Fakes prüfen | Bei Template-Abweichung kein Tag, Registry-Push oder README-Publish; bei Gleichheit bisheriger Push-Ablauf | Mike | ➖ |
| 5 | Pflicht | <a id="pruefpunkt-5"></a>Bash-Syntax, ShellCheck, Projekt-Tests, beide READMEs und Unraid-Anleitung prüfen | Je Repo dokumentierter Exit-Code und Doku-Abgleich; keine echte Veröffentlichung für Tests | Projektregeln | ➖ |

### Akzeptanzkriterien

- [ ] Ein ProjectTools-Bash-Skript prüft beide Apps über ihre Einstellungen,
      ohne App-Namen oder absolute Rechnerpfade im Skript zu verdrahten.
- [ ] Die Prüfung entscheidet anhand des frisch abgerufenen GitHub-Stands
      der jeweils passenden XML und scheitert geschlossen bei Abrufproblemen.
- [ ] Beide veröffentlichenden Aufrufwege sperren vor dem Image-Push, wenn
      die lokale Vorlage nicht auf GitHub liegt.
- [ ] Fehlerfälle sind absichtlich rot gelaufen; gültige Fälle und bestehende
      Push-Prüfungen bleiben grün.
- [ ] Der Abgleich nach dem Image-Push und die Anleitungen bleiben inhaltlich
      stimmig. Tatsächlich gepushte Stände werden erst dann als solche gemeldet.

### Side-Effects

Der Vorabcheck benötigt GitHub-Zugriff und aktualisiert Remote-Tracking-Daten
des Templates-Repos. Ohne Verbindung ist ein Image-Push gesperrt. Ein lokaler
Commit allein genügt nicht als Veröffentlichungsnachweis.

**Doku-Abgleich:** Bei Umsetzung `README.md`, `docker/README.md` und
`unraid/README.md` dieses Projekts gemeinsam prüfen; außerdem die Anleitungen
von ProjectTools und, bei dessen Anbindung, StockInfo. Dieses Ticket ändert
noch kein Produktverhalten und keine Bedienanleitung. Board-Konventionen
bleiben unverändert; im Skill `task-verification-workflow` ist dafür derzeit
keine Übernahme nötig.

## Review-Verlauf (neueste Runde zuerst)

Noch keine Implementierungsübergabe.
