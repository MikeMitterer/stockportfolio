# StockPortfolio

Tolerance-Band-Rebalancing als Web-App — Vue 3 + Vite + TypeScript.
Ersetzt eine bisherige Excel-Datei; Kurse kommen aus der
[StockInfo-API](https://stockinfo.int.mikemitterer.at).

![Version](https://img.shields.io/badge/version-0.1.0-blue)

## Worum es geht

Ein Depot soll eine bestimmte Aufteilung haben — etwa 70 % Aktien, 10 %
Edelmetalle, 15 % Geldmarkt, 5 % Cash. Kurse verschieben diese Anteile
laufend. Die Frage ist, **wann** man eingreift und **wie viel** man dabei
bewegen muss.

Die App beantwortet beides:

- **Toleranzbänder.** Nicht jede Abweichung ist ein Handlungsbedarf. Erst wenn
  ein Anteil relativ zu seinem Ziel um mehr als das untere bzw. obere Band
  abweicht, springt der Status auf `Buy` oder `Sell`. Beide Bänder sind
  getrennt einstellbar — nach unten reagiert man üblicherweise früher.
- **Delta in Stück.** Jede Zeile zeigt, wie viele Stück bis zum Ziel fehlen
  oder zu viel sind. Ergeben die Ziele zusammen 100 %, heben sich diese Deltas
  in Euro gegenseitig auf: Wer allen folgt, bekommt einen Plan, der von selbst
  aufgeht.

### Fünf Assetklassen

`Aktien / ETFs`, `Anleihen`, `Edelmetalle`, `Geldmarkt`, `Cash`.

Geldmarkt ist bewusst von den übrigen Anleihen getrennt. Laufzeit-Anleihen
schwanken; geldmarktnahe Papiere tun das kaum und sind damit — zusammen mit
Cash — das, woraus sich ein Nachkauf bezahlen lässt.

### Sicherheitspuffer und Investitionsreserve

    Investitionsreserve = (Geldmarkt + Cash) − Sicherheitspuffer

Der Sicherheitspuffer ist der Betrag, der unangetastet bleiben soll. Was
darüber liegt, ist die Investitionsreserve — rein informativ: Sie sagt, wie
viel man bei einem Rückgang **höchstens** einsetzen könnte, nicht wie viel man
einsetzen soll.

Den Puffer gibt es in zwei Einheiten, weil beide Lesarten berechtigt sind: Ein
Notgroschen ist ein fester Betrag und wächst nicht mit dem Depot; ein
Liquiditätsanteil ist ein Prozentsatz. Vorgabe ist 0 % — wie viel jemand stehen
lassen will, hängt an seinem Leben, nicht an seinem Depot.

### Rebalancing ist eine Simulation

Der Rebalancing-Tab **bucht nichts**. Man trägt Stückzahlen ein und sieht
sofort, was das kostet oder einbringt, wo die Anteile danach liegen und ob man
in den Bändern landet. Auch die Ziel-Anteile lassen sich dort probeweise
ändern — für den Fall, dass eine Position als Geldquelle dient, obwohl sie auf
Ziel steht. Diese Werte leben nur im Tab.

Die Aufträge gibt man bei seiner Bank auf; die Bestände pflegt man danach
selbst im Dashboard nach.

Solange ein Plan nicht gedeckt ist, steht im Kopf unter *Decken aus* je ein
Knopf pro liquider Position mit der Stückzahl, die genau die offene Lücke
schließt.

## Wo die Daten liegen

**Ausschließlich im Browser** (IndexedDB), auf dem Gerät, an dem gearbeitet
wird. Es gibt keinen Server, der Depotdaten speichert — die StockInfo-API
liefert nur Kurse und Stammdaten und erfährt nichts über Bestände.

Das hat Folgen, die man kennen sollte:

- Ein anderer Browser oder ein anderes Gerät zeigt ein leeres Depot.
- „Website-Daten löschen" im Browser löscht auch das Depot.
- Ein Container-Update kostet nichts — die Daten liegen ja nicht im Container.

Unter *Einstellungen → Daten* gibt es deshalb Sicherung und Wiederherstellung:
eine JSON-Datei mit Depot, Einstellungen und der Auswahl ausgeblendeter
Assets. Kurse sind nicht enthalten — die holt die App ohnehin neu. Beim Einspielen wird die Datei erst geprüft und der
Inhalt gezeigt; überschrieben wird nichts, ohne dass man es bestätigt hat.

### Mehrere Depots

Unter *Einstellungen → Daten* lassen sich weitere Depots anlegen, umbenennen,
wechseln und löschen — etwa eines für die Kinder oder eine Variante zum
Durchrechnen. Gerechnet wird immer nur mit dem aktiven; sein Name steht in der
Statuszeile, damit keine Zahl mehrdeutig bleibt.

Toleranzbänder, Sicherheitspuffer und Darstellung gelten für alle Depots
gemeinsam — sie beschreiben die Methode, nicht das einzelne Depot. Eine
Sicherung enthält immer nur das aktive.

## Setup

```bash
make setup                 # .libs/-Symlinks + npm install
cp .env.example .env       # ggf. VITE_STOCKINFO_API_URL anpassen
make dev                   # http://localhost:5173
```

`make setup` braucht die Umgebungsvariablen `BASH_LIBS` und `DEV_MAKE`
(`make precheck` prüft das). Ohne sie geht auch `npm install` allein.

## Befehle

`make help` listet alles auf. Die wichtigsten:

| Befehl | Zweck |
|---|---|
| `make dev` | Vite Dev-Server (Port 5173) |
| `make build` | Typecheck + Production-Build nach `dist/` |
| `make preview` | Vorschau des Prod-Builds (Port 4173) |
| `make test` | Vitest, einmalig |
| `make lint` / `make typecheck` | ESLint / `vue-tsc --noEmit` |
| `make docker-build` | Docker-Abbild bauen |
| `make tag-minor` | Version hochzählen + Git-Tag |

Dieselben Schritte gibt es auch direkt als `npm run …`.

## Aufbau

```
src/
├── api/          HTTP-Client für StockInfo — einzige Stelle mit `fetch`
├── domain/       Reine Rechenfunktionen, kein DOM, keine Reaktivität
├── db/           IndexedDB-Zugriff (Repository-Muster)
├── stores/       Pinia — Zustand und Persistenz
├── composables/  Wiederverwendbare Logik mit Reaktivität
├── components/   Darstellung, keine Fachlogik
├── views/        Die vier Seiten
└── theme/        Farb-Token und Naive-UI-Ableitung
```

Die Rechenkerne in `src/domain/` sind bewusst frei von Vue: `rebalancing.ts`
(Marktwerte, Bänder, Status, Liquidität) und `tradePlan.ts` (der Plan mit
Geldfluss, Deltas und Deckungsvorschlägen). Sie sind ohne Browser testbar, und
genau dort liegt auch der Großteil der Tests.

Der Router läuft im **Hash-Modus** (`/#/rebalancing`). Damit sieht ein Server
immer nur `/` und muss über die Adressen der App nichts wissen.

## Themes

Sechs Stück, umschaltbar unter *Einstellungen → Darstellung*: `MangoLila`
(angelehnt an das StockInfo-Backend), `Classic`, `Ocean`, `Forest`, `Paper`,
`Mono`. Solange nichts gewählt wurde, entscheidet die Systemeinstellung
zwischen MangoLila (dunkel) und Paper (hell).

Die Farben der Assetklassen sind themeunabhängig und auf Unterscheidbarkeit bei
Farbfehlsichtigkeit geprüft.

## Mobil

Das Dashboard ist als **Leseansicht** nutzbar: Basisdaten, Delta und Status.
Rebalancing bleibt dem Desktop vorbehalten — Stückzahlen in einer breiten
Tabelle einzutragen ist auf einem Telefon keine gute Idee.

## Docker

```bash
make docker-build          # baut mangolila/stockportfolio:<git-tag>
make docker-samples        # zeigt fertige `docker run`-Befehle
```

Der Build braucht einen Git-Tag und einen sauberen Working-Tree
(`make tag-patch`). Gebaut wird mehrstufig auf Debian-Basis:
`node:22-bookworm-slim` erzeugt das Bündel, ausgeliefert wird es von
`nginx:1.27-bookworm`. Eine Node-Laufzeit enthält das fertige Abbild nicht.

Die mitgelieferte nginx-Konfiguration wird nur um Cache-Regeln ergänzt: Ohne
sie liefert der Browser nach einem Update weiter die alte `index.html` aus und
findet die darin genannten Bündel-Dateien nicht mehr.

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
*Einstellungen → Status* und in der Statuszeile am unteren Rand.

### Unraid

Im Docker-Reiter „Add Container", dann:

| Feld | Wert |
|---|---|
| Repository | `mangolila/stockportfolio` |
| Port | Container `80` → Host nach Wahl |
| Variable | `STOCKINFO_API_URL` = Adresse der StockInfo-Instanz |

Es gibt keine Volumes — die App speichert alles im Browser, nicht im Container.
Ein Update ist damit ein reines „Pull & Restart", Daten gehen dabei nicht
verloren. WebUI-Verweis und Symbol bringt das Abbild als Label mit, der
Healthcheck färbt den Zustand im Docker-Reiter.

## Was noch fehlt

| Thema | Stand |
|---|---|
| Anzeige-Spalten ein-/ausblendbar | offen — die Einstellung existiert, ohne Oberfläche |
| Warnung bei nicht-EUR-Positionen | offen — die App rechnet durchgängig in Euro |
| Threshold-Benachrichtigungen | bewusst außerhalb des MVP |
| CORS gegen die produktive API | ungeprüft — die Origin des Containers muss erlaubt sein |

Details und Verify-Matrizen: [Ticket-Board](_tickets/README.md).
Der Entwurf, gegen den gebaut wurde:
[Design-Spec](docs/superpowers/specs/2026-08-06-rebalancing-webapp-design.md).

## Lizenz

Privates Projekt — keine Lizenz vergeben.
