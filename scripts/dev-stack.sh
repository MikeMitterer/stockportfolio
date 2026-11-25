#!/usr/bin/env bash
#------------------------------------------------------------------------------
# dev-stack.sh — StockInfo für den Dev-Stack von make dev-up bereitstellen
#
# make dev-up und make dev-down rufen es auf (T-147). Welches StockInfo die
# Konto-API anspricht, legt DEV_STOCKINFO in .env fest (T-148):
#   local   StockInfo aus dem Nachbar-Repository (Vorgabe)
#   remote  das installierte StockInfo unter STOCKINFO_API_URL, etwa auf Unraid
# Der Teststack für Browserprüfungen ist scripts/test-stack.py.
#
# Lokal startet StockInfo über
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
#   scripts/dev-stack.sh [--up|--down|--address [DIENST]] [--help]
#   make dev-up
#   make dev-down
#
# Optionen:
#   --up        StockInfo starten oder ein laufendes mitbenutzen; remote nur prüfen
#   --down      StockInfo stoppen, sofern --up es gestartet hat
#   --address   Adresse eines StockInfo-Dienstes ausgeben (backend, dashboard)
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
    printThemeOption -u --up "StockInfo läuft danach; ein schon laufendes wird mitbenutzt, remote nur geprüft"
    printThemeOption -d --down "StockInfo gestoppt, wenn --up es gestartet hat; sonst unberührt"
    printThemeOption -a --address DIENST "Adresse von StockInfo zeigen: backend (Vorgabe), dashboard"
    printThemeOption -h --help "Diese Hilfe anzeigen"
    printThemeHeading "Hints"
    printThemeExample "make dev-up" "App, Konto-API und StockInfo starten"
    printThemeExample "make dev-down" "Alles wieder stoppen"
    printThemeExample "${APPNAME} --up" "Nur StockInfo starten"
    printThemeExample "${APPNAME} --address dashboard" "Wo das StockInfo-Dashboard läuft"
    printThemeExample "STOCKINFO_ROOT=~/src/StockInfo ${APPNAME} --up" "StockInfo aus anderem Ordner"
    printThemeExample "DEV_STOCKINFO=remote ${APPNAME} --up" "Installiertes StockInfo aus STOCKINFO_API_URL"
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

# Ein Paar umschließender Anführungszeichen entfernen, wie dotenv es tut; $1 Wert.
unquote() {
    local -r VALUE="${1}"
    local -r FIRST="${VALUE:0:1}"
    if [[ ${#VALUE} -ge 2 && (${FIRST} == '"' || ${FIRST} == "'") && "${VALUE: -1}" == "${FIRST}" ]]; then
        printf '%s\n' "${VALUE:1:${#VALUE}-2}"
    else
        printf '%s\n' "${VALUE}"
    fi
}

# Wert aus der Umgebung (make exportiert ihn aus .env), sonst aus .env dieses
# Checkouts; $1 Name. Gelesen wird nur die Zeile NAME=…, nichts ausgeführt.
# make übernimmt Anführungszeichen aus .env unverändert; beide Wege laufen
# deshalb über unquote.
configValue() {
    local -r NAME="${1}"
    local VALUE
    if [[ -n "${!NAME:-}" ]]; then
        VALUE="${!NAME}"
    else
        local FILE
        FILE="$(git rev-parse --show-toplevel)/.env"
        [[ -r "${FILE}" ]] || return 0
        VALUE="$(sed -n "s/^${NAME}=//p" "${FILE}" | tail -n 1)"
    fi
    unquote "${VALUE}"
}

# local oder remote aus DEV_STOCKINFO; ohne Angabe local.
stockinfoSource() {
    local SOURCE
    SOURCE="$(configValue DEV_STOCKINFO)"
    case "${SOURCE:-local}" in
        local | remote) printf '%s\n' "${SOURCE:-local}" ;;
        *) fail "DEV_STOCKINFO=${SOURCE} ist unbekannt" "Erlaubt sind local und remote (.env, Vorlage: .env.example)" ;;
    esac
}

# Adresse des installierten StockInfo; der Container liefert API und Dashboard
# unter derselben Adresse.
remoteAddress() {
    local URL
    URL="$(configValue STOCKINFO_API_URL)"
    if [[ ! "${URL}" =~ ^https?://[^/]+ ]]; then
        fail "DEV_STOCKINFO=remote braucht STOCKINFO_API_URL mit einer http(s)-Adresse" \
            "In .env eintragen (Vorlage: .env.example) oder DEV_STOCKINFO=local setzen"
    fi
    printf '%s\n' "${URL%/}"
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

# Adresse eines Prozesses aus StockInfos Procfile.dev; $1 Repository, $2 Prozessname.
serviceAddress() {
    local -r ROOT="${1}" SERVICE="${2}"
    local PORT
    PORT="$(cd "${ROOT}" && dev-ports --port-of "${SERVICE}" 2>/dev/null | grep -xE '[0-9]+')" ||
        fail "Port des StockInfo-Dienstes ${SERVICE} unbekannt" "Nachsehen: cd '${ROOT}' && dev-ports --list"
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

useRemoteStockInfo() {
    local ADDRESS
    ADDRESS="$(remoteAddress)"
    if ! isHealthy "${ADDRESS}"; then
        fail "StockInfo antwortet nicht unter ${ADDRESS}/health" \
            "Läuft der Dienst? Sonst DEV_STOCKINFO=local in .env setzen"
    fi
    printThemeStatus "✓" "StockInfo unter ${ADDRESS} wird verwendet (DEV_STOCKINFO=remote)" OK
    echo
}

startStockInfo() {
    local SOURCE ROOT ADDRESS
    SOURCE="$(stockinfoSource)"
    if [[ "${SOURCE}" == remote ]]; then
        useRemoteStockInfo
        return
    fi
    ROOT="$(stockinfoRoot)"
    requireRoot "${ROOT}"
    ADDRESS="$(serviceAddress "${ROOT}" backend)"
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

# $1 Prozessname aus StockInfos Procfile.dev, Vorgabe backend.
showAddress() {
    local -r SERVICE="${1:-backend}"
    local ROOT
    [[ "${SERVICE}" =~ ^[a-z][a-z0-9-]*$ ]] || fail "Unbekannter Dienst: ${SERVICE}" "Erlaubt etwa: backend, dashboard"
    local SOURCE
    SOURCE="$(stockinfoSource)"
    if [[ "${SOURCE}" == remote ]]; then
        remoteAddress
        return
    fi
    ROOT="$(stockinfoRoot)"
    requireRoot "${ROOT}"
    serviceAddress "${ROOT}" "${SERVICE}"
}

if [[ $# -eq 0 ]]; then
    usage
    exit 0
fi

case "${1}" in
    -u | --up) startStockInfo ;;
    -d | --down) stopStockInfo ;;
    -a | --address) showAddress "${2:-}" ;;
    -h | --help) usage ;;
    *)
        printThemeStatus "✗" "Unbekannte Option: ${1}" ERR >&2
        usage >&2
        exit 1
        ;;
esac
