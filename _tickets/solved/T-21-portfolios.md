# T-21 · Verwaltung mehrerer Depots

| Repo | Status | Time-box | Scope | GH-Issue |
|---|---|---|---|---|
| root | done | ~75 min | Datenhaltung | — |

**Löst:** Das Datenmodell kannte mehrere Depots von Anfang an — die Oberfläche
nicht. Anlegen, Umbenennen, Wechseln und Löschen stehen jetzt unter
*Einstellungen → Daten*.

---

## Was für alle gilt und was nicht

Bestände sind je Depot. Toleranzbänder, Sicherheitspuffer, Themes und Verweise
gelten **gemeinsam**: Sie beschreiben die Methode, nicht das einzelne Depot.
Wer für die Kinder andere Bänder will, hätte sonst zwei Stellen zu pflegen, an
denen dasselbe steht.

Eine Sicherung enthält immer nur das aktive Depot. Sie beim Einspielen auf
alle anzuwenden wäre nicht zu erklären.

## Der Name gehört in die Statuszeile

Sobald es mehr als ein Depot gibt, ist jede Zahl der App mehrdeutig — man
sieht ihr nicht an, worauf sie sich bezieht. Der aktive Name steht deshalb
links unten, direkt vor der Positionszahl.

## Zwei Regeln, die Schaden verhindern

- **Das letzte Depot bleibt.** Ohne Depot gäbe es keinen sinnvollen Zustand;
  die App legte beim nächsten Start ohnehin ein leeres an, nur dass die
  Einstellungen dann auf eine Kennung zeigten, die es nicht mehr gibt.
- **Wer das aktive löscht, landet beim nächsten.** Der Aufrufer bekommt die
  neue Kennung zurück und schreibt sie in die Einstellungen — sonst zeigten
  sie ins Leere.

Die Rückfrage vor dem Löschen nennt den Umfang („… mit 6 Positionen"). „Depot
löschen?" allein sagt nicht, wie viel dabei verloren geht.

## Liste getrennt vom aktiven Depot

Der Store hält das aktive Depot vollständig, von den übrigen nur Kopf-Daten
(Name, Positionszahl, Datum). Alle vollständig im Speicher zu führen hieße,
jede Positionsänderung an zwei Stellen nachzuziehen. Die Liste wird nach jeder
Änderung neu gelesen — eine veraltete Liste wäre schlimmer als keine, weil man
ihr ansieht, dass sie sich nicht bewegt, und ihr dann nirgends mehr traut.

## Verify

Legende: ✅ live bestätigt.

| # | Where | Look for | AI | Human |
|---|---|---|:--:|---|
| 1 | *Einstellungen → Daten* | Liste mit Name, „aktiv", Positionszahl, Änderungsdatum | ✅ | |
| 2 | Depot anlegen | Erscheint in der Liste, wird sofort aktiv, enthält nur die Cash-Zeile | ✅ | |
| 3 | Leerer Name | Fällt auf „Neues Depot" zurück (Unit-Test) | ✅ | |
| 4 | Wechseln | Dashboard zeigt die Bestände des gewählten Depots | ✅ | |
| 5 | Statuszeile | Nennt den aktiven Depotnamen | ✅ | |
| 6 | Umbenennen | Wirkt auch bei einem nicht aktiven Depot (Unit-Test) | ✅ | |
| 7 | Löschen | Rückfrage mit Name und Umfang, danach eines weniger | ✅ | |
| 8 | Letztes Depot | „Löschen" deaktiviert | ✅ | |
| 9 | Aktives löschen | Wechselt auf das verbleibende, Einstellungen zeigen darauf | ✅ | |
| 10 | Positionszahl | Zieht nach dem Hinzufügen einer Position nach (Unit-Test) | ✅ | |
| 11 | Bestände getrennt | Eine Position im ersten Depot taucht im zweiten nicht auf (Unit-Test) | ✅ | |

## Offen

- **Duplizieren** eines Depots gibt es nicht. Wer eine Variante durchrechnen
  will, sichert und spielt in ein neues Depot ein — umständlich, aber ohne
  neuen Begriff.
- Der **Wechsel** geht nur über die Einstellungen. Ein Umschalter in der
  Kopfzeile wäre schneller, kostet dort aber Platz, solange die meisten
  Nutzer ein einziges Depot führen.
