# T-39 · Identität normalisieren und Pflichtfelder an der API-Grenze prüfen

StockPortfolio soll ein Wertpapier **eindeutig wiedererkennen**, egal über
welchen der fünf Abrufwege es hereinkommt. Heute liest der Mapper `isin` auf
oberster Ebene der Antwort. StockInfo liefert die Kennung seit dem aktuellen
Vertrag innerhalb von `identity` — und zwar in drei Formen.

Beispiel aus der nachgestellten Mapperprobe: Eine echte Quote-Antwort mit
`identity.isin = "IE00B4L5Y983"` ergibt im Cacheeintrag `isin === undefined`.
Dasselbe gilt für `listed` ohne ISIN, für `pair` und für `isin_only`, in
Quote- **und** Katalogmapper.

Solange das so bleibt, trägt jede weitere Integration auf einer Kennung auf,
die nicht ankommt. Deshalb ist dieser Schnitt der erste.

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
bleiben; ohne gültigen Kurs bleibt die Position sichtbar und außerhalb der
Berechnung. Der Grund muss erkennbar sein.

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

Nichts zu tun, solange die Umsetzung läuft. Zur Abnahme wird eine Sichtprüfung
nötig: Positionen anlegen, auswählen und aktualisieren, jeweils mit und ohne
ISIN. Die Prüfschritte kommen mit der Übergabe hierher.

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
| 1 | Mapperprobe mit allen drei Identitätsformen und `listed` ohne ISIN | `listed` und `isin_only` liefern die ISIN; `listed` ohne ISIN und `pair` liefern ausdrücklich `null`, nicht `undefined` | ➖ |
| 2 | Position per ISIN abrufen und erzwungen aktualisieren | Beide Wege erzeugen denselben normalisierten Eintrag | ➖ |
| 3 | Position ohne ISIN per Symbol abrufen und erzwungen aktualisieren | Zuordnung über das Symbol bleibt stabil; keine erfundene ISIN | ➖ |
| 4 | Mehrdeutiges Symbol abrufen | `409` bleibt als Fehler sichtbar; kein stiller erster Treffer | ➖ |
| 5 | Katalog laden, Position anlegen, Dublette versuchen | Auswahlliste, Auswahlschlüssel und Dublettenprüfung arbeiten auf der normalisierten Kennung | ➖ |
| 6 | Quote ohne `currency`, Katalogkurs mit `latest_price` ohne `latest_currency` sowie weitere fehlende Core-Pflichtfelder einspielen | Abweisung an der gemeinsamen API-Grenze; kein neuer Cacheeintrag, kein Ersatz durch EUR oder Instrumentwährung | ➖ |
| 7 | Cache schreiben, App neu laden | Normalisierte Einträge überleben; ein nötiger Reset ist im Ticket beschrieben | ➖ |
| 8 | Ungültige Kursantwort mit und ohne älteren gültigen Cacheeintrag; Position und Detaildiagramm ansehen | Älterer Kurs höchstens als veraltet; sonst Position ohne verwertbaren Kurs und mit erkennbarem Grund; kein erfundener EUR-Betrag in Summe oder Diagramm | ➖ |

Durchgehend ➖: noch keine Umsetzung.

Für `#1` genügt vorerst die vollständige Mapperprobe aus dem
[Integrationsvorschlag](../../docs/stockinfo-integration-proposal.md#was-tatsächlich-geprüft-wurde)
— sie läuft unverändert im Projektverzeichnis und braucht das Nachbar-Checkout
von StockInfo. Sie belegt heute den Fehlerfall; nach der Umsetzung muss sie die
Zielspalte der Tabelle oben liefern. Die Antwortform gegenprüfen:

```bash
curl -s "https://stockinfo.int.mikemitterer.at/quote/IE00B4L5Y983"    # #2 Antwortform
curl -s -o /dev/null -w "%{http_code}\n" \
  "https://stockinfo.int.mikemitterer.at/quote?symbol=EUNL"           # #4 mehrdeutig → 409
```

Spätere automatisierte Tests bekommen eigene versionierte Fixtures; sie dürfen
nicht vom Nachbar-Checkout abhängen.

**Doku-Abgleich · Zuschnitt vom 2026-09-10:** Auf Mikes Auftrag im
Observer-Chat wurden T-35, T-38, T-40, der Integrationsvorschlag und die
Boardübersicht auf diese gemeinsame Pflichtfeldprüfung ausgerichtet.
Die Nachweise sind weiterhin offen; die Zuordnung ist keine Umsetzung.
