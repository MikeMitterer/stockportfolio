# T-13 · Docker — Multi-Stage-Image, nginx-Drop-in, `docker/build.sh`

| Repo | Status | Time-box | Scope | GH-Issue |
|---|---|---|---|---|
| root | done | ~90 min | Auslieferung | — |

**Löst:** Die App als Container, lauffähig unter Unraid. Node baut, nginx liefert
aus; die API-Adresse wird erst beim Start gesetzt, nicht ins Bündel gebacken.

---

## Warum überhaupt ein Server mit Konfiguration

Ein gebautes Vue-Projekt ist ein Ordner mit Dateien — irgendetwas muss sie über
HTTP ausliefern. Die Frage war, ob dieses Etwas konfiguriert werden muss.

Gemessen, nicht vermutet: `nginx:1.27-alpine` mit `COPY dist`, sonst nichts.

| Adresse | Antwort |
|---|---|
| `/` | 200 |
| `/rebalancing` | **404** |
| `/settings` | **404** |

Der Router läuft im History-Modus (`createWebHistory`), die Adressen sind also
echt. Vue kann sie erst auflösen, wenn die App geladen ist — die *erste*
Anfrage geht an den Server, und der kennt keine Datei `/rebalancing`. Ohne
Rückfall auf die `index.html` ist jeder Reload auf einer Unterseite ein 404.

Nötig sind daher 21 Zeilen in `docker/default.conf` — ein Drop-in nach
`conf.d/`, keine Ablösung der mitgelieferten `nginx.conf`: Worker, MIME-Typen
und Logging bringt das Abbild mit.

Die einzige Alternative, die den Rückfall wirklich überflüssig macht, ist der
Hash-Modus des Routers (`/#/rebalancing`). Das ändert alle Adressen sichtbar —
bewusst nicht gewählt.

## Fund nebenbei: `/assets` kollidierte mit dem Ausgabeordner

Seit der Umbenennung von „Instrumente" zu „Assets" hat die App eine Route
`/assets`. Vite legt seine gebündelten Dateien standardmäßig ebenfalls unter
`dist/assets/` ab. Im Container beantwortete nginx `/assets` mit einem 301 auf
`/assets/` und danach mit einem 404 — die Seite war beim Reload nicht
erreichbar. Der Ausgabeordner heißt jetzt `static/` (`build.assetsDir`).

Im Dev-Server fiel das nicht auf: Dort beantwortet Vite unbekannte Pfade selbst
mit der `index.html`.

## Verify

Legende: ✅ live bestätigt · ➖ keine Live-Verifikation.

| # | Where | Look for | AI | Human |
|---|---|---|:--:|---|
| 1 | `docker/build.sh --help` | Base-Image aus dem **letzten** `FROM`, Target, Plattform, Laufzeit-Hinweis | ✅ | |
| 2 | `docker/build.sh --build` | Läuft durch, taggt `mangolila/stockportfolio:<tag>` + `latest`, schreibt `.last-build-tag` | ✅ | |
| 3 | Image-Größe | 81,8 MB — keine Node-Laufzeit im Auslieferungs-Abbild | ✅ | |
| 4 | `docker run` | `/`, `/rebalancing`, `/assets`, `/settings`, `/healthz` → alle 200 | ✅ | |
| 5 | `config.js` | Enthält den Wert aus `STOCKINFO_API_URL`, `Cache-Control: no-store` | ✅ | |
| 6 | `index.html` | `Cache-Control: no-cache` — nach einem Update kein altes Bündel | ✅ | |
| 7 | `/static/*.js` | `public, max-age=31536000, immutable` (Hash im Dateinamen) | ✅ | |
| 8 | Ohne `STOCKINFO_API_URL` | Log meldet den Rückfall auf den Build-Wert | ✅ | |
| 9 | Healthcheck | `wget --spider /healthz`, Zustand im Docker-Reiter | ✅ | |
| 10 | Unraid-Labels | `net.unraid.docker.webui` / `.icon` gesetzt | ➖¹ | |
| 11 | `--push` | Registry-Ziele ghcr / dockerhub / ecr | ➖² | |

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
  einen Port über 1024 plus `su-exec` im Entrypoint.
