# StockPortfolio — Projektregeln

**Diese Datei ist die einzige Regelquelle des Projekts.** Sie gilt für jede
Instanz und jede Laufzeit. `AGENTS.md` ist der übliche projektweite Einstieg;
`CLAUDE.md` verweist nur hierher und enthält keine eigenen Regeln. Eine zweite
Regelkopie liefe beim ersten Nachtrag auseinander.

StockPortfolio ist eine Vue-3-App **ohne eigenes Backend**. Kurse, Instrumente
und Historie kommen vollständig aus StockInfo. Wer das übersieht, sucht Fehler
im falschen Repository.

## Übersicht

- [StockPortfolio hängt an StockInfo](#stockportfolio-hängt-an-stockinfo)
- [Vor Arbeitsbeginn](#vor-arbeitsbeginn)
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

Alles, was die App anzeigt und rechnet, stammt von dort: `/instruments`,
`/quote/{isin}`, `/quote/.../daily`, `/refresh/...` und `/health`. Ohne
erreichbaren Dienst bleibt die Oberfläche leer. Eine leere Kurstabelle ist
deshalb zuerst ein Verdacht gegen Adresse oder Dienst, nicht gegen die Rechnung.

**Braucht die App etwas vom Dienst, entsteht der Regelweg als Ticket im
StockInfo-Board.** Beschrieben wird das Problem aus Konsumentensicht samt
Auswirkung; über die Lösung entscheidet, wer den Dienst kennt. Für einen
größeren Zusammenhang eignet sich ein Anfragedokument wie
[`docs/stockinfo-currency-request.md`](docs/stockinfo-currency-request.md).
Beides ist eine Beschreibung, kein fertiger Bauauftrag.

**Von sich aus ändert hier niemand Code in StockInfo.** Beauftragt Mike die
Änderung dort ausdrücklich, ist sie zulässig — dann gelten drüben die Regeln
von StockInfo: dessen `AGENTS.md`, dessen Board und die Rollen aus dessen
`STATUS.md`, mit eigenen Commits im dortigen Repository. Die beiden Repos
bleiben getrennt; eine Änderung am Dienst gehört nicht in einen Commit dieses
Projekts.

- **`src/api/client.ts` ist die einzige Stelle mit `fetch`.**  
  Neue Endpunkte kommen dort dazu, mit Typ in `src/api/types.ts` und Mapper in
  `src/api/mappers.ts`. Der Client bekommt `fetch` injiziert; kein Test ruft
  den echten Dienst.

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
  StockPortfolio nutzt das bisher **nicht**; die Bewertung steht in
  [T-37](_tickets/10-backlog/T-37-stockinfo-quote-vertrag-und-dynamische-felder.md),
  Generation und Währung in
  [T-35](_tickets/10-backlog/T-35-stockinfo-generation-und-waehrung.md).
  Beide sind nicht zur Umsetzung eingeplant.

Lokal gegen den Dienst entwickeln — im StockInfo-Repo das Backend starten, hier
den Dev-Server:

```bash
make dev          # in StockInfo: Backend auf http://localhost:8000, Swagger unter /docs
make dev          # in StockPortfolio: Vite auf http://localhost:5175
```

Die gehostete Instanz steht unter `https://stockinfo.int.mikemitterer.at`; sie
ist die Vorgabe aus `.env.example`.

[↑ Übersicht](#übersicht)

## Vor Arbeitsbeginn

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
- [`_tickets/.agents/AGENT-WORKFLOW.md`](_tickets/.agents/AGENT-WORKFLOW.md) — Rollen, Übergabe, Review, Abschluss, Observer.
- [`_tickets/.agents/AGENT-ACTIVATION.md`](_tickets/.agents/AGENT-ACTIVATION.md) — laufzeitspezifische Startwege, getrennt vom fachlichen Ablauf.
- [`CLAUDE-LESSONS.md`](_tickets/.agents/CLAUDE-LESSONS.md) und [`CODEX-LESSONS.md`](_tickets/.agents/CODEX-LESSONS.md) — der Coder liest vor der Übergabe seine Sammlung, der Verifier die des Autors der geprüften Fassung; bei gemischter Autorenschaft beide.

**Das Board hier ist der neuere Stand, nicht die Kopie aus StockInfo.**
Die Struktur wurde am 2026-09-10 von dort übernommen und seither
weiterentwickelt. Weichen die Fassungen ab, gilt die hiesige. Die Board-Regeln
von hier nicht ungefragt nach StockInfo kopieren und von dort keine Rollen,
Phasen oder Übergabefassungen übernehmen — die beiden Boards laufen getrennt.

Dateinamen und Produktnamen sind keine Rollenverteilung. Der Autor kann seine
eigene Fassung nicht unabhängig abnehmen, und eine technische Freigabe ist noch
kein Ticketabschluss.

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

Vier Tests unter `tests/` durchsuchen den gesamten `src/`-Baum statisch:

| Test | Riegel |
|---|---|
| `storageAccess.spec.ts` | Kein direkter `localStorage`-Zugriff; `safeStorage` aus dem Fundament verwenden |
| `componentStyles.spec.ts` | Kein eigenes CSS auf Naive-Komponenten — Größe über `size`, Bedeutung über `type` |
| `utilityClasses.spec.ts` | Keine Utility-Klassen im Markup und keine Utility-Selektoren im Stil; Tailwind ist ausgebaut |
| `caretUsage.spec.ts` | Kein handgezeichneter Pfeil; die gemeinsame Komponente verwenden |

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
make dev        # Vite-Dev-Server, Port 5175
make test       # Vitest, einmalig
make lint       # ESLint über src/ und tests/
make typecheck  # vue-tsc --noEmit
make build      # typecheck + Production-Build nach dist/
```

`make hints` zeigt URLs und Setup-Schritte, `make help` alle Ziele. Vor einer
Übergabe laufen mindestens `make test`, `make lint` und `make typecheck`; das
Ergebnis gehört als Beleg ins Ticket.

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

Migrationspfade, Kompatibilität und Ablösungshinweise brauchen konkreten Bedarf
aus tatsächlich genutzten Daten, Installationen oder ausdrücklich benannten
Verbrauchern. Keine Zusatzarbeit für hypothetische Verbreitung. Aktuelle
Dokumentation beschreibt den gültigen Stand direkt; verworfene
Entwicklungsregeln brauchen keine Übergangshinweise. Prüfaufwand und
Befundgewicht folgen dem belegten Schaden. Diese Einordnung gilt, bis Mike einen
anderen Betriebsstand festlegt.

[↑ Übersicht](#übersicht)

## Dokumentation gehört zur Änderung

**Schreibe für normale Programmierer, ohne Vorwissen über dieses Projekt.**
Der Leser soll schnell erkennen, was etwas macht, wie er es benutzt und welche
Grenzen gelten.

- Kurze, direkte Sätze und geläufige Wörter. Keine KI-Floskeln, Werbesprache
  oder erfundenen Fachbegriffe.
- Fachbegriffe nur, wenn sie nötig sind, und beim ersten Auftreten kurz erklärt.
  Ein kleines Beispiel hilft oft mehr als eine abstrakte Erklärung.
- Die wichtigste Information zuerst. Details stehen beim jeweiligen Thema;
  Schritte als nummerierte Liste, Vergleiche bei Bedarf als Tabelle.
- Anleitungen beschreiben die Benutzung und das aktuelle Verhalten. Interne
  Arbeitsabläufe und Review-Geschichte gehören in die Tickets.

Bei Änderungen an Verhalten, Verträgen, Konfiguration, Installation oder
beschlossenem Umfang gehört der **Doku-Abgleich zum selben Auftrag**. Mike muss
betroffene Anleitungen nicht eigens nennen. Betroffen sind hier vor allem
`README.md` als Benutzersicht, die Dateien unter `docs/` und die Unraid-Vorlage
unter `unraid/`.

Der Bearbeiter ermittelt die betroffenen Dokumente über ein Datei- und
Überschrifteninventar und verfolgt die geänderten Zusagen gezielt durch sie
hindurch. Geplantes wird ausdrücklich als noch nicht verfügbar gekennzeichnet;
bei Umsetzung entfällt diese Markierung.

Im Ticket beziehungsweise Abschlussbericht steht knapp: **Doku-Abgleich:**
betroffene Dateien und Abschnitte samt Ergebnis. Ist keine Anpassung nötig, wird
der Grund genannt. Der Verifier prüft die Zuordnung und die Aussagen gegen die
geprüfte Fassung; ein grüner Testlauf ersetzt diesen Inhaltsabgleich nicht.

[↑ Übersicht](#übersicht)
