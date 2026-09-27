#!/usr/bin/env bash
#------------------------------------------------------------------------------
# setup-libs.sh — BashLib, MakeLib und ProjectTools unter .libs/ verlinken
#
# Farben und Abstände kommen aus BashLib/colors.lib.sh, abgestimmt mit
# MakeLib/colours.mk und ProjectTools/colors.py. Vor dem ersten Setup bleibt
# die Ausgabe ohne Bibliothek farblos. Keine Bibliotheken oder Pakete kopieren.
#
# Verwendung:
#   ./scripts/setup-libs.sh --install | --info | --help
#   MAKE_THEME=ocean ./scripts/setup-libs.sh --info
#   make setup
#
# Optionen:
#   -i | --install   Symlinks anlegen (vorhandene Symlinks ersetzen)
#   -s | --info      Verlinkung und gemeinsame CLI-Dateien anzeigen
#   -h | --help      Diese Hilfe anzeigen; auch ohne Argumente
#------------------------------------------------------------------------------
set -euo pipefail

readonly APPNAME="${0##*/}"
PROJECT_ROOT=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)
readonly PROJECT_ROOT
readonly LIBS_DIR="${PROJECT_ROOT}/.libs"
BASH_LIBS="${BASH_LIBS:-${LIBS_DIR}/BashLib/src}"

if [[ -z ${__COLORS_LIB__:-} && -r ${BASH_LIBS}/colors.lib.sh ]]; then
    # shellcheck disable=SC1091  # Wird erst durch dieses Setup verlinkt.
    . "${BASH_LIBS}/colors.lib.sh"
fi

# Repos über die bisherigen Variablen finden. Vorhandene lokale Links sind
# ebenfalls nutzbar; vor dem Ersetzen wird ihr tatsächliches Ziel aufgelöst.
readonly LINKED_REPOS=(
    "BashLib|BASH_LIBS|${BASH_LIBS%/src}|.../BashLib/src"
    "MakeLib|DEV_MAKE|${DEV_MAKE:-${LIBS_DIR}/MakeLib}|.../MakeLib"
    "ProjectTools|PROJECT_TOOLS|${PROJECT_TOOLS:-${LIBS_DIR}/ProjectTools/src}|.../ProjectTools/src"
)
readonly CLI_FILES=(
    "BashLib/src/colors.lib.sh"
    "MakeLib/colours.mk"
    "ProjectTools/src/python/colors.py"
    "ProjectTools/src/bash/py-run.sh"
    "ProjectTools/src/python/changelog.py"
)

# Gemeinsame Gruppenüberschrift; beim Bootstrap ist noch kein Theme verfügbar.
printHeading() {
    if command -v themeHeading >/dev/null 2>&1; then
        themeHeading "${1}"
    else
        printf '\n  %s\n' "${1}"
    fi
}

# Gemeinsame Spalten, mit schlichtem Bootstrap-Fallback ohne ANSI-Kopie.
printRow() {
    if command -v themeLine >/dev/null 2>&1; then
        themeLine "${1}" "${2}"
    else
        if (( ${#1} > 22 )); then
            printf '       %s\n%30s%s\n' "${1}" '' "${2}"
        else
            printf '       %-22s %s\n' "${1}" "${2}"
        fi
    fi
}

# $1 Symbol, $2 Text, $3 semantische Theme-Farbe. Umleitung bleibt beim Aufrufer.
printStatus() {
    local -r _SYMBOL="${1}" _MESSAGE="${2}" _ROLE="${3}"
    local -r _COLOR_NAME="THEME_COLOR_${_ROLE}"
    printf '%s' "${THEME_INDENT_GROUP-  }"
    if command -v themeStyle >/dev/null 2>&1; then
        themeStyle "${_SYMBOL} ${_MESSAGE}" "${!_COLOR_NAME:-}"
    else
        printf '%s %s' "${_SYMBOL}" "${_MESSAGE}"
    fi
    printf '\n'
}

# Optionen einmal deklarieren; Hilfe verändert weder Links noch Umgebungen.
usage() {
    printf '\nUsage: %s [ options ]\n' "${APPNAME}"
    printHeading 'Optionen'
    printRow '-i | --install' 'Symlinks unter .libs/ anlegen (idempotent)'
    printRow '-s | --info' 'Verlinkung und gemeinsame CLI-Dateien anzeigen'
    printRow '-h | --help' 'Diese Hilfe anzeigen'
    printHeading 'Beispiele'
    printRow "${APPNAME} --install" 'Symlinks anlegen'
    printRow "${APPNAME} --info" 'Verlinkung und CLI-Dateien prüfen'
    printRow 'py-run.sh --list' 'Python-Werkzeuge aus ProjectTools anzeigen'
    printHeading 'Voraussetzungen'
    printRow 'BASH_LIBS' "${BASH_LIBS}"
    printRow 'DEV_MAKE' "${DEV_MAKE:-${LIBS_DIR}/MakeLib}"
    printRow 'PROJECT_TOOLS' "${PROJECT_TOOLS:-${LIBS_DIR}/ProjectTools/src}"
    printf '\n'
}

# Ersetzt nur Links. Echte Dateien und Verzeichnisse bleiben erhalten.
# $1 vorhandenes Quell-Repo; $2 Ziel unter .libs/. Fehler: Status 1.
linkOnce() {
    local -r _SOURCE="${1}" _DESTINATION="${2}"
    if [[ -e ${_DESTINATION} && ! -L ${_DESTINATION} ]]; then
        printStatus '✗' "${_DESTINATION} ist kein Symlink; bleibt unverändert." DANGER >&2
        return 1
    fi
    if [[ -L ${_DESTINATION} && ${_DESTINATION} -ef ${_SOURCE} ]]; then return 0; fi
    mkdir -p "$(dirname -- "${_DESTINATION}")" || return 1
    ln -sfn "${_SOURCE}" "${_DESTINATION}"
}

# Prüft die tatsächlich konsumierten CLI-Dateien ohne Programme zu starten.
checkCliFiles() {
    local _FILE _RESULT=0
    printHeading 'Gemeinsame CLI-Dateien'
    for _FILE in "${CLI_FILES[@]}"; do
        if [[ -r ${LIBS_DIR}/${_FILE} ]]; then
            printRow "${_FILE}" '✓ verfügbar'
        else
            printStatus '✗' "${_FILE} fehlt; das Quell-Repository aktualisieren." DANGER >&2
            _RESULT=1
        fi
    done
    return "${_RESULT}"
}

# Alle Quellen vor ihrem Link-Ersatz physisch auflösen; keine Links auf sich selbst.
installLinks() {
    local _RESULT=0 _ENTRY _NAME _VARIABLE _REPO _EXPECTED _SOURCE
    printHeading "Symlinks unter ${LIBS_DIR}"
    if [[ -L ${LIBS_DIR} || ( -e ${LIBS_DIR} && ! -d ${LIBS_DIR} ) ]]; then
        printStatus '✗' '.libs muss ein eigener Ordner sein.' DANGER >&2
        return 1
    fi
    for _ENTRY in "${LINKED_REPOS[@]}"; do
        IFS='|' read -r _NAME _VARIABLE _REPO _EXPECTED <<< "${_ENTRY}"
        if [[ ${_NAME} == ProjectTools ]]; then _REPO="${_REPO%/src}"; fi
        if [[ ! -d ${_REPO} ]]; then
            printStatus '✗' "${_NAME}-Repo fehlt. ${_VARIABLE} soll auf ${_EXPECTED} zeigen." DANGER >&2
            _RESULT=1
            continue
        fi
        _SOURCE=$(cd -- "${_REPO}" && pwd -P)
        if linkOnce "${_SOURCE}" "${LIBS_DIR}/${_NAME}"; then
            printRow "${_NAME}" "✓ ${_SOURCE}"
        else
            _RESULT=1
        fi
    done
    checkCliFiles || _RESULT=1
    if (( _RESULT != 0 )); then
        printStatus '✗' 'Setup unvollständig. Quellen prüfen und erneut versuchen.' DANGER >&2
        return "${_RESULT}"
    fi
    printStatus '✓' 'Setup fertig' SUCCESS
}

# Linkstatus und nutzbare CLI-Dateien zeigen; keine Links oder venv anlegen.
showLinks() {
    local _ENTRY _NAME _PATH _TARGET _RESULT=0
    printHeading 'Aktuelle Verlinkung'
    for _ENTRY in "${LINKED_REPOS[@]}"; do
        _NAME="${_ENTRY%%|*}"
        _PATH="${LIBS_DIR}/${_NAME}"
        if [[ -L ${_PATH} && -d ${_PATH} ]]; then
            _TARGET=$(readlink "${_PATH}")
            printRow "${_NAME}" "✓ ${_TARGET}"
        else
            printStatus '⚠' "${_NAME}: fehlt, Ziel fehlt oder kein Symlink." WARNING
            _RESULT=1
        fi
    done
    checkCliFiles || _RESULT=1
    return "${_RESULT}"
}

if (( $# == 0 )); then usage; exit 0; fi
if (( $# != 1 )); then
    printStatus '✗' 'Genau eine Option angeben; siehe --help.' DANGER >&2
    exit 2
fi
case "${1}" in
    -i|--install) installLinks ;;
    -s|--info) showLinks ;;
    -h|--help) usage ;;
    *) printStatus '✗' "Unbekannte Option: ${1}" DANGER >&2; exit 2 ;;
esac
