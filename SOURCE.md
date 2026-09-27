# Building the supplied source

Copyright © 2026 Michael Mitterer. Provider and licensor: MangoLila GmbH.
StockPortfolio's own application code uses the StockPortfolio License 1.0;
see LICENSE. Third-party components retain their own licenses.

Every production build includes `stockportfolio-source.tgz`, created from the
same working files as the browser bundle. The archive contains the application,
build configuration, dependency lockfiles, license documents and container
runtime files. It excludes local configuration, portfolio data, Git history,
installed dependencies and previous build output. The `files` list in
`package.json` defines its contents; include new build inputs there when needed.

Extract the archive into an empty directory. With Node.js 20+ (Node.js 22 is
used in Docker), npm and tar installed, run:

```sh
npm ci
npm run build
```

Dependencies are downloaded from the registries recorded in the lockfile and
retain their own licenses. Use the published `@mmit/ux-foundation` dependency
for reproducible builds; local package links require access to their matching
sources separately. Local development uses `npm run dev`.

For Docker, build the extracted sources with:

```sh
docker build -f docker/Dockerfile -t stockportfolio-local .
```

See README.md for API configuration and container startup. The archive does not
contain the separate StockInfo service. License files and the source archive
are available next to `legal.html` in the built site and at `/app/public` in
the container. The source archive is generated only for production builds.

The source archive is supplied for inspection and permitted own modifications.
It does not grant additional redistribution or hosting rights. Own use and
internal modifications are free; redistribution of modified versions, rebranded
offerings, resale and hosting for third parties require a separate paid written
agreement with MangoLila GmbH. Unchanged copies may be passed on free of charge
under the StockPortfolio name with all notices. See LICENSE for the terms.
