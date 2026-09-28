# Changelog

Generated from release tags and Conventional Commits.

## v0.5.0+260928.1401.98d5d — 2026-09-28

About mit Anbieterangaben und Datenhinweisen ergänzen; Startmeldung im dunklen Theme lesbar machen

### Documentation

- Verfügbarkeit in Community Applications nennen (`5c619eb`)

### Features

- add About and trade notices (`c69b0a4`)
- Anbieterbereich und mobile Bereichswahl ergänzen (`0a2c190`)

### Fixes

- Hinweise und Lizenzzugang richtig platzieren (`2450abf`)
- Links farblich vom Text abheben (`d8e8e57`)
- Fehlseite im gewählten Theme lesbar machen (`c8e0ea3`)

## v0.4.0+260927.2137.6687a — 2026-09-27

StockPortfolio auf EUPL 1.2 umstellen und Lizenzdateien mit Docker ausliefern

### Features

- Changelog direkt in Release-Targets einbinden (`602d706`)
- gemeinsame Themes und Python-Werkzeuge integrieren (`11a6302`)
- AGPL und kommerzielle Alternative anbieten (`ccbb03d`)

### Other changes

- Theme-Helfer teilen und Changelog direkt veröffentlichen (`5be5acb`)

### Documentation

- transparente Python-Starts und Symlinks dokumentieren (`4abaa5f`)
- define own-use terms and MangoLila licensing (`e3d068e`)

## v0.3.0+260927.1152.7bcff — 2026-09-27

Rebalancing-Anzeige und Backup-Einstieg verbessern

### Fixes

- Spaltenkopf verschwindet nicht mehr beim Einklappen der obersten Gruppe (`b1e2cf0`)
- Aufklapp-Pfeile drehen sich wieder, statt zu springen (`6bcf2e0`)
- Achsenbeschriftungen im Wertverlauf kleben nicht mehr am Rand (`f7552d9`)
- Ladeanzeige bleibt 200 statt 400 ms stehen (`aae0203`)
- Ladezustand und Zeitstempel halten Fehlschläge und Überlappung aus (`ba3a286`)
- Doppelten Health-Check beim Start verhindern (`8940d13`)
- Zielanteil vor Istanteil anzeigen (`264696c`)
- Zielanteil in Gruppenköpfen zuerst zeigen (`1f75154`)
- Gruppenaktionen und mobiles Delta verdichten (`3855bb7`)
- Mobile Positionen als einzelne Karten zeigen (`9a92abe`)
- keep amount unit selection open (`8ae20a6`)
- restore deleted cash accounts from add dialog (`4c51480`)
- compact link settings and prioritize ETFs (`fd52010`)
- translate newly added link labels (`c48f212`)
- space link confirmation and hide empty group summaries (`0a26ed0`)
- contain target markers and keep valuation labels readable (`4367acf`)
- Deutsche Link-Beschriftungen vereinheitlichen (`3b63788`)
- invalidate stale build markers before validation (`bbcb9e0`)
- Einheitlichen README-Vorschaupfad verwenden (`27705b1`)
- GitHub aus der Statuszeile erreichbar machen (`75cac67`)
- GitHub-Symbol wie in StockInfo vor dem Depot anzeigen (`d7244d9`)
- Relative Bandabweichung als Zahl anzeigen (`375550b`)
- Prozentanzeige und Vorzeichenfarben verfeinern (`ae8e83c`)
- Header kürzen und mit Erklärungen ergänzen (`45f532d`)
- relative Zahl von ausblendbarem Balken trennen (`179b5dc`)
- Simulationshinweis unter 1160 Pixeln ausblenden (`ba61838`)
- Kopf und Tabelle mit Mindestbreite gemeinsam scrollen (`8bc54ae`)
- originales Lucide-Mülleimer-Symbol verwenden (`7e07224`)
- API-Link direkt zum Status-Tab führen (`031d0e0`)

### Features

- Ausschnitt „Echt" zeigt nur die festgehaltenen Tageswerte (`ea9cd51`)
- Ladeanzeige beim Aktualisieren — global und je Position (`c1a8e8d`)
- Aktualisieren holt frische Kurse, Fortschritt wird sichtbar (`ed030df`)
- Aktualisieren lässt sich einstellen (`ec3ab83`)
- Fehlermeldungen sagen, wo die Adresse steht — und der Ausfall wird gemeldet (`4616cf0`)
- Identitäten und Kurse vor der Depotaufnahme prüfen (`2cbfbf0`)
- show catalog-defined instrument information (`71a4ff8`)
- support base currencies and exchange rates (`674b370`)
- Basiswährung auch bei bestehenden Depots wechseln (`983b33b`)
- Positionsdetails nach Aufgaben gliedern (`85af4c9`)
- Aktien und ETFs als getrennte Gruppen führen (`d38a8f5`)
- simplify navigation and show position notes (`9aa040f`)
- merge information and toggle history from sparklines (`ffc39f3`)
- show asset types and portfolio base currency (`52b6716`)
- distinguish asset types with subtle SVG icons (`1124b4b`)
- Typkatalog aus StockInfo gemeinsam verwenden (`2aac1e9`)
- prepare verified image and Docker Hub overview (`f70516e`)
- Plan leeren mit Mülleimer-Symbol ergänzen (`5e983a0`)
- Einstieg im leeren Depot ergänzen und Begriff vereinheitlichen (`ae64b14`)

### Documentation

- Währungsanfrage durch Ticket T-38 ablösen (`987894c`)
- Integrationsvertrag und Depotwährung konkretisieren (`6a14a5c`)
- Dynamische Detailanzeige zur Prüfung konkretisieren (`2e4c378`)
- Gemeinsame Vertragsprüfung zur Umsetzung planen (`23580b2`)
- Geprüfte Produktfassung an Claude übergeben (`4cb4dd0`)
- Umsetzung der dynamischen Detailanzeige planen (`9b6f7b3`)
- publish a dedicated Docker Hub guide (`8a8e77a`)
- keep template only in central repository (`9c1d6d1`)
- Git-Integration und offenen Image-Push festhalten (`b058682`)
- Dashboard-Screenshot in Hub-Anleitung einbinden (`7aef019`)
- Aktuellen Dashboard-Screenshot zeigen (`6ea0305`)
- Englische Anleitung mit wget-Installation ergänzen (`2d0ce6a`)
- Anleitung zentral pflegen (`9a1e122`)
- Apps als Standardinstallation beschreiben (`7e3c5af`)

### Other changes

- use compact navigation on mobile (`573d15b`)
- kurze Versionierungs-Targets verwenden (`adc36a1`)

## v0.2.0+260818.1954.3cf6a — 2026-08-18

Sicherung als eigener Reiter, kompakteres Dashboard

### Features

- Sichern und Wiederherstellen des Depots (`04d791f`)
- Freigabeliste der Assets mitsichern (`2a2c4ed`)
- Verwaltung mehrerer Depots (`18cb2ac`)
- Fremdwährungen ausschließen statt still falsch summieren (`84cc208`)
- Kursverlauf in Zeile und Detailansicht, Unraid-Template (`a0ab0dc`)
- Kursdiagramm mit Achsen und Zeiger (`c956458`)
- Sprachumschaltung DE/EN — und 150 feste Texte aufgeräumt (`ef2ce87`)
- Erklärung am Begriff und eine Seite zur Methode (`da79cfe`)
- Zeitraum der Verlaufslinie wählbar (`401bba0`)
- Mindest-Handelsvolumen und Kalender-Rebalancing (`d59a745`)
- Symbol und Name öffnen die Detailansicht, schmale Breiten geglättet (`db8c043`)
- Wertverlauf des Depots — Rückblick und Tageswerte (`f42c0c2`)
- drei Themes mit eigener Behandlung der Leisten, Verlauf im Backup (`56483de`)
- eigene Schriften — Inter für die Oberfläche, Space Grotesk für Titel (`bc398dd`)
- carbon und meadow — elf Themes, vier Behandlungen der Leisten (`767a2a8`)
- eigenes Zeichen und FavIcon — Wortmarke zweifarbig (`413d35a`)
- mangolila neu gefasst, amber und petrol dazu (`7117e23`)
- macOS-Theme in der Auswahl benennen (`ef10dae`)
- Sichern und Wiederherstellen als eigener Reiter (`2dc16a0`)

### Fixes

- Whitelist gehört zum Depot, nicht zur App (`d6086d6`)
- Meldungen erst nach dem Aufbau der Komponente auswerten (`8d1817a`)
- feste Texte außerhalb der Templates, Sprache als eigener Tab (`6cec925`)
- „Mehr dazu" ist jetzt ein Verweis, und Delta wird erklärt (`c208c0a`)
- API-Adresse ist Pflicht, keine eingebaute Rückfallebene (`f135652`)
- Inhaltsbreite an einer Stelle, Statuszeile entschlackt, Reiter-Balken (`33b3783`)
- Kennzahl „Datenlage" statt „Datenprobleme" (`a7958a6`)
- leise Textfarben in neun Themes auf 4,5:1 gebracht (`fafb043`)
- leere Ansicht im privaten Modus, Sprachwahl und Alter der Kurse (`60bb847`)
- Restzeit-Beschriftung nachziehen, Rebalancing über useAppNotification (`ff7ab1c`)
- Spaltenkopf steht wieder nur einmal, Ansicht wird kompakter (`bd56004`)

### Other changes

- tote Spalten-Flags entfernt (`8c30793`)
- Grundlage für scoped SCSS, erste neun Komponenten umgestellt (`7c53624`)
- sieben weitere Komponenten auf scoped SCSS, Marken-Token (`895b9b5`)
- geteilte SCSS-Mixins, sieben weitere Komponenten umgestellt (`fd8671e`)
- Umstellung auf scoped SCSS abgeschlossen, Tailwind entfernt (`88870e6`)
- Fundament aus @mikemitterer/ux-foundation beziehen (`3b5858f`)
- Komponenten aus dem Fundament statt eigener Kopien (`9bc1fda`)
- Menüpunkt aus dem Fundament statt eigener Kopie (`ea7e57b`)
- InfoHint kommt aus dem Fundament (`ddf344b`)
- Inline-Zahlen nehmen „nicht gesetzt" entgegen (`6f03e63`)
- Pfeile kommen aus dem Fundament statt dreimal von Hand (T-16) (`60316f0`)

### Documentation

- README auf Englisch, mit Screenshots und Docker-Anleitung (`2ea5e62`)
- T-26 abgeschlossen, README auf den Stand gebracht (`4171627`)
- Zählungen im Token-Kommentar auf dreizehn Themes (`0e81864`)

## v0.1.0+260810.2018.e0a6d — 2026-08-10

Release 0.1.0 — Tolerance-Band-Rebalancing als Web-App

### Documentation

- add rebalancing webapp design spec (`e193d16`)
- finale README, Roadmap-Stand und Spec-Status für 0.1.0 (`e45e35d`)

### Features

- Makefile mit Standard-Header + Setup-Script anlegen (`5422133`)
- Preview-Dashboard mit Mock-Portfolio, Delta-Balken und Drilldown (`28b3053`)
- StockInfo-Client anbinden — echte Kurse statt Mock-Preise (`ffba971`)
- Positionen editierbar und dauerhaft speichern (`1e8348f`)
- Positionen nach Assetklasse gruppieren + Feinschliff (`21cb7ff`)
- leeres Depot beim Erststart statt fremder Bestände (`79a18e6`)
- Katalog, Whitelist und Position hinzufügen (`9384267`)
- Ziel und Bestand in der Zeile ändern, Ziel-Summe absichern (`5de2ccb`)
- Aktien und ETFs unterscheiden, Verweise konfigurierbar (`f7cde55`)
- Assetklassen farblich kennzeichnen, Delta-Spalte halbieren (`c68d46c`)
- sechs wählbare Themes über ein Token-System (`df0bacc`)
- Leseansicht mit Karten unter 768 px (`ac92292`)
- Geldmarkt als eigene Assetklasse, Reserve neu berechnet (`9e9aa0a`)
- eigener Tab zum Planen von Käufen und Verkäufen (`dbb2352`)
- Delta bis zum Ziel statt Budget-Vorschlag (`5904e74`)
- Sicherheitspuffer wahlweise als Anteil oder Betrag (`1d6ad5d`)
- Deckungsvorschlag für Cash und Geldmarkt (`5281ee5`)
- Meldungen blenden sich nach einem Zähler aus (`70cf712`)
- Tabs, Theme-Auswahl, Assets statt Instrumente (`6e4a9b4`)
- Status-Seite für die StockInfo-API (`f59bf18`)
- Statuszeile am unteren Rand (`59476cd`)
- Multi-Stage-Image, nginx-Drop-in und build.sh (`1e395fd`)

### Fixes

- heller Streifen hinter den Gruppen-Kopfzeilen (`a06bdaa`)
- grauer Button-Hintergrund auf nackten \<button\>-Elementen (`79adecb`)
- Gattung bestehender Positionen nachtragen, Links in der Zeile (`fe5cf51`)
- Delta-Balken entwirren — Zahl neben den Balken (`28b3b41`)
- deaktivierte Positionen bleiben sichtbar (`a417452`)
- Tailwind-Preflight aktivieren statt Symptome einzeln zu flicken (`4fb1073`)
- dreifache Linie in der Mitte des Delta-Balkens (`cb6a8b5`)
- Rebalancing bedienbar machen, Trade-Simulator entfernen (`50ea5c8`)
- leeres Feld löscht den Trade, Deckung in den Kopf (`a427888`)

### Other changes

- Plan rechnet nur, bucht nicht (`9ae6a36`)
- Hash-Router, Debian-Basis, Konfiguration nur fürs Caching (`41177c9`)
