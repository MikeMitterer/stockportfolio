# T-14 · Release 0.1.0 — Version + finale Docs

| Repo | Status | Time-box | Scope | GH-Issue |
|---|---|---|---|---|
| root | done | ~45 min | Release | — |

**Löst:** Erster benannter Stand. Version, Git-Tag und eine README, die
beschreibt, was die App tut — und was sie noch nicht tut.

---

## Version

`package.json` stand auf `0.1.0`, einen Git-Tag gab es nicht — die Version war
also nie vergeben. Statt sie fortzuschreiben wurde sie auf `0.0.0`
zurückgesetzt („noch nichts veröffentlicht") und über `semVerBump minor` auf
`0.1.0` gehoben. Damit stammen Datei, Commit und Tag aus einem Vorgang und die
Konvention des Projekts wird eingehalten, statt einen Tag von Hand zu setzen.

Der Tag bleibt lokal — das Repo hat keinen Remote.

Die Version steht dadurch an genau einer Stelle. Vite setzt sie beim Bauen als
`__APP_VERSION__` ein; im Container gibt es keine `package.json` zum Nachlesen.
Sichtbar ist sie in der Statuszeile am unteren Rand.

## README

Neu geschrieben statt ergänzt. Vorher stand dort Setup und eine Befehlsliste —
also *wie* man baut, nicht *was* das Ding tut. Jetzt beginnt sie mit den
Begriffen, ohne die die Oberfläche nicht zu lesen ist: Toleranzbänder, das
Delta in Stück, die fünf Assetklassen samt Grund für die eigene Geldmarkt-
Klasse, Sicherheitspuffer und Investitionsreserve.

Zwei Punkte bewusst prominent:

- **Rebalancing bucht nichts.** Wer das nicht weiß, sucht den Speichern-Knopf.
- **Alle Daten liegen im Browser.** Mit den Folgen: anderes Gerät = leeres
  Depot, „Website-Daten löschen" = weg, und mangels Export/Import gibt es
  derzeit kein Backup.

Ein Abschnitt „Was noch fehlt" nennt die sechs offenen Punkte beim Namen,
statt sie im Ticket-Board zu verstecken.

## Verify

Legende: ✅ live bestätigt · ➖ keine Live-Verifikation.

| # | Where | Look for | AI | Human |
|---|---|---|:--:|---|
| 1 | `make version` | `version = 0.1.0`, Git-Tag `v0.1.0+…` | ✅ | |
| 2 | `git tag` | Genau ein Tag, annotiert | ✅ | |
| 3 | Statuszeile | zeigt `v0.1.0` | ✅ | |
| 4 | `README.md` | Fachbegriffe erklärt, Datenhaltung und Grenzen benannt | ✅ | |
| 5 | `_tickets/README.md` | Roadmap mit echtem Stand; T-11 und T-12 als „teilweise" | ✅ | |
| 6 | Design-Spec | Status von „Draft" auf „Umgesetzt in 0.1.0" | ✅ | |
| 7 | `make docker-build` | Läuft jetzt ohne Wegwerf-Tag durch | ✅ | |
| 8 | `npm run test` / `lint` / `typecheck` | grün | ✅ | |
| 9 | Alle README-Links | Ziele existieren | ✅ | |

## Offen

Bewusst nicht in 0.1.0 (in der README als solche benannt): Export/Import,
Portfolio-Verwaltung, Spalten-Auswahl, Fremdwährungs-Warnung,
Threshold-Benachrichtigungen. Dazu die CORS-Prüfung gegen die produktive API,
die sich nur am Zielsystem machen lässt.
