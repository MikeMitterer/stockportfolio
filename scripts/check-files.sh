#!/usr/bin/env bash
#------------------------------------------------------------------------------
# check-files.sh — Prüfwerkzeug mit allen versionierten Dateien einer Sprache
#
# make lint, format, format-check, security und quality rufen es auf (T-99).
# Die Liste kommt aus `git ls-files -z`: Jeder Pfad bleibt ein eigenes Argument,
# auch mit Leerzeichen oder Shell-Zeichen, und bekommt ein führendes „./“, damit
# ein Name mit Bindestrich am Anfang nie als Option gilt. Scheitert git,
# scheitert das Skript mit dessen Exit-Code, statt mit einer leeren oder halben
# Liste ein falsches Grün zu liefern.
#
# Verwendung:
#   scripts/check-files.sh --python -- .venv/bin/ruff check
#   scripts/check-files.sh --shell -- shellcheck
#   scripts/check-files.sh --shell --each -- bash -n
#   make lint
#
# Optionen:
#   -p | --python   Python-Dateien (*.py)
#   -s | --shell    Shell-Skripte (*.sh) und der Git-Hook .githooks/pre-commit
#   -e | --each     Befehl einmal je Datei statt einmal mit allen
#   -h | --help     Hilfe anzeigen; auch ohne Argumente
#------------------------------------------------------------------------------
set -euo pipefail

# Ausgabe im CLI-Theme (printTheme…) aus cli.lib.sh von CLITheme; clilib-path kommt mit make setup
# nach .tools/bin.
CLI_LIBS="${CLI_LIBS:-$(clilib-path 2>/dev/null || true)}"
if [[ ! -r "${CLI_LIBS}/cli.lib.sh" ]]; then
    echo "  ✗ CLITheme fehlt: make setup" >&2
    exit 1
fi
# CLITheme liegt außerhalb des Repositorys (CLI_LIBS); shellcheck kann ihr nicht folgen.
# shellcheck disable=SC1091
if [[ "${__CLITHEME_CLI_LIB__:=""}" == "" ]]; then . "${CLI_LIBS}/cli.lib.sh"; fi

readonly APPNAME="${0##*/}"

usage() {
    echo
    echo "Usage: ${APPNAME} [ options ] -- BEFEHL [ARGUMENTE …]"
    echo
    printThemeOption -p --python "Der Befehl prüft alle versionierten Python-Dateien"
    printThemeOption -s --shell "Der Befehl prüft alle versionierten Shell-Skripte samt Git-Hook"
    printThemeOption -e --each "Den Befehl einzeln je Datei aufrufen, für Werkzeuge mit nur einer Datei"
    printThemeOption -h --help "Diese Hilfe anzeigen"
    printThemeHeading "Hints"
    printThemeExample "make lint" "Alle Lint-Prüfungen des Projekts"
    printThemeExample "${APPNAME} --python -- .venv/bin/ruff check" "Python-Dateien mit ruff prüfen"
    printThemeExample "${APPNAME} --shell -- shellcheck" "Shell-Skripte mit shellcheck prüfen"
    printThemeExample "${APPNAME} --shell --each -- bash -n" "Jedes Shell-Skript auf Syntax prüfen"
    echo
}

# Fehler mit nächstem Schritt nach stderr; $1 Meldung, weitere Argumente: Hinweise.
fail() {
    printThemeStatus "✗" "${1}" ERR >&2
    shift
    local HINT
    for HINT in "$@"; do
        printThemeHint "${HINT}" >&2
    done
    echo >&2
    exit 1
}

# Versionierte Dateien der Sprache $1 als NUL-getrennte Liste.
listFiles() {
    case "${1}" in
        python) git ls-files -z -- '*.py' ;;
        shell) git ls-files -z -- '*.sh' .githooks/pre-commit ;;
    esac
}

# Typischer Prüfbefehl der Sprache $1, für Beispiele in Meldungen.
exampleCommand() {
    case "${1}" in
        python) echo ".venv/bin/ruff check" ;;
        shell) echo "shellcheck" ;;
    esac
}

# Ruft den Befehl je Datei auf; prüft alle und meldet am Ende, ob eine scheiterte.
runEach() {
    local -n FILES_REF="${1}"
    shift
    local FILE
    local STATUS=0
    for FILE in "${FILES_REF[@]}"; do
        "$@" "${FILE}" || STATUS=1
    done
    return "${STATUS}"
}

if [[ $# -eq 0 ]]; then
    usage
    exit 0
fi

KIND=""
EACH=false
while [[ $# -gt 0 ]]; do
    case "${1}" in
        -p | --python | -s | --shell)
            [[ -z "${KIND}" ]] || fail "Nur eine Sprache je Aufruf: --python oder --shell" "Hilfe: ${APPNAME} --help"
            [[ "${1}" == -p || "${1}" == --python ]] && KIND=python || KIND=shell
            ;;
        -e | --each) EACH=true ;;
        -h | --help)
            usage
            exit 0
            ;;
        --)
            shift
            break
            ;;
        *) fail "Unbekannte Option: ${1}" "Hilfe: ${APPNAME} --help" ;;
    esac
    shift
done
readonly KIND EACH

[[ -n "${KIND}" ]] || fail "Welche Dateien? --python oder --shell angeben" "Hilfe: ${APPNAME} --help"
[[ $# -gt 0 ]] || fail "Kein Befehl nach --" "Beispiel: ${APPNAME} --${KIND} -- $(exampleCommand "${KIND}")" "Hilfe: ${APPNAME} --help"

LIST="$(mktemp)"
readonly LIST
trap 'rm -f "${LIST}"' EXIT
_RC=0
listFiles "${KIND}" >"${LIST}" || _RC=$?
[[ ${_RC} -eq 0 ]] || exit "${_RC}"

mapfile -d '' FILES <"${LIST}"
if [[ ${#FILES[@]} -eq 0 ]]; then
    exit 0
fi
FILES=("${FILES[@]/#/./}")

if [[ "${EACH}" == true ]]; then
    runEach FILES "$@"
else
    "$@" "${FILES[@]}"
fi
