# T-39 · Identität normalisieren und Pflichtfelder an der API-Grenze prüfen

StockPortfolio soll ein Wertpapier **eindeutig wiedererkennen**, egal über
welchen der fünf Abrufwege es hereinkommt. In der Ausgangsfassung las der
Mapper `isin` auf oberster Ebene der Antwort. StockInfo liefert die Kennung seit dem aktuellen
Vertrag innerhalb von `identity` — und zwar in drei Formen.

Beispiel aus der nachgestellten Mapperprobe: Eine echte Quote-Antwort mit
`identity.isin = "IE00B4L5Y983"` ergibt im Cacheeintrag `isin === undefined`.
Dasselbe gilt für `listed` ohne ISIN, für `pair` und für `isin_only`, in
Quote- **und** Katalogmapper.

Diese Vertragslücke wird vor der Detailanzeige und der FX-Bewertung behoben.

## Was zu tun ist

Die Identität wird **an der API-Grenze geprüft und normalisiert**, nicht in
jeder Ansicht einzeln. Die Zuordnung steht im
[Integrationsvorschlag](../../docs/stockinfo-integration-proposal.md),
Abschnitt „Identität zuerst normalisieren":

| `identity.kind` | Zugesagte Identität | Ergebnis im Client |
|---|---|---|
| `listed` | `ticker`, `mic`, optional `isin` | `identity.isin ?? null` |
| `pair` | `base`, `quote_currency` | `null` — keine ISIN erfinden |
| `isin_only` | `isin` | `identity.isin` |

Alle Verbraucher müssen an derselben Grenze versorgt werden:

1. `GET /quote/{isin}` und `GET /quote?symbol=…`
2. `POST /refresh/{isin}` und `POST /refresh/by-symbol/{symbol}`
3. `GET /instruments` — der Instrument-Store hält heute die rohe Antwort;
   `AddPositionDialog.vue` (Auswahlschlüssel **und** Dublettenprüfung),
   `InstrumentsView.vue` und `DashboardView.vue` lesen `instrument.isin` direkt.
4. Der IndexedDB-Cache mit seiner festen `QuoteCacheEntry`-Form.

Grenzen: `symbol` bleibt Anzeigename und ist nicht eindeutig. `listing_id` sagt
der Quote-Vertrag nicht zu — sie darf nicht verlangt oder aus einem Symbol
berechnet werden. Ein mehrdeutiger Symbolabruf muss als `409` sichtbar bleiben;
der erste Katalogtreffer ist kein Ersatz. Eine unbekannte Identitätsform wird
als nicht unterstützt gemeldet, nicht geraten. Fehlt ein Core-Pflichtfeld, wird
die Antwort abgewiesen, bevor daraus ein scheinbar gültiger Cacheeintrag wird.

**Die Pflichtfeldprüfung umfasst die Kurswährung.** Eine Quote ohne gültige
`currency` erzeugt keinen neuen Cacheeintrag. Bei einem Katalogeintrag mit
`latest_price` ist `latest_currency` erforderlich; `instrument.currency`
ersetzt sie nicht. Die bisherigen EUR-Rückfälle in Mapper und Detaildiagramm
entfallen. Ein vorhandener gültiger Kurs darf höchstens als veraltet erhalten
bleiben; ohne gültigen Kurs bleibt eine bereits bestehende Position sichtbar
und außerhalb der Berechnung. Der Grund muss erkennbar sein.

**Neue Positionen setzen einen erfolgreichen eindeutigen Kursabruf voraus.**
Mike, 2026-09-10: „So ein Asset darf nicht mal in das Portfolio aufgenommen
werden - ein Asset ohne Kurs???“. Ein Katalogpreis genügt nicht. Bei `409`,
fehlender Kurswährung oder anderem Abruffehler bleibt der Aufnahmedialog mit
Fehlergrund offen und legt keine Depotposition an. Der Dialog unterscheidet
gleichnamige Börsenlistings über ihre Katalog-Listingkennung.

Dieser Anteil aus [T-35](../10-backlog/T-35-stockinfo-generation-und-waehrung.md)
wird hier einmal umgesetzt und geprüft. T-40 und T-38 nutzen dieselbe
API-Grenze, dieselben normalisierten Kurse und die dazugehörigen Tests.

Nach der Projektregel in [AGENTS.md](../../AGENTS.md#tatsächlicher-entwicklungsstand)
braucht ein inkompatibler Cache keine Migration; er darf neu aufgebaut werden.
Ein nötiger Reset wird als solcher beschrieben.

**Nicht in diesem Ticket:** die Detailanzeige aus
[T-40](T-40-detailanzeige-aus-feldkatalog.md), Depot-Basiswährung und
Devisenumrechnung aus [T-38](T-38-basiswaehrung-und-devisenkurse.md) sowie
Generationswechsel aus T-35.

## Für dich

**Die erste Sichtprüfung übernimmt Codex.** Mike, 2026-09-10: „Bei t-39 - die
erste Sichtprüfung soll von dir erfolgen. Dazu muss irgendwie der
StockInfo-Server mit den Daten die du prüfen möchtest, gestartet werden“.
Codex startet dafür StockInfo mit einer separaten Testdatenbank und gezielt
vorbereiteten Daten, prüft die Verbraucher im Browser und dokumentiert
Serveraufbau, Fälle und Ergebnisse vor der Übergabe. Die spätere menschliche
Abnahme bleibt davon getrennt.

Falls der Cache dabei zurückgesetzt werden muss, steht das vor der Abnahme im
Ticket — nicht hinterher als Überraschung.

## Umsetzung und technische Nachweise

Status: angelegt am 2026-09-10 auf Mikes Ansage „Leg die Umsetzungs-Tickets in
doing an - das hat prio". Repo: StockPortfolio, betroffene Fremdschnittstelle:
StockInfo (nur lesend, keine Änderung dort). Zeitbudget nicht beziffert.

**Grundlage:** T-37, Runde 1 technisch freigegeben am 2026-09-10. Der
Integrationsvorschlag empfiehlt Client-Normalisierung statt einer neuen
Serverroute.

### Verify

Legende: ✅ live bestätigt · ⚠️ mit Einschränkung · ◑ teilweise · ➖ keine Live-Verifikation.

| # | Handgriff | Erwarteter Nachweis | AI |
|---|---|---|:--:|
| 1 | Mapperprobe mit allen drei Identitätsformen und `listed` ohne ISIN | `listed` und `isin_only` liefern die ISIN; `listed` ohne ISIN und `pair` liefern ausdrücklich `null`, nicht `undefined` | ✅ |
| 2 | Position per ISIN abrufen und erzwungen aktualisieren | Beide Wege erzeugen denselben normalisierten Eintrag | ✅ |
| 3 | Position ohne ISIN per Symbol abrufen und erzwungen aktualisieren | Zuordnung über das Symbol bleibt stabil; keine erfundene ISIN | ✅ |
| 4 | Mehrdeutiges Symbol abrufen | `409` bleibt als Fehler sichtbar; kein stiller erster Treffer | ✅ |
| 5 | Katalog laden, Position anlegen, Dublette versuchen | Auswahlliste, Auswahlschlüssel und Dublettenprüfung arbeiten auf der normalisierten Kennung | ✅ |
| 6 | Quote ohne `currency`, Katalogkurs mit `latest_price` ohne `latest_currency` sowie weitere fehlende Core-Pflichtfelder einspielen | Abweisung an der gemeinsamen API-Grenze; kein neuer Cacheeintrag, kein Ersatz durch EUR oder Instrumentwährung | ✅ |
| 7 | Cache schreiben, App neu laden | Normalisierte Einträge überleben; ein nötiger Reset ist im Ticket beschrieben | ✅ |
| 8 | Ungültige Kursantwort mit und ohne älteren gültigen Cacheeintrag; Position und Detaildiagramm ansehen | Älterer Kurs höchstens als veraltet; sonst Position ohne verwertbaren Kurs und mit erkennbarem Grund; kein erfundener EUR-Betrag in Summe oder Diagramm | ✅ |

Die folgenden Nachweise beziehen sich auf die T-39-Umsetzung im Arbeitsbranch.
Claude hat Runde 1 technisch freigegeben; die menschliche Abschlussentscheidung
ist noch offen. T-39 bleibt deshalb unter `30-doing/`.

### Reproduzierbarer Aufbau der ersten Sichtprüfung

Codex hat die erste Prüfung am 2026-09-10 selbst in einem isolierten
Chrome-Kontext `stockportfolio-t39` durchgeführt. StockInfo-Vertragsgrundlage:
`778e449296e92bb46c0b430d9f0f9365442bf4b6`. Beim abschließenden Serverstart
stand das Nachbar-Repository auf `fe102bf1c8fd9032411e0735146aac9879f9d3f7`;
der Vergleich enthält ausschließlich Regel- und Board-Dokumentation, keine
Änderung an Servercode oder Vertrag. Das Begleitskript
[StockInfo-Testserver](../../scripts/stockinfo-test-server.py) startet die echte FastAPI-App
mit ihren Quote-/Refresh-/Katalog-/Historienrouten, Services und SQLite-Repository.
Es verwendet eine neu erzeugte temporäre Datenbank, eine lokale Kurs- und
Historienquelle sowie einen Test-Lifespan ohne produktiven Scheduler.

```bash
/Volumes/DevLocal/DevWeb/Production/StockInfo/.venv/bin/python \
  scripts/stockinfo-test-server.py \
  --stockinfo-root /Volumes/DevLocal/DevWeb/Production/StockInfo

VITE_STOCKINFO_API_URL=http://127.0.0.1:8899 \
  npm run dev -- --host 127.0.0.1 --port 5189 --strictPort
```

Browseradresse: http://127.0.0.1:5189/. Der Server gibt den jeweils neu
erzeugten Datenbankpfad beim Start aus. Keine Produktionsdatenbank und kein
Nutzerdepot wurden geändert. Es gibt keine Änderungen am StockInfo-Repository.

| Testdaten | Ergebnis im Browser |
|---|---|
| EUNL.DE / IE00B4L5Y983 | Normale Aufnahme, Abruf und Refresh per ISIN; Dublette aus Auswahl entfernt |
| NOSI.DE ohne ISIN | Aufnahme, Abruf und Refresh per Symbol; explizit null im Cache, nach Neuladen erhalten |
| BTC-EUR, DE0001135275 | Paar bzw. ISIN-only erhalten; beide abrufbar und aktualisierbar |
| VTI / USD, PEN.L / GBp | Originalkurs und Marktwert korrekt in Tabelle, Details und Mobilkarten; keine Euro-Ziele oder Euro-Deltas für ausgeschlossene Fremdwährungspositionen |
| DUAL / XNAS und XNYS | Beide Testlistings besitzen Kurse; der echte Symbolabruf liefert 409. Aufnahme bleibt gesperrt, Fehler bleibt im Dialog sichtbar, keine DUAL-Position gespeichert |
| NOSI.DE: Quote ohne currency | Aufnahme gesperrt; nach normaler Antwort erfolgreich. Bei späterem Refresh alter Kurs nur mit Warnung weiterverwendet |
| NOSI.DE: vorhandene Testposition ohne Cache + ungültige Quote | Position bleibt sichtbar, kein neuer Cacheeintrag, kein Euro-Marktwert und kein Detaildiagramm, dauerhafter konkreter Fehlergrund |
| NOSI.DE: Katalogpreis ohne latest_currency | Nach Neuladen Katalog abgewiesen; sichtbare Fehlermeldung benennt latest_currency |

Die Mobilansicht wurde in einem schmalen Browserfenster visuell geprüft;
kein horizontaler Seitenüberlauf. Screenshots wurden im Chat betrachtet,
es gibt kein behauptetes Screenshot-Artefakt im Repository.

**Grenze der Serverprüfung:** Die Testinstrumente werden direkt über das
Repository angelegt. Das ist keine Prüfung der normalen StockInfo-Aufnahme
oder externer Provider. DUAL ist ein absichtlicher Mehrdeutigkeitsfall. Der
normale StockInfo-Intake kann mehrere Listings über Ticker und MIC unterscheiden
und erlaubt OTC-Anleihen ohne Kurs als Stammdatensatz; StockPortfolios neue
Depotaufnahme ist strenger. Ungültige HTTP-200-Antworten werden ausschließlich
über eine ausdrücklich benannte Test-Middleware injiziert.

Zum gezielten Umschalten der Fehlantworten (nur dieser lokale Testserver):

```bash
curl -s http://127.0.0.1:8899/__test/scenario \
  -X POST -d '{"mode":"invalid-quote","symbol":"NOSI.DE"}'
# Weitere Modi: invalid-catalog, unknown-identity; zurück mit mode: normal.
```

### Automatische Gegenproben

- `tests/api/contract.spec.ts`: alle drei Identitätsformen plus Listed ohne
  ISIN über die fünf Clientwege; Core-Pflichtfelder, Währungen, Zeitstempel,
  Altersflags, offene Typen, additive Felder und 409-Fehler.
- `tests/stores/quoteContract.spec.ts`: neue Aufnahme, Einzel-/Sammelrefresh
  bei ungültiger Antwort, Persistenz veralteter Werte, Ausschluss ohne Kurs
  sowie frischer Speicher und Cache-Neuaufbau.
- `tests/components/quoteContract.spec.ts`: echte normalisierte Katalogdaten,
  Listingauswahl, Dubletten, Aufnahmefehler, sichtbare Fehler und USD/GBp.
- Initiale rote Gegenproben belegten die bisher akzeptierten Vertragsfehler,
  den frisch gebliebenen Altcache und das falsche Euro-Delta im Detail.

`make test`: 42 Dateien, 655 Tests erfolgreich. `make lint` und
`make typecheck`: erfolgreich. Belege des Arbeitsbaums:
`/tmp/stockportfolio-t39-final-{test,lint,typecheck}.log`. Dieser Lauf
enthält auch vorgefundene fremde Änderungen. Die getrennte Übergabefassung
aus HEAD plus ausschließlich vorgemerktem T-39-Diff wurde zusätzlich unter
`/tmp/stockportfolio-t39-review-0zmhYn` geprüft: **41 Dateien, 647 Tests**,
Lint und Typprüfung erfolgreich. Keine Laufzeitkonfiguration übernommen;
Tests verwenden die harmlose Basisadresse `https://contract.test` und
injiziertes Fetch. Nur installierte Abhängigkeiten sind per Symlink geteilt.
Belege: `/tmp/stockportfolio-t39-isolated-{test,lint,typecheck}.log`.

**Cache-Neuaufbau:** IndexedDB-Schema 5 leert den alten Quote-Cache.
Depotpositionen bleiben gespeichert, Kurse werden erneut geladen. Es wird
keine verlustfreie Migration alter Cacheeinträge behauptet.

**Doku-Abgleich:** README (Währung, Aufnahme, Fehlerverhalten, Cache), AGENTS
(Vertragsgrenze), Integrationsvorschlag (T-39 implementiert, T-40 weiterhin
geplant; historische Probe von aktuellen Tests getrennt), Ausführungsplan
und dieses Ticket fortgeschrieben. Unraid-Anleitung und Vorlage benötigen
keine Änderung: Serveradresse, Containerkonfiguration und Speicherort bleiben
gleich. Die ursprüngliche MVP-Spec ist als Ausgangsentwurf erkennbar.

**Lessons angewandt:** Gemeinsame Grenze statt doppelter Umsetzung (T-39 vor
T-40/T-38), frischer isolierter Speicher plus erneutes Laden (SI-CX-01), kein
Migrationsaufwand für alte Entwicklungsdaten (SI-R-02). Der Testserver ist
auf die beauftragte erste Sichtprüfung begrenzt; keine neue Produktlaufzeit.
Aktuelle Aussagen in Anleitung, Ticket und Vorschlag gemeinsam nachgeführt.
TS-Compiler-Inventar der berührten Dateien geprüft; vorhandene deutsche
Bezeichner in den eigenen berührten Dateien auf Englisch umgestellt.

### Übergabe

Runde 1 an `claude`: Produktfassung `2cbfbf0605ac4d4d676cae127048cf03484bfbc3`.
139 Produkt-, Test- und Konfigurationsdateien der isoliert geprüften Fassung
byteweise mit dem Commit verglichen: keine Abweichung. Die Browserprüfung
lief am gemeinsamen Arbeitsbaum; die verbleibenden fremden Änderungen an
API-Status und Fehlerdarstellung sind kein Teil dieser Übergabe.
Technische Freigabe in Runde 1 erteilt; menschliche Abnahme weiterhin offen.

### Review Runde 1 · Verifier `claude` · 2026-09-10

Geprüfte Fassung `2cbfbf0605ac4d4d676cae127048cf03484bfbc3` gegen `23580b2`.
**Urteil: technisch freigegeben (`approved`).** Keine Nacharbeit gefordert.
Die Freigabe deckt Code und Vertragstreue; Mikes Abnahme steht weiterhin aus.

Geprüft wurde in einer eigenen Ausfertigung des Commits — `git archive 2cbfbf0`
in ein leeres Verzeichnis, geteilte `node_modules`, sonst nichts aus dem
Arbeitsbaum. Ein Vergleich des ausgepackten Baums gegen den Commit zeigt für
`src/` und `tests/` keine Abweichung; die fremden uncommitteten Änderungen des
Hauptbaums sind damit nachweislich außen vor.

**Die Prüfschicht ist vertragstreu — das war die Hauptfrage.** Eine strengere
Grenze als der Vertrag würde gültige Antworten abweisen. Gegen StockInfos
`contract/core-contract.json` (`core_version 4.3.0`) geprüft:

- **Pflicht und optional stimmen feldgenau überein.** Quote verlangt `symbol`,
  `identity`, `price`, `currency`, `quote_time`, `fetched_at`, `cached`,
  `stale`, `name`, `type` — genau diese erzwingt `normalizers.ts`. `exchange`,
  `volume`, `source`, `ter`, `provider`, `replication`, `fund_size`,
  `volatility`, `accumulating` bleiben optional. Für den Katalog gilt dasselbe
  mit `listing_id`, `history_count`, `manual_fields`, `shadowed_fields`.
- **Die Zeitstempelregel ist keine Erfindung.** Der Vertrag sagt „ISO-8601 mit
  Zeitzone"; die Prüfung verlangt genau das.
- **`stale && !cached` abzuweisen steht wörtlich im Vertrag:** „stale=true
  impliziert cached=true". Folgerichtig setzt der Store beim Markieren eines
  alten Werts jetzt auch `cached: true` — sonst widerspräche der eigene Cache
  der eigenen Grenze.

Eigene Gegenprobe an der neuen Grenze, neun Zusicherungen, alle erfüllt:
`listed` mit ISIN und `isin_only` liefern die ISIN, `listed` ohne ISIN und
`pair` liefern ausdrücklich `null` und nie `undefined` — in Quote- **und**
Katalogmapper. Unbekannte Identitätsform, Quote ohne `currency`, Katalogkurs
mit Preis ohne `latest_currency` sowie `stale` ohne `cached` werden abgewiesen.
`ter: 0` und `accumulating: false` überleben.

Weiter am Quellcode bestätigt:

- **Kein geratener Kurs mehr im Datenpfad.** In `src/` gibt es keinen
  `?? 'EUR'`-Rückfall mehr; die drei verbliebenen `?? '?'` sind Beschriftungen
  für fehlende Währung, keine Rechenwerte.
- **Alle fünf Wege laufen durch eine Grenze.** `getQuoteByIsin`,
  `getQuoteBySymbol`, `refreshByIsin`, `refreshBySymbol` über `requestQuote`,
  der Katalog über `normalizeInstruments`.
- **Ausschlüsse bleiben sichtbar und begründet.** `excludedReason` kennt jetzt
  `missing-quote`; Cash bleibt korrekt ausgenommen, weil es keinen Kurs hat.
  Der Umbau der beiden früheren Frühausstiege in eine Kette erhält die
  Reihenfolge `disabled` → `missing-quote` → `currency`.
- **Aufnahme erst nach gültigem Abruf.** `validateInstrument` läuft vor
  `emit('add')`; bei Fehler bleibt der Dialog mit Grund offen, `submitting`
  verhindert den Doppelklick. Die Auswahl unterscheidet Listings über
  `listing_id` — ein Katalogfeld, das der Quote-Vertrag zu Recht nicht verlangt.
- **Cache wird neu aufgebaut, nicht migriert:** Schema 5 leert `quoteCache`,
  `oldVersion > 0` schont den Erstlauf. Das entspricht der Projektregel.
- **Neue i18n-Schlüssel liegen in `de.ts` und `en.ts`** — `invalidResponse`,
  `unsupportedIdentity`, `ambiguousSymbol` je einmal in beiden Sprachen.
- **Die AGENTS-Änderung ist reiner Doku-Abgleich** und beschreibt den
  umgesetzten Stand; keine Regeländerung.
- **Prüflauf in der isolierten Fassung:** 41 Dateien / 647 Tests grün, Lint und
  Typprüfung Exit 0 — dieselben Zahlen wie in der Übergabe.

**Grenze dieses Reviews:** kein Browserlauf und kein Live-Server. Die erste
Sichtprüfung lag laut Mikes Auftrag bei Codex und ist oben dokumentiert; ich
habe sie nicht wiederholt, sondern Code, Vertrag und Tests geprüft.

#### Befunde ohne Nacharbeitsbedarf

- **Zwei Tests hängen an der lokalen Umgebungsdatei und wären in einem frischen
  Checkout rot.** In `tests/api/client.spec.ts` scheitern „ignoriert eine leere
  Laufzeit-Adresse" und „fällt ohne jede Angabe auf die Produktions-Instanz
  zurück" ohne gesetzte `VITE_STOCKINFO_API_URL` mit `MissingApiUrlError`.
  Der zweite Test behauptet zudem einen Rückfall auf die Produktionsinstanz,
  den `apiBaseUrl()` bewusst **nicht** hat — er besteht nur, weil die lokale
  Konfiguration zufällig eine `https`-Adresse liefert. Beide Tests sind älter
  als T-39 und gehören nicht zu dieser Übergabe; sinnvoll wäre ein eigenes
  kleines Ticket, das die Erwartung an das tatsächliche Verhalten anpasst.
- **Ein ungültiger Katalogeintrag verwirft den gesamten Katalog.**
  `normalizeInstruments` bricht beim ersten Fehler ab. Das ist so beabsichtigt
  und geprüft, hat aber eine große Wirkung: Ein einziges fehlerhaftes Papier in
  StockInfo macht Auswahlliste und Aufnahme für **alle** Papiere unbenutzbar.
  Eintragsweises Überspringen mit sichtbarer Warnung wäre die mildere Variante.
  Die Entscheidung passt zu T-40, wo der Katalog ohnehin erweitert wird.
- **Unbekannte Fehlercodes erscheinen unübersetzt.** `readErrorDetail` gibt
  außer bei `symbol_ambiguous` den rohen `code` zurück, etwa `not_found`.
- **Kleine Doku-Unstimmigkeit:** Der Kommentar an `marketValue` sagt jetzt
  „in ihrer Kurswährung", die Folgezeile weiterhin „Für Cash: `units` ist der
  EUR-Betrag selbst". Heute richtig, bei T-38 nachzuziehen.

**Freigabe verarbeitet durch Codex:** Keine Nacharbeit an T-39. Die vier
nicht blockierenden Hinweise bleiben oben dokumentiert; sie erweitern den
Auftrag von T-40 nicht automatisch. T-40 wird auf der geprüften Vertragsgrenze
aktiviert. T-39 bleibt bis zu Mikes Abschlussentscheidung unter `30-doing/`.


**Gemeinsamer Helfer (2026-09-10):** Der StockInfo-Testserver liegt unter
[scripts/stockinfo-test-server.py](../../scripts/stockinfo-test-server.py).
Nach einem Start lässt er sich mit demselben Python-Aufruf und `--stop --port 8899`
sauber beenden. Er prüft seine gespeicherte Prozessidentität und beendet keine
anderen Portbesitzer. Der Lifecycle-Nachweis steht in T-38 Runde 2.
