#!/usr/bin/env bash
# Config fuer docs-check.sh (ProjectTools) — wird gesourced, kein Custom-Parser.
# .sh-Endung fuers IDE-Highlighting. Format-Doku: ProjectTools/README.md
# Aufruf: make docs-check (laeuft auch in make test)
# shellcheck disable=SC2034  # von docs-check.sh gesourct

# Nutzersichtbare Dokumente (AGENTS.md, Abschnitt Dokumentation).
DOCS=(
    "README.md"
    "docker/README.md"
    "unraid/README.md"
    "docs"
)

# Datierte Entwuerfe duerfen interne Angaben enthalten; die README-Vorlage
# nennt die verbotenen Begriffe bewusst.
EXCLUDE=(
    "docs/superpowers"
    "docs/README.template.md"
)

# PUID/PGID bleiben aus nutzersichtbarer Doku heraus (Mike, 2026-10-03, T-90).
FORBIDDEN=(
    "PUID|T-90: nicht in nutzersichtbarer Doku"
    "PGID|T-90: nicht in nutzersichtbarer Doku"
    "99:100|T-90: nicht in nutzersichtbarer Doku"
    "nobody:users|T-90: nicht in nutzersichtbarer Doku"
)
