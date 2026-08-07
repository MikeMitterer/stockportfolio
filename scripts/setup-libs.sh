#!/usr/bin/env bash
#------------------------------------------------------------------------------
# setup-libs.sh — Legt Symlinks unter .libs/ zu BashLib und MakeLib an
#
# BashLib und MakeLib sind zentrale Konventions-Repos. Dieses Script verlinkt
# sie ins Projekt (nicht kopieren), damit alle Scripts und das Makefile mit
# denselben Versionen arbeiten wie systemweit.
#
# Verwendung:
#   ./scripts/setup-libs.sh [--install|--info|--help]
#   make setup
#
# Optionen:
#   -i | --install   Symlinks anlegen (idempotent — überschreibt vorhandene)
#        --info      Aktuelle Verlinkung anzeigen
#   -h | --help      Diese Hilfe anzeigen
#------------------------------------------------------------------------------

set -euo pipefail

BASH_LIBS="${BASH_LIBS:-$(cd "$(dirname "$0")/.." && pwd)/.libs/BashLib/src}"

# BashLib einbinden — mit Guard, damit doppelt-Sourcen unschädlich ist
if [[ "${__COLORS_LIB__:=""}"  == "" ]] && [[ -f "${BASH_LIBS}/colors.lib.sh" ]]; then
    . "${BASH_LIBS}/colors.lib.sh"
fi
if [[ "${__TOOLS_LIB__:=""}"   == "" ]] && [[ -f "${BASH_LIBS}/tools.lib.sh" ]]; then
    . "${BASH_LIBS}/tools.lib.sh"
fi

# Fallback-Farben (falls BashLib beim allerersten Setup noch nicht verlinkt ist)
: "${RED:=$(printf '\033[38;5;196m')}"
: "${GREEN:=$(printf '\033[38;5;10m')}"
: "${YELLOW:=$(printf '\033[38;5;11m')}"
: "${BLUE:=$(printf '\033[38;5;33m')}"
: "${CYAN:=$(printf '\033[38;5;51m')}"
: "${LIGHT_BLUE:=$(printf '\033[38;5;45m')}"
: "${NC:=$(printf '\033[0m')}"

readonly APPNAME="$(basename "$0")"
readonly PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
readonly LIBS_DIR="${PROJECT_ROOT}/.libs"

# BashLib- und MakeLib-Quellen aus den Env-Variablen ableiten.
# BASH_LIBS zeigt üblicherweise auf .../BashLib/src, wir brauchen das
# Repo-Root (eine Ebene höher).
readonly BASHLIB_REPO="$(cd "${BASH_LIBS%/src}" 2>/dev/null && pwd || true)"
readonly MAKELIB_REPO="${DEV_MAKE:-}"

usage() {
    echo
    echo "Usage: ${APPNAME} [ options ]"
    echo
    if command -v usageLine >/dev/null 2>&1; then
        usageLine "-i | --install         " "Symlinks unter ${YELLOW}.libs/${NC} anlegen (idempotent)"
        usageLine "     --info            " "Aktuelle Verlinkung anzeigen"
        usageLine "-h | --help            " "Diese Hilfe anzeigen"
    else
        printf "    ${CYAN}%-24s${NC} %s\n" "-i | --install" "Symlinks unter ${YELLOW}.libs/${NC} anlegen (idempotent)"
        printf "    ${CYAN}%-24s${NC} %s\n" "     --info"    "Aktuelle Verlinkung anzeigen"
        printf "    ${CYAN}%-24s${NC} %s\n" "-h | --help"    "Diese Hilfe anzeigen"
    fi
    echo
    echo -e "${LIGHT_BLUE}Hints:${NC}"
    echo -e "    Symlinks anlegen: ${GREEN}${APPNAME} --install${NC}"
    echo -e "    Status prüfen:    ${GREEN}${APPNAME} --info${NC}"
    echo
    echo -e "${LIGHT_BLUE}Voraussetzungen:${NC}"
    echo -e "    ${YELLOW}BASH_LIBS${NC} → ${BLUE}${BASH_LIBS:-<nicht gesetzt>}${NC}"
    echo -e "    ${YELLOW}DEV_MAKE${NC}  → ${BLUE}${DEV_MAKE:-<nicht gesetzt>}${NC}"
    echo
}

# Verlinkt <src> nach <dst>, überschreibt bestehende Symlinks.
#
# Params:
#   $1 - Quell-Verzeichnis (absoluter Pfad, muss existieren)
#   $2 - Ziel-Symlink (wird angelegt/überschrieben)
#
# Returns:
#   0 wenn erfolgreich, 1 wenn Quelle fehlt
linkOnce() {
    local -r _src="$1"
    local -r _dst="$2"

    if [[ ! -d "${_src}" ]]; then
        return 1
    fi

    mkdir -p "$(dirname "${_dst}")"
    rm -f "${_dst}"
    ln -s "${_src}" "${_dst}"
}

cmd_install() {
    local _rc=0

    echo
    echo -e "${CYAN}▶ Symlinks anlegen unter ${YELLOW}${LIBS_DIR}${NC}"
    echo

    if [[ -z "${BASHLIB_REPO}" || ! -d "${BASHLIB_REPO}" ]]; then
        echo -e "${RED}✗ BashLib-Repo nicht gefunden${NC}" >&2
        echo -e "  ${YELLOW}Tipp:${NC} ${YELLOW}BASH_LIBS${NC} soll auf .../BashLib/src zeigen — aktuell: ${BLUE}${BASH_LIBS:-<leer>}${NC}" >&2
        _rc=1
    else
        linkOnce "${BASHLIB_REPO}" "${LIBS_DIR}/BashLib" && \
            echo -e "  ${GREEN}✓${NC} BashLib   → ${BLUE}${BASHLIB_REPO}${NC}"
    fi

    if [[ -z "${MAKELIB_REPO}" || ! -d "${MAKELIB_REPO}" ]]; then
        echo -e "${RED}✗ MakeLib-Repo nicht gefunden${NC}" >&2
        echo -e "  ${YELLOW}Tipp:${NC} ${YELLOW}DEV_MAKE${NC} soll auf .../MakeLib zeigen — aktuell: ${BLUE}${DEV_MAKE:-<leer>}${NC}" >&2
        _rc=1
    else
        linkOnce "${MAKELIB_REPO}" "${LIBS_DIR}/MakeLib" && \
            echo -e "  ${GREEN}✓${NC} MakeLib   → ${BLUE}${MAKELIB_REPO}${NC}"
    fi

    echo

    if [[ ${_rc} -ne 0 ]]; then
        echo -e "${RED}Setup fehlgeschlagen. Env-Variablen prüfen und erneut versuchen.${NC}" >&2
        exit ${_rc}
    fi

    echo -e "${GREEN}✓ Setup fertig${NC}"
    echo
}

cmd_info() {
    echo
    echo -e "${CYAN}▶ Aktuelle Verlinkung${NC}"
    echo

    for lib in BashLib MakeLib; do
        local _path="${LIBS_DIR}/${lib}"
        if [[ -L "${_path}" ]]; then
            local _target
            _target="$(readlink "${_path}")"
            if [[ -d "${_target}" ]]; then
                echo -e "  ${GREEN}✓${NC} ${lib}   → ${BLUE}${_target}${NC}"
            else
                echo -e "  ${YELLOW}⚠${NC} ${lib}   → ${BLUE}${_target}${NC} ${RED}(Ziel fehlt)${NC}"
            fi
        elif [[ -e "${_path}" ]]; then
            echo -e "  ${YELLOW}⚠${NC} ${lib}   — existiert, ist aber kein Symlink"
        else
            echo -e "  ${RED}✗${NC} ${lib}   — nicht verlinkt"
        fi
    done
    echo
}

# Kein Argument → Help anzeigen (keine Ausnahmen)
if [[ $# -eq 0 ]]; then
    usage
    exit 0
fi

case "$1" in
    -i|--install) cmd_install ;;
       --info)    cmd_info ;;
    -h|--help)    usage; exit 0 ;;
    *)
        echo -e "${RED}Unbekannte Option: $1${NC}" >&2
        usage
        exit 1
        ;;
esac
