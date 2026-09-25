# T-45 · Betragsmodus in den Einstellungen bleibt nicht stehen

Unter **Einstellungen → Berechnung → Liquidität** lässt sich der
Sicherheitspuffer als Prozentwert bedienen. Beim Versuch, „Betrag in EUR“
auszuwählen, klappt die Auswahl laut Mike wieder zu und der Prozentmodus
bleibt stehen. So lässt sich ein fester Geldbetrag nicht zuverlässig setzen.

**Beispiel:** Ein Sicherheitspuffer von 1.000 EUR soll unabhängig vom
Depotwert gelten. Nach Auswahl von „Betrag in EUR“ muss das Zahlenfeld diesen
Betrag als Geldwert bearbeiten und die Auswahl nach einem Neuladen erhalten.

**Stand:** Von Mike am 2026-09-25 gemeldet und anschließend ausdrücklich
hinter T-44 in die Prioritätskette aufgenommen. Die Ursache ist noch nicht im
Browser nachgewiesen. `AmountSettingField.vue` umschließt derzeit
`NInputNumber` und `NSelect` gemeinsam mit einem HTML-`label`; dieser Aufbau
ist als möglicher Auslöser zu prüfen. Dieselbe Komponente bedient auch das
Mindest-Handelsvolumen. T-44 ist der aktive Auftrag. T-45 folgt danach,
T-45 liegt eingeplant unter `20-ready/` und startet keine parallele Umsetzung.

## Für dich

Keine weitere Entscheidung nötig. Nach der Umsetzung beide Modi beim
Sicherheitspuffer ausprobieren und prüfen, ob der gewählte Modus samt Betrag
nach einem Seitenneuladen erhalten bleibt. Die technische Prüfung und eine
konkrete Testadresse werden vor der Abnahme ergänzt.

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
| 1 | In Liquidität „Betrag in EUR“ wählen und einen Wert setzen | Auswahl bleibt offen bedienbar und der absolute Wert wird angezeigt | ➖ |
| 2 | Zwischen Prozent und Betrag wechseln | Die bestehende Umrechnung bleibt stimmig; kein Rücksprung durch einen zweiten Eingabeaufruf | ➖ |
| 3 | Seite neu laden und Depot wechseln | Modus und Wert bleiben beim richtigen Depot erhalten | ➖ |
| 4 | Mindest-Handelsvolumen ebenso umschalten | Der gemeinsame Baustein verhält sich bei beiden Einstellungen gleich | ➖ |
| 5 | Auswahl per Tastatur und in schmaler Ansicht bedienen | Beschriftung, Fokus und Bedienung bleiben verständlich | ➖ |
| 6 | `make test`, `make lint`, `make typecheck` | Prüfungen bestehen; Browserbefund und Einschränkungen sind dokumentiert | ➖ |

### Abgrenzung

Keine Änderung an StockInfo, keine neue Berechnungsformel und keine
unbeauftragte Umstellung gespeicherter Entwicklungsdaten.

### Auflösung

Offen. Technische Freigabe und Mikes Abschlussentscheidung werden getrennt
dokumentiert.
