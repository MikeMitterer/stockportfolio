# T-66 · Status-Badges als Symbole statt „Buy / Sell / OK“ und stimmige Hinweistexte

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
| A · Badges | [1](#pruefpunkt-1) | Dashboard in Deutsch und Englisch öffnen | Nur Symbol und Farbe (↓ ↑ ✓ →), Gruppenkopf und Zeilen bündig, Tooltip nennt die Bedeutung? | |
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

## Stand nach Mikes weiteren Entscheidungen (2026-10-01)

Die vorherigen Abschnitte bleiben als Verlauf stehen. **Maßgeblich ist dieser
Abschnitt.** Die Übergabe `5a077ef` wurde vor Prüfbeginn zurückgenommen.

**Entscheidungen von Mike:**

1. Badges **ganz ohne Text, nur Symbol und Farbe**: ↓ rot (unter Ziel),
   ↑ rot (über Ziel), ✓ grün (OK), → gelb (knapp an der Grenze, „Near“).
2. Neben „Status“ ein **Fragezeichen**, das die Symbole erklärt, und zwar mit
   den **eingestellten Bändern** statt Beispielwerten.
3. **Near bleibt** als gelbes →. Bestätigt: Near ist der letzte Prozentpunkt
   der relativen Abweichung vor der Bandgrenze (`isNearBand`), bei
   −5 % / +10 % also −5 % bis −4 % und +9 % bis +10 %. Den Zustand gibt es seit
   `28b3053` (2026-08-07); er war wegen des schmalen Fensters selten sichtbar.
4. Hinweise **unter den Tabellen, bei About und im Login stimmig**; Login mit
   **Absätzen** und **Fettdruck**, dezenterer senkrechter Strich.
5. Gruppenköpfe: Symbol ohne Pille ist gewollt (ruhiger Kopf), muss aber
   **genau über den Zeilen** stehen.

**Umsetzung:**

- `SuggestionBadge.vue`: Pille nur mit Punkt und Symbol (2,75 rem, fest),
  `role="img"`, `aria-label` und `title` mit dem Katalogtext (Deutsch „Unter
  Ziel“ / „Über Ziel“ / „OK“ / „Knapp an der Grenze“, Englisch „Below“ /
  „Above“ / „OK“ / „Near the limit“). Punkt und Symbol schrumpfen nicht
  (`flex-shrink: 0`), kein Umbruch. Die ruhige Gruppenkopf-Variante behält
  das Kastenmaß der Pille (transparenter Rand).
- `composables/useStatusHint.ts`: Erklärtext aus den Einstellungen. Bei
  aktiven Bändern mit `−lower` / `+upper` und den Near-Schwellen
  (`lower−1`, `upper−1`); bei „Bänder und Termin“ zusätzlich der Satz zum
  fälligen Termin; beim reinen Kalendertermin ein eigener Text ohne Bänder
  und ohne →. Eingebunden im Spaltenkopf „Status“ von Positionstabelle und
  Rebalancing (`InfoHint`, Verweis auf Methode und Einstellung).
- Ausrichtung Gruppenkopf/Zeile: Ursache war, dass die Tabelle übrige Breite
  auf alle Spalten verteilte (Status-Zelle 116 statt 110 px) und das
  Kopffeld anders breit war. Jetzt nimmt nur die Positionsspalte (`minWidth`)
  übrigen Platz auf; das Status-Feld im Gruppenkopf hat dieselbe Breite wie
  die Spalte (6,875 rem = 110 px) und ist um den Innenabstand verschoben.
  Gemessen bei 1464, 1920 und 2900 px: Symbolmitte in Kopf und Zeilen
  identisch (0,0 px Abweichung).
- `components/EmphasizedText.vue`: Leerzeilen → Absätze, `**…**` → fett,
  über Textknoten ohne `v-html`. Login-Hinweis in drei Absätzen; fett:
  „rechnerisch“, „prüft nicht“, „führt keine Orders aus“, „Prüfe Daten,
  Kurse, Kosten und Risiken, bevor du handelst.“ Strich 2 px in
  `--border-subtle` statt 3 px `--border-default`.
- **Stimmige Texte** aus denselben Sätzen: Login (`auth.investmentNotice`),
  unter den Tabellen (`tradeNotice`), About (`about.use`), Methodenseite
  (`method.limitsAdvice`). Gemeinsamer Kern: „Die Statussymbole ↓ und ↑
  zeigen Abweichungen von deinen selbst gesetzten Zielen und Grenzwerten“,
  „Kauf- und Verkaufsbeträge und Stückzahlen zeigen, welche Änderungen
  rechnerisch nötig wären …“, „Die App prüft nicht, ob ein Geschäft oder ein
  Finanzinstrument für dich geeignet ist, und führt keine Orders aus“,
  „Prüfe Daten, Kurse, Kosten und Risiken, bevor du handelst“. Kein
  „keine Anlageberatung / keine Empfehlung“ mehr.
- **Scout Rule:** `method.limitsData` behauptete „Sie speichert nichts
  außerhalb des Browsers. Kein Server kennt die Bestände“ – seit T-60/T-61
  falsch. Jetzt: Depots, Einstellungen und Tageswerte liegen im Konto auf dem
  StockPortfolio-Server, getrennt je Konto; StockInfo erfährt nur die
  abgefragten Papiere.
- Erklärungen in de/en, die den Status benennen, nennen jetzt die Symbole
  (↓ / ↑ / ✓ mit „min“).

**Grenze · Popup-Formatierung:** `UxInfoHint` aus ux-foundation gibt reinen
Text aus, ohne Zeilenumbrüche, Fettdruck oder Slot. Der Popup-Text ist
deshalb gekürzt, aber nicht mit Leerzeilen oder Fettdruck gegliedert. Das
braucht eine Änderung im Fundament; nach AGENTS.md dort und nicht als lokale
Kopie. Offen für Mike.

**Tests:** `suggestionBadge.spec.ts` (nur Symbole, zugänglicher Name in
de/en, ✓ auch mit `min`), `useStatusHint.spec.ts` (eingestellte Bänder samt
Near-Schwellen, Satz zum Termin, Kalendertext ohne Bänder),
`i18nNotices.spec.ts` (Login, Tabellenhinweis, About gleich in Kern- und
Prüfsatz, Login in drei Absätzen, kein alter Ausschluss; schlug gegen die
alte Fassung fehl), `emphasizedText.spec.ts` (Absätze, Fettdruck, HTML wird
nicht ausgeführt).

**Prüfstand:** `make test` mit 837 Frontend- und 20 API-Tests grün; Lint und
Typprüfung ohne Befund; `git diff --check` ohne Befund.

**Sichtbare Browserläufe** (`:8082`/`:8898`, Fenster 80 px links, 50:50;
Fensterplatzierung ohne Screen-Details-API, die je Adresse einen
Freigabedialog auslöste und frühere Läufe blockierte):

- Hinweistexte, 16/16: Login in drei Absätzen mit Kern- und Prüfsatz, Badges
  nur mit Symbol und einzeilig, Fragezeichen am Status, Hinweis unter
  Dashboard- und Rebalancing-Tabelle, About, Methodenseite (Datenablage
  richtig, kein alter Ausschluss); jeweils de und en.
- Abschluss, 10/10: Login drei Absätze und Fettdruck, Strich 2 px, Symbole in
  Gruppenkopf und Zeilen bündig (0,0 px), Popup kurz und mit den
  eingestellten Bändern (−6,0 % / +15,0 %); de und en.
- Grenze: OK (✓) und Near (→) im Browser nicht erzeugt; beide sind im
  Komponententest belegt. `min`-Tooltip nicht geöffnet.

**Doku-Abgleich:** `README.md` und `docker/README.md` beschreiben den
Tabellenhinweis jetzt sinngleich (Beträge aus eigenen Zielen, keine
Eignungsprüfung, keine Orders; Login und About gleichlautend). Hub-Vorschau
10.614 Bytes. `unraid/README.md` („short note about the calculated buy and
sell figures“) bleibt zutreffend. Offen: Screenshot `docs/images/dashboard.png`.

## Verify

| # | Handgriff | Nachweis | AI |
|---|---|---|:--:|
| 1 | <a id="pruefpunkt-1"></a>Dashboard und Rebalancing in `de`/`en` | Badges nur mit Symbol und Farbe (↓ ↑ ✓ →), zugänglicher Name und Tooltip „Unter Ziel“/„Below“ usw.; keine Buy/Sell-Texte; Gruppenkopf und Zeilen bündig | ⚠️ |
| 2 | <a id="pruefpunkt-2"></a>Fragezeichen am Status, Methodenseite, Login-Hinweis lesen | Erklärung mit den eingestellten Bändern; Near-Schwellen stimmen mit `isNearBand` überein, auch bei Bändern unter 1 %; Kalendertermin und Mindesthandel (`min`) korrekt; Handelsbegriffe nur für berechnete Transaktionen | ◑ |
| 3 | Inventar aller sichtbaren `Buy`/`Sell`-Vorkommen und betroffenen Doku | Jede Fundstelle geändert oder begründet belassen | ✅ |
| 4 | `make test`, beide Lints und Typprüfungen, Build, sichtbarer Browserlauf | Ergebnisse dokumentiert | ✅ |

Legende: ✅ live bestätigt · ⚠️ mit Einschränkung · ◑ teilweise ·
➖ noch kein Nachweis.

### Doku-Abgleich

`README.md` und `docker/README.md` wurden in `6b8a6ee` angepasst: Der Hinweis
unter den Tabellen ist sinngleich zu Login und About beschrieben (Beträge aus
den eigenen Zielen, keine Eignungsprüfung, keine Orders). Die Status-Spalte
selbst beschreiben beide nicht; die Symbole brauchen dort keinen Nachtrag.
`unraid/README.md` („short note about the calculated buy and sell figures“)
und die Unraid-Vorlage bleiben zutreffend und unverändert. Die Methodenseite
ist Teil der App-Texte (oben). Der alte Screenshot ist als T-68 vorgemerkt.

### Lessons-Einordnung

Noch keine Reviewbefunde. Vorbeugend angewendet: SP-CX-02 (Entscheidung in
allen aktuellen Aussagen nachziehen: Badges, Hilfen, Methodenseite,
Login-Hinweis, T-64-Ticket), SP-R-02 (Browsergrenzen getrennt benannt).

## Unabhängige Prüfung · Runde 1 · `codex-verifier` · 2026-10-01

**Prüffassung:** Produkt-Commit `6b8a6ee`; spätere Commits bis `429bccf`
ändern laut `git diff 6b8a6ee HEAD -- frontend/src frontend/tests README.md
docker/README.md` keinen Produkt-, Test- oder Anleitungscode. Das Urteil lautet
`changes_requested`.

**Blockierender Befund · Erklärung der Near-Schwelle:**
`frontend/src/composables/useStatusHint.ts` begrenzt `upperPercent - 1` und
`lowerPercent - 1` mit `Math.max(..., 0)`. Die Einstellungen erlauben aber
Bandwerte von 0 bis 100 Prozent in Schritten von 0,1. Bei einem oberen Band
von 0,5 % beginnt Near nach `isNearBand` bereits 1 Prozentpunkt vor der
Obergrenze, also bei einer relativen Abweichung von −0,5 %. Das Popup nennt
dagegen +0,0 %. Beispielsweise ist −0,4 % noch innerhalb der Bänder und
`isNearBand` liefert `true`, obwohl der erklärte obere Schwellenwert nicht
erreicht ist. Die untere Grenze hat denselben Fehler bei Werten unter 1 %.
Die Erklärung muss die wirklichen Schwellen auch mit Vorzeichenwechsel
abbilden. Ein gezielter Test mit 0,5 % oberem und unterem Band soll Text und
`isNearBand` an beiden Seiten vergleichen.

**Ticket-Abgleich:** Die aktuelle Verify-Zeile #1 fordert noch ausgeschriebene
Badges `Below`/`Above`/`OK`, obwohl Mikes maßgebliche Entscheidung nur
Symbole verlangt. Der Doku-Abgleich darunter behauptet weiterhin, beide
READMEs seien unverändert; `6b8a6ee` änderte beide. Diese aktuellen
Prüfaussagen bitte an die Entscheidung und die tatsächlich geprüfte Fassung
anpassen. Die ältere Umsetzungsgeschichte bleibt historisch erkennbar.

**Eigene Nachweise:** Quellvergleich von Badge, Status-Hinweis,
`isNearBand`, Band-Eingaben, Login-Textkomponente, i18n-Katalogen und
README-Diff. `make test` erneut vollständig grün: 837 Frontend- und 20
API-Tests; beide Lints und Typprüfungen grün; `git diff --check` ohne Befund.
Ein erster `make test`-Lauf brach bei einer gleichzeitig wechselnden
`node_modules`-Installation nach 837 Frontend-Tests ab; er zählt nicht als
erfolgreicher Gesamtlauf. Browser-Ausrichtung und `min`-Tooltip wurden
von mir nicht live wiederholt; dazu liegen nur die oben getrennt genannten
Coder-Belege beziehungsweise Komponententests vor. Das ändert den konkreten
Schwellenbefund nicht.

**Doku-Abgleich:** `README.md` und `docker/README.md` wurden in `6b8a6ee`
inhaltlich auf denselben Hinweis zu berechneten Beträgen, Eignungsprüfung und
Orders geprüft; keine weitere Anpassung dafür nötig. Die statusbezogenen
Katalogtexte bleiben wegen des Near-Befunds offen. Der alte Screenshot ist
als T-68 getrennt vorgemerkt. Lessons: SP-R-02/AL-R-01 für die belegte
Prüftiefe, SP-CX-02 für den aktuellen Tickettext, SP-R-04 für die
blockierende Einstufung eines real möglichen Grenzfalls.

## Nacharbeit zu Runde 1

`claude-coder`, 2026-10-01, im Projekt-Root auf
`t-66-status-badges-below-above-ok`.

**Befund Near-Schwelle:** Ursache war `Math.max(lower − 1, 0)` und
`Math.max(upper − 1, 0)` in `useStatusHint`. `isNearBand` meldet Near im
letzten Prozentpunkt vor jeder Bandgrenze; als relative Abweichung reicht Near
unten von `−lower` bis `1 − lower`, oben von `upper − 1` bis `+upper`. Bei
Bändern unter 1 % wechseln diese Werte das Vorzeichen. Neu ist die reine
Funktion `nearThresholds(lower, upper)` ohne Abschneiden; der Text nennt beide
Bereiche („zwischen −0,5 % und +0,5 % sowie zwischen −0,5 % und +0,5 %“ bei
0,5 %; „zwischen −6,0 % und −5,0 % sowie zwischen +14,0 % und +15,0 %“ bei
den Vorgaben). `de` und `en` gleich angepasst.

**Grenzfalltest:** `useStatusHint.spec.ts` prüft bei 0,5 % / 0,5 % den Text
und vergleicht für jede relative Abweichung von −0,5 % bis +0,5 % in
0,1-Schritten das Ergebnis von `isNearBand` mit den beschriebenen Bereichen;
dasselbe bei −6 % / +15 % in 0,5-Schritten. Vor der Korrektur rot
(„ab −0,0 % bzw. +0,0 %“).

**Ticket-Abgleich:** Prüfpunkt A und Verify-Zeilen 1 und 2 beschreiben jetzt
Mikes maßgebliche Entscheidung (nur Symbole) und die Near-Schwellen; der
Doku-Abgleich nennt die tatsächliche README-Änderung in `6b8a6ee`.

**Lessons:** SP-R-04 angewendet (real möglicher Grenzfall als Fehler behoben,
mit Test für beide Seiten), SP-CX-02 (aktuelle Ticketaussagen nachgezogen).
Keine neue Lesson.

**Prüfungen:** `make test` mit 839 Frontend- und 20 API-Tests grün; beide
Lints und beide Typprüfungen ohne Befund; `git diff --check` ohne Befund.
Sichtbarer Lauf gegen den Teststack im Projekt-Root (`:5175`, Bänder
−6 % / +15 %): Das Popup am Status nennt „zwischen −6,0 % und −5,0 % sowie
zwischen +14,0 % und +15,0 %“. Der Grenzfall unter 1 % ist im Test belegt,
nicht im Browser eingestellt.

## Unabhängige Prüfung · Runde 2 · `codex-verifier` · 2026-10-01

**Prüffassung:** `c1b6c5772cdcaff58eaaaeed6802a0e18912c4cd`.
**Urteil: technisch `approved`.** Mikes Sichtung und Ticketabschluss stehen
weiterhin aus.

Der blockierende Befund aus Runde 1 ist behoben. `nearThresholds` liefert
unten `1 − lower` und oben `upper − 1`, ohne Werte unter 0 abzuschneiden.
`percentSigned` zeigt den Vorzeichenwechsel. Der deutsche und englische
Popup-Text nennt jetzt beide Bereiche mit Anfang und Ende; das entspricht
`isNearBand` innerhalb der eingestellten Bandgrenzen. Bei 0,5 % auf beiden
Seiten nennt er jeweils −0,5 % bis +0,5 %. Der gezielte Test prüft diesen
Text und vergleicht die Schwellen mit der Rechenfunktion; bei üblichen
Bandwerten prüft er beide getrennten Bereiche. Prüfpunkt A, Verify #1/#2
und der Doku-Abgleich nennen die aktuelle Symbolentscheidung und die in
`6b8a6ee` tatsächlich geänderten READMEs. Die historische Runde 1 bleibt
als solche stehen.

**Eigene Prüfungen:** Diff `6b8a6ee..c1b6c57` gelesen, anschließend
`tests/composables/useStatusHint.spec.ts` mit korrekter Frontend-Konfiguration
ausgeführt (5/5 grün); `npm --prefix frontend run build` erfolgreich und
`git diff --check` ohne Befund. Ein erster Aufruf des gezielten Tests ohne
die Vitest-Konfiguration scheiterte bereits an der Pfadauflösung und zählt
nicht als Test der Umsetzung. Der Coder meldet `make test` mit 839 Frontend-
und 20 API-Tests sowie beide Lints und Typprüfungen grün; diese Gesamt- und
Browserläufe habe ich in Runde 2 nicht selbst wiederholt. Die Browseraussage
zu Ausrichtung und Popup bei den Standardbändern bleibt Coder-Beleg; der
Grenzfall unter 1 % ist durch den eigenen gezielten Test und den Quellvergleich
bewertet. `min`-Tooltip wurde nicht live geprüft.

**Doku-Abgleich:** `README.md` und `docker/README.md` sind in der
Prüffassung gegenüber Runde 1 unverändert; ihre gemeinsamen Aussagen wurden
dort bereits inhaltlich verglichen. `unraid/README.md` und Vorlage brauchen
für die Near-Schwelle keinen Nachtrag. Die deutschen und englischen
Status-Popup-Texte sind Teil der geprüften Korrektur. Der alte Screenshot
bleibt T-68. Lessons: SP-R-04 (Grenzfall behoben), SP-CX-02
(Prüfaussagen nachgezogen), SP-R-02/AL-R-01 (eigene und übernommene
Testtiefe getrennt).
