# T-54 · Backup direkt aus dem leeren Depot einspielen

Im leeren Depot bietet die App bisher nur „Position hinzufügen“ und
„Beispiel-Depot laden“ an. Wer bereits ein Backup hat, findet dort keinen
Einstieg zum Wiederherstellen. Eine dritte Option soll diesen Weg sichtbar machen.

**Beispiel:** Nach einem Browserwechsel ist das Depot leer. „Backup
einspielen …“ führt direkt zu „Einstellungen → Backup“, wo die vorhandene
Dateiauswahl, Prüfung und Bestätigung weiterverwendet werden.

**Stand:** Umgesetzt, durch Codex geprüft und in Runde 1 durch `claude`
technisch freigegeben (approved). Der zusätzliche Button öffnet den
Backup-Tab; die deutsche Oberfläche verwendet „Backup“. Der Verifier hat
zusätzlich den vollständigen Wiederherstellungsablauf live im Browser
bestätigt, den der Coder aus Werkzeuggründen nicht vollständig zeigen
konnte. Mikes bedingte Abschlussentscheidung greift damit.

**Für dich:** Kein weiterer Handgriff nötig. Das Ticket wird abgeschlossen,
committed, nach `master` gemergt und gepusht; anschließend wird wieder
`master` ausgecheckt.

## Auftrag

Mike: „Ein weiteres Ticket - wenn noch kein Wertpapier im Depot ist,
erscheint die Meldung ob man eine Position hinzufügen möchte oder ein
Beispiel-Depot laden möchte. Es fehlt der Punkt ob man eine vorhandene
Sicherung einspielen möchte“.

Anschließend: „Beginne danach gleich mit der Umsetzung“.

Bestätigung des Verhaltens: „Ja, der zusätzliche Button verlinkt im Prinzip
auf Einstellungen/Sicherung“.

Weitere Vorgaben von Mike: „Übrigens wird immer der Begriff "Sicherung" verwendet - änder das überall zu "Backup" - das passt auch im deutschen“.
Zum Download-Button: „Bei den Einstellungen heiß der Punkt auch "Sicherung herunterladen" - Da genügt "Backup"“.

**Bedingte Abschlussentscheidung · Mike, 2026-09-27:** „Nach einer Freigabe
von Claude ist das Ticket von mir aus erledigt“.

## Umsetzung und technische Nachweise

| Repo | Scope | GH-Issue |
|---|---|---|
| StockPortfolio | Leerzustand, Navigation zum bestehenden Backup-Tab, DE/EN und Dokumentation | — |

### Umsetzung

1. Dritten Button zum vorhandenen Backup-Tab ergänzen.
2. Hinweis in beiden Sprachkatalogen um Wiederherstellung erweitern; bestehende Button-Beschriftung wiederverwenden.
3. Button-Gruppe auf schmalen Ansichten umbrechen lassen.
4. Browserprüfung, Projektprüfungen und Doku-Abgleich durchführen; an den Verifier übergeben.

### Akzeptanzkriterien

- [x] Deutsche Oberfläche, aktuelle Anleitungen, Codekommentare und Testbeschreibungen verwenden „Backup“; der deutsche Download-Button heißt genau „Backup“. Historische Tickets und Nutzerzitate bleiben unverändert.

- [x] Im leeren Depot sind alle drei Einstiege sichtbar und bedienbar.
- [x] Die Backup-Option öffnet direkt den bestehenden Backup-Tab.
- [x] Wiederherstellung verlangt weiterhin eine gültige Datei und die vorhandene Bestätigung; Abbruch verändert keine Depotdaten.
- [x] Beschriftung und Hinweis stammen aus i18n und passen in DE und EN.
- [x] Auch auf schmalen Ansichten bleiben die Buttons erreichbar, ohne horizontales Überlaufen.

### Verify

Browserprüfung in einem isolierten Kontext ohne Nutzerdaten. Projektprüfungen
im Repository; kein echter API-Aufruf durch Unit-Tests.

Legende: ✅ live bestätigt · ⚠️ mit Einschränkung · ◑ teilweise · ➖ kein Live-Nachweis.

| # | Handgriff | Erwartung / aktueller Nachweis | AI |
|---|---|---|:--:|
| 1 | Leeres Depot öffnen, Backup-Option anklicken | DE-Klick und EN-Enter öffnen `#/settings?tab=backup`; vorhandenes BackupPanel sichtbar | ✅ |
| 2 | Wiederherstellung und Abbruch gegenprüfen | BackupPanel-Ablauf im Diff unverändert, Domain-/Store-Tests grün. Coder: Browser-Upload vom eigenen Werkzeug abgelehnt. Verifier (Runde 1, claude): voller Live-Rundlauf mit `file_upload` gelang — Vorschau, Bestätigung, Restore und aktualisierte Statuszeile bestätigt; siehe „Unabhängige Prüfung" | ✅ |
| 3 | DE/EN sowie schmale und breite Ansicht prüfen | DE/EN bei 390 px ohne Überlauf; DE bei 1440 px einzeilig. Neuer deutscher Tab „Backup“, Download-Button „Backup“, Import „Backup einspielen …“ im Browser bestätigt | ✅ |
| 4 | Position hinzufügen und Beispiel-Depot laden prüfen | Positionsdialog geöffnet/abgebrochen; Beispiel-Depot mit 6 Positionen geladen, Leerzustand verschwunden. Testdienst hat für 5 Demo-Wertpapiere keine Kurse | ⚠️ |
| 5 | `make test`, `make lint`, `make typecheck` | Nach letzter Produktänderung: 793 Tests in 62 Dateien bestanden; Lint und Typecheck Exit 0 | ✅ |
| 6 | Begriffsinventar und Bezeichner prüfen | Kein „Sicherung“ mehr in src, tests oder aktuellen Anleitungen; AST-Inventar der berührten TS-/Vue-Dateien auf englische Bezeichner geprüft | ✅ |

Belege vom 2026-09-27: isolierter Kontext `t54-empty-backup`, App unter
`http://127.0.0.1:5175/`, vorhandener lokaler Testdienst auf Port 59999.
Frischer Kontext zeigte das leere Depot mit nur dem voreingestellten Cash-Eintrag.
Gemessene Dokumentbreite entsprach 390 bzw. 1440 px; alle Buttons lagen innerhalb.
Bei 390 px stand die Importaktion in der zweiten, bei 1440 px in derselben Zeile.

Zu #2: `upload_file` verweigerte die vorhandene Datei
`tests/fixtures/browser/valid-portfolio.backup.json` mit „not within any of the
configured workspace roots“. Kein Umgehen der Werkzeugfreigabe. Die unveränderte
Importlogik wurde gelesen; die vorhandenen Tests decken gültige und ungültige
Backup-Daten ab. Eine erneute vollständige Browser-Wiederherstellung wird nicht
behauptet und bleibt als Einschränkung für den Verifier sichtbar.
Zu #5: Die Suite enthält Warnungen aus Negativfällen sowie eine fehlende
`stockInfoClient`-Injection in PositionsTable-Tests; keine fehlgeschlagenen Tests.
Für die reine Verlinkung/Textänderung keine neuen Tests, die nur das Markup spiegeln.

```bash
make test       # #5, vorhandene Backup-/Store-Prüfungen auch für #2
make lint       # #5
make typecheck  # #5
rg -n -i 'sicherung' src tests README.md docker/README.md docs unraid  # #6: keine Treffer
./.libs/ProjectTools/src/bash/dockerhub-readme.sh --readme docker/README.md --preview --ref master --output docker/logs/dockerhub-readme.md  # Doku-Abgleich
```

### Side-Effects

Zusätzlicher Navigationsweg zur vorhandenen Backup-Funktion; keine Änderung
des Backup-Formats oder der Wiederherstellungslogik. Keine Arbeiten in StockInfo.

### Doku-Abgleich

`README.md` (Where the data lives) und `docker/README.md` (Data and backups)
erklären übereinstimmend den zusätzlichen Einstieg. `tests/fixtures/browser/README.md`
verwendet die neue deutsche Tabbezeichnung. Datei-/Überschrifteninventar von
`docs/` und `unraid/README.md` geprüft: historische Entwürfe bzw. unveränderte
Backup-/Betriebswege, keine weiteren Anpassungen nötig. Die zentrale Unraid-
Vorlage ist durch diese UI-/Textänderung nicht betroffen. Echte Docker-Hub-
Vorschau erfolgreich erzeugt: 4.858 UTF-8-Bytes, Linkkonvertierung geprüft.
Board-/Lessons-Konventionen unverändert. Offene Übernahme von
`2026-09-11-activity-feed` zu `2026-09-11-lessons-follow-through` bleibt in STATUS
sichtbar; kein allgemeiner Migrationsauftrag.

### Lessons-Einordnung

SP-CX-02 (Format 1): Auftrag und neue Bezeichnung in Ticket, STATUS,
Board-Einstieg und beiden READMEs gemeinsam nachgezogen. SP-CX-01 (Format 1):
vorhandenen Backup-Weg ohne Zusatzlogik verwendet. AL-R-01/06/10 (Format 1,
gemeinsame Regeln weiterhin `needs_review`): frischer isolierter Browserkontext,
Live-Grenzen oben ausdrücklich getrennt; Übergabe erst nach Commit. Lokale
Codex-Lessons vor Umsetzung und Übergabe per Verzeichnisinventar gelesen.
Der Nutzerhinweis ist eine einzelne fehlende Einstiegsoption, kein belegtes
wiederkehrendes Fehlermuster; keine neue Lesson allein aus dieser Ticketanlage.

### Unabhängige Prüfung · Runde 1 · claude

Geprüfte Fassung: `ae64b14ef8a05881f08bcf38459ec47c716567a6` auf
`t-54-sicherung-im-leeren-depot`.

- **Diff gelesen (22 Dateien):** `DashboardView.vue` erhält einen dritten
  `NButton` im Leerzustand (`router.push({ path: '/settings', query: {
  tab: 'backup' } })`, vorhandener `backup.restore`-Schlüssel), Button-Zeile
  jetzt `flex-wrap: wrap; justify-content: center`. Alle übrigen
  Produktdateien (`BackupPanel.vue`, `backup.ts`, `repository.ts`,
  `instruments.ts`, `settings.ts`, `valueHistory.ts`, `types/portfolio.ts`,
  `SettingsView.vue`) ändern ausschließlich deutsche Kommentare/JSDoc von
  „Sicherung" auf „Backup" — keine Bezeichner, keine Logikänderung bestätigt.
- **Begriffsinventar selbst reproduziert:** `rg -n -i 'sicherung' src tests
  README.md docker/README.md docs unraid` findet keinen Treffer außer dem
  eigenen, unveränderten Ticket-Dateinamen (per Vorgabe „Historische Tickets
  … bleiben unverändert"). Deckt sich exakt mit der Behauptung.
- **i18n gegengeprüft:** `download: 'Backup'` (ohne „herunterladen") setzt
  Mikes Wortlaut exakt um; grammatikalisches Geschlecht von „das Backup"
  bleibt in allen geänderten Strings konsistent (kein/dieses/eigenes Backup).
- **Live im Browser nachvollzogen (eigener isolierter Tab, frischer Kontext,
  `http://127.0.0.1:5175/#/`):** Leerzustand zeigt exakt die drei Buttons
  und den erwarteten Hinweistext. Klick auf „Backup einspielen …" navigiert
  zu `#/settings?tab=backup` mit aktivem Backup-Tab.
- **Lücke aus Verify #2 selbst geschlossen:** Der Coder konnte den
  Datei-Upload wegen einer Workspace-Beschränkung seines Werkzeugs nicht
  live testen. Mit `mcp__claude-in-chrome__file_upload` und der
  vorhandenen Fixture `tests/fixtures/browser/valid-portfolio.backup.json`
  gelang mir der volle Rundlauf: Vorschau („Dieses Backup einspielen?",
  Depot/Basiswährung/Positionen/Cash/Datum korrekt angezeigt) →
  `NPopconfirm` „Aktuelles Depot wirklich überschreiben?" → Bestätigung →
  Meldung „Eingespielt: „Browser-Testdepot" mit 5 Positionen." → Statuszeile
  zeigt danach tatsächlich „Browser-Testdepot (EUR), 5 Positionen". Damit ist
  Verify #2 vollständig ✅ statt ◑, ohne dass der Coder das noch nachholen muss.
- **Pflichtprüfungen selbst reproduziert:** `make lint` (Exit 0),
  `make typecheck` (Exit 0), `make test` — 62 Testdateien/793 Tests grün.
- **Doku-Abgleich gegengeprüft:** README- und Docker-README-Ergänzungen
  vorhanden und treffend; keine weiteren betroffenen Anleitungen gefunden.

**Verdict: approved.** Keine Befunde; Verify #2 zusätzlich vollständig
nachgewiesen.

### Auflösung

Umsetzung, eigene Prüfungen und unabhängige Prüfung (Runde 1, `claude`,
approved) abgeschlossen; die bei #2 dokumentierte Browsergrenze ist durch
den Verifier live geschlossen. Produktfassung
`ae64b14ef8a05881f08bcf38459ec47c716567a6`. Mikes bedingte
Abschlussentscheidung greift damit.
