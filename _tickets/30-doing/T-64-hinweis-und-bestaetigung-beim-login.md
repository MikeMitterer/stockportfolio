# T-64 · Hinweis zu Anlageentscheidungen beim Login bestätigen

**Auftrag von Mike, 2026-10-01:** Der Login-Dialog bekommt einen Hinweis,
dass die angezeigten Daten weder Handlungsempfehlung noch Anlageberatung
sind. Wer die App nutzt, prüft die Daten selbst und verantwortet seine
Entscheidungen. Den Hinweis bestätigt man mit einer Checkbox, bevor man sich
anmelden kann.

**Stand am 2026-10-01:** Umgesetzt von `claude-coder` auf Branch
`t-64-hinweis-und-bestaetigung-beim-login` im Worktree
`/private/tmp/stockportfolio-t64`, aufbauend auf dem freigegebenen T-62-Stand,
und an `codex-verifier` übergeben. Der Wortlaut entspricht dem Entwurf unten;
Mikes rechtliche Prüfung steht aus.

**Für dich:** Die Login-Seite dieses Stands läuft zur Ansicht unter
`http://127.0.0.1:5176` (eigener Vite-Server aus dem T-64-Worktree, nutzt die
Konto-API des T-62-Teststacks). Anmelden selbst klappt dort nicht, weil die
API nur die Herkunft `:5175` zulässt; den Login-Ablauf belegt der Test unten.
Das sichtbare Prüffenster bleibt bis zu deinem OK offen.

**Entscheidungen von Mike, 2026-10-01:**

- Eigenes Ticket, in der Kette nach T-62. Begonnen wird erst nach der
  Übergabe von T-62.
- Layout (Nachtrag 2026-10-01): Mobil bleibt der Hinweis unter den
  Eingabefeldern; auf dem Desktop steht er daneben.
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

- [x] Der Hinweis steht im Login-Dialog über dem Knopf **Anmelden**, in
  Deutsch und Englisch.
- [x] Ohne Haken ist **Anmelden** gesperrt; das gilt auch für Enter im Formular.
- [x] Der Haken ist nach jedem Logout wieder leer.
- [x] Setup- und Passwortwechsel-Dialog bleiben unverändert, sofern Mike
  nichts anderes festlegt.
- [x] Bedienbar per Tastatur, Checkbox mit zugänglichem Namen; mobil lesbar.

### Verify

| # | Handgriff | Nachweis | AI |
|---|---|---|:--:|
| 1 | <a id="pruefpunkt-1"></a>Login-Seite in Deutsch und Englisch öffnen | Hinweis vollständig sichtbar, Wortlaut wie freigegeben | ⚠️ |
| 2 | <a id="pruefpunkt-2"></a>Ohne Haken per Klick und per Enter anmelden, dann mit Haken | Ohne Haken keine Anmeldung, mit Haken normaler Login | ◑ |
| 3 | `make test`, beide Lints und Typprüfungen, Doku-Abgleich | Ergebnisse dokumentiert | ✅ |

Legende: ✅ live bestätigt · ⚠️ mit Einschränkung · ◑ teilweise ·
➖ noch kein Live-Nachweis.

### Umsetzung (`claude-coder`, 2026-10-01)

- `frontend/src/auth/AuthRoot.vue`: Im Login-Formular stehen unter dem
  Passwort der Hinweis (`auth.investmentNotice`) und eine `NCheckbox` mit
  `aria-describedby` auf den Hinweis. **Anmelden** ist ohne Haken gesperrt;
  `submitLogin` prüft den Haken zusätzlich, weil Enter im Formular den
  Knopf umgeht. Nach erfolgreichem Login wird der Haken zurückgesetzt; ein
  Logout lädt die Seite ohnehin neu. Nichts wird gespeichert. Setup,
  Passwortwechsel und Altbestand sind unverändert.
- `frontend/src/i18n/de.ts`, `en.ts`: Wortlaut wie im Entwurf, Englisch
  sinngleich.
- **Layout nach Mikes Nachtrag:** Unter 768 px (`md`) stehen Felder, Hinweis,
  Haken und Knopf untereinander. Ab `md` wird das Login-Panel bis 54 rem
  breit; links die Felder, rechts der Hinweis, darunter über die ganze
  Breite Haken und Knopf (CSS-Grid mit benannten Bereichen). Setup und
  Passwortwechsel behalten die schmale Breite. Die erste Übergabe
  (`1eab2fd`) wurde dafür vor Prüfbeginn zurückgenommen.
- **Scout Rule (SP-R-04):** `var(--space-5)` existiert im Fundament nicht
  (Abstände 1, 2, 3, 4, 6, 8); der Browser verwarf die Regeln still. Betroffen
  waren der neue Abstand unter der Checkbox, `.legacy-list` in `AuthRoot.vue`
  (aus T-61) und die Ladeplatzhalter in `DashboardView.vue` (aus T-62, dort
  auch das ebenfalls fehlende `--radius-md`). Ersetzt durch `--space-4`,
  `--space-6` und `--radius-sm`. Neuer Wächter
  `frontend/tests/designTokens.spec.ts` prüft jede `var(--…)`-Verwendung
  unter `src/` gegen die Definitionen im Fundament und in `src/`; vor der
  Korrektur meldete er genau diese vier Stellen.

**Tests:** `frontend/tests/authRoute.spec.ts` „meldet erst an, nachdem der
Hinweis per Checkbox bestätigt wurde“: Hinweis sichtbar, Checkbox
`aria-checked=false`, Knopf gesperrt, Submit ohne Haken ruft `/api/auth/login`
nicht auf; mit Haken genau ein Aufruf und Wechsel in die App. Vor der
Umsetzung rot. Der bestehende Login-Test setzt jetzt den Haken.

**Prüfstand (nach Layout-Nachtrag):** `make test` mit 829 Frontend- und 20 API-Tests grün; beide
Lints und beide Typprüfungen ohne Befund; Build grün (bekannte
Chunk-Warnung); `git diff --check` ohne Befund.

**Browser:** Headless-Bilder der Login-Seite bei 1440 px (Deutsch, Englisch),
800 px und 767 px (je Deutsch, direkt über und unter `md`) und 390 px: ab
800 px zwei Spalten mit dem Hinweis neben den Feldern, bei 767 und 390 px
untereinander; Hinweis überall vollständig lesbar.
Tastatur: Die Checkbox ist per Tab erreichbar, Leertaste setzt den Haken und
gibt **Anmelden** frei. Sichtbarer Lauf in Chrome (Deutsch): ohne Haken
gesperrt, Enter ohne Haken bleibt auf der Login-Seite, mit Haken frei.
**Grenze:** Ein vollständiger Login mit Haken wurde im Browser nicht
ausgeführt, weil die Konto-API nur die Herkunft `:5175` des T-62-Stacks
zulässt; der Login-Ablauf ist durch den Komponententest belegt. Die
Englisch-Ansicht ist nur headless geprüft.

### Doku-Abgleich

Inventar: `README.md`, `docker/README.md`, `unraid/README.md`, `AGENTS.md`,
`docs/`, Unraid-Vorlage.

- `README.md` **Explanations inside the app**: Absatz zum Hinweis und zur
  Bestätigung bei jedem Login, ohne Speicherung.
- `docker/README.md` Abschnitt zum ersten Start: ein Satz zur Bestätigung
  beim Login. Gemeinsame Aussage beider READMEs stimmt überein.
  Hub-Vorschau: 10.542 Bytes, unter 25.000.
- `AGENTS.md` **Wächter-Tests**: Tabelle um `designTokens.spec.ts`
  ergänzt, „Vier“ → „Fünf“.
- `unraid/README.md`, Unraid-Vorlage, `docs/`: keine Aussage zum Login-Ablauf
  betroffen; unverändert.
- Keine Board- oder Lessons-Konventionsänderung.

### Lessons

Gelesen: alle lokalen Lessons unter `.agents/lessons/` (Stand 2026-10-01).
Einschlägig: SP-R-04 (fehlende Tokens als still ausfallende Regeln behoben
und mit Wächter abgesichert), SP-CX-05 (Hinweis an den vorhandenen
T-58-Formulierungen ausgerichtet), SP-R-02 (Browsergrenzen oben getrennt
benannt). Kein neuer Eintrag.
