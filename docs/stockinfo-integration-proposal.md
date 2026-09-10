# StockInfo in StockPortfolio: Identität und zusätzliche Kennzahlen

**Empfehlung: die vorhandenen Antworten im Client normalisieren.** Eine neue
flache Route ist für StockPortfolio derzeit nicht nötig. Die bestehende
`details`-Map liefert bereits den wirksamen Wert mit Herkunft, Einheit und
Währung. Die größere Lücke liegt davor: Quote und Instrumentkatalog liefern
ihre ISIN innerhalb von `identity`, während der Client sie oben liest.

Stand: 2026-09-10. Dies ist der Integrationsvorschlag zu
[T-37](../_tickets/30-doing/T-37-stockinfo-quote-vertrag-und-dynamische-felder.md),
keine bereits verfügbare Funktion. **Mike hat die automatische Zusatzanzeige
in der Detailansicht gewählt.** Bereits in der Haupt-Info-Zeile dargestellte
Felder werden dort nicht wiederholt; auch dynamische Felder können zur
Hauptzeile gehören. Unabhängiger Review und Produktumsetzung stehen aus.

## Der aktuelle Vertrag

Geprüft wurden StockInfos `contract/core-contract.json` (`core_version: 4.3.0`),
die HTTP-Fixtures für Quote und Instrumentkatalog sowie `app/models.py`,
`app/detail_models.py`, `app/details.py`, `app/routers/fields.py` und
`app/services/quote_cache.py`. StockInfo-Commit:
`778e449296e92bb46c0b430d9f0f9365442bf4b6`. Die geprüften Vertrags- und
Produktdateien hatten keine uncommitteten Änderungen.

StockPortfolios Ausgangsfassung ist `987894c`; die Untersuchung berücksichtigt
den vorgefundenen Arbeitsbaum. Fremde Änderungen an API-Fehleranzeige und
Quote-Store gehören nicht zu diesem Vorschlag. Die Gegenprobe verwendete den
unveränderten `src/api/mappers.ts` mit SHA-256
`d82421b3f9ec6ece970fcdd4ec30f3c7020d66215925468b009c2b8c3b9fbaaa`.

### Identität zuerst normalisieren

| `identity.kind` | Zugesagte Identität | ISIN im Client |
|---|---|---|
| `listed` | `ticker`, `mic`, optional `isin` | `identity.isin ?? null` |
| `pair` | `base`, `quote_currency` | `null`; keine ISIN erfinden |
| `isin_only` | `isin` | `identity.isin` |

Die vollständige Identität bleibt erhalten. `symbol` ist ein Anzeigename und
nicht garantiert eindeutig. `listing_id` ist eine opake Kennung aus dem
Instrumentkatalog; der Quote-Vertrag sagt sie ausdrücklich nicht zu. Sie darf
weder aus einem Symbol berechnet noch als neues Quote-Pflichtfeld verlangt
werden.

Die bisherigen Depotpositionen, Auswahllisten und Cacheeinträge verwenden
ISIN beziehungsweise Symbol. Nach Normalisierung kann diese einfache
Zuordnung weiterverwendet werden. Bei reinen Symbolpositionen muss ein
mehrdeutiger Abruf als `409` sichtbar bleiben; keinesfalls den ersten
Katalogtreffer verwenden. Ein späterer Wechsel zu Listing-Schlüsseln muss
die neuen Daten eindeutig zuordnen. Für alte Entwicklungsstände ist kein
Migrationspfad erforderlich: Einfach passende Daten können bleiben,
inkompatible Positionen und Auswahllisten dürfen neu angelegt werden.

### Alle Verbraucher an derselben Grenze versorgen

| Abruf | Heutiger Weg | Erforderliche Anpassung |
|---|---|---|
| `GET /quote/{isin}` | Client → Quote-Store → `toQuoteCacheEntry` | Antwort prüfen, Identität normalisieren, gewünschte Details übernehmen |
| `GET /quote?symbol=…` | Derselbe Store und Mapper | Gleiche Regeln, `409` erhalten |
| `POST /refresh/{isin}` | `fetchPosition(..., force=true)` → derselbe Mapper | Dieselbe Antwortform wie beim normalen Abruf |
| `POST /refresh/by-symbol/{symbol}` | Derselbe erzwungene Abruf | Keine abweichende Detail- oder Identitätslogik |
| `GET /instruments` | Instruments-Store → Instrumentliste, Auswahldialog, Dashboard | Auch die direkt verwendeten Katalogzeilen normalisieren |
| Tages- und Intraday-Historie | History-Client → History-Store/Diagramme | Eigenständige Antwortverträge; keine Detailprojektion |
| `GET /fields` | Bisher nicht angebunden | Nur für die gewählte Detaildarstellung ergänzen |

Beim Katalog genügt `instrumentToQuoteCacheEntry` allein nicht. Der
Instruments-Store speichert heute die rohe Antwort; `AddPositionDialog`,
`InstrumentsView` und `DashboardView` lesen selbst `instrument.isin`.
Auch Auswahlliste und Dublettenprüfung hängen daran. Ein normalisierter
Katalogtyp muss diese Verbraucher gemeinsam erreichen.

Der Quote-Cache speichert die feste `QuoteCacheEntry`-Form in IndexedDB.
Zusätzliche Felder müssen beim normalen Abruf, Einzelrefresh, Speichern und
erneuten Laden erhalten bleiben. Bereits gespeicherte Einträge ohne Details
bedeuten „noch nicht geladen“, nicht „StockInfo liefert keine Zusatzfelder“.
Nach Mikes allgemeiner Projektregel vom 2026-09-10 wird kein Versionswechsel
mit einer aufwendigen Migration abgesichert. Ein inkompatibler Cache darf
neu aufgebaut werden; unpassende Entwicklungsdaten dürfen zurückgesetzt
werden. Das korrekte Speichern und Laden des neuen Formats bleibt prüfpflichtig.

## Gewählt: automatische Zusatzanzeige in der Detailansicht

Neue Plugin-Felder sollen ohne feste Frontend-Feldliste sichtbar werden.
Dafür werden `details` und der Katalog aus `/fields` gemeinsam verwendet.
Nur für Instrumenttyp und Identitätsform anwendbare Definitionen werden
angeboten. Anzeige ist dabei keine automatische Nutzung in Summen,
Risikorechnung oder Rebalancing.

**Die Hauptzeile bestimmt, was schon sichtbar ist.** Die Darstellung der
Hauptzeile liefert für die jeweilige Position die kanonischen Feldschlüssel
der dort tatsächlich angezeigten Informationen. Die Detailansicht zeigt die
verbleibenden gültigen, anwendbaren Detailfelder. Dieser Abgleich arbeitet mit
Feldnamen wie `risk-demo.score`, nicht mit übersetzten Beschriftungen oder
einer fest codierten Liste der heutigen Core-Felder.

Heutiger Einstieg ist `PositionsTable.vue`: Die Spaltendefinitionen erzeugen
die Hauptzeile und reichen den Kontext beim Aufklappen an
`PositionDrilldown.vue` weiter. Für spätere dynamische Spalten beschreibt
dieselbe Spaltenkonfiguration auch deren Feldschlüssel. Es entsteht keine
zweite, separat gepflegte Ausschlussliste. Ein allgemeiner Spalteneditor ist
damit nicht beauftragt.

Ein dynamisches `risk-demo.score` erscheint in den Details, solange es nicht
in der Hauptzeile dargestellt wird. Kommt es dort hinzu, verschwindet die
zusätzliche Wiederholung. Wird es dort wieder entfernt, steht es erneut im
Detailbereich. Eine ausgeblendete oder für diese Position nicht dargestellte
Spalte schließt das Feld nicht aus. Zwei gleich beschriftete Felder aus
verschiedenen Plugins bleiben getrennt. Diese Fälle gehören in die späteren
Darstellungstests.

Bei einer generischen Anzeige ist folgende Behandlung vorgesehen: Eine
Definition liefert `kind`, Beschriftungen, Einheit und Anwendbarkeit; der
jeweilige Wert liefert seine Herkunft und gegebenenfalls Betragswährung.
DE/EN-Beschriftungen nutzen den Katalog, mit Rückfall auf `label_en` und dann
den vollständigen Feldnamen. Werte werden als Text gerendert, nicht als HTML.
Ein unbekanntes Feld ohne passende Definition wird nicht als typisierte
Kennzahl dargestellt und lässt die übrige Antwort weiterhin funktionieren.

Der Katalog ist veränderlich. `/fields` liefert `generation_id`, `core_version`
und `details_version`; eine persistente Kopie gehört zu dieser Kombination
und zur StockInfo-Basisadresse. Versionsänderungen erfordern eine neue Kopie.
Die Generationsbestätigung und ein Wechsel der sichtbaren Datengeneration
bleiben Gegenstand von T-35. Bis zu dessen Umsetzung wäre ein bei Bedarf neu
geladener Sitzungskatalog die begrenzte Variante; generationensichere
Zusammenführung über einen Profilwechsel wäre damit noch nicht zugesagt.

## Werte und Metadaten zusammenhalten

Dieser Ausschnitt ist synthetisch und zeigt die vorhandene Antwortform:

```json
{
  "identity": { "kind": "listed", "ticker": "EUNL", "mic": "XETR", "isin": "IE00B4L5Y983" },
  "symbol": "EUNL.DE",
  "currency": "EUR",
  "price": 128.7,
  "ter": 0.2,
  "details": {
    "risk-demo.score": {
      "value": 0,
      "unit": null,
      "currency": null,
      "origin": "provider",
      "source": "risk-demo",
      "as_of": "2026-09-10T08:00:00Z",
      "shadowed": true,
      "manual_value": 7,
      "manual_currency": null
    }
  }
}
```

`value` ist bereits ausgewählt. Der Server verwendet einen vorhandenen
Quellenwert vor dem manuellen Wert; StockPortfolio berechnet diese Rangfolge
nicht erneut. Im Beispiel wird deshalb **0** angezeigt. Die verdeckte manuelle
7 bleibt eine zusätzliche Herkunftsinformation.

| Gegenfall | Regel im vorgeschlagenen Client-Vertrag |
|---|---|
| `0` | Gültiger Zahlenwert; kein Wahrheitswerttest zur Auswahl |
| `false` | Gültige Aussage, übersetzt als Nein beziehungsweise bekannte Fachbedeutung |
| `null` | Wert fehlt; weder 0 noch `false` daraus machen |
| Fehlender Detail-Schlüssel | Nicht geliefert; keine Ersatzkennzahl erzeugen |
| Unbekanntes zusätzliches Feld | Kernantwort bleibt lesbar; generische Darstellung nur mit passender Definition |
| `risk-a.score` und `risk-b.score` | Vollständige Namen erhalten; keine Kollision durch Kürzen auf `score` |
| Detail mit Namen eines Core-Felds | Keine Objektverteilung in die Core-Antwort; Preis und Identität bleiben getrennt |
| Wirksamer und manueller Wert | `value` verwenden; `manual_value` ersetzt ihn nicht |
| Prozentwert | Deklarierten Maßstab erhalten: `0.2` bei TER bedeutet 0,2 %, nicht 20 % |
| Betrag | Währung am Detailwert verwenden; Kurs- oder Fonds-Währung ist kein Ersatz |
| Unbekannte oder widersprüchliche Einheit | Keine Umrechnung oder typisierte Berechnung; betroffene Kennzahl als nicht verwendbar behandeln |
| Fehlendes Core-Pflichtfeld | Antwort an der API-Grenze ablehnen, bevor sie einen verwertbaren Cacheeintrag erzeugt |
| Unbekannte Identitätsform | Kein ISIN-/Symbol-Raten; betroffenen Datensatz als nicht unterstützt melden |

Die vorhandenen kanonischen Kennzahlen `ter`, `volatility` und `accumulating`
bleiben ihre bekannten Domain-Felder. Eine generische Zusatzliste darf sie
nicht zusätzlich zu einer bereits vorhandenen Darstellung wiederholen.
Die bestehenden festen Detailzellen, etwa für TER und Volatilität, werden
deshalb in die gemeinsame Felddarstellung einbezogen; eine zweite Liste
daneben wäre eine weitere Quelle für Dubletten. Auch ihr Ausschluss aus den
Details folgt der tatsächlichen Hauptzeile. Für jede später neu in
Berechnungen verwendete Kennzahl gehören Typ, Einheit und Zahlenmaßstab in
einen eigenen Prüffall.

## Vergleich mit einer flachen Serverroute

| Gesichtspunkt | Bestehende Antwort + Client-Normalisierung | Zusätzliche flache Route |
|---|---|---|
| ISIN-Vertragslücke | Wird am gemeinsamen Eingang behoben | Bleibt ohne Clientanpassung bestehen |
| Neue Detailwerte | Übernahme von `details` und Definitionen nötig | Ebenfalls neue Cache- und Anzeigelogik nötig |
| Herkunft und Betragswährung | Bereits am Wert vorhanden | Zusätzliche Metadatenstruktur oder zweiter Abruf nötig |
| Normale Abfrage und Refresh | Ein Vertrag für alle vier Quote-Wege | Neue Ansicht muss für alle verwendeten Wege konsistent sein |
| Aufwand | Client, Typen, Cache, Anzeige und Tests | Zusätzlich Serververtrag, Route und Serverprüfungen |
| Nutzen für weitere Konsumenten | Lokale Anpassung | Gemeinsamer Komfortvertrag, wenn deren Bedarf belegt ist |

Für den bisher belegten Bedarf überwiegt die vorhandene Antwort. Eine neue
Route wäre erst durch einen konkreten gemeinsamen Bedarf weiterer Konsumenten
begründet. T-37 beauftragt keine Änderung in StockInfo.

## Umsetzung getrennt zuschneiden

1. **Identitätsvertrag anpassen:** Quote und Katalog validieren und
   normalisieren, ISIN- und Symbolwege einschließlich Refresh, Auswahl,
   Auswahllisten und Cache-Zuordnung gemeinsam prüfen. Fehlende Pflichtfelder
   dürfen keine scheinbar gültigen Werte erzeugen.
2. **Automatische Detailanzeige integrieren:** Feldkatalog und Detailwerte
   zusammenführen, bereits in der Hauptzeile dargestellte Feldschlüssel
   einschließlich dynamischer Spalten ausschließen. Werte samt Metadaten
   speichern; Ausfall des Katalogs darf gültige Core-Kurse nicht unbrauchbar
   machen. Prüffälle: neue Felder ohne Frontendänderung, dieselbe Kennzahl
   in Hauptzeile/Details nur einmal, dynamische Spalte hinzufügen/entfernen,
   gleiche Labels bei verschiedenen Schlüsseln und `0`/`false`.

Die Währungskorrektur aus T-35 ist Voraussetzung für T-38. Sie betrifft Quote,
Katalog und Detaildiagramm; insbesondere ist `instrument.currency` kein
Ersatz für fehlendes `latest_currency`. T-35 enthält außerdem einen deutlich
größeren Generationsauftrag, der durch T-37/T-38 nicht pauschal aktiviert wird.
Die konkrete Zuordnung gemeinsam betroffener Prüfungen wird vor der
Produktumsetzung festgehalten.

## Was tatsächlich geprüft wurde

Der echte TypeScript-Mapper wurde mit `typescript.transpileModule` isoliert
als ES-Modul geladen. Quote- und Katalog-Fixture sowie synthetische Varianten
der drei Identitätsformen wurden durch seine Funktionen geschickt. Für jede
Form entstand `isin === undefined`, auch wenn `identity.isin` vorhanden war.
Für `listed` ohne ISIN und für `pair` fehlt außerdem die zugesagte explizite
Normalisierung auf `null`.

Zusätzliche Detailwerte `0`, `false`, `null` und `7` gingen sowohl verschachtelt
als auch als oberstes Feld verloren. Die vorhandenen Core-Felder behielten
`ter: 0` und `accumulating: false`. Eine Quote ohne Währung erhielt EUR; ein
Katalogkurs ohne `latest_currency` übernahm die Instrumentwährung USD.

Diese Gegenprobe belegt das heutige Mapperverhalten. Die Regeln und der
Umsetzungszuschnitt oben sind ein Vorschlag, kein bestandener Integrationstest.
Es gab keinen Live-Kursabruf und keinen Browserlauf. Der Feldbedarf ist durch
Mikes Antwort festgelegt; der unabhängige Review ist offen.

Die Mapperprobe lässt sich im StockPortfolio-Projektverzeichnis ausführen.
Sie benötigt die installierte TypeScript-Abhängigkeit und für diesen lokalen
Vergleich die oben bezeichneten HTTP-Fixtures im benachbarten StockInfo-Repo.
Spätere automatisierte Produkttests erhalten eigene versionierte Fixtures;
sie dürfen nicht vom Nachbar-Checkout abhängen.

```bash
node --input-type=module <<'NODE'
import fs from 'node:fs';
import ts from 'typescript';
const source = fs.readFileSync('src/api/mappers.ts', 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 }
});
const mapper = await import(`data:text/javascript;base64,${Buffer.from(compiled.outputText).toString('base64')}`);
const quote = JSON.parse(fs.readFileSync('../StockInfo/contract/fixtures/quote-200.json', 'utf8')).response.body;
const instrument = JSON.parse(fs.readFileSync('../StockInfo/contract/fixtures/instruments-200.json', 'utf8')).response.body[0];
const identities = [
  quote.identity,
  { kind: 'listed', ticker: 'TEST', mic: 'XETR' },
  { kind: 'pair', base: 'BTC', quote_currency: 'EUR' },
  { kind: 'isin_only', isin: 'DE000TEST001' }
];
for (const identity of identities) {
  console.log(identity.kind,
    mapper.toQuoteCacheEntry({ ...quote, identity }).isin,
    mapper.instrumentToQuoteCacheEntry({ ...instrument, identity }).isin);
}
for (const value of [0, false, null, 7]) {
  const nested = mapper.toQuoteCacheEntry({ ...quote, details: { 'risk-demo.score': { value } } });
  const flat = mapper.toQuoteCacheEntry({ ...quote, 'risk-demo.score': value });
  console.log(value, Object.hasOwn(nested, 'details'), Object.hasOwn(flat, 'risk-demo.score'));
}
console.log('missing currency',
  mapper.toQuoteCacheEntry({ ...quote, currency: undefined }).currency,
  mapper.instrumentToQuoteCacheEntry({ ...instrument, latest_currency: null, currency: 'USD' }).currency);
console.log('core zero/false',
  mapper.toQuoteCacheEntry({ ...quote, ter: 0 }).ter,
  mapper.toQuoteCacheEntry({ ...quote, accumulating: false }).accumulating);
NODE
```

**Doku-Abgleich:** `README.md` (One currency, Not there yet), ursprüngliche
MVP-Spec (API-Client, Datenmodell, Rebalancing, Nicht im MVP), Board und
Projektregeln wurden inventarisiert. Produktanleitungen beschreiben weiterhin
das vorhandene Verhalten. Die Planung und ihre Links wurden in Board, README
und Projektregeln nachgeführt; diese Datei beschreibt die vorgeschlagene
Integration ausdrücklich als noch nicht verfügbar.
