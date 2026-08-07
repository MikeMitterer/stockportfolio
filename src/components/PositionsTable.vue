<script setup lang="ts">
import { computed, h, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { NDataTable, type DataTableColumns } from 'naive-ui'
type RowKey = string | number
import DeltaBar from '@/components/DeltaBar.vue'
import SuggestionBadge from '@/components/SuggestionBadge.vue'
import PositionDrilldown from '@/components/PositionDrilldown.vue'
import { eur, eurCent, integer, percent } from '@/domain/formatters'
import type { PositionResult } from '@/domain/rebalancing'
import type { Bands, Position } from '@/types/portfolio'

const props = defineProps<{
  rows: PositionResult[]
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
          ? h(
              'span',
              { class: 'text-xs text-neutral-500 truncate' },
              row.position.displayName,
            )
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
  <NDataTable
    :columns="columns"
    :data="rows"
    :row-key="rowKey"
    :bordered="false"
    :single-line="false"
    size="small"
    v-model:expanded-row-keys="expandedRowKeys"
    :row-props="() => ({ style: 'cursor: pointer;' })"
  />
</template>

<style scoped>
:deep(.n-data-table-td) {
  padding-top: 10px;
  padding-bottom: 10px;
}
</style>
