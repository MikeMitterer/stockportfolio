#!/usr/bin/env bash
# Config fuer dev-ports.sh (ProjectTools) — wird gesourced, kein Custom-Parser.
# .sh-Endung fuers IDE-Highlighting. Format-Doku: ProjectTools/README.md
# Anlegen/aktualisieren:  dev-ports.sh --example > .dev-ports.conf.sh
# shellcheck disable=SC2034  # von dev-ports.sh gesourct

# Ports, die `make dev-up` oeffnet: Vite (frontend/vite.config.ts, strictPort)
# und die Konto-API (PORT-Vorgabe in api/src/index.ts). Procfile.dev nennt
# keinen --port, deshalb erkennt `--example` sie nicht.
PORTS=(5175 8080)
