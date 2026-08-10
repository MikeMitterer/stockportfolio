#!/bin/sh
#------------------------------------------------------------------------------
# entrypoint.sh — Laufzeit-Konfiguration schreiben, dann nginx starten
#
# Die App ist ein statisches Bündel: Alles, was Vite zur Bauzeit kennt, steckt
# darin fest. Die Adresse der StockInfo-API darf aber nicht feststecken — sonst
# bräuchte jede Umgebung ein eigenes Abbild. Unter Unraid wird sie im
# Container-Template als Variable gesetzt; hier landet sie in config.js, von wo
# die App sie liest (siehe apiBaseUrl() in src/api/client.ts).
#------------------------------------------------------------------------------
set -e

CONFIG_FILE="/usr/share/nginx/html/config.js"

# Ohne gesetzte Variable bleibt der Wert leer — die App fällt dann auf das
# zurück, was beim Bauen im Bündel gelandet ist.
API_URL="${STOCKINFO_API_URL:-}"

# Anführungszeichen und Backslashes entschärfen: Der Wert kommt von außen und
# landet unverändert in einer JavaScript-Datei.
ESCAPED=$(printf '%s' "${API_URL}" | sed 's/\\/\\\\/g; s/"/\\"/g')

cat > "${CONFIG_FILE}" <<CONFIG
/* Beim Start des Containers erzeugt — nicht bearbeiten. */
window.__STOCKPORTFOLIO_CONFIG__ = { apiUrl: "${ESCAPED}" }
CONFIG

if [ -n "${API_URL}" ]; then
    echo "StockPortfolio: API-Adresse = ${API_URL}"
else
    echo "StockPortfolio: STOCKINFO_API_URL nicht gesetzt — es gilt der Wert aus dem Build."
fi

exec "$@"
