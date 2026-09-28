# T-58 · About und Hinweise zu Finanzdaten in StockPortfolio fertigstellen

StockPortfolio zeigt Kurse, Bestandswerte und berechnete Kauf- und
Verkaufswerte. Die Grenzen dieser Angaben und die rechtlichen Links sollen
direkt in der App erreichbar sein. Die About-Seite soll außerdem MangoLila GmbH
als Anbieterin mit Logo, Anschrift und Website zeigen.

**Stand am 2026-09-28:** Die erweiterte About-Seite und die Hinweise unter den
Dashboard- und Rebalancing-Tabellen liegen auf dem Branch
`t-58-about-data-use-notice` im Worktree `/private/tmp/stockportfolio-t58`.
Die erste Fassung steht in `c69b0a4`; Anbieteranschrift, Original-Logos,
Website-Link und mobile Bereichswahl wurden in `0a2c190` ergänzt. Mikes
Platzierungswünsche stehen in `2450abf`, die Linkdarstellung in `d8e8e57`
und die lesbare Fehlseite ohne API-Adresse in `c8e0ea3`.
Der Haupt-Checkout von StockPortfolio enthält T-58 noch nicht. Die frühere
Reviewübergabe wurde vor
Claudes Prüfung zurückgenommen; es gibt weiterhin keine technische Freigabe.

**Nächster Schritt:** Claude prüft die übergebene Fassung unabhängig.
Mike muss für die technische Umsetzung derzeit nichts
weiteres liefern. Die rechtliche Prüfung des endgültigen öffentlichen
Wortlauts bleibt seine gesonderte Entscheidung.

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
   prüfen. Der Haupt-Checkout hat derzeit T-59 bei Claude im Review. Dessen
   geprüfte Fassung und die dortigen uncommitteten Statusdateien erhalten.
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
| 1 | About in DE und EN direkt laden | Datenhinweise, sprachrichtige EUPL und Verbraucherklärung sind erreichbar | ➖ |
| 2 | Anbieterbereich in dunklem und hellem Theme prüfen | Richtiges Original-Logo, vollständige Anschrift und Website-Link auf About; keine Anschrift in der Statuszeile | ➖ |
| 3 | Desktop- und 390-px-Ansicht prüfen | Senkrechte Trennung nur auf breiter Ansicht; mobil kein waagrechter Strich, kein Überlauf und aktive Bereichswahl sichtbar | ➖ |
| 4 | Dashboard und Rebalancing prüfen | Hinweis zu berechneten Kauf-/Verkaufswerten jeweils außerhalb unterhalb des Tabellenbereichs | ➖ |
| 5 | Lizenz- und Quellcodezugang prüfen | `legal.html`, EUPL-Texte und Quellarchiv sind über About erreichbar; kein Lizenzlink in der Statuszeile | ➖ |
| 6 | Tests, Build und Dokumentation prüfen | Projektprüfungen und Docker-Hub-Vorschau bestehen; drei READMEs beschreiben den aktuellen Stand | ➖ |
| 7 | Fehlseite ohne API-Adresse im dunklen und hellen Theme prüfen | Überschrift, Erklärung und Konfigurationshinweis sind lesbar; es gibt weiterhin keinen stillen Start ohne Adresse | ➖ |

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
