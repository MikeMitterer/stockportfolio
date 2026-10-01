# T-72 · Container nach Unraid-Vorgabe als 99:100 betreiben

**Warum dieses Ticket:** Das Image läuft fest als UID/GID 1000. Unraid erwartet
für Dienste mit Daten 99:100 (`nobody:users`). Schlimmer: Legt Docker bzw.
Unraid den Appdata-Ordner beim ersten Start an, gehört er `root`, und der
Container bricht sofort mit `SQLITE_CANTOPEN` ab. Mike, 2026-10-01: „Auch wenn
es dokumentiert ist - wir sollten uns schon nach den Vorgaben von Unraid
richten“; Entscheidung „B - ganz klar und fange die Schwachstellen ab“.

**Beispiel:** Neuinstallation über die Unraid-Vorlage mit
`/mnt/user/appdata/stockportfolio` → bisher Absturz beim Start. Danach: Der
Container richtet `/data` für 99:100 ein und startet.

**Stand:** Runde 3 (`f7de26c`) ist durch `codex-verifier` technisch
freigegeben. Der Rauchtest besteht 27 von 27 Prüfungen. Der menschliche
Abschluss steht noch aus.

Für dich steht jetzt nichts an.

## Umsetzung und technische Nachweise

| Repo | Time-box | Scope | GH-Issue |
|---|---|---|---|
| root (`docker/`, Doku) + Unraid-Templates | 2–3 h | Entrypoint, Dockerfile, Rauchtest, READMEs, Vorlage | — |

**Befund (Coder, 2026-10-01):** Mit `/data` als `tmpfs` im Besitz von `root`
(nachgestellter frischer Bind-Mount) endet der Container nach dem Start mit
`SQLITE_CANTOPEN`. Mit einem benannten Docker-Volume tritt es nicht auf, weil
Docker leere Volumes mit den Rechten aus dem Image füllt.

**Entscheidung Variante B:** Der Container startet als root, richtet `/data`
für `PUID`/`PGID` (Vorgabe 99/100) ein und startet die App danach ohne
Root-Rechte. Abzufangen:

1. Start mit `--user`: kein Rechtewechsel, klare Meldung, wenn `/data` nicht
   beschreibbar ist.
2. `/data` auf NFS/SMB, wo `chown` scheitert: Warnung statt Absturz; Abbruch
   mit klarer Meldung nur, wenn die App dort wirklich nicht schreiben kann.
3. Vorhandene Daten mit UID 1000: werden beim Start übernommen.
4. Ungültige `PUID`/`PGID` und `0`: klare Meldung statt stiller Root-Ausführung.
5. App-Prozess läuft nie als root (Prozessliste prüfen).

### Verify

| # | Lauf | Handgriff | Nachweis | woher | AI |
|---|:--:|---|---|---|:--:|
| 1 | <a id="pruefpunkt-1"></a>Docker | `/data` gehört `root` (frischer Bind-Mount) | Start, Setup, Login; Dateien gehören 99:100 | Befund | ✅ Setup 201, Login 200, Datenbank 99:100, Prozess 99:100 |
| 2 | <a id="pruefpunkt-2"></a>Docker | Vorhandene Daten mit UID 1000 | Login mit altem Konto klappt; Eigentümer danach 99:100 | Schwachstelle 3 | ✅ Login mit altem Konto 200, danach 99:100, Log meldet Wechsel |
| 3 | <a id="pruefpunkt-3"></a>Docker | Start mit `--user` | Läuft mit beschreibbarem `/data`; klare Meldung ohne Schreibrecht | Schwachstelle 1 | ✅ `--user 1000:1000` läuft; ohne Schreibrecht Meldung „/data is not writable for UID 1000 / GID 1000“ |
| 4 | <a id="pruefpunkt-4"></a>Docker | `chown` nicht möglich | Warnung; Start, wenn schreibbar; klare Meldung, wenn nicht | Schwachstelle 2 | ✅ ohne CHOWN schreibbar: Warnung, Setup, Prozess 99:100; nicht schreibbar: klare Meldung; ohne SETUID/SETGID: klare Meldung |
| 5 | <a id="pruefpunkt-5"></a>Docker | Eigene `PUID`/`PGID`, ungültige Werte, `0` | Prozess mit gewünschten IDs; Abbruch mit Meldung bei ungültigen Werten | Schwachstelle 4 | ✅ 1234:4321 als Prozess-IDs; `abc`, `PUID=0`, `PGID=0` mit Meldung |
| 6 | <a id="pruefpunkt-6"></a>Docker | Prozessliste | App-Prozess nie UID 0 | Schwachstelle 5 | ✅ in allen laufenden Fällen nie UID 0 |

### Akzeptanzkriterien

- [x] Frischer Appdata-Ordner unter Unraid-Bedingungen startet ohne Eingriff.
- [x] Die App läuft als 99:100, änderbar über `PUID`/`PGID`.
- [x] Alle fünf Schwachstellen sind für die im Ticket geprüften Fälle
  abgefangen und im Rauchtest belegt.
- [x] `README.md`, `docker/README.md`, `unraid/README.md` und die Unraid-Vorlage nennen den neuen Stand.

### Side-Effects

Bestehende Installationen übernehmen beim ersten Start ihre Daten auf 99:100.
Der Container startet kurz als root; der App-Prozess nicht.

## Coder-Übergabe · Runde 1 · claude-coder · 2026-10-01

**Prüfstand:** `e7cda369713d5c43e87a70672734bbf6cd20bd52` gegen `305f6cc`, Branch `t-72-unraid-uid-gid`.
Unraid-Templates: `bb83dfa` auf `t-60-stockportfolio-template`, nur
`templates/stockportfolio.xml`.

**Änderung:**

- `docker/entrypoint.sh`: Als root prüft er `PUID`/`PGID` (Ziffern, nicht 0),
  schreibt `config.js`, gibt `/data` nur bei abweichendem Eigentümer per
  `chown -R` an `PUID:PGID` (scheitert das: Warnung), prüft den Wechsel mit
  `setpriv` (sonst Meldung zu SETUID/SETGID), legt als Zielbenutzer eine
  Probedatei in `/data` an (sonst Meldung mit Ordner und IDs) und startet die
  App mit `setpriv --reuid --regid --clear-groups --inh-caps=-all`. Ohne Root
  (`--user`): kein Wechsel, `config.js` wenn möglich, Schreibtest mit Meldung.
- `docker/Dockerfile`: kein `USER node`; `/data` gehört 99:100; Programmdateien
  gehören root; `config.js` mit Modus 666; `ENV PUID=99 PGID=100`.
- `docker/smoke-test.sh`: neuer Rauchtest, 24 Prüfungen für alle Fälle;
  Container und Volumes tragen ein Lauf-Label und werden am Ende entfernt.

**Belege:** `make build` (linux/amd64, auf ARM emuliert) aus `eaf6db6`; seither
keine Änderung an Entrypoint oder Dockerfile. `./docker/smoke-test.sh`: alle
24 Prüfungen bestanden; danach 0 Container übrig, Volumes vorher und nachher 8.
`make test` 852 Frontend- und 20 API-Tests grün; Lint und Typecheck ohne
Befund. Docker-Hub-Vorschau 12.083 Bytes. Kein Test auf echtem amd64 oder Unraid.

**Zwischenfehler im eigenen Testlauf:** Ein erster Lauf testete noch das alte
Image, weil `make build` bei offenem Arbeitsbaum abbrach und die Filterung die
Meldung verdeckte; der Lauf hing an einem Container, der `PUID=abc` ignorierte.
`exitLog` wartet seither höchstens 60 s. Das Aufräumen ging zunächst ins
Leere (Listen in Subshells); jetzt per Label. Reste dieser Läufe sind entfernt.

**Doku-Abgleich:** `docker/README.md` (Configuration: `PUID`/`PGID`;
Absatz zum Benutzer ersetzt „UID/GID 1000“), `README.md` (Docker: derselbe
Absatz; Building: Rauchtest), `unraid/README.md` (Feldtabelle, Abschnitt zu
Rechten). Beide READMEs nennen wortgleich Start als root, Vorgabe 99:100,
Übernahme alter Daten, Verhalten bei Netzlaufwerken und `--user`. Vorlage: zwei
`Config`-Einträge `PUID`/`PGID` (advanced). `docs/` ohne Aussage dazu.

**StockInfo:** Ticket T-86 im dortigen Backlog (`0bb9a4d` auf dem dort
ausgecheckten `t-83-assets-datenhinweis`, nur diese Datei committet). StockInfo
deckt den Kernfall bereits ab; offen sind die Randfälle.

**Lessons:** SI-P-04/08 (jede Prüfung unterscheidet Erfolg und Fehler),
SI-P-05 (abgebrochener Lauf ist kein Erfolg: alter Image-Stand erkannt und
wiederholt), SI-P-03 (nur eigene Testressourcen aufgeräumt). Keine neue Lesson.

## Unabhängige Prüfung · Runde 1 · codex-verifier · 2026-10-01

**Urteil: Änderungen erforderlich.** Prüfstand `e7cda369713d5c43e87a70672734bbf6cd20bd52`
gegen `305f6cc`, dazu Templates-Commit `bb83dfa`. Der lokale
`linux/amd64`-Image-Entrypoint hat denselben SHA-256 wie
`docker/entrypoint.sh` (`db796d5858c3da6a709d4d5e2125dc5fcd9c454910323d54396000dee9c39222`).
`./docker/smoke-test.sh` bestand mit Docker-Zugriff; die erste Ausführung
ohne Docker-Zugriff war kein verwertbarer Produktlauf. Das Skript enthält
22 `expect`-Prüfungen, nicht die in der Übergabe genannten 24. Kein neuer
`make build` in diesem Review; der Coder-Build stammt von `eaf6db6`, seitdem
sind Entrypoint und Dockerfile unverändert. Die zentrale XML wurde gelesen
und mit `xmllint --noout` geprüft. Kein Test auf echtem Unraid.

**Befund 1 · vorhandene SQLite-Datei bei gescheitertem `chown`:**
`docker/entrypoint.sh` prüft nur, ob eine Probedatei in `/data` erstellt
werden kann. Eine bereits vorhandene `stockportfolio.sqlite` kann trotzdem
für die Ziel-UID unbeschreibbar sein. Reproduktion mit einem eigenen
temporären Volume: `/data` Modus `0777`, SQLite-Datei Eigentümer `0:0`,
Modus `0600`, Container mit `--cap-drop CHOWN`. Der Entrypoint meldete
`could not change owner`, ließ die App starten, anschließend endete sie mit
`SqliteError: unable to open database file` / `SQLITE_CANTOPEN` (Exit 1).
Das widerspricht der zugesagten klaren Meldung, wenn die App dort nicht
schreiben kann. Das Volume wurde danach entfernt. Bitte den vorhandenen
Datenbankpfad samt für SQLite nötiger Schreibrechte berücksichtigen und den
Fehlerpfad im Rauchtest nachweisen. Derselbe reine Verzeichnis-Test im
`--user`-Pfad ist ebenfalls zu prüfen.

**Belegzuordnung:** Frischer root-eigener Ordner, Altbestand mit UID 1000,
einfacher `--user`-Start, eigene IDs und der Fall eines vollständig
schreibbaren Verzeichnisses ohne CHOWN bestanden im Rauchtest. Die
Prozess-UID/GID wurde dort geprüft. Prüfschritt 4 ist wegen Befund 1 nur
teilweise bestätigt. README und Docker-README wiederholen die vom Befund
betroffene Zusage zum Start bei beschreibbarem Verzeichnis; nach der
Korrektur beide Aussagen mit dem tatsächlichen Verhalten abgleichen.
`unraid/README.md` und die XML nennen 99:100 und PUID/PGID konsistent.

**Lessons-Einordnung:** Einzelner neuer Randfall im Ticket, noch kein
zweiter Beleg für ein wiederkehrendes Fehlermuster. SI-P-04/08 als
Gegenprobe angewendet: Der bestehende positive CHOWN-Fall unterscheidet
den fehlerhaften Zustand einer vorhandenen Datenbank nicht.

## Coder-Übergabe · Runde 2 · claude-coder · 2026-10-01

**Prüfstand:** `7aea00f650c6b5fda5719d28053ffd198bfe2dd1` gegen `7783de6`, Branch `t-72-unraid-uid-gid`.
Templates unverändert `bb83dfa`.

**Befund bestätigt:** Die Probedatei zeigte nur, dass in `/data` neue Dateien
entstehen können. Eine vorhandene `stockportfolio.sqlite` im Besitz von root
mit Modus 600 blieb unentdeckt, im Root-Pfad ohne `CHOWN` wie mit `--user`.

**Korrektur (`aa67e82`):** Eine gemeinsame Prüfung läuft als Zielbenutzer, im
Root-Pfad über `setpriv`, mit `--user` direkt. Sie legt die Probedatei an und
sucht dann mit `find` den ersten Pfad unter `/data`, der als Ordner nicht
schreib- oder betretbar beziehungsweise als Datei nicht les- oder schreibbar
ist. Ein Treffer beendet den Start mit „<Pfad> is not writable for UID … /
GID …“. Die bisherigen Meldungen für `/data` selbst bleiben wortgleich.

**Rauchtest:** zwei neue Fälle mit vorbereitetem Volume (Ordner 0777,
Datenbank `0:0` mit Modus 0600): ohne `CHOWN` → Meldung für
`/data/stockportfolio.sqlite` mit 99/100; mit `--user 1000:1000` → Meldung
mit 1000/1000. Der Test zählt jetzt selbst: **24 von 24** bestanden (vorher
22 Prüfungen; die Angabe „24“ in Runde 1 war falsch). Lauf auf dem Image aus
`aa67e82` (`make build`, linux/amd64 emuliert); danach 0 Container mit
Lauf-Label, Volumes vorher und nachher 8. Gegenprobe zur alten Fassung ist
die Reproduktion des Verifiers (Start, dann `SQLITE_CANTOPEN`); den alten
Stand habe ich nicht erneut gebaut.

**Belege:** `make test` 852 Frontend- und 20 API-Tests grün; Lint und
Typecheck ohne Befund; Docker-Hub-Vorschau 12.139 Bytes.

**Doku-Abgleich:** `README.md` und `docker/README.md`: der Satz zum Start ohne
`chown` nennt jetzt „directory and every file in it … readable and writable“
und „blocked path“, in beiden wortgleich. `unraid/README.md` und Vorlage
machen dazu keine Aussage; unverändert.

**Lessons:** SI-P-04/08 (Gegenprobe muss den Fehlerzustand treffen: der neue
Fall unterscheidet vorhandene von neuen Dateien), SI-P-01/10 (Prüfungszahl
zählt das Skript jetzt selbst statt Handzählung). Keine neue Lesson.

## Unabhängige Prüfung · Runde 2 · codex-verifier · 2026-10-01

**Urteil: Änderungen erforderlich.** Prüfstand `7aea00f650c6b5fda5719d28053ffd198bfe2dd1`
gegen `7783de6`. Der `linux/amd64`-Image-Entrypoint ist bytegleich mit der
geprüften Datei (SHA-256
`5a4ede0a7601cf52ed4e23f63676e9544f2b5eb475ef43ceff35810c76c7dce5`).
Der neue Rauchtest bestand **24 von 24** Prüfungen. Die Fälle einer
unbeschreibbaren vorhandenen SQLite-Datei mit fehlendem `CHOWN` und mit
`--user` liefern jetzt vor dem App-Start eine klare Pfad- und UID/GID-Meldung.
README und Docker-README beschreiben die neue Prüfung übereinstimmend;
`unraid/README.md` und die Vorlage wurden in Runde 2 nicht geändert.

**Befund 2 · unbeteiligte Datei blockiert den Start:** Die gemeinsame
`find`-Prüfung verlangt Lese- und Schreibrecht für **jede** Datei unter
`/data`. Die Ticketentscheidung verlangt dagegen einen Start, wenn die App
dort schreiben kann. Reproduktion mit eigenem temporären Docker-Volume:
`/data` Modus `0777`, nur `/data/old-note.txt` gehört `0:0` mit Modus `0400`,
keine SQLite-Datei, Container mit `--cap-drop CHOWN`. Ergebnis: Exit 1 vor
App-Start mit „`/data/old-note.txt is not writable for UID 99 / GID 100`“.
Der positive Fall mit beschreibbarem `/data` ohne CHOWN besteht im Rauchtest;
die unbeteiligte Datei ist der einzige Unterschied. Das Test-Volume wurde
entfernt. Bitte die Startprüfung auf die tatsächlich von SQLite benötigten
Pfade begrenzen und den positiven Gegenfall im Rauchtest nachweisen. Die
README-Aussage „every file“ ist danach an das tatsächliche Verhalten
anzupassen.

**Quellhinweis:** In der aktuellen `find`-Formel hängt `-print -quit` nur am
rechten `-o`-Zweig. Ein verschachtelter unbeschreibbarer Ordner mit Modus
`0555` ergab im Container trotz linkem Treffer keine Ausgabe. Wird die
rekursive Prüfung beibehalten, muss auch diese Verzweigung stimmen; wird sie
auf App-Pfade begrenzt, entfällt diese breite Zusage.

**Lessons-Einordnung:** SI-P-04/08 erneut angewendet. Die neuen Negativtests
unterscheiden den alten SQLite-Fehler, aber keinen unnötig verweigerten
Start bei schreibbaren App-Daten. Der konkrete Randfall bleibt im Ticket;
die Einordnung eines wiederkehrenden Musters liegt beim Observer.

## Coder-Übergabe · Runde 3 · claude-coder · 2026-10-01

**Prüfstand:** `f7de26c4d4471c23fc9aa408e73d99105b68f15f` gegen `1556aea`, Branch `t-72-unraid-uid-gid`.
Templates unverändert `bb83dfa`.

**Befund 2 bestätigt:** Die Prüfung aus Runde 2 verlangte Rechte für jede
Datei unter `/data` und wies so den Start wegen einer fremden Datei ab. Der
Quellhinweis zur `find`-Formel stimmt ebenfalls (`-print -quit` nur am
rechten Zweig).

**Korrektur:** `find` entfällt. Der Zielbenutzer prüft nur noch, was die App
braucht: Anlegen einer Probedatei in `/data` sowie Lese- und Schreibrecht für
vorhandene `stockportfolio.sqlite`, `-wal`, `-shm` und `-journal`. Der
Dateiname folgt `api/src/index.ts` (`resolve(dataDirectory,
'stockportfolio.sqlite')`). Fremde Dateien und Ordner in `/data` spielen
keine Rolle.

**Rauchtest:** neu eine root-eigene `-wal`-Datei (klare Meldung) und der
Gegenfall aus dem Review: `/data` 0777 mit `old-note.txt` (`0:0`, 0400) und
Ordner `locked-dir` (0555), ohne `CHOWN` → Start, Setup 201, Prozess 99:100.
**27 von 27** bestanden, gezählt vom Skript; Image aus `f7de26c`
(`make build`, linux/amd64 emuliert). Danach 0 Container mit Lauf-Label,
Volumes vorher und nachher 8. Gegenprobe zur alten Fassung ist die
Reproduktion des Verifiers auf `7aea00f`.

**Belege:** `make test` 852 Frontend- und 20 API-Tests grün; Lint und
Typecheck ohne Befund; Docker-Hub-Vorschau 12.245 Bytes.

**Doku-Abgleich:** `README.md` und `docker/README.md` wortgleich: Start, wenn
der Benutzer in `/data` anlegen und eine vorhandene Datenbank samt `-wal`,
`-shm`, `-journal` lesen und schreiben kann; andere Dateien zählen nicht.
`unraid/README.md` und Vorlage ohne Aussage dazu; unverändert.

**Lessons:** SI-P-04/08: Diesmal gibt es zu jedem Negativtest einen
positiven Gegenfall, der einen zu strengen Abbruch erkennt. Ein zweiter
Befund in derselben Prüfung desselben Tickets; die Einordnung als Muster
liegt beim Observer.

### Nachtrag zur Übergabe Runde 3 · UI aus dem Container · claude-coder · 2026-10-01

Auf Mikes Hinweis („Du überprüfst auch ob das UI aus Docker heraus
funktioniert“) zusätzlich sichtbar im Browser geprüft, ohne Änderung am
Prüfstand `f7de26c`. Image aus `f7de26c` (linux/amd64 emuliert), Container auf
`127.0.0.1:18095` mit `/data` als root-eigenem `tmpfs` (frischer Bind-Mount),
StockInfo-Test-Server auf `:8899` mit CORS für diese Herkunft, nur
synthetische Daten.

Bestanden: Setup-Seite mit Code aus dem Log, Admin anlegen (meldet direkt an),
Abmelden → Login mit Pflicht-Checkbox, Login → Dashboard, Beispiel-Depot mit
Kursen aus StockInfo (Gesamtwert €103,000, Status-Symbole, Statusleiste
StockInfo verbunden), Rebalancing, Benutzerverwaltung, Einstellungen, Sitzung
nach Neuladen erhalten. App-Prozess 99:100, Container `healthy`, keine Fehler
im Containerlog.

Konsole: 404 auf `/api/data/settings/current`, `/api/data/allowlist/<id>` und
`/api/data/snapshots/<id>` für ein frisches Konto (Datensätze noch nicht
angelegt, die App nutzt Standardwerte) sowie 401 auf `/api/auth/session` nach
dem Abmelden. Beides ist Verhalten der Konto-API, gleich unter `make dev`,
nicht durch T-72 verursacht. Danach Container entfernt, Test-Server beendet,
Ports frei.

## Unabhängige Prüfung · Runde 3 · codex-verifier · 2026-10-01

**Urteil: technisch freigegeben.** Prüfstand
`f7de26c4d4471c23fc9aa408e73d99105b68f15f` gegen `1556aea`.
Der `linux/amd64`-Image-Entrypoint ist bytegleich mit der geprüften Datei
(SHA-256 `b7b699ea8032de87cbe2e8901fdbf768f800acecda7bd400bb6b2648e6093cb3`).
`./docker/smoke-test.sh` bestand unabhängig mit **27 von 27** Prüfungen.
Insbesondere startet die App ohne `CHOWN` trotz gesperrter, unbeteiligter
Datei und eines gesperrten Unterordners; eine gesperrte SQLite- oder
WAL-Datei wird vor dem App-Start mit Pfad und UID/GID gemeldet. Die
Quellprüfung bestätigt, dass der `find`-Scan entfällt und die geprüften
Dateinamen zum Pfad in `api/src/index.ts` passen.

**UI-Prüftiefe:** Ein eigener temporärer Container mit root-eigenem `/data`
lieferte `/healthz` mit `ok`; im Browser erschien die Setup-Seite aus dem
Container mit Code-, Benutzer- und Passwortfeld. Die Browsersteuerung
wurde beim Ausfüllen durch einen Dialog unterbrochen; Setup, Login und
Dashboard habe ich dort nicht selbst durchgeklickt. Der Rauchtest prüfte
Setup und Login über HTTP; der Coder dokumentierte zusätzlich den sichtbaren
UI-Ablauf bis Dashboard, Rebalancing und Einstellungen. Mein Testcontainer
wurde gestoppt und entfernt. Kein Test auf echtem Unraid.

**Doku-Abgleich:** `README.md` und `docker/README.md` nennen nun übereinstimmend
den Datenordner, die SQLite-Datei und ihre Neben-Dateien als relevante
Schreibpfade; unbeteiligte Dateien blockieren nicht. `unraid/README.md` und
die zentrale XML wurden in Runde 3 nicht geändert; der in Runde 1 geprüfte
Stand mit Vorgabe 99:100 bleibt maßgeblich. T-74 ist ein Folgeauftrag im
Backlog, nicht Teil dieser Freigabe.

**Nicht blockierender Randfall:** Eine extrem große rein numerische `PUID`
bricht ab, meldet aber nach `Illegal number` irreführend fehlende
SETUID/SETGID-Rechte. Der Prozess läuft dabei nicht als root. Die
Prüfung ungültiger Werte im Ticket umfasst `abc` und `0`; eine präzisere
Meldung für Werte außerhalb des UID-Bereichs bleibt offen.

**Lessons-Einordnung:** SI-P-04/08 ist mit negativem SQLite-/WAL-Fall und
positivem Fremddatei-Fall angewendet. Die Runde-1/2-Befunde bleiben als
Originalbelege im Ticket. Keine neue Board-Konvention; kein Abgleich des
Skills `task-verification-workflow` nötig.
