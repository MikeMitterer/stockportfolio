# T-34 · Einstellungen fürs Aktualisieren bedienbar machen

| Repo | Status | Time-box | Scope | GH-Issue |
|---|---|---|---|---|
| root | in-progress | ~30 min | UI-only | — |

**Löst:** `refresh.autoOnLoad` und `refresh.staleAfterMinutes` standen im
Datenmodell, hatten aber kein Feld in den Einstellungen. Wer sie ändern wollte,
musste die Sicherung exportieren, die JSON anpassen und wieder einspielen.

---

## Verify

Legende: ✅ live bestätigt · ⚠️ bestätigt mit Einschränkung (Fußnote) ·
◑ teilweise (Fußnote) · ➖ keine Live-Verifikation (nur Unit/Review).
`AI` = nur KI · `Human` = nur Mensch (nie überschreiben).

| # | Where | Look for | AI | Human |
|---|---|---|:--:|---|
| 1 | `#/settings?tab=data` | Karte „Kurse aktualisieren" mit Schalter und Minuten-Feld, über dem Verlaufs-Zeitraum | ➖¹ | |
| 2 | dito | Schalter aus → das Minuten-Feld ist ausgegraut, sein Wert bleibt sichtbar | ➖¹ | |
| 3 | dito, Frist auf 1 stellen, Ansicht wechseln | Nach einer Minute wird wieder geladen (Balken oben, `GET /quote/…` im Netzwerk-Tab) | ➖¹ | |
| 4 | dito, Schalter aus, Ansicht wechseln | Gar kein Abruf mehr; „Aktualisieren" in der Kopfzeile geht weiterhin | ➖¹ | |
| 5 | dito, Wert ändern, Seite neu laden | Der Wert steht noch da — er liegt beim Depot, nicht im Speicher der Sitzung | ✅² | |
| 6 | Sprache auf Englisch | Überschrift, beide Beschriftungen und beide Hinweise erscheinen englisch | ✅³ | |
| 7 | Terminal | `npm run typecheck && npm run lint && npm run test && npm run build` | ✅⁴ | |

> ¹ **(CC):** Reine Sichtprüfung. Ein Mount-Test der ganzen `SettingsView` bräuchte alle Stores, Router und Naive-Provider — der Aufwand stünde in keinem Verhältnis zu zwei Feldern.
> ² **(CC):** `tests/stores/settings.spec.ts` prüft, dass beide Felder einzeln geändert werden können, ohne das jeweils andere zu verlieren, und dass sie den Neustart überstehen. Diese Tests waren sofort grün — sie sichern bestehendes Verhalten ab, sie haben es nicht getrieben.
> ³ **(CC):** Der Katalog-Test verlangt, dass beide Sprachen dieselben Schlüssel führen; dass die Sätze etwas Sinnvolles sagen, prüft er nicht.
> ⁴ **(CC):** Am 2026-08-19 gelaufen: typecheck ✓, lint ✓, vitest 37 Dateien / 560 Tests ✓, build ✓.

### Kurz-Testblock

```bash
npm run dev     # #1–#6 unter http://localhost:5175/#/settings?tab=data
npm run test    # #5, #7
```

---

## Details

### Kontext / Ziel

Die Karte steht im Reiter **„Daten"**, nicht in „Berechnung" — abweichend von
dem, was im Gespräch zuerst vorgeschlagen war. Der Grund fiel beim Ansehen der
Reiter auf: Kursbeschaffung bestimmt, **woher die Zahlen kommen**, nicht wie mit
ihnen gerechnet wird, und der nächstverwandte Wert — der Zeitraum der
Verlaufslinie — sitzt bereits dort. In „Berechnung" stünde sie zwischen Bändern
und Puffern, mit denen sie nichts zu tun hat.

Innerhalb der Karte steht der Schalter über der Frist, weil er darüber
entscheidet, ob sie überhaupt gilt; ist er aus, ist das Feld gesperrt, zeigt
seinen Wert aber weiter.

Beide Setter führen den bestehenden `refresh`-Stand mit — `patch` ersetzt den
Zweig als Ganzes, ein `{ refresh: { autoOnLoad } }` verlöre also die Frist.
Genau dagegen laufen die drei neuen Tests.

### Akzeptanzkriterien

- [x] Beide Felder sind in den Einstellungen bedienbar.
- [x] Der Wert überlebt einen Neustart und liegt beim Depot.
- [x] Das Minuten-Feld ist gesperrt, wenn der Schalter aus ist — zeigt aber weiter seinen Wert.
- [x] Beide Kataloge gepflegt, keine harten Texte.
- [ ] #1–#4, #6 vom Menschen gesehen.

### Side-Effects

Keine am Verhalten: Die Felder steuern, was T-33 bereits auswertet. Neu ist nur,
dass man sie erreicht.

Grenzen des Feldes: 1 bis 1440 Minuten, Schrittweite 15. Unter einer Minute
ergäbe die Frist keinen Sinn, über einem Tag wäre sie von „aus" nicht mehr zu
unterscheiden — dafür gibt es den Schalter.

### Auflösung

Wird zuletzt gefüllt. Commit-Hash(es), Lint-Status, Findings.
