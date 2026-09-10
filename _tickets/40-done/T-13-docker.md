# T-13 · Docker — Multi-Stage-Image, `docker/build.sh`

| Repo | Status | Time-box | Scope | GH-Issue |
|---|---|---|---|---|
| root | done | ~2 h | Auslieferung | — |

**Löst:** Die App als Container, lauffähig unter Unraid. Node baut, nginx liefert
aus; die API-Adresse wird erst beim Start gesetzt, nicht ins Bündel gebacken.

---

## Warum Hash-Modus — und wozu dann noch eine Konfiguration

Ein gebautes Vue-Projekt ist ein Ordner mit Dateien; irgendetwas muss sie über
HTTP ausliefern. Die Frage war, ob dieses Etwas konfiguriert werden muss.

**Routing: nein, seit dem Hash-Modus.** Im History-Modus sind `/rebalancing`
und `/settings` echte Adressen. Gemessen an `nginx` mit `COPY dist`, sonst
nichts:

| Adresse | History-Modus | Hash-Modus |
|---|---|---|
| `/` | 200 | 200 |
| `/rebalancing` | **404** | entfällt (`/#/rebalancing`) |
| `/settings` | **404** | entfällt (`/#/settings`) |

Vue kann eine Adresse erst auflösen, wenn die App geladen ist — die *erste*
Anfrage geht an den Server, und der kennt keine Datei `/rebalancing`. Mit dem
Hash sieht der Server nur noch `/`. Preis: sichtbar andere Adressen.

**Caching: ja, nachweislich.** Ohne Konfiguration schickt nginx zur
`index.html` nur `Last-Modified` und `ETag`, kein `Cache-Control`. Beim ersten
Container-Update im Test trat prompt der Fehlerfall ein — der Browser behielt
die alte `index.html` und forderte

    /assets/SettingsView-DdN9l9cx.js   → 404

während das neue Abbild `SettingsView-B1XN8Lc1.js` enthielt. Die App blieb beim
Seitenwechsel stehen, bis jemand hart neu lud. Der Drop-in setzt deshalb
`no-cache` für alles außer den gehashten Bündel-Dateien — mit Routing hat er
nichts zu tun.

Gegenprobe nach dem Fix: Abbild neu gebaut, Container ersetzt, **normaler**
Reload — der Browser lud das neue Bündel (`index-CygF5NJa.js`).

## Basis-Abbilder

Debian statt Alpine: `node:22-bookworm-slim` zum Bauen, `nginx:1.27-bookworm`
zum Ausliefern. Kostet Größe (287 MB statt 82 MB auf Alpine), dafür dieselbe
libc und dieselben Werkzeuge wie überall sonst.

## Fund nebenbei: leeres Depot meldete falsch

Beim ersten Start im Container — frischer Ursprung, also leere IndexedDB —
erschien sofort „Ziele ergeben nicht 100 %". Bei einem leeren Depot ist die
Summe naturgemäß 0; die Warnung wäre das Erste gewesen, was ein neuer Nutzer
sieht, für einen Zustand, den er nicht herbeigeführt hat. Jetzt unterdrückt,
solange keine Wertpapiere im Depot sind.

## Verify

Legende: ✅ live bestätigt · ➖ keine Live-Verifikation.

| # | Where | Look for | AI | Human |
|---|---|---|:--:|---|
| 1 | `docker/build.sh --help` | Base-Image aus dem **letzten** `FROM`, Target, Plattform, Laufzeit-Hinweis | ✅ | |
| 2 | `docker/build.sh --build` | Läuft durch, taggt `mangolila/stockportfolio:<tag>` + `latest`, schreibt `.last-build-tag` | ✅ | |
| 3 | Image-Größe | 287 MB (Debian) — keine Node-Laufzeit im Auslieferungs-Abbild | ✅ | |
| 4 | `docker run` | `/` → 200; Navigation und Deep-Link `/#/settings` im Browser geprüft | ✅ | |
| 5 | `config.js` | Enthält den Wert aus `STOCKINFO_API_URL` | ✅ | |
| 6 | `index.html` | `Cache-Control: no-cache` | ✅ | |
| 7 | `/assets/*.js` | `public, max-age=31536000, immutable` (Hash im Dateinamen) | ✅ | |
| 8 | Ohne `STOCKINFO_API_URL` | Log meldet den Rückfall auf den Build-Wert | ✅ | |
| 9 | Healthcheck | `curl /`, Container meldet `healthy` | ✅ | |
| 10 | Update-Pfad | Abbild neu gebaut, Container ersetzt, **normaler** Reload lädt das neue Bündel | ✅ | |
| 11 | Unraid-Labels | `net.unraid.docker.webui` / `.icon` gesetzt | ➖¹ | |
| 12 | `--push` | Registry-Ziele ghcr / dockerhub / ecr | ➖² | |

¹ Nur im Abbild geprüft, nicht auf einer Unraid-Instanz ausgeführt.
² Kein Push ausgelöst — dafür bräuchte es die Registry-Zugangsdaten.

## Offen

- **Kein Git-Tag im Repo.** `--build` bricht ohne Tag ab (Absicht). Verifiziert
  wurde mit einem Wegwerf-Tag, der danach entfernt wurde. Der echte Tag kommt
  mit T-14.
- **CORS.** Die StockInfo-API muss die Origin des Containers erlauben, sonst
  bleiben die Kurse leer. Aus T-04 vorgemerkt, noch nicht gegen die laufende
  Instanz geprüft.
- **nginx läuft als root** (Master; die Worker als `nginx`) — das
  Standardverhalten des Abbilds. Es gibt keine Volumes, damit auch keine
  Rechteprobleme auf gemappten Pfaden. Wenn non-root gewünscht ist, kostet das
  einen Port über 1024 plus `gosu` im Entrypoint.
- **Alte Lesezeichen.** Adressen ohne Hash (`/settings`) landen seit der
  Umstellung auf der Startseite statt auf der gemeinten Seite.
