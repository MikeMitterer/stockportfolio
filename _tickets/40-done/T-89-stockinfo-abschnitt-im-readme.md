# T-89 · Eigener README-Abschnitt zu StockInfo

**Abgeschlossen am 2026-10-03** (Mike, 2026-10-03: „T-82 und T-89 sind abgenommen, push es“). Technisch freigegeben in Runde 1 (`3ae4dca`), nach `master` gemergt (`c410a4f`) und zu `origin` gepusht.

**Warum dieses Ticket:** Die READMEs nennen StockInfo nur als Kursquelle in
einem Nebensatz. Sie erklären nicht, wie die beiden Apps zusammengehören.
StockInfo hat dafür seit 2026-10-03 einen eigenen Abschnitt
„StockPortfolio: the companion app“ (StockInfo `10807c6`). StockPortfolio
braucht das Gegenstück.

**Stand:** Angelegt am 2026-10-03 von Claude auf Mikes Auftrag. Nach T-82 auf
einem eigenen Branch von `master` umgesetzt und in Runde 1 durch
`codex-verifier` technisch freigegeben. Menschlicher Abschluss steht aus.

## Aussage (Mike, 2026-10-03)

- StockInfo läuft unabhängig von StockPortfolio.
- StockPortfolio ist als sinnvolle Ergänzung zu StockInfo entwickelt und
  braucht StockInfo für Kurse, Devisenkurse und Fondskennzahlen.

## Umfang

1. `README.md`: eigene Überschrift nach dem Screenshot, vor
   „What it does“. Gleiche Position wie in StockInfo (nach dem Screenshot,
   vor den Release-Highlights).
2. `docker/README.md`: eigene Überschrift nach dem Screenshot, vor
   „Features“. Inhalt: StockInfo-Container zuerst starten,
   `STOCKINFO_API_URL` setzen, Link auf `mangolila/stockinfo`.
3. `unraid/README.md`: kurzer Hinweis mit Link auf den Abschnitt im
   Root-README.

## Textvorschlag (README.md)

```markdown
### StockInfo: where the prices come from

StockPortfolio was built as a companion to
[StockInfo](https://github.com/MikeMitterer/stockinfo). StockInfo supplies
prices, exchange rates and fund metrics; StockPortfolio turns them into
portfolio values and rebalancing trades. StockPortfolio does not work
without a StockInfo instance.

StockInfo also works on its own, for example for scripts or spreadsheets.

|  | StockInfo | StockPortfolio |
|---|---|---|
| Purpose | Quotes, price history, ETF metrics | Portfolios, valuation, rebalancing |
| Runs without the other app | Yes | No, it needs StockInfo for prices |
| Docker image | [`mangolila/stockinfo`](https://hub.docker.com/r/mangolila/stockinfo) | [`mangolila/stockportfolio`](https://hub.docker.com/r/mangolila/stockportfolio) |

Set up StockInfo first, then point StockPortfolio at it with
`STOCKINFO_API_URL` (see [Setup](#setup)).
```

Die Tabelle stimmt wörtlich mit StockInfos README überein. Ändert sich eine
Seite, zieht die andere mit.

### Akzeptanzkriterien

- [x] `README.md` und `docker/README.md` haben je eine eigene Überschrift zu
      StockInfo an der genannten Stelle.
- [x] Beide sagen: StockInfo läuft allein, StockPortfolio braucht StockInfo
      und ist als Ergänzung dafür entwickelt.
- [x] Die Tabelle stimmt mit StockInfos README überein.
- [x] `unraid/README.md` verweist auf den Abschnitt.
- [x] Docker-Hub-Vorschau unter 25.000 Bytes.

## Review-Verlauf (neueste Runde zuerst)

### Technische Prüfung Runde 1 · codex-verifier · 2026-10-03

**Prüffassung:** `3ae4dca` auf `t-89-stockinfo-abschnitt-im-readme`.
Rollen, Owner, Branch und Paketversion
`df699dd1d7583c59030030ad44e3ab896d4660be8d84575662e652f754624da1`
abgeglichen. **Urteil: technisch freigegeben (`approved`).** Keine
menschliche Abnahme durch den Verifier.

**Inhaltsabgleich:** `README.md` und `docker/README.md` haben je eine eigene
StockInfo-Überschrift nach dem Screenshot. Beide sagen, dass StockInfo
eigenständig läuft und StockPortfolio für Kurse, Devisenkurse und
Fondskennzahlen StockInfo braucht. Die drei Tabellenzeilen stimmen wörtlich
mit StockInfos `README.md` überein. Der Link in `unraid/README.md` trifft
den neuen Anker `#stockinfo-where-the-prices-come-from`; die Einrichtung
verweist weiterhin auf die vom Container erreichbare Adresse. Die
Installationsaussagen in Projekt-, Container- und Unraid-Anleitung sind
inhaltlich konsistent. `stockportfolio.xml` ist für diesen reinen
Erklärabschnitt nicht betroffen.

**Prüfnachweis:** Die echte Docker-Hub-Vorschau mit
`dockerhub-readme.sh --preview --ref master` wurde unabhängig nach
`/private/tmp` geschrieben: 13.663 UTF-8-Bytes, der neue Abschnitt und die
Anker `#quick-start`/`#configuration` sind enthalten. Keine Änderung am
Produktcode. Die vom Coder dokumentierten Tests, Lint und Typecheck waren
grün; für diese reine Dokuänderung wurden sie nicht nochmals gestartet.
`git diff --check` auf den Produktdateien ohne Befund. Lessons-Einordnung:
kein neuer Fehlerbefund, keine Aufnahme fällig.

### Übergabe Runde 1 · claude-coder · 2026-10-03

Branch `t-89-stockinfo-abschnitt-im-readme` von `master` (`9c3bff8`, mit
T-82), Dokustand `13ae8db`.

**Umsetzung.**

- `README.md`: `### StockInfo: where the prices come from` nach dem
  Screenshot und seiner Bildunterschrift, vor `## What it does`. Text wie im
  Vorschlag, Tabelle, Verweis auf `#setup`. Dieselbe Ebene `###` wie
  StockInfos Gegenstück.
- `docker/README.md`: `### StockInfo first` nach dem Screenshot, vor
  `## Features`. StockPortfolio als Ergänzung, StockInfo läuft allein,
  dieselbe Tabelle, zwei Schritte: `mangolila/stockinfo` starten, dann
  `STOCKINFO_API_URL` auf eine vom Container erreichbare Adresse (Verweise auf
  `#quick-start` und `#configuration`).
- `unraid/README.md`: Einleitung verweist auf
  `../README.md#stockinfo-where-the-prices-come-from` und sagt „install
  StockInfo first“. Der überholte Satz „serves a static browser app“ wird
  dabei zu „a web app with its own account API“ (seit der Konto-API nicht
  mehr zutreffend).

**Belege.**

1. Tabellenabgleich per Skript: Der Tabellenblock aus StockInfos `README.md`
   (`10807c6`) steht wörtlich in `README.md` und `docker/README.md` (beide
   `True`).
2. Docker-Hub-Vorschau: 13.663 Byte (Grenze 25.000); Abschnitt und Anker
   `#quick-start`/`#configuration` in der konvertierten Fassung vorhanden.
3. `make test` (Frontend 83/865, API 6/28), Lint und Typecheck
   `frontend`/`api` Exit 0, `git diff --check` sauber.

**Doku-Abgleich.** `README.md` und `docker/README.md` gemeinsam gelesen:
gleiche Aussage (StockInfo allein lauffähig, StockPortfolio braucht es),
gleiche Tabelle; die Einleitungen beider Dateien nennen StockInfo weiterhin
als getrennten Dienst, kein Widerspruch. `unraid/README.md` verweist auf den
Abschnitt. Vorlage `stockportfolio.xml` unverändert: Sie nennt StockInfo im
Overview schon als getrennte API und verlangt sie unter Requires; ein Link auf
den README-Abschnitt ist dort nicht nötig. `docs/` nicht betroffen. Skill
`task-verification-workflow`: keine Board-Konvention geändert.
