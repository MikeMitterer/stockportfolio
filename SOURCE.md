# Building the supplied source

Copyright © 2026 Mike Mitterer. StockPortfolio's application code is licensed
under AGPL-3.0-or-later; see LICENSE. It comes without warranty, to the extent
permitted by law. Third-party components retain their own licenses.

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
when distributing builds; local package links require supplying their matching
sources separately. Local development uses `npm run dev`.

For Docker, build the extracted sources with:

```sh
docker build -f docker/Dockerfile -t stockportfolio-local .
```

See README.md for API configuration and container startup. The archive does not
contain the separate StockInfo service. License files and the source archive
are available next to `legal.html` in the built site and at `/app/public` in
the container. The source archive is generated only for production builds.

When distributing a modified build, retain the notices and provide the
corresponding source for that build. The included build step creates a new
archive automatically; a link to the upstream repository alone does not
describe your modifications. See LICENSE for the full conditions.
