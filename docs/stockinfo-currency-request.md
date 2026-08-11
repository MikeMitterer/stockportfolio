# Anfrage an StockInfo: Währungen

Vorlage zum Übergeben an Claude Code im StockInfo-Repository. Beschreibt ein
Problem aus Sicht des Konsumenten (StockPortfolio) — die Lösung entscheidet,
wer den Dienst kennt.

---

## Der Prompt

> Du arbeitest an StockInfo. Ich beschreibe dir ein Problem aus Sicht eines
> Konsumenten der API, der Rebalancing-App **StockPortfolio**. Sie holt Kurse
> und Stammdaten von dir und rechnet daraus Depot-Anteile, Toleranzbänder und
> Handelsvorschläge.
>
> **Bitte zuerst analysieren und mir einen Vorschlag machen, nicht sofort
> bauen.** Ich will die Entscheidung mittragen, bevor Code entsteht.
>
> ### Das Problem
>
> StockPortfolio summiert Marktwerte über alle Positionen und rechnet daraus
> Prozentanteile. Diese Summe ist nur dann etwas wert, wenn alle Beträge
> dieselbe Währung haben. 10.000 USD plus 10.000 EUR ergibt keine 20.000 von
> irgendetwas.
>
> Heute geht die App davon aus, dass alles in Euro notiert — was funktioniert,
> weil ich als Österreicher EUR-notierte UCITS-ETFs kaufe und du Xetra/EUR
> bevorzugst. Für jeden außerhalb des Euroraums bricht diese Annahme. Ein
> Kanadier würde CAD-notierte Papiere an der TSX halten; er bekäme von dir
> aber die EUR-Notierung desselben Papiers, oder gar keine.
>
> ### Was die App heute tut
>
> - `GET /instruments` und `GET /quote/isin/{isin}` bzw. `/quote/symbol/{symbol}`
> - Sie liest `currency` aus der Antwort, verwendet den Wert aber bisher nur
>   informativ — gerechnet wird durchgängig in Euro.
> - Als Nächstes zeigt sie eine Warnung an jeder Position, deren `currency`
>   von der Basiswährung abweicht, und nimmt sie **nicht** in die Summen.
>
> Diese Warnung ist ehrlich, aber sie ist eine Kapitulation: Sie sagt „diese
> Zahl passt nicht in meine Summe", nicht „so rechnest du richtig".
>
> ### Was ich von dir bräuchte — drei Stufen
>
> Bitte bewerte jede Stufe: Aufwand, Risiko, ob sie überhaupt sinnvoll in
> StockInfo gehört. Ich brauche nicht alle drei.
>
> **Stufe 1 — Notierung gezielt anfordern.**
> Eine Möglichkeit, zu einem Papier die Notierung an einer bestimmten Börse
> oder in einer bestimmten Währung zu bekommen, statt der von dir gewählten.
> Etwa `?currency=CAD` oder `?exchange=TSX` an den Quote-Endpunkten, und
> dieselbe Vorauswahl bei `/instruments`. Ein Papier notiert an mehreren
> Plätzen; heute entscheidest du, welche ich sehe.
>
> Wichtig dabei: Was passiert, wenn es die gewünschte Notierung nicht gibt?
> Fehler, oder die vorhandene mit ehrlicher Auszeichnung? Ich hätte lieber
> ein klares „gibt es nicht" als still eine andere Währung.
>
> **Stufe 2 — Devisenkurse.**
> Ein Endpunkt für Wechselkurse, damit die App gemischte Depots umrechnen
> kann, etwa `GET /fx?base=EUR&quote=USD`. Falls du das anbietest, brauche ich
> zwingend denselben Umgang wie bei Kursen: Zeitstempel, Quelle und ein
> `stale`-Kennzeichen. Ein stiller alter Devisenkurs verzerrt sonst jede
> einzelne Prozentzahl meiner App, ohne dass es jemand sieht.
>
> **Stufe 3 — Umrechnung bei dir.**
> Kurse direkt in einer Zielwährung liefern (`?in=EUR`). Bequem für mich,
> aber ich bin skeptisch: Dann steckt in einem einzigen Feld ein Börsenkurs
> **und** ein Devisenkurs, und ich kann nicht mehr auseinanderhalten, welcher
> davon veraltet ist. Sag mir, ob du das anders siehst.
>
> ### Was ich ausdrücklich nicht brauche
>
> - Keine Modellierung von Währungs**risiko**. Ein EUR-notierter MSCI World
>   steckt zu zwei Dritteln in US-Dollar — das ist eine ganz andere Frage als
>   die Notierungswährung, und weder deine noch meine Aufgabe.
> - Keine historischen Devisenkurse. Die App rechnet nur mit dem Jetzt.
>
> ### Bitte beantworte mir
>
> 1. Welche Börsen und Währungen liegen heute überhaupt in deinen Daten? Gibt
>    es zu einem Papier mehrere Notierungen, oder speicherst du eine?
> 2. Woher kämen Devisenkurse — hast du eine Quelle, die dafür taugt, und was
>    kostet sie an Aufrufen?
> 3. Welche Stufe empfiehlst du, und was würdest du bleiben lassen?
> 4. Was bricht bei bestehenden Konsumenten, wenn sich das Antwortformat
>    ändert? Ich hätte gern Rückwärtskompatibilität — mein Client liest
>    `currency`, `price`, `quote_time`, `stale`, `fetched_at`.
>
> Antworte auf Deutsch.

---

## Hintergrund für mich selbst

Warum das nicht im Frontend zu lösen ist: Die Basiswährung dort umzustellen
ist eine Stunde Arbeit — Formatter und eine Auswahl in den Einstellungen. Es
bringt aber nichts, solange die API dem Kanadier die Xetra-Notierung liefert.
Er bekäme CAD-Beschriftungen auf EUR-Kursen, und das ist schlechter als der
heutige Zustand, in dem wenigstens beides zusammenpasst.

Deshalb: Stufe 1 ist die Voraussetzung für eine konfigurierbare Basiswährung
in StockPortfolio. Stufe 2 wäre die Voraussetzung für gemischte Depots. Ohne
beides bleibt es bei der Warnung, und die genügt für den vorgesehenen
Gebrauch.
