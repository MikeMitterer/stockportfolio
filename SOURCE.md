# Building the supplied source

Copyright © 2026 Michael Mitterer. Provider and licensor: MangoLila GmbH.
StockPortfolio's own application code is licensed under EUPL 1.2 only;
see LICENSE and LICENSING.md. Third-party components retain their own licenses.

Every production build includes `stockportfolio-source.tgz`, created from the
same working files as the browser bundle. The archive contains the application,
both build configurations, both dependency lockfiles, API database migrations,
license documents and container build files. It excludes local configuration,
portfolio data, Git history,
installed dependencies and previous build output. The `sourceFiles` list in
`frontend/package.json` defines its contents; include new build inputs there
when needed.

Extract the archive into an empty directory. With Node.js 22+, npm and tar
installed, run:

```sh
npm ci --prefix frontend
npm run build --prefix frontend
npm ci --prefix api
npm run build --prefix api
```

Dependencies are downloaded from the registries recorded in the lockfile and
retain their own licenses. Use the published `@mmit/ux-foundation` dependency
for reproducible builds; local package links require access to their matching
sources separately. Local frontend development uses
`npm run dev --prefix frontend`.

For Docker, build the extracted sources with:

```sh
docker build -f docker/Dockerfile -t stockportfolio-local .
```

See README.md for API configuration and container startup. The archive does not
contain the separate StockInfo service. License files and the source archive
are available next to `legal.html` in the built site and at `/app/public` in
the container. The source archive is generated only for production builds.

The EUPL permits commercial use, modifications, redistribution and hosting
without an additional paid license. When distributing or communicating the
software, comply with its source-code, notice and copyleft requirements,
including the rules for covered network services. See LICENSE for the terms.
