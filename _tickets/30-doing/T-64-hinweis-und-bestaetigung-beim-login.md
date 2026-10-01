# T-64 · Hinweis zu Anlageentscheidungen beim Login bestätigen

**Auftrag von Mike, 2026-10-01:** Der Login-Dialog bekommt einen Hinweis,
dass die angezeigten Daten weder Handlungsempfehlung noch Anlageberatung
sind. Wer die App nutzt, prüft die Daten selbst und verantwortet seine
Entscheidungen. Den Hinweis bestätigt man mit einer Checkbox, bevor man sich
anmelden kann.

**Entscheidungen von Mike, 2026-10-01:**

- Eigenes Ticket, in der Kette nach T-62. Begonnen wird erst nach der
  Übergabe von T-62.
- Die Checkbox wird **bei jedem Login** bestätigt. Gespeichert wird nichts;
  ohne Haken bleibt **Anmelden** gesperrt. Bei bestehender Sitzung erscheint
  der Hinweis nicht.

## Für dich

| Frage | Prüfpunkt # | Handgriff | Dein Urteil | Human |
|---|---|---|---|---|
| A · Wortlaut | [1](#pruefpunkt-1) | Login-Seite öffnen und den Hinweis lesen | Passt der Text so, auch rechtlich nach deiner Prüfung? | |
| B · Pflicht-Checkbox | [2](#pruefpunkt-2) | Ohne Haken anmelden versuchen, dann mit Haken | Bleibt Anmelden ohne Haken gesperrt? | |

## Entwurf des Wortlauts

**Hinweis (Deutsch):**

> StockPortfolio rechnet mit deinen eigenen Eingaben und mit Kursdaten aus
> externen Quellen. Angezeigte Werte sowie Kauf- und Verkaufsbeträge dienen
> nur der Orientierung. Sie sind keine Anlageberatung, keine
> Handlungsempfehlung und keine Aufforderung zum Kauf oder Verkauf von
> Finanzinstrumenten. Kurse und berechnete Werte können verzögert,
> unvollständig oder fehlerhaft sein. Prüfe alle Angaben selbst, bevor du
> handelst. Deine Anlageentscheidungen triffst und verantwortest du selbst.

**Checkbox:** „Ich habe den Hinweis gelesen und treffe meine
Anlageentscheidungen eigenverantwortlich.“

**Englisch:** sinngleich zu übersetzen. Die Formulierung schließt an die
vorhandenen Hinweise aus T-58 an (`tradeNotice`, `about.use`, `method.limitsAdvice`).

## Rechtliche Einordnung

Keine Rechtsberatung. Geprüft wurde der Entwurf nur gegen übliche Muster und
die bekannten Grenzen. Die abschließende rechtliche Prüfung bleibt wie in
T-57 und T-58 bei Mike beziehungsweise MangoLila GmbH.

- **Anlageberatung:** Unter WAG 2018 und MiFID II ist Anlageberatung eine
  *persönliche Empfehlung* zu bestimmten Finanzinstrumenten. Die App rechnet
  aus den Zielen, die der Nutzer selbst eingibt. Der Hinweis stellt das klar,
  er ersetzt aber nicht, dass sich die App tatsächlich so verhält.
- **Kein pauschaler Haftungsausschluss:** Der Entwurf schließt bewusst keine
  Haftung aus. Gegenüber Verbrauchern ist ein Ausschluss für Vorsatz, grobe
  Fahrlässigkeit und Personenschäden nach österreichischem Recht
  (§ 6 Abs. 1 Z 9 KSchG) unwirksam; eine überzogene Klausel kann insgesamt
  unwirksam sein. Der Text informiert über Grenzen und Eigenverantwortung.
- **Checkbox:** Die Bestätigung bei jedem Login macht den Hinweis sichtbar.
  Sie ist keine Einwilligung im Sinn der DSGVO und wird nicht gespeichert.
  Ein Nachweis, wer wann bestätigt hat, entsteht damit ausdrücklich nicht.

## Umsetzung und technische Nachweise

| Repo | Umfang | GH-Issue |
|---|---|---|
| StockPortfolio | Login-Dialog in `frontend/src/auth/`, Texte in `frontend/src/i18n/` | — |

### Akzeptanzkriterien

- [ ] Der Hinweis steht im Login-Dialog über dem Knopf **Anmelden**, in
  Deutsch und Englisch.
- [ ] Ohne Haken ist **Anmelden** gesperrt; das gilt auch für Enter im Formular.
- [ ] Der Haken ist nach jedem Logout wieder leer.
- [ ] Setup- und Passwortwechsel-Dialog bleiben unverändert, sofern Mike
  nichts anderes festlegt.
- [ ] Bedienbar per Tastatur, Checkbox mit zugänglichem Namen; mobil lesbar.

### Verify

| # | Handgriff | Nachweis | AI |
|---|---|---|:--:|
| 1 | <a id="pruefpunkt-1"></a>Login-Seite in Deutsch und Englisch öffnen | Hinweis vollständig sichtbar, Wortlaut wie freigegeben | ➖ |
| 2 | <a id="pruefpunkt-2"></a>Ohne Haken per Klick und per Enter anmelden, dann mit Haken | Ohne Haken keine Anmeldung, mit Haken normaler Login | ➖ |
| 3 | `make test`, beide Lints und Typprüfungen, Doku-Abgleich | Ergebnisse dokumentiert | ➖ |

Legende: ✅ live bestätigt · ⚠️ mit Einschränkung · ◑ teilweise ·
➖ noch kein Live-Nachweis.

### Doku-Abgleich

Noch offen. Voraussichtlich betroffen: `README.md` (Login/Accounts) und
`docker/README.md` (erste Anmeldung).
