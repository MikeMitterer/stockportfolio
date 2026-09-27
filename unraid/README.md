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

The separate [template repository](https://github.com/MikeMitterer/unraid-templates)
is MIT-licensed; its license covers the templates. Community Applications
acceptance and operation on a real Unraid server have not been verified for
this revision. The application's OSI license alone is not a catalog acceptance.

## Installing through Unraid Apps

Use **Apps / Community Applications** in the Unraid web interface for a normal
installation. Once StockPortfolio is available in the catalog:

1. Open **Apps** and search for **StockPortfolio**.
2. Select the application and click **Install**.
3. Set **StockInfo API** to an address reachable from your browser and check
   the host port and other [configuration](#configuration).
4. Apply the settings to install and start the container, then open its **WebUI**
   from the **Docker** tab.

If Community Applications is not installed, follow the
[Unraid setup instructions](https://docs.unraid.net/community-applications/#installing-the-plugin).
For an existing container, see [Updating](#updating).

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
| Timezone | Container log timezone; defaults to UTC |

**Older images listened on port 80.** For an existing container, change the
mapping to container port 8080. Keep the same host address and host port:
the browser associates its data with that web address. A different host port
uses separate browser storage, which is initially empty.

## Updating

For an existing container, choose **Docker → stockportfolio → Force Update**.
Keep its settings and the same web address and host port so the browser
continues to use the same stored portfolio. Export a backup under
**Settings → Backup** before updating.

An image update does not require downloading the template again. Do not
overwrite `my-stockportfolio.xml`, which contains your saved container settings.
When upgrading from an image that used container port 80, update the mapping
as described under [Configuration](#configuration).

## Running without a template

```bash
docker run -d --name stockportfolio \
    -p 8088:8080 \
    -e STOCKINFO_API_URL=https://stockinfo.example.com \
    -e TZ=Europe/Vienna \
    --restart unless-stopped \
    mangolila/stockportfolio:latest
```

## Data, API and verification

**No volume required:** portfolios and settings are stored in the browser
(IndexedDB). Container updates leave them intact. Clearing browser data removes
them, and a different device has separate storage. Export backups under
**Settings → Backup**; the file is saved to your Downloads folder. A server
backup does not include this data.

At startup, the API address from `STOCKINFO_API_URL` is written to `config.js`.
It must be reachable from the browser; `localhost` refers to the browser's
computer, not a Docker service. The active URL is shown under
**Settings → Status**. Restart the container after changing the address.

StockInfo must allow the web app's origin, such as `http://unraid:8088`, through
CORS. An HTTPS web interface requires an HTTPS API.

The static Node server runs without root privileges. The healthcheck verifies
that the local web page is served; it does not test the separate API. API errors
are shown in the app. A local Docker test does not replace testing on an actual
Unraid instance.
