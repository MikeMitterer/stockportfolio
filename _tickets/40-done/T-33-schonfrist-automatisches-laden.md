# T-33 · Schonfrist beim automatischen Laden

| Repo | Status | Time-box | Scope | GH-Issue |
|---|---|---|---|---|
| root | done | ~30 min | Store + Views | — |

**Löst:** Jeder Wechsel zwischen Dashboard und Ausgleichen baute die Ansicht neu
auf und löste einen vollen Durchgang aus — n HTTP-Anfragen für Kurse, die zehn
Sekunden alt sein konnten.

---

**Abgeschlossen am 2026-09-10.** Mike hat T-31 bis T-34 im Observer-Chat
gemeinsam abgeschlossen: „Schließ ab und bereinige die Aussage“.
Es steht keine weitere Abnahme dieses Tickets an.

## Verify

Historischer Prüfstand vom 2026-08-19. Die Fußnoten nennen die tatsächlich
verwendete Prüfmethode; Originalantworten bleiben erhalten. Beim Abschluss
wurde keine neue Live-Prüfung durchgeführt. Spätere Ergänzungen durch die
anderen Tickets ersetzen keine ursprünglichen Prüfurteile.

Legende: ✅ live bestätigt · ⚠️ bestätigt mit Einschränkung (Fußnote) ·
◑ teilweise (Fußnote) · ➖ keine Live-Verifikation (nur Unit/Review).
`AI` = nur KI · `Human` = nur Mensch (nie überschreiben).

| # | Where | Look for | AI | Human |
|---|---|---|:--:|---|
| 1 | Netzwerk-Tab, Dashboard ↔ Ausgleichen wechseln | Beim zweiten Wechsel **keine** `GET /quote/…` mehr; auch kein Fortschrittsbalken | ✅¹ | |
| 2 | dito, „Aktualisieren" drücken | Läuft unverändert durch — die Frist gilt für den Klick nicht | ✅¹ | |
| 3 | Neue Position anlegen | Bekommt sofort ihren Kurs, trotz laufender Frist | ✅¹ | |
| 4 | Seite neu laden (F5) | **Ebenfalls kein Abruf**, solange die Kurse jünger als 60 Minuten sind — siehe Side-Effects | ➖² | |
| 5 | Nach über einer Stunde Ansicht wechseln | Wieder ein voller Durchgang samt Balken | ➖² | |
| 6 | Terminal | `npm run typecheck && npm run lint && npm run test && npm run build` | ✅³ | |

> ¹ **(CC):** Test-first, `tests/stores/quotes.spec.ts` — geladen wird ohne vorhandene Kurse, nicht erneut solange sie jung sind, wieder nach Ablauf der Frist, und trotz Frist, wenn einer Position der Kurs fehlt.
> ² **(CC):** Reine Sichtprüfung; #5 bräuchte eine Stunde Wartezeit oder eine kurzzeitig gesetzte Frist.
> ³ **(CC):** Am 2026-08-19 gelaufen: typecheck ✓, lint ✓, vitest 36 Dateien / 557 Tests ✓, build ✓.

### Kurz-Testblock

```bash
npm run dev     # #1–#5 unter http://localhost:5175/#/
npm run test    # #1, #2, #3, #6
```

---

## Details

### Kontext / Ziel

`loadQuotesIfStale(client, positions, maxAgeMinutes)` prüft zwei Dinge und lädt,
sobald **eines** zutrifft:

- Der letzte Abruf ist länger her als die Frist (`lastRefreshAt`).
- Einer Position fehlt ihr Kurs.

Die zweite Bedingung ist der Grund, warum es keine reine Zeitprüfung ist: Eine
gerade angelegte Position — oder eine, deren Abruf gescheitert ist — bliebe
sonst bis zum Ende der Frist ohne Wert. Cash bleibt außen vor, dafür gibt es nie
einen Kurs.

**Kein neuer Wert:** `settings.refresh.staleAfterMinutes` steht seit jeher im
Datenmodell mit Vorgabe 60 Minuten, wurde in `src/` aber nirgends ausgewertet —
eine tote Einstellung. Sie beschreibt genau diese Frage („ab wann gilt ein Kurs
als alt") und ist jetzt wirksam.

Umgestellt sind die beiden Auto-Load-Stellen: `DashboardView` und
`RebalancingView`. Unberührt bleiben der Klick auf „Aktualisieren" (immer, mit
`force`), der Einzel-Refresh, und die Abrufe nach dem Anlegen einer Position
oder dem Laden des Beispiel-Depots — dort werden die Kurse gerade gebraucht.

### Akzeptanzkriterien

- [x] Ansichtswechsel innerhalb der Frist löst keinen Abruf aus.
- [x] Fehlt ein Kurs, wird trotz Frist geladen.
- [x] Klick und Einzel-Refresh bleiben unberührt.
- [x] Kein zweiter Wert für dieselbe Frage.
- [x] Menschlicher Abschluss durch Mike am 2026-09-10; die zuvor offenen
  Einzelabnahmen werden nicht weiter angefordert. Keine einzelnen Prüfurteile ergänzt.

### Side-Effects

**F5 ist mit betroffen.** Seiten-Reload und Ansichtswechsel laufen durch
dieselbe Stelle (`onMounted`) und sind technisch nicht zu unterscheiden. Ein
Reload holt also ebenfalls keine Kurse mehr, solange die vorhandenen jünger als
die eingestellte Schonfrist (Vorgabe 60 Minuten) sind. Der Knopf bleibt der
Weg zum echten Refresh.

**Die Einstellung ist über [T-34](T-34-einstellungen-fuers-aktualisieren.md)
bedienbar.** Unter Einstellungen → Daten → „Kurse aktualisieren“ stehen der
Schalter für `autoOnLoad` und das Minutenfeld für `staleAfterMinutes` bereit.
Die Werte werden je Depot gespeichert; ein Bearbeiten der Sicherungsdatei ist
dafür nicht erforderlich. Die Verify-Matrix oben dokumentiert die damalige
Prüfung mit der Vorgabe von 60 Minuten.

### Auflösung

Abgeschlossen auf Mikes ausdrücklichen Auftrag vom 2026-09-10. Die Umsetzung
ist im aktuellen Code vorhanden; die damaligen Test- und Buildbelege stehen
oben. Keine offene Nacharbeit aus diesem Ticket dokumentiert.

**Doku-Abgleich:** Abschluss und Ablage der vier Tickets sowie ihre Verweise
in STATUS bereinigt. Die Schonfrist aus T-33 begrenzt automatische Abrufe und
damit die Fortschrittsanzeige aus T-31/T-32; ihre Bedienbarkeit ist durch T-34
erledigt. Keine Änderung am Produktverhalten; Produktanleitungen bleiben
unverändert.
