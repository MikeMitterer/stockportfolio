# T-81 · Hinweistexte ohne Anklang an Anlagerat

**Warum dieses Ticket:** StockPortfolios Hinweise sagen klar: Die App
rechnet aus, was zu den **selbst gesetzten Zielen** des Nutzers führt; sie
prüft keine Eignung und führt keine Orders aus. Zwei Formulierungen passen
nicht zu dieser Linie. Sie klingen nach Markteinschätzung oder Empfehlung.

**Stand:** Angelegt am 2026-10-03 aus StockInfo nach einer Durchsicht der
Hinweistexte (Mike: „leg ein Ticket im StockPortfolio-doing an“). Liegt in
`30-doing/`; Rollen und Aktivierung legt StockPortfolios `STATUS.md` fest.
Noch nicht aktiviert, noch keine Umsetzung.

## Befund (Claude, 2026-10-03)

Bestehende Absicherung, unverändert gut: Login nur mit bestätigtem Hinweis
(`auth.investmentNotice`, `auth.investmentConfirm`), dauerhafter Hinweis in
Dashboard und Rebalancing (`TradeNotice.vue`, `tradeNotice`), Grenzen auf der
Methodenseite (`method.limitsAdvice`), About mit EUPL, Verbrauchererklärung
und MangoLilas Hinweisen zu Finanzinhalten.

### 1. „Günstig nachkaufen“ ist eine Markteinschätzung

| Datei | Text heute |
|---|---|
| `frontend/src/i18n/de.ts` (Methodenseite, Bänder) | „Ein gefallener Anteil bedeutet, dass man günstig nachkaufen kann; ein gestiegener bedeutet nur, dass etwas gut gelaufen ist.“ |
| `frontend/src/i18n/en.ts` (dieselbe Stelle) | „A share that has fallen means you can buy in cheaply; one that has risen only means something went well.“ |

Ein gefallener Kurs ist nicht automatisch günstig. Der Satz soll nur
erklären, warum die Bänder getrennt einstellbar sind, und bei der Rechnung
bleiben. Vorschlag:

- de: „Nach unten reagiert man üblicherweise früher als nach oben: Ein
  gefallener Anteil liegt unter deinem Ziel, ein gestiegener darüber.“
- en: entsprechend, ohne „cheaply“.

### 2. „Vorschlag“ / „suggestion“ klingt nach Empfehlung

| Datei | Stelle |
|---|---|
| `de.ts` | „Kauf- und Verkaufsvorschläge“ (Ziel-Anteile über 100 %) |
| `de.ts` | „nennt der Vorschlag die Stückzahl“ (Plan, Finanzierung aus Cash) |
| `en.ts` | „trade suggestions“ (fehlender Wechselkurs) |
| `en.ts` | „buy and sell suggestions“ (Ziel-Anteile über 100 %) |
| `en.ts` | „the suggestion gives the units“ (Plan, Finanzierung aus Cash) |

Die übrigen Hinweise sprechen von Beträgen, die **rechnerisch** nötig sind.
Neutral wären „Kauf- und Verkaufsbeträge“ / „trade amounts“ und „der Plan
nennt die Stückzahl“ / „the plan gives the units“.

Nicht betroffen: „Vorschlag anhand des Namens“ (Gruppenvorschlag beim
Anlegen, kein Handelsbezug) und der für Nutzer unsichtbare i18n-Schlüssel
`suggestion.*`.

## Umsetzung und technische Nachweise

| Repo | Time-box | Scope | GH-Issue |
|---|---|---|---|
| StockPortfolio | 1 h | Texte in `de.ts` und `en.ts`, betroffene Tests | — |

Nur sichtbare Texte; keine Logik, keine Schlüssel umbenennen.

### Verify

Legende: ➖ noch keine Live-Verifikation.

| # | Handgriff | Erwarteter Nachweis | AI |
|---|---|---|:--:|
| 1 | Textinventar über `de.ts` und `en.ts` nach „günstig“, „cheap“, „Vorschlag“, „suggestion“, „empfehl“, „recommend“ | Keine Formulierung mit Handels- oder Marktwertung übrig; Ausnahmen begründet | ➖ |
| 2 | Frontend-Tests | Grün; Tests, die alte Texte prüfen, sind angepasst | ➖ |
| 3 | Browserprüfung Methodenseite und Rebalancing in DE und EN | Neue Texte sichtbar, Layout unverändert | ➖ |

### Akzeptanzkriterien

- [ ] Der Bänder-Satz beschreibt die Lage zum Ziel, nicht den Markt.
- [ ] Kein sichtbarer Text nennt Kauf- oder Verkaufsbeträge „Vorschlag“ oder „suggestion“.
- [ ] Deutsche und englische Fassung sagen dasselbe.
- [ ] Doku-Abgleich: READMEs geprüft; Änderung nur, wenn sie die betroffenen Formulierungen zitieren.

### Side-Effects

Keine Verhaltensänderung. Kein Push, kein Docker-Hub- oder Unraid-Update.

### Auflösung

Offen. Noch keine Umsetzung oder Verifikation.
