# Sicherheitsprofil

Was in diesem Projekt schutzwürdig ist und welche Grundsatzentscheidungen
gelten. Ein Konzeptticket, das den Aufbau der App berührt, prüft und ergänzt
es. Bei jedem Code-Ticket prüfen Implementer und Reviewer den Diff dagegen
(Guard `security`, Bericht ist Pflicht).
Leere Abschnitte heißen „noch nicht entschieden“; „keine“ ist eine Entscheidung.

## Sensible Daten

## Speicherorte

## Geheimnisse

## Anmeldung

Angelegt mit T-98; beschreibt den Stand von `api/src/auth/service.ts` und den
Routen unter `api/src/routers/`: Sitzungscookie und Token-Tausch in
`session.ts`, Anmelderouten in `accounts.ts`, Origin- und JSON-Prüfung in
`api.ts` (Aufteilung T-134).

- **Konten:** Benutzername und Passwort, Passwörter als Argon2id-Hash in der
  SQLite-Datenbank der Konto-API. Das erste Admin-Konto entsteht über einen
  einmaligen Einrichtungscode aus dem Startlog.
- **Fehlversuche:** Nach fünf Fehlversuchen je Konto und Adresse ist die
  Anmeldung 15 Minuten gesperrt. Unbekannte und inaktive Konten durchlaufen
  dieselbe Argon2id-Prüfung.
- **Sitzung:** 32 zufällige Bytes als Token im Cookie
  `stockportfolio_session` (`HttpOnly`, `SameSite=Lax`, `Secure` bei
  `STOCKPORTFOLIO_SECURE_COOKIES=true`). Die Datenbank speichert nur den
  SHA-256-Hash des Tokens.
- **Gültigkeit (Mike, 2026-10-21, T-98):** gleitende Leerlauffrist aus
  `STOCKPORTFOLIO_SESSION_IDLE_DAYS`, ohne Angabe 7 Tage. Jede
  authentifizierte Anfrage startet die Frist neu, für Sitzung und Cookie
  gleichermaßen; eine feste Höchstdauer gibt es nicht. Die Prüfung einer
  offenen Ereignisverbindung (Live-Abgleich) verlängert nicht, weil sie kein
  Cookie mehr setzen kann; sonst liefe das Cookie vor der Sitzung ab.
- **Token-Tausch (Mike, 2026-10-21, T-98):** Ist das Token älter als einen
  Tag, bekommt die nächste authentifizierte Anfrage ein neues. Getauscht wird
  am Ende der Anfrage, direkt bevor die Antwort das Cookie setzt, auch bei der
  StockInfo-Weiterleitung; eine lange Anfrage verbraucht so die Übergangsfrist
  nicht. Das alte Token gilt danach noch 60 Sekunden, ohne selbst zu
  verlängern, zu tauschen oder ein Cookie zu setzen; so melden parallele
  Anfragen und andere Reiter desselben Browsers nicht ab. Hat eine andere
  Anfrage schon getauscht, setzt eine Antwort kein Cookie; eine langsamere
  ältere Antwort setzt so kein schon getauschtes Token zurück. Ersetzte
  Sitzungen löscht der nächste Tausch. Eine
  offene Ereignisverbindung tauscht nicht, weil sie kein Cookie mehr setzen
  kann; nach Ablauf ihres ersetzten Tokens verbindet der Browser neu. Ein
  kopiertes Token verliert damit seine Gültigkeit, sobald der rechtmäßige
  Browser nach einem Tausch wieder anfragt; nutzt ihn der Angreifer zuerst,
  wird der rechtmäßige Browser abgemeldet. Jede Anmeldung in einem weiteren
  Browser ist eine eigene Sitzung mit eigenem Tausch.
- **Widerruf:** Abmelden mit einem noch gültigen Token löscht die Sitzung
  samt Vorgänger und Nachfolger aus einem Token-Tausch, auch während der
  Übergangsfrist. Ein abgelaufenes Token widerruft nichts mehr. Passwortwechsel,
  Passwort-Reset durch einen Admin und Deaktivieren löschen alle Sitzungen
  des Kontos; der Passwortwechsel stellt danach eine neue aus.
- **Schreibende Anfragen** verlangen einen `Origin`, der zum Server oder zu
  `STOCKPORTFOLIO_PUBLIC_ORIGIN` passt, und JSON als Inhaltstyp.

## Zugriffe von außen

## Ausführung
