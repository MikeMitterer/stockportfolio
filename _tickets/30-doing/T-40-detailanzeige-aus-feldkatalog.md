# T-40 · Zusätzliche StockInfo-Kennzahlen automatisch im Detailbereich zeigen

Neue Kennzahlen aus StockInfo-Plugins sollen **ohne Frontend-Änderung sichtbar**
werden. Heute wirft der Mapper sie weg: Ein Risikoscore unter
`details["risk-demo.score"].value` kommt genauso wenig an wie ein flaches Feld
`"risk-demo.score": 7`. Auch der Feldkatalog `GET /fields` ist nicht angebunden.

Deine Entscheidung vom 2026-09-10 gibt die Form vor:

> Ja, in der Detail-View wenn sie nicht sowieso Teil der aktuellen
> "Haupt-Info-Zeile" sein - theoretisch könnten das auch teilweise dynamische
> Felder sein, berücksichtige das

Anzeigen heißt dabei ausdrücklich **nicht** rechnen: Kein neues Feld fließt von
allein in Summen, Bänder oder Handelsvorschläge.

## Was zu tun ist

`details` und der Katalog aus `/fields` werden zusammengeführt. Eine Definition
liefert `kind`, Beschriftungen, Einheit und Anwendbarkeit; der Wert liefert
`origin`, `source`, `as_of` und gegebenenfalls seine eigene Währung.
DE/EN-Beschriftung aus dem Katalog, Rückfall auf `label_en`, dann der
vollständige Feldname. Werte werden als Text gerendert, nicht als HTML.

**Die Hauptzeile bestimmt, was schon sichtbar ist.** Die Spaltenkonfiguration
in `PositionsTable.vue` liefert die kanonischen Feldschlüssel der tatsächlich
dargestellten Spalten und reicht sie über `renderExpand` an
`PositionDrilldown.vue` weiter. Der Detailbereich zeigt den Rest. Es entsteht
keine zweite, separat gepflegte Ausschlussliste, und der Abgleich läuft über
Feldschlüssel wie `risk-demo.score`, nicht über übersetzte Beschriftungen.

Die heutigen festen Detailzellen für TER und Volatilität werden in dieselbe
Felddarstellung einbezogen — zwei Listen nebeneinander wären die nächste Quelle
für Dubletten.

Regeln für die Gegenfälle, aus dem
[Integrationsvorschlag](../../docs/stockinfo-integration-proposal.md#werte-und-metadaten-zusammenhalten):

| Fall | Verhalten |
|---|---|
| `0` und `false` | Gültige Werte; kein Wahrheitswerttest bei der Auswahl |
| `null` | Wert fehlt; wird nicht zu `0` oder `false` |
| Unbekanntes Feld ohne Definition | Kernantwort bleibt lesbar; keine typisierte Darstellung |
| `risk-a.score` und `risk-b.score` | Vollständige Namen erhalten, kein Kürzen auf `score` |
| Wirksamer und manueller Wert | `value` gilt; `manual_value` ersetzt ihn nicht |
| Prozent und Beträge | Deklarierten Maßstab und die Währung **am Wert** erhalten |
| Katalog nicht erreichbar | Gültige Core-Kurse bleiben verwendbar |

Die Detailwerte samt Metadaten müssen den Weg durch Cache und Neuladen
überstehen. Ein Eintrag ohne Details heißt „noch nicht geladen", nicht
„StockInfo liefert nichts".

**Nicht in diesem Ticket:** ein allgemeiner Spalteneditor, neue Berechnungen
aus Zusatzfeldern und jede Änderung an StockInfo.

## Für dich

Nichts zu tun, bis die Anzeige steht. Zur Abnahme wirst du gebeten, den
Detailbereich einer Position anzusehen und zu beurteilen, ob die zusätzlichen
Angaben verständlich beschriftet und nicht doppelt sind.

**Eine Voraussetzung betrifft die Testumgebung:** StockInfos `details_version`
steht heute auf `0`, und `/fields` bezieht die Definitionen aus seiner
Datenbank. Ohne eine Instanz mit mindestens einer Detaildefinition bleibt die
Zusatzliste leer — ein Test dagegen würde nichts beweisen. Der Befund stammt
aus dem T-37-Review vom 2026-09-10.

## Umsetzung und technische Nachweise

Status: angelegt am 2026-09-10 auf Mikes Ansage „Leg die Umsetzungs-Tickets in
doing an - das hat prio". Repo: StockPortfolio, betroffene Fremdschnittstelle:
StockInfo (nur lesend). Zeitbudget nicht beziffert.

**Hängt an [T-39](T-39-identitaet-normalisieren.md).** Ohne normalisierte
Identität lassen sich Detailwerte keiner Position verlässlich zuordnen.

Der Feldkatalog ist veränderlich: `/fields` liefert `generation_id`,
`core_version` und `details_version`. Eine gespeicherte Kopie gehört zu dieser
Kombination und zur StockInfo-Basisadresse. Ein bei Bedarf neu geladener
Sitzungskatalog ist die begrenzte Variante, solange
[T-35](../10-backlog/T-35-stockinfo-generation-und-waehrung.md) nicht umgesetzt
ist; generationensichere Zusammenführung über einen Profilwechsel ist damit
nicht zugesagt.

### Verify

Legende: ✅ live bestätigt · ⚠️ mit Einschränkung · ◑ teilweise · ➖ keine Live-Verifikation.

| # | Handgriff | Erwarteter Nachweis | AI |
|---|---|---|:--:|
| 1 | Instanz mit mindestens einer Detaildefinition anbinden, Position mit Zusatzfeld öffnen | Feld erscheint im Detailbereich mit Beschriftung und Einheit, ohne Frontend-Änderung | ➖ |
| 2 | Dasselbe Feld in die Hauptzeile aufnehmen | Es verschwindet aus dem Detailbereich; nach Entfernen erscheint es dort wieder | ➖ |
| 3 | Dynamische Spalte hinzufügen und entfernen | Der Abgleich folgt der tatsächlichen Spaltenkonfiguration, nicht einer festen Liste | ➖ |
| 4 | Werte `0`, `false` und `null` liefern | `0` und `false` erscheinen; `null` erscheint als fehlend, nicht als Null | ➖ |
| 5 | `risk-a.score` und `risk-b.score` mit gleicher Beschriftung liefern | Beide bleiben getrennt sichtbar | ➖ |
| 6 | Detail mit Betrag und eigener Währung liefern | Die Währung am Wert wird verwendet, nicht die Kurswährung | ➖ |
| 7 | Wert mit `shadowed: true` und abweichendem `manual_value` | Angezeigt wird `value`; der manuelle Wert bleibt Zusatzinformation | ➖ |
| 8 | `/fields` ausfallen lassen | Kurse und Kernanzeige bleiben nutzbar; nur die Zusatzliste fehlt | ➖ |
| 9 | Cache schreiben, App neu laden | Detailwerte samt Metadaten überleben; leerer Detailteil bedeutet „nicht geladen" | ➖ |
| 10 | TER und Volatilität prüfen | Erscheinen genau einmal, über dieselbe Felddarstellung | ➖ |

Durchgehend ➖: noch keine Umsetzung.

```bash
curl -s "https://stockinfo.int.mikemitterer.at/fields" | head -40      # #1 Katalog und Versionen
curl -s "https://stockinfo.int.mikemitterer.at/quote/IE00B4L5Y983"     # #4/#7 details-Block ansehen
```
