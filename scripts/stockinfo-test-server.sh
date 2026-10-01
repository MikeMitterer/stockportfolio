#!/usr/bin/env bash
#------------------------------------------------------------------------------
# stockinfo-test-server.sh — Teststack mit der Python der Projekt-.venv starten
#
# Ein direkter Aufruf von stockinfo-test-server.py landet über dessen Shebang
# bei der System-Python ohne ProjectTools (keine Farben). Dieser Wrapper nimmt
# immer die von `make setup` angelegte .venv und reicht alle Argumente durch.
# Der Einzelserver ohne --stack braucht StockInfos Python und wird weiterhin
# direkt mit ../StockInfo/.venv/bin/python aufgerufen.
#
# Verwendung:
#   ./scripts/stockinfo-test-server.sh --stack --run --stockinfo-root ../StockInfo
#   ./scripts/stockinfo-test-server.sh --stack --status | --stack --stop | --help
#------------------------------------------------------------------------------
exec "$(dirname -- "${BASH_SOURCE[0]}")/../.venv/bin/python" -B "$(dirname -- "${BASH_SOURCE[0]}")/stockinfo-test-server.py" "$@"
