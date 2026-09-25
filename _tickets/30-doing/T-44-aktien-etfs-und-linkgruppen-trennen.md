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
In der mobilen Navigation soll das Rebalancing-Symbol entfallen; der
Menüpunkt bleibt erreichbar und verständlich beschriftet.

**Stand:** Mike hat die Änderungen am 2026-09-25 beauftragt und dieses Ticket
ausdrücklich direkt für `30-doing/` verlangt. Nach Mikes Abnahme von T-43 ist
T-44 laut [`STATUS.md`](../STATUS.md) der aktive Auftrag. Codex hat die
Gruppentrennung, Verweisfilter und den mobilen Menüwunsch in `d38a8f5`
umgesetzt und selbst geprüft. Claude hat die Fassung in Runde 1 technisch
freigegeben; Mikes Bedien- und Abschlussentscheidung steht aus.

Für Mike ist die Bedien- und Abschlussabnahme jetzt offen. Eine weitere
Entwurfsentscheidung vor der Umsetzung ist nicht mehr nötig.

## Für dich

Nach der technischen Freigabe im Dashboard ein Depot mit Aktie, Aktien-ETF
und Anleihe-ETF öffnen. Prüfen, ob Aktien und ETFs getrennt erscheinen und
ein Anleihe-ETF weiterhin sinnvoll unter „Anleihen“ stehen kann. In
„Einstellungen → Verweise“ einen Link auf eine Gruppe begrenzen und prüfen,
ob er nur bei passenden Positionen angeboten wird. Für eine wiederholbare
Probe das [Browser-Testdepot](../../tests/fixtures/browser/README.md) gegen
`http://127.0.0.1:8899` laden; die Anleitung nennt die Startbefehle. Die
Übergabefassung: `d38a8f523899f506fc66428f626a042039a50528`.

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

Das Rebalancing-Symbol im mobilen Menü wird ausgeblendet. Der Menütext und
die Navigation bleiben erhalten; Desktop bleibt unverändert.

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
| 1 | Aktie, Aktien-ETF und Anleihe-ETF hinzufügen oder ihre Gruppe ändern | Aktien und ETFs sind getrennt wählbar; der Vorschlag nutzt Typ und Namenshinweise, eine manuelle Wahl bleibt möglich | ✅ |
| 2 | Dashboard und Rebalancing mit beiden Gruppen öffnen | Gruppenwerte und Ziele sind getrennt, Gesamtsumme und Liquiditätsregeln bleiben korrekt | ✅ |
| 3 | Bestehenden Bestand und Backup mit ETF in `stocks` laden | ETF-Zuordnung ist nachvollziehbar; andere bewusst gewählte Gruppen und Positionswerte bleiben erhalten oder ein nötiger Reset ist offen benannt | ✅ |
| 4 | Verweis auf eine Depotgruppe begrenzen, danach mit Instrumenttyp kombinieren | Link erscheint nur bei passenden Positionen; leere Auswahl gilt für alle und Cash funktioniert ohne Instrumenttyp | ✅ |
| 5 | Gruppenoptionen in Dashboard, Positionsformular und Verweis-Einstellungen vergleichen | Dieselben zentralen Schlüssel, Reihenfolge und Übersetzungen werden verwendet; begründete Kontextfilter sind sichtbar | ✅ |
| 6 | Gruppenköpfe mit kurzen und langen Werten bei Desktopbreite vergleichen | Marktwert, Anteile, Abweichung und Status stehen bei Cash und den übrigen Gruppen bündig untereinander | ✅ |
| 7 | `make test`, `make lint`, `make typecheck` ausführen und Doku-Abgleich durchführen | Prüfungen bestehen; `README.md` und weitere aktuelle Anleitungen beschreiben sechs Gruppen und die Verweisfilter korrekt | ✅ |
| 8 | Mobiles Menü öffnen und Rebalancing anwählen | Kein Rebalancing-Symbol; Menütext und Navigation bleiben nutzbar | ✅ |

### Implementer-Belege · 2026-09-25

- **1, 5:** `ASSET_GROUPS` in `src/types/portfolio.ts` liefert Schlüssel und
  Reihenfolge für Berechnung, Backup-Prüfung und alle drei Auswahllisten.
  Browser: Aktien und ETFs im Dashboard getrennt; Hinzufügen und Bearbeiten
  bieten fünf Wertpapiergruppen ohne Cash. `suggestAssetGroup` setzt `etf` auf
  ETFs, `stock` auf Aktien; Namenshinweise für Geldmarkt, Anleihen und Metalle
  haben Vorrang. Im Browser wurde ein ETF manuell nach Anleihen verschoben.
- **2:** Browser-Testdepot mit fünf Positionen und vollständigen Kursen:
  Aktien € 720, ETFs € 2.710, Anleihen € 995, Cash € 500, Gesamtwert € 5.000.
  Nach manueller Umgruppierung blieb der Gesamtwert € 5.000; Dashboard und
  Rebalancing führten den ETF unter Anleihen. Geldmarkt + Cash blieben
  Investitionsreserve; der bestehende Rechenregeltest lief mit.
- **3:** `upgradeAssetGroups` verschiebt nur alte `stocks`-Positionen mit
  bekanntem `kind: etf` einmalig nach `etfs`. Die gespeicherte
  `assetGroupVersion: 2` erhält danach bewusste Gruppenwahlen auch über Neustart
  und Backup. Andere Gruppen, Stückzahlen und Ziele bleiben erhalten.
  `tests/stores/portfolio.spec.ts` prüft IndexedDB-Neustart; Backup-Roundtrip
  und reine Migrationsprobe prüfen die weiteren Wege. Kein Reset nötig.
- **4:** Browser: Der `extraETF`-Link mit Typ ETF und Gruppe Anleihen
  verschwand bei ETFs und erschien nach manueller Umgruppierung unter
  Anleihen. `tests/domain/links.spec.ts` prüft zusätzlich die Schnittmenge,
  leere Auswahl, deaktivierte Links, fehlende ISIN und Cash ohne Typ mit
  einer URL ohne ISIN-Platzhalter.
- **6:** Chrome bei 1440 px: Die vier Zahlenzellen der Kopfzeilen Aktien,
  ETFs, Anleihen und Cash begannen jeweils bei x = 955, 1091, 1203 und 1307 px.
  Das CSS verwendet dafür gemeinsame Grid-Spalten. Keine Cash-Sonderregel.
- **8:** Chrome bei emulierten 390 × 844 px: Rebalancing-Symbol `display: none`,
  Beschriftung sichtbar; Klick öffnete `/#/rebalancing`. Kein horizontaler
  Dokumentüberlauf (`scrollWidth = innerWidth = 390`).
- **7:** `make test`: 734 Tests in 55 Dateien; `make lint`, `make typecheck`
  und `make build` erfolgreich. Der Build meldet nur den bestehenden Hinweis
  zur Größe des UI-Vendor-Chunks. Die Browserprobe nutzte den lokalen
  StockInfo-Testserver auf Port 8899 und die isolierte Browser-Sitzung
  `stockportfolio-t44-check`. Der Testserver wurde um eine gültige AAPL-Antwort
  erweitert; die dauerhaft abgelegte Sicherung enthält damit einen
  Aktienbestand und bleibt für spätere Sitzungen nutzbar.

**Lessons-Abgleich:** SP-CX-02 (aktuelle Aussagen nach Entscheidungen
nachziehen) wurde beim Abschluss von T-43 nach einem Observer-Hinweis erneut
angewandt; Einstieg und Abschlussentscheidung wurden angeglichen. SP-CX-04
bestätigt die dauerhafte Ablage des Browser-Testdepots unter `tests/fixtures/`
und des gemeinsam genutzten Testservers unter `scripts/`. Der Hinweis ist ein
Fall der vorhandenen Regeln; keine neue lokale Lesson nötig. Die allgemeine
Board-Übernahme von `2026-09-11-activity-feed` auf den Skillstand
`2026-09-11-lessons-follow-through` bleibt für Mike oder eine eigens
beauftragte Board-Instanz offen; T-44 ändert die Board-Konvention nicht.

**Doku-Abgleich:** `README.md` (Gruppen und Verweisfilter) beschreibt sechs
Gruppen, die einmalige ETF-Übernahme und die beiden unabhängigen Filter.
`tests/fixtures/browser/README.md` und die wiederverwendbare Sicherung wurden
auf fünf valide Positionen erweitert. Die Hilfe in `src/i18n/de.ts` und
`src/i18n/en.ts` nennt sechs Depotgruppen und die Filterlogik. Die Unraid-
Anleitung enthält keine Gruppenaussage; die historische Superpowers-Spec
bleibt als Entstehungsnachweis unverändert. Datei- und Überschrifteninventar
der aktuellen Anleitungen sowie gezielte Suche nach der alten Fünfer-Aussage
ergaben keine weitere aktuelle Stelle.

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

### Reviewer-Prüfung (Claude, Runde 1, Fassung `d38a8f5`)

**Technische Freigabe.** `make test` (55 Dateien, 734 Tests), `make lint` und
`make typecheck` selbst gegen die Übergabefassung ausgeführt — alle drei ohne
Befund, deckt sich mit der Codex-Angabe. Seit dem Handoff-Commit betraf der
Folgecommit ausschließlich Ticket-Dateien; der Produktstand war während der
Prüfung stabil.

Diff `9a92abe..d38a8f5` gelesen. `ASSET_GROUPS`/`AssetGroup` in
`types/portfolio.ts` ist die einzige Quelle für Schlüssel und Reihenfolge;
Dashboard, `AddPositionDialog.vue`, `ExternalLinkEditor.vue` und
`backup.ts` leiten ihre Optionen bzw. Validierung daraus ab — keine
lokale Zweitliste gefunden. `upgradeAssetGroups` in `domain/assetGroup.ts`
verschiebt ausschließlich `group: 'stocks'` mit `kind: 'etf'` nach `etfs`,
ist über `assetGroupVersion: 2` idempotent und wird in `load()`,
`replacePortfolio()` und beim asynchronen Kind-Update in
`stores/portfolio.ts` konsistent angewendet; `tests/stores/portfolio.spec.ts`
prüft den Zwei-Neustart-Fall (Migration, danach bewusste manuelle Rückstufung
bleibt über einen echten IndexedDB-Neustart erhalten) end-to-end. Der
Link-Gruppenfilter in `domain/links.ts` kombiniert Typ- und Gruppenfilter
als UND-Verknüpfung; `tests/domain/links.spec.ts` deckt leere Auswahl, Cash
ohne Typ und die Kombination beider Filter ab.

Live im Browser mit einer aktualisierten Fassung des Testdepots (jetzt mit
AAPL-Aktie) nachvollzogen: Dashboard zeigt sechs Depotgruppen inklusive
„Aktien“ und „ETFs“ getrennt; AAPL erscheint unter Aktien, EUNL.DE/VTI unter
ETFs. Die Ausrichtung der Gruppenkopfzeilen per
`getBoundingClientRect()` vermessen — Aktien, ETFs, Anleihen und Cash haben
identisches `valueX: 891` und `statusX: 1243`; Mikes gemeldeter Versatz bei
Cash ist behoben. In „Einstellungen → Verweise“ den ETF-Verweis „extraETF“
auf die Gruppe „Anleihen“ begrenzt: Das Abzeichen verschwand danach bei
EUNL.DE und VTI (ETFs-Gruppe), der separate aktien-typisierte „extraETF“-
Verweis blieb bei AAPL unverändert sichtbar — die UND-Verknüpfung wirkt wie
beschrieben.

Die mobile 390-px-Probe für das ausgeblendete Rebalancing-Symbol konnte in
dieser Sitzung nicht erneut mit echter Fensterbreite nachgestellt werden
(dieselbe `resize_window`-Werkzeuggrenze wie in T-43); die CSS-Regel
(`@include below(md) { :deep(svg) { display: none } }`, `topbar__rebalancing`
nur auf den Rebalancing-Eintrag angewendet) wurde gelesen und ist korrekt
auf den bestehenden `below(md)`-Bruchpunkt begrenzt, Desktop bleibt
unberührt.

**Ergebnis:** Fassung `d38a8f5` technisch freigegeben. Kein `changes_requested`.
Die Beobachtung zu „Lower Band“/„Upper Band“ aus T-43 Runde 1 bleibt
unverändert außerhalb des Umfangs dieses Tickets.

### Auflösung

Fassung `d38a8f5` technisch freigegeben (Runde 1, `claude`). Mikes
Bedien- und Abschlussentscheidung bleibt offen und wird getrennt
dokumentiert.
