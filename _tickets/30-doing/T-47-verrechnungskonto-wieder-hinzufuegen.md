# T-47 · Verrechnungskonto wieder hinzufügen

**Stand:** Mike meldet am 2026-09-26: Verrechnungskonto gelöscht; Hinzufügen
ist anschließend nicht mehr möglich. Als Funktionskorrektur nach T-45 und vor
den optischen Detailänderungen T-46 aktiviert. Codex hat die Korrektur umgesetzt und selbst geprüft.
Browserbefund mit dem gespeicherten Testdepot bestätigt: Cash gelöscht,
anschließend bietet der Dialog nur Wertpapiere an.

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
| Cash im Testdepot löschen und erneut hinzufügen | Betrag und Zielanteil editierbar, Bilanz enthält neues Cash | ✅ |
| Seite neu laden | Cash bleibt gespeichert | ✅ |
| Cash bereits vorhanden / Katalog fehlt | Kein unbeabsichtigtes Duplikat; Cash braucht keinen Kursdienst | ✅ |
| Desktop und Mobile | Eintrag auffindbar, Betrag in Depotwährung | ✅ |
| Tests, Lint, Typecheck | Erfolgreich; Doku-Abgleich dokumentiert | ✅ |

## Auflösung

Umgesetzt; unabhängige Freigabe und menschliche Abnahme offen.

## Umsetzung und Selbstprüfung · Codex · 2026-09-26

- Hinzufügen-Dialog bietet bei fehlendem Cash eine Auswahl zwischen Wertpapier und
  Verrechnungskonto. Cash braucht nur Betrag in Depotwährung und Zielanteil.
  Zahlen einschließlich Centbeträgen und Null sind erlaubt; ungültige Werte werden
  nicht gespeichert. Der Store verhindert eine zweite Cash-Zeile.
- Gemeinsamer Erzeuger `cashPosition` für Depotstart und Wiederanlegen;
  normale Wertpapiere behalten die Kursprüfung. Der Dialog öffnet vor dem Laden
  des Wertpapierkatalogs, sodass Cash auch bei fehlendem Katalog erreichbar bleibt.
- Der vorhandene Hinzufügen-Button ist auch mobil sichtbar. Mikes ergänzender
  Wunsch: Dialog bei 390 px mit 16 px Außenabstand pro Seite, Breite 358 px.
- Browser, Desktop 1440 und Mobile 390: Verrechnungskonto im Testdepot gelöscht,
  anschließend wieder angelegt (500,25 EUR / 10 %). Nach Neuladen ist es vorhanden;
  bei vorhandenem Cash fehlt die erneute Cash-Auswahl. Kein horizontaler Überlauf.
  Testadresse `http://127.0.0.1:5189/`, Testdienst 8899, gespeicherte Browserfixture.
- Werkzeuggrenze beim Browsercheck: `fill_form` ersetzte den formatierten Zielwert
  nicht vollständig. DOM-Wert zeigte `0.0010` statt `10`; nach Auswahl des gesamten
  Eingabetextes und echten Zifferntasten/Tab korrekt `10.00`, nach Reload 10 %.
  Das ist kein belegter Produktfehler und wurde nicht durch Produktcode umgangen.
- Neue Komponentengrenzprobe mit echter Naive-Komponente bestätigt Cash bei leerem
  Katalog ohne Kursprüfung. Store-Test bestätigt Schreiben in fake-indexeddb und
  Dublettenschutz. Beide Proben vor der Umsetzung rot, danach grün.
- `make test`: 737 Tests / 57 Dateien erfolgreich. `make lint`, `make typecheck`
  erfolgreich. Build vor der reinen mobilen Randkorrektur erfolgreich (bekannter
  vendor-ui-Chunk-Hinweis). `git diff --check` sauber. TS-Compiler-API-Inventar der
  angefassten TS/Vue-Dateien: englische Bezeichner.

**Doku-Abgleich:** README „Six portfolio groups“ um Wiederanlegen des Cash-Kontos,
Betrag in Depotwährung und Unabhängigkeit vom Kursdienst ergänzt. `src/db/seed.ts`
beschreibt den gemeinsamen Erzeuger statt der bisherigen falschen Aussage, Cash
könne nicht angelegt werden. Datei-/Überschrifteninventar von docs und unraid
geprüft; dort keine geänderte aktuelle Zusage zu diesem Dialog.
**Lessons:** SP-CX-01 bis SP-CX-04 (2026-09-11) vor Umsetzung/Übergabe gelesen;
SP-CX-02 durch aktuellen Board-/Doku-Abgleich, SP-CX-04 durch vorhandene
Browserfixture und Testserver berücksichtigt. SP-R-01 ergänzend: den gespeicherten
Bestand mit Repository-Test und Reload geprüft. Keine neue Lesson abgeleitet.
**Offene Übernahme:** Allgemeiner Board-Abgleich von `2026-09-11-activity-feed`
auf Skill `2026-09-11-lessons-follow-through` bleibt wie in T-45 für ausdrücklich
beauftragte Board-Pflege offen. Keine Änderung allgemeiner Konventionen.
