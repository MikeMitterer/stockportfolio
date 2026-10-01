# T-71 · Keine Standard-Platzhalter in Eingabefeldern

**Warum dieses Ticket:** Eingabefelder ohne eigenen Platzhalter zeigen den
Standardtext von Naive UI: „Please Input“ / „Please Select“ bzw. „Bitte
ausfüllen“ / „Bitte auswählen“. Der Text steht direkt unter einer Beschriftung
wie „Username“, sagt nichts Neues und wirkt auf Login, Benutzerverwaltung und
den Screenshots aus T-68 unfertig. Mike, 2026-10-01: „Erstell ein Ticket und
ändere es gleich“.

**Beispiel:** Login vorher: Feld „Username“ mit grauem „Please Input“. Danach:
leeres Feld unter der Beschriftung. Felder mit eigenem Platzhalter bleiben
unverändert.

**Stand:** Umgesetzt in `509881e` auf `t-68-aktuelle-screenshots` und mit
T-68 Runde 2 an `codex-verifier` übergeben. Die neuen T-68-Screenshots zeigen
die Felder ohne Platzhalter.

Für dich steht jetzt nichts an.

## Umsetzung und technische Nachweise

| Repo | Time-box | Scope | GH-Issue |
|---|---|---|---|
| root (`frontend/`) | 1 h | Naive-Sprachpaket in App und Anmeldung | — |

**Inventar:** 28 Felder ohne eigenen Platzhalter (`NInput`, `NInputNumber`,
`NSelect`, `NDatePicker`) in `AuthRoot.vue`, `AddPositionDialog.vue`,
`AmountSettingField.vue`, `PortfolioManager.vue`, `PositionDrilldown.vue`,
`SettingsView.vue` und `UserAdminView.vue`. Statt jede Stelle einzeln zu
ändern, liefert ein eigenes Sprachpaket für `NConfigProvider` leere
Platzhalter für `Input`, `InputNumber` und `Select`. Datums- und
Zeitauswahl behalten ihren Hinweis, weil er das Format erklärt.

### Verify

| # | Lauf | Handgriff | Nachweis | woher | AI |
|---|:--:|---|---|---|:--:|
| 1 | <a id="pruefpunkt-1"></a>Unit | Felder unter dem App-Sprachpaket in `de` und `en` einhängen | Kein Standard-Platzhalter; ein eigener Platzhalter bleibt | Mike | ✅ `naiveLocale.spec.ts`, Gegenprobe ohne Paket rot |
| 2 | <a id="pruefpunkt-2"></a>Teststack | Login und Benutzerverwaltung ansehen (Screenshots aus T-68) | Leere Felder ohne „Please Input“ | Mike | ✅ Coder: `login.png`, `user-admin.png` aus `efc290f` |

### Akzeptanzkriterien

- [x] Eingabe- und Auswahlfelder ohne eigenen Platzhalter zeigen keinen Standardtext, in Deutsch und Englisch.
- [x] Ausdrücklich gesetzte Platzhalter bleiben sichtbar.

### Side-Effects

Betrifft alle Naive-Eingabefelder in App und Anmeldung; Datums- und
Zeitauswahl bleiben unverändert.

## Coder-Übergabe · Runde 1 · claude-coder · 2026-10-01

**Prüfstand:** `509881e1dea0022762d61999fa95480c2f076367` gegen `2a5e0bb`, auf `t-68-aktuelle-screenshots`
(kein eigener Branch: Der Root war auf T-68 ausgecheckt, und die T-68-Bilder
sollten den Stand ohne Platzhalter zeigen).

**Änderung:** `src/i18n/naiveLocale.ts` erzeugt mit `createLocale` aus
`deDE`/`enUS` Pakete mit leeren Platzhaltern für `Input`, `InputNumber` und
`Select`. `App.vue` und `AuthRoot.vue` übergeben sie an `NConfigProvider`
statt der Grundpakete. Alle übrigen Texte bleiben die des Grundpakets.

**Belege:** `tests/i18n/naiveLocale.spec.ts` (4 Tests): `de` und `en` ohne
Platzhalter für `NInput`/`NInputNumber`, eigener Platzhalter bleibt,
Grundtexte erhalten. Gegenprobe mit den Grundpaketen: 2 rot. `make test`
852 Frontend- und 20 API-Tests grün; Lint und Typecheck ohne Befund.
Sichtprüfung über die neu aufgenommenen Bilder `login.png` und `user-admin.png`.

**Doku-Abgleich:** Keine Anleitung nennt Platzhalter; unverändert.

**Lessons:** SI-P-02/12 angewendet (Inventar aller 28 Felder vor der
zentralen Lösung). Keine neue Lesson.
