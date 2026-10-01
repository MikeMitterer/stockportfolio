# T-66 · Status-Badges „Below / Above / OK“ statt „Buy / Sell / OK“

**Auftrag von Mike, 2026-10-01**, über `codex-observer` (INBOX-Nachricht
„Mikes Nachtrag zu T-64“, geprüfte Fassung `fd9d8f4`; hier vollständig
übernommen, die Nachricht ist damit verarbeitet):

- Die Buy-/Sell-Beschriftungen der Status-Badges heißen in **beiden Sprachen**
  genau `Below` / `Above` / `OK`. Es sind Anzeigen, keine Order-Buttons.
- Die drei Texte bleiben fest im i18n-Katalog; kein `.env`- oder
  Laufzeit-Override.
- Nur sichtbare Status-Beschriftungen und ihre Erklärungen anpassen; keine
  fachliche Berechnung und keine internen Bezeichner allein wegen der
  Wortwahl ändern.
- Gesondert eingeplant; T-65 bleibt eine reine Board-Prüfung.

**Nachentscheidung von Mike, 2026-10-01:** Nach Sichtung („Probiere des doch
mit den Begriffen „Darüber“ + „Darunter“ oder schlag was besseres vor“) hat
Mike für **Deutsch „Unter Ziel“ / „Über Ziel“** entschieden; **Englisch bleibt
„Below“ / „Above“**, beide „OK“. Das ersetzt für Deutsch die ursprüngliche
Vorgabe „in beiden Sprachen genau Below / Above / OK“.

**Einordnung in die Kette:** nach T-65; aktiviert am 2026-10-01 nach dessen
technischer Freigabe, Branch `t-66-status-badges-below-above-ok` im Worktree
`/private/tmp/stockportfolio-t66`.

## Für dich

| Frage | Prüfpunkt # | Handgriff | Dein Urteil | Human |
|---|---|---|---|---|
| A · Badges | [1](#pruefpunkt-1) | Dashboard in Deutsch und Englisch öffnen | Deutsch „Unter Ziel“ / „Über Ziel“ / „OK“, Englisch „Below“ / „Above“ / „OK“, einzeilig? | |
| B · Erklärungen | [2](#pruefpunkt-2) | Fragezeichen, Methodenseite und Login-Hinweis lesen | Erklären sie die Anzeigen richtig, auch Kalendertermin und Mindesthandel? | |

## Umfang

1. **Badges:** `suggestion.buy`/`suggestion.sell` in `de.ts` und `en.ts`
   zeigen `Below`/`Above`; `OK` bleibt. Der Kommentar zur Wortwahl im
   Katalog wird angepasst. Schlüssel und Werte der Logik (`buy`, `sell`)
   bleiben unverändert.
2. **Erklärungen präzise halten** (Beleg des Observers):
   `frontend/src/domain/rebalancing.ts` kann bei einem fälligen
   Kalendertermin anhand des **Zielwerts** statt des Toleranzbands
   `buy`/`sell` liefern; `applyMinTrade` kann eine Abweichung außerhalb des
   Bands als `OK` mit `min`-Markierung zeigen. Texte und Hilfen müssen beides
   korrekt erklären; `OK` darf nicht pauschal „innerhalb der Grenzwerte“
   heißen.
3. **T-64-Login-Hinweis nachziehen** (noch nicht menschlich abgenommen): Die
   Statusanzeige `Below`/`Above` beschreibt die Abweichung von selbst
   gesetzten Zielen beziehungsweise Grenzwerten; rechnerische Kauf- und
   Verkaufsbeträge sowie Stückzahlen bleiben als solche benannt. Kern
   beibehalten: keine Eignungsprüfung, keine Orders, mögliche Kurs- und
   Rechenfehler, Checkbox „Ich habe den Hinweis gelesen.“
4. **Alle sichtbaren Erläuterungen** in `de`/`en` und die einschlägige
   Dokumentation inhaltlich abgleichen. Echte Handelsbegriffe für berechnete
   Transaktionen (Plan, Kauf-/Verkaufsbeträge, Stückzahlen) **nicht blind
   ersetzen**. Ausgangsinventar: `method`-Texte zu den Bändern
   („springt der Status auf Buy oder Sell“), `investmentNotice`,
   Kommentar zu `suggestion`, Screenshots in README/Docker-Hub/Unraid prüfen.

**Ausdrücklich nicht beauftragt:** Rückzug oder Neuveröffentlichung der
Apps. Der Observer empfiehlt Mike, die veröffentlichten Apps wegen dieser
Wortwahl nicht zurückzuziehen; daraus folgt weder ein
Veröffentlichungsauftrag noch eine rechtliche Freigabe.

## Umsetzung (`claude-coder`, 2026-10-01)

**Badges:** `suggestion.buy` → `Below`, `suggestion.sell` → `Above` in
`de.ts` und `en.ts`; `ok` bleibt `OK`, `near` bleibt `Near` (nicht Teil des
Auftrags). Werte und Schlüssel der Logik (`buy`, `sell`, `ok`) sind
unverändert; die Pfeile ↓/↑ passen weiter. Der Katalog-Kommentar zur
Wortwahl ist angepasst. Die Texte stehen fest im Katalog, ohne Überschreibung
zur Laufzeit.

**Erklärungen (de und en), geändert:**

| Schlüssel | Neu |
|---|---|
| `settings.lowerHint` / `upperHint` | „… → Below.“ / „… → Above.“ statt „→ Kaufen/Verkaufen“ |
| Methode, Bänder | „springt der Status auf Below oder Above … beginnt Below bei 9,4 %“ |
| Methode, relative Bänder (Schluss) | „überall dieselbe Schwelle“ statt „derselbe Handlungsbedarf“ |
| `method.bandsMinTrade2` | bei Mindesthandel bleibt „OK“ mit „min“, „nur die Anzeige Below oder Above unterbleibt“ |
| `method.triggerBody` | neu: am fälligen Termin richtet sich der Status nach dem **Zielwert**; Below/Above schon bei jeder Abweichung |
| `hints.bands` | „zeigt die Position Below oder Above“ statt „entsteht Handlungsbedarf“ |
| `hints.minTradeSize` | „zeigt die Position „OK“ mit dem Zusatz „min““ |
| Hinweis zur Datenlage (Schluss) | „ob eine Position unter oder über ihrem Ziel liegt“ statt „gekauft oder verkauft werden sollte“ |
| `auth.investmentNotice` | „Die Statusanzeigen Below und Above zeigen, dass eine Position von deinen selbst gesetzten Zielen und Grenzwerten abweicht.“ Kauf-/Verkaufsbeträge und Stückzahlen bleiben benannt; Kern (keine Eignungsprüfung, keine Orders, Fehler möglich, Checkbox „gelesen“) unverändert |

`OK` wird nirgends als „innerhalb der Grenzwerte“ erklärt; die Texte nennen
die beiden Fälle Kalendertermin (Zielwert) und Mindesthandel (`OK` mit `min`)
ausdrücklich (`rebalancing.ts`: `combineSuggestion`, `applyMinTrade`).

**Bewusst unverändert (Handelsbegriffe für berechnete Transaktionen):**
`tradeNotice`, `about.use`, Rebalancing-Plan (Überschrift, Spalte
„Kauf / Verkauf“, Tooltips zur Stückzahl, fehlender Betrag für Käufe),
Hinweis zu Zielanteilen über 100 %, Delta-Tooltip „positiv kaufen, negativ
verkaufen“, `method.planBody`, der allgemeine Einleitungssatz „nicht jede
Abweichung ist ein Handlungsbedarf“. Code-Kommentare in `DashboardView.vue`
und `tradePlan.spec.ts` nennen jetzt „Below“.

**Inventar:** Suche nach `Buy`, `Sell`, `Kaufen`, `Verkaufen`,
`Handlungsbedarf`, „buy/sell“ in beiden Katalogen, in `src/` und in
`README.md`, `docker/README.md`, `unraid/README.md`; jede Fundstelle oben
geändert oder begründet belassen. Die Anleitungen beschreiben nur berechnete
Kauf- und Verkaufswerte, nicht die Status-Spalte; kein Textabgleich nötig.

**Offen für Mike · Screenshots:** `docs/images/dashboard.png` (README und
Docker-Hub-Beschreibung) zeigt noch ein „Buy“-Badge und ist auch sonst alt
(v0.2.0, frühere Kennzahlzeile). Neue Bilder wirken erst mit einer
Veröffentlichung von README, Docker Hub und Unraid-Listing; nicht in diesem
Auftrag geändert.

**Tests:** neu `frontend/tests/components/suggestionBadge.spec.ts`: In `de`
und `en` zeigen `buy`/`sell`/`ok` `Below`/`Above`/`OK`, auch `OK` mit `min`;
kein Badge enthält `Buy`/`Sell`. Vor der Änderung rot.

**Prüfstand:** `make test` mit 831 Frontend- und 20 API-Tests grün; beide
Lints und beide Typprüfungen ohne Befund; `git diff --check` ohne Befund.

**Sichtbarer Browserlauf:** Eigener Aufbau, damit Kurse geladen werden:
T-66-Build hinter einer zweiten Konto-API auf `127.0.0.1:8082` (temporäre
Datenbank, Testkonto über `/api/setup`) und ein StockInfo-Testserver auf
`:8898` mit CORS für `:8082`. Zwei Fenster, links Deutsch, rechts Englisch:
Login-Hinweis beider Sprachen nennt Below/Above; Beispiel-Depot, VGWL.DE auf
1 Stück → „Below“ links und per Live-Abgleich rechts, auf 5000 → „Above“ in
beiden; kein Badge zeigt Buy oder Sell; Methodenseite beider Sprachen erklärt
Bänder und Kalendertermin. **Grenze:** Im extremen Szenario stand keine
Position auf „OK“; „OK“ (auch mit „min“) ist im Komponententest belegt, nicht
im Browserlauf. Der `min`-Tooltip wurde im Browser nicht geöffnet.

## Nacharbeit nach Mikes Sichtung (vor der Übergabe)

1. **Umbruch in der Tabelle** (Mike: „Die Texte Above + Below brechen in der
   Tabelle falsch um“): Die Pille hatte eine feste Breite von 4,5 rem; Punkt,
   Pfeil und „Below“ brauchen gemessen 4,7 rem. Jetzt 6,5 rem (gemessen:
   „↓ Unter Ziel“ 6,0 rem, „↑ Über Ziel“ 5,8 rem) und `white-space: nowrap`.
   Die Status-Spalte der Positionstabelle ist 150 statt 130 px breit, damit
   das „min“-Zeichen daneben Platz hat.
2. **Senkrechter Strich vor dem Pfeil** in den Depotgruppen (Mike): Der Punkt
   war ein Flex-Element ohne `flex-shrink: 0` und wurde in der zu engen Pille
   zu einem Strich zusammengedrückt, bei „Above“ verschwand er ganz. Vorher-
   Bild der alten Fassung bestätigt das. Punkt und Pfeil schrumpfen jetzt
   nicht mehr.
3. **Deutsche Etiketten** „Unter Ziel“ / „Über Ziel“ samt aller deutschen
   Erklärungen (Bandhinweise, Methodenseite, Mindesthandel, Kalendertermin,
   Hilfen, Login-Hinweis „Die Statusanzeigen „Unter Ziel“ und „Über Ziel“
   zeigen …“). Englische Texte unverändert mit Below/Above.
4. **Scout Rule:** In der Delta-Spalte brach „+107,4 %“ zwischen Zahl und
   Prozentzeichen um (feste Breite 3,5 rem, unabhängig von T-66). Jetzt
   Mindestbreite und `white-space: nowrap`.

**Test:** `suggestionBadge.spec.ts` prüft `de` auf „Unter Ziel“/„Über Ziel“
und `en` auf „Below“/„Above“, beide „OK“ (auch mit `min`), kein Buy/Sell.
Vor der Umstellung rot.

**Sichtbarer Browserlauf nach der Nacharbeit** (Aufbau `:8082`/`:8898` wie
oben, zwei Fenster 80 px links, 50:50): Dashboard Deutsch 14 Badges
einzeilig („↑ Über Ziel“, „↓ Unter Ziel“), Englisch 14 („↑ Above“,
„↓ Below“); alle Punkte rund (Breite = Höhe); kein waagrechter Überlauf;
Delta-Werte einzeilig bis „+107,4 %“; Rebalancing Deutsch 6 Badges
einzeilig; mobil 390 px Englisch 6 Badges einzeilig. 10 von 10 bestanden.

**Prüfstand:** `make test` mit 831 Frontend- und 20 API-Tests grün; beide
Lints und beide Typprüfungen ohne Befund; `git diff --check` ohne Befund.

## Verify

| # | Handgriff | Nachweis | AI |
|---|---|---|:--:|
| 1 | <a id="pruefpunkt-1"></a>Dashboard und Rebalancing in `de`/`en` | Badges `Below`/`Above`/`OK`, keine Buy/Sell-Badges mehr | ⚠️ |
| 2 | <a id="pruefpunkt-2"></a>Hilfen, Methodenseite, Login-Hinweis lesen | Kalendertermin und Mindesthandel (`min`) korrekt erklärt; Handelsbegriffe nur für berechnete Transaktionen | ◑ |
| 3 | Inventar aller sichtbaren `Buy`/`Sell`-Vorkommen und betroffenen Doku | Jede Fundstelle geändert oder begründet belassen | ✅ |
| 4 | `make test`, beide Lints und Typprüfungen, Build, sichtbarer Browserlauf | Ergebnisse dokumentiert | ✅ |

Legende: ✅ live bestätigt · ⚠️ mit Einschränkung · ◑ teilweise ·
➖ noch kein Nachweis.

### Doku-Abgleich

`README.md`, `docker/README.md`, `unraid/README.md`: beschreiben nur
berechnete Kauf- und Verkaufswerte, nicht die Status-Spalte; unverändert.
Unraid-Vorlage: kein Status-Bezug; unverändert. Die Methodenseite ist Teil der
App-Texte (oben). Offen: Screenshot `docs/images/dashboard.png` (siehe oben).

### Lessons-Einordnung

Noch keine Reviewbefunde. Vorbeugend angewendet: SP-CX-02 (Entscheidung in
allen aktuellen Aussagen nachziehen: Badges, Hilfen, Methodenseite,
Login-Hinweis, T-64-Ticket), SP-R-02 (Browsergrenzen getrennt benannt).
