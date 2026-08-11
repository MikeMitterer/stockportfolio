SHELL := /bin/bash

.DEFAULT_GOAL := help

WORKSPACE    := $(realpath $(shell pwd))
PROJECT_NAME := $(notdir $(WORKSPACE))

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

-include .env
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
	  awk 'BEGIN {FS = ":.*##[RD]? "}; \
	    /^##@/ { printf "\n$(THEME_INDENT_GROUP)$(THEME_COLOR_GROUP)%s$(RESET)\n", substr($$0, 4); next }; \
	    /##D /  { printf "$(THEME_INDENT_TARGET)$(THEME_COLOR_DANGER)%-22s $(THEME_COLOR_DESC)%s$(RESET)\n", $$1, $$2; next }; \
	    /##R /  { printf "$(THEME_INDENT_TARGET)$(THEME_COLOR_SERVER)%-22s $(THEME_COLOR_DESC)%s$(RESET)\n", $$1, $$2; next }; \
	    /## /   { printf "$(THEME_INDENT_TARGET)$(THEME_COLOR_TARGET)%-22s $(THEME_COLOR_DESC)%s$(RESET)\n", $$1, $$2 }'
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
	  "PLATFORM" "$(PLATFORM)"   "# docker-build: x86 | arm | all"
	@printf "    $(YELLOW)%-12s$(RESET) = $(BLUE)%-10s$(RESET) $(WHITE)%s$(RESET)\n" \
	  "STRICT"   "$(STRICT)"     "# 1 = auch abbrechen, wenn Commits nach dem Tag liegen"
	@printf "    $(YELLOW)%-12s$(RESET) = $(BLUE)%-10s$(RESET) $(WHITE)%s$(RESET)\n" \
	  "TARGET"   "$${TARGET:-dockerhub}" "# docker-push: dockerhub | ghcr | ecr"
	@echo

.PHONY: hints
hints: ## Nützliche Links und Hinweise anzeigen
	@echo
	@echo "  $(YELLOW)URLs$(RESET)"
	@echo
	@printf "    $(BLUE)%-14s$(RESET) $(WHITE)%s$(RESET)\n" "Dev-Server"   "http://localhost:5173"
	@printf "    $(BLUE)%-14s$(RESET) $(WHITE)%s$(RESET)\n" "Preview"      "http://localhost:4173"
	@printf "    $(BLUE)%-14s$(RESET) $(WHITE)%s$(RESET)\n" "StockInfo API" "https://stockinfo.int.mikemitterer.at/docs"
	@echo
	@echo "  $(YELLOW)Setup$(RESET)"
	@echo
	@printf "    $(BLUE)%-14s$(RESET) $(WHITE)%s$(RESET)\n" "1. Symlinks"  "make setup"
	@printf "    $(BLUE)%-14s$(RESET) $(WHITE)%s$(RESET)\n" "2. Env"       "cp .env.example .env"
	@printf "    $(BLUE)%-14s$(RESET) $(WHITE)%s$(RESET)\n" "3. Deps"      "npm install"
	@printf "    $(BLUE)%-14s$(RESET) $(WHITE)%s$(RESET)\n" "4. Start"     "make dev"
	@echo
	@echo "  $(YELLOW)Docker$(RESET)"
	@echo
	@printf "    $(BLUE)%-14s$(RESET) $(WHITE)%s$(RESET)\n" "Server (x86)"  "make docker-build            # Vorgabe"
	@printf "    $(BLUE)%-14s$(RESET) $(WHITE)%s$(RESET)\n" "Lokal auf M1"  "make docker-build PLATFORM=arm"
	@printf "    $(BLUE)%-14s$(RESET) $(WHITE)%s$(RESET)\n" "Beide Archs"   "make docker-build PLATFORM=all  # baut und pusht"
	@printf "    $(BLUE)%-14s$(RESET) $(WHITE)%s$(RESET)\n" "Push-Ziel"     "make docker-push TARGET=ghcr"
	@echo

# ─── Precheck ────────────────────────────────────────────────────────────────

.PHONY: precheck
precheck: ## Umgebung prüfen — BASH_LIBS + DEV_MAKE gesetzt?
	@if [[ -z "$${BASH_LIBS+x}" ]]; then \
		echo ""; \
		echo "$(RED)Achtung: '$(YELLOW)BASH_LIBS$(RED)' ist nicht gesetzt!$(RESET)"; \
		echo "$(YELLOW)Tipp:$(RESET) Env-Variable in ~/.bashrc / ~/.zshrc setzen, z.B."; \
		echo "     $(GREEN)export BASH_LIBS=/Volumes/DevLocal/DevBash/Production/BashLib/src$(RESET)"; \
		echo ""; \
		exit 1; \
	fi
	@if [[ -z "$${DEV_MAKE+x}" ]]; then \
		echo ""; \
		echo "$(RED)Achtung: '$(YELLOW)DEV_MAKE$(RED)' ist nicht gesetzt!$(RESET)"; \
		echo "$(YELLOW)Tipp:$(RESET) Env-Variable in ~/.bashrc / ~/.zshrc setzen, z.B."; \
		echo "     $(GREEN)export DEV_MAKE=/Volumes/DevLocal/DevMake/Production/MakeLib$(RESET)"; \
		echo ""; \
		exit 1; \
	fi

# ─── Setup ───────────────────────────────────────────────────────────────────

##@ Setup

.PHONY: setup
setup: ## Symlinks (.libs/) + Deps installieren
	@./scripts/setup-libs.sh --install
	@npm install --no-audit --no-fund

# ─── Entwicklung ─────────────────────────────────────────────────────────────

##@ Entwicklung

.PHONY: dev
dev: ## Vite Dev-Server starten (Port 5173)
	@npm run dev

.PHONY: build
build: ## Production-Build (typecheck + vite build → dist/)
	@npm run build

.PHONY: preview
preview: ## Preview des Prod-Builds (Port 4173)
	@npm run preview

.PHONY: lint
lint: ## ESLint über src/, tests/
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
	@rm -rf dist coverage .vite .eslintcache
	@echo "$(GREEN)✓$(RESET) aufgeräumt"

# ─── Docker ──────────────────────────────────────────────────────────────────

##@ Docker

# Zielplattform für docker-build — x86, nicht die Architektur des Rechners.
#
# Das Abbild läuft auf dem Server, nicht hier: Ein arm64-Build vom Mac startet
# auf Unraid und den meisten NAS nicht. Wer es lokal auf Apple Silicon
# ausprobieren will, baut mit PLATFORM=arm.
#
#   x86        linux/amd64   (Vorgabe)
#   arm | m1   linux/arm64
#   all        beide — buildx baut und pusht in einem Schritt (Login nötig)
PLATFORM ?= x86

# Wie streng build.sh den Git-Zustand prüft:
#   2   ohne Tag oder mit dirty Working-Tree wird abgebrochen, Commits nach
#       dem letzten Tag sind erlaubt (Vorgabe)
#   1   zusätzlich abbrechen, wenn Commits nach dem letzten Tag liegen
STRICT ?= 2

.PHONY: docker-build
docker-build: ## Docker-Image bauen  [PLATFORM=x86|arm|all, Default x86 — STRICT=1|2, Default 2]
	@./docker/build.sh --build $(PLATFORM)

.PHONY: docker-push
docker-push: ##R Image pushen  [TARGET=dockerhub|ghcr|ecr, Default dockerhub]
	@./docker/build.sh --push

.PHONY: docker-update
docker-update: ## Basis-Image aktualisieren (docker pull)
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

.PHONY: tag-major
tag-major: precheck ## Version hochzählen — Major (X.y.z → X+1.0.0)  [MSG="..."]
	@source "$${BASH_LIBS}/version.lib.sh" && semVerBump major auto "" "$${MSG:-}"

.PHONY: tag-minor
tag-minor: precheck ## Version hochzählen — Minor (x.Y.z → x.Y+1.0)  [MSG="..."]
	@source "$${BASH_LIBS}/version.lib.sh" && semVerBump minor auto "" "$${MSG:-}"

.PHONY: tag-patch
tag-patch: precheck ## Version hochzählen — Patch (x.y.Z → x.y.Z+1)  [MSG="..."]
	@source "$${BASH_LIBS}/version.lib.sh" && semVerBump patch auto "" "$${MSG:-}"
