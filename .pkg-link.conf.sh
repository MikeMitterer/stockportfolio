#!/usr/bin/env bash
# Config fuer pkg-link.sh (ProjectTools) — wird gesourced, kein Custom-Parser.
# .sh-Endung fuers IDE-Highlighting. Format-Doku: ProjectTools/README.md
# Anlegen/aktualisieren:  pkg-link.sh --example > .pkg-link.conf.sh
# shellcheck disable=SC2034  # von pkg-link.sh gesourct

# Verzeichnis mit package.json und node_modules, relativ zum CWD.
# Monorepo/Sub-App: z.B. "dashboard". Einfaches Repo: "."
PACKAGE_ROOT="."

# Umschaltbare Pakete: "<paketname>=<pfad zum lokalen Repo>"
# Der Pfad darf Variablen enthalten — die Config wird gesourced.
PACKAGES=(
    "@mmit/ux-foundation=${DEV_LOCAL}/DevWeb/Production/ux-foundation"
)
