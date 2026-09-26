# T-45 · Betragsmodus in den Einstellungen bleibt nicht stehen

Unter **Einstellungen → Berechnung → Liquidität** lässt sich der
Sicherheitspuffer als Prozentwert bedienen. Beim Versuch, „Betrag in EUR“
auszuwählen, klappt die Auswahl laut Mike wieder zu und der Prozentmodus
bleibt stehen. So lässt sich ein fester Geldbetrag nicht zuverlässig setzen.

**Beispiel:** Ein Sicherheitspuffer von 1.000 EUR soll unabhängig vom
Depotwert gelten. Nach Auswahl von „Betrag in EUR“ muss das Zahlenfeld diesen
Betrag als Geldwert bearbeiten und die Auswahl nach einem Neuladen erhalten.

**Stand:** Seit 2026-09-26 aktiv, durch Codex umgesetzt und selbst geprüft.
Der Browsernachweis bestätigt die gemeinsame HTML-Beschriftung als Ursache:
Klick auf die Modusauswahl fokussierte das Zahlenfeld, das Menü schloss sofort.
Getrennte Beschriftung und neutraler Container beheben den Rücksprung.
Claude hat Fassung `8ae20a6` in Runde 1 technisch freigegeben. Die Rückgabe
ist verarbeitet; keine Nacharbeit. Mike hat am 2026-09-26 mit „T-45 ist OK und passt so“ abgeschlossen (über Claude weitergegeben).

## Für dich

Keine weitere Entscheidung nötig. Nach der Umsetzung beide Modi beim
Sicherheitspuffer ausprobieren und prüfen, ob der gewählte Modus samt Betrag
nach einem Seitenneuladen erhalten bleibt. Technische Prüfung siehe unten.
Testadresse: `http://127.0.0.1:5189/#/settings?tab=calc`, lokaler
Testdienst `http://127.0.0.1:8899`.

## Umsetzung und technische Nachweise

| Repo | Umfang | Fremddienst |
|---|---|---|
| StockPortfolio | Umschaltung und Speicherung der Betragseinstellung, Tests und betroffene Anleitung | StockInfo unverändert |

### Gewünschtes Verhalten

Der Modus lässt sich zwischen Prozent und einem Betrag in der Depotwährung
wechseln. Die vorhandene Umrechnung beim Wechsel bleibt erhalten; der Wert
springt nicht durch ein unbeabsichtigtes zweites Eingabeereignis zurück.
Zahlenfeld und Auswahl sind getrennt korrekt beschriftet und per Tastatur
bedienbar. Sicherheitspuffer und Mindest-Handelsvolumen nutzen weiter denselben
Baustein. Die eingestellte Depotwährung bestimmt die Währungsbeschriftung.

### Verify

Legende: ✅ live bestätigt · ⚠️ mit Einschränkung · ◑ teilweise ·
➖ keine Live-Verifikation.

| # | Handgriff | Erwarteter Nachweis | AI |
|---|---|---|:--:|
| 1 | In Liquidität „Betrag in EUR“ wählen und einen Wert setzen | Auswahl bleibt offen bedienbar und der absolute Wert wird angezeigt | ✅ |
| 2 | Zwischen Prozent und Betrag wechseln | Die bestehende Umrechnung bleibt stimmig; kein Rücksprung durch einen zweiten Eingabeaufruf | ✅ |
| 3 | Seite neu laden und Depot wechseln | Modus und Wert bleiben beim richtigen Depot erhalten | ✅ |
| 4 | Mindest-Handelsvolumen ebenso umschalten | Der gemeinsame Baustein verhält sich bei beiden Einstellungen gleich | ✅ |
| 5 | Auswahl per Tastatur und in schmaler Ansicht bedienen | Beschriftung, Fokus und Bedienung bleiben verständlich | ✅ |
| 6 | `make test`, `make lint`, `make typecheck` | Prüfungen bestehen; Browserbefund und Einschränkungen sind dokumentiert | ✅ |

### Abgrenzung

Keine Änderung an StockInfo, keine neue Berechnungsformel und keine
unbeauftragte Umstellung gespeicherter Entwicklungsdaten.

### Reviewer-Prüfung (Claude, Runde 1, Fassung `8ae20a6`)

**Technische Freigabe.** `make test` (56 Dateien, 735 Tests), `make lint` und
`make typecheck` selbst gegen die Übergabefassung ausgeführt — alle drei ohne
Befund. Seit dem Handoff-Commit betrafen die Folgecommits ausschließlich
Ticket-/Board-Dateien; der Produktstand war während der Prüfung stabil.

Diff `d38a8f5..8ae20a6` gelesen: `AmountSettingField.vue` ersetzt das
umschließende `<label>` durch ein `<div>` mit explizitem
`<label :for="inputId">` nur für das Zahlenfeld; die Auswahl bekommt
`role="group"` mit `aria-label` über den neuen i18n-Schlüssel
`settings.amountMode`. Root-Ursache nachvollzogen: Das implizite Label
umschloss zuvor beide Steuerelemente, ein Klick auf die Auswahl übertrug den
Fokus auf das erste labelfähige Kind (das Zahlenfeld) und schloss das Menü
sofort. Die Klassen in `<style scoped>` sind ausschließlich klassenbasiert;
der Wechsel von `<label>` (inline) zu `<div>` (block) hat keine
CSS-Auswirkung, da `.amount` über den `stack`-Mixin ohnehin `display: flex`
setzt. `tests/components/amountSettingField.spec.ts` ist eine echte
Regressionsprobe mit der echten Naive-Komponente (`.n-base-selection-label`,
`attachTo: document.body`): bestätigt, dass ein Klick auf die Auswahl keinen
Klick ans Zahlenfeld durchreicht, und dass `input.labels[0]` weiterhin auf
das Zahlenfeld zeigt.

Live im Browser (Testdienst Port 8899, App auf `:5189`) nachvollzogen: Klick
auf „% vom Gesamtwert“ hält das Menü offen, Auswahl von „Betrag in EUR“
übernimmt korrekt ohne Rücksprung; Wert 1000 gesetzt, Hinweis „Entspricht
derzeit € 1.000.“ erscheint; nach Reload bleiben Modus und Wert erhalten.
Per `input.labels`/`aria-describedby` direkt im DOM geprüft: beide
`AmountSettingField`-Instanzen (Mindest-Handelsvolumen, Sicherheitspuffer)
haben eindeutige, kollisionsfreie IDs (`useId()`) und korrekte
Label-Zuordnung. Tastaturbedienung (Pfeiltasten/Enter) und schmale Ansicht
wurden nicht erneut live nachgestellt, sondern anhand des Komponententests
und der Codex-Angabe als plausibel eingestuft.

**Ergebnis:** Fassung `8ae20a6` technisch freigegeben. Kein `changes_requested`.

### Auflösung

Fassung `8ae20a6` technisch freigegeben (Runde 1, `claude`). Mike hat am 2026-09-26 mit „T-45 ist OK und passt so“ abgeschlossen; Nachricht von Claude übernommen.

### Selbstprüfung · Codex · 2026-09-26

- Browser mit wiederverwendbarer Sicherung `tests/fixtures/browser/valid-portfolio.backup.json`:
  20 % Sicherheitspuffer bei 5.000 EUR Gesamtwert → 1.000 EUR; nach Reload erhalten.
  Mindest-Handelsvolumen 250 EUR → 5 % → per Pfeiltasten/Enter zurück auf 250 EUR.
  Zahlenfeld und Moduswahl erhalten getrennte Beschriftungen; Kontrolltext am Zahlenfeld
  über `aria-describedby`. Auswahl hat eine benannte Gruppe.
- Mobile 390 × 844: bedienbar, sichtbarer Fokus, beide Felder in einer Zeile,
  Dokumentbreite 390 px ohne horizontalen Überlauf. Screenshot selbst geprüft.
- Zweites USD-Depot über Oberfläche angelegt: eigene Nullwerte und „Betrag in USD“;
  Rückwechsel zum EUR-Testdepot geprüft. Keine Schreibänderung am Speicherpfad nötig.
- Regressionstest mit echter Naive-Komponente: vorher fehlerhafte gemeinsame
  Beschriftung nachgewiesen; danach eigene Zahlenbeschriftung, kein weitergereichter
  Zahlenklick und Umrechnung per Tastatur geprüft. jsdom braucht nur Browser-API-Ersatz
  für `matchMedia` und `scrollTo`; Live-Prüfung bestätigt den echten Fokusablauf.
- `make test`: 735 Tests in 56 Dateien bestanden. `make lint`, `make typecheck`
  und `make build`: erfolgreich. Vorhandener Hinweis auf großen vendor-ui-Chunk.
  `git diff --check` sauber; TS-Compiler-API-Inventar der angefassten TS/Vue-Bezeichner englisch.

**Doku-Abgleich:** Datei-/Überschrifteninventar von README, docs und unraid geprüft.
README „Minimum trade size“ erklärt gemeinsame Einheitenwahl und depotspezifische
Speicherung. „Safety buffer“ und „Portfolio base currency“ bleiben inhaltlich korrekt.
Historische docs und Container-/Unraid-Anleitungen brauchen für diese Bedienkorrektur
keine Anpassung.

**Lessons:** Lokales Inventar und SP-CX-01 bis SP-CX-04, Fassung 2026-09-11,
vor Umsetzung/Übergabe gelesen. SP-CX-02: aktuellen Ticket-/STATUS-Stand gemeinsam
fortgeschrieben. SP-CX-04: bestehendes Browserfixture und Testserver wiederverwendet.
Kein neues wiederholtes Fehlermuster behauptet.
**Konventionsabgleich:** Lokal `2026-09-11-activity-feed`, Skill
`2026-09-11-lessons-follow-through`. Allgemeine Übernahme der Lessons-Folgepflicht in
Workflow/Vorlagen bleibt für Mike bzw. ausdrücklich beauftragte Board-Pflege offen.
Rollen, Nutzerentscheidungen und Schreibgrenzen bleiben maßgeblich.
