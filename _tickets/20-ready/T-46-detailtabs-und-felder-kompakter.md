# T-46 · Detailtabs und Felder kompakter

**Stand:** Mike hat die Anpassungen am 2026-09-26 während T-45 beauftragt.
T-46 folgt auf T-45; noch keine Produktumsetzung.

## Für dich

Die Detailansicht beginnt mit „Kursverlauf“. Tabs für weitere Informationen
erscheinen nur, wenn sie Inhalte anbieten. Die Informationsfelder brauchen
weniger Platz zwischen Rand, Bezeichnung, Wert und Quellenangabe.

## Gewünschtes Verhalten

- Kursverlauf steht zuerst und ist beim Öffnen ausgewählt.
- Leere Informationsbereiche erzeugen keinen Tab. Vorhandene Werte einschließlich
  0 und Nein bleiben sichtbar. Lade- und Fehlerzustände dürfen nicht unerreichbar werden.
- Informationen und Zusatzinformationen erhalten kompaktere Innenabstände und
  Zeilenabstände; Desktop und Mobile bleiben lesbar und umbrechbar.
- StockInfo bleibt Datenquelle, keine neue Bearbeitung seiner Angaben.

## Verify

| Handgriff | Erwartung | AI |
|---|---|:--:|
| Wertpapier öffnen | Kursverlauf zuerst und aktiv | ➖ |
| Position mit/ohne Zusatzwerte öffnen | Nur tatsächlich verfügbare Informations-Tabs; 0/Nein bleiben erhalten | ➖ |
| Desktop und Mobile im Browser | Kompakte Felder, kein Überlauf oder abgeschnittener Inhalt | ➖ |
| Tests, Lint, Typecheck | Erfolgreich; Doku-Abgleich dokumentiert | ➖ |

## Auflösung

Umsetzung, technische Freigabe und menschliche Abnahme offen.
