/**
 * Eingeklappte Gruppen der Positionstabelle, im Browser gespeichert (aus
 * `PositionsTable.vue` herausgelöst, T-131).
 */
import { computed, ref, watch, type Ref } from 'vue'
import { safeStorage } from '@mmit/ux-foundation'
import type { RowsOfGroup } from '@/domain/positionGroups'
import type { AssetGroup } from '@/types/portfolio'

const COLLAPSED_KEY = 'stockportfolio.table.collapsedGroups'

/** Liest die eingeklappten Gruppen aus dem Speicher. */
function loadCollapsed(): Set<AssetGroup> {
  const stored = safeStorage.read(COLLAPSED_KEY)
  if (!stored) return new Set()

  // Das `try` gilt nur noch dem Inhalt: Was dort steht, hat eine frühere
  // Fassung geschrieben und muss nicht mehr passen. Der Zugriff selbst ist
  // abgesichert.
  try {
    const parsed: unknown = JSON.parse(stored)
    if (!Array.isArray(parsed)) return new Set()
    return new Set(parsed as AssetGroup[])
  } catch {
    return new Set()
  }
}

export function useCollapsedGroups<R>(renderedGroups: Ref<RowsOfGroup<R>[]>) {
  const collapsedGroups = ref<Set<AssetGroup>>(loadCollapsed())

  watch(
    collapsedGroups,
    (groups) => {
      safeStorage.write(COLLAPSED_KEY, JSON.stringify([...groups]))
    },
    { deep: true },
  )

  function isCollapsed(group: AssetGroup): boolean {
    return collapsedGroups.value.has(group)
  }

  function collapseAllGroups(): void {
    collapsedGroups.value = new Set(renderedGroups.value.map((entry) => entry.group.group))
  }

  function openAllGroups(): void {
    collapsedGroups.value = new Set()
  }

  function toggleGroup(group: AssetGroup): void {
    const next = new Set(collapsedGroups.value)
    if (next.has(group)) {
      next.delete(group)
    } else {
      next.add(group)
    }
    collapsedGroups.value = next
  }

  /**
   * Die Gruppe, deren Tabelle die Spaltenkopfzeile trägt — die erste, die
   * tatsächlich sichtbar ist. Alle darunter erben sie visuell.
   *
   * Nach DOM-Position (`:first-of-type`) ging das schief: `v-show` lässt die
   * Tabelle einer eingeklappten Gruppe im Dokument stehen. Klappt man die
   * oberste Gruppe zu, fiele die Kopfzeile ausgerechnet der versteckten
   * Tabelle zu — und die ganze Ansicht stünde ohne Spaltennamen da.
   */
  const headedGroup = computed<AssetGroup | null>(
    () =>
      renderedGroups.value.find((entry) => !isCollapsed(entry.group.group))?.group.group ?? null,
  )

  return { isCollapsed, collapseAllGroups, openAllGroups, toggleGroup, headedGroup }
}
