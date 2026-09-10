# T-23 · Kursverlauf und Unraid-Vorlage

| Repo | Status | Time-box | Scope | GH-Issue |
|---|---|---|---|---|
| root | done | ~3 h | Anzeige / Auslieferung | — |

**Löst:** Zwei Dinge — eine Container-Vorlage für Unraid und die Frage, die
keine der vorhandenen Zahlen beantwortet: Kommt der Kurs gerade von oben oder
von unten?

---

## Unraid

`unraid/stockportfolio.xml` samt README. Port, `STOCKINFO_API_URL`,
WebUI-Verweis, Symbol, Healthcheck. Kein Volume — die App speichert im
Browser, ein Update ist „Pull & Restart". Der README nennt CORS als
wahrscheinlichsten Stolperstein beim ersten Start.

## Kursverlauf

Gegen die laufende API geprüft: `/quote/{isin}/daily?period=1w|1m|3m|1y|max`
liefert `{date, close, currency}`; die `by-symbol`-Variante deckt Positionen
ohne ISIN ab.

**In der Zeile** eine Monatslinie neben dem Kurs, Zeitraum im Spaltenkopf.
Grün und Rot heißen dort „gestiegen"/„gefallen", nicht „gut"/„schlecht" — für
den Handlungsbedarf gibt es die Statusspalte.

**In der Detailansicht** ein Diagramm mit Achsen: links die Kurse, rechts
dieselben Linien als Veränderung seit Beginn. Nicht zwei Datenreihen, sondern
zwei Lesarten derselben. Beim Überfahren zeigt ein Zeiger Datum, Kurs und
Veränderung.

## Drei Entscheidungen

**Ohne Diagramm-Bibliothek.** Eine Linie, ein paar Striche und ein Zeiger sind
weniger Code als die Einbindung eines Pakets, und die Theme-Farben gelten von
selbst.

**Skala nach Wertebereich, nicht ab null.** Bei einem Kurs zwischen 160 und
165 wäre eine Achse ab null eine gerade Linie. Ein Verlauf zeigt Bewegung,
nicht Niveau.

**Echte Pixel statt gedehntes Koordinatensystem.** `preserveAspectRatio="none"`
hätte die Beschriftung mitverzerrt; die Komponente misst ihre Breite.

## Zwischenspeicher (Schema v3)

Tagesschlusskurse ändern sich einmal täglich. Ohne ihn liefe bei jedem
Seitenaufbau eine Anfrage je Position für Zahlen von gestern. Geholt wird nur
auf Anforderung und höchstens einmal pro Tag je Papier. Die Migration ist rein
additiv.

## Verify

| # | Where | Look for | AI | Human |
|---|---|---|:--:|---|
| 1 | Tabellenzeile | Linie mit Veränderung, Zeitraum im Spaltenkopf | ✅ | |
| 2 | Cash-Zeile | Strich statt Linie — ein Verrechnungskonto hat keinen Kurs | ✅ | |
| 3 | Detailansicht | Achsen links (Kurse) und rechts (Prozent) | ✅ | |
| 4 | Zeitachse | Tag/Monat bei kurzen, Monat/Jahr bei langen Zeiträumen | ✅ | |
| 5 | Zeiger | Datum, Kurs, Veränderung; Kasten kippt am rechten Rand | ✅ | |
| 6 | Zeitraum-Wechsel | 1J zeigt +24,8 %, Tief 130,24 €, Hoch 163,20 € | ✅ | |
| 7 | Einzelner Punkt | Keine Linie — eine Waagrechte täuscht einen Verlauf vor | ✅ | |
| 8 | Ladefehler | Zelle bleibt leer, keine Meldung | ✅ | |
| 9 | Unraid-XML | Wohlgeformt, Port und Variable gesetzt | ✅ | |

## Offen

- Die Unraid-Vorlage ist nicht auf einer echten Instanz ausgeführt.
- Der Zwischenspeicher wird nie aufgeräumt; bei vielen Depots und Zeiträumen
  wächst er langsam. Bisher kein Problem, aber vorgemerkt.
