# T-70 · Hinweis unter den Tabellen etwas größer

**Warum dieses Ticket:** Der Hinweis unter der Tabelle in Dashboard und
Rebalancing („Kauf- und Verkaufsbeträge … zeigen, welche Änderungen
rechnerisch nötig wären …“) ist mit 11 px schwer zu lesen. Mike, 2026-10-01:
„Der Text unterhalb der Tabelle beim Dashboard und beim Rebalancing - mach ihn
ein wenig größer“.

**Stand:** Umgesetzt in `d03486c` und an `codex-verifier` übergeben. Dein
laufendes `make dev` zeigt die neue Größe bereits; ein Blick auf Dashboard
und Rebalancing genügt als Sichtprüfung ([Prüfpunkt 1](#pruefpunkt-1)).

Für dich steht jetzt nichts an.

## Umsetzung und technische Nachweise

| Repo | Time-box | Scope | GH-Issue |
|---|---|---|---|
| root (`frontend/`) | 0,5 h | `TradeNotice.vue` | — |

### Verify

| # | Lauf | Handgriff | Nachweis | woher | AI |
|---|:--:|---|---|---|:--:|
| 1 | <a id="pruefpunkt-1"></a>Teststack | Dashboard und Rebalancing öffnen, Hinweis unter der Tabelle ansehen | Schrift `--font-xs` (12 px) statt 11 px, in beiden Ansichten gleich, kein Umbruch der Tabelle betroffen | Mike | ➖ |

### Akzeptanzkriterien

- [x] Der Hinweis unter den Tabellen ist in beiden Ansichten etwas größer und nutzt einen Schrift-Token des Fundaments.

### Side-Effects

Nur die gemeinsame Komponente `TradeNotice.vue`; Texte bleiben unverändert.

## Coder-Übergabe · Runde 1 · claude-coder · 2026-10-01

**Prüfstand:** `d03486c5b122a6a92e65d27ad98f81a97711aacb` gegen `02d1cae` (`master`), Branch
`t-70-tabellenhinweis-groesser`.

**Änderung:** `TradeNotice.vue` setzt `font-size: var(--font-xs)` (0,75 rem,
12 px) statt `0.6875rem` (11 px). Die Komponente steht unter beiden Tabellen;
Text, Farbe und Abstand bleiben. `--font-xs` ist im Fundament definiert
(`designTokens.spec.ts` grün).

**Belege:** `make test` 848 Frontend- und 20 API-Tests grün; Lint und
Typecheck für `frontend` und `api` ohne Befund. Kein eigener Browserlauf:
Mike hatte `make dev` auf 5175/8080 laufen, der Teststack hätte dieselben
Ports belegt. Prüfpunkt 1 bleibt für die Sichtprüfung offen (➖).

**Doku-Abgleich:** Keine Anleitung nennt die Schriftgröße; `README.md`,
`docker/README.md`, `unraid/README.md` und `docs/` unverändert. Die
Screenshots folgen ohnehin in T-68.

**Lessons:** Keine Befunde, keine neue Lesson.
