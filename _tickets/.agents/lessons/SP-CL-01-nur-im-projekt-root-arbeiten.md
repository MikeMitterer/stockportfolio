---
schema_version: 1
id: SP-CL-01
project: stockportfolio
kind: decision
discovery_phase: observation
affected_work:
- implementation
- review
- observation
subject_author: claude
discovered_by: mike
recorded_by: claude
prevention_roles:
- implementer
- reviewer
- observer
provenance:
  project: stockportfolio
  evidence:
  - ticket: T-65-board-konventionen-abgleichen.md
    section: Nacharbeit zu Runde 2
  - ticket: T-66-status-badges-below-above-ok.md
    section: Stand nach Mikes weiteren Entscheidungen
  captured_at: '2026-10-01'
---

# SP-CL-01 · Nur im Projekt-Root arbeiten, keine verstreuten Worktrees

**Herkunft:** Von Mike ausdrücklich beauftragte Einzelfall-Lehre
(2026-10-01: „Wir haben aktuell einen untragbaren Zustand. Tickets werden in
irgendwelchen worktrees abgelegt die ich überhaupt nicht oder nur sehr schwer
sehe. Sourcestände kann ich nicht mehr aus dem Project-Root testen“). Die
Regel steht in [AGENTS.md · Ein Arbeitsort](../../../AGENTS.md#ein-arbeitsort-der-projekt-root).

**Erkennung:** Eine Instanz legt für ein Ticket `git worktree add` unter
`/private/tmp` oder anderswo an, führt dort Code und Board weiter und hält
mehrere STATUS-Kopien von Hand gleich. Warnsignale: absolute Pfade auf
`/private/tmp/stockportfolio-*` in Startzeilen oder STATUS, Tickets, die nur
in einem Seitenbranch existieren, und ein Hauptverzeichnis auf einem anderen
Branch als das aktive Ticket.

**Was passierte:** `claude-coder` legte für T-62, T-64, T-65 und T-66 je einen
Worktree an und synchronisierte bis zu vier STATUS-Kopien. Tickets lagen nur
in Worktrees; Mike konnte sie nicht sehen und den Stand nicht aus dem Root
testen. Ein Verifier fand das aktive Ticket im Hauptverzeichnis nicht und
begann eine Prüfung über zwei Stunden nicht. Mehrere STATUS-Abgleiche
überschrieben dabei fremde, nicht committete Änderungen.

**Implementer-Regel:** Nur im Projekt-Root arbeiten; den Ticketbranch dort mit
`git switch` auschecken und im STATUS-Feld `branch` nennen. Keine Worktrees ohne
Mikes ausdrücklichen Auftrag. Nach technischer Freigabe sofort nach `master`
mergen und den Root zurückstellen.

**Verifier-Prüfung:** Vor dem Review `git branch --show-current` im Root gegen
STATUS `branch` prüfen; bei Abweichung Konflikt melden, nicht selbst
umschalten. In der Übergabe nach Pfaden außerhalb des Roots suchen; ein
Ticket, das nur in einem Worktree liegt, ist ein Befund.

**Observer-Prüfung:** Bei jedem Durchlauf `git worktree list` ansehen; jeder
Eintrag außer dem Root ist ohne dokumentierten Auftrag Mikes ein Hinweis an
den Coder.

**Erwartbarer Beleg:** `git worktree list` zeigt nur den Root; STATUS `branch`
entspricht dem ausgecheckten Branch.
