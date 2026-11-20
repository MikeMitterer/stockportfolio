SHELL := bash

.DEFAULT_GOAL := help

# MSG (Nachricht für tag-*) unausgewertet übernehmen, vor dem ersten $(shell …): Make exportiert
# eine Variable von der Kommandozeile an jedes $(shell …) und wertet sie dabei aus; aus „$HOME“
# würde „OME“, und ein $(shell …) in der Nachricht liefe schon beim Einlesen. Im Rezept steht MSG
# nur als "$${MSG:-}".
override MSG := $(value MSG)
export MSG

WORKSPACE    := $(CURDIR)
WORKSPACE_SQ := '$(subst ','\'',$(WORKSPACE))'
PROJECT_NAME := $(shell basename -- $(WORKSPACE_SQ))
# Werte von außen (Pfad, Umgebung) nur über die Umgebung in Rezepte geben, nie als $(VAR).
export WORKSPACE WORKSPACE_SQ PROJECT_NAME

# Prüfungen, Status und Releases laufen über die Befehle von ProjectTools in .tools/ dieses
# Checkouts (make setup). Tag und Quelle der Werkzeuge und von DevTools selbst stehen nur in
# .dev-tools.conf.sh. Aufgerufen wird das einmal je Rechner installierte devtools (Starter);
# ist es älter als DEVTOOLS_TAG, gibt es an diesen Tag weiter. Mit --project installiert und
# prüft es die Werkzeuge in .tools/.
include .dev-tools.conf.sh
export DEVTOOLS_SOURCE DEVTOOLS_TAG
# Ohne die Git-Variablen eines Hooks (make docs-check im pre-commit): Ein älterer Starter gäbe
# sie an pipx weiter, und pip klonte in den Index dieses Repositorys.
DEV_TOOLS := env -u GIT_INDEX_FILE -u GIT_DIR -u GIT_WORK_TREE devtools --project
# Bricht ab, wenn der Starter fehlt, und nennt seinen Installationsbefehl. Im Rezept vor jedem
# Aufruf von devtools: @$(REQUIRE_STARTER); …
REQUIRE_STARTER = command -v devtools >/dev/null || { \
	echo "  ✗ devtools fehlt: pipx install '$${DEVTOOLS_SOURCE}@$${DEVTOOLS_TAG}'" >&2; exit 1; }

# Die Konto-API liest .env selbst (npm run dev); das Makefile braucht daraus nur die Adresse
# für info und hints.
-include .env
export STOCKINFO_API_URL

# Werkzeuge aus .tools/ dieses Checkouts vorn im PATH; ein global installiertes ProjectTools
# zählt nicht. BashLib für help, info, hints, version, tags und docker/build.sh: Ein von außen
# gesetztes BASH_LIBS geht vor, sonst die aus .tools/.
TOOLS_DIR := .tools
export PATH := $(WORKSPACE)/$(TOOLS_DIR)/bin:$(PATH)
ifndef BASH_LIBS
BASH_LIBS := $(shell $(WORKSPACE_SQ)/$(TOOLS_DIR)/bin/bashlib-path 2>/dev/null)
BASHLIB_FROM_TOOLS := $(if $(BASH_LIBS),yes)
endif
export BASH_LIBS

# Python für den Teststack unter scripts/; von außen überschreibbar, darum in Rezepten nur als
# "$${PYTHON_BOOTSTRAP}".
PYTHON_BOOTSTRAP ?= python3.11
export PYTHON_BOOTSTRAP
VENV := .venv
PYTHON := $(VENV)/bin/python

# Was setup herstellt und require-setup prüft: npm-Pakete beider Teilprojekte, die .venv und
# die Werkzeuge in .tools/. Jeder Stempel entsteht neu, sobald seine Quelldatei neuer ist.
TOOLS_STAMP := $(TOOLS_DIR)/.installed
SETUP_STAMPS := frontend/node_modules/.installed api/node_modules/.installed \
	$(VENV)/.installed $(TOOLS_STAMP)

# Ports des Dev-Stacks aus derselben Config wie dev-ports; nur Ziffern, darum als Make-Wert.
DEV_PORTS := $(shell source .dev-ports.conf.sh && echo "$${PORTS[@]}")

# ─── Hilfe ───────────────────────────────────────────────────────────────────

# help, info und hints geben über BashLib make.lib.sh aus, geladen über BASH_ENV in jede
# Rezeptzeile; eine Rezeptzeile ergibt eine Ausgabezeile. Bash wertet BASH_ENV aus: darum der
# Verweis auf BASH_LIBS statt des Pfads, ein $(…) im Checkout-Pfad bleibt Text.
help info hints: export BASH_ENV := $${BASH_LIBS}/make.lib.sh

# Eine Beschreibung sagt, was nach dem Ziel anders ist; den Ablauf beschreibt docs/development.md.
# showMakeTargets füllt {major}, {minor} und {patch} aus der Version im Arbeitsverzeichnis; sie
# steht in frontend/package.json, darum läuft es dort. Targets stehen nur in diesem Makefile.
.PHONY: help
help: ## Verfügbare Befehle anzeigen
	@showMakeHeader "$${PROJECT_NAME}"
	@cd frontend && showMakeTargets "$${WORKSPACE}/Makefile"

.PHONY: info
info: ## Projektpfade, Build-Variablen und Werkzeugstand anzeigen
	@echo
	@printMakeValue WORKSPACE         "$${WORKSPACE}"
	@printMakeValue BASH_LIBS         "$${BASH_LIBS:-nicht gefunden (make setup)}"
	@printMakeValue PYTHON_BOOTSTRAP  "$${PYTHON_BOOTSTRAP}"
	@printMakeValue STOCKINFO_API_URL "$${STOCKINFO_API_URL:-nicht gesetzt (.env)}"
	@printMakeValue PLATFORM          "$${PLATFORM}  (build: x86 | arm)"
	@printMakeValue TARGET            "$${TARGET:-dockerhub}  (push: dockerhub | ghcr | ecr)"
	@printMakeHeading "Werkzeuge (.dev-tools.conf.sh)"
	@# devtools rückt um zwei Zeichen ein; fünf mehr stellen die Zeilen unter die Werte oben.
	@$(REQUIRE_STARTER); set -o pipefail; $(DEV_TOOLS) status 2>/dev/null | sed 's/^/     /' || echo "       Werkzeugstand nicht abrufbar: make setup"
	@echo

# Repo-Adresse (origin als https) und letzter Release-Tag aus repo-info (ProjectTools); die
# Ausgabe enthält nur erlaubte Zeichen, auch der Ersatz ohne Remote oder Tag. repo-info läuft
# erst, wenn hints einen Wert braucht, und je Wert nur einmal (eval mit :=).
NO_REPO_INFO := repo-info fehlt (make setup)
REPO_URL     = $(eval REPO_URL := $(or $(shell repo-info --url 2>/dev/null),$(NO_REPO_INFO)))$(REPO_URL)
RELEASE_TAG  = $(eval RELEASE_TAG := $(or $(shell repo-info --release-tag 2>/dev/null),$(NO_REPO_INFO)))$(RELEASE_TAG)
# Links, URLs und Tipps für den Alltag; das Einrichten beschreibt docs/development.md.
.PHONY: hints
hints: ## Links, URLs und Tipps für die tägliche Arbeit
	@printMakeHeading "Links"
	@printMakeValue   "Repository"        '$(REPO_URL)'
	@printMakeValue   "Letzter Release"   '$(RELEASE_TAG)'
	@printMakeValue   "Docker Hub"        "https://hub.docker.com/r/mangolila/stockportfolio"
	@printMakeValue   "StockInfo"         "$${STOCKINFO_API_URL:-nicht gesetzt (.env)}"
	@printMakeHeading "URLs (nach make dev-up)"
	@printMakeValue   "App"               "http://localhost:$(word 1,$(DEV_PORTS))"
	@printMakeValue   "Konto-API"         "http://localhost:$(word 2,$(DEV_PORTS))"
	@printMakeHeading "Im Alltag"
	@printMakeValue   "Vor dem Commit"    "make test"
	@printMakeValue   "Stack hängt"       "make dev-down; danach make dev-up"
	@printMakeValue   "Teststack"         ".venv/bin/python scripts/stockinfo-test-server.py --stack --run"
	@printMakeValue   "Image für ARM"     "make build PLATFORM=arm"
	@printMakeValue   "Anderes Push-Ziel" "make push TARGET=ghcr"
	@echo

# ─── Precheck ────────────────────────────────────────────────────────────────

# Ohne `##`: läuft vor version, tags, require-tools und require-setup. Verlangt BashLib, aus
# .tools/ in der Mindestversion aus .dev-tools.conf.sh; ein von außen gesetztes BASH_LIBS prüft
# es nur auf Lesbarkeit. Bewusst ohne BashLib-Ausgabe: precheck meldet gerade, dass sie fehlt.
.PHONY: precheck
precheck:
	@if [[ ! -r "$${BASH_LIBS:-}/version.lib.sh" ]]; then \
		echo "  ✗ BashLib fehlt (BASH_LIBS oder .tools/): make setup" >&2; \
		exit 1; \
	elif [[ -n '$(BASHLIB_FROM_TOOLS)' ]]; then $(REQUIRE_STARTER); $(DEV_TOOLS) check bashlib; fi

# Ohne `##`: verlangt ProjectTools in .tools/ in Mindestversion; devtools nennt sonst den Grund.
.PHONY: require-tools
require-tools: precheck
	@$(REQUIRE_STARTER); $(DEV_TOOLS) check projecttools

# ─── Setup ───────────────────────────────────────────────────────────────────

##@ Setup

# setup ist der einzige Weg, einen Checkout einzurichten, auch als worktree_setup im
# Prüf-Worktree. Prüfziele richten nichts selbst ein, sie hängen an require-setup.
.PHONY: setup require-setup
setup: ## Bereit zum Entwickeln: npm-Pakete, .venv, Werkzeuge in .tools/
	@git config core.hooksPath .githooks   # pre-commit: make docs-check
	@$(MAKE) -s --no-print-directory $(SETUP_STAMPS)

# Stempelregeln: nur setup und build erreichen sie; neu, sobald die Lock- bzw. Config-Datei
# neuer ist.
%/node_modules/.installed: %/package-lock.json
	@npm ci --prefix "$*" --no-audit --no-fund
	@touch "$@"

$(PYTHON):
	@"$${PYTHON_BOOTSTRAP}" -c 'import sys; sys.exit(0 if sys.version_info >= (3, 11) else "Python 3.11 oder neuer erforderlich")'
	@"$${PYTHON_BOOTSTRAP}" -m venv $(VENV)

$(VENV)/.installed: requirements-dev.txt | $(PYTHON)
	@$(PYTHON) -c 'import sys; sys.exit(0 if sys.version_info >= (3, 11) else "Bestehende .venv benötigt Python 3.11 oder neuer")'
	@$(PYTHON) -m pip install -q --disable-pip-version-check -r requirements-dev.txt
	@touch "$@"

# Werkzeuge auf Quelle und Tag aus .dev-tools.conf.sh nach .tools/; devtools meldet je Werkzeug
# eine Zeile.
$(TOOLS_STAMP): .dev-tools.conf.sh
	@$(REQUIRE_STARTER); $(DEV_TOOLS) install
	@touch "$@"

# Ohne Hilfeeintrag: meldet eine fehlende oder veraltete Einrichtung, statt sie nachzuholen.
require-setup: precheck
	@source "$${BASH_LIBS}/make.lib.sh" && requireMakeSetup --hooks .githooks --make "$(MAKE)" $(SETUP_STAMPS)

# ─── Status ──────────────────────────────────────────────────────────────────

##@ Status

.PHONY: status
status: require-tools ## Git-Status dieses Projekts anzeigen
	@repo-status --show

# ─── Entwicklung ─────────────────────────────────────────────────────────────

##@ Entwicklung

STOCKPORTFOLIO_DATA_DIR ?= $(WORKSPACE)/.local-data
export STOCKPORTFOLIO_DATA_DIR

# Ein belegter Port bricht den Start ab, statt dass eine App still auf einen anderen ausweicht.
# Ohne dev-ports (ProjectTools) nur eine Warnung: dev-up und dev-down sind Entwicklungsziele.
.PHONY: dev-up dev-down
dev-up: ## Vite und Konto-API laufen im Hintergrund (Overmind)
	@command -v overmind >/dev/null || { echo "  ✗ overmind fehlt; overmind und tmux installieren." >&2; exit 1; }
	@command -v tmux >/dev/null || { echo "  ✗ tmux fehlt; tmux installieren." >&2; exit 1; }
	@if command -v dev-ports >/dev/null; then dev-ports --check; \
	else echo "  ⚠ dev-ports fehlt (make setup) — Ports vor dem Start nicht geprüft"; fi
	@OVERMIND_SKIP_ENV=1 overmind start -D -N -f Procfile.dev

dev-down: ## Dev-Stack gestoppt, Ports frei
	-@overmind quit 2>/dev/null || true
	@if command -v dev-ports >/dev/null; then dev-ports --kill; \
	else echo "  ⚠ dev-ports fehlt (make setup) — Reste nach einem Absturz nicht geprüft"; fi

.PHONY: test docs-check clean
test: docs-check require-setup ## Doku, Frontend- und API-Tests einmal geprüft
	@npm run test --prefix frontend
	@npm run test --prefix api

# Ohne ProjectTools scheitert es laut, statt die Doku still zu überspringen. Config in
# .docs-check.conf.sh.
docs-check: require-tools ## Doku geprüft: Links, Befehle, Variablen, verbotene Begriffe
	@docs-check --run

# Setzt den Checkout zurück; danach verlangen die Prüfziele wieder make setup.
clean: ## Erzeugte Dateien, .venv und .tools/ entfernt; .env und Daten bleiben
	@npm --prefix frontend run clean
	@npm --prefix api run clean
	@rm -rf dist coverage .vite .eslintcache tsconfig.tsbuildinfo scripts/__pycache__ \
		$(VENV) $(TOOLS_DIR) frontend/node_modules/.installed api/node_modules/.installed
	@echo "  ✓ aufgeräumt"

# ─── Docker ──────────────────────────────────────────────────────────────────

##@ Docker

# Veröffentlichung für Unraid/Server, unabhängig von der Host-Architektur.
PLATFORM ?= x86
# Ohne Tag und bei uncommittierten Änderungen abbrechen; Commits nach Tag erlaubt.
STRICT ?= 2
# Bereits veröffentlichter GitHub-Stand für README-Bilder und Dokumentlinks.
DOCKER_README_REF ?= master
export PLATFORM STRICT DOCKER_README_REF

# docker/build.sh braucht BashLib und dockerhub-readme aus .tools/; die Ziele holen sie nach.
# BASH_LIBS aus dem Kopf ist leer, wenn $(TOOLS_STAMP) die Werkzeuge erst in diesem Lauf
# installiert; darum liest das Rezept es dann aus .tools/.
DOCKER_BUILD = BASH_LIBS="$${BASH_LIBS:-$$($(TOOLS_DIR)/bin/bashlib-path)}" ./docker/build.sh

.PHONY: build push docker-images docker-samples
build: $(TOOLS_STAMP) ## Image lokal gebaut (PLATFORM=x86|arm, Default x86)
	@$(DOCKER_BUILD) --build "$${PLATFORM}"

push: $(TOOLS_STAMP) ## Geprüfter Build veröffentlicht, danach README (TARGET=dockerhub)
	@$(DOCKER_BUILD) --push

docker-images: $(TOOLS_STAMP) ## Lokale Images des Projekts anzeigen
	@$(DOCKER_BUILD) --images

docker-samples: $(TOOLS_STAMP) ## Beispiel-`docker run`-Kommandos zeigen
	@$(DOCKER_BUILD) --samples

# ─── Versionierung ───────────────────────────────────────────────────────────

##@ Versionierung

# Die Version steht in frontend/package.json; version und tag-version lesen sie dort.
.PHONY: version tags changelog
version: precheck ## Version aus frontend/package.json und letzter Release-Tag
	@echo
	@source "$${BASH_LIBS}/make.lib.sh" && showProjectVersion auto frontend
	@echo

tags: precheck ## Letzte zehn Release-Tags mit Nachricht anzeigen
	@echo
	@source "$${BASH_LIBS}/make.lib.sh" && showReleaseTags 10
	@echo

# Sprache von CHANGELOG.md, unabhängig von der Locale der Shell (changelog folgt sonst
# LANG). Überschreiben: make … CHANGELOG_LANGUAGE=de
CHANGELOG_LANGUAGE ?= en
export CHANGELOG_LANGUAGE

changelog: require-tools ## CHANGELOG.md aus Release-Tags und Commits erzeugen
	@LANGUAGE="$${CHANGELOG_LANGUAGE}" changelog --generate

# Je Target eine Hilfezeile; showMakeTargets liest nur Zeilen mit einem Target.
.PHONY: tag-major tag-minor tag-patch
tag-major: ## Major {major}, inkompatibel  [MSG="..."]
tag-minor: ## Minor {minor}, neue Funktion  [MSG="..."]
tag-patch: ## Patch {patch}, Fehler behoben  [MSG="..."]

# Version in frontend/package.json heben und lokal taggen, CHANGELOG.md committen, Stufe
# vorspulen; alles nur lokal, veröffentlicht wird mit git push --follow-tags. Prüfung und
# Ablauf stehen nur in tag-version (ProjectTools). changelog nennt bei Erfolg den absoluten
# Pfad der Datei, darum ohne stdout; Fehler kommen über stderr. require-tools (mit precheck):
# ohne ProjectTools oder BashLib bricht ein Release vor dem Bump ab, nicht erst nach dem Tag.
tag-major tag-minor tag-patch: require-tools
	@cd frontend && tag-version "$(patsubst tag-%,%,$@)" --message "$${MSG:-}"
	@LANGUAGE="$${CHANGELOG_LANGUAGE}" changelog --commit >/dev/null
	@tag-version --fast-forward
