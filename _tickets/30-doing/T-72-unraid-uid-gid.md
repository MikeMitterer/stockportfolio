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

**Stand:** In Umsetzung durch `claude-coder` auf `t-72-unraid-uid-gid`.

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
| 1 | <a id="pruefpunkt-1"></a>Docker | `/data` gehört `root` (frischer Bind-Mount) | Start, Setup, Login; Dateien gehören 99:100 | Befund | ➖ |
| 2 | <a id="pruefpunkt-2"></a>Docker | Vorhandene Daten mit UID 1000 | Login mit altem Konto klappt; Eigentümer danach 99:100 | Schwachstelle 3 | ➖ |
| 3 | <a id="pruefpunkt-3"></a>Docker | Start mit `--user` | Läuft mit beschreibbarem `/data`; klare Meldung ohne Schreibrecht | Schwachstelle 1 | ➖ |
| 4 | <a id="pruefpunkt-4"></a>Docker | `chown` nicht möglich | Warnung; Start, wenn schreibbar; klare Meldung, wenn nicht | Schwachstelle 2 | ➖ |
| 5 | <a id="pruefpunkt-5"></a>Docker | Eigene `PUID`/`PGID`, ungültige Werte, `0` | Prozess mit gewünschten IDs; Abbruch mit Meldung bei ungültigen Werten | Schwachstelle 4 | ➖ |
| 6 | <a id="pruefpunkt-6"></a>Docker | Prozessliste | App-Prozess nie UID 0 | Schwachstelle 5 | ➖ |

### Akzeptanzkriterien

- [ ] Frischer Appdata-Ordner unter Unraid-Bedingungen startet ohne Eingriff.
- [ ] Die App läuft als 99:100, änderbar über `PUID`/`PGID`.
- [ ] Alle fünf Schwachstellen sind abgefangen und im Rauchtest belegt.
- [ ] `README.md`, `docker/README.md`, `unraid/README.md` und die Unraid-Vorlage nennen den neuen Stand.

### Side-Effects

Bestehende Installationen übernehmen beim ersten Start ihre Daten auf 99:100.
Der Container startet kurz als root; der App-Prozess nicht.
