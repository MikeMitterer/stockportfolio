# T-60 · Umsetzungsplan

Spec: `docs/superpowers/specs/2026-09-29-stockportfolio-server-design.md`
Auftrag: `_tickets/30-doing/T-60-stockportfolio-server-und-benutzerkonten.md`

## 1. Serverkern und Datenbank

- Node/TypeScript-Server im Ordner `api/` mit Drizzle-Schema und
  SQLite-Repository unter `api/src/persistence/` anlegen.
- Laufzeitabhängigkeiten in `api/package.json` und seiner Lockdatei pflegen;
  `npm ci --prefix api` für die lokale Einrichtung und den Container nutzen.
  Servertests bleiben unter `api/tests/`; die Root-Prüfbefehle rufen sie auf.
- Bestehende Vue-Quellen, Tests, öffentliche Dateien und Vite-Konfiguration
  nach `frontend/` verschieben. `frontend/package.json` ist die einzige
  Projektversionsquelle und trägt die Frontend-Abhängigkeiten.
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
- Mikes Abnahmepfad `make dev` vorbereiten und Startbefehl sowie Grenzen
  im Ticket festhalten; den konkreten Datenaufbau bestimmt Mike.

## 6. Übergabe

- `make test`, Lint und Typprüfung per npm in beiden Paketen, Builds, Browserprüfung und
  englisches Bezeichnerinventar ausführen. Verify-Matrix und Doku-Abgleich
  anhand der tatsächlichen Nachweise ausfüllen.
- Produktstand committen, Handoff an `claude` mit Fassung, Umfang und offenen
  Grenzen in STATUS vorbereiten. Keine technische Freigabe selbst setzen.

## Gemeinsame Schnittstellen

Der Server liefert die Auth-/Admin-API für das Frontend. Der Container startet
denselben Server; Dokumentation und Unraid-Vorlage beschreiben genau diesen
Startweg. T-61 kann die gemeinsame Auth-Prüfung für private Depot-Routen
verwenden, ohne in T-60 bereits Depotdaten anzulegen.
