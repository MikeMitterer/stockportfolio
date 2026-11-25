#!/usr/bin/env bash
#------------------------------------------------------------------------------
# dev-stockinfo.sh — StockInfo-Backend für den Dev-Stack starten und stoppen
#
# make dev-up und make dev-down rufen es auf (T-147). StockInfo startet über
# sein eigenes `make dev-up`; Befehl und Port stehen nur dort (Procfile.dev,
# gelesen mit dev-ports). Antwortet StockInfo schon, etwa weil dort gerade
# gearbeitet wird, bleibt es unberührt: --up benutzt es mit, --down beendet es
# nicht. Nur ein von --up gestartetes StockInfo trägt die Marke .dev-stockinfo
# im Checkout, die --down auswertet.
#
# Das StockInfo-Repository liegt neben dem Hauptcheckout von StockPortfolio,
# auch wenn das Skript in einem Worktree darunter läuft; STOCKINFO_ROOT setzt
# einen anderen Ort.
#
# Verwendung:
#   scripts/dev-stockinfo.sh [--up|--down|--address] [--help]
#   make dev-up
#   make dev-down
#
# Optionen:
#   --up        StockInfo starten oder ein laufendes mitbenutzen
#   --down      StockInfo stoppen, sofern --up es gestartet hat
#   --address   Adresse des lokalen StockInfo-Backends ausgeben
#------------------------------------------------------------------------------
set -euo pipefail

BASH_LIBS="${BASH_LIBS:-$(bashlib-path 2>/dev/null || true)}"
if [[ ! -r "${BASH_LIBS}/tools.lib.sh" ]]; then
    echo "  ✗ BashLib fehlt: make setup" >&2
    exit 1
fi
# BashLib liegt außerhalb des Repositorys (BASH_LIBS); shellcheck kann ihr nicht folgen.
# shellcheck disable=SC1091
if [[ "${__COLORS_LIB__:=""}" == "" ]]; then . "${BASH_LIBS}/colors.lib.sh"; fi
# shellcheck disable=SC1091
if [[ "${__TOOLS_LIB__:=""}" == "" ]]; then . "${BASH_LIBS}/tools.lib.sh"; fi

readonly APPNAME="${0##*/}"
readonly HEALTH_TIMEOUT=60

usage() {
    echo
    echo "Usage: ${APPNAME} [ options ]"
    echo
    printThemeOption -u --up "StockInfo läuft danach; ein schon laufendes wird mitbenutzt"
    printThemeOption -d --down "StockInfo gestoppt, wenn --up es gestartet hat; sonst unberührt"
    printThemeOption -a --address "Adresse des lokalen StockInfo zeigen, etwa für die Konto-API"
    printThemeOption -h --help "Diese Hilfe anzeigen"
    printThemeHeading "Hints"
    printThemeExample "make dev-up" "App, Konto-API und StockInfo starten"
    printThemeExample "make dev-down" "Alles wieder stoppen"
    printThemeExample "${APPNAME} --up" "Nur StockInfo starten"
    printThemeExample "STOCKINFO_ROOT=~/src/StockInfo ${APPNAME} --up" "StockInfo aus anderem Ordner"
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

# StockInfo neben dem Hauptcheckout: Das gemeinsame .git liegt auch für einen
# Worktree dort.
stockinfoRoot() {
    if [[ -n "${STOCKINFO_ROOT:-}" ]]; then
        printf '%s\n' "${STOCKINFO_ROOT}"
        return
    fi
    local COMMON_DIR
    COMMON_DIR="$(git rev-parse --path-format=absolute --git-common-dir)"
    printf '%s\n' "$(dirname "$(dirname "${COMMON_DIR}")")/StockInfo"
}

requireRoot() {
    local -r ROOT="${1}"
    if [[ ! -f "${ROOT}/Makefile" || ! -f "${ROOT}/Procfile.dev" ]]; then
        fail "StockInfo nicht gefunden: ${ROOT}" \
            "Repository dort klonen oder STOCKINFO_ROOT=/pfad/zu/StockInfo setzen"
    fi
}

backendAddress() {
    local -r ROOT="${1}"
    local PORT
    PORT="$(cd "${ROOT}" && dev-ports --port-of backend | grep -xE '[0-9]+')" ||
        fail "Port des StockInfo-Backends unbekannt" "Nachsehen: cd '${ROOT}' && dev-ports --list"
    printf 'http://127.0.0.1:%s\n' "${PORT}"
}

isHealthy() {
    curl -fsS --max-time 2 -o /dev/null "${1}/health" 2>/dev/null
}

# StockInfos make mit sauberer Umgebung: Das Makefile hier exportiert BASH_LIBS,
# WORKSPACE und weitere Werte, die StockInfos Makefile sonst als Vorgabe von
# außen übernähme.
stockinfoMake() {
    local -r ROOT="${1}"
    shift
    local -a ENVIRONMENT=(HOME="${HOME}" PATH="${PATH}" TERM="${TERM:-dumb}" TMPDIR="${TMPDIR:-/tmp}")
    local NAME
    for NAME in USER LOGNAME SHELL LANG CLI_THEME NO_COLOR; do
        if [[ -n "${!NAME:-}" ]]; then
            ENVIRONMENT+=("${NAME}=${!NAME}")
        fi
    done
    env -i "${ENVIRONMENT[@]}" make --no-print-directory -C "${ROOT}" "$@"
}

markerFile() {
    printf '%s\n' "$(git rev-parse --show-toplevel)/.dev-stockinfo"
}

startStockInfo() {
    local ROOT ADDRESS
    ROOT="$(stockinfoRoot)"
    requireRoot "${ROOT}"
    ADDRESS="$(backendAddress "${ROOT}")"
    if isHealthy "${ADDRESS}"; then
        printThemeStatus "✓" "StockInfo läuft schon unter ${ADDRESS} und wird mitbenutzt" OK
        echo
        return
    fi
    stockinfoMake "${ROOT}" dev-up
    printf '%s\n' "${ROOT}" >"$(markerFile)"
    local -r START="${SECONDS}"
    until isHealthy "${ADDRESS}"; do
        if ((SECONDS - START > HEALTH_TIMEOUT)); then
            fail "StockInfo antwortet nach ${HEALTH_TIMEOUT} s nicht unter ${ADDRESS}/health" \
                "Logs: make -C '${ROOT}' dev-logs" \
                "Fehlt dort die Einrichtung: make -C '${ROOT}' setup" \
                "Aufräumen: make dev-down"
        fi
        sleep 1
    done
    printThemeStatus "✓" "StockInfo läuft unter ${ADDRESS}" OK
    echo
}

stopStockInfo() {
    local MARKER ROOT
    MARKER="$(markerFile)"
    if [[ ! -f "${MARKER}" ]]; then
        printThemeStatus "✓" "StockInfo nicht von make dev-up gestartet; bleibt unberührt" OK
        echo
        return
    fi
    ROOT="$(<"${MARKER}")"
    stockinfoMake "${ROOT}" dev-down
    rm -f "${MARKER}"
}

showAddress() {
    local ROOT
    ROOT="$(stockinfoRoot)"
    requireRoot "${ROOT}"
    backendAddress "${ROOT}"
}

if [[ $# -eq 0 ]]; then
    usage
    exit 0
fi

case "${1}" in
    -u | --up) startStockInfo ;;
    -d | --down) stopStockInfo ;;
    -a | --address) showAddress ;;
    -h | --help) usage ;;
    *)
        printThemeStatus "✗" "Unbekannte Option: ${1}" ERR >&2
        usage >&2
        exit 1
        ;;
esac
