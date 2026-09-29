# T-60 · Umsetzungsplan

Spec: `docs/superpowers/specs/2026-09-29-stockportfolio-server-design.md`
Auftrag: `_tickets/30-doing/T-60-stockportfolio-server-und-benutzerkonten.md`

## 1. Serverkern und Datenbank

- Node/TypeScript-Server im Ordner `server/` mit Drizzle-Schema und
  SQLite-Repository unter `server/src/persistence/` anlegen.
- Den Container von `serve` auf diesen Server umstellen; statische Dateien,
  `/api` und `/healthz` auf Port 8080 bereitstellen.
- Mit isolierten Tests Start, Schema, Setup-Sperre und Volume-Erhalt prüfen.

## 2. Anmeldung und Sicherheit

- Einrichtungscode, Argon2id-Passwörter, Sitzungen, Cookie-Regeln,
  Herkunftsprüfung und Login-Limit implementieren.
- Öffentliche Setup-/Login-Routen und geschützte Session-/Passwort-Routen
  hinzufügen. Fehl- und Ablaufpfade mit synthetischen Daten testen.

## 3. Admin-API

- Konten anlegen, deaktivieren und Passwörter zurücksetzen. Letzten aktiven
  Admin in derselben Datenbanktransaktion schützen.
- Direkte 401/403-Gegenproben für jede Admin-Route ausführen.

## 4. Frontend

- Auth-Gate vor der Markt-App, Setup/Login/Passwortwechsel und Admin-Seite
  mit DE/EN-Katalogen ergänzen. StockInfo erst im angemeldeten Zweig binden.
- Einstellungen und Hash-Route anbinden. Komponenten- und Browserpfade
  einschließlich schmaler Ansicht prüfen.

## 5. Betrieb und Dokumentation

- Docker-Build, Entrypoint, Beispielkonfiguration, README, Docker-README,
  Unraid-Anleitung und zentrale Vorlage mit dem neuen Betrieb abgleichen.
- Isolierten Testcontainer auf `127.0.0.1:18080` mit getrenntem Datenverzeichnis
  starten und Startbefehl sowie Grenzen im Ticket festhalten.

## 6. Übergabe

- `make test`, `make lint`, `make typecheck`, Builds, Browserprüfung und
  englisches Bezeichnerinventar ausführen. Verify-Matrix und Doku-Abgleich
  anhand der tatsächlichen Nachweise ausfüllen.
- Produktstand committen, Handoff an `claude` mit Fassung, Umfang und offenen
  Grenzen in STATUS vorbereiten. Keine technische Freigabe selbst setzen.

## Gemeinsame Schnittstellen

Der Server liefert die Auth-/Admin-API für das Frontend. Der Container startet
denselben Server; Dokumentation und Unraid-Vorlage beschreiben genau diesen
Startweg. T-61 kann die gemeinsame Auth-Prüfung für private Depot-Routen
verwenden, ohne in T-60 bereits Depotdaten anzulegen.
