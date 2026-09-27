# T-54 · Backup direkt aus dem leeren Depot einspielen

Im leeren Depot bietet die App bisher nur „Position hinzufügen“ und
„Beispiel-Depot laden“ an. Wer bereits ein Backup hat, findet dort keinen
Einstieg zum Wiederherstellen. Eine dritte Option soll diesen Weg sichtbar machen.

**Beispiel:** Nach einem Browserwechsel ist das Depot leer. „Backup
einspielen …“ führt direkt zu „Einstellungen → Backup“, wo die vorhandene
Dateiauswahl, Prüfung und Bestätigung weiterverwendet werden.

**Stand:** Umgesetzt und am 2026-09-27 durch Codex geprüft. Der zusätzliche
Button öffnet den Backup-Tab; die deutsche Oberfläche verwendet „Backup“.
Unabhängige Freigabe und Abschlussabnahme stehen noch aus.

**Für dich:** Aktuell kein Handgriff nötig. Nach Umsetzung und unabhängiger
Prüfung bleibt die Abschlussentscheidung offen.

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
| 2 | Wiederherstellung und Abbruch gegenprüfen | BackupPanel-Ablauf im Diff unverändert, Domain-/Store-Tests grün. Browser-Upload vom Werkzeug abgelehnt; kein Live-Import oder Live-Abbruch belegt | ◑ |
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

### Auflösung

Umsetzung und eigene Prüfungen abgeschlossen, mit der bei #2 dokumentierten
Browsergrenze. Produktfassung `ae64b14ef8a05881f08bcf38459ec47c716567a6` in Runde 1 an
den Verifier übergeben. Technische Freigabe und menschlicher Abschluss stehen aus.
