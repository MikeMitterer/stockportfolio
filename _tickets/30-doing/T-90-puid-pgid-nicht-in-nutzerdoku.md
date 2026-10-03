# T-90 · PUID/PGID nicht in nutzersichtbarer Doku

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

- [ ] Keine Erwähnung von PUID/PGID in `README.md`, `docker/README.md`,
      `unraid/README.md`, App-Texten und der Vorlage; belegt per Inventar.
- [ ] Die Anleitungen beschreiben `/data` weiter verständlich: Rechte werden
      beim Start vorbereitet, die App läuft ohne Root.
- [ ] `README.md` und `docker/README.md` sagen dasselbe; Docker-Hub-Vorschau
      unter 25.000 Byte.
- [ ] `make test`, Lint und Typecheck grün (keine Codeänderung erwartet).

### Side-Effects

Reine Doku. Kein Push, kein Docker-Hub- oder Unraid-Update ohne eigenen
Auftrag.
