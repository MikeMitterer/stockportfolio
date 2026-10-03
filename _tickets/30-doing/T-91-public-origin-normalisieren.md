# T-91 · Public Origin normalisieren und prüfen

**Warum dieses Ticket:** Die Konto-API vergleicht den `Origin`-Header des
Browsers zeichengenau mit `STOCKPORTFOLIO_PUBLIC_ORIGIN`. Ein Schrägstrich am
Ende genügte, damit schon die Einrichtung des Admin-Kontos scheiterte. Der
Nutzer sah nur „Die Browseradresse stimmt nicht mit der Serverkonfiguration
überein.“, ohne Hinweis auf die Ursache.

**Beispiel:** Unraid-Vorlage, Feld „Public origin“ =
`https://portfolio.example.com/`. Der Browser sendet
`Origin: https://portfolio.example.com`, die API antwortet 403
`invalid_origin`. Danach wird der Wert auf `https://portfolio.example.com`
zurückgeführt, und die Einrichtung läuft durch. Ein Wert mit Pfad
(`…/app`) beendet den Start mit einer klaren Meldung im Container-Log.

**Stand:** Umgesetzt und an `codex-verifier` übergeben (Runde 1).

Kein menschlicher Schritt bis zur technischen Freigabe. Danach: Abnahme durch
Mike, am besten auf Unraid mit dem bisherigen Wert samt Schrägstrich.

**Herkunft:** Mike, 2026-10-03, nach Unraid-Einrichtung: „STOCKPORTFOLIO_PUBLIC_ORIGIN
hatte einen Schrägstrich am Ende - das muss unbeding abgefangen werden“.
Direkt als aktiver Auftrag angelegt.

## Umsetzung und technische Nachweise

| Repo | Time-box | Scope | GH-Issue |
|---|---|---|---|
| cross: StockPortfolio `api/`, Doku; Templates (Vorlage) | klein | API-Start, Doku, Unraid-Vorlage | — |

**Umsetzung:**

- `api/src/publicOrigin.ts` — `normalizePublicOrigin()`: leer → nicht
  gesetzt; sonst über `new URL()` auf `url.origin` zurückgeführt (Schrägstrich
  am Ende entfällt, Schema und Host klein, Standardport entfällt). Abgelehnt
  mit Meldung: keine URL, Schema außer http/https, Zugangsdaten, Pfad, Query,
  Fragment (auch leeres `?`/`#`).
- `api/src/index.ts` — prüft den Wert vor dem Öffnen der Datenbank. Bei
  Fehler nur die Meldung auf stderr, Exit-Code 1, kein Setup-Code und keine
  SQLite-Datei. Bei gültigem Wert loggt der Start `Public origin: <wert>`.
- Die Origin-Prüfung in `api/src/routers/api.ts` bleibt unverändert.

### Verify

Legende: ✅ live bestätigt · ➖ nur Unit/Review.

| # | Lauf | Handgriff | Nachweis | woher | AI |
|---|:--:|---|---|---|:--:|
| 1 | Unit | <a id="pruefpunkt-1"></a>`api/tests/public-origin.spec.ts` | 13 Tests grün: leer, Schrägstrich, Groß-/Kleinschreibung, Standardport, neun Ablehnungsfälle mit Meldung, Setup mit `…/`-Konfiguration → 201 | Mike | ➖ |
| 2 | Unit rot | <a id="pruefpunkt-2"></a>`return url.origin` testweise durch `return trimmed` ersetzt | 3 Tests rot (Schrägstrich, Normalisierung, Setup), Exit 1; danach zurückgesetzt, 41/41 grün | Pflicht Gegenprobe | ➖ |
| 3 | lokal | <a id="pruefpunkt-3"></a>`node dist/index.js` mit `…/app` | Ausgabe `STOCKPORTFOLIO_PUBLIC_ORIGIN "https://portfolio.example.com/app" is invalid: must not contain a path. …`, `exit=1`, Datenordner leer | Mike | ✅ |
| 4 | lokal | <a id="pruefpunkt-4"></a>`node dist/index.js` mit `http://127.0.0.1:18391/` | Log `Public origin: http://127.0.0.1:18391`; `POST /api/setup` mit fremdem Origin 403, mit passendem Origin 401 `invalid_credentials` (Origin-Prüfung bestanden) | Mike | ✅ |
| 5 | Pflicht | <a id="pruefpunkt-5"></a>`make test`, Lint, Typecheck | `make test` Exit 0 (Frontend 84/868, API 7/41); Lint und Typecheck für Frontend und API je Exit 0; `git diff --check` sauber | AGENTS.md | ➖ |
| 6 | Doku | <a id="pruefpunkt-6"></a>Docker-Hub-Vorschau | `dockerhub-readme.sh --preview --ref master` Exit 0, 13.939 Byte (< 25.000) | AGENTS.md | ➖ |

Docker-Image und Unraid-Instanz sind nicht geprüft; das Verhalten liegt
ausschließlich in `node dist/index.js`, das der Container unverändert startet.

### Akzeptanzkriterien

- [x] Ein Schrägstrich am Ende von `STOCKPORTFOLIO_PUBLIC_ORIGIN` führt nicht
      mehr zu `invalid_origin`.
- [x] Werte, die sich nicht auf einen Origin zurückführen lassen, beenden den
      Start mit verständlicher Meldung, bevor ein Setup-Code entsteht.
- [x] `README.md`, `docker/README.md`, `unraid/README.md` und die
      Unraid-Vorlage beschreiben das Format übereinstimmend.
- [x] Pflichtprüfungen grün.

### Side-Effects

Ein bisher hingenommener, aber ohnehin wirkungsloser Wert mit Pfad (jede
schreibende Anfrage scheiterte damit) beendet jetzt den Start. Keine
Datenänderung.

Die Vorlagenänderung liegt uncommittet im Templates-Repo
(`/Volumes/DevLocal/DevUnraid/Production/Templates`, `master`); Commit und
Push dort folgen mit dem Abschluss.

**Doku-Abgleich:**

- `README.md` (Abschnitt zu Reverse Proxy/HTTPS) und `docker/README.md`
  (Konfigurationstext und Variablentabelle): gleicher Hinweis zu Format,
  Schrägstrich, Startabbruch und der Fehlermeldung im Browser.
- `unraid/README.md` (Tabelle Configuration, „Public origin“): dasselbe in
  Unraid-Begriffen (Feld, Container-Log).
- Vorlage `stockportfolio.xml`: Feldbeschreibung um „No path; a trailing slash
  is ignored.“ ergänzt; `xmllint` sauber.
- `.env.example`, `docs/`, App-Texte: kein Vorkommen der Variable, keine
  Änderung. Die Fehlermeldung `invalid_origin` bleibt; sie tritt jetzt nur noch
  bei einer tatsächlich anderen Adresse auf.
- Skill `task-verification-workflow`: keine Board-Konvention geändert, keine
  Übernahme nötig.

## Review-Verlauf (neueste Runde zuerst)

### Übergabe Runde 1 · claude-coder · 2026-10-03

Prüffassung siehe STATUS `handoff_commit` auf `t-91-public-origin-normalisieren`.
Belege oben unter Verify. Zu prüfen: Vollständigkeit der Ablehnungsfälle,
Übereinstimmung der drei Anleitungen und der Vorlage, Startabbruch ohne
Seiteneffekte im Datenordner.
