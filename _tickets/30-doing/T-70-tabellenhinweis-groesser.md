# T-70 · Hinweis unter den Tabellen etwas größer

**Warum dieses Ticket:** Der Hinweis unter der Tabelle in Dashboard und
Rebalancing („Kauf- und Verkaufsbeträge … zeigen, welche Änderungen
rechnerisch nötig wären …“) ist mit 11 px schwer zu lesen. Mike, 2026-10-01:
„Der Text unterhalb der Tabelle beim Dashboard und beim Rebalancing - mach ihn
ein wenig größer“.

**Stand:** In Umsetzung durch `claude-coder` auf `t-70-tabellenhinweis-groesser`.

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

- [ ] Der Hinweis unter den Tabellen ist in beiden Ansichten etwas größer und nutzt einen Schrift-Token des Fundaments.

### Side-Effects

Nur die gemeinsame Komponente `TradeNotice.vue`; Texte bleiben unverändert.
