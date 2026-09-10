# Codex-In-Context-Scheduler · StockPortfolio

Dieser Auftrag steuert den bestehenden Codex-Chat mit seiner ausdrücklich
benannten Instanzkennung. Fachliche Regeln stehen im
[Workflow](AGENT-WORKFLOW.md); er unterstützt Coder, Verifier und Observer.

## Start und Rollenprüfung

1. Eigene Kennung und absoluten Board-Pfad aus dem Startauftrag festhalten.
   STATUS lesen. Ohne eindeutige Zuordnung nicht starten. Ein Observer muss
   exakt in `observer` stehen und von den Arbeitsrollen verschieden sein.
2. Vorhandenen eigenen Scheduler im Chat prüfen. Läuft er bereits gesund,
   fortsetzen; keinen zweiten starten. Eine neue Zelle allein ist kein Startnachweis.
3. Den verfügbaren Laufzeitweg unten wählen, Kennung und Mechanismus bestätigen
   und unmittelbar einen ersten fälligen Durchlauf ausführen.
4. Folgetermine im Abstand von 300 Sekunden aus dem geplanten Termin berechnen.
   Versäumte Termine überspringen; keine Folge sofortiger Nachhol-Durchläufe.

### Lokaler Filecheck

Der Observer verwendet den abgelegten
[Filecheck](../../.agents/bin/observer-filecheck.py). Aus dem Projektverzeichnis:

```bash
python3 -B .agents/bin/observer-filecheck.py
```

Der Aufruf liefert Rollenfelder, Datei-Hashes und Git-HEAD als JSON und schreibt
keine Dateien. Der bestehende Scheduler vergleicht die Snapshots und prüft die
Observer-Zuordnung. Den Quelltext nicht bei jedem Durchlauf erneut als Befehl
übertragen oder generieren. Änderungen am Check erfolgen an dieser einen Datei.
Die Ablage ist vorläufig projektspezifisch; über eine allgemein wiederverwendbare
Fassung entscheidet Mike später. Es entsteht kein zusätzlicher Timer.

## App mit ausführbarer In-Context-Zelle

Nur verwenden, wenn `functions.exec` tatsächlich die Hilfen `notify` und
`yield_control` anbietet. Eine dauerhaft laufende Zelle führt allein den
Lese- und Wartezyklus aus, keine Umsetzung und keinen Review.

Beim Start `scheduler_started` mit Instanz, Board und Zeit über `notify`
ausgeben und mit `yield_control()` an den Chat zurückgeben. Cell-ID festhalten.
Pro Tick den aktuellen maschinenlesbaren STATUS-Block erneut lesen und
`scheduler_heartbeat` mit Zeit und Zustand signalisieren. Die Zelle darf
nicht nur `Script running` melden: Ausbleibende Heartbeats sind ein Fehler.

Bei einem fälligen Auftrag den Zustand an den Chat übergeben; der Chat liest
ihn vor fachlicher Arbeit erneut. Der Timer erzeugt während eines laufenden
Arbeitsschritts keinen parallelen Auftrag. Warteaufrufe höchstens 60 Sekunden
am Stück, damit Stopps und Nutzereingaben zeitnah verarbeitet werden.

Startsignal fehlt: eigene Zelle beenden und einmal neu starten. Bleibt der
Start erfolglos, Fehler offen melden. Beim Stoppen nur die eigene Cell-ID
beenden; andere Chats und Scheduler bleiben unberührt.

## Codex-CLI mit Shell-Prozesswerkzeugen

Wenn die App-Hilfen fehlen, denselben Chatturn offen halten und mit den
vorhandenen Werkzeugen `exec_command` und `write_stdin` warten. Ein eigener
`sleep`-Prozess wartet bis zum nächsten Termin; Prozess-ID beziehungsweise
Session-ID festhalten und spätestens alle 60 Sekunden auf Ausgabe oder Ende
warten. Bei Stopps nur diesen eigenen Warteprozess abbrechen.

Nach Ablauf STATUS neu lesen und den unten beschriebenen fälligen Durchlauf
im selben Chat ausführen. Danach bis zum nächsten geplanten Termin warten.
Keine externe Cron-Anlage, kein neuer Codex-Prozess je Tick und kein Wechsel
des Chats. Während der Beobachtungsauftrag läuft, keinen abschließenden
Final-Turn senden: Dieser Warteweg benötigt einen aktiven Turn und endet
mit dessen Unterbrechung oder dem Beenden der CLI.

Fehlen auch die Prozesswerkzeuge, den Start als nicht verfügbar melden.
Eine CLI ohne diese Ausstattung nicht als App-Scheduler ausgeben.

## Fällige Durchläufe

**Observer:** vor jedem Tick exakte `observer`-Zuordnung und Rollentrennung
prüfen. Unabhängig von `owner` und Arbeitsphase den
[Observer-Durchlauf](AGENT-ACTIVATION.md#observer-durchlauf) ausführen.
Bei unverändertem Stand keine wiederholten fachlichen Meldungen erzeugen.
Bei Verlust der Zuordnung eigenen Scheduler beenden, keine neue Rolle übernehmen.

**Coder und Verifier:** Rolle, Owner, Phase, Ticketpfad und Priorität wie im
[Arbeitsdurchlauf](AGENT-ACTIVATION.md#arbeitsdurchlauf) prüfen. Der Coder
verarbeitet `implementing`, `changes_requested` und `approved`; der Verifier
eine neue `ready_for_review`-Übergabe oder seine laufende Prüfung. `idle` und
fremder Owner erzeugen keine Arbeit. Ein ungültiger Zustand wird einmal pro
unverändertem Konflikt gemeldet.

Abgeschlossene Reviews über Ticket, Übergabecommit, Runde und Prüferidentität
aus STATUS und Ticket erkennen. Nicht bloß im Timer-RAM deduplizieren.
`approved` bedeutet Freigabe verarbeiten, nicht erneut implementieren.

## Stoppen, Compaction und Wiederanlauf

Instanzkennung, Board, Timer-/Session-ID, nächster Termin, letzter beobachteter
Stand und bereits gemeldete Hinweise bleiben im Chatkontext. Nach Compaction
diese Daten wiederherstellen und STATUS erneut lesen. Eine unklare Identität
nicht aus `owner` oder dem Produktnamen erraten.

Vor `/clear` den eigenen Scheduler stoppen. Nach verlorenem Kontext CLI
beenden und denselben Observer-Shortcut neu aufrufen; der Startprompt setzt
die Kennung erneut. Nach Neustart erste Beobachtung als Ausgangsaufnahme
kennzeichnen, statt eine über Sitzungen durchgehende Deduplizierung zu behaupten.

Ein Rollenwechsel allein startet keinen Scheduler. Einen gestoppten oder
fehlgeschlagenen Timer ausdrücklich als solchen melden; kein behaupteter
Hintergrundbetrieb nach dem Ende des aktiven Turns.
