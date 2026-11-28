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
# für info und hints und für dev-up die Wahl des StockInfo (DEV_STOCKINFO, T-148).
-include .env
export STOCKINFO_API_URL DEV_STOCKINFO

# Werkzeuge aus .tools/ dieses Checkouts vorn im PATH; ein global installiertes ProjectTools
# zählt nicht. Geerbte Werte unausgewertet ($(value …)): Ein make setup aus einem Target erbt sie,
# und ein $(…) im Checkout-Pfad liefe sonst als Make-Code (makefile-conventions, Geerbte Werte).
TOOLS_DIR := .tools
export PATH := $(WORKSPACE)/$(TOOLS_DIR)/bin:$(value PATH)
# BashLib für die Version im Kopf von help, für tag-* und docker/build.sh: Ein von außen gesetztes
# BASH_LIBS geht vor, sonst die aus .tools/. Mit = statt :=: make ermittelt den Wert je Target neu,
# und ein Target nach require-bash-libs (make setup) sieht BashLib aus .tools/ im selben Lauf.
ifndef BASH_LIBS
BASH_LIBS = $(shell $(WORKSPACE_SQ)/$(TOOLS_DIR)/bin/bashlib-path 2>/dev/null)
BASHLIB_FROM_TOOLS := yes
else
override BASH_LIBS := $(value BASH_LIBS)
endif
export BASH_LIBS
# Bash-Libs von CLITheme (cli.lib.sh, make.lib.sh) für help, info, hints und die Ausgabe der
# Skripte, ebenso aus .tools/; ein von außen gesetztes CLI_LIBS geht vor.
ifndef CLI_LIBS
CLI_LIBS = $(shell $(WORKSPACE_SQ)/$(TOOLS_DIR)/bin/clilib-path 2>/dev/null)
else
override CLI_LIBS := $(value CLI_LIBS)
endif
export CLI_LIBS
# Theme einmal je make-Lauf statt je Rezeptzeile; ein geerbter Export gilt.
ifndef CLITHEME_EXPORT
CLITHEME_EXPORT := $(shell $(WORKSPACE_SQ)/$(TOOLS_DIR)/bin/clitheme export --bash 2>/dev/null)
else
override CLITHEME_EXPORT := $(value CLITHEME_EXPORT)
endif
export CLITHEME_EXPORT

# Mindestversion von Python, gelesen aus `requires-python = ">=X.Y"` in pyproject.toml, der
# einzigen Quelle. Leer, wenn die Zeile anders aussieht; setup bricht dann mit Meldung ab.
PYTHON_MIN := $(shell sed -n 's/^requires-python = ">=\([0-9][0-9.]*\)"$$/\1/p' pyproject.toml)
# Interpreter, mit dem `make setup` die .venv anlegt: PYTHON_BOOTSTRAP aus der Umgebung, sonst
# python$(PYTHON_MIN). Als Wert von außen liest ihn die Shell im Rezept, nicht Make. Das Makefile
# setzt und exportiert PYTHON_BOOTSTRAP nicht: ProjectTools liest denselben Namen als Vorgabe
# für seine Befehle aus .tools/ und wählt ohne ihn selbst ein passendes Python.
BOOTSTRAP = "$${PYTHON_BOOTSTRAP:-python$(PYTHON_MIN)}"
# Python-Ausdruck für `-c`: Exit 0 ab PYTHON_MIN, sonst Abbruch mit der gefundenen Version.
PYTHON_MIN_CHECK = import sys; sys.exit(0 if sys.version_info >= tuple(map(int, "$(PYTHON_MIN)".split("."))) else "Python $(PYTHON_MIN) oder neuer erforderlich, gefunden " + sys.version.split()[0])
VENV := .venv
PYTHON := $(VENV)/bin/python

# Was setup herstellt und require-setup prüft: npm-Pakete beider Teilprojekte, die .venv und
# die Werkzeuge in .tools/. Jeder Stempel entsteht neu, sobald seine Quelldatei neuer ist; bei
# den npm-Paketen ist das der Abhängigkeitsstempel in .stamps/ (siehe Setup).
TOOLS_STAMP := $(TOOLS_DIR)/.installed
# Der Stempel der .venv trägt die Mindestversion im Namen: Steigt sie, fehlt er, require-setup
# verlangt make setup, und setup ersetzt eine .venv mit älterem Python.
VENV_STAMP := $(VENV)/.installed-python$(PYTHON_MIN)
SETUP_STAMPS := frontend/node_modules/.installed api/node_modules/.installed \
	$(VENV_STAMP) $(TOOLS_STAMP)

# Ports des Dev-Stacks nennt dev-ports (--port-of NAME) aus ProjectTools; sie stehen dort, wo sie
# beim Start wirken: die Konto-API als PORT=… in der Zeile `api` von Procfile.dev, das Frontend
# als server.port in frontend/vite.config.ts. Das Makefile liest keine der Dateien selbst. Ohne
# dev-ports (vor make setup) nennen info und hints statt der Adresse NO_DEV_PORTS; dev-up und
# dev-down brechen dann schon in require-tools ab. Nur Ziffern werden übernommen. $(shell) sieht
# das exportierte PATH erst ab Make 4.4, darum TOOL_ENV; ohne BASH_ENV, das help, info und hints
# setzen. Ermittelt erst beim ersten Gebrauch und dann gemerkt (eval mit :=).
TOOL_ENV     = unset BASH_ENV; PATH=$(WORKSPACE_SQ)/$(TOOLS_DIR)/bin:"$$PATH"
NO_DEV_PORTS := ? (dev-ports fehlt: make setup)
dev_port     = $(shell $(TOOL_ENV); dev-ports --port-of $(1) 2>/dev/null | grep -xE '[0-9]+')
# Adresse eines Dienstes, ohne bekannten Port NO_DEV_PORTS.
dev_url      = $(if $($(1)),http://localhost:$($(1)),$(NO_DEV_PORTS))
# override: Ein gleichnamiges Make-Argument setzt sie nicht, sonst stünde ein fremder Wert
# ungeprüft im Rezepttext. unexport: Stehen sie in der Umgebung, gäbe Make sie an $(shell) weiter
# und müsste sie mitten in ihrer eigenen Ermittlung auswerten.
override FRONTEND_PORT = $(eval override FRONTEND_PORT := $$(call dev_port,frontend))$(FRONTEND_PORT)
override API_PORT      = $(eval override API_PORT := $$(call dev_port,api))$(API_PORT)
unexport FRONTEND_PORT API_PORT
# Adressen der StockInfo-Dienste, die dev-up startet oder mitbenutzt (T-147); das Skript fragt
# dev-ports im StockInfo-Repository und gibt nur http://127.0.0.1:<Ziffern> aus.
NO_STOCKINFO   := ? (Grund: scripts/dev-stack.sh --address)
# Angezeigt mit localhost wie App und Konto-API; die Konto-API selbst bekommt 127.0.0.1.
stockinfo_url   = $(or $(subst //127.0.0.1:,//localhost:,$(shell $(TOOL_ENV); \
	scripts/dev-stack.sh --address $(1) 2>/dev/null)),$(NO_STOCKINFO))
override STOCKINFO_BACKEND_URL   = $(eval override STOCKINFO_BACKEND_URL := $$(call stockinfo_url,backend))$(STOCKINFO_BACKEND_URL)
override STOCKINFO_DASHBOARD_URL = $(eval override STOCKINFO_DASHBOARD_URL := $$(call stockinfo_url,dashboard))$(STOCKINFO_DASHBOARD_URL)
unexport STOCKINFO_BACKEND_URL STOCKINFO_DASHBOARD_URL

# ─── Hilfe ───────────────────────────────────────────────────────────────────

# Liste der Makefiles unausgewertet über die Umgebung (Werte von außen, Standard-Header).
export HELP_FILES = $(value MAKEFILE_LIST)
# help, info und hints geben über make.lib.sh von CLITheme (samt cli.lib.sh) aus, geladen über
# BASH_ENV in jede Rezeptzeile; eine Rezeptzeile ergibt eine Ausgabezeile. Bash wertet BASH_ENV
# aus: darum der Verweis auf CLI_LIBS statt des Pfads, ein $(…) im Checkout-Pfad bleibt Text.
# Leer, solange CLITheme in .tools/ fehlt; die Vorbedingungen richten es dann mit make setup ein.
help info hints: export BASH_ENV := $${CLI_LIBS:+$${CLI_LIBS}/make.lib.sh}
help info hints: require-bash-libs require-cli-libs

# Eine Beschreibung sagt, was nach dem Ziel anders ist; den Ablauf beschreibt docs/development.md.
# Kopf mit Projektname und Version (readProjectVersion aus BashLib); die Version steht in
# frontend/package.json. Targets stehen nur in diesem Makefile.
.PHONY: help
help: ## Verfügbare Befehle anzeigen
	@showMakeTargets "$${PROJECT_NAME} $$(source "$${BASH_LIBS}/version.lib.sh" && readProjectVersion auto frontend)" $${HELP_FILES}

.PHONY: info
info: ## Projektpfade, Build-Variablen und Werkzeugstand anzeigen
	@echo
	@printThemeValue WORKSPACE         "$${WORKSPACE}"
	@printThemeValue BASH_LIBS         "$${BASH_LIBS:-nicht gefunden (make setup)}"
	@printThemeValue CLI_LIBS          "$${CLI_LIBS:-nicht gefunden (make setup)}"
	@printThemeValue PYTHON_BOOTSTRAP  "$${PYTHON_BOOTSTRAP:-python$(PYTHON_MIN)}"
	@printThemeValue STOCKINFO_API_URL "$${STOCKINFO_API_URL:-nicht gesetzt (.env)}"
	@printThemeValue DEV_STOCKINFO     "$${DEV_STOCKINFO:-local}  (dev-up: local | remote)"
	@printThemeValue PLATFORM          "$${PLATFORM}  (build: x86 | arm)"
	@printThemeValue TARGET            "$${TARGET:-dockerhub}  (push: dockerhub | ghcr | ecr)"
	@printThemeHeading "Werkzeuge (.dev-tools.conf.sh)"
	@# devtools rückt um zwei Zeichen ein; fünf mehr stellen die Zeilen unter die Werte oben.
	@$(REQUIRE_STARTER); set -o pipefail; $(DEV_TOOLS) status 2>/dev/null | sed 's/^/     /' || echo "       Werkzeugstand nicht abrufbar: make setup"
	@echo

# Repo-Adresse (origin als https) und letzter Release-Tag aus repo-info (ProjectTools); die
# Ausgabe enthält nur erlaubte Zeichen, auch der Ersatz ohne Remote oder Tag. repo-info läuft
# erst, wenn hints einen Wert braucht, und je Wert nur einmal (eval mit :=).
NO_REPO_INFO := repo-info fehlt (make setup)
REPO_URL     = $(eval REPO_URL := $(or $(shell $(TOOL_ENV); repo-info --url 2>/dev/null),$(NO_REPO_INFO)))$(REPO_URL)
RELEASE_TAG  = $(eval RELEASE_TAG := $(or $(shell $(TOOL_ENV); repo-info --release-tag 2>/dev/null),$(NO_REPO_INFO)))$(RELEASE_TAG)
# Links, URLs und Tipps für den Alltag; das Einrichten beschreibt docs/development.md.
# require-tools, weil repo-info aus ProjectTools kommt: Fehlt es, läuft vorher make setup.
.PHONY: hints
hints: require-tools ## Links, URLs und Tipps für die tägliche Arbeit
	@printThemeHeading "Links"
	@printThemeValue   "Repository"        '$(REPO_URL)'
	@printThemeValue   "Letzter Release"   '$(RELEASE_TAG)'
	@printThemeValue   "Docker Hub"        "https://hub.docker.com/r/mangolila/stockportfolio"
	@printThemeValue   "StockInfo ohne dev-up" "$${STOCKINFO_API_URL:-nicht gesetzt (.env)}"
	@printThemeHeading "URLs (nach make dev-up, StockInfo $${DEV_STOCKINFO:-local})"
	@printThemeValue   "App"               '$(call dev_url,FRONTEND_PORT)'
	@printThemeValue   "Konto-API"         '$(call dev_url,API_PORT)'
	@printThemeValue   "StockInfo-API"     '$(STOCKINFO_BACKEND_URL)'
	@printThemeValue   "StockInfo-API-Doku" '$(if $(filter http%,$(STOCKINFO_BACKEND_URL)),$(STOCKINFO_BACKEND_URL)/docs,$(NO_STOCKINFO))'
	@printThemeValue   "StockInfo-Dashboard" '$(STOCKINFO_DASHBOARD_URL)'
	@printThemeHeading "Im Alltag"
	@printThemeValue   "Vor dem Commit"    "make test"
	@printThemeValue   "Stack hängt"       "make dev-down; danach make dev-up"
	@printThemeValue   "Teststack"         "scripts/test-stack.py --stack --run"
	@printThemeValue   "StockInfo auf Unraid" "DEV_STOCKINFO=remote in .env, dann make dev-up"
	@printThemeValue   "Image für ARM"     "make build PLATFORM=arm"
	@printThemeValue   "Anderes Push-Ziel" "make push TARGET=ghcr"
	@echo

# ─── Voraussetzungen ─────────────────────────────────────────────────────────

# Ohne `##`, vor allen Targets, die BashLib laden (help, info, hints, tag-*, docker/build.sh):
# Fehlt BashLib (frischer Klon) oder ist .tools/ älter als .dev-tools.conf.sh, läuft make setup;
# fehlt es danach weiter, bricht es mit Grund ab. Ein von außen gesetztes BASH_LIBS prüft es nur
# auf Lesbarkeit und bricht ohne setup ab: setup brächte BashLib nur nach .tools/, das Target läse
# weiter BASH_LIBS. Als Vorbedingung, damit das Target danach BASH_LIBS neu ermittelt. Die
# Prüfung nach setup fragt bashlib-path direkt: BASH_LIBS dieses Targets steht schon fest.
# make setup ohne das BASH_ENV von help, info und hints, das auch für ihre Vorbedingungen gilt.
.PHONY: require-bash-libs require-cli-libs
require-bash-libs:
ifdef BASHLIB_FROM_TOOLS
	@{ test -r "$${BASH_LIBS}/version.lib.sh" && \
		$(MAKE) --no-print-directory --question $(TOOLS_STAMP) 2>/dev/null; } || \
		{ env -u BASH_ENV $(MAKE) --no-print-directory setup && \
		test -r "$$("$${WORKSPACE}/$(TOOLS_DIR)/bin/bashlib-path")/version.lib.sh"; } || { \
		echo "  ✗ BashLib fehlt auch nach make setup ($(TOOLS_DIR)/bin/bashlib-path)" >&2; exit 1; }
else
	@test -r "$${BASH_LIBS}/version.lib.sh" || { \
		echo "  ✗ BASH_LIBS zeigt nicht auf BashLib: anpassen oder unset BASH_LIBS, dann gilt die aus $(TOOLS_DIR)/" >&2; \
		echo "    BASH_LIBS=$${BASH_LIBS}" >&2; exit 1; }
endif

# Ohne `##`: dasselbe für die Bash-Libs von CLITheme (clilib-path), über die help, info und hints
# ausgeben. Fehlt CLITheme, etwa in einem älteren Checkout, holt make setup es nach .tools/.
require-cli-libs:
	@test -r "$${CLI_LIBS}/make.lib.sh" || { env -u BASH_ENV $(MAKE) --no-print-directory setup && \
		test -r "$$("$${WORKSPACE}/$(TOOLS_DIR)/bin/clilib-path")/make.lib.sh"; } || { \
		echo "  ✗ CLITheme fehlt auch nach make setup ($(TOOLS_DIR)/bin/clilib-path)" >&2; exit 1; }

# Ohne `##`: verlangt ProjectTools in .tools/ in Mindestversion. Fehlt es oder ist es zu alt,
# läuft zuerst make setup; scheitert die Prüfung danach, nennt devtools den Grund.
.PHONY: require-tools
require-tools: require-bash-libs
	@$(REQUIRE_STARTER); $(DEV_TOOLS) check projecttools >/dev/null 2>&1 || \
		env -u BASH_ENV $(MAKE) --no-print-directory setup
	@$(DEV_TOOLS) check projecttools

# ─── Setup ───────────────────────────────────────────────────────────────────

##@ Setup

# setup ist der einzige Weg, einen Checkout einzurichten, auch als worktree_setup im
# Prüf-Worktree. Prüfziele hängen an require-setup, das bei Bedarf make setup aufruft.
.PHONY: setup require-setup
setup: ## Bereit zum Entwickeln: npm-Pakete, .venv, Werkzeuge in .tools/
	@git config core.hooksPath .githooks   # pre-commit: make docs-check
	@$(MAKE) -s --no-print-directory $(SETUP_STAMPS)

# Stempelregeln: nur setup und build erreichen sie; neu, sobald die Lock- bzw. Config-Datei
# neuer ist.
#
# npm-Pakete hängen nicht direkt an package.json: Dort steht die Version, und jedes Release
# machte die Einrichtung sonst veraltet. devtools tstamp schreibt je Teilprojekt die
# Abhängigkeiten ohne Version nach .stamps/, und nur, wenn sie sich ändern — mit allowScripts,
# das `npm install-scripts approve/deny` allein in package.json schreibt. Beim Einlesen, damit
# make -q (require-setup) den neuen Stand sieht; in .stamps/, weil npm ci node_modules/ löscht.
NPM_DIRS := frontend api
$(shell for dir in $(NPM_DIRS); do \
	devtools tstamp .stamps/$$dir.dependencies $$dir/package.json $$dir/package-lock.json; \
	done 2>/dev/null)

# Vorher Node und npm gegen `engines` prüfen; npm selbst meldet eine Unterschreitung nur.
%/node_modules/.installed: .stamps/%.dependencies
	@node scripts/check-engines.mjs "$*"
	@npm ci --prefix "$*" --no-audit --no-fund
	@touch "$@"

# Fehlt der Stempel (etwa ohne devtools beim Einlesen), legt diese Regel ihn an.
.stamps/%.dependencies:
	@$(REQUIRE_STARTER); devtools tstamp "$@" "$*/package.json" "$*/package-lock.json"

# Eine .venv mit älterem Python wird mit --clear neu angelegt; sie ist ein Erzeugnis von setup.
# Über devtools exec: Mit rechnerlokaler Zuordnung kommen Git-Abhängigkeiten (CLITheme) aus den
# lokalen Repos, auch mit ungepushtem Tag. Ältere Stempel (andere Mindestversion) fallen weg.
$(VENV_STAMP): requirements-dev.txt pyproject.toml
	@test -n '$(PYTHON_MIN)' || { echo '  ✗ requires-python in pyproject.toml ist nicht als ">=X.Y" lesbar' >&2; exit 1; }
	@command -v $(BOOTSTRAP) >/dev/null || { echo "  ✗ "$(BOOTSTRAP)" nicht gefunden: Python $(PYTHON_MIN) installieren oder PYTHON_BOOTSTRAP=<Interpreter> make setup" >&2; exit 1; }
	@$(BOOTSTRAP) -c '$(PYTHON_MIN_CHECK)' || { echo '  ✗ PYTHON_BOOTSTRAP ist zu alt: PYTHON_BOOTSTRAP=python$(PYTHON_MIN) make setup' >&2; exit 1; }
	@# Ein Zweig für fehlende .venv, ins Leere zeigenden Interpreter-Link und zu altes Python.
	@if ! $(PYTHON) -c '$(PYTHON_MIN_CHECK)' 2>/dev/null; then \
		test -e $(VENV) && echo '  ⚠ .venv ohne lauffähiges Python ab $(PYTHON_MIN) wird neu angelegt'; \
		$(BOOTSTRAP) -m venv --clear $(VENV); \
	fi
	@rm -f $(VENV)/.installed $(VENV)/.installed-py*
	@$(REQUIRE_STARTER); devtools exec -- $(PYTHON) -m pip install -q --disable-pip-version-check -r requirements-dev.txt
	@touch "$@"

# Werkzeuge auf Quelle und Tag aus .dev-tools.conf.sh nach .tools/; devtools meldet je Werkzeug
# eine Zeile.
$(TOOLS_STAMP): .dev-tools.conf.sh
	@$(REQUIRE_STARTER); $(DEV_TOOLS) install
	@touch "$@"

# Ohne Hilfeeintrag: Fehlt die Einrichtung oder ist sie veraltet (Stempel oder core.hooksPath),
# läuft make setup; sonst nichts. Braucht kein BashLib, das erst mit setup kommt. Scheitert
# setup, bricht das Target mit dessen Meldung ab.
require-setup:
	@{ $(MAKE) --no-print-directory --question $(SETUP_STAMPS) && \
		[[ "$$(git config core.hooksPath)" == .githooks ]]; } 2>/dev/null || \
		$(MAKE) --no-print-directory setup

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
# dev-ports (ProjectTools) ist Voraussetzung (makefile-conventions): Procfile.dev fragt damit die
# Ports beim Start ab, ohne es fehlt Vite das Proxy-Ziel. StockInfo startet und stoppt
# scripts/dev-stack.sh über StockInfos eigenes dev-up/dev-down; ein schon laufendes bleibt
# unberührt. Die Konto-API bekommt dessen Adresse, die Vorrang vor der Datei-Vorgabe hat (T-147).
# Mit DEV_STOCKINFO=remote startet kein StockInfo; dann gilt STOCKINFO_API_URL (T-148).
.PHONY: dev-up dev-down
dev-up: require-tools ## App, Konto-API und StockInfo laufen im Hintergrund (Overmind)
	@command -v overmind >/dev/null || { echo "  ✗ overmind fehlt; overmind und tmux installieren." >&2; exit 1; }
	@command -v tmux >/dev/null || { echo "  ✗ tmux fehlt; tmux installieren." >&2; exit 1; }
	@dev-ports --check
	@scripts/dev-stack.sh --up
	@ADDRESS=$$(scripts/dev-stack.sh --address) && \
		STOCKINFO_API_URL="$$ADDRESS" OVERMIND_SKIP_ENV=1 overmind start -D -N -f Procfile.dev

dev-down: require-tools ## Dev-Stack samt von dev-up gestartetem StockInfo gestoppt, Ports frei
	-@overmind quit 2>/dev/null || true
	@scripts/dev-stack.sh --down
	@dev-ports --kill

# Setzt den Checkout zurück; danach verlangen die Prüfziele wieder make setup.
.PHONY: clean
clean: ## Erzeugte Dateien, .venv und .tools/ entfernt; .env und Daten bleiben
	@npm --prefix frontend run clean
	@npm --prefix api run clean
	@rm -rf dist coverage .vite .eslintcache tsconfig.tsbuildinfo scripts/teststack/__pycache__ scripts/tests/__pycache__ \
		$(VENV) $(TOOLS_DIR) .stamps frontend/node_modules/.installed api/node_modules/.installed
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
CHECK_PY := scripts/check-files.sh --python --
CHECK_SH := scripts/check-files.sh --shell --
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
	@scripts/check-files.sh --shell --each -- bash -n
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

# docker/build.sh lädt BashLib, push ruft dazu dockerhub-readme aus .tools/ auf; require-bash-libs
# und require-tools richten beides bei Bedarf mit make setup ein.
.PHONY: build push docker-images docker-samples
build: require-bash-libs ## Image lokal gebaut (PLATFORM=x86|arm, Default x86)
	@./docker/build.sh --build "$${PLATFORM}"

push: require-bash-libs require-tools ## Geprüfter Build veröffentlicht, danach README (TARGET=dockerhub)
	@./docker/build.sh --push

docker-images: require-bash-libs ## Lokale Images des Projekts anzeigen
	@./docker/build.sh --images

docker-samples: require-bash-libs ## Beispiel-`docker run`-Kommandos zeigen
	@./docker/build.sh --samples

# ─── Versionierung ───────────────────────────────────────────────────────────

##@ Versionierung

# Die Version steht in frontend/package.json; tag-version liest und hebt sie dort. Sie steht im
# Kopf von make help, den letzten Release-Tag nennt make hints; eigene Targets version und tags
# gibt es nicht (versioning-conventions §4).
.PHONY: changelog precheck

# Ohne `##`: läuft vor tag-*; verlangt BashLib und richtet es über require-bash-libs bei Bedarf
# mit make setup ein, statt abzubrechen.
precheck: require-bash-libs

# Sprache von CHANGELOG.md, unabhängig von der Locale der Shell (changelog folgt sonst
# LANG). Überschreiben: make … CHANGELOG_LANGUAGE=de
CHANGELOG_LANGUAGE ?= en
export CHANGELOG_LANGUAGE

changelog: require-tools ## CHANGELOG.md aus Release-Tags und Commits erzeugen
	@LANGUAGE="$${CHANGELOG_LANGUAGE}" changelog --generate

# Je Target eine Hilfezeile; showMakeTargets liest nur Zeilen mit einem Target.
.PHONY: tag-major tag-minor tag-patch
tag-major: ## Major-Release, inkompatibel  [MSG="..."]
tag-minor: ## Minor-Release, neue Funktion  [MSG="..."]
tag-patch: ## Patch-Release, Fehlerbehebung  [MSG="..."]

# Version in frontend/package.json heben und lokal taggen, CHANGELOG.md committen, Stufe
# vorspulen; alles nur lokal, veröffentlicht wird mit git push --follow-tags. Prüfung und
# Ablauf stehen nur in tag-version (ProjectTools). changelog nennt bei Erfolg den absoluten
# Pfad der Datei, darum ohne stdout; Fehler kommen über stderr. require-tools vor precheck:
# Lässt sich ProjectTools oder BashLib nicht einrichten, bricht ein Release vor dem Bump ab,
# nicht erst nach dem Tag.
tag-major tag-minor tag-patch: require-tools precheck
	@cd frontend && tag-version "$(patsubst tag-%,%,$@)" --message "$${MSG:-}"
	@LANGUAGE="$${CHANGELOG_LANGUAGE}" changelog --commit >/dev/null
	@tag-version --fast-forward
