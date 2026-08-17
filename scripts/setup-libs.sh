#!/usr/bin/env bash
#------------------------------------------------------------------------------
# setup-libs.sh — Legt Symlinks unter .libs/ zu BashLib, MakeLib und
#                 ProjectTools an
#
# Das sind zentrale Konventions-Repos. Dieses Script verlinkt sie ins Projekt
# (nicht kopieren), damit alle Scripts und das Makefile mit denselben Versionen
# arbeiten wie systemweit.
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

# Quell-Repos aus den Env-Variablen ableiten.
# BASH_LIBS und PROJECT_TOOLS zeigen üblicherweise auf .../<Repo>/src, wir
# brauchen das Repo-Root (eine Ebene höher). DEV_MAKE zeigt direkt aufs Root.
readonly BASHLIB_REPO="$(cd "${BASH_LIBS%/src}" 2>/dev/null && pwd || true)"
readonly MAKELIB_REPO="${DEV_MAKE:-}"
readonly PROJECTTOOLS_REPO="$([[ -n "${PROJECT_TOOLS:-}" ]] && cd "${PROJECT_TOOLS%/src}" 2>/dev/null && pwd || true)"

# Was verlinkt wird: "<Name>|<Env-Variable>|<Repo-Root>|<erwarteter Wert>"
# Der Name ist zugleich der Symlink unter .libs/.
readonly LINKED_REPOS=(
    "BashLib|BASH_LIBS|${BASHLIB_REPO}|.../BashLib/src"
    "MakeLib|DEV_MAKE|${MAKELIB_REPO}|.../MakeLib"
    "ProjectTools|PROJECT_TOOLS|${PROJECTTOOLS_REPO}|.../ProjectTools/src"
)

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
    printf "    ${YELLOW}%-13s${NC} → ${BLUE}%s${NC}\n" "BASH_LIBS"     "${BASH_LIBS:-<nicht gesetzt>}"
    printf "    ${YELLOW}%-13s${NC} → ${BLUE}%s${NC}\n" "DEV_MAKE"      "${DEV_MAKE:-<nicht gesetzt>}"
    printf "    ${YELLOW}%-13s${NC} → ${BLUE}%s${NC}\n" "PROJECT_TOOLS" "${PROJECT_TOOLS:-<nicht gesetzt>}"
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
    local _entry _name _envvar _repo _expected

    echo
    echo -e "${CYAN}▶ Symlinks anlegen unter ${YELLOW}${LIBS_DIR}${NC}"
    echo

    for _entry in "${LINKED_REPOS[@]}"; do
        IFS='|' read -r _name _envvar _repo _expected <<< "${_entry}"

        if [[ -z "${_repo}" || ! -d "${_repo}" ]]; then
            echo -e "${RED}✗ ${_name}-Repo nicht gefunden${NC}" >&2
            echo -e "  ${YELLOW}Tipp:${NC} ${YELLOW}${_envvar}${NC} soll auf ${_expected} zeigen — aktuell: ${BLUE}${!_envvar:-<leer>}${NC}" >&2
            _rc=1
            continue
        fi

        linkOnce "${_repo}" "${LIBS_DIR}/${_name}" && \
            printf "  ${GREEN}✓${NC} %-13s → ${BLUE}%s${NC}\n" "${_name}" "${_repo}"
    done

    echo

    if [[ ${_rc} -ne 0 ]]; then
        echo -e "${RED}Setup fehlgeschlagen. Env-Variablen prüfen und erneut versuchen.${NC}" >&2
        exit ${_rc}
    fi

    echo -e "${GREEN}✓ Setup fertig${NC}"
    echo
}

cmd_info() {
    local _entry _name _path _target

    echo
    echo -e "${CYAN}▶ Aktuelle Verlinkung${NC}"
    echo

    for _entry in "${LINKED_REPOS[@]}"; do
        _name="${_entry%%|*}"
        _path="${LIBS_DIR}/${_name}"

        if [[ -L "${_path}" ]]; then
            _target="$(readlink "${_path}")"
            if [[ -d "${_target}" ]]; then
                printf "  ${GREEN}✓${NC} %-13s → ${BLUE}%s${NC}\n" "${_name}" "${_target}"
            else
                printf "  ${YELLOW}⚠${NC} %-13s → ${BLUE}%s${NC} ${RED}(Ziel fehlt)${NC}\n" "${_name}" "${_target}"
            fi
        elif [[ -e "${_path}" ]]; then
            printf "  ${YELLOW}⚠${NC} %-13s — existiert, ist aber kein Symlink\n" "${_name}"
        else
            printf "  ${RED}✗${NC} %-13s — nicht verlinkt\n" "${_name}"
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
