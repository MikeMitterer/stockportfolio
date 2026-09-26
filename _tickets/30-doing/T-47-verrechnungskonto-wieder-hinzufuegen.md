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

Fassung `4c51480` technisch freigegeben (Runde 1, `claude`). Mikes
Abschlussentscheidung bleibt offen und wird getrennt dokumentiert.

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

**Mikes Sichtprüfung · 2026-09-26:** „Breite des Dialogs passt jetzt“.
Der mobile Außenabstand ist bestätigt; daraus wird keine Abnahme des gesamten
Cash-Ablaufs oder des Tickets abgeleitet.

## Reviewer-Prüfung (Claude, Runde 1, Fassung `4c51480`)

**Technische Freigabe.** `make test` (57 Dateien, 737 Tests), `make lint` und
`make typecheck` selbst gegen die Übergabefassung ausgeführt — alle drei ohne
Befund. Seit dem Handoff-Commit betrafen die Folgecommits ausschließlich
Ticket-Dateien; der Produktstand war während der Prüfung stabil.

Diff `8ae20a6..4c51480` gelesen: `cashPosition()` in `db/seed.ts` ist jetzt der
gemeinsame Erzeuger für Depotstart und Wiederanlegen. `addCashPosition` im
Store verhindert eine zweite Cash-Zeile (`positions.some(group === 'cash')`)
und verwirft nicht-endliche oder außerhalb `[0, 100]` liegende Werte, bevor
gespeichert wird. `AddPositionDialog.vue` blendet Instrument-Auswahl, Fakten
und Gruppenfeld bei `isCash` aus, `canSubmit` erlaubt für Cash `units >= 0`
statt `> 0`. `openAddDialog()` öffnet den Dialog jetzt vor dem Laden des
Katalogs (nicht mehr blockierend) — deckt „funktioniert auch ohne
StockInfo-Katalog" ab. Das Dialogfeld nutzt
`max-width: min(32rem, calc(100vw - 2 * var(--space-4)))`; `--space-4` ist im
Fundament `1rem` (16 px), also 390 px − 32 px = 358 px bei 390 px Breite —
deckt sich exakt mit Mikes bestätigter Angabe. `tests/stores/portfolio.spec.ts`
prüft den Dublettenschutz direkt gegen das Repository (echtes
fake-indexeddb): zwei aufeinanderfolgende `addCashPosition`-Aufrufe erzeugen
nur eine gespeicherte Cash-Zeile mit den ersten Werten.
`tests/components/addCashPosition.spec.ts` bestätigt zusätzlich, dass die
Kursprüfung (`validateInstrument`) beim Cash-Pfad nicht aufgerufen wird.

Live im Browser (Testdienst Port 8899, App auf `:5189`) nachvollzogen:
Verrechnungskonto im Testdepot gelöscht (Gesamtwert € 4.000 → Cash-Zeile
verschwindet), über „Position hinzufügen → Verrechnungskonto“ mit 500,25 EUR
und 10 % neu angelegt, Gesamtwert wieder € 5.000. Per direktem IndexedDB-Zugriff
bestätigt: genau eine Cash-Position mit den eingegebenen Werten, keine
Dublette. Nach Reload blieb der Zustand erhalten (5 Positionen, Verrechnungskonto
€ 500 / 10,0 %). Eine Beobachtung ohne Befund: Bei einem Testdurchlauf blieb
der Dialog nach dem Absenden kurz mit dem (jetzt cash-losen) Wertpapier-Formular
sichtbar, bevor ein Reload den korrekten Endzustand zeigte; die zugrunde
liegenden Daten waren zu diesem Zeitpunkt bereits korrekt und ohne Dublette,
ein zweiter sauberer Durchlauf zeigte dieses Verhalten nicht reproduzierbar.
Vermutlich eine Eigenheit der automatisierten Eingabesequenz (Tab-Navigation),
kein bestätigter Produktfehler — kein Rückgabegrund. Mobile 390 px und
Tastaturbedienung wurden nicht erneut live nachgestellt, sondern anhand der
Codex-Angabe und der Maßeinheiten-Rechnung als plausibel eingestuft.

**Ergebnis:** Fassung `4c51480` technisch freigegeben. Kein `changes_requested`.
