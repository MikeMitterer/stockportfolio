# Qualitätsprofil

**Woran man in StockPortfolio ein gutes Ergebnis erkennt, auch wo kein
Werkzeug misst.** Maßstab für den Qualitätslauf am Sprintende und für den
Reviewer (Guard `quality` von agent-lessons; `get_config` nennt Ort und
Vorlage). Ein Konzeptticket, das den Aufbau ändert, gleicht es ab.

Leere Abschnitte heißen „noch nicht entschieden“; „keine“ ist eine
Entscheidung. Eine Aussage mit „nur“ oder „nie“ nennt, was sie durchsetzt;
ohne das ist sie eine Konvention. Regeln aus den Projektregeln stehen in
[AGENTS.md](../AGENTS.md) und werden hier nur verlinkt.

## Übersicht

- [Messbare Grenzen](#messbare-grenzen)
- [Aufbau und Zuständigkeiten](#aufbau-und-zuständigkeiten)
- [Eine Quelle je Wissen](#eine-quelle-je-wissen)
- [Tests](#tests)
- [Fehler und Ausgaben](#fehler-und-ausgaben)
- [Dokumentation](#dokumentation)
- [Bewusste Ausnahmen](#bewusste-ausnahmen)

## Messbare Grenzen

Die Zahlen und Regeln stehen in den genannten Dateien; hier steht nur, was sie
bewirken. Was die Make-Ziele aufrufen, beschreibt die
[Entwicklerdoku](development.md#befehle).

| Prüfung | Quelle | Wirkung |
|---|---|---|
| ESLint für Frontend und API | `frontend/eslint.config.mjs`, `api/eslint.config.mjs` | bricht `make check` |
| Typen (vue-tsc, tsc) | `tsconfig*.json` der Pakete | bricht `make check` |
| Formatierung (Prettier, ruff format) | `.prettierrc`, `ruff.toml` | bricht `make check` (`format-check`) |
| Python-Lint (ruff) | `ruff.toml`, Abschnitt `[lint]` | bricht `make check` |
| Bash (`bash -n`, shellcheck) | Makefile, Ziel `lint` | bricht `make check` |
| Frontend-, API- und Python-Tests, Wächter-Tests | `frontend/tests/`, `api/tests/`, `scripts/tests/` | bricht `make test` und damit die Abnahme |
| Nutzerdoku (Links, Befehle, Variablen, verbotene Begriffe) | `.docs-check.conf.sh` | bricht `make test` |
| Geheimnisse in der Git-History, Python-Sicherheit | Makefile, Ziel `security` (gitleaks, bandit `-ll`) | bricht `make security` |
| Komplexität, Verschachtelung, Dateigröße (TS/Vue) | `frontend/scripts/quality-report.mjs`, `rules` | nur Bericht (`make quality`) |
| Komplexität und Vereinfachungen (Python) | Makefile, Ziel `quality` (ruff C90, SIM, PLR09, RET) | nur Bericht |
| doppelter Code über alle Sprachen | Makefile, Ziel `quality` (jscpd, `--min-tokens`) | nur Bericht |
| bekannte Lücken in Abhängigkeiten | Makefile, Ziel `audit` (npm audit, pip-audit) | bricht `make audit`; braucht Netz, nicht Teil der Abnahme |
| Node- und npm-Version | `engines` in `frontend/package.json` und `api/package.json` | bricht `make setup` (`scripts/check-engines.mjs`) |

Die Abnahme führt den Prüfbefehl `integration_check` aus `_tickets/.board/project.yaml`
aus. Kehrt eine Fundart aus `make quality` im Sprint-Abschluss wieder, wird sie
hier zur Schranke oder ihr Grund steht unter [Bewusste Ausnahmen](#bewusste-ausnahmen).

[↑ Übersicht](#übersicht)

## Aufbau und Zuständigkeiten

- **Zwei Teile, getrennte Zuständigkeit:** Kurse, Instrumente und Historie
  kommen aus StockInfo; die Konto-API verwaltet Konten, Sitzungen und private
  Depotdaten ([AGENTS.md](../AGENTS.md#stockportfolio-hängt-an-stockinfo)).
- **Netzwerk nur unter `frontend/src/api/`,** je Gegenstelle ein Unterordner;
  durchgesetzt von `frontend/tests/networkAccess.spec.ts`. StockInfo erreicht
  der Browser nur über die Weiterleitung `api/src/stockinfo/proxy.ts` mit
  Freigabeliste.
- **Frontend-Aufbau,** so wie er ist (Importsuche in den Qualitätsläufen
  2026-11-20 und 2026-11-21 über `frontend/src`):
  - `views/`, `components/` und `composables/` lesen Zustand aus `stores/`.
    Den StockInfo-Client holen sie über `inject(STOCK_INFO_CLIENT)`, den
    `auth/AuthRoot.vue` bereitstellt; Typen und Fehlerformen importieren sie
    aus `frontend/src/api/stockinfo/`.
  - Die Konto-API (`frontend/src/api/account/`) rufen `auth/` und
    `views/UserAdminView.vue` direkt auf.
  - Private Depotdaten lesen und schreiben die Stores `instruments`,
    `portfolio`, `settings` und `valueHistory` über `data/repository.ts`, das
    den Client aus `frontend/src/api/data/` kapselt. Backup, Altbestands-Import
    und Live-Abgleich (`stores/backup.ts`, `legacy.ts`, `liveSync.ts`) rufen
    diesen Client direkt auf; `auth/` aktiviert ihn und öffnet den
    Ereignisstrom, `App.vue` zeigt seine Fehler (Importsuche nach
    `from '@/api/data/` und `from '@/data/repository'` in beide Richtungen).
  - `stores/` nutzen `api/`, `data/`, `db/` und `domain/`, aber keine Views
    oder Komponenten (0 Treffer für `from '@/(views|components)/'` unter
    `stores/`; dieselbe Suche findet unter `views/` 3 Dateien).
  - `domain/` rechnet ohne Vue und Pinia (0 Treffer für `from '(vue|pinia)'`,
    unter `stores/` 17) und kennt aus `api/` nur Typen (`historyPeriod.ts`).
  - `router/` ordnet Ansichten zu, `types/` hält gemeinsame Typen.
  - `db/` hält in IndexedDB den Altbestand (`legacy.ts` über die Depot-,
    Einstellungs-, Freigabe- und Tageswert-Repositories aus `repository.ts`)
    und die Zwischenspeicher für Kurse und Kursverlauf (`QuoteCacheRepository`,
    `HistoryRepository`, genutzt von `stores/quotes.ts` und `stores/history.ts`;
    `cache.ts` leert sie). Dazu kommen die Vorlagen für leeres und
    Beispieldepot samt `newId()` (`seed.ts`). Außer den Stores greifen nur
    `composables/useAddPosition.ts` (`newId`) und `auth/AuthRoot.vue`
    (`clearMarketCaches` beim Abmelden) direkt auf `db/` zu; auf `data/` nur
    Stores (Importsuche nach `from '@/(db|data)/'` außerhalb dieser Ordner).
  - Durchgesetzt ist davon nur der Netzzugriff (`networkAccess.spec.ts`); der
    Rest ist Konvention.
- **API-Aufbau,** so wie er ist (Importsuche nach `from '../` unter
  `api/src/routers/` und `api/src/persistence/` in beide Richtungen):
  - `routers/api.ts` setzt den Router zusammen: Fehlerform, Origin- und
    JSON-Prüfung, Sitzungstausch am Ende der Anfrage, StockInfo-Weiterleitung
    (`stockinfo/proxy.ts`). Die Routen der Bereiche stehen in
    `routers/accounts.ts` (Einrichtung, Anmeldung, Benutzer) und
    `routers/privateData.ts` (private Depotdaten, Prüfung je Ressourcenart,
    Ereignisstrom). Sitzungscookie und Anmeldeprüfung stehen in
    `routers/session.ts`, gemeinsame Anfrage-Leser in `routers/request.ts`.
  - Konten, Anmeldung und Sitzungen ruft der Router über `AccountService`
    (`auth/service.ts`). Private Depotdaten liest und schreibt
    `routers/privateData.ts` direkt über das Repository (etwa
    `findResource`, `saveResource`); eine eigene Fachschicht dafür gibt es
    nicht.
  - `persistence/repository.ts` hält Konten, Sitzungen und Anmeldeversuche
    und setzt mit `persistence/privateData.ts` (Depotdaten je Konto) ein
    `AccountRepository` zusammen. `persistence/` importiert keine der anderen
    Schichten.
  - `data/events.ts` verteilt Änderungsereignisse an offene Verbindungen.
  - Konvention.
- **Oberfläche aus dem Fundament:** Token, Themes und Bausteine kommen aus
  `@mmit/ux-foundation` ([AGENTS.md](../AGENTS.md#oberfläche-und-theme-kommen-aus-ux-foundation));
  durchgesetzt von den Wächtern für Token, Utility-Klassen, Komponentenstile,
  Pfeile und Speicherzugriff.
- **Bezeichner englisch, Erklärung deutsch** ([AGENTS.md](../AGENTS.md#bezeichner-sind-englisch-ausnahmslos)).
  Konvention.
- **Logik in Skripte, nicht ins Makefile:** Das Makefile ruft auf und
  verknüpft; Abläufe stehen in `scripts/` oder in den Paketen (Skill
  `makefile-conventions`). Konvention.
- Ein Modul, das zu lang wird, wird nach einem fachlichen Teil geteilt, nicht
  nach Zeilen; eine zu verzweigte Funktion wird in benannte Schritte zerlegt.
  Konvention.

[↑ Übersicht](#übersicht)

## Eine Quelle je Wissen

- **Texte** stehen nur in `frontend/src/i18n/de.ts` und `en.ts`; gleiche
  Schlüssel, Platzhalter und Pluralformen prüft
  `frontend/tests/i18n/catalogues.spec.ts`.
- **StockInfo-Fehler** kommen als Kennung; den Satz bildet der Katalog unter
  `errors.reason` ([AGENTS.md](../AGENTS.md#stockportfolio-hängt-an-stockinfo)).
- **Freigegebene StockInfo-Pfade** stehen nur in `api/src/stockinfo/proxy.ts`.
- **Werkzeugversionen** stehen in `.dev-tools.conf.sh`, Python-Pakete der
  `.venv` in `requirements-dev.txt`, Node- und npm-Bereiche in `engines` der
  Paket-Manifeste, die npm-Version des Images in `ARG NPM_VERSION` des
  `docker/Dockerfile`.
- **Umgebungsvariablen**, die der Code liest, nennt die Doku; `make docs-check`
  meldet fehlende.

[↑ Übersicht](#übersicht)

## Tests

- **Kein Netz und kein echter Speicher:** Clients bekommen `fetch` injiziert,
  IndexedDB läuft über `fake-indexeddb`
  ([AGENTS.md](../AGENTS.md#wächter-tests-prüfen-das-muster-nicht-die-fundstelle)).
- **Wächter-Tests prüfen das Muster** über den ganzen `src/`-Baum; eine
  Fundstelle wird korrigiert, der Riegel nicht gelockert. Durchgesetzt von den
  sechs Wächtern unter `frontend/tests/`.
- **Neue oder geänderte Prüfungen laufen einmal rot** (Guard
  `failing-check-first`); der rote Lauf steht mit `record_run` im Ticket.
- **Ein Test baut die getestete Logik nicht nach;** er ruft sie auf. Konvention.
- **Sichtbare Abläufe** prüfen die Playwright-Skripte unter `frontend/scripts/`
  gegen den Teststack, nie gegen Arbeitsdaten
  ([AGENTS.md](../AGENTS.md#browserprüfung)).

[↑ Übersicht](#übersicht)

## Fehler und Ausgaben

- **Die Konto-API antwortet mit Kennungen** (`{ "error": "<code>" }`, Status
  aus `ServiceError`); den Satz bildet die Oberfläche. Konvention.
- **Jeder sichtbare Text** läuft über vue-i18n in Deutsch und Englisch, nie als
  roher String; die Kataloge prüft `catalogues.spec.ts`.
- **Meldungen nennen den nächsten Schritt,** wo es einen gibt (etwa
  „Prüfe STOCKINFO_API_URL“). Konvention.
- **Skripte** melden Fehler auf stderr mit Exit-Code ungleich 0 und nennen den
  Befehl zur Abhilfe (etwa `make setup`, `brew install …`). Konvention.

[↑ Übersicht](#übersicht)

## Dokumentation

Was zu einer Änderung gehört und welches Dokument wofür steht, regelt
[AGENTS.md](../AGENTS.md#dokumentation-gehört-zur-änderung) mit dem Skill
`docs-conventions`. `make docs-check` prüft die Nutzerdoku bei jedem
`make test` und vor jedem Commit.

[↑ Übersicht](#übersicht)

## Bewusste Ausnahmen

- **Sprachkataloge über 500 Zeilen** (`frontend/src/i18n/de.ts`, `en.ts`): Je
  Sprache eine Datei hält den Abgleich in `catalogues.spec.ts` einfach. Der
  Bericht aus `make quality` nennt sie weiter.
- **Gleich lautende Theme-Namen in `de.ts` und `en.ts`** (`settings.themeNames`):
  Namen sind sichtbarer Text und gehören nach `@mmit/ux-foundation` in den
  Sprachkatalog, nicht zur Farbdefinition; dass sie heute in beiden Sprachen
  gleich heißen, ist Zufall. jscpd meldet den Block als Kopie.
- **Gleiche Depots in mehreren Backup-Fixtures** unter
  `frontend/tests/fixtures/browser/`: Jede Datei ist ein vollständiges Backup
  für genau eine Browserprüfung und soll ohne die anderen lesbar bleiben.
- **`mmit-clitheme` ohne pip-audit-Prüfung:** Das Paket kommt per Git aus
  Mikes eigenem Repository (`requirements-dev.txt`) und steht nicht auf PyPI;
  `make audit` meldet es deshalb als nicht prüfbar. Es gestaltet nur die
  Ausgabe der Teststack-Skripte in der Entwicklungs-`.venv` und gehört nicht
  ins Image.

[↑ Übersicht](#übersicht)
