#!/bin/sh
#------------------------------------------------------------------------------
# entrypoint.sh — Laufzeit-Konfiguration schreiben, dann eigene API starten
#
# Die Vue-App ist ein statisches Bündel: Alles, was Vite zur Bauzeit kennt,
# steckt darin fest. Die Adresse der StockInfo-API darf aber nicht feststecken — sonst
# bräuchte jede Umgebung ein eigenes Abbild. Unter Unraid wird sie im
# Container-Template als Variable gesetzt; hier landet sie in config.js, von wo
# die App sie liest (siehe apiBaseUrl() in frontend/src/api/client.ts).
#------------------------------------------------------------------------------
set -e

# JSON.stringify erhält auch Quotes, Backslashes und Steuerzeichen korrekt.
# Node gehört bereits zur eigenen API; keine zweite Serialisierung bauen.
node --input-type=commonjs <<'JS'
const { writeFileSync } = require('node:fs')
const config = { apiUrl: process.env.STOCKINFO_API_URL || '', container: true }
writeFileSync('/app/public/config.js',
  'window.__STOCKPORTFOLIO_CONFIG__ = ' + JSON.stringify(config) + ';\n')
JS

exec "$@"
