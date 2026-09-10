# T-15 · Ziel-% in der Basiszeile ändern + Ziel-Summe absichern

| Repo | Status | Time-box | Scope | GH-Issue |
|---|---|---|---|---|
| root | done | ~2 h | Tabelle + Domain-Kennzahl | — |

**Löst:** Bestand und Ziel-% ließen sich nur im aufgeklappten Zustand ändern —
für die häufigste Änderung ein Umweg. Beide sind jetzt direkt in der
Tabellenzeile editierbar. Zusätzlich überwacht die App, dass die Ziel-Anteile
zusammen 100 % nicht überschreiten, und zeigt sonst einen roten Balken.

---

## Verify

Legende: ✅ live bestätigt · ⚠️ bestätigt mit Einschränkung (Fußnote) ·
◑ teilweise (Fußnote) · ➖ keine Live-Verifikation (nur Unit/Review).

| # | Where | Look for | AI | Human |
|---|---|---|:--:|---|
| 1 | Positions-Tabelle | Klick auf einen Ziel-Wert öffnet ein Eingabefeld direkt in der Zeile | ✅¹ | |
| 2 | Positions-Tabelle | Dasselbe für den Bestand | ✅² | |
| 3 | Eingabe → Klick daneben | Wert wird übernommen, Marktwert/IST-%/Delta/Status rechnen neu | ✅¹ | |
| 4 | Eingabe → Enter | Wert wird übernommen | ⚠️³ | |
| 5 | Eingabe → Escape | Eingabe wird verworfen | ➖⁴ | |
| 6 | Feld leeren → wegklicken | Wert bleibt stehen, wird **nicht** auf 0 gesetzt | ➖⁴ | |
| 7 | Ziel-Summe ≤ 100 % | Balken blau (unter 100) bzw. grün (genau 100), kein Banner | ✅¹ | |
| 8 | Ziel-Summe > 100 % | Balken rot mit „über 100 %", Fehlerbanner, alle Ziel-Zellen rot | ✅¹ | |
| 9 | Add-Dialog | Zeigt den noch freien Ziel-Anteil und warnt beim Überschreiten | ➖⁵ | |
| 10 | `npm run test` / `typecheck` / `build` / `lint` | **201 Tests grün**, alles sauber | ✅⁶ | |

> ¹ **(CC):** Im Browser mit echter Bedienung geprüft (2026-08-08) — VGWL von 80 auf 40 geändert: Ziel-Summe fiel von 122 % auf 82 %, Balken wechselte von Rot auf Blau, Banner verschwand, Ziel-Zellen nicht mehr rot. Gruppen-Balken und Vorschläge rechneten mit.
> ² **(CC):** Gleicher Mechanismus (dieselbe Komponente, andere Spalte); die Bestand-Zelle habe ich nur geöffnet gesehen, nicht bis zum Übernehmen durchgespielt.
> ³ **(CC):** Über einen synthetischen Tastendruck mit `key: "Enter"` verifiziert (Wert kam im Store an) **und** als Unit-Test abgedeckt. Mit dem Browser-Werkzeug **nicht** prüfbar: dessen Return-Taste sendet `key: ""`, `keyCode: 0` — ein echter Browser sendet `key: "Enter"`. Bitte im Alltag gegenprüfen.
> ⁴ **(CC):** Nur als Unit-Test abgedeckt, nicht im Browser.
> ⁵ **(CC):** Der Dialog bekam die Warnung schon in T-10; unverändert übernommen, hier nicht erneut geprüft.
> ⁶ **(CC):** Lokal ausgeführt (2026-08-08).

---

## Details

### Umsetzung
- `src/domain/rebalancing.ts` — `targetPercentSum()` als reine Funktion,
  `targetPercentSum` und `targetsExceeded` im `RebalancingResult`. Ein
  Rundungsrest bis 0,001 %-Punkte gilt nicht als Fehler (33,34 × 3 = 100,02
  soll nicht als Konfigurationsfehler durchgehen — dieser Fall ist getestet).
- `src/components/InlineNumber.vue` — sieht im Ruhezustand wie Text aus, wird
  erst beim Klick zum Feld. Ein Eingabefeld je Zelle hätte die Tabelle mit
  Rahmen überzogen.
- `src/components/TargetAllocationBar.vue` — schmaler Balken in der
  Positionen-Überschrift; blau unter 100 %, grün bei genau 100 %, rot darüber.
- Bei überzogener Summe färben sich **alle** Ziel-Zellen rot, nicht einzelne:
  der Fehler liegt in der Summe, nicht in einer Zeile.

### Zwei Fehler, die dabei ans Licht kamen

**1. Jede Eingabe wurde verschluckt.** Bei `<input type="number">` wandelt Vues
`v-model` den Wert selbsttätig in eine **Zahl** um. Der Code rief darauf
`.replace(',', '.')` auf — `.replace` gibt es auf Zahlen nicht, die Ausnahme
flog, und der Emit wurde nie erreicht. Nach außen sah es so aus, als spränge
die Zelle grundlos auf den alten Wert zurück; in der Konsole stand
„Unhandled error during execution of native event handler".

Das war nicht durch Nachdenken zu finden — erst die Browser-Konsole hat es
gezeigt. Drei Vermutungen vorher (Event-Dispatch, Emit-Verdrahtung,
Keydown-Modifier) waren alle falsch.

**2. Ein geleertes Feld hätte den Wert auf 0 gesetzt.** `Number('')` ist 0.
Wer den Bestand markiert, löscht und wegklickt, hätte die Position stillschweigend
genullt. `parseDraft()` liefert für leere Eingaben jetzt `NaN`, und der Commit
unterbleibt. Aufgefallen ist das erst durch die Unit-Tests.

### Nebenbei geändert
Die beiden `@keydown.enter` / `@keydown.esc`-Handler sind durch einen einzigen
expliziten Handler ersetzt. Sie waren nicht die Fehlerursache (beide waren
korrekt als Array registriert), aber ein Handler, der den Tastennamen selbst
prüft, ist hier leichter zu lesen.

Die Überschrift der Positionen-Sektion sagt jetzt „Bestand und Ziel sind direkt
änderbar" statt „Klick auf eine Zeile öffnet Details" — Letzteres stimmte
ohnehin nicht, aufgeklappt wird über den Pfeil.
