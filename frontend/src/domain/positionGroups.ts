/**
 * Ordnet Tabellen- und Kartenzeilen den Depotgruppen zu (T-128). Gemeinsam für
 * Positionstabelle, Kartenliste und Handelstabelle, damit Reihenfolge und das
 * Weglassen leerer Gruppen überall gleich bleiben.
 */
import type { GroupResult } from '@/domain/rebalancing'
import type { AssetGroup } from '@/types/portfolio'

export interface RowsOfGroup<R> {
  group: GroupResult
  rows: R[]
}

/** Gruppen in ihrer Reihenfolge mit ihren Zeilen; leere Gruppen entfallen, eine Überschrift ohne Zeilen wäre Rauschen. */
export function rowsByGroup<R>(
  groups: GroupResult[],
  rows: R[],
  groupOf: (row: R) => AssetGroup,
): RowsOfGroup<R>[] {
  return groups
    .map((group) => ({ group, rows: rows.filter((row) => groupOf(row) === group.group) }))
    .filter((entry) => entry.rows.length > 0)
}
