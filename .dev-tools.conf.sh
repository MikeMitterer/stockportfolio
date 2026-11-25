#!/usr/bin/env bash
# Versionen der Entwicklungswerkzeuge, die dieses Projekt über pipx braucht.
# Das Makefile bindet die Datei mit include ein; Bash kann sie sourcen.
# Deshalb NAME=wert ohne Anführungszeichen und ohne Leerzeichen um das =.
# shellcheck disable=SC2034  # vom Makefile gelesen

# Gelesen von devtools (Paket mmit-devtools, Projekt DevTools). Je Werkzeug: PACKAGE ist das
# pipx-Paket, TAG der Release-Tag, seine SemVer-Zahl die Mindestversion. SOURCE ist die
# GitHub-Quelle; auf dem Entwicklungsrechner ersetzt die rechnerlokale Zuordnung von devtools
# sie durch das lokale Repo. make setup bringt die Werkzeuge auf diesen Stand nach .tools/;
# make info zeigt ihn.

# DevTools selbst: Das Makefile ruft das einmal je Rechner installierte devtools auf (Starter);
# ist es älter als DEVTOOLS_TAG, gibt es an diesen Tag aus DEVTOOLS_SOURCE weiter. Ab v0.11.0
# kennt devtools tstamp auch allowScripts (Einrichtungsstempel der npm-Pakete im Makefile).
DEVTOOLS_TAG=v0.11.0+261125.1212.dc0c4
DEVTOOLS_SOURCE=git+https://github.com/MikeMitterer/python-devtools.git

# ProjectTools (docs-check, repo-status, changelog, repo-info, tag-version, dev-ports,
# dockerhub-readme).
PROJECTTOOLS_PACKAGE=mmit-projecttools
PROJECTTOOLS_LABEL=ProjectTools
PROJECTTOOLS_TAG=v0.12.0+261121.2308.3755c
PROJECTTOOLS_SOURCE=git+https://github.com/MikeMitterer/bash-ProjectTools.git

# BashLib (make.lib.sh für help, info, hints, version und tags; docker/build.sh).
BASHLIB_PACKAGE=mmit-bashlib
BASHLIB_LABEL=BashLib
BASHLIB_TAG=v0.14.0+261119.1230.2ace6
BASHLIB_SOURCE=git+https://github.com/MikeMitterer/bash-lib.git
