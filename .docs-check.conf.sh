#!/usr/bin/env bash
# Config für docs-check.sh (ProjectTools) — wird gesourced, kein Custom-Parser.
# .sh-Endung fürs IDE-Highlighting. Format-Doku: ProjectTools/README.md
# Aufruf: make docs-check (läuft auch in make test)
# shellcheck disable=SC2034  # von docs-check.sh gesourct

# Pfadangaben in DOCS, EXCLUDE und REQUIRED gelten ab dem Projekt-Root.
# Muster wie in .gitignore: * innerhalb eines Ordners, ** beliebig tief,
# ? genau ein Zeichen. Ordner und Muster treffen nur Dateien, die git nicht
# ignoriert.

# Inhaltlich geprüfte Dokumente: nutzersichtbare Doku (AGENTS.md, Abschnitt
# Dokumentation), Lizenz- und Quelltexthinweise und die Anleitungen der
# Test-Fixtures. AGENTS.md und _tickets/ sind intern und dürfen die
# verbotenen Begriffe nennen; CHANGELOG.md entsteht aus Commit-Nachrichten
# (make changelog) und darf alte Angaben behalten. Diese Dateien stehen nur
# in REQUIRED.
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

# Datierte Entwürfe dürfen interne Angaben enthalten; die README-Vorlage
# nennt die verbotenen Begriffe bewusst.
EXCLUDE=(
    "docs/superpowers"
    "docs/README.template.md"
)

# Text, der in keinem Dokument aus DOCS stehen darf. Geprüft wird jede Zeile,
# auch in Codeblöcken; jeder Treffer lässt make test scheitern. Die Meldung
# nennt Zeilen, gefundenen Text und Grund.
#
# Ein Eintrag hat eine von zwei Formen, jeweils optional mit "|<grund>":
#
#   "<text>"             Genau dieser Text, Groß-/Kleinschreibung zählt.
#                        Trifft auch innerhalb von Wörtern: "UID" trifft
#                        "PUID".
#
#   "/<muster>/<flags>"  Regulärer Ausdruck in JavaScript-Syntax:
#                          \b      Wortgrenze: "/\bUID\b/" trifft nicht "PUID"
#                          (a|b)   Alternative: "/\bP(U|G)ID\b/"
#                          a|b     ganze Alternativen: "/PUID|nobody:users/"
#                          \d+     Ziffern: "/\b99:\d+\b/"
#                        Flag i: Groß-/Kleinschreibung egal.
#                        "|" im Muster ist erlaubt: Das Muster endet am
#                        ersten "/", dem nur Flags und dann "|" oder das
#                        Zeilenende folgen. Ein "/" im Muster wird "\/".
#                        Ein ungültiger Ausdruck bricht mit Exit-Code 2 ab.
#
# In doppelten Anführungszeichen bleiben "\b" und "\d" erhalten;
# Dollarzeichen und Backticks brauchen einen Backslash davor.
#
# PUID/PGID und die Standard-IDs bleiben aus nutzersichtbarer Doku heraus
# (Mike, 2026-10-03, T-90; Regel in AGENTS.md).
FORBIDDEN=(
    # Die Umgebungsvariablen, in jeder Schreibweise (PUID, PGID, puid)
    "/\bP(U|G)ID\b/i|T-90: Variablen nicht in nutzersichtbarer Doku"
    # Unraids Standardnutzer, als Zahl und als Name
    "/\b99:100\b|\bnobody:users\b/i|T-90: Standard-IDs nicht in nutzersichtbarer Doku"
)

# Höchstens zwei farbige Hinweisboxen je Dokument; mehr nehmen jeder
# einzelnen die Wirkung.
MAX_ALERTS=2

# Dateien, die es geben muss: versioniert, nicht leer, Markdown mit
# Überschrift. Ohne "/" irgendwo im Projekt, "./" heißt Projekt-Root.
REQUIRED=(
    # Projekt- und Nutzerdoku
    "./README.md|Projekt-README"
    "docker/README.md|Container-Anleitung, Quelle der Docker-Hub-Beschreibung"
    "unraid/README.md|Unraid-Anleitung"
    "./CHANGELOG.md|Release-Historie, im README verlinkt"
    "docs/README.template.md|Vorlage für den Skill readme-conventions"
    # Nach Übernahme des neuen README aktivieren (dort verlinkt):
    # "docs/user-guide.md|im README verlinkt"
    # "docs/development.md|im README verlinkt"

    # Lizenz und Quelltext: liegen jedem Build bei (frontend/scripts/licenseAssets.ts)
    "./LICENSE|EUPL 1.2, englischer Lizenztext"
    "./LICENSE.de.txt|EUPL 1.2, amtlicher deutscher Lizenztext"
    "./LICENSING.md|Anbieter- und Verbrauchererklärung"
    "./THIRD_PARTY_NOTICES.md|Lizenzen der Fremdkomponenten"
    "./SOURCE.md|Bauanleitung für den mitgelieferten Quelltext"

    # Projektregeln für Agenten
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
