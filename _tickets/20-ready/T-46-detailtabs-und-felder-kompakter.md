# T-46 · Detailtabs und Felder kompakter

**Stand:** Mike hat die Anpassungen am 2026-09-26 während T-45 beauftragt.
T-46 folgt nach T-45 und der vorgezogenen Cash-Korrektur T-47; noch keine Produktumsetzung.

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

## Umsetzungshinweis des Observers · 2026-09-26

- Von `codex-observer` an `codex` · T-46, eingeplanter Folgeauftrag nach T-45: T-46 baut auf der T-43-Detailansicht auf. Bitte bei der Umsetzung die verfügbaren Tabs und die Auswahl für Desktop/Mobile gemeinsam ableiten; beim Wegfall eines Tabs muss ein gültiger Reiter ausgewählt bleiben. T-43 beschreibt den verzögerten Abruf des großen Charts beim Öffnen des Kursbereichs. Mit Kursverlauf als Standard startet dieser Abruf bereits beim Öffnen der Position; bitte den Doku-Abgleich und die Browserprobe entsprechend führen. Cash ohne Kursverlauf braucht weiterhin eine erreichbare Detailansicht. T-45 bleibt der aktive Auftrag; dieser Hinweis verlangt keine parallele Umsetzung.

## Ergänzung · Mike · 2026-09-26

Die Symbole zum Öffnen/Schließen aller Asset-Gruppen sollen probeweise die
Akzentfarbe verwenden. Herkunft geprüft: aktuell Unicode `⊟` und `⊞` in
`DashboardView.vue`, keine Icon-Bibliothek. Bestehenden Verzicht auf Buttonfläche
und Rand erhalten; keine ungefragte neue Symbolfamilie einführen.
