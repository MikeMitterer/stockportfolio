# T-66 · Status-Badges „Below / Above / OK“ statt „Buy / Sell / OK“

**Auftrag von Mike, 2026-10-01**, über `codex-observer` (INBOX-Nachricht
„Mikes Nachtrag zu T-64“, geprüfte Fassung `fd9d8f4`; hier vollständig
übernommen, die Nachricht ist damit verarbeitet):

- Die Buy-/Sell-Beschriftungen der Status-Badges heißen in **beiden Sprachen**
  genau `Below` / `Above` / `OK`. Es sind Anzeigen, keine Order-Buttons.
- Die drei Texte bleiben fest im i18n-Katalog; kein `.env`- oder
  Laufzeit-Override.
- Nur sichtbare Status-Beschriftungen und ihre Erklärungen anpassen; keine
  fachliche Berechnung und keine internen Bezeichner allein wegen der
  Wortwahl ändern.
- Gesondert eingeplant; T-65 bleibt eine reine Board-Prüfung.

**Einordnung in die Kette:** nach T-65. STATUS führt ein aktives Ticket;
T-66 beginnt nach Freigabe oder Rückgabe von T-65.

## Für dich

| Frage | Prüfpunkt # | Handgriff | Dein Urteil | Human |
|---|---|---|---|---|
| A · Badges | [1](#pruefpunkt-1) | Dashboard in Deutsch und Englisch öffnen | Stehen dort `Below` / `Above` / `OK`? | |
| B · Erklärungen | [2](#pruefpunkt-2) | Fragezeichen, Methodenseite und Login-Hinweis lesen | Erklären sie die Anzeigen richtig, auch Kalendertermin und Mindesthandel? | |

## Umfang

1. **Badges:** `suggestion.buy`/`suggestion.sell` in `de.ts` und `en.ts`
   zeigen `Below`/`Above`; `OK` bleibt. Der Kommentar zur Wortwahl im
   Katalog wird angepasst. Schlüssel und Werte der Logik (`buy`, `sell`)
   bleiben unverändert.
2. **Erklärungen präzise halten** (Beleg des Observers):
   `frontend/src/domain/rebalancing.ts` kann bei einem fälligen
   Kalendertermin anhand des **Zielwerts** statt des Toleranzbands
   `buy`/`sell` liefern; `applyMinTrade` kann eine Abweichung außerhalb des
   Bands als `OK` mit `min`-Markierung zeigen. Texte und Hilfen müssen beides
   korrekt erklären; `OK` darf nicht pauschal „innerhalb der Grenzwerte“
   heißen.
3. **T-64-Login-Hinweis nachziehen** (noch nicht menschlich abgenommen): Die
   Statusanzeige `Below`/`Above` beschreibt die Abweichung von selbst
   gesetzten Zielen beziehungsweise Grenzwerten; rechnerische Kauf- und
   Verkaufsbeträge sowie Stückzahlen bleiben als solche benannt. Kern
   beibehalten: keine Eignungsprüfung, keine Orders, mögliche Kurs- und
   Rechenfehler, Checkbox „Ich habe den Hinweis gelesen.“
4. **Alle sichtbaren Erläuterungen** in `de`/`en` und die einschlägige
   Dokumentation inhaltlich abgleichen. Echte Handelsbegriffe für berechnete
   Transaktionen (Plan, Kauf-/Verkaufsbeträge, Stückzahlen) **nicht blind
   ersetzen**. Ausgangsinventar: `method`-Texte zu den Bändern
   („springt der Status auf Buy oder Sell“), `investmentNotice`,
   Kommentar zu `suggestion`, Screenshots in README/Docker-Hub/Unraid prüfen.

**Ausdrücklich nicht beauftragt:** Rückzug oder Neuveröffentlichung der
Apps. Der Observer empfiehlt Mike, die veröffentlichten Apps wegen dieser
Wortwahl nicht zurückzuziehen; daraus folgt weder ein
Veröffentlichungsauftrag noch eine rechtliche Freigabe.

## Verify

| # | Handgriff | Nachweis | AI |
|---|---|---|:--:|
| 1 | <a id="pruefpunkt-1"></a>Dashboard und Rebalancing in `de`/`en` | Badges `Below`/`Above`/`OK`, keine Buy/Sell-Badges mehr | ➖ |
| 2 | <a id="pruefpunkt-2"></a>Hilfen, Methodenseite, Login-Hinweis lesen | Kalendertermin und Mindesthandel (`min`) korrekt erklärt; Handelsbegriffe nur für berechnete Transaktionen | ➖ |
| 3 | Inventar aller sichtbaren `Buy`/`Sell`-Vorkommen und betroffenen Doku | Jede Fundstelle geändert oder begründet belassen | ➖ |
| 4 | `make test`, beide Lints und Typprüfungen, Build, sichtbarer Browserlauf | Ergebnisse dokumentiert | ➖ |

Legende: ✅ live bestätigt · ⚠️ mit Einschränkung · ◑ teilweise ·
➖ noch kein Nachweis.

### Doku-Abgleich

Noch offen. Voraussichtlich `README.md`, `docker/README.md`,
`unraid/README.md` (Texte und Screenshots), Methodenseite.

### Lessons-Einordnung

Noch keine Befunde.
