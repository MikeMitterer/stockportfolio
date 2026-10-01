#!/bin/sh
#------------------------------------------------------------------------------
# entrypoint.sh — Laufzeit-Konfiguration schreiben, Datenordner einrichten,
# dann die eigene API ohne Root-Rechte starten
#
# Die Vue-App ist ein statisches Bündel: Alles, was Vite zur Bauzeit kennt,
# steckt darin fest. Die Adresse der StockInfo-API darf aber nicht feststecken — sonst
# bräuchte jede Umgebung ein eigenes Abbild. Unter Unraid wird sie im
# Container-Template als Variable gesetzt; hier landet sie in config.js, von wo
# die App sie liest (siehe apiBaseUrl() in frontend/src/api/client.ts).
#
# Benutzer (T-72): Unraid erwartet für Dienste mit Daten UID 99 / GID 100.
# Docker legt einen fehlenden Bind-Mount-Ordner aber als root an — die App
# konnte ihre SQLite-Datei dort nicht öffnen. Deshalb startet der Container als
# root, richtet den Datenordner für PUID/PGID ein und startet die App erst dann
# mit genau diesen IDs. Wer mit `--user` startet, bekommt keinen Wechsel; dann
# muss der Ordner für diesen Benutzer bereits beschreibbar sein.
#------------------------------------------------------------------------------
set -eu

DATA_DIR="${STOCKPORTFOLIO_DATA_DIR:-/data}"
CONFIG_FILE="${STOCKPORTFOLIO_PUBLIC_DIR:-/app/public}/config.js"

log() { echo "entrypoint: $*" >&2; }
fail() { log "$*"; exit 1; }

# Nur Ziffern; leer, Vorzeichen oder Buchstaben gelten nicht.
isNumericId() {
    case "$1" in
        ''|*[!0-9]*) return 1 ;;
        *) return 0 ;;
    esac
}

# JSON.stringify erhält auch Quotes, Backslashes und Steuerzeichen korrekt.
# Node gehört bereits zur eigenen API; keine zweite Serialisierung bauen.
writeConfig() {
    CONFIG_FILE="${CONFIG_FILE}" node --input-type=commonjs <<'JS'
const { writeFileSync } = require('node:fs')
const config = { apiUrl: process.env.STOCKINFO_API_URL || '', container: true }
writeFileSync(process.env.CONFIG_FILE,
  'window.__STOCKPORTFOLIO_CONFIG__ = ' + JSON.stringify(config) + ';\n')
JS
}

# Läuft als Zielbenutzer und prüft genau das, was SQLite braucht: neue Dateien
# im Datenordner anlegen (WAL, Shared Memory, Journal) und vorhandene
# Datenbankdateien lesen und schreiben. Eine Datenbank, die nach gescheitertem
# chown noch root gehört, fiele sonst erst beim Öffnen auf (T-72, Review
# Runde 1). Andere Dateien in /data gehen die App nichts an und blockieren den
# Start nicht (Review Runde 2). Die API öffnet <DATA_DIR>/stockportfolio.sqlite
# (api/src/index.ts). Gibt den ersten gesperrten Pfad aus und endet mit 1.
CHECK_SCRIPT='
PROBE_FILE="$1/.stockportfolio-write-test"
if ! touch "$PROBE_FILE" 2>/dev/null; then echo "$1"; exit 1; fi
rm -f "$PROBE_FILE"
for SUFFIX in "" -wal -shm -journal; do
    DB_FILE="$1/stockportfolio.sqlite$SUFFIX"
    if [ -e "$DB_FILE" ] && { [ ! -r "$DB_FILE" ] || [ ! -w "$DB_FILE" ]; }; then
        echo "$DB_FILE"; exit 1
    fi
done
'

if [ "$(id -u)" != "0" ]; then
    # Start mit --user: kein Rechtewechsel möglich und nicht gewollt.
    if ! writeConfig 2>/dev/null; then
        log "warning: could not write ${CONFIG_FILE}; STOCKINFO_API_URL is not applied"
    fi
    BLOCKED=$(sh -c "${CHECK_SCRIPT}" check "${DATA_DIR}") \
        || fail "${BLOCKED} is not writable for UID $(id -u) / GID $(id -g). Make it writable for this user or start without --user."
    exec "$@"
fi

PUID="${PUID:-99}"
PGID="${PGID:-100}"
isNumericId "${PUID}" || fail "PUID must be a number, got '${PUID}'."
isNumericId "${PGID}" || fail "PGID must be a number, got '${PGID}'."
if [ "${PUID}" -eq 0 ] || [ "${PGID}" -eq 0 ]; then
    fail "PUID and PGID must not be 0; the app does not run as root."
fi

writeConfig
mkdir -p "${DATA_DIR}"

# Nur anfassen, was nicht schon passt — ein vollständiges chown bei jedem
# Start wäre bei großen Ordnern langsam und auf Netzlaufwerken laut.
if [ -n "$(find "${DATA_DIR}" \( ! -user "${PUID}" -o ! -group "${PGID}" \) -print -quit 2>/dev/null)" ]; then
    if chown -R "${PUID}:${PGID}" "${DATA_DIR}" 2>/dev/null; then
        log "set owner of ${DATA_DIR} to ${PUID}:${PGID}"
    else
        log "warning: could not change owner of ${DATA_DIR} to ${PUID}:${PGID} (network share or missing capability); continuing if it is writable"
    fi
fi

# Ohne CAP_SETUID/CAP_SETGID schlägt der Wechsel fehl; dann lieber klar melden.
SWITCH="setpriv --reuid=${PUID} --regid=${PGID} --clear-groups --inh-caps=-all"
${SWITCH} true 2>/dev/null || fail "cannot switch to UID ${PUID} / GID ${PGID}; the container lacks the SETUID/SETGID capability. Start it with --user ${PUID}:${PGID} instead."

BLOCKED=$(${SWITCH} sh -c "${CHECK_SCRIPT}" check "${DATA_DIR}") \
    || fail "${BLOCKED} is not writable for UID ${PUID} / GID ${PGID}. Make it writable for this user or set PUID/PGID to its owner."

exec ${SWITCH} -- "$@"
