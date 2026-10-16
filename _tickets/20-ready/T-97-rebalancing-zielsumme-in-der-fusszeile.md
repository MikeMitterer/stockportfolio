# T-97 · Rebalancing: Summe der Ziele in der Fußzeile zeigen

**Warum dieses Ticket:** Auf der Rebalancing-Seite lassen sich sowohl die
Spalte _Ziel %_ als auch _Kauf / Verkauf_ probeweise ändern. Für Kauf und
Verkauf beantwortet die letzte Tabellenzeile „Geht der Plan auf?“ mit Betrag
und Satz („Käufe und Verkäufe gleichen sich aus“, „… bleiben übrig“, „…
kommen aus der Reserve“). Für die Ziele fehlt eine solche Stelle: Wer Ziele
anpasst, sieht in der Tabelle nicht, ob sie zusammen 100 % ergeben und wie
weit sie darüber oder darunter liegen.

Die Warnung „Ziele ergeben nicht 100 %“ gibt es zwar als Toast
(`targetSumOff` in `frontend/src/views/RebalancingView.vue`), sie ist aber
nicht dort, wo getippt wird, und zeigt keine laufende Summe, solange sie
stimmt. Mike: „bei den Zielwerten in % gibt es das nirgends“.

**Beispiel:** Bisher: Mike hebt ein Ziel von 20 % auf 23 % und senkt ein
anderes von 10 % auf 8 %. Ob die Ziele jetzt 101 % ergeben, muss er im Kopf
nachrechnen. Danach: In der Fußzeile steht unter _Ziel %_ die Summe
`101,0 %` mit Abweichung `+1,0 %`, farblich als „über 100 %“ erkennbar; nach
einer weiteren Korrektur auf 100,0 % zeigt sie den ausgeglichenen Zustand.

**Stand:** Auf Mikes Auftrag vom 2026-10-16 in `20-ready/` angelegt. Noch
nicht aktiviert, kein Branch, keine Umsetzung. Der zuständige Coder aktiviert
es nach `30-doing/` mit eigenem Branch und STATUS-Zuordnung.

Für Mike steht derzeit keine Entscheidung an; die Sichtprüfung folgt nach der
Umsetzung ([Prüfpunkt 1](#pruefpunkt-1)).

## Für dich

### Noch offen

Nach der Umsetzung im Teststack mit `--demo-accounts`
(`.venv/bin/python scripts/stockinfo-test-server.py --stack --run --demo-accounts --stockinfo-root ../StockInfo`),
Seite _Rebalancing_.

| Frage | Prüfpunkt # | Lauf | Handgriff | Dein Urteil | Human |
|---|---|:--:|---|---|---|
| A | [1](#pruefpunkt-1) | Teststack | Mehrere Ziele ändern, bis die Summe über, unter und genau auf 100 % liegt | Ist die Zielsumme in der Fußzeile so schnell ablesbar wie die Bilanz von Kauf / Verkauf? | |

## Umsetzung und technische Nachweise

| Repo | Time-box | Scope | GH-Issue |
|---|---|---|---|
| frontend | klein | UI-only: Fußzeile der Rebalancing-Tabelle, i18n DE/EN, Nutzerdoku | — |

### Kontext / Ziel

- **Ort:** Die bestehende Fußzeile (`<tfoot>`, „Geht der Plan auf?“) bekommt
  in der Spalte _Ziel %_ die Summe aller Ziele, also
  `plan.targetSum` aus `frontend/src/domain/tradePlan.ts` einschließlich
  probeweise geänderter Werte. Die Zelle steht genau unter der Zielspalte;
  das heutige `colspan="7"` des Labels wird dafür aufgeteilt. Der Satz zur
  Geldbilanz bleibt unverändert.
- **Inhalt:** Summe in Prozent und die Abweichung von 100 % mit Vorzeichen
  (Prozentpunkte). Bei 100 % (Toleranz wie `targetSumOff`, 0,01) ein
  ausgeglichener Zustand analog zu „geht auf“; sonst als über oder unter
  100 % erkennbar, mit denselben Farbklassen wie die Bilanzzelle. Ob die
  Abweichung als zweite Zeile, Tooltip oder kurzer Satz erscheint, wählt der
  Coder nach `ux-conventions` und begründet es im Ticket.
- **Toast:** Die vorhandene Warnung „Ziele ergeben nicht 100 %“ bleibt. Ihre
  Zahl und die Fußzeile verwenden dieselbe Quelle und Formatierung.
- **Leeres Depot:** Wie beim Toast keine Abweichungsmarkierung, solange das
  Depot keine Bestände hat.
- **Schmale Bildschirme:** Die Zelle muss unter 890 px im waagrechten
  Scrollbereich mitlaufen, wie die übrigen Fußzeilenzellen.
- **i18n:** neue Texte in `frontend/src/i18n/de.ts` und `en.ts`.
- **Dashboard:** Auch dort sind Ziele änderbar. Ob die Positionstabelle
  dieselbe Summe braucht, gehört nicht zu diesem Ticket; der Coder prüft den
  Ist-Zustand und nennt im Ticket, ob ein Folgeticket sinnvoll ist.

### Verify

Legende: ✅ live bestätigt · ⚠️ bestätigt mit Einschränkung (Fußnote) ·
◑ teilweise (Fußnote) · ➖ keine Live-Verifikation (nur Unit/Review).
`AI` = nur KI; menschliche Antworten stehen oben.

| # | Lauf | Handgriff | Nachweis | woher | AI |
|---|:--:|---|---|---|:--:|
| 1 | Teststack | <a id="pruefpunkt-1"></a>Ziele so ändern, dass die Summe über, unter und genau auf 100 % liegt; sichtbarer Browser, DE und EN | Fußzeile zeigt unter _Ziel %_ jeweils Summe und Abweichung, Zustand farblich unterscheidbar; Wert stimmt mit dem Toast überein | Mike | ➖ |
| 2 | Unit | <a id="pruefpunkt-2"></a>Komponententest der Fußzeile mit Summen 99, 100 und 101 % sowie leerem Depot | Erwartete Texte und Klassen; leeres Depot ohne Abweichungsmarkierung | Ticket | ➖ |
| 3 | Gegenprobe | <a id="pruefpunkt-3"></a>Zelle testweise an `targetSum` vorbei verdrahten (z. B. nur gespeicherte statt probeweise Ziele) | Test aus Prüfpunkt 2 wird rot | Board-Workflow | ➖ |
| 4 | Browser | <a id="pruefpunkt-4"></a>Ablauf als wiederverwendbarer Schritt in einem Skript unter `frontend/scripts/` mit geprüftem Inhalt | Skript endet mit Exit 0, bei falscher Summe mit Exit 1 | AGENTS.md · Browserprüfung | ➖ |
| 5 | Pflicht | <a id="pruefpunkt-5"></a>`make test`, Lint und Typecheck beider Pakete | Dokumentierter Exit-Code 0 | Projektregeln | ➖ |

### Akzeptanzkriterien

- [ ] Die Fußzeile der Rebalancing-Tabelle zeigt unter _Ziel %_ die Summe
      aller (auch probeweise geänderten) Ziele.
- [ ] Abweichung von 100 % ist mit Vorzeichen ablesbar; über, unter und
      genau 100 % sind unterscheidbar.
- [ ] Toast und Fußzeile nennen dieselbe Summe.
- [ ] Texte in DE und EN; Nutzerdoku nachgezogen.

### Side-Effects

Der Screenshot `docs/images/rebalancing.png` zeigt die Fußzeile; `make
docs-check` meldet ihn nach der Änderung als veraltet. Neu aufnehmen oder
begründet quittieren.

**Doku-Abgleich:** bei Umsetzung `docs/user-guide.md`, Abschnitt
„Rebalancing-Simulation“, um die Zielsumme ergänzen; `README.md`,
`README.de.md` und `docker/README.md` per Inventar prüfen und Ergebnis
nennen. Board-Konventionen bleiben unverändert; im Skill
`task-verification-workflow` ist keine Übernahme nötig.
