#!/usr/bin/env bash
# Config fuer docs-check.sh (ProjectTools) — wird gesourced, kein Custom-Parser.
# .sh-Endung fuers IDE-Highlighting. Format-Doku: ProjectTools/README.md
# Aufruf: make docs-check (laeuft auch in make test)
# shellcheck disable=SC2034  # von docs-check.sh gesourct

# Inhaltlich gepruefte Dokumente: nutzersichtbare Doku (AGENTS.md, Abschnitt
# Dokumentation), Lizenz- und Quelltexthinweise und die
# Anleitungen der Test-Fixtures. AGENTS.md und _tickets/ sind intern und
# duerfen die verbotenen Begriffe nennen; CHANGELOG.md entsteht aus
# Commit-Nachrichten (make changelog) und darf alte Angaben behalten. Diese
# Dateien stehen nur in REQUIRED.
DOCS=(
    "README.md"
    "docker/README.md"
    "unraid/README.md"
    "docs"
    "LICENSING.md"
    "SOURCE.md"
    "THIRD_PARTY_NOTICES.md"
    "frontend/tests/fixtures"
)

# Datierte Entwuerfe duerfen interne Angaben enthalten; die README-Vorlage
# nennt die verbotenen Begriffe bewusst.
EXCLUDE=(
    "docs/superpowers"
    "docs/README.template.md"
)

# PUID/PGID bleiben aus nutzersichtbarer Doku heraus (Mike, 2026-10-03, T-90).
FORBIDDEN=(
    "PUID|T-90: nicht in nutzersichtbarer Doku"
    "PGID|T-90: nicht in nutzersichtbarer Doku"
    "99:100|T-90: nicht in nutzersichtbarer Doku"
    "nobody:users|T-90: nicht in nutzersichtbarer Doku"
)

# Hoechstens zwei farbige Hinweisboxen je Dokument; mehr nehmen jeder
# einzelnen die Wirkung.
MAX_ALERTS=2

# Dateien, die es geben muss: versioniert, nicht leer, Markdown mit
# Ueberschrift. Pfade mit "./" gelten nur im Projekt-Root.
REQUIRED=(
    # Projekt- und Nutzerdoku
    "./README.md|Projekt-README"
    "docker/README.md|Container-Anleitung, Quelle der Docker-Hub-Beschreibung"
    "unraid/README.md|Unraid-Anleitung"
    "./CHANGELOG.md|Release-Historie, im README verlinkt"
    "docs/README.template.md|Vorlage fuer den Skill readme-conventions"
    # Nach Uebernahme des neuen README aktivieren (dort verlinkt):
    # "docs/user-guide.md|im README verlinkt"
    # "docs/development.md|im README verlinkt"

    # Lizenz und Quelltext: liegen jedem Build bei (frontend/scripts/licenseAssets.ts)
    "./LICENSE|EUPL 1.2, englischer Lizenztext"
    "./LICENSE.de.txt|EUPL 1.2, amtlicher deutscher Lizenztext"
    "./LICENSING.md|Anbieter- und Verbrauchererklaerung"
    "./THIRD_PARTY_NOTICES.md|Lizenzen der Fremdkomponenten"
    "./SOURCE.md|Bauanleitung fuer den mitgelieferten Quelltext"

    # Projektregeln fuer Agenten
    "./AGENTS.md|Projektregeln"
    "./CLAUDE.md|verweist Claude auf AGENTS.md"

    # Ticket-Board
    "_tickets/README.md|Ablage und Ablauf der Tickets"
    "_tickets/STATUS.md|Rollen und Kommunikationsstatus"
    "_tickets/QUESTIONS.md|Fragen beim Testen"
    "_tickets/.agents/AGENT-ACTIVATION.md"
    "_tickets/.agents/AGENT-WORKFLOW.md"
    "_tickets/.agents/CLAUDE-LESSONS.md"
    "_tickets/.agents/CODEX-IN-CONTEXT-SCHEDULER.md"
    "_tickets/.agents/CODEX-LESSONS.md"
    "_tickets/.agents/LESSONS-ACCESS.md"
    "_tickets/.agents/LESSONS-PROCESS.md"
    "_tickets/.agents/OBSERVER-VERIFICATION.md"
    "_tickets/.agents/TICKET-TEMPLATE.md"

    # Design und Planung
    "docs/stockinfo-integration-proposal.md|StockInfo-Anbindung"
    "docs/superpowers/specs/2026-08-06-rebalancing-webapp-design.md|Grundentwurf der App"
    "docs/superpowers/specs/2026-09-29-stockportfolio-server-design.md|Entwurf Server und Konten"

    # Anleitungen der Test-Fixtures
    "frontend/tests/fixtures/browser/README.md"
    "frontend/tests/fixtures/stockinfo/README.md"
)
