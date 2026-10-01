# StockPortfolio — Projektregeln

**Diese Datei ist die einzige Regelquelle des Projekts.** Sie gilt für jede
Instanz und jede Laufzeit. `AGENTS.md` ist der übliche projektweite Einstieg;
`CLAUDE.md` verweist nur hierher und enthält keine eigenen Regeln. Eine zweite
Regelkopie liefe beim ersten Nachtrag auseinander.

StockPortfolio besteht aus der Vue-3-App unter `frontend/` und der eigenen
Konto-API unter `api/`. Kurse, Instrumente und Historie kommen weiterhin
vollständig aus StockInfo. Die eigene API verwaltet Konten, Sitzungen und
private Depotdaten je Konto. Wer diese Zuständigkeiten vermischt, sucht
Fehler im falschen Repository.

## Übersicht

- [StockPortfolio hängt an StockInfo](#stockportfolio-hängt-an-stockinfo)
- [Vor Arbeitsbeginn](#vor-arbeitsbeginn)
- [Ein Arbeitsort: der Projekt-Root](#ein-arbeitsort-der-projekt-root)
- [Bezeichner sind englisch. Ausnahmslos.](#bezeichner-sind-englisch-ausnahmslos)
- [Wächter-Tests prüfen das Muster, nicht die Fundstelle](#wächter-tests-prüfen-das-muster-nicht-die-fundstelle)
- [Bauen und prüfen](#bauen-und-prüfen)
- [Oberfläche und Theme kommen aus ux-foundation](#oberfläche-und-theme-kommen-aus-ux-foundation)
- [Tatsächlicher Entwicklungsstand](#tatsächlicher-entwicklungsstand)
- [Dokumentation gehört zur Änderung](#dokumentation-gehört-zur-änderung)

## StockPortfolio hängt an StockInfo

**Der Dienst liegt in einem eigenen Repository:**
`/Volumes/DevLocal/DevWeb/Production/StockInfo`. Eigener Commit-Baum, eigenes
Ticket-Board, eigene Agenteninstanzen.

Alle Markt- und Instrumentdaten stammen von dort: `/instruments`,
`/quote/{isin}`, `/quote/.../daily`, `/refresh/...` und `/health`. Ohne
erreichbaren Dienst bleibt die Oberfläche leer. Eine leere Kurstabelle ist
deshalb zuerst ein Verdacht gegen Adresse oder Dienst, nicht gegen die Rechnung.

**Braucht die App etwas vom Dienst, entsteht ein Ticket im StockInfo-Board.**
Es beschreibt Problem und Auswirkung aus Konsumentensicht, keinen fertigen
Bauauftrag — über die Lösung entscheidet, wer den Dienst kennt. Auch ein großer
Zusammenhang beginnt als ein Ticket; aufgeteilt wird er dort, wo der Zuschnitt
bekannt ist.

**Von sich aus ändert hier niemand Code in StockInfo.** Beauftragt Mike die
Änderung dort ausdrücklich, ist sie zulässig — dann gelten drüben die Regeln
von StockInfo: dessen `AGENTS.md`, dessen Board und die Rollen aus dessen
`STATUS.md`, mit eigenen Commits im dortigen Repository. Die beiden Repos
bleiben getrennt; eine Änderung am Dienst gehört nicht in einen Commit dieses
Projekts.

- **`frontend/src/api/client.ts` bündelt alle StockInfo-Aufrufe.**
  Neue StockInfo-Endpunkte kommen dort dazu, mit Typ in
  `frontend/src/api/types.ts` und Mapper in `frontend/src/api/mappers.ts`.
  Der Client bekommt `fetch` injiziert; kein Test ruft den echten Dienst.
  Die eigene Konto-API verwendet getrennt davon
  `frontend/src/auth/client.ts` und eingehende Routen unter `api/src/routers/`.

- **Die Basisadresse hat keine Rückfallebene.**
  Zur Laufzeit gilt `config.js` — im Container aus `STOCKINFO_API_URL`
  geschrieben —, sonst `VITE_STOCKINFO_API_URL` aus der lokalen `.env`
  (Vorlage: `.env.example`). Fehlt beides, wirft die App `MissingApiUrlError`
  und sagt das. Eine fest eingebaute Adresse wäre für jeden außer ihrem
  Besitzer ein Name, der nicht auflöst.

- **Unbekannte Felder werden ignoriert, nicht als Fehler behandelt.**
  Sonst bricht die nächste additive Erweiterung des Dienstes den Konsumenten.

- **Den Vertrag liefert StockInfo maschinenlesbar mit.**
  `contract/core-contract.json`, ein OpenAPI-Schnappschuss und
  `contract/fixtures/` mit echten HTTP-Antworten samt Status und Headern,
  absichtlich auch vertragswidrigen. Zur Laufzeit beantwortet `GET /fields`
  dasselbe. Damit lassen sich Mapper prüfen, ohne StockInfo zu starten.
  StockPortfolio prüft Quote-, Refresh- und Katalogantworten gemeinsam in
  `frontend/src/api/normalizers.ts` gegen Core 4.3.0. Versionierte HTTP-Fixtures liegen
  unter `frontend/tests/fixtures/stockinfo/`. Die Bewertung steht in
  [T-37](_tickets/40-done/T-37-stockinfo-quote-vertrag-und-dynamische-felder.md),
  Generation und Währung in
  [T-35](_tickets/10-backlog/T-35-stockinfo-generation-und-waehrung.md).
  T-37 ist als Bewertung abgeschlossen. T-39 normalisiert Identität und prüft
  Kurs-Pflichtfelder einschließlich Währung; eine neue Depotposition setzt
  einen erfolgreichen eindeutigen Kursabruf voraus. T-40 ergänzt `/fields`,
  persistierte Detailwerte und die dynamische Detailanzeige. Sichtbare Spalten
  liefern ihre Feldschlüssel für den Dublettenabgleich. Der
  Generationsauftrag aus T-35 bleibt im Backlog.

Lokal gegen den Dienst entwickeln — im StockInfo-Repo das Backend starten, hier
den Dev-Server:

```bash
make dev          # in StockInfo: Backend auf http://localhost:8000, Swagger unter /docs
make dev          # in StockPortfolio: Vite auf :5175 und Konto-API auf :8080
```

Die gehostete Instanz steht unter `https://stockinfo.int.mikemitterer.at`; sie
ist die Vorgabe aus `.env.example`.

[↑ Übersicht](#übersicht)

## Vor Arbeitsbeginn

**Gemeinsame Regeln kommen aus dem installierten Paket**
`${XDG_DATA_HOME:-$HOME/.local/share}/agent-workflow/current/`. Vor jedem
fachlichen Durchlauf `VERSION` prüfen; beim ersten Einstieg und nach einer
Änderung `PACKAGE.md` und `PROJECT-RULES.md` (Arbeitsfreigabe, sensible
Dateien, Ticketabschluss) lesen. Die Abschnitte dieser Datei und Mikes
Entscheidungen haben Vorrang; insbesondere gilt unten die dauerhafte Freigabe
für Merge **und Push** nach Ticketabschluss, die das Paket allein nicht
erteilt. Fehlt das Paket, das melden; keine alte Regelkopie fortschreiben.

**Coder und Verifier werden ausschließlich in
[`_tickets/STATUS.md`](_tickets/STATUS.md) zugeordnet.** `implementer`
bezeichnet den Coder, `reviewer` den unabhängigen Verifier, `owner` die Instanz
am Zug, `observer` eine eigenständige dritte Instanz. Diese Felder prüft die
eigene Instanz vor jedem Turn; `none` und `unassigned` sind inaktive Werte,
keine Instanznamen.

Nur der zuständige Coder implementiert. Wer nicht am Zug ist, verändert keinen
Produktcode. Arbeit beginnt nur am ausdrücklich aktivierten Ticket unter
`30-doing/`; Backlog, Done, Iced und Rejected erzeugen keinen Auftrag.

- [`_tickets/README.md`](_tickets/README.md) — Ablage und der Weg von der Aufnahme bis zum Abschluss.
- [`_tickets/ACTIVITY.md`](_tickets/ACTIVITY.md) — kurze Meldungen für den Nutzer, neueste oben; Agenten schreiben über den globalen `agent-activity` und lesen die Datei nicht als Kontext. Die Datei bleibt lokal und wird über `_tickets/.gitignore` nicht in Git versioniert (Mike, 2026-09-28). Pflege für alle Tickets nach dem [Workflow](_tickets/.agents/AGENT-WORKFLOW.md#aktuelle-tätigkeit).
- [`_tickets/.agents/AGENT-WORKFLOW.md`](_tickets/.agents/AGENT-WORKFLOW.md) — Rollen, Übergabe, Review, Abschluss, Observer.
- [`_tickets/.agents/AGENT-ACTIVATION.md`](_tickets/.agents/AGENT-ACTIVATION.md) — laufzeitspezifische Startwege, getrennt vom fachlichen Ablauf.
- [`CLAUDE-LESSONS.md`](_tickets/.agents/CLAUDE-LESSONS.md) und [`CODEX-LESSONS.md`](_tickets/.agents/CODEX-LESSONS.md) — der Coder liest vor Umsetzung und Übergabe seine Sammlung, der Verifier die des Autors der geprüften Fassung; bei gemischter Autorenschaft beide. Vorbeugung, Gegenproben und die Lessons-Pflege durch den Observer regelt der gemeinsame Workflow.

**Das Board hier ist der neuere Stand, nicht die Kopie aus StockInfo.**
Die Struktur wurde am 2026-09-10 von dort übernommen und seither
weiterentwickelt. Weichen die Fassungen ab, gilt die hiesige. Die Board-Regeln
von hier nicht ungefragt nach StockInfo kopieren und von dort keine Rollen,
Phasen oder Übergabefassungen übernehmen — die beiden Boards laufen getrennt.

Dateinamen und Produktnamen sind keine Rollenverteilung. Der Autor kann seine
eigene Fassung nicht unabhängig abnehmen, und eine technische Freigabe ist noch
kein Ticketabschluss.

**Abgeschlossene Tickets sofort integrieren** (Mike, 2026-09-27): Sobald
technische Freigabe und menschlicher Abschluss vorliegen, die zugehörigen
Änderungen einschließlich Ticketabschluss committen, nach `master` mergen
und zu `origin` pushen. Anschließend im Arbeitsverzeichnis wieder auf
`master` wechseln und prüfen, dass `master` der aktive Branch ist und mit
`origin/master` übereinstimmt. Mike hat diese Schritte dauerhaft autorisiert;
eine weitere Rückfrage ist nicht nötig. Fremde uncommittete Änderungen
bleiben außerhalb dieser Integration.

Lokale Lessons liegen als Einzeldateien unter `_tickets/.agents/lessons/`.
Die alten Sammeldateien sind Linkeinstiege. Verzeichnisinventar, gemeinsamer
AgentLessons-Bestand und Herkunft folgen
[Lessons lesen und pflegen](_tickets/.agents/LESSONS-ACCESS.md); die gemeinsame
Sammlung wird noch nicht automatisch aktualisiert.

[↑ Übersicht](#übersicht)

## Ein Arbeitsort: der Projekt-Root

**Alle Instanzen arbeiten ausschließlich im Projekt-Root
`/Volumes/DevLocal/DevWeb/Production/StockPortfolio`** (Mike, 2026-10-01).
Keine `git worktree add`, keine Kopien unter `/private/tmp` oder anderswo —
außer Mike ordnet es ausdrücklich an. Grund: Mike muss Board und Quellstand
jederzeit an einer Stelle sehen und von dort testen können.

- **Ein Board.** `_tickets/` gibt es nur im Root. Board-Änderungen kommen auf
  den gerade ausgecheckten Branch; es gibt keine STATUS-Kopien abzugleichen.
- **Branch im Root.** Der Ticketbranch wird im Root ausgecheckt
  (`git switch`). STATUS nennt ihn im Feld `branch`. Vor jedem Durchlauf
  prüft jede Instanz `git branch --show-current` gegen dieses Feld; bei
  Abweichung meldet sie den Konflikt und arbeitet nicht weiter.
- **Nur der Owner schaltet den Branch.** Der Verifier prüft den im Root
  ausgecheckten Übergabestand und wechselt den Branch nicht; ältere Fassungen
  liest er mit `git show` und `git diff`.
- **Früh integrieren.** Nach der technischen Freigabe wird der Ticketbranch
  sofort nach `master` gemergt und der Root auf `master` zurückgestellt.
  Mikes Abnahme findet auf `master` statt; Nacharbeit beginnt auf einem neuen
  Branch von `master`. Ketten, die nur auf Seitenbranches existieren, entstehen
  so nicht.
- **Hilfsinstanzen nur aus dem Root,** mit den dokumentierten Ports, und nach
  dem Lauf beenden. Der Teststack startet aus dem Root
  ([Bauen und prüfen](#bauen-und-prüfen)).

[↑ Übersicht](#übersicht)

## Bezeichner sind englisch. Ausnahmslos.

Funktionen, Klassen, Felder, Parameter und **auch lokale Variablen** — in
Produktivcode **wie in Tests**, in TypeScript, Vue, Bash, SCSS und
YAML-Schlüsseln. Das Namensschema je Sprache bleibt unberührt: TypeScript
`camelCase`, Bash-Variablen GROSS (`local -r _RETRY_DELAY`) — nur eben englisch.

Deutsch bleibt die Sprache der **Erklärung**: Kommentare, JSDoc, Testnamen,
`describe`/`it`-Texte und Commit-Bodies. `README.md` richtet sich an fremde
Leser und ist englisch; Tickets, `docs/` und Kommentare sind deutsch.

Steht in einer Datei beides, ist das keine gewachsene Konvention, sondern
Altlast: **Was ohnehin angefasst wird, zieht mit.**

**Die Gegenprobe ist ein Inventar, keine Textsuche.** `grep` findet nur, was man
vorher erraten hat, und `vue-tsc` prüft Typen — einen deutschen Namen sieht es
nie. Für TypeScript und Vue leistet das ein Lauf über die TS-Compiler-API, für
Bash die Liste aller Zuweisungen und Funktionsköpfe.

Vollständige Konventionen samt Namensschema je Sprache: Skill `code-standards`.

[↑ Übersicht](#übersicht)

## Wächter-Tests prüfen das Muster, nicht die Fundstelle

Fünf Tests unter `frontend/tests/` durchsuchen den gesamten `frontend/src/`-Baum statisch:

| Test | Riegel |
|---|---|
| `storageAccess.spec.ts` | Kein direkter `localStorage`-Zugriff; `safeStorage` aus dem Fundament verwenden |
| `componentStyles.spec.ts` | Kein eigenes CSS auf Naive-Komponenten — Größe über `size`, Bedeutung über `type` |
| `utilityClasses.spec.ts` | Keine Utility-Klassen im Markup und keine Utility-Selektoren im Stil; Tailwind ist ausgebaut |
| `caretUsage.spec.ts` | Kein handgezeichneter Pfeil; die gemeinsame Komponente verwenden |
| `designTokens.spec.ts` | Jede verwendete CSS-Variable ist im Fundament oder in `src/` definiert |

Sie fangen die Sorte Fehler, die nichts wirft: eine tote Klasse, eine Regel, die
still ausfällt, die vierte Kopie desselben SVG-Pfads. Einen Riegel für eine
einzelne Stelle abzuschalten oder um eine Ausnahme zu erweitern hebt genau
seinen Zweck auf — korrigiert wird die Fundstelle, nicht der Test.

Dasselbe gilt für den Datenzugriff in Tests: IndexedDB läuft über
`fake-indexeddb`, der API-Client über eine injizierte `fetch`-Implementierung.
Kein Test greift auf echten Speicher oder das Netz zu.

[↑ Übersicht](#übersicht)

## Bauen und prüfen

```bash
make dev        # Vite und Konto-API gemeinsam, Ports 5175 und 8080
make test       # Frontend- und API-Tests, einmalig
make clean      # generierte Dateien in Root, Frontend und API entfernen
make build          # Docker-Image lokal bauen (linux/amd64)
make push           # geprüftes Image veröffentlichen, danach Hub-README
```

`make hints` zeigt URLs und Setup-Schritte, `make help` alle Ziele. Das
Root-Makefile bildet nur Abläufe des Gesamtprojekts ab. Unter Entwicklung
stehen `make dev`, `make test` und `make clean`. Befehle für ein einzelnes Paket
laufen über dessen npm-Skripte.
Vor einer Übergabe laufen mindestens `make test`, `npm --prefix frontend run lint`,
`npm --prefix api run lint`, `npm --prefix frontend run typecheck` und
`npm --prefix api run typecheck`. Das Ergebnis gehört als Beleg ins Ticket.

Für reproduzierbare Browserprüfungen startet
`scripts/stockinfo-test-server.py --stack` StockInfos vorhandene Routen mit
temporären Kursen, die eigene Konto-API und Vite gemeinsam. `make setup`
erstellt dafür StockPortfolios eigene `.venv` mit Python 3.11+ und installiert
das verlinkte ProjectTools-Paket aus `requirements-dev.txt`, wenn es fehlt.
Vor dem Anlegen prüft Setup die Python-Version; bestehende `.venv` werden
wiederverwendet. **Browsertests laufen sichtbar, nicht headless** (Mike,
2026-09-30), damit der geprüfte Ablauf im Browserfenster nachvollziehbar ist.
Aus diesem Repository aufrufen:

```bash
.venv/bin/python scripts/stockinfo-test-server.py --stack --run --stockinfo-root ../StockInfo
.venv/bin/python scripts/stockinfo-test-server.py --stack --status
.venv/bin/python scripts/stockinfo-test-server.py --stack --stop
```

Die lokale `.venv` stellt `projecttools.ui.colors` für `MAKE_THEME` bereit;
`NO_COLOR` und umgeleitete Ausgabe bleiben schlicht. Der StockInfo-Kindprozess
verwendet weiterhin `<stockinfo-root>/.venv/bin/python`; `make setup` verändert
diese Umgebung nicht. `make clean` behält StockPortfolios `.venv`.

Den Live-Abgleich zwischen Browsern prüft ein sichtbarer Smoketest gegen
diesen Stack mit `--demo-accounts`:
`npm --prefix frontend run smoke:live-sync -- <Testverzeichnis>/demo-accounts.json`.
Er ordnet zwei Fenster 50:50 auf dem Hauptbildschirm an, links bleiben 80
Pixel frei, und lässt die Fenster bis Enter offen.

Der Start meldet `127.0.0.1:5175`, `:8080` und `:8899`, prüft Health,
Testkurs, CORS und die im Browser wirksame StockInfo-Adresse. Optionale
synthetische Konten entstehen mit `--demo-accounts` nur im temporären
Testverzeichnis. Ohne diese Option steht der einmalige Setup-Code im dortigen
API-Log. Stop entfernt eigene Prozesse und Testdaten; `.env`, `.local-data`,
Makefiles und StockInfo-Dateien bleiben unverändert. Die Portbelegung wird vor
dem Start geprüft, fremde Prozesse werden nicht beendet. `ps` dient zur
Identitätsprüfung und benötigt in eingeschränkten Agentenlaufzeiten die
entsprechende Freigabe; sie wird nicht umgangen. `--port PORT` ändert beim Start
nur den StockInfo-Testport; Status und Stop lesen den registrierten Port. Für
Worktrees außerhalb des gemeinsamen Elternverzeichnisses benötigen einen
absoluten Pfad für `--stockinfo-root`. Ohne `--stack` startet `--run` nur
StockInfo und muss direkt mit StockInfos `.venv/bin/python` aufgerufen werden,
weil es dessen `app` im selben Prozess importiert. Die Hilfe bleibt mit dessen
derzeitiger Umgebung schlicht. Details stehen in `README.md` (**Setup**).

[↑ Übersicht](#übersicht)

## Oberfläche und Theme kommen aus ux-foundation

`@mmit/ux-foundation` liefert Token, Themes und Bausteine wie `safeStorage`.
Das Repository liegt unter `/Volumes/DevLocal/DevWeb/Production/ux-foundation`;
`pkg-link.sh` schaltet über `.pkg-link.conf.sh` zwischen npm-Fassung und lokalem
Stand um.

**Arbeit an Themes, Token und Kontrast gehört ins Fundament, nicht hierher.**
Hier entstünden sonst lokale Kopien, die beim nächsten Update auseinanderlaufen.
[T-36](_tickets/10-backlog/T-36-eslint-waechter-aus-dem-fundament.md) wartet aus
demselben Grund auf eine installierbare Fundament-Fassung.

UX-Konventionen: Skill `ux-standards`.

[↑ Übersicht](#übersicht)

## Tatsächlicher Entwicklungsstand

StockPortfolio ist Entwicklungsstand und wird bislang nur von Mike verwendet.
Release 0.1.0 ist draußen; die Unraid-Vorlage lief nie auf einer echten Instanz,
CORS gegen die produktive API ist ungeprüft.

**Keine Migrationspfade zwischen StockPortfolio-Versionen** (Mike, 2026-09-10).
Was sich einfach übernehmen lässt, wird übernommen; der Rest darf neu angelegt
werden. Keine Kompatibilitätsschichten oder aufwendige Datenüberführung allein
zum Erhalten alter Entwicklungsstände. Persistenter Browserzustand darf zur
Vereinfachung neuer Entwicklungen zurückgesetzt werden; neben localStorage
liegt der besitzerlose Altbestand noch in IndexedDB; neue private Depotdaten
liegen in der SQLite-Datenbank der Konto-API. Ein erforderlicher Reset wird als
solcher beschrieben, statt eine verlustfreie Migration zu behaupten.

Keine Zusatzarbeit für hypothetische Verbreitung. Aktuelle
Dokumentation beschreibt den gültigen Stand direkt; verworfene
Entwicklungsregeln brauchen keine Übergangshinweise. Prüfaufwand und
Befundgewicht folgen dem belegten Schaden. Diese Einordnung gilt, bis Mike einen
anderen Betriebsstand festlegt.

[↑ Übersicht](#übersicht)

## Dokumentation gehört zur Änderung

**Schreibe für normale Programmierer, ohne Vorwissen über dieses Projekt.**
Der Leser soll schnell erkennen, was etwas macht, wie er es benutzt und welche
Grenzen gelten.

**Docker-Hub-Beschreibung:** `docker/README.md` ist die eigene englische
Container-Anleitung für Docker Hub. Direkt nach der Kurzbeschreibung steht
ein gut sichtbarer Link zum GitHub-Repository. Sie erklärt Start,
Konfiguration, Browser-Daten, Backups und Updates; Entwicklungsdetails stehen
im Projekt-README.
Nach erfolgreichem Image-Push überträgt der gemeinsame ProjectTools-Helfer
`docker/README.md`. Die konvertierte Fassung darf höchstens **25.000
UTF-8-Bytes** enthalten; absolute Bild- und Dokumentlinks zählen mit.
Nach Änderungen an dieser Datei die echte Vorschau prüfen:
`./.libs/ProjectTools/src/bash/dockerhub-readme.sh --readme docker/README.md --preview --ref master --output docker/logs/dockerhub-readme.md`.
Das Werkzeug bricht bei Überschreitung ab, ohne abzuschneiden. Die Grenze
gilt für die Hub-Beschreibung, nicht für das Projekt-README.
`DOCKER_README_REF` muss einen bereits veröffentlichten GitHub-Stand nennen.
Keine lokale Kopie des Helfers und kein separates README-Push-Target anlegen.

- Kurze, direkte Sätze und geläufige Wörter. Keine KI-Floskeln, Werbesprache
  oder erfundenen Fachbegriffe.
- Fachbegriffe nur, wenn sie nötig sind, und beim ersten Auftreten kurz erklärt.
  Ein kleines Beispiel hilft oft mehr als eine abstrakte Erklärung.
- Die wichtigste Information zuerst. Details stehen beim jeweiligen Thema;
  Schritte als nummerierte Liste, Vergleiche bei Bedarf als Tabelle.
- Anleitungen beschreiben die Benutzung und das aktuelle Verhalten. Interne
  Arbeitsabläufe und Review-Geschichte gehören in die Tickets.

Änderungen an Board- oder Lessons-Konventionen werden im selben Auftrag im
Skill `task-verification-workflow` samt Referenzen und Vorlagen nachgezogen.
Der Doku-Abgleich nennt das Ergebnis, auch wenn dort keine Änderung nötig ist.
Der Skill beschreibt Verfahren und Format; er erhält keine zweite Wissenskopie.

Bei Änderungen an Verhalten, Verträgen, Konfiguration, Installation oder
beschlossenem Umfang gehört der **Doku-Abgleich zum selben Auftrag**. Mike muss
betroffene Anleitungen nicht eigens nennen. Betroffen sind hier vor allem
`README.md` als Projektanleitung, `docker/README.md` als Container-Anleitung,
die Dateien unter `docs/`, die Unraid-Anleitung unter `unraid/` und die zentrale
Vorlage `/Volumes/DevLocal/DevUnraid/Production/Templates/templates/stockportfolio.xml`.

**Beide READMEs gemeinsam prüfen:** Bei Änderungen an Funktionen,
Konfiguration, Installation oder Betrieb immer `README.md` und
`docker/README.md` abgleichen. Das gilt sowohl für Codeänderungen als auch
für Änderungen an einer der beiden Anleitungen. Gemeinsame Aussagen müssen
übereinstimmen; Entwickleranleitungen gehören ins Projekt-README,
Containeranleitungen in `docker/README.md`.
Der Doku-Abgleich im Ticket beziehungsweise Abschlussbericht nennt die
nötigen Anpassungen oder begründet, weshalb die andere Datei unverändert
bleibt. Der Verifier prüft die inhaltliche Übereinstimmung; Änderungen an
beiden Dateien allein sind kein Nachweis.

Der Bearbeiter ermittelt die betroffenen Dokumente über ein Datei- und
Überschrifteninventar und verfolgt die geänderten Zusagen gezielt durch sie
hindurch. Geplantes wird ausdrücklich als noch nicht verfügbar gekennzeichnet;
bei Umsetzung entfällt diese Markierung.

Im Ticket beziehungsweise Abschlussbericht steht knapp: **Doku-Abgleich:**
betroffene Dateien und Abschnitte samt Ergebnis. Ist keine Anpassung nötig, wird
der Grund genannt. Der Verifier prüft die Zuordnung und die Aussagen gegen die
geprüfte Fassung; ein grüner Testlauf ersetzt diesen Inhaltsabgleich nicht.

[↑ Übersicht](#übersicht)
