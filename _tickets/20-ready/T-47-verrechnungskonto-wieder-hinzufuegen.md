# T-47 · Verrechnungskonto wieder hinzufügen

**Stand:** Mike meldet am 2026-09-26: Verrechnungskonto gelöscht; Hinzufügen
ist anschließend nicht mehr möglich. Als Funktionskorrektur nach T-45 und vor
den optischen Detailänderungen T-46 eingeplant. Noch keine Produktumsetzung.

## Für dich

Ein gelöschtes Verrechnungskonto soll über „Position hinzufügen“ wieder
angelegt werden können. Betrag und Zielanteil werden bewusst neu eingegeben;
gelöschte Werte werden nicht erfunden. Die Depotwährung gilt für Cash.

## Befund und Umfang

`removePosition` erlaubt Cash zu löschen. `AddPositionDialog` bietet bislang
nur Wertpapiere aus StockInfo und schließt Cash aus seinen Gruppen aus. Cash
ist jedoch kein Wertpapier und benötigt keinen Kursabruf.

Gewünschte Lösung: Fehlt Cash, bietet derselbe Hinzufügen-Dialog das
Verrechnungskonto mit Betrag in Depotwährung und Zielanteil an. Ein vorhandenes
Verrechnungskonto erzeugt keine zweite identische Position. Wertpapiere behalten
ihre bestehende Kursprüfung. Funktioniert auch ohne StockInfo-Katalog.

## Verify

| Handgriff | Erwartung | AI |
|---|---|:--:|
| Cash im Testdepot löschen und erneut hinzufügen | Betrag und Zielanteil editierbar, Bilanz enthält neues Cash | ➖ |
| Seite neu laden | Cash bleibt gespeichert | ➖ |
| Cash bereits vorhanden / Katalog fehlt | Kein unbeabsichtigtes Duplikat; Cash braucht keinen Kursdienst | ➖ |
| Desktop und Mobile | Eintrag auffindbar, Betrag in Depotwährung | ➖ |
| Tests, Lint, Typecheck | Erfolgreich; Doku-Abgleich dokumentiert | ➖ |

## Auflösung

Umsetzung, unabhängige Freigabe und menschliche Abnahme offen.
