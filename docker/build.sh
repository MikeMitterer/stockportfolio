#!/usr/bin/env bash

#------------------------------------------------------------------------------
# Build Docker-Image: mangolila/stockportfolio
#------------------------------------------------------------------------------

# Vars die in .bashrc gesetzt sein müssen ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
if [[ -z ${BASH_LIBS+x} ]]; then echo "Var 'BASH_LIBS' nicht gesetzt!"; exit 1; fi
# ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

# -e  bricht bei erstem Fehler ab   (Ausnahme: 'command || true')
# -o pipefail  Pipeline-Exit-Code = rechtestes fehlgeschlagenes Kommando
# -u  unset-Variable = Fehler
set -eou pipefail

readonly APPNAME="${0##*/}"

SCRIPT=$(realpath "$0")
SCRIPTPATH=$(dirname "$SCRIPT")
readonly SCRIPT SCRIPTPATH

#------------------------------------------------------------------------------
# Set WORKSPACE
#
cd "${SCRIPTPATH}"



readonly NAMESPACE="mangolila"
readonly NAME="stockportfolio"

readonly TAGFILE="${SCRIPTPATH}/.last-build-tag"
readonly WARN_DAYS=7

# Jeder neue Buildversuch entwertet den vorherigen Push-Nachweis, auch wenn
# Bibliothek, Plattformwahl oder Git-Prüfung bereits vor dem Docker-Build scheitern.
if [[ "${1:-}" == --build || "${1:-}" == -b ]]; then
    if [[ -f "${TAGFILE}" ]]; then unlink "${TAGFILE}"; fi
fi

#------------------------------------------------------------------------------
# Einbinden der globalen Build-Lib
#   Hier sind z.B. Farben, generell globale VARs und Funktionen definiert
#
# shellcheck disable=SC1091  # externe BashLib aus BASH_LIBS
if [[ "${__BUILD_LIB__:=""}"   == "" ]]; then . "${BASH_LIBS}/build.lib.sh";   fi
# shellcheck disable=SC1091  # externe BashLib aus BASH_LIBS
if [[ "${__DOCKER_LIB__:=""}"  == "" ]]; then . "${BASH_LIBS}/docker.lib.sh";  fi
# shellcheck disable=SC1091  # externe BashLib aus BASH_LIBS
if [[ "${__VERSION_LIB__:=""}" == "" ]]; then . "${BASH_LIBS}/version.lib.sh"; fi



# --update zieht eine explizite Referenz; Dockerfile-Syntax wird nicht nachgebaut.
readonly DOCKER_BASE_IMAGE="${BASE_IMAGE:-}"

#------------------------------------------------------------------------------
# Registry-Ziel (TARGET) — wohin `--push` das Image lädt
#
#   Überschreibbar per Env:   TARGET=dockerhub ./build.sh --push
#
#   ghcr       GitHub Container Registry (ghcr.io)
#              Image:   ghcr.io/<GITHUB_OWNER>/<NAMESPACE>-<NAME>
#              Login:   einmalig manuell —
#                       echo <PAT> | docker login ghcr.io -u <user> --password-stdin   (Scope: write:packages)
#              Braucht: GITHUB_OWNER  (per Env/.bashrc, sonst der hier gesetzte Default)
#
#   dockerhub  Docker Hub (docker.io)
#              Image:   <NAMESPACE>/<NAME>            (NAMESPACE = Docker-Hub-User/Org)
#              Login:   loginToDockerHub — liest das Passwort aus ${DOCKER_PW_FILE} (12h-Cache)
#              Braucht: DOCKER_PW_FILE  (Default: ${HOME}/.docker/dockerhub.sec)
#
#   ecr        Amazon Elastic Container Registry
#              Image:   <AMAZON_REPO_URI>/<NAME>     (Repository muss in ECR vorab existieren)
#              Login:   aws ecr get-login-password | docker login  (automatisch beim Push)
#              Braucht: AMAZON_REPO_URI  (z.B. 123456789012.dkr.ecr.eu-west-1.amazonaws.com)
#                       AWS_REGION       (Default: eu-west-1)
#
readonly TARGET="${TARGET:-dockerhub}"

# Registry-spezifische Variablen setzen: REGISTRY (Anzeige) + IMAGE (voll qualifizierte
# Registry-Referenz); lokaler Testbuild trägt zusätzlich ${NAMESPACE}/${NAME}.
case "${TARGET}" in
    ghcr)
        GITHUB_OWNER="${GITHUB_OWNER:-MikeMitterer}"
        if [[ -z "${GITHUB_OWNER}" ]]; then
            echo -e "\n${RED}TARGET=ghcr:${NC} Var 'GITHUB_OWNER' nicht gesetzt!" >&2
            exit 1
        fi
        readonly GITHUB_OWNER
        GITHUB_OWNER_LOWER=$(printf '%s' "${GITHUB_OWNER}" | tr '[:upper:]' '[:lower:]')
        readonly GITHUB_OWNER_LOWER
        readonly REGISTRY="ghcr.io"
        # Docker/OCI-Image-Referenzen müssen lowercase sein — GITHUB_OWNER kommt
        # i.d.R. in GitHub-Schreibweise (z.B. "MikeMitterer").
        readonly IMAGE="${REGISTRY}/${GITHUB_OWNER_LOWER}/${NAMESPACE}-${NAME}"
    ;;
    dockerhub)
        readonly REGISTRY="docker.io"
        readonly IMAGE="${NAMESPACE}/${NAME}"
        # loginToDockerHub (docker.lib.sh) liest das Passwort aus dieser Datei:
        readonly DOCKER_CONFIG="${DOCKER_CONFIG:-${HOME}/.docker}"
        readonly DOCKER_PW_FILE="${DOCKER_PW_FILE:-${DOCKER_CONFIG}/dockerhub.sec}"
    ;;
    ecr)
        if [[ -z "${AMAZON_REPO_URI:-}" ]]; then
            echo -e "\n${RED}TARGET=ecr:${NC} Var 'AMAZON_REPO_URI' nicht gesetzt." >&2
            echo -e "${YELLOW}Beispiel:${NC} AMAZON_REPO_URI=123456789012.dkr.ecr.eu-west-1.amazonaws.com\n" >&2
            exit 1
        fi
        readonly AWS_REGION="${AWS_REGION:-eu-west-1}"
        readonly REGISTRY="${AMAZON_REPO_URI}"
        readonly IMAGE="${REGISTRY}/${NAME}"
    ;;
    *)
        echo -e "\n${RED}Unbekanntes TARGET: '${TARGET}'${NC} — erlaubt: ${YELLOW}ghcr | dockerhub | ecr${NC}\n" >&2
        exit 1
    ;;
esac

# CMDLINE kann ab hier verwendet werden ---------------------------------------

readonly CMDLINE=${1:-}
readonly OPTION=${2:-""}

# Die möglichen Plattformen:
#   https://docs.docker.com/build/building/multi-platform/
readonly PLATFORMS="linux/arm64 linux/amd64"

# Ohne Make-Plattformangabe gilt wie bei StockInfo die Host-Architektur.
PLATFORM="${ARCHITECTURE}"

case "${CMDLINE}" in
    --build|-b)
        [[ $# -le 2 ]] || { echo 'Zu viele Argumente.' >&2; exit 2; }
        _REQUESTED="${OPTION:-${ARCHITECTURE}}"
        case "${_REQUESTED}" in
            x86|x86_64|amd64|linux/amd64) PLATFORM=linux/amd64 ;;
            arm|m1|arm64|aarch64|linux/arm64) PLATFORM=linux/arm64 ;;
            all) echo 'Eine Plattform wählen: x86 oder arm. Erst lokal prüfen, dann --push.' >&2; exit 2 ;;
            *) echo "Unbekannte Plattform: ${_REQUESTED}" >&2; exit 2 ;;
        esac
        unset _REQUESTED ;;
    ''|-h|help|-help|--help|-u|--update|-i|--images|-s|--samples|-p|--push)
        [[ $# -le 1 ]] || { echo 'Zu viele Argumente.' >&2; exit 2; } ;;
    *) echo "Unbekannte Option: ${CMDLINE}" >&2; exit 2 ;;
esac

#------------------------------------------------------------------------------
# TAG via gitDockerTag (version.lib.sh): Git-Tag als Basis, docker-safe Build-Meta
# STRICT=2 (Default/relaxed): rc=2 kein Tag, rc=3 dirty — ahead erlaubt
# STRICT=1: zusätzlich rc=4 wenn ahead > 0
#
# Überschreiben via Env: STRICT=1 ./build.sh --build
#
readonly STRICT=${STRICT:-2}

# Streng für den Build (dort wird das Image getaggt). Für Anzeige/Hilfe reicht
# best-effort (STRICT=0) — so funktioniert --help auch ohne Git-Tag im Clone.
if [[ "${CMDLINE}" == "-b" || "${CMDLINE}" == "--build" ]]; then
    _TAG_RC=0
    TAG="$(gitDockerTag "${STRICT}")" || _TAG_RC=$?
    # Release-Tag, aus dem der Docker-Tag stammt, und sein Tag-Objekt beim Build; push
    # prüft, dass genau dieses Objekt auf origin liegt.
    GIT_TAG="$(gitReleaseTag HEAD)" || GIT_TAG=''
    GIT_TAG_OBJECT=''
    [[ -z "${GIT_TAG}" ]] || GIT_TAG_OBJECT="$(git rev-parse -q --verify "refs/tags/${GIT_TAG}")" || GIT_TAG_OBJECT=''
    if [[ $_TAG_RC -eq 2 ]]; then
        echo -e "\n${RED}Build abgebrochen:${NC} Kein Git-Tag gefunden." >&2
        echo -e "${YELLOW}Tipp:${NC} Release-Tag mit ${BLUE}make tag-patch${NC} anlegen (nur lokal), danach ${BLUE}git push --follow-tags${NC}\n" >&2
        exit 1
    elif [[ $_TAG_RC -eq 3 ]]; then
        echo -e "\n${RED}Build abgebrochen:${NC} Working-Tree ist dirty." >&2
        echo -e "${YELLOW}Tipp:${NC} git commit oder git stash\n" >&2
        exit 1
    elif [[ $_TAG_RC -eq 4 ]]; then
        echo -e "\n${RED}Build abgebrochen:${NC} Repo ist ahead vom letzten Tag (STRICT=1)." >&2
        echo -e "${YELLOW}Tipp:${NC} Release-Tag mit ${BLUE}make tag-patch${NC} anlegen — oder mit ${BLUE}STRICT=2 ./build.sh --build${NC} (ahead erlaubt)\n" >&2
        exit 1
    elif [[ $_TAG_RC -ne 0 ]]; then
        echo -e "\n${RED}Build abgebrochen:${NC} gitDockerTag fehlgeschlagen (rc=${_TAG_RC}).\n" >&2
        exit 1
    fi
else
    TAG="$(gitDockerTag 0 2>/dev/null)" || TAG="n/a"
    GIT_TAG=''
    GIT_TAG_OBJECT=''
fi
readonly TAG GIT_TAG GIT_TAG_OBJECT

#------------------------------------------------------------------------------
# Functions
#

# prepareConfig — Optionaler Build-Vorbereitungs-Schritt
#
#   No-op solange das (Multi-Stage-)Dockerfile Build + Deps selbst übernimmt.
#   Bei Services die vor dem Build Dateien ins Build-Kontext-Verzeichnis kopieren
#   müssen (Configs, Scripts, Zertifikate) hier befüllen — vgl. certbot-Template.
#
prepareConfig() {
    : # kein separates Config-Prep nötig
}

# pushImage — Delegiert an die Registry-spezifische Lib-Push-Funktion (nach TARGET)
#
#   Jede Lib-Push-Funktion kapselt ihren eigenen Login und pusht ${_TAG} + latest.
#
#   Params:
#     - Tag des zu pushenden Images
#
pushImage() {
    local -r _TAG=${1:?}

    case "${TARGET}" in
        ghcr)      pushImage2GHCR      "${GITHUB_OWNER_LOWER}" "${NAMESPACE}-${NAME}" "${_TAG}" ;;
        dockerhub) pushImage2DockerHub "${NAMESPACE}"       "${NAME}"              "${_TAG}" ;;
        ecr)       pushImage2Amazon    "${AMAZON_REPO_URI}" "${NAME}" "${_TAG}" "${AWS_REGION}" ;;
    esac
}

# Gemeinsamer ProjectTools-Helfer: Vorschau vor, Übertragung nach dem Image-Push.
# $1: --preview oder --publish; nur Token-Dateipfad, niemals Token-Inhalt übergeben.
updateDockerHubReadme() {
    [[ "${TARGET}" == dockerhub ]] || return 0
    local -r _ACTION="$1"
    local -r _HELPER="${PROJECT_TOOLS:-${SCRIPTPATH}/../.libs/ProjectTools/src}/bash/dockerhub-readme.sh"
    if [[ "${_ACTION}" == --publish ]]; then
        DOCKER_README_AFTER_PUSH=1 "${_HELPER}" \
            --project-dir "${SCRIPTPATH}/.." --ref "${DOCKER_README_REF:-master}" \
            --readme docker/README.md --publish --repository "${NAMESPACE}/${NAME}" --token-file "${DOCKER_PW_FILE}"
    else
        "${_HELPER}" --project-dir "${SCRIPTPATH}/.." --ref "${DOCKER_README_REF:-master}" \
            --readme docker/README.md --preview
    fi
}

# showBuiltImages — Lokale (und bei ECR zusätzlich Registry-)Images anzeigen
#
#   showImages nimmt optional die Amazon-URI als 4. Parameter und listet dann
#   auch die ECR-getaggten Images — bei ghcr/dockerhub weggelassen.
#
showBuiltImages() {
    if [[ "${TARGET}" == "ecr" ]]; then
        showImages "${TAG}" "${NAMESPACE}" "${NAME}" "${AMAZON_REPO_URI}"
    else
        showImages "${TAG}" "${NAMESPACE}" "${NAME}"
    fi
}

# Speichert $1=Build-Art und $2=Image-ID; ein neuer Versuch invalidiert alte Marker.
# Rückgabe: 0 bei Erfolg, sonst Fehler des Dateiwerkzeugs.
saveBuild() {
    local -r _KIND="$1" _IMAGE_ID="$2"
    local _TIMESTAMP _TEMP
    _TIMESTAMP=$(date +%s)
    _TEMP=$(mktemp "${TAGFILE}.XXXXXX")
    if ! printf '%s\n' "${TAG}" "${_TIMESTAMP}" "${_KIND}" "${_IMAGE_ID}" "${GIT_TAG}" "${GIT_TAG_OBJECT}" > "${_TEMP}"; then
        unlink "${_TEMP}"
        return 1
    fi
    mv -f "${_TEMP}" "${TAGFILE}"
}

# Baut lokal und speichert die Image-ID für die spätere Veröffentlichung.
# Rückgabe: 0 bei Erfolg, Fehler beenden den Lauf vor einem Erfolgsclaim.
build() {
    local _IMAGE_ID _LOGFILE
    saveBuild pending '-'
    prepareConfig
    mkdir -p logs
    _LOGFILE="logs/build-$(date +%y%m%d).log"
    buildSingleArchImage "${PLATFORM}" "${NAMESPACE}/${NAME}" "${IMAGE}" "${TAG}" "${_LOGFILE}" "${SCRIPTPATH}/Dockerfile" ..
    _IMAGE_ID=$(docker image inspect "${IMAGE}:${TAG}" --format '{{.Id}}')
    [[ "${_IMAGE_ID}" =~ ^sha256:[0-9a-f]{64}$ ]] || { echo 'Ungültige Image-ID.' >&2; exit 1; }
    saveBuild single "${_IMAGE_ID}"
    showBuiltImages
}

# Liest Daten ohne source/eval in SAVED_TAG/SAVED_IMAGE_ID; Rückgabe: 1 bei altem,
# unvollständigem oder nicht lokal pushbarem Marker. Diagnose nur auf stderr.
loadBuild() {
    local _TIMESTAMP _KIND _NOW
    if [[ ! -f "${TAGFILE}" ]]; then
        echo 'Kein Build-Marker. Zuerst --build ausführen.' >&2
        return 1
    fi
    {
        IFS= read -r SAVED_TAG && IFS= read -r _TIMESTAMP &&
        IFS= read -r _KIND && IFS= read -r SAVED_IMAGE_ID && IFS= read -r SAVED_GIT_TAG &&
        IFS= read -r SAVED_GIT_TAG_OBJECT
    } < "${TAGFILE}" || { echo 'Alter/unvollständiger Build-Marker. Neu bauen.' >&2; return 1; }
    [[ "${_KIND}" == single ]] || { echo 'Kein fertiger lokaler Singlearch-Build; --push gesperrt.' >&2; return 1; }
    [[ "${SAVED_TAG}" =~ ^[a-zA-Z0-9_][a-zA-Z0-9_.-]{0,127}$ &&
       "${SAVED_IMAGE_ID}" =~ ^sha256:[0-9a-f]{64}$ &&
       "${_TIMESTAMP}" =~ ^[1-9][0-9]{0,10}$ &&
       "${SAVED_GIT_TAG}" =~ ^v[0-9][a-zA-Z0-9_.+-]*$ &&
       "${SAVED_GIT_TAG_OBJECT}" =~ ^[0-9a-f]{40}([0-9a-f]{24})?$ ]] || { echo 'Ungültiger Build-Marker.' >&2; return 1; }
    _NOW=$(date +%s)
    if (( (_NOW - _TIMESTAMP) / 86400 >= WARN_DAYS )); then
        printf '%bWarnung: Build ist mindestens %s Tage alt.%b\n' "${YELLOW}" "${WARN_DAYS}" "${NC}" >&2
    fi
}

# requirePublishedTag — Bricht ab, wenn der Release-Tag des Builds nicht so auf origin liegt
#
#   make tag-* taggt nur lokal; ein Image darf erst raus, wenn sein Tag veröffentlicht ist,
#   sonst zeigt die Registry eine Version, die es im Repository nicht gibt. Verglichen wird
#   das Tag-Objekt auf origin mit dem, das der Build gespeichert hat: Wurde der Tag nach dem
#   Build umgesetzt, gehört das Image zum alten Stand, auch wenn lokal und origin übereinstimmen.
#
#   Params:
#     - Release-Tag aus dem Build-Marker
#     - Tag-Objekt beim Build aus dem Build-Marker
#
requirePublishedTag() {
    local -r _GIT_TAG=${1:?} _BUILT=${2:?}
    local _LOCAL _REMOTE
    _LOCAL=$(git rev-parse -q --verify "refs/tags/${_GIT_TAG}") || _LOCAL=''
    _REMOTE=$(git ls-remote --tags origin "refs/tags/${_GIT_TAG}") || _REMOTE=''
    _REMOTE=${_REMOTE%%[[:space:]]*}
    [[ "${_REMOTE}" == "${_BUILT}" ]] && return 0

    echo -e "\n${RED}Push abgebrochen:${NC} Release-Tag ${_GIT_TAG} passt nicht zum Build." >&2
    if [[ -n "${_REMOTE}" ]]; then
        echo -e "Auf origin zeigt er auf ${_REMOTE}, gebaut wurde ${_BUILT}." >&2
        echo -e "${YELLOW}Tipp:${NC} den veröffentlichten Stand neu bauen (${BLUE}make build${NC}), danach ${BLUE}make push${NC}\n" >&2
    elif [[ "${_LOCAL}" != "${_BUILT}" ]]; then
        echo -e "Er liegt nicht auf origin und zeigt lokal nicht mehr auf den gebauten Stand." >&2
        echo -e "${YELLOW}Tipp:${NC} neu bauen (${BLUE}make build${NC}), Tag veröffentlichen, danach ${BLUE}make push${NC}\n" >&2
    else
        echo -e "Er liegt nur lokal und noch nicht auf origin." >&2
        echo -e "${YELLOW}Tipp:${NC} ${BLUE}git push --follow-tags origin master${NC}, danach erneut ${BLUE}make push${NC}\n" >&2
    fi
    exit 1
}

# Bindet Version und latest an dieselbe gespeicherte Image-ID und pusht via BashLib.
# Ein Wechsel von TARGET veröffentlicht damit denselben Build in einer anderen Registry.
push() {
    local _ACTUAL_ID
    loadBuild
    requirePublishedTag "${SAVED_GIT_TAG}" "${SAVED_GIT_TAG_OBJECT}"
    _ACTUAL_ID=$(docker image inspect "${SAVED_IMAGE_ID}" --format '{{.Id}}')
    [[ "${_ACTUAL_ID}" == "${SAVED_IMAGE_ID}" ]] || { echo 'Gespeichertes Image fehlt.' >&2; exit 1; }
    docker tag "${SAVED_IMAGE_ID}" "${IMAGE}:${SAVED_TAG}"
    docker tag "${SAVED_IMAGE_ID}" "${IMAGE}:latest"
    updateDockerHubReadme --preview
    pushImage "${SAVED_TAG}"
    updateDockerHubReadme --publish
    printf '%bPush erfolgreich: %s:%s%b\n' "${GREEN}" "${IMAGE}" "${SAVED_TAG}" "${NC}"
}

# Samples-Array — Beispiel-`docker run`-Befehle für dieses Image
#
#   Erste Zeile jedes Eintrags: "# Beschreibung ||"  ('#' → Sample-Index, '||' → Zeilenende)
#   Folgezeilen: \t und \\ für Einrückung/Zeilenfortsetzung. Wird von showSamples() gelesen.
#   Pro Service anpassen: Ports, Env-Variablen, Volumes.
#
# shellcheck disable=SC2034  # samples wird von showSamples() aus build.lib.sh gelesen
declare -a samples=(
"# StockPortfolio starten — API-Adresse zur Laufzeit setzen ||
\t     docker run --name ${NAME} \\
\t         --rm -p 8080:8080 \\
\t         -e STOCKINFO_API_URL=https://stockinfo.int.mikemitterer.at \\
\t         ${NAMESPACE}/${NAME}
"
"# Gegen eine lokale API — erreichbar vom Browser auf demselben Rechner ||
\t     docker run --name ${NAME} \\
\t         --rm -p 8080:8080 \\
\t         -e STOCKINFO_API_URL=http://localhost:8000 \\
\t         ${NAMESPACE}/${NAME}
"
)

#------------------------------------------------------------------------------
# Options
#

# usage — Verwendungshinweise anzeigen (Optionen, aktuelles Target, Plattform, Base-Image)
#
usage() {
    echo
    echo -e "OS:           ${YELLOW}${MACHINE}${NC}"
    echo -e "Architecture: ${YELLOW}${ARCHITECTURE}${NC}"
    echo -e "Platform:     ${YELLOW}${PLATFORM}${NC}"
    echo -e "Target:       ${YELLOW}${TARGET}${NC} → ${YELLOW}${REGISTRY}${NC}"
    echo -e "Base Image:   ${YELLOW}${DOCKER_BASE_IMAGE:-BASE_IMAGE für --update setzen}${NC}"
    echo
    echo "Usage: ${APPNAME} [ options ]"
    echo -e "       Env: ${YELLOW}TARGET=ghcr|dockerhub|ecr${NC} (Default: dockerhub) — Ziel für --push"
    echo
    usageLine "-u | --update                          " "BASE_IMAGE=<Referenz> mit docker pull aktualisieren"
    echo
    usageLine "-b | --build [ ${YELLOW}platform${NC} ]" "Lokaler Testbuild (Default Host-Plattform): ${BLUE}${NAMESPACE}/${NAME}:${TAG}${NC}" 14
    echo
    usageLine "                                         " "${YELLOW}$PLATFORMS${NC}" 2
    usageLine "                                         " "${YELLOW}x86${NC}      - shortcut for ${YELLOW}linux/amd64${NC}" 2
    usageLine "                                         " "${YELLOW}arm | m1${NC} - shortcut for ${YELLOW}linux/arm64${NC}" 2
    echo
    usageLine "-p | --push                              " "Push zu ${YELLOW}${IMAGE}${NC}"
    echo
    usageLine "-i | --images                            " "Images anzeigen: ${YELLOW}${NAMESPACE}/${NAME}${NC}"
    usageLine "-s | --samples                           " "Beispiel docker run Befehle anzeigen"
    usageLine "-h | --help                              " "Diese Hilfe anzeigen"
    echo "Docker Hub: README nach dem Push aktualisieren (DOCKER_README_REF=master)."
    echo -e "\n${YELLOW}Hints:${NC} --build baut lokal; nach der Prüfung veröffentlicht --push denselben Stand."
    echo
}


case "${CMDLINE}" in

    -u|--update)
        [[ -n "${DOCKER_BASE_IMAGE}" && "${DOCKER_BASE_IMAGE}" != -* ]] || { echo "BASE_IMAGE=<Referenz> setzen." >&2; exit 2; }
        docker pull "${DOCKER_BASE_IMAGE}"
    ;;

    -b|--build)
        build
    ;;

    -i|--images)
        showBuiltImages
    ;;

    -s|--samples)
        showSamples
    ;;

    -p|--push)
        push
    ;;

    help|-help|-h|--help|'')
        usage
    ;;

esac

#------------------------------------------------------------------------------
# Alles OK...

exit 0
