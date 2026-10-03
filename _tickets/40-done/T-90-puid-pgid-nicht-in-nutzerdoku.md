# T-90 · PUID/PGID nicht in nutzersichtbarer Doku

**Abgeschlossen am 2026-10-03** (Mike: „T-90 ist erledigt“). Technisch freigegeben in Runde 1 (`601bc58`), nach `master` gemergt (`cce832d`) und zu `origin` gepusht.

**Warum dieses Ticket:** Das Image läuft ohne Zutun als 99:100 (Unraids
`nobody:users`). Die Unraid-Vorlage führt PUID/PGID seit Templates `1272822`
nicht mehr, StockInfo bewirbt sie seit `846868a` nicht mehr. Die
StockPortfolio-Anleitungen nennen sie aber weiter, die Unraid-Anleitung sogar
als Vorlagenfeld, das es nicht gibt.

**Beispiel:** `unraid/README.md` › Configuration listet „PUID / PGID — Change
only if your appdata belongs to another user“. In der Vorlage
`stockportfolio.xml` gibt es dieses Feld nicht; der Nutzer sucht es vergeblich.

**Stand:** Angelegt am 2026-10-03 aus der Prüfung des Templates-Repos
(Befund 2). Mike: „PUID/PGDI brauchen und sollen in den Dokus nicht erwähnt
werden“, präzisiert: „In Dokus die der User sehen könnte - intern natürlich
schon“; Vorschlag „eigenes Ticket direkt nach T-88“ mit „Dein Vorschlag ist
OK“ bestätigt. Direkt nach T-88 aktiviert.

## Umfang

1. PUID/PGID aus den nutzersichtbaren Dateien entfernen: `README.md` (auf
   GitHub öffentlich, auch Entwicklerabschnitte), `docker/README.md`
   (Docker Hub) und `unraid/README.md`. Die Aussage zu `/data` bleibt, ohne
   Variablennamen: Der Container übernimmt `/data` beim Start und läuft dann
   ohne Root.
2. Inventar über alle nutzersichtbaren Dateien (READMEs, `docs/` außer
   datierten Entwürfen, App-Texte unter `frontend/src/i18n/`, Vorlage) nach
   `PUID`, `PGID`, `99:100` und `nobody:users`.
3. Intern bleibt erlaubt: `AGENTS.md`, `_tickets/`, Code-Kommentare, Tests,
   Skripte wie `docker/smoke-test.sh`.
4. Kein Verhaltensänderung am Image: Die Variablen funktionieren weiter.

### Akzeptanzkriterien

- [x] Keine Erwähnung von PUID/PGID in `README.md`, `docker/README.md`,
      `unraid/README.md`, App-Texten und der Vorlage; belegt per Inventar.
- [x] Die Anleitungen beschreiben `/data` weiter verständlich: Rechte werden
      beim Start vorbereitet, die App läuft ohne Root.
- [x] `README.md` und `docker/README.md` sagen dasselbe; Docker-Hub-Vorschau
      unter 25.000 Byte.
- [x] `make test`, Lint und Typecheck grün (keine Codeänderung erwartet).

### Side-Effects

Reine Doku. Kein Push, kein Docker-Hub- oder Unraid-Update ohne eigenen
Auftrag.

## Review-Verlauf (neueste Runde zuerst)

### Technische Prüfung Runde 1 · codex-verifier · 2026-10-03

**Prüffassung:** `601bc58` auf `t-90-puid-pgid-nicht-in-nutzerdoku`.
Rollen, Owner, Branch und Paketversion
`df699dd1d7583c59030030ad44e3ab896d4660be8d84575662e652f754624da1`
abgeglichen. **Urteil: `approved`.** Die technische Freigabe ist keine
menschliche Abnahme. Kein Produktcode durch den Verifier geändert.

**Inhalt:** `README.md`, `docker/README.md`, `unraid/README.md`, `docs/`,
`frontend/src/i18n/` und die Unraid-Vorlage auf PUID, PGID, 99:100 und
`nobody:users` inventarisiert. Die beiden Variablennamen sind in diesen
nutzersichtbaren Quellen nicht mehr vorhanden; die verbleibenden drei
Fundstellen nennen nur den Standardbenutzer und die Standard-IDs. Die
Vorlage enthält kein entsprechendes Feld. Projekt- und Docker-README
haben denselben Absatz zu `/data`; die Unraid-Anleitung stimmt inhaltlich
damit überein. `docker/entrypoint.sh` bestätigt Vorbereitung von `/data`,
Wechsel auf den Standardbenutzer und den gesonderten `--user`-Weg.

**Unabhängige Belege:** `make test` Exit 0 (Frontend 84 Dateien/868 Tests,
API 6/28); Lint und Typecheck für Frontend und API je Exit 0. Die echte
Docker-Hub-Vorschau wurde erzeugt, umfasst 13.541 UTF-8-Bytes und enthält
keine PUID/PGID-Nennung. Die Änderung `62be315` betrifft nur die drei
Anleitungen. Der Doku-Abgleich ist damit vollständig; App-Texte, Vorlage
und datierte Entwürfe brauchen keine Änderung. Der Skill
`task-verification-workflow` braucht keine Übernahme, weil keine
Board-Konvention geändert wurde.

**Lessons-Einordnung:** Kein neues Fehlermuster. Die alte Vorlagenfeld-Aussage
und die zugehörigen Hinweise wurden mit einem Inventar entfernt; keine
weitere Lesson nötig.

### Übergabe Runde 1 · claude-coder · 2026-10-03

Branch `t-90-puid-pgid-nicht-in-nutzerdoku` von `master` (`57c89fc`, mit
T-88), Dokustand im Commit vor dieser Übergabe.

**Inventar** (`git grep -i -E "puid|pgid|99:100|nobody:users"` über
`README.md`, `docker/README.md`, `unraid/`, `docs/` ohne datierte Entwürfe,
`frontend/src/i18n/`; dazu `grep` über die Vorlage `stockportfolio.xml`):
vorher sechs Fundstellen mit PUID/PGID, in Vorlage und App-Texten keine.

| Datei | Vorher | Nachher |
|---|---|---|
| `README.md` | Container-Absatz „gives the directory to `PUID`/`PGID` (default 99:100 …)“ | „gives the directory to Unraid's `nobody:users` (99:100) and then starts the app as that user“ |
| `README.md` | Smoketest „`PUID`/`PGID` values“ | „the user switch at start“ |
| `docker/README.md` | gleicher Container-Absatz | wortgleich zu `README.md` (per `diff` geprüft) |
| `docker/README.md` | Configuration-Zeile `PUID` / `PGID` | entfernt |
| `unraid/README.md` | Feldzeile „PUID / PGID … Change only if …“ (Feld fehlt in der Vorlage) | entfernt |
| `unraid/README.md` | „prepares `/data` for `PUID`/`PGID` (default 99:100)“ | „prepares `/data` for `nobody:users` (99:100)“ |

Nachher: kein Treffer für `puid|pgid` in den nutzersichtbaren Dateien (Exit 1
von `git grep`). `99:100`/`nobody:users` bleiben als Tatsache, welcher
Benutzer läuft; sie bewerben keine Einstellung. Intern unverändert:
`AGENTS.md`, Tickets, `docker/smoke-test.sh`, `docker/entrypoint.sh`.

**Belege:** Docker-Hub-Vorschau 13.541 Byte, ohne PUID/PGID. `make test`
(Frontend 84/868, API 6/28), Lint und Typecheck `frontend`/`api` Exit 0,
`git diff --check` sauber. Kein Produktcode geändert.

**Doku-Abgleich:** `README.md` und `docker/README.md` sagen dasselbe
(identischer Absatz). `unraid/README.md` passt jetzt zur Vorlage, die das
Feld nicht führt. Vorlage, `docs/` und App-Texte: keine Fundstelle, keine
Änderung. Skill `task-verification-workflow`: keine Board-Konvention
geändert.
