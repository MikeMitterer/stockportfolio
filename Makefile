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
# Bricht ab, wenn der Starter fehlt, und nennt den Weg dorthin. Solange die Werkzeuge nicht
# veröffentlicht sind, kommt er aus der lokalen DevTools-Arbeitskopie (Mike, 2026-11-20). Im
# Rezept vor jedem Aufruf von devtools: @$(REQUIRE_STARTER); …
REQUIRE_STARTER = command -v devtools >/dev/null || { \
	echo "  ✗ devtools fehlt: einmal je Rechner in der DevTools-Arbeitskopie make install" >&2; exit 1; }

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

# Python für die .venv des Teststacks unter scripts/; von außen überschreibbar, darum in Rezepten
# nur als "$${PYTHON_BOOTSTRAP}". Derselbe Name wählt den Interpreter der ProjectTools-Befehle aus
# .tools/ (etwa dockerhub-readme in make push); beide verlangen Python 3.14 oder neuer.
PYTHON_BOOTSTRAP ?= python3.14
export PYTHON_BOOTSTRAP
# Mindestversion für die .venv; ProjectTools verlangt dieselbe (requires-python).
PYTHON_CHECK := import sys; sys.exit(0 if sys.version_info >= (3, 14) else "Python 3.14 oder neuer erforderlich")
VENV := .venv
PYTHON := $(VENV)/bin/python

# Was setup herstellt und require-setup prüft: npm-Pakete beider Teilprojekte, die .venv und
# die Werkzeuge in .tools/. Jeder Stempel entsteht neu, sobald seine Quelldatei neuer ist.
TOOLS_STAMP := $(TOOLS_DIR)/.installed
# Der Stempel der .venv nennt die Mindestversion: Eine mit älterem Python eingerichtete .venv
# hat ihn nicht, require-setup verlangt dann make setup, und setup legt sie neu an.
VENV_STAMP := $(VENV)/.installed-py314
SETUP_STAMPS := frontend/node_modules/.installed api/node_modules/.installed \
	$(VENV_STAMP) $(TOOLS_STAMP)

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
# Neu auch bei geändertem Manifest: `npm install-scripts approve/deny` schreibt nur package.json.
# Vorher Node und npm gegen `engines` prüfen; npm selbst meldet eine Unterschreitung nur.
%/node_modules/.installed: %/package-lock.json %/package.json
	@node scripts/check-engines.mjs "$*"
	@npm ci --prefix "$*" --no-audit --no-fund
	@touch "$@"

$(PYTHON):
	@"$${PYTHON_BOOTSTRAP}" -c '$(PYTHON_CHECK)'
	@"$${PYTHON_BOOTSTRAP}" -m venv $(VENV)

# Über devtools exec: Mit rechnerlokaler Zuordnung kommen Git-Abhängigkeiten (CLITheme) aus den
# lokalen Repos, auch mit ungepushtem Tag.
$(VENV_STAMP): requirements-dev.txt | $(PYTHON)
	@$(PYTHON) -c '$(PYTHON_CHECK)' 2>/dev/null || { \
		echo "  .venv mit älterem Python wird mit $${PYTHON_BOOTSTRAP} neu angelegt"; \
		"$${PYTHON_BOOTSTRAP}" -c '$(PYTHON_CHECK)' && "$${PYTHON_BOOTSTRAP}" -m venv --clear $(VENV); }
	@$(REQUIRE_STARTER); devtools exec -- $(PYTHON) -m pip install -q --disable-pip-version-check -r requirements-dev.txt
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

# Setzt den Checkout zurück; danach verlangen die Prüfziele wieder make setup.
.PHONY: clean
clean: ## Erzeugte Dateien, .venv und .tools/ entfernt; .env und Daten bleiben
	@npm --prefix frontend run clean
	@npm --prefix api run clean
	@rm -rf dist coverage .vite .eslintcache tsconfig.tsbuildinfo scripts/__pycache__ \
		$(VENV) $(TOOLS_DIR) frontend/node_modules/.installed api/node_modules/.installed
	@echo "  ✓ aufgeräumt"

# ─── Prüfen ──────────────────────────────────────────────────────────────────
#
# Ein Target je Prüfart; darin je Sprache das passende Werkzeug: TypeScript/Vue über die
# npm-Skripte der Pakete, Python (Teststack unter scripts/) über die gepinnten Werkzeuge der
# .venv (requirements-dev.txt), Bash über shellcheck. Die Dateilisten kommen aus git, damit neue
# Dateien mitlaufen.

##@ Prüfen

# Python- und Shell-Werkzeuge bekommen die versionierten Dateien über scripts/check-files.sh:
# jeder Pfad ein eigenes Argument mit „./“, und ein Fehler von git bricht das Ziel ab.
CHECK_PY := scripts/check-files.sh python
CHECK_SH := scripts/check-files.sh shell
# Ein Prettier für beide Pakete; die Regeln stehen in .prettierrc.
PRETTIER := frontend/node_modules/.bin/prettier
PRETTIER_FILES := "frontend/src/**/*.{vue,ts,tsx,css,json}" "frontend/tests/**/*.ts" "api/src/**/*.ts" "api/tests/**/*.ts"

# Bricht ab, wenn ein Werkzeug außerhalb der .venv fehlt; still zu bestehen wäre ein falsches
# Grün. $(1): Befehl, $(2): Installationshinweis.
define require_tool
@command -v $(1) >/dev/null || { echo "  ✗ $(1) fehlt: $(2)" >&2; exit 1; }
endef

.PHONY: check lint typecheck format format-check test docs-check security audit quality

check: lint typecheck format-check test ## Alles geprüft, was die Abnahme verlangt

lint: require-setup ## Lint geprüft: ESLint (Frontend, API), ruff, shellcheck
	@npm run lint --prefix frontend
	@npm run lint --prefix api
	@$(CHECK_PY) $(VENV)/bin/ruff check
	@$(CHECK_SH) --each bash -n
	$(call require_tool,shellcheck,brew install shellcheck)
	@$(CHECK_SH) shellcheck

typecheck: require-setup ## Typen geprüft: vue-tsc (Frontend), tsc (API)
	@npm run typecheck --prefix frontend
	@npm run typecheck --prefix api

format: require-setup ## Quellen formatiert: Prettier (Frontend, API), ruff format
	@$(PRETTIER) --write --log-level warn $(PRETTIER_FILES)
	@$(CHECK_PY) $(VENV)/bin/ruff format

format-check: require-setup ## Formatierung geprüft, keine Datei geändert
	@$(PRETTIER) --check --log-level warn $(PRETTIER_FILES)
	@$(CHECK_PY) $(VENV)/bin/ruff format --check

test: docs-check require-setup ## Doku, Frontend-, API- und Python-Tests einmal geprüft
	@npm run test --prefix frontend
	@npm run test --prefix api
	@$(VENV)/bin/python -m pytest -q -p no:cacheprovider scripts/tests

# Ohne ProjectTools scheitert es laut, statt die Doku still zu überspringen. Config in
# .docs-check.conf.sh.
docs-check: require-tools ## Doku geprüft: Links, Befehle, Variablen, verbotene Begriffe
	@docs-check --run

security: require-setup ## Keine Geheimnisse in der Git-History, Python ohne Befund ab mittel
	$(call require_tool,gitleaks,brew install gitleaks)
	@gitleaks git --redact --no-banner .
	@$(CHECK_PY) $(VENV)/bin/python -m bandit -q -ll

# Braucht Netz; nicht in der Abnahme. Alle drei laufen, auch wenn einer Lücken findet; der
# Exit-Code meldet am Ende, ob einer davon fehlschlug.
audit: require-setup ## Abhängigkeiten ohne bekannte Lücken: npm (Laufzeit), Python
	@status=0; \
	npm audit --omit=dev --prefix frontend || status=1; \
	npm audit --omit=dev --prefix api || status=1; \
	$(VENV)/bin/python -m pip_audit --skip-editable || status=1; \
	exit $$status

# Nur Bericht: Befunde enden mit 0, die Schwellen sind Anhaltspunkte. Läuft ein Werkzeug gar
# nicht, scheitert das Target; ein leerer Bericht wäre sonst ein falsches Grün. Die Schwellen
# für TypeScript stehen in frontend/scripts/quality-report.mjs.
quality: require-setup ## Bericht zu Komplexität, Dateigröße und doppeltem Code
	@echo "Komplexität und Dateigröße TypeScript/Vue (ESLint)"
	@node frontend/scripts/quality-report.mjs frontend src
	@node frontend/scripts/quality-report.mjs api src
	@echo "Komplexität und Vereinfachungen Python (ruff C90, SIM, PLR09, RET)"
	@$(CHECK_PY) $(VENV)/bin/ruff check --select C90,SIM,PLR09,RET --output-format concise --exit-zero
	@echo "Doppelter Code über TypeScript, Vue und Python (jscpd)"
	@frontend/node_modules/.bin/jscpd --reporters console --min-tokens 70 \
		frontend/src frontend/tests api/src api/tests scripts $(wildcard .agents/bin)

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
