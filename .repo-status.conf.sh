#!/usr/bin/env bash
# Config fuer repo-status.sh (ProjectTools) — wird gesourced, kein Custom-Parser.
# .sh-Endung fuers IDE-Highlighting. Format-Doku: ProjectTools/README.md
# Anlegen/aktualisieren:  repo-status.sh --example > .repo-status.conf.sh
# shellcheck disable=SC2034  # von repo-status.sh gesourct

# Optional: GitHub-Repo fuer die Issue-Sektion (blocker/high-priority)
ISSUES_REPO="MikeMitterer/stockportfolio"

# Workspace-Repos: "<pfad>:<anzeigename>" (Split am ersten ':')
REPOS=(
    ".:StockPortfolio (Root)"
)
