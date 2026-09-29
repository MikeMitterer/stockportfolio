SHELL := bash

.DEFAULT_GOAL := help

WORKSPACE    := $(realpath $(shell pwd))
PROJECT_NAME := $(notdir $(WORKSPACE))

BASH_LIBS ?= $(WORKSPACE)/.libs/BashLib/src
PROJECT_TOOLS ?= $(WORKSPACE)/.libs/ProjectTools/src
PYTHON ?= python3
DEV_MAKE ?= $(WORKSPACE)/.libs/MakeLib
export BASH_LIBS PROJECT_TOOLS

-include .env

-include ${DEV_MAKE}/colours.mk
-include ${DEV_MAKE}/tools.mk

# Fallback-Farben wenn DEV_MAKE nicht gesetzt ist (z.B. im CI-Container)
YELLOW ?= $(shell printf "\033[38;5;11m")
GREEN  ?= $(shell printf "\033[38;5;10m")
BLUE   ?= $(shell printf "\033[38;5;33m")
ORANGE ?= $(shell printf "\033[38;5;208m")
RED    ?= $(shell printf "\033[38;5;196m")
WHITE  ?= $(shell printf "\033[38;5;15m")
RESET  ?= $(shell printf "\033[0m")
NC     ?= $(shell printf "\033[0m")
THEME_COLOR_GROUP   ?= $(YELLOW)
THEME_COLOR_TARGET  ?= $(BLUE)
THEME_COLOR_DESC    ?= $(GREEN)
THEME_COLOR_SERVER  ?= $(ORANGE)
THEME_COLOR_DANGER  ?= $(RED)
THEME_INDENT_GROUP  ?= $(shell printf '%2s' '')
THEME_INDENT_TARGET ?= $(shell printf '%7s' '')
THEME_WIDTH_TARGET ?= 22
THEME_COLUMN_GAP ?= 1
THEME_GROUP_SPACING ?= 1

export

# ─── Hilfe ───────────────────────────────────────────────────────────────────

.PHONY: help
help: ## Alle verfügbaren Befehle anzeigen
	@echo
	@echo "Please use \`make <$(THEME_COLOR_GROUP)target$(RESET)>' where <target> is one of"
	@echo
	@echo "Project: $(THEME_COLOR_GROUP)$(PROJECT_NAME)$(RESET)"
	@echo
	@grep -hE '^(##@|[a-zA-Z0-9_-]+:.*?##[RD]? )' $(MAKEFILE_LIST) | \
	  awk 'function row(label, description, color) { \
	      printf "$(THEME_INDENT_TARGET)%s%s$(RESET)", color, label; \
	      padding = $(THEME_WIDTH_TARGET) - length(label) + $(THEME_COLUMN_GAP); \
	      if (length(label) > $(THEME_WIDTH_TARGET)) { printf "\n$(THEME_INDENT_TARGET)"; padding = $(THEME_WIDTH_TARGET) + $(THEME_COLUMN_GAP) }; \
	      printf "%*s$(THEME_COLOR_DESC)%s$(RESET)\n", padding, "", description \
	    }; BEGIN {FS = ":.*##[RD]? "}; \
	    /^##@/ { for (i=0; i<$(THEME_GROUP_SPACING); i++) printf "\n"; heading=substr($$0, 4); sub(/^[[:space:]]+/, "", heading); printf "$(THEME_INDENT_GROUP)$(THEME_COLOR_GROUP)%s$(RESET)\n", heading; next }; \
	    /##D /  { row($$1, $$2, "$(THEME_COLOR_DANGER)"); next }; \
	    /##R /  { row($$1, $$2, "$(THEME_COLOR_SERVER)"); next }; \
	    /## /   { row($$1, $$2, "$(THEME_COLOR_TARGET)") }'
	@echo
	@echo "  $(THEME_COLOR_TARGET)■$(RESET) lokal   $(THEME_COLOR_SERVER)■$(RESET) SSH → Server, schreibend   $(THEME_COLOR_DANGER)■$(RESET) SSH → Server, destruktiv"
	@echo

.PHONY: info
info: ## Umgebungsvariablen anzeigen
	@echo
	@echo "    $(YELLOW)PROJECT_NAME$(RESET) = $(BLUE)$(PROJECT_NAME)$(RESET)"
	@echo "    $(YELLOW)WORKSPACE$(RESET)    = $(BLUE)$(WORKSPACE)$(RESET)"
	@echo "    $(YELLOW)DEV_MAKE$(RESET)     = $(BLUE)$${DEV_MAKE:-<nicht gesetzt>}$(RESET)"
	@echo "    $(YELLOW)BASH_LIBS$(RESET)    = $(BLUE)$${BASH_LIBS:-<nicht gesetzt>}$(RESET)"
	@echo "    $(YELLOW)VITE_STOCKINFO_API_URL$(RESET) = $(BLUE)$${VITE_STOCKINFO_API_URL:-<nicht gesetzt>}$(RESET)"
	@echo
	@printf "    $(YELLOW)%-12s$(RESET) = $(BLUE)%-10s$(RESET) $(WHITE)%s$(RESET)\n" \
	  "PLATFORM" "$(PLATFORM)"   "# build: x86 | arm"
	@printf "    $(YELLOW)%-12s$(RESET) = $(BLUE)%-10s$(RESET) $(WHITE)%s$(RESET)\n" \
	  "STRICT"   "$(STRICT)"     "# 1 = auch abbrechen, wenn Commits nach dem Tag liegen"
	@printf "    $(YELLOW)%-12s$(RESET) = $(BLUE)%-10s$(RESET) $(WHITE)%s$(RESET)\n" \
	  "TARGET"   "$${TARGET:-dockerhub}" "# push: dockerhub | ghcr | ecr"
	@echo

.PHONY: hints
hints: ## Nützliche Links und Hinweise anzeigen
	@for ((i=0; i<$(THEME_GROUP_SPACING); i++)); do echo; done
	@echo "$(THEME_INDENT_GROUP)$(THEME_COLOR_GROUP)URLs$(RESET)"
	@printf "$(THEME_INDENT_TARGET)$(THEME_COLOR_TARGET)%-$(THEME_WIDTH_TARGET)s$(RESET)%$(THEME_COLUMN_GAP)s$(THEME_COLOR_DESC)%s$(RESET)\n" "Dev-Server" ""   "http://localhost:5175"
	@printf "$(THEME_INDENT_TARGET)$(THEME_COLOR_TARGET)%-$(THEME_WIDTH_TARGET)s$(RESET)%$(THEME_COLUMN_GAP)s$(THEME_COLOR_DESC)%s$(RESET)\n" "Preview" ""      "http://localhost:4175"
	@printf "$(THEME_INDENT_TARGET)$(THEME_COLOR_TARGET)%-$(THEME_WIDTH_TARGET)s$(RESET)%$(THEME_COLUMN_GAP)s$(THEME_COLOR_DESC)%s$(RESET)\n" "StockInfo API" "" "https://stockinfo.int.mikemitterer.at/docs"
	@printf "$(THEME_INDENT_TARGET)$(THEME_COLOR_TARGET)%-$(THEME_WIDTH_TARGET)s$(RESET)%$(THEME_COLUMN_GAP)s$(THEME_COLOR_DESC)%s$(RESET)\n" "Docker Hub" ""   "https://hub.docker.com/r/mangolila/stockportfolio"
	@for ((i=0; i<$(THEME_GROUP_SPACING); i++)); do echo; done
	@echo "$(THEME_INDENT_GROUP)$(THEME_COLOR_GROUP)Setup$(RESET)"
	@printf "$(THEME_INDENT_TARGET)$(THEME_COLOR_TARGET)%-$(THEME_WIDTH_TARGET)s$(RESET)%$(THEME_COLUMN_GAP)s$(THEME_COLOR_DESC)%s$(RESET)\n" "1. Symlinks" ""  "make setup"
	@printf "$(THEME_INDENT_TARGET)$(THEME_COLOR_TARGET)%-$(THEME_WIDTH_TARGET)s$(RESET)%$(THEME_COLUMN_GAP)s$(THEME_COLOR_DESC)%s$(RESET)\n" "2. Env" ""       "cp .env.example .env"
	@printf "$(THEME_INDENT_TARGET)$(THEME_COLOR_TARGET)%-$(THEME_WIDTH_TARGET)s$(RESET)%$(THEME_COLUMN_GAP)s$(THEME_COLOR_DESC)%s$(RESET)\n" "3. Deps" ""      "npm install && npm ci --prefix api"
	@printf "$(THEME_INDENT_TARGET)$(THEME_COLOR_TARGET)%-$(THEME_WIDTH_TARGET)s$(RESET)%$(THEME_COLUMN_GAP)s$(THEME_COLOR_DESC)%s$(RESET)\n" "4. Start" ""     "make dev"
	@for ((i=0; i<$(THEME_GROUP_SPACING); i++)); do echo; done
	@echo "$(THEME_INDENT_GROUP)$(THEME_COLOR_GROUP)Docker$(RESET)"
	@printf "$(THEME_INDENT_TARGET)$(THEME_COLOR_TARGET)%-$(THEME_WIDTH_TARGET)s$(RESET)%$(THEME_COLUMN_GAP)s$(THEME_COLOR_DESC)%s$(RESET)\n" "Server (x86)" ""  "make build                  # nur bauen, danach prüfen"
	@printf "$(THEME_INDENT_TARGET)$(THEME_COLOR_TARGET)%-$(THEME_WIDTH_TARGET)s$(RESET)%$(THEME_COLUMN_GAP)s$(THEME_COLOR_DESC)%s$(RESET)\n" "Lokal auf M1" ""  "make build PLATFORM=arm     # lokaler ARM-Test"
	@printf "$(THEME_INDENT_TARGET)$(THEME_COLOR_TARGET)%-$(THEME_WIDTH_TARGET)s$(RESET)%$(THEME_COLUMN_GAP)s$(THEME_COLOR_DESC)%s$(RESET)\n" "Veröffentlichen" "" "make push               # geprüftes Image + README"
	@printf "$(THEME_INDENT_TARGET)$(THEME_COLOR_TARGET)%-$(THEME_WIDTH_TARGET)s$(RESET)%$(THEME_COLUMN_GAP)s$(THEME_COLOR_DESC)%s$(RESET)\n" "Push-Ziel" ""     "make push TARGET=ghcr"
	@echo

# ─── Precheck ────────────────────────────────────────────────────────────────

.PHONY: precheck
precheck: ## Benötigte Bibliotheksdateien prüfen
	@test -r "$(BASH_LIBS)/version.lib.sh" || { echo "BashLib fehlt: make setup ausführen."; exit 1; }

# ─── Setup ───────────────────────────────────────────────────────────────────

##@ Setup

.PHONY: setup
setup: ## Symlinks (.libs/) + Deps installieren
	@./scripts/setup-libs.sh --install
	@npm install --no-audit --no-fund
	@npm ci --prefix api --no-audit --no-fund

# ─── Status ──────────────────────────────────────────────────────────────────

##@ Status

.PHONY: status
status: ## Git-Status des Repos + offene Blocker-Issues
	@bash $(PROJECT_TOOLS)/bash/repo-status.sh --show

# ─── Entwicklung ─────────────────────────────────────────────────────────────

##@ Entwicklung

.PHONY: dev
dev: ## Vite Dev-Server starten (Port 5175)
	@npm run dev

.PHONY: dev-api
dev-api: ## Eigene API lokal starten (Port 8080)
	@STOCKPORTFOLIO_DATA_DIR="$(WORKSPACE)/.local-data" STOCKPORTFOLIO_PUBLIC_ORIGIN="http://localhost:5175" npm run dev --prefix api

.PHONY: build-frontend
build-frontend: ## Production-Build (typecheck + vite build → dist/)
	@npm run build

.PHONY: build-api
build-api: ## Eigene API nach api/dist/ übersetzen
	@npm run build --prefix api

.PHONY: preview
preview: ## Preview des Prod-Builds (Port 4175)
	@npm run preview

.PHONY: lint
lint: ## ESLint über Frontend und API
	@npm run lint

.PHONY: format
format: ## Prettier — Code formatieren
	@npm run format

.PHONY: typecheck
typecheck: ## vue-tsc --noEmit
	@npm run typecheck

.PHONY: test
test: ## Vitest — einmalig
	@npm run test

.PHONY: test-watch
test-watch: ## Vitest — Watch-Modus
	@npm run test:watch

.PHONY: coverage
coverage: ## Vitest mit Coverage-Report
	@npm run test:coverage

.PHONY: clean
clean: ## dist/, coverage/, .vite/ löschen
	@rm -rf dist api/dist coverage .vite .eslintcache
	@echo "$(GREEN)✓$(RESET) aufgeräumt"

# ─── Docker ──────────────────────────────────────────────────────────────────

##@ Docker

# Veröffentlichung für Unraid/Server, unabhängig von der Host-Architektur.
PLATFORM ?= x86
# Ohne Tag und bei uncommittierten Änderungen abbrechen; Commits nach Tag erlaubt.
STRICT ?= 2
# Bereits veröffentlichter GitHub-Stand für README-Bilder und Dokumentlinks.
DOCKER_README_REF ?= master

.PHONY: build push
build: ## Docker-Image lokal bauen (PLATFORM=x86|arm, Default x86)
	@./docker/build.sh --build "$(PLATFORM)"

push: ## Geprüften lokalen Build veröffentlichen, danach README (TARGET=dockerhub)
	@./docker/build.sh --push

.PHONY: docker-update
docker-update: ## Explizites Basis-Image aktualisieren (BASE_IMAGE=<Referenz>)
	@./docker/build.sh --update

.PHONY: docker-images
docker-images: ## Lokale Images des Projekts anzeigen
	@./docker/build.sh --images

.PHONY: docker-samples
docker-samples: ## Beispiel-`docker run`-Kommandos zeigen
	@./docker/build.sh --samples

# ─── Versionierung ───────────────────────────────────────────────────────────

##@ Versionierung

.PHONY: version
version: ## Aktuelle Version anzeigen (package.json + git tag)
	@echo
	@VER=$$(source "$${BASH_LIBS}/version.lib.sh" 2>/dev/null && readProjectVersion 2>/dev/null); \
	 [[ -z "$$VER" ]] && VER='nicht gesetzt'; \
	 TAG=$$(git describe --tags --abbrev=0 2>/dev/null || echo 'kein Tag'); \
	 echo "    $(YELLOW)version$(RESET)  = $(BLUE)$$VER$(RESET)"; \
	 echo "    $(YELLOW)git tag$(RESET)  = $(BLUE)$$TAG$(RESET)"
	@echo

.PHONY: tags
tags: ## Letzte 10 Tags mit Message anzeigen
	@git tag --sort=-version:refname -n1 | head -10 | \
	  awk '{printf "    \033[34m%-28s\033[0m \033[32m%s\033[0m\n", $$1, substr($$0, index($$0,$$2))}'

.PHONY: changelog
changelog: ## CHANGELOG.md aus Release-Tags erstellen (ohne Commit)
	@LANGUAGE=en "$(PYTHON)" "$(PROJECT_TOOLS)/python/changelog.py" --generate

.PHONY: tag-major tag-minor tag-patch
tag-major: ## Version committen, taggen UND pushen — Major; danach Changelog [MSG="..."]
tag-minor: ## Version committen, taggen UND pushen — Minor; danach Changelog [MSG="..."]
tag-patch: ## Version committen, taggen UND pushen — Patch; danach Changelog [MSG="..."]

# Ein gemeinsames Rezept hält Reihenfolge und Fehlerverhalten für alle Stufen gleich.
tag-major tag-minor tag-patch: precheck
	@test -r "$(PROJECT_TOOLS)/python/changelog.py"
	@test -z "$$(git status --porcelain)"
	@source "$${BASH_LIBS}/version.lib.sh" && semVerBump "$(patsubst tag-%,%,$@)" auto "" "$${MSG:-}"
	@LANGUAGE=en "$(PYTHON)" "$(PROJECT_TOOLS)/python/changelog.py" --publish
