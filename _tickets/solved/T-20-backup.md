# T-20 · Sichern und Wiederherstellen

| Repo | Status | Time-box | Scope | GH-Issue |
|---|---|---|---|---|
| root | done | ~90 min | Datensicherheit | — |

**Löst:** Der einzige offene Punkt, bei dem ein Fehler echten Datenverlust
bedeutet. Alles liegt im Browser — ein gelöschter Website-Speicher oder ein
neues Gerät hieß bisher: alles weg, ohne Rückweg.

---

## Was in die Datei kommt

Depot, Einstellungen und die Freigabeliste der Assets. **Keine Kurse** — die
sind abgeleitet, jederzeit neu abrufbar und in einer Sicherung von gestern
ohnehin wertlos.

Die Freigabeliste ist ebenfalls eine Nutzerentscheidung: Wer aus einem großen
Katalog ein Dutzend Papiere ausgeblendet hat, will das nach einem
Gerätewechsel nicht noch einmal tun. Sie steht als Objekt in der Datei, nicht
als `Map` — die überlebt JSON nicht.

Bei ihr ist die Prüfung bewusst **nachsichtig**, anders als beim Depot: Ein
unbrauchbarer Eintrag bedeutet höchstens, dass ein Papier in der Auswahl
wieder auftaucht. Die ganze Sicherung deswegen abzulehnen stünde in keinem
Verhältnis. Fehlt die Liste ganz — wie in Sicherungen vor dieser Erweiterung —
gilt sie als leer, und leer heißt „nichts ausgeblendet", nicht „nichts
erlaubt".

Die Format-Fassung bleibt trotzdem bei 1: Das Feld ist rein additiv. Sie
hochzuzählen würde nur dazu führen, dass eine ältere App eine Datei ablehnt,
die sie problemlos lesen könnte.

Die Datei trägt eine Kennung (`stockportfolio-backup`) und eine
Format-Fassung. Die Kennung fängt den wahrscheinlichsten Fehlgriff ab:
irgendeine andere JSON-Datei aus dem Download-Ordner. Eine **neuere**
Format-Fassung wird abgelehnt statt geraten — ein stillschweigend falsch
interpretiertes Feld wäre schlimmer als eine klare Fehlermeldung.

Geschrieben wird eingerückt, damit sich die Datei zur Not von Hand lesen und
reparieren lässt. Der Dateiname enthält Depotnamen und Datum, damit mehrere
Sicherungen im Download-Ordner unterscheidbar bleiben.

## Warum die Prüfung so streng ist

Eine halb eingelesene Datei stellt ein halbes Depot her, und das fällt erst
auf, wenn die Kennzahlen nicht mehr stimmen — dann ist die Ursache längst aus
dem Blick. Abgelehnt wird deshalb unter anderem:

| Fall | Warum |
|---|---|
| Unbekannte Assetklasse | Die Position fiele aus jeder Gruppierung heraus |
| Bestand als Text (`"500"`) | Rechnet sich später zu Unsinn zusammen, ohne zu werfen |
| Ziel-Anteil außerhalb 0–100 | Verzerrt jede Prozentrechnung |
| Doppelte Kennungen | Jede Bearbeitung träfe womöglich die falsche Zeile |

Die Meldung nennt die **Nummer** der beanstandeten Position — bei 30 Zeilen
ist „irgendwas stimmt nicht" wertlos.

Nachsichtig ist die Prüfung nur dort, wo Nachsicht nichts kaputt macht: Ein
fehlendes `enabled` gilt als aktiv, fehlende Einstellungsfelder ergänzt
`withDefaults`. Eine ältere Sicherung soll nicht daran scheitern, dass die App
inzwischen ein Feld mehr hat.

## Zwei Schritte statt einem

Erst Datei lesen und zeigen, was drinsteht — Depotname, Anzahl der Positionen,
Cash-Summe, Datum, App-Fassung — dann bestätigen. Ein Dateidialog, der beim
Loslassen sofort überschreibt, wäre bei einem Fehlgriff nicht mehr
zurückzuholen. Der Hinweis nennt ausdrücklich, wie viele Positionen dabei
verloren gehen.

## Gefunden beim Testen

- **Stummes Scheitern.** Schlug das Einspielen fehl, blieb der Dialog offen und
  sonst geschah nichts — kein Hinweis, kein Log. Ein Vorgang, der das ganze
  Depot ersetzt, darf nicht stumm scheitern; jetzt mit Auffangnetz und
  sichtbarer Meldung.
- **Pinia + Hot-Reload.** Nach dem Speichern behält der Browser die alte
  Fassung eines Stores; neue Methoden fehlen dann, der Aufruf läuft ins Leere.
  Alle sechs Stores nehmen jetzt `acceptHMRUpdate` an. Das war die
  wahrscheinlichste Ursache dafür, dass „Bestätigen" im laufenden Dev-Server
  nichts tat.
- **Englische Rückfragen.** Naive UI beschriftete jede Rückfrage mit
  „Confirm" / „Cancel" — mitten in einer sonst deutschen Oberfläche. Statt vier
  Popconfirms einzeln zu flicken ist jetzt die deutsche Locale gesetzt; das
  gilt auch für alles, was später dazukommt.

## Verify

Legende: ✅ live bestätigt.

| # | Where | Look for | AI | Human |
|---|---|---|:--:|---|
| 1 | *Einstellungen → Daten* | Eigener Reiter, Erklärung zur Datenhaltung | ✅ | |
| 2 | Sicherung herunterladen | Datei mit Kennung, Format-Fassung, 6 Positionen, Einstellungen | ✅ | |
| 3 | Dateiname | `stockportfolio-<depot>-<datum>.json` | ✅ | |
| 4 | Fremde Datei einspielen | Ablehnung mit Grund, Depot unverändert | ✅ | |
| 5 | Kaputte Position | „Position 3: Unbekannte Assetklasse „krypto"" | ✅ | |
| 6 | Bestand als Text | „Position 1: Bestand ist keine Zahl." | ✅ | |
| 7 | Gültige Datei | Vorschau mit Name, Anzahl, Datum, Fassung | ✅ | |
| 8 | Bestätigen | Depot **und** Einstellungen übernommen (Bänder 3/9 sichtbar) | ✅ | |
| 9 | Nach dem Einspielen | Kein verwaistes Depot in der Datenbank | ✅ | |
| 10 | Rückfrage | „Abbrechen" / „Bestätigen" auf Deutsch | ✅ | |
| 11 | Roundtrip | Export → Import verliert keine Position (Unit-Test) | ✅ | |
| 12 | Freigabeliste | Zwei Assets ausgeblendet → gesichert → wieder eingeschaltet → eingespielt → wieder ausgeblendet | ✅ | |
| 13 | Vorschau | weist „Ausgeblendet: 2 Assets" aus | ✅ | |

## Offen

- **Zusammenführen** gibt es nicht: Eine Sicherung ersetzt, sie ergänzt nicht.
  Für zwei Geräte mit unterschiedlichen Beständen wäre das eine eigene
  Aufgabe — und ohne Konfliktregeln keine gute.
- Die **Kurse** bleiben draußen — sie sind abgeleitet und werden neu geholt.
