# StockPortfolio

Tolerance-band rebalancing as a web app — Vue 3 + Vite + TypeScript.
It replaces a spreadsheet; prices come from
[StockInfo](https://github.com/MikeMitterer/stockinfo), a separate service you
run yourself.

![Version](https://img.shields.io/badge/version-0.1.0-blue)

![Dashboard](docs/images/dashboard.png)

_The dashboard: asset classes at the top, positions below. Holdings and targets
are editable in place; the screenshots on this page use the sample portfolio the
app can load on first start._

## What it does

A portfolio is supposed to have a certain mix — say 70 % stocks, 10 % precious
metals, 15 % money market, 5 % cash. Prices keep shifting those shares. The two
questions are **when** to act and **how much** to move.

The app answers both.

### When: the trigger

Under _Settings → Calculation_ you choose what sets off a rebalance:

| Trigger                       | Meaning                                                                      |
| ----------------------------- | ---------------------------------------------------------------------------- |
| **Tolerance bands** (default) | Act as soon as a share leaves its band. Continuous, no calendar.             |
| **Fixed schedule**            | Act only on the due date, but then on every deviation from target.           |
| **Bands and schedule**        | Bands apply continuously; the due date also picks up the smaller deviations. |

Bands are relative to the target: with a 10 % target and a 6 % lower band, the
status flips to `Buy` at 9.4 %, not at 4 %. Both bands are set separately —
most people react earlier on the way down.

The schedule needs two things: an interval in months (12 = yearly) and the date
of the last rebalance. From those the app computes the next date and shows it —
in the settings, and next to the bands on the dashboard. The date belongs to the
portfolio, not to the settings, and you set it by hand: only whoever placed an
order knows whether it was actually filled.

Pure calendar rebalancing has a known weakness. If the market drops in March,
the allocation shifts at once but the date is in December. That is why the
combined option exists.

![Settings — Calculation](docs/images/settings-calculation.png)

### How much: delta in units

Every row shows how many units are missing or in excess. If the targets add up
to 100 %, the deltas cancel out in euro terms — follow all of them and you get a
plan that balances by itself.

### Minimum trade size

Relative bands make small positions responsive, which is the point. In euro
terms they make them _over_-responsive: in a €100,000 portfolio a 2 % target
with a 6 % band already signals at €120. No order is worth that.

_Settings → Calculation_ therefore has an optional minimum trade size, either a
fixed amount or a share of the portfolio. If a position is outside its band but
the missing sum is below that limit, the status stays `OK` and gets a small
`min` marker. The deviation stays visible in the delta column — only the call to
action is suppressed. The default is 0, i.e. off.

### One currency

Everything is calculated in euro, and nothing is converted. A security quoted in
another currency stays visible — with its own symbol and a red marker — but
counts towards no total and no share. €10,000 plus $10,000 is not 20,000 of
anything.

This is the quotation currency, not the risk currency: a euro-quoted MSCI World
holds two thirds US dollars. The app cannot tell that apart and does not claim
to.

### Price history

Every row carries a small sparkline. It answers a question no number does: is
the price coming from above or from below? The period is shown in the column
header and is chosen under _Settings → Data_ — one month, one week or one day.
"One day" shows no line but the change from the last trading day to today.

The expanded row holds a proper chart: prices on the left axis, the same line as
a percentage change on the right, time along the bottom, selectable from one
month up to "max". Hovering shows date, price and change for that day.

Daily closing prices change once a day, so they are cached in IndexedDB and
fetched at most once per day per security.

![Expanded row with the price chart](docs/images/drilldown.png)

### Five asset classes

`Stocks / ETFs`, `Bonds`, `Precious metals`, `Money market`, `Cash`.

Money market is deliberately separate from the other bonds. Bonds with a
maturity fluctuate; money-market instruments barely do — which makes them,
together with cash, the thing a purchase can be paid from.

### Safety buffer and investment reserve

    investment reserve = (money market + cash) − safety buffer

The safety buffer is the amount meant to stay untouched. Whatever sits above it
is the investment reserve, and that figure is purely informational: it says how
much you _could_ invest in a downturn, not how much you should.

The buffer comes in two units because both readings are valid. An emergency fund
is a fixed amount and does not grow with the portfolio; a liquidity share is a
percentage. The default is 0 — how much someone leaves untouched depends on
their life, not on their portfolio.

### Rebalancing is a simulation

The rebalancing tab **books nothing**. You enter unit counts and immediately see
what it costs or yields, where the shares end up, and whether you land inside
the bands. Target shares can be changed there on a trial basis too — for the
case where a position serves as a source of money although it sits on target.
Those values live only in that tab.

![Rebalancing](docs/images/rebalancing.png)

_A plan in progress: 600 units of IUSN bought, 12 units of EQQQ sold, €2,021 left
over. Nothing is booked — the numbers only say what would happen._

You place the orders at your bank and update the holdings yourself in the
dashboard afterwards.

While a plan is underfunded, the header shows one button per liquid position
under _Cover from_ with the exact number of units that closes the gap.

### Explanations inside the app

Terms that are not self-explanatory — tolerance band, investment reserve, safety
buffer, delta, trigger — carry a small question mark with two or three sentences.
The tooltip has up to two links: _Read more →_ opens the page _The Method_, and
_Open setting →_ jumps straight to the settings tab that holds the value.

_The Method_ is deliberately **not** in the main navigation. People who open the
app want to try it, not read about it. The page is there to look things up when
a question actually comes up.

## Where the data lives

**Only in the browser** (IndexedDB), on the device you work on. No server stores
portfolio data — the StockInfo API only delivers prices and master data and
learns nothing about holdings.

That has consequences worth knowing:

- A different browser or device shows an empty portfolio.
- "Clear site data" in the browser deletes the portfolio too.
- A container update costs nothing — the data was never in the container.

_Settings → Data_ therefore offers backup and restore: a JSON file with the
portfolio, the settings and the list of hidden assets. Prices are not included —
the app fetches those anyway. On restore the file is checked and its contents are
shown first; nothing is overwritten without confirmation.

### Several portfolios

Under _Settings → Data_ you can create, rename, switch and delete portfolios —
one for the kids, say, or a variant to play through. Only the active one is ever
calculated; its name sits in the status bar so no number is ambiguous.

What belongs to a portfolio: holdings, targets, **the asset selection** and the
date of the last rebalance. Which securities are eligible for a children's
account is a different set from your own. Bands, buffer, minimum trade size and
appearance apply to all portfolios — they describe the method, not the single
portfolio.

A backup always contains just the active portfolio, including its asset
selection.

## Setup

```bash
make setup                 # .libs/ symlinks + npm install
cp .env.example .env       # adjust VITE_STOCKINFO_API_URL if needed
make dev                   # http://localhost:5173
```

`make setup` needs the environment variables `BASH_LIBS` and `DEV_MAKE`
(`make precheck` verifies that). Without them, a plain `npm install` works too.

## Commands

`make help` lists everything. The important ones:

| Command                        | Purpose                                     |
| ------------------------------ | ------------------------------------------- |
| `make dev`                     | Vite dev server (port 5173)                 |
| `make build`                   | Typecheck + production build into `dist/`   |
| `make preview`                 | Preview of the production build (port 4173) |
| `make test`                    | Vitest, single run                          |
| `make lint` / `make typecheck` | ESLint / `vue-tsc --noEmit`                 |
| `make docker-build`            | Build the Docker image                      |
| `make tag-minor`               | Bump the version + git tag                  |

The same steps exist directly as `npm run …`.

## Layout

```
src/
├── api/          HTTP client for StockInfo — the only place with `fetch`
├── domain/       Pure calculation, no DOM, no reactivity
├── db/           IndexedDB access (repository pattern)
├── stores/       Pinia — state and persistence
├── composables/  Reusable logic with reactivity
├── components/   Presentation, no business logic
├── views/        The five pages
└── theme/        Colour tokens and the Naive UI derivation
```

The calculation core in `src/domain/` is deliberately free of Vue:
`rebalancing.ts` (market values, bands, status, liquidity), `tradePlan.ts` (the
plan with cash flow, deltas and cover suggestions), `schedule.ts` (due dates) and
`amount.ts` (amounts that are either euro or percent). They are testable without
a browser, and that is where most of the roughly 500 tests live.

The router runs in **hash mode** (`/#/rebalancing`), so a server only ever sees
`/` and needs to know nothing about the app's routes. Settings tabs are
addressable as well (`/#/settings?tab=calc`) — that is what the _Open setting →_
links use.

## Language

German and English, switchable under _Settings → Language_. The choice covers
labels, numbers and dates together — treating them separately is the usual
mistake: an English label above a number in German format.

Without an explicit choice the browser's language decides; anything other than
German gets English. The choice is stored in the browser.

Visible text lives in the message catalogue ([`src/i18n/`](src/i18n/)), without
exception. An ESLint rule turns a hard-coded string in a template into an error,
and the typecheck reports every key missing in one of the languages.

## Themes

Six of them, under _Settings → Theme_: `MangoLila` (after the StockInfo
backend), `Classic`, `Ocean`, `Forest`, `Paper`, `Mono`. As long as nothing is
chosen, the system setting decides between MangoLila (dark) and Paper (light).

Asset-class colours are theme-independent and checked for distinguishability
with colour vision deficiency.

## Mobile

The dashboard works as a **reading view**: basic figures, delta and status.
Rebalancing stays on the desktop — entering unit counts in a wide table is not a
good idea on a phone.

## Docker

The image is on Docker Hub as
[`mangolila/stockportfolio`](https://hub.docker.com/r/mangolila/stockportfolio).
It contains the finished bundle and an nginx to serve it — no Node runtime, no
database, no volumes.

### Run it

```bash
docker run -d --name stockportfolio \
    -p 8080:80 \
    -e STOCKINFO_API_URL=https://stockinfo.example.com \
    --restart unless-stopped \
    mangolila/stockportfolio
```

Then open <http://localhost:8080>. `STOCKINFO_API_URL` is the address of **your
own** [StockInfo](https://github.com/MikeMitterer/stockinfo) instance — the app
has no public backend to fall back on. See [API address](#api-address) below.

If the API runs on the same machine but outside Docker, the container cannot
reach it via `localhost`; use `http://host.docker.internal:8000` instead (on
Linux, add `--add-host=host.docker.internal:host-gateway`).

### With Docker Compose

```yaml
services:
  stockportfolio:
    image: mangolila/stockportfolio
    container_name: stockportfolio
    ports:
      - '8080:80'
    environment:
      STOCKINFO_API_URL: https://stockinfo.example.com
    restart: unless-stopped
```

```bash
docker compose up -d
```

### Updating

```bash
docker pull mangolila/stockportfolio
docker rm -f stockportfolio
# then run the command above again — or: docker compose up -d
```

Nothing is lost in the process. Portfolios live in the browser, not in the
container, so an update is a plain pull & restart.

### Checking it works

```bash
docker ps                          # STATUS should say "healthy" after a few seconds
docker logs stockportfolio         # the entrypoint prints the API address it wrote
```

The app itself shows the address in use under _Settings → Status_ and in the
status bar at the bottom. If prices stay empty, that page is the place to look:
it distinguishes "not reachable" from "reachable but refused" (CORS).

### Building it yourself

```bash
make docker-build              # builds mangolila/stockportfolio:<git-tag>
make docker-build PLATFORM=arm # ... for linux/arm64 instead
make docker-samples            # prints ready-made `docker run` commands
```

The build needs a git tag and a clean working tree (`make tag-patch`). It is a
multi-stage build on Debian: `node:22-bookworm-slim` produces the bundle,
`nginx:1.27-bookworm` serves it.

The default platform is `x86` (`linux/amd64`), because that is what the image
usually runs on — Unraid and most NAS boxes are x86, and an arm64 build from an
Apple Silicon Mac would not start there. `PLATFORM=arm` builds for `linux/arm64`,
`PLATFORM=all` builds both and pushes them in one step (buildx, registry login
required).

| Command                                          | Purpose                             |
| ------------------------------------------------ | ----------------------------------- |
| `make docker-build [PLATFORM=…]`                 | build the image                     |
| `make docker-push [TARGET=dockerhub\|ghcr\|ecr]` | push the last build                 |
| `make docker-update`                             | pull a fresh base image             |
| `make docker-images`                             | list local images of this project   |
| `make docker-samples`                            | print example `docker run` commands |

The bundled nginx configuration only adds caching rules. Without them the
browser keeps serving the old `index.html` after an update and can no longer find
the bundle files it names.

### API address

It is **not** baked into the image. On start the entrypoint writes
`STOCKINFO_API_URL` into `config.js`, from where the app reads it. The same image
can therefore point at a different backend without being rebuilt. Without the
variable, the value baked in at build time from `VITE_STOCKINFO_API_URL` applies.

The address is mandatory. If neither source provides one, the app does not start
but shows a message saying so — there is no built-in fallback, because a fallback
address resolves for nobody but its owner and the mistake would only surface as an
empty price table.

### Unraid

In the Docker tab choose "Add Container", then:

| Field      | Value                                                   |
| ---------- | ------------------------------------------------------- |
| Repository | `mangolila/stockportfolio`                              |
| Port       | container `80` → host port of your choice               |
| Variable   | `STOCKINFO_API_URL` = address of the StockInfo instance |

There are no volumes — the app stores everything in the browser, not in the
container. An update is a plain "pull & restart" and loses no data. The image
carries the WebUI link and icon as labels, and the healthcheck colours the state
in the Docker tab.

## Not there yet

| Topic                                | State                                                                           |
| ------------------------------------ | ------------------------------------------------------------------------------- |
| Base currency other than EUR         | open — depends on StockInfo (see [request](docs/stockinfo-currency-request.md)) |
| Converting mixed-currency portfolios | open — would need FX rates including their age                                  |
| Threshold notifications              | deliberately outside the MVP                                                    |
| CORS against the production API      | unverified — the container's origin has to be allowed                           |
| Pruning the price-history cache      | open — it only ever grows                                                       |

Details and verify matrices: [ticket board](_tickets/README.md).
The design this was built against:
[design spec](docs/superpowers/specs/2026-08-06-rebalancing-webapp-design.md).

## Licence

Private project — no licence granted.
