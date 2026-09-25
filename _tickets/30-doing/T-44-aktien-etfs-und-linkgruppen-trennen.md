# T-44 · Aktien und ETFs als eigene Gruppen führen

Im Dashboard teilen sich **Aktien und ETFs derzeit eine Gruppe**. Dadurch
lassen sich ihre Anteile und Zielwerte nicht getrennt ansehen. In den
Einstellungen lassen sich externe Verweise nur nach Instrumenttyp filtern;
die Depotgruppen stehen bei „Gilt für“ nicht zur Wahl.

**Beispiel:** Ein Aktien-ETF und eine einzelne Aktie erscheinen beide unter
„Aktien / ETFs“. Künftig kann der ETF unter „ETFs“ und die Aktie unter
„Aktien“ stehen. Ein Verweis kann gezielt für die Gruppe „Anleihen“ gelten,
auch wenn das betreffende Papier technisch ein ETF ist.

**Zusätzlicher UI-Befund von Mike, 2026-09-25:** Im gezeigten Dashboard sind
die Zahlen der Cash-Gruppenzeile gegenüber den Zeilen darüber nach rechts
versetzt. Die Gruppenköpfe sollen ihre Werte in bündigen Spalten zeigen.

**Stand:** Mike hat beide Änderungen am 2026-09-25 beauftragt und dieses
Ticket ausdrücklich direkt für `30-doing/` verlangt. Die Umsetzung ist offen.
T-43 bleibt laut [`STATUS.md`](../STATUS.md) der aktive Auftrag; dieses Ticket
folgt danach in der Prioritätskette. Diese Einordnung ändert weder Rollen
noch Owner oder das aktuelle Prioritätsticket und startet keine parallele
Implementierung.

Für Mike ist vor der Umsetzung keine weitere Entscheidung nötig. Nach einer
technischen Prüfung bleibt die Bedien- und Abschlussabnahme offen.

## Für dich

Nach der technischen Freigabe im Dashboard ein Depot mit Aktie, Aktien-ETF
und Anleihe-ETF öffnen. Prüfen, ob Aktien und ETFs getrennt erscheinen und
ein Anleihe-ETF weiterhin sinnvoll unter „Anleihen“ stehen kann. In
„Einstellungen → Verweise“ einen Link auf eine Gruppe begrenzen und prüfen,
ob er nur bei passenden Positionen angeboten wird. Testadresse und geprüfte
Fassung werden vor dieser Aufgabe ergänzt; ein Testserver wird hier noch
nicht behauptet.

Dein Urteil: Sind die Gruppen und die Link-Auswahl für dein Depot verständlich?
Die Antwort bleibt offen und wird nicht aus technischen Tests abgeleitet.

## Umsetzung und technische Nachweise

| Repo | Umfang | Fremddienst |
|---|---|---|
| StockPortfolio | Gruppenmodell, Zuordnung, Rebalancing-Anzeige, Verweisfilter, Tests und betroffene Dokumentation | StockInfo unverändert |

### Gewünschtes Verhalten

Die Depotgruppen heißen **Aktien, ETFs, Anleihen, Edelmetalle, Geldmarkt und
Cash**. Sie erscheinen im Dashboard und bei der Bearbeitung einer Position.
Der Vorschlag beim Hinzufügen verwendet den Instrumenttyp: Eine Aktie wird
„Aktien“, ein Aktien-ETF „ETFs“ vorgeschlagen. Hinweise auf Anleihen,
Geldmarkt oder Metalle behalten Vorrang; der Nutzer kann die Gruppe wie bisher
selbst wählen. Ein Anleihe-ETF muss daher nicht zwangsweise in „ETFs“ landen.

Die getrennten Gruppen fließen in Gruppenwerte, Zielanteile und die
Rebalancing-Anzeige ein. Gesamtwert, Einzelpositionen und die Behandlung von
Geldmarkt und Cash bleiben fachlich gleich. Bestehende Positionen mit Gruppe
`stocks` und bekanntem ETF-Typ dürfen nicht still weiter als Aktie erscheinen;
eine einfache Übernahme in `etfs` ist zu prüfen. Bewusst gewählte andere
Gruppen bleiben erhalten. Falls Entwicklungsdaten zurückgesetzt werden müssen,
ist der Reset nach den Projektregeln ausdrücklich zu beschreiben.

Die Gruppenzeilen im Dashboard richten Marktwert, Ist-/Zielanteil, Abweichung
und Status an denselben Spalten aus. Insbesondere darf die kurze Zahl in der
Cash-Zeile den Marktwert nicht gegenüber Aktien, Edelmetallen und Geldmarkt
verschieben. Die Ausrichtung gilt auch nach der Trennung von Aktien und ETFs
und bei unterschiedlich langen übersetzten Gruppennamen. Die bestehenden
Spaltenbreiten werden gemeinsam festgelegt statt mit Sonderabständen für Cash.

In „Einstellungen → Verweise“ sind dieselben Depotgruppen als Filter wählbar,
einschließlich Cash. Eine leere Gruppenauswahl bedeutet „alle Gruppen“.
Der vorhandene Filter nach Instrumenttyp (`stock` oder `etf`) bleibt nutzbar;
wenn beide Filter gesetzt sind, muss ein Link beide Bedingungen erfüllen.
Ein Gruppenfilter funktioniert auch bei Cash, obwohl Cash keinen
Instrumenttyp hat. Fehlende Platzhalterwerte und deaktivierte Verweise werden
weiterhin wie bisher behandelt.

**DRY:** Gruppenschlüssel und ihre Reihenfolge werden zentral definiert und
von Dashboard, Positionsformular, Einstellungen, Berechnung und
Bestandsdatenprüfung gemeinsam verwendet. Kontextabhängige Optionen, etwa
Cash nicht beim Hinzufügen eines Wertpapiers, werden daraus abgeleitet.
Keine neue, handgepflegte Gruppenliste je Komponente. Die neue Gruppe braucht
eine verständliche Beschriftung in Deutsch und Englisch sowie eine
unterscheidbare Darstellung. Falls dafür neue Theme-Token nötig sind, gehören
sie nach `ux-foundation` und nicht als lokale Kopie in diese App.

### Verify

Legende: ✅ live bestätigt · ⚠️ mit Einschränkung · ◑ teilweise ·
➖ keine Live-Verifikation. Alle Zeilen sind vor der Umsetzung offen.

| # | Handgriff | Erwarteter Nachweis | AI |
|---|---|---|:--:|
| 1 | Aktie, Aktien-ETF und Anleihe-ETF hinzufügen oder ihre Gruppe ändern | Aktien und ETFs sind getrennt wählbar; der Vorschlag nutzt Typ und Namenshinweise, eine manuelle Wahl bleibt möglich | ➖ |
| 2 | Dashboard und Rebalancing mit beiden Gruppen öffnen | Gruppenwerte und Ziele sind getrennt, Gesamtsumme und Liquiditätsregeln bleiben korrekt | ➖ |
| 3 | Bestehenden Bestand und Backup mit ETF in `stocks` laden | ETF-Zuordnung ist nachvollziehbar; andere bewusst gewählte Gruppen und Positionswerte bleiben erhalten oder ein nötiger Reset ist offen benannt | ➖ |
| 4 | Verweis auf eine Depotgruppe begrenzen, danach mit Instrumenttyp kombinieren | Link erscheint nur bei passenden Positionen; leere Auswahl gilt für alle und Cash funktioniert ohne Instrumenttyp | ➖ |
| 5 | Gruppenoptionen in Dashboard, Positionsformular und Verweis-Einstellungen vergleichen | Dieselben zentralen Schlüssel, Reihenfolge und Übersetzungen werden verwendet; begründete Kontextfilter sind sichtbar | ➖ |
| 6 | Gruppenköpfe mit kurzen und langen Werten bei Desktopbreite vergleichen | Marktwert, Anteile, Abweichung und Status stehen bei Cash und den übrigen Gruppen bündig untereinander | ➖ |
| 7 | `make test`, `make lint`, `make typecheck` ausführen und Doku-Abgleich durchführen | Prüfungen bestehen; `README.md` und weitere aktuelle Anleitungen beschreiben sechs Gruppen und die Verweisfilter korrekt | ➖ |

Der Implementer ergänzt konkrete Testumgebung, Belege, einschlägige Lessons
und den Doku-Abgleich vor einer Übergabe. Ein unabhängiger Review beginnt
erst mit einer gültigen Übergabe nach `STATUS.md`. Neue bestätigte Befunde
werden nach dem aktuellen Ticket-Skill im selben fachlichen Durchlauf für
die Lessons eingeordnet; der lokale Konventionsnachtrag ist noch offen.

**Doku-Abgleich bei Ticketerstellung:** [`README.md`](../../README.md)
beschreibt unter „Five asset classes“ den derzeit gültigen Stand mit fünf
Gruppen; der Text bleibt bis zur Umsetzung richtig und wird dann angepasst.
Die historische Design-Spec unter `docs/superpowers/specs/` ist kein aktueller
Bedienhinweis. Die Unraid-Anleitung enthält keine Gruppenaussage. Weitere
aktuelle Stellen und die Link-Bedienhilfe werden bei der Umsetzung geprüft;
geplantes Verhalten wird bis dahin nicht als verfügbar beschrieben.

### Abgrenzung

StockInfo liefert weiterhin Instrumenttyp und Kurse; dieses Ticket verlangt
keine neue API-Route. Neue Gruppenkategorien außer der Trennung von Aktien
und ETFs, eine Neugestaltung der gesamten Settings und eine aufwendige
Migration früherer Entwicklungsstände gehören nicht zum Auftrag.

### Auflösung

Offen. Technische Freigabe und Mikes Abschlussentscheidung werden getrennt
dokumentiert.
