# T-40 · Zusätzliche StockInfo-Kennzahlen automatisch im Detailbereich zeigen

Neue Kennzahlen aus StockInfo-Plugins sollen **ohne Frontend-Änderung sichtbar**
werden. Vor der Umsetzung verwarf der Mapper sie: Ein Risikoscore unter
`details["risk-demo.score"].value` kam genauso wenig an wie ein flaches Feld
`"risk-demo.score": 7`. Auch der Feldkatalog `GET /fields` war nicht angebunden.

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
Anwendbar ist eine Definition, wenn mindestens ein `scope` den Instrumenttyp
und `identity.kind` enthält. Die unterstützten Arten sind `number`, `text`
und `boolean`; ungültige oder unbekannte Definitionen entfallen einzeln.
Doppelte vollständige Feldnamen machen den Zusatzkatalog uneindeutig und
werden als Katalogfehler behandelt. Seine Version muss eine nichtnegative
ganze Zahl sein; `generation_id` und `core_version` dürfen nicht leer sein.

TER und Volatilität verwenden bei fehlendem Katalog ihre bekannten
Core-Definitionen. Explizit gelieferte null-Detailwerte bleiben fehlend;
ein Core-Rückfall ersetzt sie nicht. Ungültige Zusatzwerte beeinträchtigen
keinen gültigen Core-Kurs. Neue Details werden nur aus der `details`-Map
übernommen, nicht aus beliebigen flachen Core-Eigenschaften.

**Die Hauptzeile bestimmt, was schon sichtbar ist.** Die Spaltenkonfiguration
in `PositionsTable.vue` liefert die kanonischen Feldschlüssel der tatsächlich
dargestellten Spalten und reicht sie über `renderExpand` an
`PositionDrilldown.vue` weiter. Der Detailbereich zeigt den Rest. Es entsteht
keine zweite, separat gepflegte Ausschlussliste, und der Abgleich läuft über
Feldschlüssel wie `risk-demo.score`, nicht über übersetzte Beschriftungen.

Die heutigen festen Detailzellen für TER und Volatilität werden in dieselbe
Felddarstellung einbezogen — zwei Listen nebeneinander wären die nächste Quelle
für Dubletten.

Dieses Ticket enthält die verbindlichen Anforderungen für Umsetzung und Review.
Die Bewertung aus T-37 ist ausschließlich ein historischer Herkunftsbeleg.

Regeln für die Gegenfälle:

| Fall | Verhalten |
|---|---|
| `0` und `false` | Gültige Werte; kein Wahrheitswerttest bei der Auswahl |
| `null` | Wert fehlt; wird nicht zu `0` oder `false` |
| Unbekanntes Feld ohne Definition | Kernantwort bleibt lesbar; keine typisierte Darstellung |
| `risk-a.score` und `risk-b.score` | Vollständige Namen erhalten, kein Kürzen auf `score` |
| Wirksamer und manueller Wert | `value` gilt; `manual_value` ersetzt ihn nicht |
| Prozent und Beträge | Deklarierten Maßstab und die Währung **am Wert** erhalten |
| Katalog nicht erreichbar | Gültige Core-Kurse bleiben verwendbar |
| Unbekannte oder widersprüchliche Einheit | Betroffener Zahlenwert erscheint als nicht verwendbar (—); keine Interpretation oder Umrechnung |
| Detailname entspricht einem Core-Feld | Keine Vermischung mit Core-Preis oder Identität; Zusatzwerte bleiben in ihrer eigenen Map |

Die Detailwerte samt Metadaten müssen den Weg durch Cache und Neuladen
überstehen. Ein Eintrag ohne Details heißt „noch nicht geladen", nicht
„StockInfo liefert nichts".

**Abgrenzung zu [T-38](T-38-basiswaehrung-und-devisenkurse.md):** Ein
Plugin-Betrag von 100 USD wird hier mit seiner Originalwährung angezeigt.
T-40 lädt keine Devisenkurse und rechnet ihn nicht in die Depotwährung um.
Die spätere Depotbewertung verändert weder diesen Detailwert noch den
Originalkurs im gemeinsamen Cache.

Typen, Mapper, Cache und Betragsformatierung werden auf der Grundlage von
T-39 erweitert. T-38 verwendet diese Strukturen weiter. Die Anzeige kann
deshalb vor der Depotumrechnung fertiggestellt und unabhängig geprüft werden.

**Nicht in diesem Ticket:** ein allgemeiner Spalteneditor, neue Berechnungen
aus Zusatzfeldern und jede Änderung an StockInfo.

## Für dich

Die Anzeige steht und ist durch Claude technisch freigegeben.
Deine Abschlussabnahme bleibt offen: Öffne eine Position
und prüfe, ob Beschriftung, Werte und Herkunft verständlich sind. Mobil gibt
es dafür den Knopf „Zusatzinformationen“. Die erste Sichtprüfung durch Codex
ist unten dokumentiert.

**Voraussetzung der Testumgebung:** Bei der T-37-Bewertung stand StockInfos
`details_version` auf `0`, und `/fields` bezieht die Definitionen aus seiner
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
`core_version` und `details_version`. Der hier verwendete Sitzungskatalog gehört zu dieser
Kombination und zur StockInfo-Basisadresse. Er wird beim Öffnen und nach einer
neuen Kursantwort geladen; gleichzeitige Anfragen werden zusammengefasst.
Eine neue Adresse verwirft den alten Katalog, verspätete Antworten der alten
Adresse dürfen den neuen Stand nicht überschreiben. Diese Variante gilt, solange
[T-35](../10-backlog/T-35-stockinfo-generation-und-waehrung.md) nicht umgesetzt
ist; generationensichere Zusammenführung über einen Profilwechsel ist damit
nicht zugesagt.

### Verify

Legende: ✅ live bestätigt · ⚠️ mit Einschränkung · ◑ teilweise · ➖ keine Live-Verifikation.

| # | Handgriff | Erwarteter Nachweis | AI |
|---|---|---|:--:|
| 1 | Instanz mit mindestens einer Detaildefinition anbinden, Position mit Zusatzfeld öffnen | Feld erscheint im Detailbereich mit Beschriftung und Einheit, ohne Frontend-Änderung | ✅ |
| 2 | Dasselbe Feld in die Hauptzeile aufnehmen | Es verschwindet aus dem Detailbereich; nach Entfernen erscheint es dort wieder | ✅ |
| 3 | Dynamische Spalte hinzufügen und entfernen | Der Abgleich folgt der tatsächlichen Spaltenkonfiguration, nicht einer festen Liste | ✅ |
| 4 | Werte `0`, `false` und `null` liefern | `0` und `false` erscheinen; `null` erscheint als fehlend, nicht als Null | ✅ |
| 5 | `risk-a.score` und `risk-b.score` mit gleicher Beschriftung liefern | Beide bleiben getrennt sichtbar | ✅ |
| 6 | Detailbetrag 100 USD bei einer abweichenden Kurswährung liefern | Anzeige bleibt 100 USD; keine Ersatzwährung und kein FX-Abruf durch die Detailanzeige | ✅ |
| 7 | Wert mit `shadowed: true` und abweichendem `manual_value` | Angezeigt wird `value`; der manuelle Wert bleibt Zusatzinformation | ✅ |
| 8 | `/fields` ausfallen lassen | Kurse und Kernanzeige bleiben nutzbar; nur die Zusatzliste fehlt | ✅ |
| 9 | Cache schreiben, App neu laden | Detailwerte samt Metadaten überleben; fehlend/null bedeutet „nicht geladen“, eine leere Map dagegen „geladen“ | ✅ |
| 10 | TER und Volatilität prüfen | Erscheinen genau einmal, über dieselbe Felddarstellung | ✅ |

Die Nachweise wurden am 2026-09-10 durch Codex erbracht. Die unabhängige
technische Freigabe liegt vor; die menschliche Abschlussabnahme ist offen.

### Umsetzung

`src/api/normalizers.ts` prüft weiterhin alle Core-Antworten gemeinsam und
erhält jetzt zusätzlich skalare Detailwerte mit Einheit, Währung, Herkunft,
Zeitpunkt sowie manueller Eingabe. Ungültige Zusatzwerte verwerfen keinen
gültigen Core-Kurs. `getFields()` bindet den Katalog an; `src/stores/fields.ts`
hält ihn für die Sitzung und API-Adresse. Er wird beim Öffnen und nach einer
neuen Kursantwort nachgeladen, parallele Abrufe teilen eine Anfrage.

`src/domain/detailFields.ts` erzeugt die gemeinsame Darstellung für Core-
TER/-Volatilität und definierte Pluginfelder. Die Spaltenkonfiguration in
`PositionsTable.vue` nennt direkt ihre dargestellten Feldschlüssel.
`renderExpand` reicht diese an die Detailansicht weiter. Die programmatische
Prop `detailColumns` erzeugt dynamische Hauptspalten aus denselben Definitionen
und Werten; es gibt keinen zusätzlichen Benutzereditor oder eine zweite
Ausschlussliste. Mobil verwendet eine aufklappbare Ansicht dieselbe Komponente.

Prozentwerte behalten ihren Maßstab und bis zu vier Nachkommastellen;
beispielsweise bleibt 0,19 % als 0,19 % sichtbar. Die Einheiten `percent`,
`ratio`, `basis_points`, `millions` und `absolute` wurden gegen StockInfos
Pluginvertrag geprüft. Ein absoluter Betrag braucht seine Wertwährung; eine
fehlende Währung wird nicht durch die Kurs- oder Depotwährung ersetzt.

**Persistenz:** Detailwerte liegen einschließlich Metadaten im vorhandenen
Kurscache. Kein Schemawechsel und keine Migration; fehlend/null bedeutet
„noch nicht geladen“, eine leere Map bedeutet „geladen, ohne Zusatzwerte“.
Der Feldkatalog selbst wird nicht persistiert. Eine generationensichere
Zuordnung über einen Profilwechsel bleibt wie vereinbart bei T-35.

### Erste Sichtprüfung durch Codex

Die bestehende [StockInfo-Testumgebung](../../scripts/stockinfo-test-server.py) aus T-39
wurde um eine optionale Detailvorbereitung erweitert. Sie verwendet echte
REST-Routen, Services und SQLite-Speicherung; externe Provider und der
produktive Scheduler bleiben für diesen Test ersetzt. StockInfo-Quellstand:
`fe102bf1c8fd9032411e0735146aac9879f9d3f7`; dessen Produktcode und Vertrag
stimmen mit der T-37-Vertragsgrundlage `778e449` überein. Kein StockInfo-
Produktcode und keine Produktionsdaten wurden verändert.

```bash
/Volumes/DevLocal/DevWeb/Production/StockInfo/.venv/bin/python \
  scripts/stockinfo-test-server.py \
  --stockinfo-root /Volumes/DevLocal/DevWeb/Production/StockInfo \
  --detail-fixtures tests/fixtures/stockinfo

VITE_STOCKINFO_API_URL=http://127.0.0.1:8899 \
  npm run dev -- --host 127.0.0.1 --port 5189 --strictPort
```

Browser http://127.0.0.1:5189/, isolierter Kontext `stockportfolio-t39`.
Der Server erzeugt bei jedem Start eine neue temporäre Datenbank und gibt
deren Pfad aus. Zusatzdaten sind ausdrücklich synthetische Beispiele nach dem
realen Vertrag; sie prüfen die Frontend-Anbindung, keinen echten Pluginabruf.

| Fall | Beobachtung |
|---|---|
| Neue Definitionen risk-a/risk-b | Sieben Detailzellen einschließlich TER/Volatilität aus echten Serverantworten sichtbar |
| Gleiches Label, andere Namespaces | risk-a.score und risk-b.score bleiben getrennt erkennbar |
| Wirksamer Wert 0, manueller Wert 7 | 0,0 % angezeigt; verdeckte 7,0 % getrennt erläutert |
| Boolean false / fehlender Wert null | „Nein“ beziehungsweise Gedankenstrich |
| 100 USD bei EUR-Kurs | $ 100,00 in den Details, EUR-Kurs unverändert |
| HTML-Zeichen im Textwert | Als Text sichtbar; kein img-Element erzeugt |
| Dynamische Hauptspalten risk-a.score und ter | Beide erscheinen in der Hauptzeile und verschwinden aus den Details; nach Entfernen wieder sichtbar |
| Ausfall von /fields | Zusatzhinweis mit erneutem Laden; gültiger Kurs und Kernansicht bleiben vorhanden |
| Cache und Neuladen | value, source, asOf, shadowed und manualValue in IndexedDB bestätigt; nach Reload ohne neuen Quote-/Refreshabruf vorhanden |
| Mobile Ansicht, 500 px | Zusatzfelder aufklappbar und ohne horizontalen Seitenüberlauf lesbar |

Für die dynamischen Spalten wurde im isolierten Browser ausdrücklich die
programmatische Komponenten-Prop gesetzt und anschließend zurückgesetzt;
kein vorhandener Benutzerschalter wird behauptet. Die gesamte Verbindung
zwischen Tabellenkonfiguration und Detailansicht wird zusätzlich automatisch
mit echten Vue-/Naive-Komponenten geprüft. Screenshots wurden im Chat
betrachtet; kein Screenshot-Artefakt im Repository behauptet.

Der Katalogausfall lässt sich nur in diesem Testserver einschalten:

```bash
curl -s http://127.0.0.1:8899/__test/scenario \
  -X POST -d '{"mode":"fields-down"}'
# Mit mode: normal wieder reguläre Antworten einschalten.
```

### Automatische Prüfung und Grenzen

- `tests/api/details.spec.ts`: vier Quote-/Refreshwege und Katalog, Werte
  0/false/null, Metadaten, offener Namensraum, Feldkatalog und ungültige Angaben.
- `tests/stores/detailCache.spec.ts`: Laden, Einzel- und Sammelrefresh sowie
  erneute Hydrierung mit fake-indexeddb.
- `tests/stores/fields.spec.ts`: neue Katalogversion, gemeinsame parallele
  Anfrage, Ausfall und verspätete Antwort nach Adresswechsel.
- `tests/domain/detailFields.spec.ts`: Anwendbarkeit, Namespaces, Labels,
  Maßstäbe, fehlende Währung, manuelle Werte, Ausschlüsse und Core-Rückfälle.
- `tests/components/detailFields.spec.ts`: echte Tabellen-/Drilldown-Verbindung,
  dynamische Spalten, HTML als Text, Core bei Katalogausfall und Mobilansicht.

Rote Gegenproben belegten den verlorenen Detailblock, den fehlenden Katalogweg,
die fehlende Projektion, die Rundung von 0,19 % auf 0,2 % und die Darstellung
einer unbekannten Einheit als gültigen Zahlenwert.

Arbeitsbaum: `make test` mit **47 Dateien und 687 Tests** erfolgreich;
`make lint` und `make typecheck` erfolgreich. Logs:
`/tmp/stockportfolio-t40-final-{test,lint,typecheck}.log`. Dieser Lauf enthält
auch die vorgefundenen fremden Änderungen. Die getrennte Übergabefassung
ohne sie bestand ebenfalls `make test` (**46 Dateien, 679 Tests**),
`make lint` und `make typecheck`. Dafür wurde der vorgemerkte eigene Stand
nach `/tmp/stockportfolio-t40-review-t8763v` exportiert, ohne lokale geheime
Konfiguration. Die vorhandenen URL-Konfigurationstests bekamen ausdrücklich
`VITE_STOCKINFO_API_URL=https://contract.test`; API-Aufrufe bleiben injiziert.
Logs: `/tmp/stockportfolio-t40-isolated-{test,lint,typecheck}.log`.

**Doku-Abgleich:** README um Benutzung, Herkunft, Ausfall und Cache ergänzt;
AGENTS beschreibt den angebundenen Feldkatalog. Auf Mikes Hinweis ist der
Integrationsvorschlag ausdrücklich als historische Bewertung gekennzeichnet.
Alle verbindlichen Detailanforderungen stehen in diesem Ticket; der Vorschlag
wird nicht parallel fortgeschrieben. Boardübersicht, Ausführungsplan, Testdaten-Herkunft und dieses
Ticket nachgeführt. Unraid und Containerkonfiguration bleiben unverändert;
es entsteht keine neue Einstellung oder zusätzliche Laufzeitabhängigkeit.

**Lessons angewandt:** Keine zweite Kursvalidierung oder Ausschlussliste; die
freigegebene Grenze aus T-39 wird erweitert. Keine neue Serverroute und kein
Migrationspfad. Frischer Testspeicher, wiederholtes Laden, isolierte Prüffassung
und getrennt ausgewiesene Browser-/Unit-Nachweise decken SI-CX-01 ab.
Aktuelle Aussagen werden gemeinsam fortgeschrieben. Das Bezeichnerinventar
aller betroffenen TypeScript-/Vue-Dateien wurde über die Compiler-API geprüft
(`/tmp/stockportfolio-t40-identifiers.txt`); der vorgefundene unbenutzte Schlüssel `meldefondCheck` wurde in den ohnehin
betroffenen Sprachdateien zu `reportingFundCheck` umbenannt.

### Übergabe · Runde 1

- Autor/Implementer: `codex`; unabhängiger Verifier: `claude`.
- Übergabecommit: `71a4ff8a5bba963134039a6840250800f13a4192`.
- Grundlage: T-39, von Claude freigegebene Produktfassung `2cbfbf0`;
  T-40-Aktivierung und Plan bis `9b6f7b3`. Produktdiff: `9b6f7b3..71a4ff8a5bba963134039a6840250800f13a4192`.
- Geprüft: 46 Dateien / 679 Tests, Lint und Typprüfung erfolgreich.
  Alle 151 Produkt-, Test- und Konfigurationsdateien stimmen bytegenau mit
  der isolierten Prüffassung überein.
- Fremde Arbeitsbaumänderungen sind ausdrücklich nicht Bestandteil des
  Commits. Die erste Browserprüfung lief gegen den gemeinsamen Arbeitsbaum;
  die isolierten automatischen Prüfungen bestätigen die eigene Fassung.
- Anforderungen und Nachweise stehen vollständig in diesem Ticket. Der
  historische T-37-Vorschlag ist keine zusätzlich erforderliche Spezifikation.

Runde 1 ist durch Claude technisch freigegeben; Mikes Abschlussabnahme steht aus.

### Review Runde 1 · Verifier `claude` · 2026-09-10

Geprüfte Fassung `71a4ff8a5bba963134039a6840250800f13a4192` gegen `9b6f7b3`.
**Urteil: technisch freigegeben (`approved`).** Keine Nacharbeit gefordert.
Mikes Abnahme steht weiterhin aus.

Geprüft wurde wieder in einer eigenen Ausfertigung des Commits (`git archive`,
nur geteilte Abhängigkeiten). `src/` und `tests/` stimmen byteweise mit dem
Commit überein; die fremden Änderungen des Hauptbaums sind außen vor.
**46 Dateien / 679 Tests grün, Lint und Typprüfung Exit 0** — dieselben Zahlen
wie in der Übergabe, mit der angegebenen Testadresse.

**Vierzehn eigene Zusicherungen gegen `projectDetailFields`**, unabhängig von
den mitgelieferten Tests formuliert, alle erfüllt:

- Ein Zusatzfeld erscheint, solange es nicht in der Hauptzeile steht, und
  verschwindet, sobald sein Schlüssel dort auftaucht — dasselbe für `ter`.
- `0` und `false` sind Werte, `null` erscheint als fehlend.
- `risk-a.score` und `risk-b.score` bleiben bei gleicher Beschriftung getrennt.
- Ein Betrag verwendet die Währung **am Wert**; ohne Währung wird er nicht
  dargestellt statt mit der Kurswährung gerechnet.
- Der wirksame `value` steht vorn, `manual_value` bleibt daneben, `shadowed`
  erhalten.
- Eine der Definition widersprechende Einheit führt zu `—`.
- Der Prozentmaßstab bleibt erhalten: `0.2` wird „0,2 %", nicht 20 %.
- Ein unpassender Scope und ein Feld ohne Definition erscheinen nicht.
- Ohne Kurs gibt es keine Zusatzfelder.

Weiter am Quellcode bestätigt:

- **Die Anwendbarkeitsprüfung spiegelt den Server exakt.** StockInfos
  `DetailDefinition.applies()` ist `any(instrument_type in scope.instrument_types
  and identity_kind in scope.identity_kinds)`; der Client prüft dieselbe
  Bedingung, einschließlich der leeren Scope-Liste, die auch dort „von keiner
  Quelle deklariert" bedeutet.
- **Der Abgleich hängt an den tatsächlich gerenderten Spalten.** Jede Spalte
  meldet über `stockInfoFields(row)` die für **diese Zeile** dargestellten
  Feldschlüssel; der Drilldown bekommt deren Vereinigung. Das ist zeilengenau
  — die Kursspalte meldet `price`/`currency` nur, wenn ein Kurs vorliegt — und
  schließt dynamische Spalten ohne zweite Pflegeliste ein.
- **Der Katalog wird im Normalfall geladen.** `PositionDetailFields.vue` holt
  ihn selbst beim Öffnen; der zusätzliche Auslöser in `PositionsTable.vue`
  betrifft nur konfigurierte dynamische Spalten.
- **Ein Katalogausfall lässt die Kurse in Ruhe.** Der Store setzt nur
  `catalog = null` und eine Fehlermeldung, die Ansicht zeigt eine Warnung mit
  Wiederholen-Knopf. `sequence` und `pending` verhindern veraltete Antworten
  und doppelte Abrufe; ein Adresswechsel verwirft den Katalog.
- **Fehlend und leer sind unterschieden.** `details == null` heißt „noch nicht
  geladen" und wird als Hinweis angezeigt; eine leere Map bedeutet geladen und
  ohne Zusatzwerte.
- **Werte werden als Text gerendert.** Kein `v-html` im gesamten `src/`-Baum.
- **Keine Berechnung aus Zusatzfeldern:** weder `rebalancing.ts` noch
  `tradePlan.ts` kennen die Detailprojektion.
- **i18n vollständig zweisprachig:** der `detailFields`-Block steht in `de.ts`
  und `en.ts` mit denselben Schlüsseln.

**Grenze dieses Reviews:** kein Browserlauf und kein Live-Server. Die erste
Sichtprüfung lag laut Auftrag bei Codex und ist oben dokumentiert.

#### Befunde ohne Nacharbeitsbedarf

- **Die Reihenfolge der Zusatzfelder bestimmt der Server.** Projiziert wird in
  der Einfügereihenfolge von `details`, danach die Core-Rückfälle. Ordnet
  StockInfo seine Schlüssel anders an, springt die Anzeigereihenfolge. Eine
  stabile Sortierung wäre eine ruhigere Darstellung.
- **`minimum` und `maximum` werden übernommen, aber nie angewendet.** Ein Wert
  außerhalb des deklarierten Bereichs erscheint unkommentiert. Das verlangt das
  Ticket nicht; als Anzeigehinweis wäre es später sinnvoll.
- **Die Projektion läuft je Zeile mehrfach** — einmal je dynamischer Spalte für
  `stockInfoFields`, einmal im `render`, dazu für die Sichtbarkeitsliste. Bei
  Depotgrößen dieses Projekts unerheblich, bei großen Tabellen ein Kandidat für
  eine gemeinsame Berechnung je Zeile.
- **Weiterhin offen aus dem T-39-Review:** Die beiden `apiBaseUrl`-Tests
  brauchen eine ausdrücklich gesetzte Testadresse und wären im frischen Checkout
  rot. Codex hat das in der Übergabe erneut vermerkt; ein eigenes kleines
  Ticket dafür fehlt weiterhin.

### Freigabe verarbeitet · Codex · 2026-09-10

Runde 1 zu `71a4ff8a5bba963134039a6840250800f13a4192` verarbeitet. Keine
Nacharbeit gefordert; optionale Reviewhinweise erweitern den Auftrag nicht.
T-38 wird wie eingeplant fortgesetzt. T-40 bleibt bis zu Mikes
Abschlussabnahme unter `30-doing/`.


**Gemeinsamer Helfer (2026-09-10):** Der StockInfo-Testserver liegt unter
[scripts/stockinfo-test-server.py](../../scripts/stockinfo-test-server.py).
Nach einem Start lässt er sich mit demselben Python-Aufruf und `--stop --port 8899`
sauber beenden. Er prüft seine gespeicherte Prozessidentität und beendet keine
anderen Portbesitzer. Der Lifecycle-Nachweis steht in T-38 Runde 2.
