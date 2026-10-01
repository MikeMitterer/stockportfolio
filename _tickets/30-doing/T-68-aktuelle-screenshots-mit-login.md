# T-68 · Aktuelle Screenshots, dazu ein Bild vom Login-Dialog

**Warum dieses Ticket:** Das Dashboard-Bild in README, Docker-Hub-Beschreibung
und Unraid-Vorlage ist veraltet. Es zeigt Version 0.2.0, die alte
Kennzahlzeile und ein „Buy“-Badge, das es nach T-66 nicht mehr gibt. Den
Login-Dialog mit Hinweis und Pflicht-Checkbox (T-64) zeigt bisher kein Bild.

**Beispiel:** Wer StockPortfolio über Docker Hub oder Unraid findet, sieht
heute Badges mit „Buy“ und keinen Login, obwohl die App beides anders zeigt.

**Stand:** In Umsetzung durch `claude-coder` auf `t-68-aktuelle-screenshots`
(Mike, 2026-10-01: „Dann T-68“). Mike hat ergänzt: „Bei T-68 - mach auch einen
Screenshot vom Login-Dialog und von der Benutzerverwaltung“. Ein Hinweis
„keine Anlageberatung“ kommt nicht in die Texte (Mike, 2026-10-01).

## Für dich

| Frage | Prüfpunkt # | Handgriff | Dein Urteil | Human |
|---|---|---|---|---|
| A · Bilder | [1](#pruefpunkt-1) | `docs/images/` und die Vorschau der READMEs ansehen | Zeigen die Bilder den aktuellen Stand und sind sie für das Listing geeignet? | |

## Umfang

1. `docs/images/dashboard.png` neu aufnehmen: aktueller Stand nach T-66
   (Symbol-Badges, Fragezeichen am Status, Kennzahlzeile), **englische
   Oberfläche**, synthetisches Beispiel-Depot, keine echten Daten.
2. Neu `docs/images/login.png`: Login-Dialog in englischer Oberfläche mit
   Hinweis und Checkbox, Desktop-Layout.
3. Neu `docs/images/user-admin.png`: Benutzerverwaltung (Admin) mit
   synthetischen Testkonten, englische Oberfläche (Mike, 2026-10-01).
4. Verweise: README und `docker/README.md` zeigen das Login-Bild an passender
   Stelle; die zentrale Unraid-Vorlage
   (`/Volumes/DevLocal/DevUnraid/Production/Templates/templates/stockportfolio.xml`)
   erhält ein zweites `<Screenshot>`.
5. `drilldown.png`, `rebalancing.png` und `settings-calculation.png` liegen in
   `docs/images/`, werden aber nirgends verwendet. Entweder aktualisieren und
   einbinden oder entfernen (SP-CX-07); die Wahl im Ticket begründen.
6. Theme und Bildbreite einheitlich wählen und im Ticket nennen; Aufnahme
   über ein wiederholbares Skript unter `frontend/scripts/` statt von Hand,
   damit spätere Releases die Bilder gleich erzeugen.

**Wirksam erst mit Veröffentlichung:** Docker Hub und Unraid laden die Bilder
über `raw.githubusercontent.com/.../master/...`. Neue Bilder erscheinen dort
erst nach Merge und Push nach `master`; ein Image-Push ist dafür nicht nötig,
die Docker-Hub-Beschreibung wird aber erst beim nächsten README-Upload
aktualisiert. Ein Veröffentlichungsauftrag folgt daraus nicht.

## Verify

| # | Handgriff | Nachweis | AI |
|---|---|---|:--:|
| 1 | <a id="pruefpunkt-1"></a>Bilder ansehen | Aktueller Stand, englische Oberfläche, keine echten Daten | ➖ |
| 2 | Alle Verweise in README, Docker-README, Unraid-Vorlage prüfen | Pfade existieren; Hub-Vorschau unter 25.000 Bytes | ➖ |
| 3 | Unbenutzte Bilder | aktualisiert und eingebunden oder entfernt, begründet | ➖ |

Legende: ✅ live bestätigt · ⚠️ mit Einschränkung · ◑ teilweise ·
➖ noch kein Nachweis.

### Doku-Abgleich

Noch offen: `README.md`, `docker/README.md`, `unraid/README.md`, Unraid-Vorlage.
