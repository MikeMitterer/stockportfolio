<script setup lang="ts">
import { computed, h, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { NDataTable, type DataTableColumns } from 'naive-ui'
import DeltaBar from '@/components/DeltaBar.vue'
import SuggestionBadge from '@/components/SuggestionBadge.vue'
import PositionDrilldown from '@/components/PositionDrilldown.vue'
import PositionGroupHeader from '@/components/PositionGroupHeader.vue'
import { eur, eurCent, integer, percent } from '@/domain/formatters'
import type { GroupResult, PositionResult } from '@/domain/rebalancing'
import type { AssetGroup, Bands, Position } from '@/types/portfolio'

type RowKey = string | number

const props = defineProps<{
  rows: PositionResult[]
  groups: GroupResult[]
  bands: Bands
  total: number
}>()

const emit = defineEmits<{
  (event: 'update', id: string, changes: Partial<Position>): void
  (event: 'apply-trade', id: string, tradeUnits: number): void
  (event: 'remove', id: string): void
  (event: 'refresh', id: string): void
}>()

const { t } = useI18n()

const expandedRowKeys = ref<RowKey[]>([])

const rowKey = (row: PositionResult): RowKey => row.position.id

// ─── Gruppierung ────────────────────────────────────────────────────────────

interface RenderedGroup {
  group: GroupResult
  rows: PositionResult[]
}

/** Nur Gruppen mit Positionen — leere Kopfzeilen wären Rauschen. */
const renderedGroups = computed<RenderedGroup[]>(() =>
  props.groups
    .map((group) => ({
      group,
      rows: props.rows.filter((row) => row.position.group === group.group),
    }))
    .filter((entry) => entry.rows.length > 0),
)

const COLLAPSED_KEY = 'stockportfolio.table.collapsedGroups'
const collapsedGroups = ref<Set<AssetGroup>>(loadCollapsed())

/** Liest die eingeklappten Gruppen aus dem localStorage. */
function loadCollapsed(): Set<AssetGroup> {
  try {
    const stored = localStorage.getItem(COLLAPSED_KEY)
    if (!stored) return new Set()
    const parsed: unknown = JSON.parse(stored)
    if (!Array.isArray(parsed)) return new Set()
    return new Set(parsed as AssetGroup[])
  } catch {
    return new Set()
  }
}

watch(
  collapsedGroups,
  (groups) => {
    localStorage.setItem(COLLAPSED_KEY, JSON.stringify([...groups]))
  },
  { deep: true },
)

function isCollapsed(group: AssetGroup): boolean {
  return collapsedGroups.value.has(group)
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

// ─── Spalten ────────────────────────────────────────────────────────────────

const columns = computed<DataTableColumns<PositionResult>>(() => [
  {
    type: 'expand',
    expandable: () => true,
    renderExpand: (row) =>
      h(PositionDrilldown, {
        row,
        total: props.total,
        bands: props.bands,
        onUpdate: (id: string, changes: Partial<Position>) => emit('update', id, changes),
        onApplyTrade: (id: string, units: number) => emit('apply-trade', id, units),
        onRemove: (id: string) => emit('remove', id),
        onRefresh: (id: string) => emit('refresh', id),
      }),
  },
  {
    title: t('table.symbol'),
    key: 'symbol',
    width: 240,
    render: (row) =>
      h('div', { class: 'flex flex-col' }, [
        h(
          'span',
          { class: 'font-medium text-sm' },
          row.position.group === 'cash' ? row.position.displayName : row.position.symbol,
        ),
        row.position.group !== 'cash'
          ? h('span', { class: 'text-xs text-neutral-500 truncate' }, row.position.displayName)
          : null,
      ]),
  },
  {
    title: t('table.units'),
    key: 'units',
    align: 'right',
    width: 100,
    render: (row) =>
      row.position.group === 'cash'
        ? h('span', { class: 'tabular-nums text-neutral-500' }, '—')
        : h('span', { class: 'tabular-nums' }, integer(row.position.units)),
  },
  {
    title: t('table.price'),
    key: 'price',
    align: 'right',
    width: 100,
    render: (row) =>
      row.quote
        ? h('span', { class: 'tabular-nums' }, eurCent(row.quote.price))
        : row.position.group === 'cash'
          ? h('span', { class: 'tabular-nums text-neutral-500' }, '—')
          : h('span', { class: 'tabular-nums text-red-400 text-xs' }, t('table.quoteMissing')),
  },
  {
    title: t('table.marketValue'),
    key: 'marketValue',
    align: 'right',
    width: 130,
    sorter: (a, b) => a.marketValue - b.marketValue,
    render: (row) => h('span', { class: 'tabular-nums font-medium' }, eur(row.marketValue)),
  },
  {
    title: t('table.actualPercent'),
    key: 'actualPercent',
    align: 'right',
    width: 90,
    sorter: (a, b) => a.actualPercent - b.actualPercent,
    render: (row) => h('span', { class: 'tabular-nums' }, percent(row.actualPercent)),
  },
  {
    title: t('table.targetPercent'),
    key: 'targetPercent',
    align: 'right',
    width: 90,
    render: (row) =>
      h('span', { class: 'tabular-nums text-neutral-400' }, percent(row.position.targetPercent)),
  },
  {
    title: t('table.delta'),
    key: 'delta',
    width: 260,
    render: (row) => h(DeltaBar, { relativePercent: row.relativeDeltaPercent, bands: props.bands }),
  },
  {
    title: t('table.status'),
    key: 'status',
    align: 'center',
    width: 130,
    render: (row) => h(SuggestionBadge, { suggestion: row.suggestion, near: row.isNearBand }),
  },
])
</script>

<template>
  <div class="flex flex-col">
    <template v-for="entry in renderedGroups" :key="entry.group.group">
      <PositionGroupHeader
        :group="entry.group"
        :position-count="entry.rows.length"
        :collapsed="isCollapsed(entry.group.group)"
        @toggle="toggleGroup(entry.group.group)"
      />

      <NDataTable
        v-show="!isCollapsed(entry.group.group)"
        v-model:expanded-row-keys="expandedRowKeys"
        :columns="columns"
        :data="entry.rows"
        :row-key="rowKey"
        :bordered="false"
        :single-line="false"
        size="small"
        :row-props="() => ({ style: 'cursor: pointer;' })"
      />
    </template>
  </div>
</template>

<style scoped>
:deep(.n-data-table-td) {
  padding-top: 10px;
  padding-bottom: 10px;
}

/* Kopfzeile nur einmal ganz oben zeigen — die Gruppen darunter erben sie visuell. */
.flex > :not(:first-of-type) :deep(.n-data-table-thead) {
  display: none;
}
</style>
