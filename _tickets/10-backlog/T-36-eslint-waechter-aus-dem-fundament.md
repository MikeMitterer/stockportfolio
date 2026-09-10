# T-36 · ESLint-Wächter aus dem Fundament einbinden

| Repo | Status | Time-box | Scope | GH-Issue |
|---|---|---|---|---|
| StockPortfolio | blocked | ~1 h | ESLint-Konfiguration + Entfernung des alten Wächter-Tests | — |

**Löst:** `tests/storageAccess.spec.ts` baut mit Dateibaumsuche, Kommentarfilter
und Regex einen eigenen kleinen Linter. Die Fassung übersieht unter anderem
den bloßen Zugriff auf `window.localStorage`, Klammernotation, Destrukturierung,
statische `Reflect`-/`Object`-Zugriffe und Vue-Template-Ausdrücke. Sobald
ux-foundation T-19 den gemeinsamen ESLint-Wächter liefert, wird diese Kopie
durch die zentrale Mechanik ersetzt.

**Hängt ab von:** `ux-foundation/_tickets/T-19-waechter-gehoert-ins-fundament.md`
ist von Codex freigegeben, nach `solved/` verschoben und in einer installierbaren
Paketfassung verfügbar. Bis dahin bleibt dieses Ticket `blocked`.

**Geprüfte Referenz:** StockInfos `_tickets/`-Board ist die Vorlage für
Ticketaufbau und Verify-Handoff. Seine technische Speicherprüfung ist dagegen
noch **nicht** die Zielumsetzung: `dashboard/tests/storageAccess.spec.ts` nutzt
denselben einfachen Regex wie dieses Repo und hat keine ESLint-Integration.
StockInfo braucht dafür später ein eigenes Folgeticket.

---

## Scope-Vertrag

- **Ergebnis:** `npm run lint` verhindert direkten Speicherzugriff im
  Produktcode über die aus ux-foundation importierte ESLint-Mechanik.
- **Fachliche Änderungen:** gemeinsame Regel aktivieren; auf `src/` begrenzen;
  den lokalen Regex-Wächter entfernen.
- **Produktflächen/-dateien:** `eslint.config.js`, `package.json` und
  `package-lock.json` nur soweit der neue Paket-Einstiegspunkt es erfordert.
- **Tests/Dokumentation:** `tests/storageAccess.spec.ts` entfällt;
  Integrations- und Mutationsbelege stehen in diesem Ticket.
- **Nicht-Ziele:** keine neue ESLint-Regel in diesem Repo; keine Änderung an
  `safeStorage`; keine Produktfunktion; keine gleichzeitige Migration von
  StockInfo.
- **Budget:** eine Konfigurationsdatei, zwei Manifest-/Lockdateien, eine
  entfernte Testdatei; deutlich unter 150 Diff-Zeilen.

---

## Verify

Legende: ✅ live bestätigt · ⚠️ bestätigt mit Einschränkung ·
◑ teilweise · ➖ keine Live-Verifikation.
`AI` = nur KI · `Human` = nur Mensch (nie überschreiben).

| # | Where | Look for | AI | Human |
|---|---|---|:--:|---|
| 1 | `eslint.config.js` | Regel/Flat-Config kommt aus dem **veröffentlichten** Einstiegspunkt von `@mmit/ux-foundation`; keine kopierte AST- oder Regex-Logik | | |
| 2 | `tests/storageAccess.spec.ts` | Datei ist entfernt; `rg` findet im Repo keine zweite Implementierung des Wächters | | |
| 3 | temporäre `.ts`-Datei unter `src/` mit `window.localStorage` | `npx eslint <datei>` ist rot und nennt Datei, Zeile und gemeinsame Rule-ID | | |
| 4 | temporäre `.vue`-Datei unter `src/` mit `$event.view['localStorage']` im Template | ebenfalls rot — der Template-Pfad ist wirklich integriert | | |
| 5 | temporäre `.ts`-Datei mit `Reflect.deleteProperty(window, 'localStorage')` | ebenfalls rot — nicht nur die aus T-18 bekannten Formen sind abgedeckt | | |
| 6 | Gegenprobe mit lokalem Parameter `localStorage`, Type-Member `localStorage` und `{ localStorage: false }` | bleibt grün; lokale Bindings, Typcode und Eigenschaftsdefinitionen sind keine Globalzugriffe | | |
| 7 | bestehende Tests mit absichtlichem `window.localStorage` | bleiben zulässig; die Produktregel gilt für `src/`, nicht für Testaufbau und Fixtures | | |
| 8 | `npm run typecheck` · `npm run lint` · `npm run test` · `npm run build` | alle vier einzeln grün, Exit-Codes dokumentiert | | |
| 9 | Paket-/Lockdatei nach Installation der T-19-Fassung | synchron; der ESLint-Einstiegspunkt zieht weder `typescript` noch `@vue/compiler-sfc` als neue Paket-Peers herein | | |

### Kurz-Testblock

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

Für #3 bis #6 jeweils eine kleine Datei unter `src/` anlegen, nur diese Datei
mit `npx eslint <datei>` prüfen und sie danach wieder entfernen. Vor dem Handoff
ist mit `git status --short` zu belegen, dass kein Mutant liegen geblieben ist.

---

## Details

### Warum der bestehende Test nicht genügt

Der aktuelle Ausdruck lautet:

```ts
/localStorage\s*\??\.\s*(getItem|setItem|removeItem|clear|key)/
```

Er erkennt nur eine kleine Gruppe von Methodenaufrufen. Diese direkten Zugriffe
bleiben grün:

```ts
const storage = window.localStorage
const stored = window['localStorage']
const { localStorage } = window
const count = localStorage.length
Reflect.deleteProperty(window, 'localStorage')
```

Der zeilenweise Kommentarfilter ist ebenfalls keine Syntaxanalyse: Code
zwischen Zeichenketten, die wie Kommentarmarken aussehen, kann verschwinden;
harmlose Wörter können umgekehrt als Code wirken. Diese Fehlerklasse wurde in
ux-foundation T-18 mit Mutanten nachgewiesen.

### Zielbild der Integration

T-19 liefert keine Dateibaumsuche, sondern eine ESLint-Integration unter einem
getrennten Paket-Einstiegspunkt. Der genaue Importname richtet sich nach dem
freigegebenen T-19-Vertrag; vor dessen Abschluss wird hier keine vorläufige API
festgeschrieben.

Die Aufteilung bleibt:

| Ort | Verantwortung |
|---|---|
| ux-foundation | generische ESLint-Mechanik, Scope-Auswertung, Vue-Template-Anbindung und Regeltests |
| StockPortfolio `eslint.config.js` | Aktivierung für `localStorage` und Geltungsbereich `src/` |
| Skill `ux-standards` | Begründung der Speicherregel |

StockPortfolio hat keinen eigenen erlaubten Speicheradapter unter `src/`:
Theme, Locale und Ansichten verwenden `safeStorage` aus
`@mmit/ux-foundation`. Eine Datei-Ausnahme ist hier daher nicht vorgesehen.

### Warum ESLint statt eines weiteren Tests

ESLint wählt die konfigurierten JS-/TS-/Vue-Dateien aus, kennt Bindings und
Typkontexte und liefert strukturierte Diagnosen. Der Vue-Parser ist bereits Teil
der App-Konfiguration. Der gemeinsame Baustein muss deshalb weder selbst durch
Verzeichnisse laufen noch TypeScript und den SFC-Compiler laden.

### Side-Effects

- Die Prüfung wandert von `npm run test` nach `npm run lint`. Beide bleiben im
  Abschlussblock Pflicht; der Schutz wird nicht schwächer, nur am passenden Ort
  ausgeführt.
- Die Zahl der Vitest-Fälle sinkt durch das Entfernen der zwei lokalen
  Wächter-Tests. Das ist erwartete Entdopplung, kein Verlust an Abdeckung: Die
  Regelsemantik lebt in ux-foundation, die Integration wird hier per Mutant
  belegt.
- App-Code und Runtime-Bundle ändern sich nicht. Die Regel läuft nur im
  Entwicklungs-/CI-Werkzeug ESLint.
- Bestehende direkte Speicherzugriffe in Tests bleiben erlaubt, weil sie den
  Browserzustand für Testfälle vorbereiten.

### Auflösung

Wird nach der Umsetzung gefüllt: verwendete ux-foundation-Fassung,
Konfigurations- und Lockdatei-Commit, Mutationsbelege sowie die vier Exit-Codes.
