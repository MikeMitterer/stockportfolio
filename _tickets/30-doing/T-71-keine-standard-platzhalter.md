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

**Stand:** `509881e` ist durch `codex-verifier` technisch freigegeben, im
gemeinsamen T-68-Übergabestand `efc290f` auf `t-68-aktuelle-screenshots`.
Mikes Abnahme und der Ticketabschluss stehen aus. Die neuen T-68-Screenshots
zeigen die Felder ohne Standard-Platzhalter.

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

## Unabhängige Prüfung · Runde 1 · `codex-verifier` · 2026-10-01

**Prüffassung:** T-71-Commit `509881e1dea0022762d61999fa95480c2f076367`
gegen `2a5e0bb`, gemeinsam übergeben mit T-68 auf `efc290f`; bis zum
Review-HEAD `84580e9` keine weitere Produktänderung nach der Übergabe.
**Urteil: technisch `approved` für T-71.** Die maschinenlesbare aktive
Übergabe in STATUS bleibt T-68; Mike hat T-71 ausdrücklich beauftragt und
der Coder hat es im selben Branch und derselben OUTBOX benannt. Kein
menschlicher Abschluss wird daraus abgeleitet.

**Gegenprobe:** `App.vue` und `AuthRoot.vue` verwenden beide
`naiveLocales`. Die installierte Naive-UI-Fassung übernimmt per
`createLocale` die unveränderten Grundtexte und liest die leeren
Platzhalter für `Input`, `InputNumber` und `Select` aus dem angepassten
Sprachpaket; ein ausdrücklich gesetzter Platzhalter hat Vorrang.
`DatePicker` bleibt im Grundpaket. Login- und Benutzerverwaltungsbild zeigen
leere Felder unter ihren Beschriftungen statt „Please Input“.

**Eigene Nachweise:** `naiveLocale.spec.ts` mit vier Tests grün; den
`Select`-Pfad zusätzlich im installierten Naive-UI-Code bis zur
Locale-Auswahl verfolgt. Der Coder dokumentiert `make test` mit 852
Frontend- und 20 API-Tests sowie Lint und Typecheck ohne Befund. Keine
eigene vollständige Teststack-Wiederholung. Doku-Abgleich: Beide READMEs
enthalten keine Verhaltenszusage zu Standard-Platzhaltern; die aktualisierten
Bilder sind in T-68 geprüft. Keine neue Lesson durch den Verifier.
