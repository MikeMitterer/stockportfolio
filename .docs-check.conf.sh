#!/usr/bin/env bash
# Config für docs-check.sh (ProjectTools) — wird gesourced, kein Custom-Parser.
# .sh-Endung fürs IDE-Highlighting. Format-Doku: ProjectTools/README.md
# Aufruf: make docs-check (läuft auch in make test)
# shellcheck disable=SC2034  # von docs-check.sh gesourct

# Pfadangaben in DOCS, LINKS_ONLY, EXCLUDE, REQUIRED und SCREENSHOTS gelten
# ab dem Projekt-Root.
# Muster wie in .gitignore: * innerhalb eines Ordners, ** beliebig tief,
# ? genau ein Zeichen. Ordner und Muster treffen nur Dateien, die git nicht
# ignoriert.

# Inhaltlich geprüfte Dokumente: nutzersichtbare Doku (AGENTS.md, Abschnitt
# Dokumentation), Lizenz- und Quelltexthinweise und die Anleitungen der
# Test-Fixtures. AGENTS.md und _tickets/ sind intern und dürfen die
# verbotenen Begriffe nennen; CHANGELOG.md entsteht aus Commit-Nachrichten
# (make changelog) und darf alte Angaben behalten. Diese Dateien stehen
# nicht in DOCS, sondern in REQUIRED und teils in LINKS_ONLY.
DOCS=(
    "README.md"
    "README.de.md"
    "docker/README.md"
    "unraid/README.md"
    "docs"
    "LICENSING.md"
    "SOURCE.md"
    "THIRD_PARTY_NOTICES.md"
    "frontend/tests/fixtures"
)

# Interne Doku: nur tote Links und Anker prüfen, verbotene Begriffe und
# Make-Targets sind hier erlaubt. Verweise auf andere Dokumente als Link
# schreiben, sonst fällt ein veralteter Verweis nicht auf. _tickets/ fehlt
# bewusst: Erledigte Tickets verlinken auf Dateien, die es heute nicht mehr
# gibt, und bleiben als Verlauf unverändert.
LINKS_ONLY=(
    "AGENTS.md"
    "CLAUDE.md"
)

# Datierte Entwürfe dürfen interne Angaben enthalten. Die README-Vorlage
# verweist für verbotene Begriffe auf diese Datei und wird mit geprüft.
EXCLUDE=(
    "docs/superpowers"
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

# Variablen, die docs/development.md nennt, die aber nur in MakeLib unter
# .libs/ stehen (von git ignoriert), oder allgemeine Standards sind.
KNOWN_VARIABLES=(
    "NO_COLOR|Standard der Kommandozeile, schaltet Farben ab"
    "THEME_WIDTH_HELP|MakeLib, colours.mk"
)

# Höchstens zwei farbige Hinweisboxen je Dokument; mehr nehmen jeder
# einzelnen die Wirkung.
MAX_ALERTS=2

# Dateien, die es geben muss: versioniert, nicht leer, Markdown mit
# Überschrift. Ohne "/" irgendwo im Projekt, "./" heißt Projekt-Root.
REQUIRED=(
    # Projekt- und Nutzerdoku
    "./README.md|Projekt-README"
    "./README.de.md|Projekt-README auf deutsch"
    "docker/README.md|Container-Anleitung, Quelle der Docker-Hub-Beschreibung"

    # Aufrufkette:
    #     make push ruft docker/build.sh --push auf.
    #     Darin ruft push() (docker/build.sh:297) der Reihe nach auf:
    #
    #     1. updateDockerHubReadme --preview: erzeugt die Vorschau.
    #     2. pushImage: lädt das Image hoch.
    #     3. updateDockerHubReadme --publish: überträgt die Beschreibung nach Docker Hub.
    "docker/preview/README.md|Docker-Hub-Beschreibung, aus docker/README.md erzeugt"
    "docs/user-guide.md|im README verlinkt"
    "docs/development.md|im README verlinkt"
    "unraid/README.md|Unraid-Anleitung"

    # ChangeLog - wird mit make changelog generiert
    "./CHANGELOG.md|Release-Historie, im README verlinkt"

    # Neben der Vorlage im Skill - die Vorlage für das README dieses Projektes
    "docs/README.template.md|Vorlage für den Skill readme-conventions"

    # Lizenz und Quelltext: liegen jedem Build bei (frontend/scripts/licenseAssets.ts)
    "./LICENSE|EUPL 1.2, englischer Lizenztext"
    "./LICENSE.de.txt|EUPL 1.2, amtlicher deutscher Lizenztext"
    "./LICENSING.md|Anbieter- und Verbrauchererklärung"
    "./THIRD_PARTY_NOTICES.md|Lizenzen der Fremdkomponenten"
    "./SOURCE.md|Bauanleitung für den mitgelieferten Quelltext"
    "frontend/public/legal.html|handgeschrieben (nicht generiert), entstand bei der EUPL-Umstellung"

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

# Screenshots der Anleitungen. Sind sie älter als zwei Monate (nach
# Änderungsdatum der Datei), erscheint ein Hinweis: Dann prüfen, ob sie die
# aktuelle Oberfläche zeigen, sonst neu aufnehmen (docs/development.md).
SCREENSHOTS=(
    "docs/images"
)
MAX_SCREENSHOT_AGE_DAYS=60

# Code, dessen Umgebungsvariablen in einem Dokument aus DOCS stehen müssen:
# App, API und die Skripte für Teststack und Browserprüfungen. Jede Variable,
# die der Code dort liest, braucht eine Beschreibung (meist README.md,
# docker/README.md oder docs/development.md); sonst scheitert make test.
CODE_VARIABLES=(
    "api/src"
    "frontend/src"
    "frontend/scripts"
    "scripts"
)

# Vom Code gelesen, bewusst nicht dokumentiert, je mit "|<grund>".
INTERNAL_VARIABLES=(
)
