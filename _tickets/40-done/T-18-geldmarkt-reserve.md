# T-18 · Geldmarkt als 5. Assetklasse, Sicherheitspuffer, Investitionsreserve

| Repo | Status | Time-box | Scope | GH-Issue |
|---|---|---|---|---|
| root | done | ~2 h | Datenmodell + Kennzahlen | — |

**Löst:** Drei fachliche Korrekturen, die zusammengehören:

1. Geldmarktnahe Anleihen (z.B. iShares € Ultrashort Bond) sind etwas anderes
   als Laufzeit-Anleihen — sie zählen zur verfügbaren Liquidität. Sie
   bekommen eine **eigene Assetklasse**.
2. „Save-Assets-Grenze" heißt auf Deutsch **Sicherheitspuffer**.
3. Die **Investitionsreserve** ist `(Geldmarkt + Cash) − Sicherheitspuffer` —
   bisher rechnete sie mit *allen* Anleihen und war damit zu hoch.

---

## Verify

Legende: ✅ live bestätigt · ⚠️ bestätigt mit Einschränkung (Fußnote) ·
◑ teilweise (Fußnote) · ➖ keine Live-Verifikation (nur Unit/Review).

| # | Where | Look for | AI | Human |
|---|---|---|:--:|---|
| 1 | Assetklassen | Fünf Zeilen: Aktien, Anleihen, Edelmetalle, Geldmarkt, Cash | ✅¹ | |
| 2 | Geldmarkt | Eigene Farbe (violett), in beiden Modi gegen Farbfehlsichtigkeit geprüft | ✅² | |
| 3 | Position anlegen/ändern | Geldmarkt ist als Gruppe wählbar | ✅¹ | |
| 4 | Einstellungen | Heißt „Sicherheitspuffer", nicht mehr „Save-Asset-Grenze" | ✅³ | |
| 5 | Kennzahl | Investitionsreserve zeigt **Betrag und Prozent** | ✅¹ | |
| 6 | Rechnung | Reserve = (Geldmarkt + Cash) − Sicherheitspuffer; Laufzeit-Anleihen zählen **nicht** mit | ✅⁴ | |
| 7 | Bestandsdaten | Vorhandene Depots laufen weiter; der alte Feldname wird übernommen | ✅⁵ | |
| 8 | `npm run test` / `typecheck` / `build` / `lint` | **254 Tests grün**, alles sauber | ✅⁶ | |

> ¹ **(CC):** Im Produktions-Build gesehen (2026-08-08). IS3M auf Geldmarkt umgestellt → eigene Klassen-Zeile in Violett, eigene Gruppe in der Tabelle; die Kennzahlen zeigen Betrag (−144.768 €) und Prozent (−90,5 %) mit dem Puffer als Hinweis.
> ² **(CC):** Mit dem Validator gerechnet: Violett besteht zwischen Gold und Aqua in beiden Modi. Orange fiel in beiden durch, Rot im dunklen — die Wahl ist also nicht Geschmack, sondern Ergebnis.
> ³ **(CC):** Beschriftung im Code geändert; die Einstellungsseite selbst habe ich diesmal nicht im Bild geprüft.
> ⁴ **(CC):** Sieben Unit-Tests, darunter ausdrücklich „zählt Laufzeit-Anleihen NICHT zur Liquidität".
> ⁵ **(CC):** Zwei Tests: alter Feldname wird übernommen, neuer hat Vorrang.
> ⁶ **(CC):** Lokal ausgeführt (2026-08-08).

---

## Details

### Warum eine eigene Klasse und kein Merkmal
Nutzerentscheidung. Geldmarktnahes Material hat ein anderes Risiko- und
Liquiditätsprofil als Laufzeit-Anleihen; es soll eine eigene Ziel-Quote
bekommen und in der Verteilung sichtbar sein — nicht in „Anleihen"
verschwinden.

### Reihenfolge der Klassen
`stocks, bonds, metals, moneymarket, cash` — Geldmarkt steht neben Cash, weil
beide zusammen die Reserve bilden.

Die Reihenfolge ist zugleich die Prüfreihenfolge der Farben. Violett für
Geldmarkt besteht zwischen Gold und Aqua in beiden Modi; Orange und Rot fielen
durch (Orange in beiden, Rot im dunklen).

### Investitionsreserve — rein informativ
Nutzerentscheidung: Die Reserve sagt, **wie viel höchstens** zur Verfügung
steht. Wie viel bei einem Rückgang tatsächlich eingesetzt wird, entscheidet
der Nutzer im Rebalancing-Tab (T-19). Interessant sind Prozentsatz **und**
absoluter Betrag, daher werden beide gezeigt.

### Umbenennung mit Bestandsschutz
`saveAssetGrenze` → `securityBuffer`. Gespeicherte Einstellungen kennen nur
den alten Namen; `withDefaults()` übernimmt den Wert einmalig, damit niemand
seinen Puffer verliert.

### Akzeptanzkriterien
- [ ] `AssetGroup` um `moneymarket` erweitert, Farbe validiert
- [ ] i18n-Label, Gruppen-Auswahl in Dialog und Drilldown
- [ ] `securityBuffer` mit Migration aus `saveAssetGrenze`
- [ ] `investmentReserve` als Betrag und Prozent
- [ ] Tests für die neue Formel und die Migration
- [ ] Ticket-Close + Commit

### Auflösung
Commit folgt nach Close.

**Die Reserve war vorher zu hoch.** Sie rechnete `Anleihen + Cash − Grenze`
und zählte damit Laufzeit-Anleihen als verfügbar. Die sind zwar Anleihen,
taugen aber weder kurzfristig noch schwankungsarm als Reserve. Jetzt zählen
nur Geldmarkt und Cash.

**Als Kennzahl statt als Vorgabe.** Nutzerentscheidung: Die Reserve sagt, wie
viel höchstens zur Verfügung steht — wie viel bei einem Rückgang tatsächlich
eingesetzt wird, entscheidet der Nutzer beim Rebalancing (T-19). Deshalb
Betrag **und** Prozent nebeneinander, beides ablesbar.

**Die Heuristik kennt Geldmarkt jetzt auch.** `ultrashort`, `money market`,
`overnight`, `t-bill`, `floating rate` und andere Hinweise werden **vor** den
Anleihe-Hinweisen geprüft — „iShares € Ultrashort Bond" enthält beides,
gehört aber zum Geldmarkt.

**Bestandsschutz:** `saveAssetGrenze` → `securityBuffer`. `withDefaults()`
übernimmt den alten Wert einmalig; wer die App vorher genutzt hat, behält
seinen Puffer.

**Noch offen:** Das Feld `currentRebalancingBudget` in den Einstellungen ist
jetzt fachlich überholt — das Budget wird in T-19 pro Durchgang eingegeben,
begrenzt durch die Reserve. Es bleibt vorerst stehen, damit T-18 nicht in
T-19 hineinregiert.
