# T-94 · Admin kann sein eigenes Kennwort ändern

**Warum dieses Ticket:** Der Admin von StockPortfolio kann sein eigenes
Kennwort nicht mehr ändern. Wer ein angemeldetes Konto hat, braucht einen
Weg, das Kennwort selbst zu wechseln, etwa nach einem Verdacht auf
Weitergabe oder einfach routinemäßig.

**Beispiel:** Mike ist als Admin angemeldet und öffnet die Benutzerverwaltung.
Beim eigenen Konto steht nur „Dein Konto“; die Schaltfläche „Passwort
zurücksetzen“ fehlt dort. Einen anderen Eintrag „Passwort ändern“ gibt es in
der App nicht. Gewünscht: Der angemeldete Admin ändert sein Kennwort direkt in
der App, mit Eingabe des neuen Kennworts nach den bestehenden Passwortregeln.

**Stand:** Angelegt am 2026-10-06 auf Mikes Auftrag. Mike hat die offenen
Fragen am selben Tag beantwortet (siehe [Entscheidungen](#entscheidungen)).
Noch nicht eingeplant. Für Mike ist aktuell kein Handgriff nötig.

## Erste Beobachtung im Code (nicht verifiziert)

Stand `master` @ `e26dc53`, nur gelesen, nicht im Browser nachgestellt:

- Die Ansicht „Passwort ändern“ erscheint nur, wenn das Konto
  `mustChangePassword` trägt (`frontend/src/auth/AuthRoot.vue`, `acceptUser`).
  Ohne diese Markierung führt kein Weg dorthin.
- Die Benutzerverwaltung blendet die Kontoschaltflächen beim eigenen Konto
  aus (`account.id !== currentUserId` in
  `frontend/src/views/UserAdminView.vue`). Das verhindert, dass sich der Admin
  selbst deaktiviert, nimmt ihm aber auch das Zurücksetzen.
- Die Route `POST /api/auth/change-password` (`api/src/routers/api.ts`)
  akzeptiert jedes angemeldete Konto. Sie fragt das bisherige Kennwort nicht
  ab. Für einen freiwilligen Wechsel ist das zu prüfen.

Ob das Verhalten früher anders war oder nie vorgesehen, ist offen.

## Entscheidungen

Mikes Antworten vom 2026-10-06, Wortlaut:

> Zurücksetzen den PW funktioniert beim Admin auch nicht. 1 - nein, wenn dann
> setzt der Admin ein User-Konto zurück aber nicht der User selbst. 2 - Ja,
> 3 - Benutzerverwaltung

Gestellte Fragen und daraus folgender Umfang:

| # | Frage | Antwort | Folge für den Umfang |
|---|---|---|---|
| 1 | Gilt der Weg nur für Admins oder für jedes Konto? | nein | Nur der Admin ändert sein eigenes Kennwort. Normale Benutzer ändern ihr Kennwort nicht selbst; der Admin setzt ihr Konto zurück (bestehender Ablauf). |
| 2 | Muss der freiwillige Wechsel das bisherige Kennwort verlangen? | Ja | Der Admin gibt sein bisheriges Kennwort ein; ohne korrektes altes Kennwort kein Wechsel. Der Pflichtwechsel nach einem Zurücksetzen bleibt unverändert. |
| 3 | Wo sitzt der Einstieg? | Benutzerverwaltung | Beim eigenen Konto in der Benutzerverwaltung. |

**Zusätzlicher Befund von Mike:** Auch das Zurücksetzen des eigenen
Kennworts funktioniert beim Admin nicht. Das deckt sich mit der Beobachtung
oben: Die Schaltflächen fehlen beim eigenen Konto. Das Ticket löst beides
über den Wechsel mit altem Kennwort; ein Zurücksetzen ohne altes Kennwort
für das eigene Konto ist nicht vorgesehen.

### Akzeptanzkriterien

- [ ] In der Benutzerverwaltung bietet das eigene Konto des Admins
      „Passwort ändern“ an.
- [ ] Der Wechsel verlangt das bisherige Kennwort; ein falsches altes
      Kennwort wird abgewiesen und ändert nichts.
- [ ] Das neue Kennwort folgt den bestehenden Passwortregeln (12 bis 1024
      Zeichen, Großbuchstabe, Zahl, Sonderzeichen); Fehlermeldungen in DE und EN.
- [ ] Nach dem Wechsel bleibt die Sitzung gültig, die Anmeldung mit dem neuen
      Kennwort funktioniert, mit dem alten nicht mehr.
- [ ] Normale Benutzer erhalten keinen Weg, ihr Kennwort selbst zu ändern;
      der freiwillige Wechsel ist serverseitig auf Admins beschränkt.
      Der Pflichtwechsel nach einem Zurücksetzen funktioniert unverändert.
- [ ] Der Admin kann sich weiterhin nicht selbst deaktivieren.
- [ ] API- und Frontend-Tests decken den Wechsel ab, einschließlich falschem
      altem Kennwort und Ablehnung für normale Benutzer; sichtbarer
      Browserschritt im Teststack nach [Browserprüfung](../../AGENTS.md#browserprüfung).
- [ ] **Doku-Abgleich:** `README.md`, `docker/README.md`, `docs/` und
      `unraid/` auf Aussagen zu Konten und Passwörtern geprüft.

## Technische Nachweise

Noch keine; das Ticket ist nicht begonnen.
