# T-65 · Board-Konventionen auf den Paketstand abgleichen

**Auftrag von Mike, 2026-10-01:** „Ja, leg dafür ein Ticket an“, auf die
Frage, ob die offene Übernahme der Board-Konventionen als eigenes Ticket
abgeglichen werden soll.

Das Board arbeitet nach dem Konventionsstand `2026-09-11-activity-feed`.
Installiert ist das gemeinsame Regelpaket mit Stand
`2026-09-28-activity-local` (Paket `df699dd1…24da1` unter
`~/.local/share/agent-workflow/current`). Das Ticket gleicht das Board an
diese Fassung an. Am Produkt ändert sich nichts.

**Einordnung in die Kette:** nach T-64. STATUS führt immer nur ein aktives
Ticket; T-65 beginnt, wenn T-64 freigegeben oder zurückgegeben ist und Mike
nichts anderes festlegt.

## Für dich

| Frage | Prüfpunkt # | Handgriff | Dein Urteil | Human |
|---|---|---|---|---|
| A · Regelstand | [1](#pruefpunkt-1) | `AGENT-WORKFLOW.md` öffnen | Steht dort `2026-09-28-activity-local` samt der lokalen Abweichungen? | |

## Umfang

Grundlage: `references/board-conventions.md` des Pakets, Abschnitt
„Bestehende Boards abgleichen“.

1. **`AGENTS.md`:** Verweis auf die gemeinsamen `PROJECT-RULES.md`
   (Arbeitsfreigabe, sensible Dateien, Ticketabschluss und Git). Lokale
   Entscheidungen bleiben und haben Vorrang, insbesondere Mikes dauerhafte
   Freigabe von Merge **und Push** nach Abschluss (2026-09-27); das Paket
   selbst beauftragt keinen Push.
2. **`_tickets/.agents/AGENT-WORKFLOW.md` und Ticketvorlage:** Pflicht zur
   Lessons-Einordnung neuer Befunde in der Tabellenform der Paketvorlage
   (Befund, Einordnung, Lesson-ID/Fassung oder Einzelfallgrund, Übernahme).
   Abgeschlossene Reviews werden dafür nicht wiederholt.
3. **ACTIVITY:** Die Paketvorlage sieht `_tickets/.gitignore` mit
   `/ACTIVITY.md` vor. Hier wirkt bereits die Root-`.gitignore`
   (Mikes Beschluss vom 2026-09-28). Entscheiden und dokumentieren: als
   lokale Abweichung festhalten oder die Datei zusätzlich anlegen.
4. **Weitere Abgleichpunkte** aus der Übernahmeanleitung prüfen: Aktivierung,
   STATUS-Einstieg, README des Boards, Lessons-Einstieg, Startprompts der
   Shortcuts. Nur betroffene Abschnitte ergänzen; keine Vorlagen über das
   eigenständig entwickelte Board kopieren.
5. **Stand eintragen:** `Übernahmestand der Board-Konventionen:
   2026-09-28-activity-local` mit Datum und lokalen Abweichungen in
   `AGENT-WORKFLOW.md`; den Hinweis „Offene Übernahme“ in STATUS entfernen.
6. **Skill-Abgleich:** Nach AGENTS.md Änderungen an Board-Konventionen im
   Skill `task-verification-workflow` nachziehen oder begründen, warum dort
   nichts zu ändern ist.

Geltende Rollen, Phasen, aktive Aufträge, Nachrichten, Nachweise und
Nutzerentscheidungen bleiben erhalten.

## Verify

| # | Handgriff | Nachweis | AI |
|---|---|---|:--:|
| 1 | <a id="pruefpunkt-1"></a>Workflow, AGENTS, Ticketvorlage und STATUS gegen die Prüfkriterien der Übernahmeanleitung lesen | Jedes Kriterium umgesetzt oder als lokale Abweichung begründet | ➖ |
| 2 | Vorhandene Links und Anker in den geänderten Dateien prüfen | Keine toten Verweise | ➖ |
| 3 | `make test` (keine Produktänderung erwartet) | Unverändert grün | ➖ |

Legende: ✅ live bestätigt · ⚠️ mit Einschränkung · ◑ teilweise ·
➖ noch kein Nachweis.

### Doku-Abgleich

Noch offen. Betroffen: `AGENTS.md`, `_tickets/.agents/`, Ticketvorlage,
`_tickets/README.md`, Skill `task-verification-workflow`.
