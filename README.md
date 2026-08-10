# StockPortfolio

Tolerance-Band-Rebalancing als Web-App — Vue 3 + Vite + TypeScript.
Ersetzt eine bisherige Excel-Datei; Kurse kommen aus der
[StockInfo-API](https://stockinfo.int.mikemitterer.at).

## Status

MVP im Aufbau. Design-Spec:
[`docs/superpowers/specs/2026-08-06-rebalancing-webapp-design.md`](docs/superpowers/specs/2026-08-06-rebalancing-webapp-design.md).
Fortschritt und offene Punkte im [Ticket-Board](_tickets/README.md).

## Setup

```bash
cp .env.example .env       # ggf. VITE_STOCKINFO_API_URL anpassen
npm install
npm run dev                # http://localhost:5173
```

## Scripts

| Command | Zweck |
|---|---|
| `npm run dev` | Vite Dev-Server |
| `npm run build` | Type-Check + Production-Build nach `dist/` |
| `npm run preview` | Preview des Prod-Builds |
| `npm run typecheck` | Nur `vue-tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm run test` | Vitest |

## Docker

```bash
make docker-build          # baut mangolila/stockportfolio:<git-tag>
make docker-samples        # zeigt fertige `docker run`-Befehle
```

Der Build braucht einen Git-Tag und einen sauberen Working-Tree
(`make tag-patch`). Gebaut wird mehrstufig auf Debian-Basis: `node:22-bookworm-slim`
erzeugt das Bündel, ausgeliefert wird es von `nginx:1.27-bookworm`. Das
Auslieferungs-Abbild enthält keine Node-Laufzeit.

Der Router arbeitet im Hash-Modus (`/#/rebalancing`), damit der Server nichts
über die Adressen der App wissen muss. Die mitgelieferte nginx-Konfiguration
wird nur um Cache-Regeln ergänzt — ohne sie liefert der Browser nach einem
Update weiter die alte `index.html` aus und findet die darin genannten
Bündel-Dateien nicht mehr.

### API-Adresse

Sie steckt **nicht** im Abbild. Beim Start schreibt der Entrypoint
`STOCKINFO_API_URL` nach `config.js`, von wo die App sie liest. Dasselbe Abbild
lässt sich damit auf ein anderes Backend richten, ohne neu gebaut zu werden:

```bash
docker run --rm -p 8080:80 \
    -e STOCKINFO_API_URL=https://stockinfo.int.mikemitterer.at \
    mangolila/stockportfolio
```

Ohne die Variable gilt der Wert, der beim Bauen aus `VITE_STOCKINFO_API_URL`
ins Bündel kam. Welche Adresse tatsächlich gilt, steht in der App unter
*Einstellungen → Status*.

### Unraid

Im Docker-Reiter „Add Container", dann:

| Feld | Wert |
|---|---|
| Repository | `mangolila/stockportfolio` |
| Port | Container `80` → Host nach Wahl |
| Variable | `STOCKINFO_API_URL` = Adresse der StockInfo-Instanz |

Es gibt keine Volumes — die App speichert alles im Browser (IndexedDB), nicht
im Container. Ein Update ist damit ein reines „Pull & Restart", Daten gehen
dabei nicht verloren. WebUI-Verweis und Symbol bringt das Abbild als Label mit,
der Healthcheck färbt den Zustand im Docker-Reiter.
