# T-26 · Wertentwicklung des Depots visualisieren

| Repo | Status | Time-box | Scope | GH-Issue |
|---|---|---|---|---|
| root | done — A und B umgesetzt | — | Dashboard | — |

**Löst:** Aus `QUESTIONS.md`: „Die Wertentwicklung des Portfolios sollte
visualisiert werden."

**Entschieden und umgesetzt: A und B zusammen, C nicht.** Die Begründung der
drei Varianten steht unten — sie ist der Grund, warum die Beschriftung in der
App „Rückblick" sagt und nicht „Wertentwicklung".

---

## Die Ausgangslage

Was die App heute hat:

- **Kursverlauf je Papier**, in IndexedDB zwischengespeichert (`dailyHistory`),
  Zeiträume bis „Max".
- **Den heutigen Bestand** — Stückzahlen als einzelner Stand, ohne Datum.

Was sie **nicht** hat:

- Keine Historie der Stückzahlen. Wer gestern 100 Stück hatte und heute 200,
  hinterlässt keine Spur.
- Keine Zahlungsströme. Ein- und Auszahlungen sind nirgends erfasst.

Daraus folgt die entscheidende Einschränkung: **Eine echte Wertentwicklung des
Depots lässt sich aus den vorhandenen Daten nicht berechnen.** Alles, was die
App rückwirkend zeichnen kann, unterstellt den heutigen Bestand für die ganze
Vergangenheit.

Zweite Einschränkung, unabhängig davon: *Wert* ist nicht *Rendite*. Wer 10.000 €
einzahlt, sieht die Kurve steigen, ohne einen Cent verdient zu haben. Eine
ehrliche Renditeangabe braucht die Zahlungsströme — siehe Variante C.

---

## Variante A — Rückblick auf den heutigen Bestand

Σ (Stückzahl heute × Kurs am Tag t) über den gewählten Zeitraum.

- **Aufwand:** klein. Die Kurse liegen bereits im Zwischenspeicher, das
  Diagramm gibt es (`PriceChart`), gerechnet wird in der Domäne.
- **Aussage:** „So viel wäre der heutige Bestand damals wert gewesen."
- **Nicht:** die eigene Wertentwicklung. Ein Papier, das man erst letzte Woche
  gekauft hat, erscheint rückwirkend über den ganzen Zeitraum.
- **Zu klären:** Cash und Geldmarkt haben keinen Kursverlauf — sie gehen als
  konstant ein. Fremdwährungs-Positionen bleiben außen vor, wie überall sonst.
- **Bedingung:** Die Beschriftung muss sagen, was da steht. „Wertentwicklung"
  wäre eine falsche Behauptung; „Heutiger Bestand im Rückblick" ist ehrlich.

## Variante B — Tagesschnappschuss ab jetzt

Beim Laden je Tag eine Zeile sichern: Datum, Gesamtwert, Anteile je Assetklasse.

- **Aufwand:** klein bis mittel. Neuer Objektspeicher, ein Schreibvorgang je
  Tag, dazu die Anzeige.
- **Aussage:** die tatsächliche Entwicklung — inklusive Käufen und Verkäufen.
- **Nachteil:** beginnt leer. Die Kurve ist erst in Monaten aussagekräftig, und
  sie hat Lücken an Tagen, an denen die App nicht geöffnet war.
- **Nebeneffekt, der für sich schon nützlich ist:** Man sieht, wie sich die
  Aufteilung über die Zeit verschoben hat — also genau das, worum es beim
  Rebalancing geht.

## Variante C — Bestandshistorie und Zahlungsströme

Jede Änderung einer Stückzahl mit Datum festhalten, dazu Ein- und Auszahlungen.

- **Aufwand:** groß. Schema, Migration, eine Erfassungsmaske, und die Zahlen
  sind erst ab Einführung gut.
- **Aussage:** exakt, und erst damit sind echte Renditekennzahlen möglich
  (zeit- und kapitalgewichtet).
- **Grundsätzlicher Einwand:** Das macht aus der App eine Buchhaltung. Sie ist
  bisher ausdrücklich keine — der Rebalancing-Tab bucht nichts, Bestände pflegt
  man von Hand nach. Diese Linie wäre damit überschritten.

---

## Empfehlung

**A und B zusammen, C nicht.**

A liefert sofort ein Bild und braucht keine neuen Daten. B liefert ab dem Tag
der Einführung die Wahrheit und wird mit jedem Monat besser. Beide im selben
Diagramm: die Schnappschuss-Linie kräftig, der Rückblick blass dahinter — dann
sieht man, ab wann die Angabe echt ist.

C bliebe eine bewusste Erweiterung des Zwecks und sollte, wenn überhaupt, als
eigene Entscheidung fallen — nicht als Nebenwirkung einer Visualisierung.

---

## Was gebaut wurde

- `domain/portfolioHistory.ts` — Rückblick, Schnappschuss-Punkte, Zeitfenster,
  Beginn der gemessenen Reihe. Zehn Tests, Schwerpunkt Zeitachse.
- Schema v4: `valueSnapshots`, ein Eintrag je Depot und Tag, rein additiv.
- `stores/valueHistory.ts` — laden, je Tag einmal schreiben, Rückblick rechnen,
  beim Einspielen einer Sicherung ersetzen.
- `PortfolioValueChart.vue` — zwei Linien, gemessen durchgezogen, gerechnet
  gestrichelt, Zeitraum wählbar, Zeiger mit Datum/Wert/Veränderung.
- Dashboard: kleine Linie in der Gesamtwert-Kachel, Diagramm klappt auf Klick
  darunter auf. Beide zeigen dasselbe Fenster (90 Tage).
- Sicherung: Fassung 2 enthält die Tageswerte.

## Verify

Legende: ✅ live bestätigt · ⚠️ bestätigt mit Einschränkung (Fußnote) ·
◑ teilweise (Fußnote) · ➖ keine Live-Verifikation (nur Unit/Review).

| # | Where | Look for | AI | Human |
|---|---|---|:--:|---|
| 1 | Dashboard | Gesamtwert-Kachel zeigt Linie + Veränderung, Pfeil klappt das Diagramm auf | ✅ | |
| 2 | Diagramm | Gestrichelte Linie (Rückblick), Zeitraum 1M/3M/1J/Max, Bildunterschrift nennt den Beginn der gemessenen Reihe | ✅ | |
| 3 | Kachel gegen Diagramm | Beide zeigen dieselbe Prozentzahl | ✅¹ | |
| 4 | Mobil (375 px) | Diagramm passt ohne waagrechten Überhang | ✅ | |
| 5 | Nach einem Tag Pause | Zweiter Tageswert vorhanden, durchgezogene Linie beginnt | ➖² | |
| 6 | Sichern → Wiederherstellen | Tageswerte überstehen den Umweg, Vorschau nennt ihre Anzahl | ➖³ | |

¹ Über „Max" stünden dreistellige Prozente neben dem Gesamtwert; deshalb zeigen
beide 90 Tage.
² Braucht einen echten Tageswechsel — nicht in einer Sitzung prüfbar.
³ Unit-getestet (Roundtrip in `backup.spec.ts`), nicht im Browser durchgespielt.
