# T-58 · About und Hinweise zu Finanzdaten in StockPortfolio fertigstellen

StockPortfolio zeigt Kurse, Bestandswerte und berechnete Kauf- und
Verkaufswerte. Die Grenzen dieser Angaben und die rechtlichen Links sollen
direkt in der App erreichbar sein. Die About-Seite soll außerdem MangoLila GmbH
als Anbieterin mit Logo, Anschrift und Website zeigen.

**Stand am 2026-09-28:** Die erweiterte About-Seite und die Hinweise unter den
Dashboard- und Rebalancing-Tabellen wurden auf dem Branch
`t-58-about-data-use-notice` im Worktree `/private/tmp/stockportfolio-t58`
entwickelt und nach Freigabe und Mikes Abschlussentscheidung integriert.
Die erste Fassung steht in `c69b0a4`; Anbieteranschrift, Original-Logos,
Website-Link und mobile Bereichswahl wurden in `0a2c190` ergänzt. Mikes
Platzierungswünsche stehen in `2450abf`, die Linkdarstellung in `d8e8e57`
und die lesbare Fehlseite ohne API-Adresse in `c8e0ea3`.
Die frühere Reviewübergabe wurde vor Claudes Prüfung zurückgenommen; die
ergänzte Fassung `c8e0ea3` wurde in Runde 1 technisch freigegeben.

**Abschluss:** Mike bestätigt am 2026-09-28: „Von mir aus ist das Ticket
durch.“ Die rechtliche Prüfung des endgültigen öffentlichen Wortlauts
bleibt seine gesonderte Entscheidung.

## Vorlage aus StockInfo

StockInfo hat die Anbieteransicht im Commit `5d0ea26` auf
`t-80-about-data-use-notice` umgesetzt. Die Dateien liegen lokal unter
`/Volumes/DevLocal/DevWeb/Production/StockInfo/dashboard/`:

- `src/components/AboutPanel.vue`: Inhalt links; rechts Logo, Anschrift und
  Website-Link. Eine senkrechte Linie trennt beide Bereiche auf breiten
  Bildschirmen. Mobil stehen Logo, Anschrift und Link unter dem Text, ohne
  waagrechte Linie.
- `public/mangolila-logo-dark.png`: Mikes transparentes Original-PNG mit
  **weißer** Schrift für dunkle Themes, 200 × 57 px.
- `public/mangolila-logo-light.png`: Mikes transparentes Original-PNG mit
  **schwarzer** Schrift für helle Themes, 200 × 57 px.
- `src/components/SettingsPanel.vue` und `src/styles/base.scss`: Unter 768 px
  ersetzt eine Bereichsauswahl die zu breite Reiterzeile. Bei Touch-Eingabe
  haben Auswahl, inneres Label und Rahmen dieselbe Mindesthöhe von 44 px.

Die PNGs stammen aus Mikes Dateien unter
`/Volumes/Daten/Projekte/MangoLila_210416_GmbH/Grafiken/WebSite/`:
`Logo-200px-ClearThinking-white.png` und
`Logo-200px-ClearThinking-black.png`. Die Farben der Dateien nicht verändern.
Die StockInfo-Fassung wurde bei 1440 px und emulierten 390 px in dunklem und
hellem Theme im Browser geprüft; `make test-dashboard` bestand mit 384/384
Tests, der Build und die Docker-Hub-Vorschau ebenfalls. Dies sind Nachweise
für **StockInfo**, nicht für StockPortfolio.

## Umsetzung in StockPortfolio

1. Den vorhandenen Worktree und die Rolle aus dem **StockPortfolio**-`STATUS.md`
   prüfen. T-59 ist abgeschlossen und auf `master` integriert. Dessen
   Änderungen und fremde uncommittete Dateien im Haupt-Checkout erhalten.
2. Die bestehende About-Seite in `src/views/SettingsView.vue` um die Anschrift
   **MangoLila GmbH, Dorfstraße 112, 6363 Westendorf, Österreich** und den
   Link `https://www.mangolila.at/` ergänzen. Die Anschrift gehört auf About,
   nicht in `src/components/AppStatusBar.vue`. Der dortige About-Link bleibt
   unmittelbar nach „powered by MangoLila“ in der Schrift der Statuszeile.
3. Beide Original-Logos in StockPortfolio ausliefern und anhand des aktiven
   Themes wählen: weißer Schriftzug auf dunklem Theme, schwarzer auf hellem.
   Den transparenten Dateien keinen farbigen Kasten geben. Abstände und
   Trennlinie anhand der tatsächlichen Theme-Token im Browser prüfen.
4. Die StockPortfolio-Einstellungen bei 390 px prüfen. Wenn ihre Reiterzeile
   ebenfalls überläuft, eine kompakte Bereichsauswahl wie in StockInfo
   verwenden; der aktive Bereich und `?tab=about` müssen sichtbar bleiben.
5. Die bisherigen Datenhinweise, Links zur EUPL in der gewählten Sprache,
   `LICENSING.md`, MangoLilas separatem Hinweis zu Finanzinhalten sowie
   `legal.html` und dem Quellarchiv erhalten. Nach Mikes Präzisierung steht
   „Lizenz & Quellcode“ nicht in der Statuszeile; der Zugang zu `legal.html`
   liegt auf About. Die Handelswert-Hinweise stehen als eigene Blöcke
   außerhalb und unterhalb der Dashboard- und Rebalancing-Tabelle.
   Root-, Docker- und Unraid-README inhaltlich abgleichen und die
   Docker-Hub-Vorschau prüfen.
6. Mikes Screenshot aus dem dunklen Modus prüfen: Ohne konfigurierte
   StockInfo-Adresse muss die frühe Fehlseite mit lesbarem Text im gewählten
   Theme erscheinen. Die Pflicht zur expliziten Adresse bleibt erhalten.

MangoLilas [Hinweis zu Finanzinhalten](https://www.mangolila.at/impressum/haftungsausschluss-disclaimer-finanzinhalte/)
bezieht sich auf Website und Publikationen. Er ersetzt weder die Lizenz noch
die Verbraucherklärung der App. Die About-Texte behaupten keinen pauschalen
Haftungsausschluss.

## Technische Verify-Matrix

| # | Prüfung | Erwartetes Ergebnis | AI |
|---|---|---|:--:|
| 1 | About in DE und EN direkt laden | Datenhinweise, sprachrichtige EUPL und Verbraucherklärung sind erreichbar | ✅ |
| 2 | Anbieterbereich in dunklem und hellem Theme prüfen | Richtiges Original-Logo, vollständige Anschrift und Website-Link auf About; keine Anschrift in der Statuszeile | ✅ |
| 3 | Desktop- und 390-px-Ansicht prüfen | Senkrechte Trennung nur auf breiter Ansicht; mobil kein waagrechter Strich, kein Überlauf und aktive Bereichswahl sichtbar | ✅ |
| 4 | Dashboard und Rebalancing prüfen | Hinweis zu berechneten Kauf-/Verkaufswerten jeweils außerhalb unterhalb des Tabellenbereichs | ✅ |
| 5 | Lizenz- und Quellcodezugang prüfen | `legal.html`, EUPL-Texte und Quellarchiv sind über About erreichbar; kein Lizenzlink in der Statuszeile | ✅ |
| 6 | Tests, Build und Dokumentation prüfen | Projektprüfungen und Docker-Hub-Vorschau bestehen; drei READMEs beschreiben den aktuellen Stand | ✅ |
| 7 | Fehlseite ohne API-Adresse im dunklen und hellen Theme prüfen | Überschrift, Erklärung und Konfigurationshinweis sind lesbar; es gibt weiterhin keinen stillen Start ohne Adresse | ✅ |

## Coder-Prüfung · 2026-09-28

- Die frühere Fassung `c69b0a4` bestand den gezielten About-Test (3/3),
  Lint, Typecheck und Build. Browserprüfung: Statuslink nach MangoLila mit
  derselben berechneten Schrift (11 px), direkt ladbarer About-Reiter,
  Tabellenhinweise unter Dashboard und Rebalancing. Mit synthetischer
  StockInfo-Adresse bestanden damals 797/798 Tests; der GHCR-Fall in
  `tests/dockerBuild.spec.ts` scheiterte unter macOS Bash 3.2 an
  `${GITHUB_OWNER,,}` (`bad substitution`). Ohne diese Testdatei: 779/779.
- Für die erweiterte Fassung bestanden die gezielten About- und
  Sprachkatalogtests (10/10), `make lint`, `make typecheck` und
  `make build-frontend`. Der Build enthält die beiden unveränderten
  StockInfo-Original-PNGs (200 × 57 px) sowie Lizenzdateien und Quellarchiv.
- Browser: About unter `/#/settings?tab=about` bei Desktopgröße und 390 px
  geöffnet. Weißer Schriftzug im dunklen und schwarzer im hellen Theme;
  Anschrift und Website-Link stehen auf About. Nur die breite Ansicht hat
  die senkrechte Trennung. Mobil bleiben Bereichswahl und aktiver Reiter
  sichtbar, kein horizontaler Überlauf (390 px Dokumentbreite bei 390 px
  Viewport); Auswahl, inneres Label und Rahmen messen je 44 px. Der
  Statuszeilenlink führt direkt zu About und entspricht mit 11 px der
  Schrift des MangoLila-Links.
- Nach Mikes Präzisierung stehen die Handelswert-Hinweise als eigene
  Textblöcke **außerhalb unterhalb** der Dashboard-Positionstafel und des
  Rebalancing-Tabellenbereichs. Browser-Gegenprobe bei 390 px: Dashboard
  liegt 4 px unter dem Panel; Rebalancing liegt ebenfalls 4 px unter dem
  horizontal scrollbaren Bereich und scrollt nicht mit der Tabelle. Die
  Schrift ist in beiden Themes 11 px und nutzt die gedämpfte Textfarbe.
- Nach Mikes weiterer Präzisierung ist der Lizenz-/Quellcode-Link aus der
  Statuszeile entfernt. Die Browserprüfung zeigt `legal.html` als Link auf
  About neben den sprachrichtigen EUPL- und Verbraucherlinks; die
  Statuszeile enthält weiterhin About und GitHub, aber keinen Lizenzlink.
- Desktop-Gegenprobe bei 1440 px nach Neustart des zwischenzeitlich
  beendeten Dev-Servers: dunkles Original-Logo lädt unter
  `/mangolila-logo-dark.png` mit natürlicher Breite 200 px. Der kurzzeitig
  sichtbare Bildfehler war Folge des gestoppten Vorschau-Servers, kein
  Produktfehler.
- Nach Mikes Link-Rückmeldung nutzen alle About-Links die Akzentfarbe des
  aktiven Themes. Im dunklen Theme: RGB 229/94/31 gegenüber Fließtext
  196/186/177; im hellen Theme: 40/118/210 gegenüber 87/83/74.
  Unterstreichung ist auf Mikes Wunsch entfernt; Tastaturfokus hat einen
  sichtbaren Akzentrahmen. Alle Linktexte bleiben in `de.ts`/`en.ts`.
- Mikes Screenshot auf Port 5175 zeigte schwarze Schrift auf dunkler
  Fehlseite ohne API-Adresse. Ursache: `App.vue` setzt das Theme erst beim
  Mounten; `main.ts` bricht vorher ab. Der Fehlerpfad wendet jetzt das
  gespeicherte beziehungsweise systemseitige Theme an. Rot-/Grün-Test
  `tests/startupError.spec.ts` (2/2) belegt `data-theme` und
  `color-scheme` für MangoLila und Paper. Browser ohne API-Adresse auf
  Port 5177: dunkler Hintergrund RGB 24/23/22, heller Text 248/245/242,
  Überschrift und Erklärung lesbar. Die API-Adresse bleibt Pflicht.
- Nach dem Screenshot-Fix: gezielte Start-, About- und Sprachtests 12/12;
  `make lint`, `make typecheck` und `make build-frontend` bestanden erneut.
  `make test` ohne konfigurierte API-Adresse: 799/802. Vor dem Fix waren es
  797/800; mit synthetischer Adresse damals 798/800. Die zwei älteren
  `apiBaseUrl`-Tests erwarten eine feste
  Produktionsadresse, obwohl `AGENTS.md` und `src/api/client.ts` ohne
  Adresse ausdrücklich `MissingApiUrlError` festlegen. Der GHCR-Test
  scheitert weiterhin unabhängig an Bash 3.2. Diese drei Bestandsfehler
  berühren die About-Änderung nicht; der Testlauf wird nicht als grün
  ausgewiesen.
- **Doku-Abgleich:** `README.md` (mobile Einstellungen, Lizenz und About),
  `docker/README.md` (Lizenz und About) und `unraid/README.md` (Lizenz
  und About) stimmen bei Anbieterangaben, mobiler Bereichswahl und
  Datenhinweisen überein. Die Docker-Hub-Vorschau bestand Link- und
  Größenprüfung. Der Screenshot-Fix ändert die Pflicht zur expliziten
  API-Adresse nicht; deren Konfiguration ist in den Anleitungen bereits
  beschrieben. `AGENTS.md` benötigt für diese Änderung keinen Nachtrag.
- Lessons-Abgleich: SP-CX-02 (aktuelle Aussagen in Ticket und Anleitungen)
  und SP-CX-05 (benannte StockInfo-Referenz samt Logo, Anordnung und
  Mobilansicht) wurden in Umsetzung und Browserprüfung berücksichtigt.

## Unabhängige Prüfung Runde 1

`claude`, 2026-09-28, an Handoff-Commit `c8e0ea3d0d3c1fa8a9ab208d9e8298fa4087f8ef`
(Worktree `/private/tmp/stockportfolio-t58`, Branch `t-58-about-data-use-notice`).

**Diff gelesen:** `git diff 0a9f30a..eaa562a --stat` und vollständig je Datei
selbst ausgeführt: `src/main.ts`, `src/components/AppStatusBar.vue`,
`src/components/TradeNotice.vue`, `src/i18n/de.ts`/`en.ts`,
`src/views/DashboardView.vue`, `src/views/RebalancingView.vue`,
`src/views/SettingsView.vue`, `README.md`, `docker/README.md`,
`unraid/README.md`, beide Logo-PNGs, beide neuen Testdateien.

**Eigene Prüfschritte:**
- `npx eslint src/ tests/ --max-warnings=0` selbst ausgeführt: sauber.
- `npx vue-tsc --noEmit` selbst ausgeführt: sauber.
- `npx vitest run` selbst ausgeführt: **800/802**, zwei Fehlschläge in
  `tests/api/client.spec.ts` (`apiBaseUrl`, erwarten eine feste
  Produktionsadresse — widerspricht `MissingApiUrlError` in
  `src/api/client.ts` und [AGENTS.md](../../AGENTS.md#stockportfolio-hängt-an-stockinfo);
  vorbestehend, nicht T-58). Abweichend vom Coder-Nachweis (799/802 mit
  zusätzlichem GHCR-Fehlschlag in `tests/dockerBuild.spec.ts`) bestand dieser
  Test bei mir (19/19) — `spawnSync('bash', …)` löst über `PATH` auf, meine
  Shell hat Homebrew-Bash 5.3.9 zuerst, `/bin/bash` ist weiterhin 3.2.57.
  Umgebungsabhängige Vorbestandslücke, keine T-58-Regression; berührt nicht
  den geprüften Umfang.
- `make build-frontend` selbst ausgeführt: erfolgreich; `dist/` enthält
  `mangolila-logo-dark.png`/`-light.png`, `LICENSE.txt`, `LICENSE.de.txt`,
  `LICENSING.md`, `legal.html`.
- `cmp` beider Logo-PNGs gegen StockInfos Originale unter
  `/Volumes/DevLocal/DevWeb/Production/StockInfo/dashboard/public/`: **bytegleich**.
  `file`: beide 200 × 57 px RGBA. Keine Nachbearbeitung, kein Kasten.
- `:deep(.n-tabs-nav)`/`:deep(.n-tabs-wrapper)` in `SettingsView.vue` gegen
  den Wächter `tests/componentStyles.spec.ts` geprüft: Der Test erkennt nur
  `class="…"` direkt an `<N…>`-Elementen, keine `:deep()`-Selektoren auf
  Bibliotheks-eigene Klassen; das Muster ist im Code bereits etabliert
  (`PositionsTable.vue`, `SettingsView.vue` vor T-58). Keine neue
  Regelverletzung, kein Befund.
- Docker-Hub-Vorschau des Coders **nicht** selbst wiederholt; hier auf
  Coder-Nachweis übernommen (SP-R-02: klar als übernommen gekennzeichnet).

**Eigene Browserprüfung** (Dev-Server im Worktree, Port 5178; `public/config.js`
für die Dauer der Prüfung testweise auf `http://localhost:9` gesetzt und danach
zurückgesetzt — Worktree ist wieder sauber, `git status` bestätigt):
- Startfehlseite ohne gesetzte Adresse: dunkler Hintergrund, heller lesbarer
  Text, roter Rahmen — Fix wirkt. Helles Theme nicht zusätzlich live geprüft;
  dafür `tests/startupError.spec.ts` (2/2, dunkel **und** hell) selbst
  ausgeführt und grün.
- About-Reiter direkt über `/#/settings?tab=about` geladen (DE): Anbieterblock
  rechts mit Logo, „MangoLila GmbH“, „Dorfstraße 112“, „6363 Westendorf“,
  „Österreich“, Website-Link; Statuszeile zeigt „About StockPortfolio“
  unmittelbar nach „powered by MangoLila“, kein Lizenzlink mehr.
  Theme auf „Paper“ (hell) gewechselt: Logo wechselt sichtbar auf die helle
  Fassung (schwarzer Schriftzug), Layout bleibt lesbar. Englische Fassung
  nicht zusätzlich live nachgeklickt; dafür deckt
  `tests/components/aboutNotice.spec.ts` (5/5) DE, EN und den Logo-/Theme-
  Wechsel automatisiert ab.
- Fensterbreite auf ~390 px verkleinert (tatsächlicher Viewport laut
  Overlay 518 px durch Browser-Chrome; klar unter dem `md`-Breakpoint):
  Native Tabs-Zeile verschwindet, kompakte Bereichswahl („About“) erscheint,
  Anbieterblock steht ohne waagrechten Trennstrich unterhalb des Inhalts,
  kein horizontaler Überlauf.
- Beispiel-Depot geladen (Kurse nicht erreichbar, `localhost:9`): Auf
  Dashboard erscheint der Kauf-/Verkaufshinweis sichtbar unterhalb der
  Depotgruppen-/Positionstabelle, außerhalb ihres Rahmens. Auf Rebalancing
  erscheint derselbe Hinweis unterhalb der Verkaufen-/Kaufen-Tabelle. Exakte
  Pixelabstände (Coder: 4 px) nicht selbst nachgemessen — visuell außerhalb
  und unterhalb bestätigt, keine Abweichung erkennbar.

**Dokumentationsbefund (SP-CX-02, auf Hinweis von `codex-observer`):** Oben
unter „Umsetzung in StockPortfolio“, Schritt 1, steht noch „Der Haupt-Checkout
hat derzeit T-59 bei Claude im Review.“ T-59 ist seit dieser Session
abgeschlossen und liegt unter `40-done/`. Die Aussage ist überholt und gehört
bei der nächsten Bearbeitung berichtigt; keine Produktänderung dadurch nötig.

**Nicht wiederholt:** Docker-Hub-Vorschau-Prüfung und exakte Pixelmessung der
Abstände (Coder-Nachweis übernommen, siehe oben).

**Lessons:** SP-CX-02 angewandt — Ticket, drei READMEs und Code stimmen in
Aussagen zu Statuszeile, About und mobiler Bereichswahl überein. SP-CX-05
angewandt — StockInfo-Referenz (Logo, Anordnung, Mobilansicht) mit der
StockPortfolio-Fassung live verglichen, keine Abweichung. SP-R-02 beachtet:
Diese Zeilen trennen selbst Ausgeführtes (Diff, Lint, Typecheck, Tests, Build,
Byte-Vergleich, Browser) von übernommenen Coder-Nachweisen (Docker-Hub-
Vorschau, Pixelmaße).

**Ergebnis:** Technisch freigegeben. Kein Produktbefund. Die abweichende
`dockerBuild`-Testzahl ist dokumentiert, aber nicht blockierend. Mikes
Abschlussentscheidung bleibt offen.

## Coder-Rückgabe nach Runde 1

Der überholte T-59-Status in Umsetzungsschritt 1 ist berichtigt. Der
Observer-Hinweis zum gemeinsamen Regelpaket ist bereits im STATUS als
„Offene Übernahme“ mit Stand `2026-09-27-central-package` sichtbar; eine
allgemeine Migration bleibt ohne Auftrag aus. Die drei INBOX-Nachrichten
von Observer und Verifier sind damit verarbeitet. Die freigegebene
Produktfassung `c8e0ea3` blieb unverändert; Mikes Abschlussentscheidung
stand zu diesem Zeitpunkt noch aus.

## Menschliche Antwort

Mike, 2026-09-28: „Von mir aus ist das Ticket durch.“ T-58 ist damit nach
Claudes technischer Freigabe in Runde 1 abgeschlossen. Die rechtliche
Prüfung des öffentlichen Wortlauts ist dadurch nicht behauptet.

## Abschlussintegration

Der Observer wies nach der Freigabe auf zwei überholte Gegenwartsaussagen
im Ticketkopf hin (fehlende technische Freigabe, erneute Prüfung als nächster
Schritt). Der Abschlusskopf nennt jetzt Claudes Freigabe und Mikes
Entscheidung; die historischen Reviewbelege bleiben erhalten.

Der freigegebene Produktstand wurde mit dem archivierten Ticket in einem
sauberen Integrations-Worktree auf `master` vorbereitet. `make lint`,
`make typecheck` und `make build-frontend` bestanden. `make test` erreichte
799/802; die zwei alten `apiBaseUrl`-Erwartungen und der macOS-Bash-3.2-Fall
im GHCR-Test bleiben dieselben dokumentierten Vorbestandsfehler.

**Doku-Abgleich:** `README.md`, `docker/README.md` und `unraid/README.md`
beschreiben Anbieterbereich, Datenhinweise und Lizenzzugang wie in der
freigegebenen Fassung. Auf Mikes weiteren Beschluss wird `_tickets/ACTIVITY.md`
aus Git genommen: `.gitignore`, `AGENTS.md`, Board-`README.md`, Workflow und
STATUS dokumentieren die lokale Ausnahme. Der globale Helfer schreibt die
Datei weiterhin; ihr lokaler Inhalt bleibt erhalten. Das installierte
`task-verification-workflow`-Paket wird auf Mikes weiteren Auftrag im
zuständigen AgentLessons-Board für künftige Projekte ergänzt. Dieser
projektübergreifende Schritt hat eine eigene Rollen- und Reviewkette.
