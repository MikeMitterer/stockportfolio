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

**Stand:** Angelegt am 2026-10-06 auf Mikes Auftrag. Noch nicht eingeplant.
Für Mike ist aktuell kein Handgriff nötig.

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

## Offene Fragen vor der Umsetzung

1. Gilt der Weg nur für Admins oder für jedes Konto? Das Problem ist für
   normale Benutzer dasselbe.
2. Muss der freiwillige Wechsel das bisherige Kennwort verlangen? Üblich ist
   ja; der Pflichtwechsel nach einem Zurücksetzen bleibt davon unberührt.
3. Wo sitzt der Einstieg: eigener Menüpunkt (Konto), oder in der
   Benutzerverwaltung beim eigenen Konto?

### Akzeptanzkriterien

- [ ] Ein angemeldeter Admin ändert sein Kennwort in der App, ohne dass ein
      zweites Admin-Konto es zurücksetzen muss.
- [ ] Die bestehenden Passwortregeln gelten (12 bis 1024 Zeichen,
      Großbuchstabe, Zahl, Sonderzeichen); Fehlermeldungen in DE und EN.
- [ ] Nach dem Wechsel bleibt die Sitzung gültig, die Anmeldung mit dem neuen
      Kennwort funktioniert, mit dem alten nicht mehr.
- [ ] Der Admin kann sich weiterhin nicht selbst deaktivieren.
- [ ] Antworten auf die offenen Fragen sind im Ticket festgehalten.
- [ ] API- und Frontend-Tests decken den freiwilligen Wechsel ab; sichtbarer
      Browserschritt im Teststack nach [Browserprüfung](../../AGENTS.md#browserprüfung).
- [ ] **Doku-Abgleich:** `README.md`, `docker/README.md`, `docs/` und
      `unraid/` auf Aussagen zu Konten und Passwörtern geprüft.

## Technische Nachweise

Noch keine; das Ticket ist nicht begonnen.
