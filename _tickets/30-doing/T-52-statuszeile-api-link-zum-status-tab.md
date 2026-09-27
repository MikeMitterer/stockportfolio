# T-52 · StockInfo-Link in der Statuszeile öffnet den Status-Tab

Rechts unten in der Statuszeile steht die verkürzte StockInfo-API-Adresse.
Ein Klick darauf öffnet bisher nur die Einstellungen. **Der Link soll direkt
„Einstellungen → Status“ öffnen**, damit die Informationen zur API ohne
weiteren Tabwechsel erreichbar sind.

**Beispiel:** Aus dem Dashboard auf die StockInfo-Adresse klicken:
Die Einstellungen öffnen sich mit ausgewähltem Status-Tab. Dasselbe gilt,
wenn zuvor bereits ein anderer Einstellungs-Tab geöffnet war.

**Stand:** Auf `t-52-statuszeile-api-link-zum-status-tab` umgesetzt, selbst
geprüft und in Runde 1 unabhängig freigegeben (`claude`, approved). Mikes
Abschlussbestätigung steht noch aus.
Aktiver Auftrag und Reihenfolge bleiben in [STATUS.md](../STATUS.md)
festgelegt. Mike hat anschließend ausdrücklich beauftragt: „Nach T-51 kommt
T-52 im Anschluss“. T-52 folgt direkt auf T-51.

Für Mike steht jetzt keine Rückfrage an. Nach Umsetzung und technischer
Prüfung bleibt seine Abschlussbestätigung offen.

## Auftrag

Mike, 2026-09-27:

> Noch ein Ticket - rechts unten in der Statuszeile wird die StockInfo-API-Url
> angezeigt (eigentlich keine vollständige URL) der Text ist auch verlinkt
> allerdings nur zu den Settings - der link soll den Status-Tab in den Settings öffnen

## Umsetzung und technische Nachweise

Scope: UI-only in StockPortfolio; Ziel des vorhandenen Links korrigieren.
Die verkürzte Darstellung der Adresse ist Kontext des Befunds und kein
Auftrag, sie durch eine vollständige URL zu ersetzen. Kein GitHub-Issue angelegt.

### Ausgangsbefund bei Aufnahme

Quelltext bei Aufnahme geprüft, noch keine Browserprüfung:

- `src/components/AppStatusBar.vue` verarbeitet `backend-click` derzeit mit
  `router.push('/settings')`.
- `src/views/SettingsView.vue` liest `route.query.tab`; `status` ist ein
  vorhandener Einstellungs-Tab. Ohne gültigen Tab wird `calc` ausgewählt.
- Das passende interne Ziel ist `/settings?tab=status`, in der Hash-URL
  `/#/settings?tab=status`. Die vorhandene Tab-Navigation wiederverwenden.

**Umsetzung:** `backend-click` navigiert jetzt mit dem bestehenden Vue-Router
zu `{ path: '/settings', query: { tab: 'status' } }`. `SettingsView` wählt den
Tab bereits reaktiv aus dem Queryparameter. Keine weitere Navigation oder
Tablogik nötig, Darstellung und Beschriftungen bleiben erhalten.

### Akzeptanzkriterien

- Ein Klick auf die StockInfo-Adresse öffnet unmittelbar den Status-Tab.
- Die Navigation funktioniert aus einer anderen Ansicht sowie aus einem
  anderen Einstellungs-Tab. Ein erneuter Klick im Status-Tab bleibt dort.
- Die vorhandene Tastaturbedienung des Links bleibt erhalten; das Ziel ist
  in deutscher und englischer Oberfläche derselbe Status-Tab.
- Adressanzeige, API-Zustand und übrige Statuszeilen-Links bleiben erhalten.

### Verify

Einzige aktuelle technische Matrix. ✅ ausgeführt und bestätigt.

| # | Prüfung | Erwartetes Ergebnis / Nachweis | AI |
|---|---|---|:--:|
| 1 | Im Dashboard die StockInfo-Adresse anklicken | Route enthält `tab=status`; Status-Tab ist sichtbar ausgewählt | ✅ |
| 2 | Einen anderen Einstellungs-Tab öffnen und den Link betätigen; im Status-Tab wiederholen | Wechsel zu Status beziehungsweise Verbleib dort | ✅ |
| 3 | Link per Tastatur aktivieren; DE und EN prüfen | Dasselbe Navigationsziel; übrige Statuszeile unverändert bedienbar | ✅ |
| 4 | `make test`, `make lint`, `make typecheck`; Bezeichnerinventar geänderter Dateien | Pflichtprüfungen erfolgreich; englische Bezeichner | ✅ |
| 5 | Projekt- und Containeranleitung abgleichen | Aussagen zum API-Status und Einstellungszugriff stimmen mit Umsetzung überein | ✅ |

**Eigene Nachweise · 2026-09-27:** `make test`: 62 Dateien / 793 Tests;
`make lint` und `make typecheck`: Exit 0. TS-Compiler-API-Inventar von
`AppStatusBar.vue`: englische Bezeichner; Änderung nur am Routenziel.

Chrome, isolierter Kontext `t52-navigation`, bestehender Dev-Server auf 5175
und vorhandener StockInfo-Testserver auf 59999. Frischer Browserzustand ohne
Depotfixture. Tatsächliche Klicks auf die API-Adresse: Dashboard → Status,
Theme → Status, Status → Status. Jeweils `tab=status` und sichtbarer aktiver
Tab samt StockInfo-API-Panel bestätigt. Englische Oberfläche: aus Calculation
den echten Backend-Button fokussiert und Enter gedrückt → Status. GitHub-Link,
verkürzte Adresse, Version und Erreichbarkeitsstatus bleiben vorhanden.
Kein Produktivserver und keine echten Marktquotes für diese Navigation nötig.

### Side-Effects und Abgrenzung

Nur das Navigationsziel des bestehenden Links ändert sich. Kein neuer
API-Aufruf, keine Änderung an Konfiguration oder Speicherung vorgesehen.
Die abgeschlossene T-50-Fassung mit GitHub-Symbol ist unverändert enthalten.

### Lessons und Doku-Abgleich

Einzelner Nutzerbefund ohne belegtes wiederkehrendes Fehlermuster;
keine neue Lesson angelegt. AL-R-01: Die Prüfung der Route im Quelltext
ersetzt nicht den Nachweis des tatsächlich ausgewählten Tabs im Browser.

**Doku-Abgleich bei Aufnahme:** `README.md`, Abschnitt „Layout“, beschreibt
bereits adressierbare Einstellungs-Tabs. `docker/README.md`, Abschnitt
„Status and logs“, verweist auf „Settings → Status“. Beide Aussagen bleiben
richtig; für die Ticketaufnahme ist keine Anpassung nötig. Bei Umsetzung
beide Abschnitte erneut abgleichen. Installation, StockInfo-Vertrag und
Unraid-Konfiguration sind nicht betroffen.

Die allgemeine Board-Übernahme auf `2026-09-11-lessons-follow-through`
bleibt separat offen. Keine Konventionsänderung und keine Skill-Anpassung
durch dieses Ticket.

**Doku-Abgleich nach Umsetzung:** Datei-/Überschrifteninventar geprüft.
README, Betriebsabschnitt zur API-Adresse, nennt den direkten Klick zum Status.
„Layout“ mit adressierbaren Tabs bleibt richtig. `docker/README.md`, „Status and
logs“, nennt Settings → Status bereits; unverändert zutreffend, keine neue
Containeranweisung nötig. `docs/`, `unraid/README.md` und zentrale Unraid-Vorlage
sind nicht betroffen: kein geänderter Vertrag, keine Konfiguration/Installation.
AL-R-01 durch tatsächliche Browsernavigation angewendet; SP-CX-02 durch
Abschluss von T-51 samt Board-Einstieg und Aktivierung T-52 berücksichtigt.

### Unabhängige Prüfung · Runde 1 · claude

Geprüfte Fassung: `031d0e0840b7c1e4e4d8ed12dbada42056e4b3a7` auf
`t-52-statuszeile-api-link-zum-status-tab`.

- **Diff gelesen:** Einzeilige Änderung in `AppStatusBar.vue` —
  `router.push('/settings')` → `router.push({ path: '/settings', query:
  { tab: 'status' } })`. Kein weiterer Code betroffen.
- **Zielmechanismus nachvollzogen:** `SettingsView.vue` liest `route.query.tab`
  in `activeTab` und akzeptiert `'status'` aus `SETTINGS_TABS`; ungültige oder
  fehlende Werte fallen auf `'calc'` zurück. Die neue Navigation trifft damit
  zuverlässig den Status-Tab, unabhängig vom zuvor geöffneten Tab.
- **Pflichtprüfungen selbst reproduziert:** `make lint` (Exit 0),
  `make typecheck` (Exit 0), `make test` — 62 Testdateien/793 Tests grün.
- **Doku-Abgleich gegengeprüft:** `docker/README.md` nennt „Settings → Status“
  bereits zweimal (Zeilen 54 und 93); `README.md`, Abschnitt „Layout“,
  dokumentiert adressierbare Tabs über `?tab=calc` als bestehendes Muster.
  Keine Anpassung nötig, Einschätzung im Ticket zutreffend.
- **Testabdeckung:** Keine dedizierte Komponenten- oder Routentests für diese
  Navigation oder für `SettingsView`s Tab-Auswahl allgemein — vorbestehender
  Zustand, nicht durch dieses Ticket verursacht; bei einer einzeiligen,
  klar nachvollziehbaren Änderung kein Blocker (AL-R-11).

**Verdict: approved.** Keine Befunde.

### Auflösung

Umgesetzt, selbst geprüft und in Runde 1 unabhängig freigegeben (`claude`,
approved). Mikes Abschlussbestätigung steht noch aus; Ticket bleibt bis
dahin in Doing.
