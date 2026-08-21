# T-35 · StockInfo-Generation erkennen, Ersatzwährung entfernen

| Repo | Status | Time-box | Scope | GH-Issue |
|---|---|---|---|---|
| StockPortfolio | offen | zu schätzen (vier Stunden waren zu knapp) | Cache-Namespace, Währungsvertrag, Runtime-Decoder, Fixtures | — |

**Löst:** StockInfo bekommt ein Plugin-System. Wechselt dort das Quellenprofil,
beginnt eine **frische Datenbank** — und dieser Kurs-Cache zeigt danach Werte
aus einer Datenbank, die es nicht mehr gibt. Er liegt in IndexedDB und überlebt
jedes Deployment.

Dazu ein Befund aus derselben Prüfung, der unabhängig davon zählt: Eine fehlende
Kurswährung wird hier als **EUR geraten**.

**Gegenstück zu:** `StockInfo/_tickets/T-25-quellenprofil-wechseln.md` (dort
Verify `#8`) und `T-24-rest-core-vertrag.md`.
**Design:** `StockInfo/docs/superpowers/specs/2026-08-19-plugin-system-design.md`

**Hängt an:** StockInfo T-24 (liefert `generation_id` und die Fixtures) und
T-25 (erzeugt den Profilwechsel).

---

## Verify

Legende: ✅ live bestätigt · ⚠️ mit Einschränkung · ◑ teilweise · ➖ keine Live-Verifikation.

| # | Where | Look for | AI | Human |
|---|---|---|:--:|---|
| 1 | StockInfo-Antwort **ohne** `currency`, Position im Depot | Kurs gilt als unbrauchbar — **kein** stiller EUR-Ersatz | | |
| 2 | dieselbe Lage, Oberfläche | Position bleibt sichtbar, zählt aber in keine Summe; der Grund ist erkennbar | | |
| 3 | Detailbereich derselben Position | zeigt keinen EUR-formatierten Betrag für einen Kurs ohne Währung | | |
| 4 | StockInfo wechselt das Profil (neue `generation_id`) | nur der **neue** Namespace wird sichtbar; alte Werte erscheinen nie | | |
| 5 | nach #4 | Depot, Stückzahlen, Ziele, Einstellungen und Notizen **bleiben** | | |
| 6 | StockInfo-Neustart **ohne** Profilwechsel | Cache bleibt — die Generation ändert sich nicht bei jeder Konfigänderung | | |
| 6b | Profilwechsel **während** einer offenen Sitzung | wird bemerkt, nicht erst beim nächsten App-Start | | |
| 6c | Abbruch zwischen „neue Generation speichern" und „Caches leeren" | beim nächsten Start erscheinen **keine** Werte der alten Generation | | |
| 6d | Wechsel der StockInfo-Basis-URL (Server A → B) | Cache von A wird nicht weiterverwendet | | |
| 6e | älteres StockInfo **ohne** `generation_id` | dessen Cache gilt **nicht** als generationensicher | | |
| 7 | Mapper gegen StockInfos veröffentlichte Core-Fixtures | grün, ohne das StockInfo-Repo zu klonen | | |
| 8 | Fixture mit unbekanntem `details`-Feld | wird ignoriert, bricht nichts | | |
| 9 | Fixture **ohne** Core-Pflichtfeld | schlägt sichtbar fehl — die Asymmetrie ist der Kern des Vertrags | | |
| 10 | `npm test` | grün | | |

---

## Details

### Die geratene Währung widerspricht der eigenen Ansage

```ts
src/api/mappers.ts:17   currency: response.currency ?? 'EUR'
src/api/mappers.ts:42   currency: instrument.latest_currency ?? instrument.currency ?? 'EUR'
src/components/PositionDrilldown.vue:328   :currency="row.quote?.currency ?? 'EUR'"
```

**Drei** Stellen, nicht zwei *(Codex, 2026-08-21)*. Die zweite ist die
heimtückischste: Sie rät nicht nur EUR, sie schiebt vorher noch
`instrument.currency` davor — die Währung des **Instruments**, nicht die dieses
**Kurswerts**. Bei vorhandenem `latest_price` ohne `latest_currency` entsteht so
ein Betrag, der doppelt geraten ist.

Die App erklärt an anderer Stelle selbst, warum das nicht geht:

> „Sie rechnet in einer einzigen Währung und wandelt nichts um. Ein fremd
> notiertes Papier bleibt sichtbar, zählt aber in keine Summe — 10.000 USD plus
> 10.000 EUR ergibt keine 20.000 von irgendetwas."
> — `src/i18n/de.ts:545`

Genau diese Regel wird durch den Rückfall auf EUR unterlaufen: Ein Papier ohne
gemeldete Währung landet stillschweigend in der Euro-Summe. **Ohne Währung ist
ein Kurs kein Kurs** — er gehört wie ein fremd notiertes Papier behandelt:
sichtbar, aber außerhalb jeder Summe.

StockInfo zieht mit: Nach T-24 ist die Währung am Preis Pflicht, und eine
Antwort ohne sie ist dort ein Fehler statt eines geratenen Werts. Dieser Fix
hier ist trotzdem nötig — für ältere StockInfo-Stände und weil ein Konsument
sich nicht darauf verlassen soll, dass der Server nie lügt.

### Die Generation als Cache-Schlüssel

StockInfo liefert künftig eine `generation_id`. Sie ändert sich, wenn das
Quellenprofil wechselt — also wenn dort eine **frische Datenbank** beginnt.

**Löschen ist der schwächere Weg — besser ist ein Namespace** *(Codex,
2026-08-21)*. Wird zuerst der Cache hydriert und danach die Generation geholt,
erscheinen mindestens kurz Werte aus Profil A unter Profil B. Und stürzt der
Browser zwischen „neue ID speichern" und „beide Object-Stores leeren" ab, gilt
der alte Cache beim nächsten Start sogar als passend.

Deshalb Einträge adressieren unter:

```
(StockInfo-Instanz, generation_id, listing- oder Legacy-Schlüssel)
```

Vor dem Hydrieren wird die aktuelle Generation geladen; **nur ihr Namespace wird
sichtbar**. Alte Namespaces darf man danach aufräumen — aber ihr Löschen ist
dann nicht mehr sicherheitskritisch, sondern Hausputz.

Zur *Instanz* gehört mindestens die normalisierte Basis-URL. Sonst verwendet ein
Wechsel von Server A auf B den Cache von A weiter.

**Einmal beim App-Start genügt nicht.** Ein Profilwechsel kann eine offene
Sitzung treffen. Möglich sind ein Generation-Header auf jeder Datenantwort oder
ein erneuter Check vor einem Refresh und nach Wiederverbindung — welcher Weg
gilt, entscheidet StockInfo in T-24/T-25 verbindlich, samt **einem** stabilen
Endpunkt (`/sources` oder `/env` ist dort noch eine Alternative, kein Vertrag).

Weiterhin gilt: **niemals** Depot, Stückzahlen, Ziele, Einstellungen oder Notizen
anfassen. Und ohne Generationswechsel wird nichts geleert — eine neue
Paketversion drüben ist kein Profilwechsel.

### Cache-Schlüssel mittelfristig auf `listing_id`

Heute gilt (`src/api/mappers.ts:56`):

```ts
return entry.isin ?? entry.symbol
```

StockInfo führt mit T-21 eine opake `listing_id` ein — eindeutig und
anbieterunabhängig, während `symbol` künftig **nicht mehr garantiert eindeutig**
ist. Sie ist der bessere Schlüssel.

**Nicht überstürzen:** Der Rückfall auf ISIN und Symbol muss bleiben, solange
gespeicherte Positionen aus der Zeit davor stammen. Und `symbol` bleibt am
REST-Rand zugesagt — hier bricht nichts, es wird nur genauer.

### Ohne Runtime-Prüfung bleibt der Vertrag eine Behauptung

`src/api/client.ts:135` tut heute nur das:

```ts
return (await response.json()) as T
```

Das ist eine **Zusicherung an den Compiler**, keine Prüfung der Antwort. Ein
fehlendes Feld läuft zur Laufzeit als `undefined` weiter — **und genau dadurch
konnten die drei EUR-Rückfälle den Vertragsbruch verbergen** *(Codex,
2026-08-21)*. Der Server liefert keine Währung, TypeScript merkt nichts, `??`
füllt EUR ein, die Summe stimmt scheinbar.

Deshalb braucht die API-Grenze einen echten Decoder. Zu validieren sind
mindestens Preis, Währung, Identität, Zeitpunkte und die je Antwort
verbindlichen Core-Felder. Unbekannte `details` bleiben ausdrücklich erlaubt.

**Und die unvollständige Antwort wird am Rand abgelehnt, nicht ins Modell
gelassen.** `QuoteCacheEntry.currency` ist heute Pflicht — daraus überall
`string | null` zu machen wäre der falsche Weg, weil sich der Sonderfall dann
durch die ganze App zieht. Stattdessen:

- **kein** neuer Cache-Eintrag ohne Währung
- liegt ein älterer gültiger Kurs vor, bleibt er höchstens als `stale`
- bei einem neuen Papier: Position sichtbar, aber ohne verwertbaren Kurs
- die Ursache ist in Oberfläche und Diagnose erkennbar

Damit brauchen `PriceChart` und die übrigen Komponenten keinen erfundenen
Formatierungswert — die Frage stellt sich dort gar nicht mehr.

### Fixtures statt Repo-Klon

StockInfo veröffentlicht versionierte JSON-Fixtures für Instrumentliste, Quote,
Daily, FX, `/fields` sowie die Fehler `404`, `409` und `502`. Die Mapper prüfen
dagegen — ohne das Nachbar-Repo zur Testzeit zu klonen.

Die entscheidende Asymmetrie: **Unbekannte Detailfelder ignorieren, fehlende
Core-Pflichtfelder sichtbar scheitern lassen.** Das eine hält die
Erweiterbarkeit offen, das andere verhindert stille Fehler.

---

## Auflösung

_(offen)_
