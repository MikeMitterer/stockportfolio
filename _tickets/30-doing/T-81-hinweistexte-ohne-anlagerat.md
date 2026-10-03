# T-81 · Hinweistexte ohne Anklang an Anlagerat

**Warum dieses Ticket:** StockPortfolios Hinweise sagen klar: Die App
rechnet aus, was zu den **selbst gesetzten Zielen** des Nutzers führt; sie
prüft keine Eignung und führt keine Orders aus. Zwei Formulierungen passen
nicht zu dieser Linie. Sie klingen nach Markteinschätzung oder Empfehlung.

**Stand:** Angelegt am 2026-10-03 aus StockInfo nach einer Durchsicht der
Hinweistexte (Mike: „leg ein Ticket im StockPortfolio-doing an“). Liegt in
`30-doing/`; Rollen und Aktivierung legt StockPortfolios `STATUS.md` fest.
Am 2026-10-03 aktiviert (Mike: „aktiviere T-81 in StockPortfolio“) auf
Branch `t-81-hinweistexte-ohne-anlagerat`. Umsetzung Runde 1 am 2026-10-03
durch `claude-coder` an den Verifier übergeben (siehe Review-Verlauf).

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

### 3. Lizenzfeld in `api/package.json` fehlt

`frontend/package.json` nennt `"license": "EUPL-1.2"`, `api/package.json`
nennt keine Lizenz. Beim Lizenzvergleich mit StockInfo am 2026-10-03
aufgefallen (Mike: „ja, nimm das in T-81 auf“). Rein formal; Lizenz und
`LICENSING.md` gelten für das ganze Repo.

### 4. Support-Erwartung in den Anleitungen (umgesetzt)

Mike, 2026-10-03: „formulier den Satz für beide Apps - setze das auch gleich
um“. `README.md` (neuer Abschnitt „Support“) und `docker/README.md`
(„Unraid and support“) sagen jetzt: StockPortfolio ist für den eigenen
Bedarf gebaut und kostenlos geteilt; Issues und Pull Requests werden
gelesen, Antwort, Fix oder Feature sind nicht zugesagt. Gleicher Wortlaut
wie in StockInfo (`4185767`). `unraid/README.md` nennt keinen Support- oder
Issue-Weg und bleibt unverändert. Docker-Hub-Vorschau: 12.313 von 25.000 Bytes.

## Umsetzung und technische Nachweise

| Repo | Time-box | Scope | GH-Issue |
|---|---|---|---|
| StockPortfolio | 1 h | Texte in `de.ts` und `en.ts`, betroffene Tests, Lizenzfeld in `api/package.json` | — |

Nur sichtbare Texte und das Lizenzfeld; keine Logik, keine Schlüssel umbenennen.

### Verify

Legende: ✅ vom Coder geprüft (Belege im Review-Verlauf, Runde 1); unabhängige Prüfung offen.

| # | Handgriff | Erwarteter Nachweis | AI |
|---|---|---|:--:|
| 1 | Textinventar über `de.ts` und `en.ts` nach „günstig“, „cheap“, „Vorschlag“, „suggestion“, „empfehl“, „recommend“ | Keine Formulierung mit Handels- oder Marktwertung übrig; Ausnahmen begründet | ✅ |
| 2 | Frontend-Tests | Grün; Tests, die alte Texte prüfen, sind angepasst | ✅ |
| 3 | Browserprüfung Methodenseite und Rebalancing in DE und EN | Neue Texte sichtbar, Layout unverändert | ✅ |
| 4 | Lizenzfeld in allen `package.json` des Repos (ohne `node_modules`) | Jede nennt `"license": "EUPL-1.2"`; `npm install` ändert das Lockfile nur um dieses Feld | ✅ |

### Akzeptanzkriterien

- [x] Der Bänder-Satz beschreibt die Lage zum Ziel, nicht den Markt.
- [x] Kein sichtbarer Text nennt Kauf- oder Verkaufsbeträge „Vorschlag“ oder „suggestion“.
- [x] Deutsche und englische Fassung sagen dasselbe.
- [x] `api/package.json` nennt `"license": "EUPL-1.2"`.
- [x] Doku-Abgleich: READMEs geprüft; Änderung nur, wenn sie die betroffenen Formulierungen zitieren.

### Side-Effects

Keine Verhaltensänderung. Das Lizenzfeld ändert keine Rechte, nur die
Paketmetadaten. Kein Push, kein Docker-Hub- oder Unraid-Update.

### Auflösung

Umgesetzt in Runde 1; technische Freigabe und Mikes Abschluss stehen aus.

## Review-Verlauf (neueste Runde zuerst)

### Übergabe Runde 1 · claude-coder · 2026-10-03

**Umfang** (Produktcommit siehe STATUS `handoff_commit`):

- **Bänder-Satz** (`method.bandsBody2`, de/en): beschreibt die Lage zum
  Ziel statt des Markts. de: „Nach unten reagiert man üblicherweise früher
  als nach oben: Ein gefallener Anteil liegt unter deinem Ziel, ein
  gestiegener darüber.“ en: „… one usually reacts sooner on the way down than
  on the way up: a share that has fallen is below your target, one that has
  risen is above it.“
- **„Vorschlag“ → Betrag/Plan**, alle sichtbaren Handelsstellen:
  `fx.missingPair` (de „Handelsbeträge“, en „trade amounts“ — de stand im
  Befund nicht, ist aber dieselbe Stelle wie en),
  `notify.targetsExceededBody` („Kauf- und Verkaufsbeträge“ / „buy and sell
  amounts“), `hints.coverFrom` („nennt der Plan“ / „the plan gives“).
- **Lizenzfeld:** `api/package.json` nennt `"license": "EUPL-1.2"`;
  `npm --prefix api install --package-lock-only --ignore-scripts` ergänzt im
  Lockfile genau diese eine Zeile im Wurzelpaket.
- **Testname** in `frontend/tests/stores/quoteContract.spec.ts` von
  „Handelsvorschlägen“ auf „Handelsbeträgen“ (nur `it`-Text).
- **Neues Prüfskript** `frontend/scripts/notice-texts-check.mjs`
  (`npm --prefix frontend run check:notice-texts -- <demo-accounts.json> [Bildordner]`):
  meldet sich im Teststack an, liest Methodenseite und den Rebalancing-Hinweis
  „Decken aus“ in DE und EN, prüft erwartete und ausgeschlossene Wortlaute,
  Exit-Code 1 bei Abweichung. Sichtbar, Fenster links 100 px frei
  (AGENTS.md · Browserprüfung).
- **Nebenfund behoben:** `scripts/stockinfo-test-server.py` startete nicht
  mehr (`ModuleNotFoundError: No module named 'app.db'`). StockInfo hat
  `app/db.py` und `app/repository.py` in `2b5f908` nach `app/persistence/`
  verschoben; das Skript importiert StockInfos Module direkt. Zwei Importe
  nachgezogen, keine weitere Änderung; danach meldete `--stack --run
  --demo-accounts` „All local endpoints and CORS checks passed“.

**Textinventar** (`grep -n -i -E "günstig|cheap|vorschl|suggestion|empfehl|recommend"`
über `de.ts`/`en.ts` nach der Änderung): übrig sind nur der Schlüssel
`suggestion:` (für Nutzer unsichtbar) und `groupHint` „Vorschlag anhand des
Namens“ / „Suggested from the name“ (Gruppenvorschlag, kein Handelsbezug) —
beide laut Befund ausgenommen. „lohnt“ (`method.bandsBody4`,
`hints.minTradeSize`) bezieht sich auf Gebühr gegen Ordergröße, keine
Marktwertung; unverändert.

**Pflichtprüfungen** (nach letzter Änderung):

| Befehl | Ergebnis |
|---|---|
| `make test` | Exit 0; Frontend 82 Dateien / 852 Tests, API 5 / 20 |
| `npm --prefix frontend run lint` | Exit 0 |
| `npm --prefix api run lint` | Exit 0 |
| `npm --prefix frontend run typecheck` | Exit 0 |
| `npm --prefix api run typecheck` | Exit 0 |

**Browserprüfung** (sichtbar, Teststack `--stack --run --demo-accounts`,
Beispiel-Depot): `check:notice-texts` → `OK` für de/en Methodenseite und
de/en Rebalancing-Hinweis, Exit 0. Screenshots (Methodenseite ganz, Hinweis
aufgeklappt) angesehen: neue Sätze sichtbar, Layout unverändert. Bilder
liegen nur im Scratchpad der Session, nicht im Repo. Teststack danach
gestoppt („Own local test stack stopped; temporary account data removed“),
Ports 5175/8080/8899 frei.

**Rote Gegenprobe des Prüfskripts** (lokale Pflicht für neue Prüfskripte;
Fehler jeweils in der laufenden Oberfläche eingebaut, danach
`de.ts`/`en.ts` byte-gleich wiederhergestellt, `cmp -s`):

| Fall | Eingebauter Fehler | Beobachtet | Exit |
|---|---|---|---|
| Erwarteter Text fehlt | en `bandsBody2`: „below your target“ → „below the target“ | `FEHLER en · Methodenseite: erwarteter Text fehlt` | 1 |
| Ausgeschlossener Text vorhanden | de `bandsBody2` um „Dann kann man günstig nachkaufen.“ ergänzt | `FEHLER de · Methodenseite: ausgeschlossener Text gefunden: „günstig“` | 1 |
| Hinweis mit altem Wortlaut | de `hints.coverFrom`: „nennt der Plan“ → „nennt der Vorschlag“ | `FEHLER de · Rebalancing-Hinweis: erwarteter Text fehlt` und `… ausgeschlossener Text gefunden: „Vorschlag“` | 1 |

Einschränkung: Weil die Wiederherstellung zwischen den Fällen zunächst an
einem interaktiven `cp`-Alias scheiterte, liefen Fall 2 und 3 mit den
Fehlern der Vorfälle zusammen. Jeder Fall erzeugte trotzdem seine eigene,
neue FEHLER-Zeile; der abschließende grüne Lauf nach Wiederherstellung
endete mit Exit 0.

**Doku-Abgleich:** `README.md` sprach an drei Stellen von „trade
suggestions“ (Abschnitt zur Mindestordergröße, Kursgültigkeit,
About-Seite) — auf „trade amounts“ angeglichen. `docker/README.md`:
Inventar nach „suggest|recommend|cheap“ ohne Treffer, unverändert.
`unraid/README.md`, `docs/*.md`: keine Zitate der geänderten Texte;
`docs/superpowers/plans/2026-09-10-t39-…` („Handelsvorschlag“) ist ein
historischer Plan und bleibt. `AGENTS.md`/README nennen
`check:notice-texts` nicht; AGENTS.md · Browserprüfung zählt die Skripte
unter `frontend/scripts/` mit „derzeit“ auf — dort ergänzt.

**Lessons:** gelesen SP-CL-01 (nur im Root gearbeitet, Branch geprüft),
gemeinsame Regeln SI-P-02/12 (Inventar statt Einzelfund: Textinventar oben),
SI-P-04/08 (Gegenprobe unterscheidet richtig/falsch: rote Läufe oben),
SP-CX-04 (Prüfhilfe ticketunabhängig benannt), SP-R-04 (erkannter
Teststack-Fehler behoben statt nur gemeldet), SP-R-05 (Stack nach Stopp
geprüft).

**Für den Verifier:** Bitte besonders prüfen, ob die neuen Sätze in DE und
EN dasselbe sagen und ob die Teststack-Importkorrektur in diesem Ticket
vertretbar ist (Nebenfund, für die Browserprüfung nötig).
