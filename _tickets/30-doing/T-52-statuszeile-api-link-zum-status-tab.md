# T-52 · StockInfo-Link in der Statuszeile öffnet den Status-Tab

Rechts unten in der Statuszeile steht die verkürzte StockInfo-API-Adresse.
Ein Klick darauf öffnet bisher nur die Einstellungen. **Der Link soll direkt
„Einstellungen → Status“ öffnen**, damit die Informationen zur API ohne
weiteren Tabwechsel erreichbar sind.

**Beispiel:** Aus dem Dashboard auf die StockInfo-Adresse klicken:
Die Einstellungen öffnen sich mit ausgewähltem Status-Tab. Dasselbe gilt,
wenn zuvor bereits ein anderer Einstellungs-Tab geöffnet war.

**Stand:** Auf Mikes Auftrag vom 2026-09-27 als weiteres Ticket in
`30-doing/` aufgenommen. Noch nicht umgesetzt oder technisch geprüft.
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

### Ausgangsbefund

Quelltext bei Aufnahme geprüft, noch keine Browserprüfung:

- `src/components/AppStatusBar.vue` verarbeitet `backend-click` derzeit mit
  `router.push('/settings')`.
- `src/views/SettingsView.vue` liest `route.query.tab`; `status` ist ein
  vorhandener Einstellungs-Tab. Ohne gültigen Tab wird `calc` ausgewählt.
- Das passende interne Ziel ist `/settings?tab=status`, in der Hash-URL
  `/#/settings?tab=status`. Die vorhandene Tab-Navigation wiederverwenden.

### Akzeptanzkriterien

- Ein Klick auf die StockInfo-Adresse öffnet unmittelbar den Status-Tab.
- Die Navigation funktioniert aus einer anderen Ansicht sowie aus einem
  anderen Einstellungs-Tab. Ein erneuter Klick im Status-Tab bleibt dort.
- Die vorhandene Tastaturbedienung des Links bleibt erhalten; das Ziel ist
  in deutscher und englischer Oberfläche derselbe Status-Tab.
- Adressanzeige, API-Zustand und übrige Statuszeilen-Links bleiben erhalten.

### Verify

Einzige aktuelle technische Matrix. `➖`: noch kein ausgeführter Nachweis.

| # | Prüfung | Erwartetes Ergebnis / Nachweis | AI |
|---|---|---|:--:|
| 1 | Im Dashboard die StockInfo-Adresse anklicken | Route enthält `tab=status`; Status-Tab ist sichtbar ausgewählt | ➖ |
| 2 | Einen anderen Einstellungs-Tab öffnen und den Link betätigen; im Status-Tab wiederholen | Wechsel zu Status beziehungsweise Verbleib dort | ➖ |
| 3 | Link per Tastatur aktivieren; DE und EN prüfen | Dasselbe Navigationsziel; übrige Statuszeile unverändert bedienbar | ➖ |
| 4 | `make test`, `make lint`, `make typecheck`; Bezeichnerinventar geänderter Dateien | Pflichtprüfungen erfolgreich; englische Bezeichner | ➖ |
| 5 | Projekt- und Containeranleitung abgleichen | Aussagen zum API-Status und Einstellungszugriff stimmen mit Umsetzung überein | ➖ |

### Side-Effects und Abgrenzung

Nur das Navigationsziel des bestehenden Links ändert sich. Kein neuer
API-Aufruf, keine Änderung an Konfiguration oder Speicherung vorgesehen.
T-50 bearbeitet ebenfalls `AppStatusBar.vue`; bei Umsetzung dessen aktuelle
Fassung mit GitHub-Symbol übernehmen und die laufende Reviewfassung stabil lassen.

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

### Auflösung

Ticket aufgenommen. Umsetzung, technische Prüfung und menschlicher
Abschluss stehen aus.
