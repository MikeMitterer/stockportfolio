# Unraid

StockPortfolio serves a static browser app. Prices and reference data
come from a separate StockInfo instance. The maintained template lives in the
[MikeMitterer/unraid-templates](https://github.com/MikeMitterer/unraid-templates)
repository at `templates/stockportfolio.xml`. The local working copy of that
repository is at `/Volumes/DevLocal/DevUnraid/Production/Templates`.
The template is published through that Git repository. The image is available
on [Docker Hub](https://hub.docker.com/r/mangolila/stockportfolio).

## License

StockPortfolio's application code is licensed under **[EUPL 1.2](../LICENSE)**
(version 1.2 only), an OSI-approved open-source license. Personal and commercial
use, modifications, redistribution, sale and hosting are permitted without an
additional paid license, subject to the EUPL's notice, source-code and copyleft
requirements. See the [provider and consumer declaration](../LICENSING.md).
In the app, **Settings → About** explains the limits of
displayed data and calculations. It shows MangoLila GmbH's address, website
and a logo matched to the selected theme. The status bar links to About
immediately after the MangoLila credit. About links to the license page and
source archive. On narrow screens, a section selector replaces the Settings
tab row.
About also links to MangoLila's separate notice for website financial content.
The dashboard and Rebalancing tables also carry a short note about the
calculated buy and sell figures.

The separate [template repository](https://github.com/MikeMitterer/unraid-templates)
is MIT-licensed; its license covers the templates. StockPortfolio is listed in
[Unraid Community Applications](https://ca.unraid.net/).

## Installing through Unraid Apps

Use **Apps / Community Applications** in the Unraid web interface for a normal
installation:

1. Open **Apps** and search for **StockPortfolio**.
2. Select the application and click **Install**.
3. Set **StockInfo API** to an address reachable from your browser and check
   the host port and other [configuration](#configuration).
4. Apply the settings to install and start the container, then open its **WebUI**
   from the **Docker** tab.

If Community Applications is not installed, follow the
[Unraid setup instructions](https://docs.unraid.net/community-applications/#installing-the-plugin).
For an existing container, see [Updating](#updating).

**Do not put StockPortfolio or StockInfo on the internet.** Use both only in
your home network. From outside, connect to your home network with a VPN, for
example WireGuard or Tailscale. The browser connects to StockInfo directly;
StockPortfolio's login does not protect it. If a reverse proxy in your home
network serves the app over HTTPS, set the exact public origin and enable
secure cookies.

The image includes WebUI and icon labels for Unraid. Its healthcheck reports
the container's health in the Docker tab.

## Test installation with wget

To test the published template manually, download it as a **User template**.
This is an optional test installation; normal installations use **Apps**.
The image must already be available to start the test container.

Run this command in the terminal on your Unraid server. Use a separate test
filename and never overwrite `my-stockportfolio.xml` with saved settings.
The command replaces any existing `stockportfolio-test.xml`:

```bash
wget -O /boot/config/plugins/dockerMan/templates-user/stockportfolio-test.xml \
  https://raw.githubusercontent.com/MikeMitterer/unraid-templates/master/templates/stockportfolio.xml
```

Then choose **Docker → Add Container** and select **stockportfolio** under
**User templates**. Set **StockInfo API** to your API address and check the
[configuration](#configuration). Use a different container name, such as
`stockportfolio-test`, and an available host port before starting it alongside
an existing installation.

This downloads the published template with its `TemplateURL` intact. To test
local XML changes, use the separate procedure below. Remove the test container
and test template when finished.

## Testing the local template

Remove `TemplateURL` from the test copy so Unraid does not download a different
version during testing. Save it under a separate name; never replace an existing
`my-stockportfolio.xml` containing saved user settings:

```bash
sed '/<TemplateURL>/d' \
  /Volumes/DevLocal/DevUnraid/Production/Templates/templates/stockportfolio.xml \
  > /tmp/stockportfolio-test.xml
scp /tmp/stockportfolio-test.xml root@unraid:/boot/config/plugins/dockerMan/templates-user/stockportfolio-test.xml
```

In the Docker tab, choose **Add Container** and select the `stockportfolio`
template. To test alongside an existing container, use a different container
name and an available host port.

## Configuration

The default image build targets `linux/amd64` for x86 Unraid servers.

| Field | Meaning |
|---|---|
| Repository | `mangolila/stockportfolio:latest` |
| WebUI Port | Default host port 8088, container port **8080** |
| StockInfo API | Required: your StockInfo instance's URL, reachable from the **browser** |
| App data | Map `/mnt/user/appdata/stockportfolio` to container path `/data` for accounts and private portfolios. Back up this directory. |
| Public origin | Set `STOCKPORTFOLIO_PUBLIC_ORIGIN` to the exact browser origin when using a reverse proxy. |
| Secure cookies | Set `STOCKPORTFOLIO_SECURE_COOKIES=true` for HTTPS access. |
| Timezone | Container log timezone; defaults to UTC |
| PUID / PGID | User and group the app runs as; default `99` / `100` (`nobody:users`). Change only if your appdata belongs to another user. |

Open browsers with the same account receive portfolio change notices through
`/api/data/events` and reload the data from the account API. If Unraid is
behind a reverse proxy, pass this SSE stream without buffering and set its
idle timeout above the 15-second keep-alive interval. The status bar warns
when the live connection is unavailable; the app checks the server periodically
for missed changes.

**Older images listened on port 80.** For an existing container, change the
mapping to container port 8080. Keep the same host address and host port:
the browser associates its data with that web address. A different host port
uses separate browser storage, which is initially empty.

## Updating

For an existing container, choose **Docker → stockportfolio → Force Update**.
Keep its settings and the same `/data` mapping so accounts and portfolios
survive. Export a backup under **Settings → Backup** before updating. Without
the volume, the container starts a new, independent setup. The browser address
still identifies its preferences and any old local portfolios awaiting import.

An image update does not require downloading the template again. Do not
overwrite `my-stockportfolio.xml`, which contains your saved container settings.
When upgrading from an image that used container port 80, update the mapping
as described under [Configuration](#configuration).

## Running without a template

```bash
docker run -d --name stockportfolio \
    -p 8088:8080 \
    --mount type=bind,source=/mnt/user/appdata/stockportfolio,target=/data \
    -e STOCKINFO_API_URL=https://stockinfo.example.com \
    -e TZ=Europe/Vienna \
    --restart unless-stopped \
    mangolila/stockportfolio:latest
```

## Data, API and verification

**Map and back up `/data`:** Accounts, sessions, portfolios, settings, asset
selection and recorded daily values are stored there in SQLite. On first
start, read the one-time setup code from the container log and create the first
admin account in the browser. Each account, including another admin, has a
private portfolio. The same account loads its server data in a second browser.
Export individual portfolios under **Settings → Backup** as an additional
file backup. If the account API is unavailable, changes cannot be saved.

Only the original setup account may preview and import old IndexedDB depots
from a browser profile, once and after confirmation. Until import or explicit
discard, those data remain readable through that browser's developer tools
even after sign-out. Another account sees no old names or values. After the
one-time import, export further old depots individually and restore their
files in the app. An account database created before the setup-account marker
cannot establish this entitlement; reset a disposable test database and repeat
setup while keeping the old browser data.

At startup, the API address from `STOCKINFO_API_URL` is written to `config.js`.
It must be reachable from the browser; `localhost` refers to the browser's
computer, not a Docker service. The active URL is shown on the separate
**Status** page, opened from the bottom status bar. Restart the container
after changing the address.

StockInfo must allow the web app's origin, such as `http://unraid:8088`, through
CORS. An HTTPS web interface requires an HTTPS API.

The container prepares `/data` for `PUID`/`PGID` (default 99:100) on start and
then runs the StockPortfolio API without root privileges. A new appdata
directory needs no manual permission change. Its `/healthz` endpoint
is checked locally; it does not test StockInfo. StockInfo errors
are shown in the app. A local Docker test does not replace testing on an actual
Unraid instance.
