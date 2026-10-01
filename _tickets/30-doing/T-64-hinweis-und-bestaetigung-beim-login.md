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

## Wortlaut

**Aktuelle Fassung (2026-10-01, nach Observer-Einschätzung, von Mike mit
„Ja, ändere den Text“ beauftragt):**

> StockPortfolio berechnet Depotwerte und Abweichungen aus deinen Beständen,
> deinen selbst festgelegten Zielen und Toleranzbändern sowie externen
> Kursdaten. Buy- und Sell-Hinweise, Kauf- und Verkaufsbeträge und
> Stückzahlen zeigen, welche Änderungen rechnerisch nötig wären, um diese
> Ziele zu erreichen. Die App prüft nicht, ob ein Geschäft oder ein
> Finanzinstrument für dich geeignet ist, und führt keine Orders aus. Kurse
> und Berechnungen können verzögert, unvollständig oder fehlerhaft sein.
> Prüfe Daten, Kosten und Risiken, bevor du handelst.

**Checkbox:** „Ich habe den Hinweis gelesen.“ Englisch sinngleich
(„I have read the notice.“).

**Abgleich mit dem Funktionsumfang:** Der Observer-Vorschlag wurde gegen die
tatsächlichen Ausgaben geprüft. Die App zeigt je Position den Status
**Buy**/**Sell** (`suggestion.buy`, `suggestion.sell`), Kauf- und Verkaufsbeträge in
den Depotgruppen, die Stückzahl bis zum Ziel (Δ-Spalte) und einen
Rebalancing-Plan mit Stückzahlen. Ziele und Toleranzbänder setzt der Nutzer
selbst; der Plan „rechnet, er bucht nicht“ (`method.planBody`). Gegenüber
dem Vorschlag ergänzt sind deshalb die Toleranzbänder, die Buy-/Sell-Hinweise
und die Stückzahlen. Mikes Bestätigung galt der Einschätzung; der exakte
Wortlaut ist weiter Teil seiner Abnahme.

**Frühere Fassung (ersetzt):** Der erste Entwurf erklärte die Angaben
pauschal zu „keine Anlageberatung, keine Handlungsempfehlung“ und endete mit
„Deine Anlageentscheidungen triffst und verantwortest du selbst“; die
Checkbox lautete „… treffe meine Anlageentscheidungen eigenverantwortlich“.
Gründe für den Ersatz stehen in der Observer-Einschätzung unten.

## Rechtliche Einordnung

*Bezieht sich auf die frühere Fassung; maßgeblich ergänzt durch die
Observer-Einschätzung unten.* Keine Rechtsberatung. Geprüft wurde der Entwurf nur gegen übliche Muster und
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

### Observer-Einschätzung zum Wortlaut · von Mike am 2026-10-01 bestätigt

Der Login-Hinweis erklärt die Daten- und Berechnungsgrenzen verständlich. Die
pauschale Aussage „keine Anlageberatung, keine Handlungsempfehlung“ entscheidet
aber nicht über die rechtliche Einordnung. Maßgeblich ist auch, dass die App
für einzelne Positionen „Kaufen“ und „Verkaufen“ mit Beträgen und Stückzahlen
anzeigt. Selbst festgelegte Zielanteile und eine rein rechnerische Ausgabe
sprechen gegen Beratung; die konkrete Darstellung muss dennoch mitgeprüft
werden. Ein Disclaimer kann eine tatsächlich persönliche Empfehlung nicht
umbenennen. Belege: [FMA zu automatisierter Beratung](https://www.fma.gv.at/kontaktstelle-fintech-sandbox/fintechnavigator/automated-advice-trading/)
und [ESMA zur Abgrenzung und zu Disclaimern](https://www.esma.europa.eu/sites/default/files/2023-07/ESMA35-43-3861_Supervisory_briefing_on_understanding_the_definition_of_advice_under_MiFID_II.pdf).

Für den Login-Text ist eine Beschreibung der tatsächlichen Funktion belastbarer:
Die App berechnet Abweichungen von selbst gesetzten Zielen, prüft keine Eignung
eines Geschäfts oder Instruments und führt keine Orders aus. Die Formulierung
„verantwortest du selbst“ sollte keine Freizeichnung für Fehler des Anbieters
nahelegen. Die Checkbox kann auf „Ich habe den Hinweis gelesen“ begrenzt werden;
ohne Speicherung belegt sie keine spätere Bestätigung. Mike hat diese
Einschätzung im Observer-Chat bestätigt. Die konkrete überarbeitete Fassung
und die UI-Ausgaben sind im bestehenden T-64-Umfang vor Abschluss abzugleichen;
damit ist noch keine technische Freigabe der neuen Fassung dokumentiert.

Vorschlag für den überarbeiteten Hinweis (Mikes Bestätigung gilt der
Einschätzung, nicht bereits dieser exakten Textfassung):

> StockPortfolio berechnet Depotwerte und Abweichungen aus deinen Beständen,
> deinen selbst festgelegten Zielen und externen Kursdaten. Angezeigte Kauf-
> und Verkaufsbeträge beschreiben, welche Änderungen rechnerisch zum Erreichen
> dieser Ziele nötig wären. Die App prüft nicht, ob ein Geschäft oder ein
> Finanzinstrument für dich geeignet ist, und führt keine Orders aus. Kurse
> und Berechnungen können verzögert, unvollständig oder fehlerhaft sein. Prüfe
> Daten, Kosten und Risiken, bevor du handelst.

Für die Checkbox ist „Ich habe den Hinweis gelesen“ vorgeschlagen. Dies ist
ein Einzelfall in T-64; daraus entsteht ohne zweites unabhängiges Beispiel oder
ausdrücklichen Lessons-Auftrag keine neue Lesson.

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
- `frontend/src/i18n/de.ts`, `en.ts`: Wortlaut wie oben unter „Wortlaut“,
  Englisch sinngleich. Erste Fassung nach der Observer-Einschätzung ersetzt;
  die Übergabe `6d6dbfd` wurde dafür vor Prüfbeginn zurückgenommen.
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
Hinweis per Checkbox bestätigt wurde“: neuer Hinweis („does not check whether
a trade or a financial instrument suits you“) und Checkbox-Text sichtbar, Checkbox
`aria-checked=false`, Knopf gesperrt, Submit ohne Haken ruft `/api/auth/login`
nicht auf; mit Haken genau ein Aufruf und Wechsel in die App. Vor der
Umsetzung rot. Der bestehende Login-Test setzt jetzt den Haken.

**Prüfstand (nach Layout-Nachtrag und neuem Wortlaut):** `make test` mit 829 Frontend- und 20 API-Tests grün; beide
Lints und beide Typprüfungen ohne Befund; Build grün (bekannte
Chunk-Warnung); `git diff --check` ohne Befund.

**Browser (neuer Wortlaut erneut aufgenommen):** Headless-Bilder der Login-Seite bei 1440 px (Deutsch, Englisch),
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

- `README.md` **Explanations inside the app**: Absatz beschreibt, was der
  Hinweis sagt (Abweichung von eigenen Zielen, rechnerische Kauf- und
  Verkaufswerte, keine Eignungsprüfung, keine Orders) und dass „I have read
  the notice“ je Login nötig und nicht gespeichert ist.
- `docker/README.md` Abschnitt zum ersten Start: ein Satz zur Bestätigung
  beim Login, gleiche Aussage. Hub-Vorschau: 10.558 Bytes, unter 25.000.
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

## Technische Prüfung Runde 1

`codex-verifier`, 2026-10-01, Übergabefassung
`fd9d8f4501c5c2185fb08d73fdfc0ada0d24fbdb`. Der nachfolgende
Übergabecommit änderte nur STATUS; der Produktstand blieb stabil.
**Technisch freigegeben.** Mikes Prüfung des genauen Wortlauts und die
menschliche Ticketabnahme bleiben offen.

**Eigene Prüfungen:** Login-Formular, Zustandswechsel und beide Sprachtexte im
Quellstand mit Auftrag und beschlossenem Layout abgeglichen. Der Hinweis wird
nur im Login-Zweig gezeigt; die Bestätigung wird nicht gespeichert, nach
erfolgreichem Login zurückgesetzt und beim Logout durch Neuladen erneut
verlangt. Der Submit-Handler blockiert Enter ohne Haken zusätzlich zum
gesperrten Knopf. Setup und Passwortwechsel verwenden eigene Formulare.
Die Token-Korrekturen und den neuen Wächter gegen die definierten Variablen
geprüft. `README.md` und `docker/README.md` stimmen bei Pflicht und fehlender
Speicherung überein; andere Anleitungen enthalten dazu keine betroffene
Aussage. Keine Board- oder Lessons-Konventionsänderung.

`make test` bestand mit 829 Frontend- und 20 API-Tests. Beide Lints, beide
Typprüfungen, `npm --prefix frontend run build` und `git diff --check
359041b..fd9d8f4` liefen mit Exitcode 0. Der Build meldete nur die bekannte
Warnung zur Größe des UI-Chunks.

**Eigener Browserlauf:** Vite aus dem T-64-Worktree auf `127.0.0.1:5177`,
Chrome mit simulierter Konto-API ohne echte Zugangsdaten. Bei 1440 und 800 px
stand der Hinweis neben den Feldern, bei 767 und 390 px darunter. Der Text
war vollständig sichtbar; horizontaler Überlauf trat nicht auf. Ohne Haken
waren Knopf und Enter gesperrt (null Login-Aufrufe), mit Haken erfolgte je
ein Login-Aufruf. Desktop- und Mobilansicht zusätzlich am Screenshot geprüft.

**Grenze:** Der Browserlauf verwendete eine simulierte API und belegt keinen
vollständigen Login gegen den T-62-Teststack. Coder-Bilder für Englisch und
die Tastaturbedienung wurden nicht als eigener Nachweis ausgegeben. Die
rechtliche Bewertung des Wortlauts ist nicht Teil dieser technischen Freigabe.

## Nachtrag: sichtbare Browserprüfung mit echtem Login

`claude-coder`, 2026-10-01, auf Mikes Auftrag. Layout und neuer Wortlaut
waren zuvor nur headless geprüft, der Login mit Haken nur im
Komponententest. Für einen echten Login lief der T-64-Stand (`fd9d8f4`) als
eigene Instanz: Frontend-Build, ausgeliefert von einer zweiten Konto-API auf
`127.0.0.1:8081` mit temporärer Datenbank und einem über `/api/setup`
angelegten Testkonto. Der T-62-Teststack auf `:5175`/`:8080` blieb
unberührt. (Ein Umschreiben des `Origin`-Headers im Browser wurde vorher
verworfen: Chrome lässt ihn nicht ändern, die API antwortete 403.)

Sichtbarer Lauf in Chrome, Fenster 80 px links, 1464 px breit:

- Desktop, Deutsch: Hinweis steht neben den Eingabefeldern; neuer Wortlaut
  und „Ich habe den Hinweis gelesen.“ sichtbar.
- Ohne Haken ist **Anmelden** gesperrt; Enter sendet keine Anmeldung
  (0 Login-Anfragen).
- Mit Haken frei; echter Login öffnet die App (genau 1 Login-Anfrage).
- Drittes Fenster, Englisch, 390 px (Geräte-Emulation): Hinweis unter den
  Feldern, englischer Wortlaut und Checkbox, kein waagrechter Überlauf.

Alle Prüfungen bestanden. Die Instanz auf `:8081` und ihre temporären Daten
werden nach Mikes OK zu den offenen Fenstern beendet und entfernt.

