#!/usr/bin/env bash
#------------------------------------------------------------------------------
# smoke-test.sh — Laufzeitprüfung des lokal gebauten Images
#
# Startet eigene Wegwerf-Container und -Volumes und prüft Start, Setup, Login,
# Datenhaltung und den Benutzerwechsel auf PUID/PGID (T-72). Alles, was der
# Test anlegt, räumt er am Ende selbst wieder ab; fremde Container bleiben
# unberührt. Aufruf nach `make build`:
#
#   ./docker/smoke-test.sh [image]        # Vorgabe: mangolila/stockportfolio:latest
#------------------------------------------------------------------------------
set -uo pipefail

readonly IMAGE="${1:-mangolila/stockportfolio:latest}"
readonly PORT=18090
readonly ORIGIN="http://127.0.0.1:${PORT}"
readonly PASSWORD='Smoke-Test-Pass1!'
readonly JAR="$(mktemp)"
# Alles, was dieser Lauf anlegt, trägt dieses Label. Die Hilfsfunktionen
# laufen in $(…)-Subshells; eine Liste in Variablen käme dort nie an.
readonly LABEL="stockportfolio-smoke=$$"
FAILURES=0

cleanup() {
    docker ps -aq --filter "label=${LABEL}" | xargs docker rm -fv >/dev/null 2>&1
    docker volume ls -q --filter "label=${LABEL}" | xargs docker volume rm >/dev/null 2>&1
    rm -f "${JAR}"
}
trap cleanup EXIT

pass() { echo "OK      $*"; }
failed() { echo "FEHLER  $*"; FAILURES=$((FAILURES + 1)); }
expect() { if [[ "$2" == "$3" ]]; then pass "$1"; else failed "$1: erwartet '$3', erhalten '$2'"; fi; }

# Startet einen Container im Hintergrund, mit dem Label dieses Laufs.
start() {
    docker run -d --label "${LABEL}" --platform linux/amd64 -p "127.0.0.1:${PORT}:8080" \
        -e STOCKPORTFOLIO_PUBLIC_ORIGIN="${ORIGIN}" -e STOCKINFO_API_URL=http://127.0.0.1:8899 \
        "$@" "${IMAGE}" 2>/dev/null
}

stop() { docker rm -fv "$1" >/dev/null 2>&1; }

newVolume() { docker volume create --label "${LABEL}"; }

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

# Wartet höchstens 60 s, bis ein Container beendet ist, und liefert seine
# Logausgabe. Läuft er dann noch, ist das selbst der Fehler — nicht hängen.
exitLog() {
    local -r START=${SECONDS}
    while [[ "$(docker inspect -f '{{.State.Running}}' "$1" 2>/dev/null)" == true ]]; do
        if (( SECONDS - START > 60 )); then echo "(läuft nach 60 s noch)"; return 0; fi
        sleep 1
    done
    docker logs "$1" 2>&1
}

setupAdmin() {
    local -r CODE=$(docker logs "$1" 2>&1 | sed -n 's/.*setup code: \([^ ]*\).*/\1/p' | tail -1)
    curl -s -o /dev/null -w '%{http_code}' -H "Origin: ${ORIGIN}" -H 'Content-Type: application/json' \
        -d "{\"code\":\"${CODE}\",\"username\":\"smoke-admin\",\"password\":\"${PASSWORD}\"}" "${ORIGIN}/api/setup"
}

login() {
    curl -s -o /dev/null -w '%{http_code}' -c "${JAR}" -H "Origin: ${ORIGIN}" -H 'Content-Type: application/json' \
        -d "{\"username\":\"smoke-admin\",\"password\":\"${PASSWORD}\"}" "${ORIGIN}/api/auth/login"
}

# UID:GID des App-Prozesses (node dist/index.js) laut Prozessliste.
appIds() {
    docker top "$1" -eo pid,uid,gid,args | awk '/dist\/index.js/ && !/setpriv/ { print $2 ":" $3; exit }'
}

dataOwner() { docker exec "$1" stat -c '%u:%g' /data/stockportfolio.sqlite 2>/dev/null; }

echo "Image: ${IMAGE} ($(docker image inspect "${IMAGE}" --format '{{.Os}}/{{.Architecture}}'))"

# 1 · Frischer Bind-Mount gehört root (wie ein von Docker angelegter Appdata-Ordner).
echo "-- 1 · /data gehört root"
C=$(start --mount type=tmpfs,destination=/data,tmpfs-mode=0755)
if waitReady "${C}"; then
    expect "Setup" "$(setupAdmin "${C}")" 201
    expect "Login" "$(login)" 200
    expect "Datenbank gehört 99:100" "$(dataOwner "${C}")" "99:100"
    expect "App-Prozess läuft als 99:100" "$(appIds "${C}")" "99:100"
    expect "Daten ohne Sitzung gesperrt" "$(curl -s -o /dev/null -w '%{http_code}' "${ORIGIN}/api/data/portfolio")" 401
    expect "config.js enthält StockInfo-Adresse" "$(curl -s "${ORIGIN}/config.js" | grep -c '127.0.0.1:8899')" 1
else
    failed "Container startet nicht: $(docker logs "${C}" 2>&1 | tail -3)"
fi
stop "${C}"

# 2 · Vorhandene Daten mit UID 1000 (alte Images) und 3 · Start mit --user.
echo "-- 2/3 · Altbestand mit UID 1000, Start mit --user"
V=$(newVolume)
# Ein leeres Volume bekäme beim Einhängen wieder die Rechte aus dem Image;
# echte Altdaten sind nie leer, deshalb eine Datei anlegen.
docker run --rm --platform linux/amd64 --entrypoint sh -v "${V}:/data" "${IMAGE}" \
    -c 'touch /data/.legacy && chown -R 1000:1000 /data' 2>/dev/null
C=$(start --user 1000:1000 -v "${V}:/data")
if waitReady "${C}"; then
    expect "--user: Setup" "$(setupAdmin "${C}")" 201
    expect "--user: App-Prozess läuft als 1000:1000" "$(appIds "${C}")" "1000:1000"
    expect "--user: Datenbank gehört 1000:1000" "$(dataOwner "${C}")" "1000:1000"
else
    failed "--user startet nicht: $(docker logs "${C}" 2>&1 | tail -3)"
fi
stop "${C}"
C=$(start -v "${V}:/data")
if waitReady "${C}"; then
    expect "Altbestand: Login mit altem Konto" "$(login)" 200
    expect "Altbestand: Datenbank jetzt 99:100" "$(dataOwner "${C}")" "99:100"
    expect "Altbestand: Log meldet Eigentümerwechsel" "$(docker logs "${C}" 2>&1 | grep -c 'set owner of /data to 99:100')" 1
else
    failed "Altbestand startet nicht: $(docker logs "${C}" 2>&1 | tail -3)"
fi
stop "${C}"

echo "-- 3b · --user ohne Schreibrecht"
C=$(start --user 1000:1000 --mount type=tmpfs,destination=/data,tmpfs-mode=0755)
expect "--user ohne Schreibrecht: klare Meldung" "$(exitLog "${C}" | grep -c '/data is not writable for UID 1000 / GID 1000')" 1

# 4 · chown nicht möglich (Netzlaufwerk); schreibbar → Warnung und Start.
echo "-- 4 · chown nicht möglich"
C=$(start --cap-drop CHOWN --mount type=tmpfs,destination=/data,tmpfs-mode=0777)
if waitReady "${C}"; then
    expect "ohne CHOWN, schreibbar: Warnung im Log" "$(docker logs "${C}" 2>&1 | grep -c 'warning: could not change owner of /data')" 1
    expect "ohne CHOWN, schreibbar: Setup" "$(setupAdmin "${C}")" 201
    expect "ohne CHOWN, schreibbar: App-Prozess 99:100" "$(appIds "${C}")" "99:100"
else
    failed "ohne CHOWN startet nicht: $(docker logs "${C}" 2>&1 | tail -3)"
fi
stop "${C}"
C=$(start --cap-drop CHOWN --mount type=tmpfs,destination=/data,tmpfs-mode=0755)
expect "ohne CHOWN, nicht schreibbar: klare Meldung" "$(exitLog "${C}" | grep -c '/data is not writable for UID 99 / GID 100')" 1

C=$(start --cap-drop SETUID --cap-drop SETGID --mount type=tmpfs,destination=/data,tmpfs-mode=0755)
expect "ohne SETUID/SETGID: klare Meldung" "$(exitLog "${C}" | grep -c 'lacks the SETUID/SETGID capability')" 1

# 5 · Eigene und ungültige PUID/PGID.
echo "-- 5 · PUID/PGID"
C=$(start -e PUID=1234 -e PGID=4321 --mount type=tmpfs,destination=/data,tmpfs-mode=0755)
if waitReady "${C}"; then
    expect "PUID/PGID 1234:4321: App-Prozess" "$(appIds "${C}")" "1234:4321"
else
    failed "PUID/PGID 1234:4321 startet nicht: $(docker logs "${C}" 2>&1 | tail -3)"
fi
stop "${C}"
C=$(start -e PUID=abc)
expect "PUID=abc: klare Meldung" "$(exitLog "${C}" | grep -c "PUID must be a number")" 1
C=$(start -e PUID=0)
expect "PUID=0: klare Meldung" "$(exitLog "${C}" | grep -c 'must not be 0')" 1
C=$(start -e PGID=0)
expect "PGID=0: klare Meldung" "$(exitLog "${C}" | grep -c 'must not be 0')" 1

echo
if (( FAILURES == 0 )); then echo "Alle Prüfungen bestanden."; else echo "${FAILURES} Prüfung(en) fehlgeschlagen."; fi
exit $(( FAILURES == 0 ? 0 : 1 ))
