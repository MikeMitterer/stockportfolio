# StockPortfolio – Benutzerhandbuch

Dieses Handbuch erklärt, wie StockPortfolio rechnet und wie die einzelnen
Seiten funktionieren. Installation und Betrieb stehen im
[Docker-Guide](../docker/README.md), die Entwicklung in
[development.md](development.md).

## Inhalt

- [Rebalancing-Methode](#rebalancing-methode)
- [Dashboard](#dashboard)
- [Positionen hinzufügen](#positionen-hinzufügen)
- [Positionsdetails](#positionsdetails)
- [Sechs Depotgruppen](#sechs-depotgruppen)
- [Sicherheitspuffer und Investitionsreserve](#sicherheitspuffer-und-investitionsreserve)
- [Rebalancing-Simulation](#rebalancing-simulation)
- [Wertverlauf und Kursverlauf](#wertverlauf-und-kursverlauf)
- [Basiswährung und Wechselkurse](#basiswährung-und-wechselkurse)
- [Mehrere Depots](#mehrere-depots)
- [Konten, Anmeldung und Live-Abgleich](#konten-anmeldung-und-live-abgleich)
- [Backup und Wiederherstellung](#backup-und-wiederherstellung)
- [Links zu externen Seiten](#links-zu-externen-seiten)
- [Sprache, Themes und Mobilansicht](#sprache-themes-und-mobilansicht)
- [Noch nicht vorhanden](#noch-nicht-vorhanden)

## Rebalancing-Methode

Du legst für jede Position einen Zielanteil fest und wählst unter
_Einstellungen → Berechnung_, wann umgeschichtet wird:

| Auslöser | Bedeutung |
|---|---|
| Toleranzbänder | Handeln, sobald eine Position ihr Band verlässt. |
| Fester Termin | Am Fälligkeitstag bei jeder Abweichung vom Ziel handeln. |
| Bänder und Termin | Bänder laufend prüfen, kleinere Abweichungen am Termin. |

Bänder sind **relativ zum Ziel**: Ein Ziel von 10 % mit einem unteren Band von
6 % löst bei 9,4 % aus. Unteres und oberes Band sind getrennt einstellbar. Der
Termin rechnet mit einem Intervall in Monaten ab dem letzten Rebalancing-Datum
des Depots. Dieses Datum trägst du selbst ein, nachdem du die Aufträge bei
deiner Bank erteilt hast.

Jede Position zeigt ihre Abweichung in Stück. Eine optionale
**Mindest-Handelsvolumen** blendet kleine Beträge aus, die Abweichung bleibt aber
sichtbar. Die Grenze ist ein fester Betrag in der Depotwährung oder ein
Prozentsatz; Standard ist null (aus). Puffer und Mindest-Handelsvolumen gehören
zum aktiven Depot.

Kauf- und Verkaufsbeträge sind reine Rechenergebnisse gegen **deine eigenen**
Ziele. Die App prüft nicht, ob ein Kauf zu dir passt, und erteilt keine
Aufträge. Der Hinweis dazu steht unter den Tabellen, auf der Anmeldeseite und
unter _About_. Bei jeder Anmeldung bestätigst du ihn mit „Ich habe den Hinweis
gelesen“; die Bestätigung gilt nur für diese Anmeldung.

Fragezeichen-Tooltips erklären die Methode und verlinken auf die passende
Einstellung oder die Referenzseite _Die Methode_.

## Dashboard

Oben stehen die Depotgruppen, darunter die Positionen. Bestand und Ziel
lassen sich direkt in der Tabelle oder im Positionsdialog ändern. Pfeile
markieren Positionen unter (↓) oder über (↑) ihrem Band. Neben dem Gesamtwert
steht die Basiswährung des Depots.

Die Spalte **Position** zeigt Ticker und ISIN, getrennt durch einen senkrechten
Strich, wenn StockInfo beide liefert. Bei Instrumenten nur mit ISIN erscheint
die ISIN, ohne einen Ticker zu erfinden. Kennungen kommen von StockInfo und
sind hier nicht editierbar. Ein kleines Symbol neben dem Namen zeigt die
Gattung; Hover oder Fokus nennt den genauen Typ aus StockInfo.

Die beiden Symbole neben der Überschrift schließen oder öffnen alle Gruppen (**Alle Gruppen schließen**, **Alle Gruppen öffnen**).
Die Wahl bleibt für den nächsten Besuch erhalten. Das Aktualisieren-Symbol
neben dem Kursalter lädt den Kurs einer einzelnen Position neu.

Ein leeres Depot bietet „Position hinzufügen“, „Beispiel-Depot laden“
und **Backup einspielen …**.

## Positionen hinzufügen

Beim Hinzufügen ruft die App zuerst den Kurs ab und prüft ihn. Ist das Symbol
mehrdeutig oder fehlt ein gültiger Preis oder eine Kurswährung, nennt der
Dialog den Grund, und das Wertpapier kommt nicht ins Depot. Ein Preis, der
nur im Instrumentenkatalog steht, reicht nicht.

Scheitert später eine Aktualisierung, bleibt die Position sichtbar. Ihr letzter
gültiger Preis wird als veraltet markiert und darf weiter verwendet werden.
Ohne gültigen Preis fällt die Position aus Berechnung und Handelsbeträgen
heraus.

Hast du das Verrechnungskonto gelöscht, legt **Position hinzufügen → Verrechnungskonto** es
neu an: Saldo in der Depotwährung und Zielanteil eingeben. Cash braucht
keinen Kurs von StockInfo. Die Option erscheint nur, solange das Depot kein
Verrechnungskonto hat.

## Positionsdetails

Ein Klick auf eine Position öffnet ihre Details mit drei Bereichen:

- **Kursverlauf** – großes Diagramm mit Preis links und prozentualer
  Veränderung rechts, Zeitraum von einem Monat bis „max“. Hover zeigt Datum,
  Preis und Veränderung des Tages.
- **Bewertung** – Marktwert, Ziel und Bänder. Die Stückabweichung wird ganzzahlig
  angezeigt; gerechnet wird mit voller Genauigkeit. Das Stiftsymbol öffnet den
  Bearbeitungsdialog. **Löschen** fragt nach.
- **Informationen** – die Felder, die StockInfo für das Instrument liefert, etwa
  TER, Fondsgröße, Anbieter und Volatilität. Jeder Wert zeigt Herkunft
  (Anbieter oder manuell) und Datum. Eine manuell eingetragene Fondsgröße behält
  ihre Währung.

Bezeichnungen, Einheiten und Gültigkeit der Felder kommen aus StockInfos
Feldkatalog. Ist der Katalog nicht erreichbar, bleiben Kurse und
Grundinformationen nutzbar. Ältere zwischengespeicherte Kurse ohne Details
sind als „noch nicht geladen“ markiert; ein Neuladen des Kurses holt sie.
Felder, die schon in einer Hauptspalte stehen, werden nicht wiederholt. Bereiche
ohne Inhalt sind ausgeblendet.

Gespeicherte Notizen zur Position erscheinen unter der Werkzeugleiste. Cash
öffnet direkt mit **Bewertung**.

## Sechs Depotgruppen

`ETFs`, `Aktien`, `Anleihen`, `Edelmetalle`, `Geldmarkt`, `Cash`.

Die Gruppe wird aus Typ und Name des Wertpapiers vorgeschlagen und lässt sich
beim Hinzufügen und Bearbeiten ändern. Ein Anleihen-ETF kann so unter
`Anleihen` bleiben.

Geldmarkt steht bewusst getrennt von den übrigen Anleihen. Anleihen mit
Laufzeit schwanken, Geldmarktinstrumente kaum. Zusammen mit Cash sind sie das,
woraus ein Kauf bezahlt werden kann.

Gruppen, deren Ist- und Zielanteil beide null sind, blendet die Übersicht aus.
Eine Gruppe mit Zielanteil bleibt auch ohne Bestand sichtbar.

## Sicherheitspuffer und Investitionsreserve

```text
Investitionsreserve = (Geldmarkt + Cash) − Sicherheitspuffer
```

Der Puffer ist Geld, das nie investiert werden soll – als fester Betrag oder
Prozentsatz, Standard null. Die Reserve ist eine Information und löst keine
Investition aus.

## Rebalancing-Simulation

Unter _Rebalancing_ gibst du Stückzahlen und probeweise Zielanteile ein und
siehst Kosten, resultierende Anteile und Bänder. Vorgeschlagene Trades aus der
Delta-Spalte lassen sich übernehmen. Reicht das Geld nicht, bietet
_Decken aus_ liquide Positionen an.

**Es wird nichts gebucht.** Aufträge erteilst du bei deiner Bank und trägst
danach die Bestände im Dashboard nach.

Balken und Spalte _Rel. %_ zeigen die relative Abweichung vom Ziel nach dem
geplanten Trade. Der resultierende Anteil steht unter dem Balken, die Spalte
_Abw. Ziel_ zeigt die Differenz in Prozentpunkten. Positive relative Werte
sind grün, negative rot. Bei einem Ziel von null ist die relative Abweichung
nicht definiert. Die gepunkteten Spaltenköpfe erklären die Begriffe beim
Darüberfahren.

Auf schmalen Bildschirmen verschwinden zuerst der Balken (unter 1280 px), dann
der Simulationshinweis (unter 1160 px). Unter 890 px scrollen Zusammenfassung
und Tabelle gemeinsam waagrecht, auch per Tastatur.

## Wertverlauf und Kursverlauf

Ein Klick auf die 90-Tage-Linie in der Gesamtwert-Kachel öffnet den
**Wertverlauf**. Die durchgezogene Linie enthält die aufgezeichneten
Tageswerte des Depots, einschließlich Bestandsänderungen. Die
gestrichelte Rückschau bewertet die **heutigen Bestände** zu früheren Kursen;
sie ist keine historische Wertentwicklung. Die Aufzeichnung beginnt, sobald du
die App nutzt. Tageswerte sind Teil des Backups.

Die kleine Linie in jeder Zeile zeigt, ob der Kurs von oben oder von unten
kommt. Ihren Zeitraum (ein Monat, eine Woche oder ein Tag) wählst du unter
_Einstellungen → Daten_. „Ein Tag“ zeigt keine Linie, sondern die Veränderung
seit dem letzten Handelstag. Tagesschlusskurse werden im Browser
zwischengespeichert und höchstens einmal täglich je Wertpapier abgerufen.

## Basiswährung und Wechselkurse

Jedes Depot hat eine eigene Währung, einstellbar unter
_Einstellungen → Daten → Depots_. Neue Depots starten mit EUR; USD, CAD
und weitere ISO-Währungen stehen zur Wahl. Die Statusleiste zeigt den Code
neben dem Depotnamen.

Cash, Sicherheitspuffer und Mindest-Handelsvolumen gehören zum Depot und
verwenden seine Währung. Wechselst du die Währung, nennt eine Bestätigung den
verwendeten Kurs für Cash und absolute Grenzen; Bestände und prozentuale
Grenzen bleiben unverändert. Ohne gültigen Kurs bleibt alles beim Alten.

Fremdwährungskurse werden mit StockInfo-Wechselkursen umgerechnet, bevor
Summen, Anteile, Bänder und Trades entstehen. Bei 0,8 EUR je USD wird aus einer
Position von 100 $ ein Wert von 80 €. Pence-Kurse (`GBp`) werden zuerst durch
100 in GBP geteilt. Originalkurse behalten ihre eigene Währung.

- **Veralteter Wechselkurs:** bleibt nutzbar, mit dauerhafter Warnung samt
  Währungspaar und Datum.
- **Kein gültiger Wechselkurs:** Die Position bleibt sichtbar, fällt aber aus
  Summen und Trades heraus. Unvollständige Bewertungen überschreiben keine
  Tageswerte.
- **Historische Rückschau:** Wo historische Wechselkurse nötig wären, ist sie
  mit Erklärung ausgeblendet, weil StockInfo keine liefert.

Die Kurswährung sagt nichts über das Währungsrisiko: Ein in Euro notierter
MSCI World hält trotzdem Werte in anderen Währungen. Dieses Risiko berechnet
die App nicht.

## Mehrere Depots

Unter _Einstellungen → Daten_ legst du Depots an, benennst sie um,
wechselst und löschst sie – etwa eines für die Kinder oder eine Variante zum
Durchspielen. Berechnet wird immer nur das aktive; sein Name steht in der
Statusleiste.

Zu einem Depot gehören Bestände, Ziele, die **Asset-Auswahl**, das Datum
des letzten Rebalancings, Basiswährung, Sicherheitspuffer und
Mindest-Handelsvolumen. Allgemeine Berechnungsvorgaben und das Aussehen gelten
für alle Depots.

## Konten, Anmeldung und Live-Abgleich

Konten, Sitzungen, Depots, Einstellungen und Tageswerte liegen in der
SQLite-Datenbank des Servers unter `/data`. Jedes Konto hat eigene Daten, auch
weitere Admin-Konten. Admins verwalten Konten über das Personensymbol in der
Kopfleiste, können aber die Depots anderer Konten nicht öffnen. StockInfo
liefert nur Kurse und Stammdaten und erfährt nichts über Bestände.

Neue Passwörter brauchen 12 bis 1024 Zeichen mit Großbuchstabe, Ziffer und
Sonderzeichen. Ein neues Konto startet mit einem leeren Depot.

Was daraus folgt:

- Dasselbe Konto findet seine Depots nach der Anmeldung in jedem Browser
  und auf jedem Gerät.
- Offene Browser desselben Kontos gleichen sich ohne Neuladen ab. Aktualisiert
  ein Browser die Kurse oder spielt ein Backup ein, ziehen die
  anderen nach. Fällt die Live-Verbindung aus, warnt die Statusleiste, und die
  App fragt alle 30 Sekunden beim Server nach.
- Gleichzeitige Änderungen aus zwei Browsern erzeugen einen Konflikt, statt
  still zu überschreiben.
- Ist der Server nicht erreichbar, lassen sich Änderungen nicht speichern.
- Das Löschen der Browserdaten entfernt nur Kurs-Zwischenspeicher und
  Browser-Vorlieben; die Depots auf dem Server bleiben.

**Alte Browserdaten:** Depots aus der Zeit vor den Konten liegen noch in der
IndexedDB des alten Browserprofils. Nur das ursprüngliche Einrichtungskonto
kann sie dort einmal ansehen und mit Bestätigung übernehmen. Weitere alte
Browserprofile bieten danach je Depot einen Dateiexport an, den du über
die normale Wiederherstellung einspielst.

## Backup und Wiederherstellung

_Einstellungen → Backup_ exportiert das **aktive** Depot als JSON-Datei:
Bestände, Einstellungen und die Liste ausgeblendeter Assets, einschließlich
aller Währungsreihen der Tageswerte. Kurse sind nicht enthalten, die App holt
sie ohnehin neu.

Beim Wiederherstellen wird die Datei geprüft und ihr Inhalt zuerst angezeigt.
Nichts wird ohne Bestätigung überschrieben. Der Server übernimmt die
bestätigte Wiederherstellung in einem Schritt. Ältere Backups mit der
früheren Gruppe `Aktien / ETFs` ordnen ETFs dabei einmalig nach `ETFs` um.

## Links zu externen Seiten

Unter _Einstellungen → Links_ legst du Links zu externen Seiten an, etwa einem
Fondsporträt. Ein Link lässt sich auf Gattungen und unabhängig davon auf
Depotgruppen beschränken, auch auf `Cash`. Eine leere Auswahl bedeutet
„alle“; sind beide Filter gesetzt, muss eine Position beide erfüllen. Links,
die eine ISIN brauchen, stehen bei Positionen ohne ISIN nicht zur Verfügung.

Die Gattungen kommen aus StockInfos Katalog und werden beim Öffnen des Reiters
geladen; **Typen neu laden** frischt sie auf. Neue Gattungen erscheinen ohne
StockPortfolio-Update. Ist der Katalog unvollständig oder nicht erreichbar,
steht ein Hinweis neben dem Editor; bestehende Filter bleiben erhalten.

## Sprache, Themes und Mobilansicht

**Sprache:** Deutsch und Englisch, umschaltbar unter
_Einstellungen → Sprache_. Die Wahl gilt für Beschriftungen, Zahlen und Datum
gemeinsam. Ohne eigene Wahl entscheidet die Browsersprache; alles außer
Deutsch ergibt Englisch.

**Themes:** Elf Themes unter _Einstellungen → Theme_, hell und dunkel. Ohne
eigene Wahl entscheidet die Systemeinstellung zwischen MangoLila und Paper.
Die Schriften sind eingebaut; es geht keine Anfrage an Google.

**Mobil:** Das Dashboard ist eine **Leseansicht** mit Grundzahlen, Delta und
Status. Positionen erscheinen als Karten unter ihrer Gruppe; ein Tippen öffnet
Kursverlauf, Bewertung und Informationen. Bearbeiten ist auf der Karte nicht
möglich. Rebalancing behält die Tabelle und scrollt waagrecht; zum Eintragen
von Trades ist ein breiteres Fenster praktischer. Die Einstellungen nutzen
unter 768 px eine Bereichsauswahl.

## Noch nicht vorhanden

| Thema | Stand |
|---|---|
| Historische Rückschau mit Wechselkursen | nicht verfügbar – aktuelle Kurse ersetzen keine historischen |
| Benachrichtigung bei Schwellen | bewusst nicht Teil der ersten Fassung |
| Aufräumen des Kursverlauf-Zwischenspeichers | offen – er wächst nur |
