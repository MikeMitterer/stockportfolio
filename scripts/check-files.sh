#!/usr/bin/env bash
#------------------------------------------------------------------------------
# check-files.sh — ruft ein Prüfwerkzeug mit den versionierten Dateien einer
# Sprache auf (make lint, format, format-check, security, quality; T-99)
#
#   scripts/check-files.sh python .venv/bin/ruff check
#   scripts/check-files.sh shell shellcheck
#   scripts/check-files.sh shell --each bash -n     # einmal je Datei
#
# Die Liste kommt aus `git ls-files -z`: Jeder Pfad bleibt ein eigenes Argument,
# auch mit Leerzeichen oder Shell-Zeichen, und bekommt ein führendes „./“, damit
# ein Name mit Bindestrich am Anfang nie als Option gilt. Scheitert git, scheitert
# das Skript mit dessen Exit-Code, statt mit einer leeren oder halben Liste ein
# falsches Grün zu liefern.
#------------------------------------------------------------------------------
set -euo pipefail

if [[ $# -lt 2 ]]; then
    echo "Aufruf: scripts/check-files.sh python|shell [--each] <Befehl> [Argumente …]" >&2
    exit 2
fi

KIND=$1
shift
EACH=false
if [[ $1 == --each ]]; then
    EACH=true
    shift
fi

LIST=$(mktemp)
trap 'rm -f "$LIST"' EXIT

case $KIND in
    python) git ls-files -z -- '*.py' >"$LIST" ;;
    shell)
        git ls-files -z -- '*.sh' >"$LIST"
        printf '%s\0' .githooks/pre-commit >>"$LIST"
        ;;
    *)
        echo "Unbekannte Sprache: $KIND (python oder shell)" >&2
        exit 2
        ;;
esac

mapfile -d '' FILES <"$LIST"
[[ ${#FILES[@]} -eq 0 ]] && exit 0
FILES=("${FILES[@]/#/./}")

if [[ $EACH == true ]]; then
    for FILE in "${FILES[@]}"; do
        "$@" "$FILE"
    done
else
    "$@" "${FILES[@]}"
fi
