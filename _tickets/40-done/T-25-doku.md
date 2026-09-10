# T-25 · Erklärung in der App

| Repo | Status | Time-box | Scope | GH-Issue |
|---|---|---|---|---|
| root | done | ~90 min | Verständlichkeit | — |

**Löst:** Wer Tolerance-Band-Rebalancing nicht kennt, versteht die App nicht —
und das dürften die meisten sein. Die Methode stammt aus der institutionellen
Vermögensverwaltung; wer nur „einmal im Jahr umschichten" kennt, sieht bunte
Balken und weiß nicht, warum bei −6 % etwas passieren soll und bei −4 % nicht.

---

## Drei Wege, zwei genommen

**Verworfen: Erklärtext im Leerzustand.** Naheliegend — wer die App zum ersten
Mal öffnet, hat ein leeres Depot und ohnehin nichts zu tun. Aber: Alle wollen
zuerst ausprobieren, nicht lesen. Ein Textblock vor dem ersten Klick wird
überblättert und macht den Einstieg schwerer statt leichter.

**Genommen: Erklärung am Begriff.** Ein kleines Fragezeichen neben
Toleranzband, Investitionsreserve, Sicherheitspuffer, Delta und „Decken aus" —
zwei bis drei Sätze im Tooltip, kein Verweis auf anderswo. Erklärung dort, wo
die Frage entsteht.

**Genommen: eine Seite „Die Methode".** Erreichbar über dasselbe Fragezeichen,
**nicht** über die Hauptnavigation. Dort steht die Methode einmal
zusammenhängend: warum Bänder statt Kalender, warum die Bänder asymmetrisch
sind, warum Geldmarkt von Anleihen getrennt ist, wie Puffer und Reserve
zusammenhängen.

## Grenzen gehören auf dieselbe Seite

Der Abschnitt „Was die App bewusst nicht tut" ist kein Kleingedrucktes: Wer
wissen will, was die App leistet, muss auch erfahren, was sie ausdrücklich
nicht leistet — sonst erwartet er es irgendwann. Vier Punkte: keine
Währungsumrechnung, keine Aussage über Währungsrisiko, keine Anlageberatung,
keine Speicherung außerhalb des Browsers.

## Was nicht gebaut wurde

Keine Tour beim ersten Start, kein Hilfe-Menü, keine Doku-Reiter in den
Ansichten. Das bläht auf und wird beim zweiten Besuch weggeklickt.

## Verify

| # | Where | Look for | AI | Human |
|---|---|---|:--:|---|
| 1 | Dashboard | Fragezeichen an Investitionsreserve, Reserve in %, Bänder, Delta | ✅ | |
| 2 | Tooltip | Zwei bis drei Sätze plus „Mehr dazu →" | ✅ | |
| 3 | Klick aufs Fragezeichen | Methodenseite, an der passenden Stelle | ✅ | |
| 4 | Hauptnavigation | Kein Eintrag für die Methodenseite | ✅ | |
| 5 | Einstellungen | Fragezeichen an Toleranzbändern und Sicherheitspuffer | ✅ | |
| 6 | Rebalancing | Fragezeichen an „Decken aus" | ✅ | |
| 7 | Beide Sprachen | Erklärungen und Methodenseite vollständig übersetzt | ✅ | |

## Nachgetragen

- **„Mehr dazu" war kein Verweis.** Im Tooltip stand ein `span`, der aussah wie
  einer und beim Klick nichts tat — navigiert hat nur das Fragezeichen selbst.
  Jetzt ein echter Knopf, und `keep-alive-on-hover` sorgt dafür, dass der
  Tooltip offen bleibt, bis die Maus ihn erreicht hat.
- **Relativ oder Prozentpunkte** — der Unterschied steht jetzt ausdrücklich im
  Abschnitt „Toleranzbänder": Bei einem Ziel von 10 % heißt −10 % nicht „bei
  null", sondern 9 %. Und warum überhaupt relativ gerechnet wird: Bei einem
  Ziel von 45 % wären 6 Prozentpunkte ein Achtel der Position, bei 5 % mehr als
  die ganze — dieselbe Zahl hieße in jeder Zeile etwas anderes.

## Offen

- Der Delta-Hinweis steckt viermal im DOM — je Gruppentabelle einmal. Sichtbar
  ist nur der erste, die übrigen Kopfzeilen sind ausgeblendet. Kein Fehler,
  aber ein Nebeneffekt der Gruppierung.
- Von der Methodenseite führt kein eigener Weg zurück; dafür steht die
  Hauptnavigation weiterhin oben.
