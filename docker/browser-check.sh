#!/usr/bin/env bash
#------------------------------------------------------------------------------
# browser-check.sh — sichtbare Browserprüfung des lokal gebauten Images (T-82)
#
# Startet zwei Wegwerf-Container und prüft jeden mit
# frontend/scripts/stockinfo-proxy-check.mjs im sichtbaren Browser:
#
#   1. STOCKINFO_API_URL zeigt auf den StockInfo-Testdienst des Teststacks,
#      erreichbar nur über host.docker.internal: Kurse, Verlauf, Aktualisieren
#      und Statusseite laufen über den Server.
#   2. STOCKINFO_API_URL zeigt auf einen Namen, der nicht auflöst: Der Server
#      meldet 502 stockinfo_unreachable, die Oberfläche sagt das.
#
# Voraussetzung: laufender Teststack (StockInfo-Testdienst auf 8899) und ein
# Image aus `make build`. Aufruf aus dem Repository-Root:
#
#   .venv/bin/python scripts/stockinfo-test-server.py --stack --run --stockinfo-root ../StockInfo
#   ./docker/browser-check.sh [image]        # Vorgabe: mangolila/stockportfolio:latest
#
# Alles, was der Lauf anlegt, räumt er am Ende selbst wieder ab.
#------------------------------------------------------------------------------
set -uo pipefail

readonly IMAGE="${1:-mangolila/stockportfolio:latest}"
readonly ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
readonly PORT=18091
readonly ORIGIN="http://127.0.0.1:${PORT}"
readonly STOCKINFO_PORT="${STOCKINFO_PORT:-8899}"
readonly REACHABLE_URL="http://host.docker.internal:${STOCKINFO_PORT}"
readonly MISSING_URL="http://stockinfo-missing.invalid:8000"
readonly USERNAME="browser-admin"
readonly PASSWORD='Browser-Check-Pass1!'
readonly LABEL="stockportfolio-browser-check=$$"
readonly WORK="$(mktemp -d)"
FAILURES=0

cleanup() {
    docker ps -aq --filter "label=${LABEL}" | xargs docker rm -fv >/dev/null 2>&1
    rm -rf "${WORK}"
}
trap cleanup EXIT

# Wartet auf /healthz; unter Emulation dauert der Start einige Sekunden.
waitReady() {
    local -r START=${SECONDS}
    until [[ "$(curl -s -o /dev/null -w '%{http_code}' "${ORIGIN}/healthz")" == 200 ]]; do
        if (( SECONDS - START > 90 )) || [[ "$(docker inspect -f '{{.State.Running}}' "$1" 2>/dev/null)" != true ]]; then
            return 1
        fi
        sleep 1
    done
}

# Startet einen Container mit der angegebenen StockInfo-Adresse, legt das
# Admin-Konto an und ruft die Browserprüfung auf; weitere Argumente gehen an sie.
runCase() {
    local -r TITLE="$1" TARGET_URL="$2"
    shift 2
    echo "-- ${TITLE}"
    local -r CONTAINER=$(docker run -d --label "${LABEL}" --platform linux/amd64 \
        --add-host host.docker.internal:host-gateway -p "127.0.0.1:${PORT}:8080" \
        -e STOCKPORTFOLIO_PUBLIC_ORIGIN="${ORIGIN}" -e STOCKINFO_API_URL="${TARGET_URL}" \
        --mount type=tmpfs,destination=/data "${IMAGE}" 2>/dev/null)
    if ! waitReady "${CONTAINER}"; then
        echo "FEHLER  Container startet nicht: $(docker logs "${CONTAINER}" 2>&1 | tail -3)"
        FAILURES=$((FAILURES + 1))
        docker rm -fv "${CONTAINER}" >/dev/null 2>&1
        return
    fi
    local -r CODE=$(docker logs "${CONTAINER}" 2>&1 | sed -n 's/.*setup code: \([^ ]*\).*/\1/p' | tail -1)
    curl -s -o /dev/null -H "Origin: ${ORIGIN}" -H 'Content-Type: application/json' \
        -d "{\"code\":\"${CODE}\",\"username\":\"${USERNAME}\",\"password\":\"${PASSWORD}\"}" "${ORIGIN}/api/setup"
    printf '{"admin":{"username":"%s","password":"%s"}}' "${USERNAME}" "${PASSWORD}" > "${WORK}/accounts.json"
    if ! STOCKPORTFOLIO_ORIGIN="${ORIGIN}" STOCKINFO_URL="${TARGET_URL}" \
        npm --prefix "${ROOT}/frontend" run -s check:stockinfo-proxy -- "${WORK}/accounts.json" "$@"; then
        FAILURES=$((FAILURES + 1))
    fi
    docker rm -fv "${CONTAINER}" >/dev/null 2>&1
}

if [[ "$(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:${STOCKINFO_PORT}/health")" != 200 ]]; then
    echo "StockInfo-Testdienst auf 127.0.0.1:${STOCKINFO_PORT} antwortet nicht; zuerst den Teststack starten."
    exit 2
fi
echo "Image: ${IMAGE}"
runCase "1 · StockInfo unter ${REACHABLE_URL}" "${REACHABLE_URL}"
runCase "2 · StockInfo unter ${MISSING_URL} (löst nicht auf)" "${MISSING_URL}" --unreachable

echo
if (( FAILURES > 0 )); then
    echo "${FAILURES} Fall/Fälle fehlgeschlagen."
    exit 1
fi
echo "Beide Fälle bestanden."
