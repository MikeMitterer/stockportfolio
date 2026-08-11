<script setup lang="ts">
import { computed, h, inject, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { NDataTable, type DataTableColumns } from 'naive-ui'
import DeltaBar from '@/components/DeltaBar.vue'
import PriceSparkline from '@/components/PriceSparkline.vue'
import SuggestionBadge from '@/components/SuggestionBadge.vue'
import PositionDrilldown from '@/components/PositionDrilldown.vue'
import PositionGroupHeader from '@/components/PositionGroupHeader.vue'
import InlineNumber from '@/components/InlineNumber.vue'
import LinkIcons from '@/components/LinkIcons.vue'
import { eur, eurCent, integer, money, percent } from '@/domain/formatters'
import type { GroupResult, PositionResult } from '@/domain/rebalancing'
import type { AssetGroup, Bands, ExternalLink, Position } from '@/types/portfolio'
import { useHistoryStore } from '@/stores/history'
import { STOCK_INFO_CLIENT, type StockInfoClient } from '@/api/client'

type RowKey = string | number

const props = defineProps<{
  rows: PositionResult[]
  groups: GroupResult[]
  bands: Bands
  total: number
  /** Summe der Ziel-Anteile über 100 % — färbt die Ziel-Spalte ein. */
  targetsExceeded: boolean
  /** Konfigurierte externe Verweise (fürs Drilldown). */
  links: ExternalLink[]
}>()

const emit = defineEmits<{
  (event: 'update', id: string, changes: Partial<Position>): void
  (event: 'remove', id: string): void
  (event: 'refresh', id: string): void
}>()

const { t } = useI18n()

/**
 * Kursverlauf für die Zeilen.
 *
 * Kurzer Zeitraum: In 90 Pixeln Breite ist ein Jahr nur noch Zickzack. Ein
 * Monat zeigt die Bewegung, um die es hier geht — kommt der Kurs von oben
 * oder von unten?
 */
const SPARK_PERIOD = '1m' as const

const client = inject<StockInfoClient>(STOCK_INFO_CLIENT) ?? null
const historyStore = useHistoryStore()

// Nachladen, sobald die Zeilen stehen. Der Store holt nur, was fehlt oder von
// gestern ist — meist kostet das keine einzige Anfrage.
watch(
  () => props.rows.map((row) => row.position.id).join(','),
  () => {
    for (const row of props.rows) {
      void historyStore.ensure(client, row.position, SPARK_PERIOD)
    }
  },
  { immediate: true },
)

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
        links: props.links,
        onUpdate: (id: string, changes: Partial<Position>) => emit('update', id, changes),
        onRemove: (id: string) => emit('remove', id),
        onRefresh: (id: string) => emit('refresh', id),
      }),
  },
  {
    title: t('table.symbol'),
    key: 'symbol',
    width: 220,
    render: (row) =>
      h('div', { class: 'flex flex-col gap-0.5' }, [
        // Kürzel und Verweis-Symbole in einer Zeile — die Links gehören zum
        // Papier, nicht in eine eigene Spalte, die die Tabelle breiter macht.
        h('div', { class: 'flex items-center gap-2' }, [
          h(
            'span',
            { class: 'font-medium text-sm' },
            row.position.group === 'cash' ? row.position.displayName : row.position.symbol,
          ),
          // Fremde Währung sieht aus wie „inaktiv", ist aber keine
          // Entscheidung des Nutzers — deshalb eigene Farbe und eigener Text.
          row.excludedReason === 'currency'
            ? h(
                'span',
                {
                  class:
                    'text-[10px] uppercase tracking-wide px-1.5 py-px rounded border border-status-out/50 text-status-out',
                  title: `Notiert in ${row.quote?.currency ?? '?'} — zählt nicht in die Summen`,
                },
                row.quote?.currency ?? 'Fremdwährung',
              )
            : null,
          row.excludedReason === 'disabled'
            ? h(
                'span',
                {
                  class:
                    'text-[10px] uppercase tracking-wide px-1.5 py-px rounded border border-edge text-ink-muted',
                },
                'inaktiv',
              )
            : null,
          row.position.group !== 'cash'
            ? h(LinkIcons, {
                position: row.position,
                links: props.links,
                quoteType: row.quote?.type,
              })
            : null,
        ]),
        row.position.group !== 'cash'
          ? h('span', { class: 'text-xs text-ink-muted truncate' }, row.position.displayName)
          : null,
      ]),
  },
  {
    title: t('table.units'),
    key: 'units',
    align: 'right',
    width: 110,
    render: (row) =>
      h(InlineNumber, {
        value: row.position.units,
        display:
          row.position.group === 'cash'
            ? eur(row.position.units)
            : integer(row.position.units),
        precision: row.position.group === 'cash' ? 2 : 0,
        min: 0,
        onCommit: (units: number) => emit('update', row.position.id, { units }),
      }),
  },
  {
    title: t('table.price'),
    key: 'price',
    align: 'right',
    width: 100,
    render: (row) =>
      row.quote
        ? h(
            'span',
            { class: 'tabular-nums' },
            // Fremde Währung mit ihrem eigenen Zeichen: „628,20 €" für einen
            // USD-Kurs wäre schlicht falsch.
            row.excludedReason === 'currency'
              ? money(row.quote.price, row.quote.currency)
              : eurCent(row.quote.price),
          )
        : row.position.group === 'cash'
          ? h('span', { class: 'tabular-nums text-ink-muted' }, '—')
          : h('span', { class: 'tabular-nums text-status-out text-xs' }, t('table.quoteMissing')),
  },
  {
    // Der Zeitraum gehört in den Kopf, nicht in jede Zeile: einmal genannt,
    // kostet er keinen Platz in den Zeilen.
    title: 'Verlauf 1M',
    key: 'history',
    // Schmal gehalten: Die Spalte ist eine Zugabe, keine Hauptzahl — sie darf
    // dem Delta und dem Status keinen Platz wegnehmen.
    width: 130,
    render: (row) => {
      if (row.position.group === 'cash') {
        return h('span', { class: 'text-ink-muted text-xs' }, '—')
      }
      const series = historyStore.get(row.position, SPARK_PERIOD)
      return h(PriceSparkline, {
        points: series.points,
        loading: series.loading,
        width: 62,
        periodLabel: 'letzter Monat',
      })
    },
  },
  {
    title: t('table.marketValue'),
    key: 'marketValue',
    align: 'right',
    width: 130,
    sorter: (a, b) => a.marketValue - b.marketValue,
    render: (row) =>
      h(
        'span',
        { class: 'tabular-nums font-medium' },
        row.excludedReason === 'currency' && row.quote
          ? money(row.marketValue, row.quote.currency)
          : eur(row.marketValue),
      ),
  },
  {
    title: t('table.actualPercent'),
    key: 'actualPercent',
    align: 'right',
    width: 90,
    sorter: (a, b) => a.actualPercent - b.actualPercent,
    render: (row) =>
      row.isActive
        ? h('span', { class: 'tabular-nums' }, percent(row.actualPercent))
        : h('span', { class: 'tabular-nums text-ink-muted' }, '—'),
  },
  {
    title: t('table.targetPercent'),
    key: 'targetPercent',
    align: 'right',
    width: 110,
    render: (row) =>
      h(InlineNumber, {
        value: row.position.targetPercent,
        display: percent(row.position.targetPercent),
        precision: 2,
        min: 0,
        max: 100,
        // Bei überzogener Ziel-Summe alle Ziel-Zellen einfärben — der Fehler
        // liegt in der Summe, nicht in einer einzelnen Zeile.
        invalid: props.targetsExceeded,
        onCommit: (targetPercent: number) =>
          emit('update', row.position.id, { targetPercent }),
      }),
  },
  {
    title: t('table.delta'),
    key: 'delta',
    width: 150,
    render: (row) =>
      row.isActive
        ? h(DeltaBar, { relativePercent: row.relativeDeltaPercent, bands: props.bands })
        : h('span', { class: 'text-ink-muted text-xs' }, '—'),
  },
  {
    title: t('table.status'),
    key: 'status',
    // Zentriert ist wieder möglich, seit das Badge eine feste Breite hat.
    // Vorher wanderte es bei wechselnden Beschriftungen von Zeile zu Zeile.
    align: 'center',
    width: 130,
    render: (row) => {
      if (row.isActive) {
        return h(SuggestionBadge, { suggestion: row.suggestion, near: row.isNearBand })
      }
      return h(
        'span',
        {
          class:
            row.excludedReason === 'currency'
              ? 'text-status-out text-xs'
              : 'text-ink-muted text-xs',
        },
        row.excludedReason === 'currency' ? 'fremde Währung' : 'zählt nicht mit',
      )
    },
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
        :row-props="
          (row: PositionResult) => ({
            style: row.isActive ? 'cursor: pointer;' : 'cursor: pointer; opacity: 0.55;',
          })
        "
      />
    </template>
  </div>
</template>

<style scoped>
:deep(.n-data-table-td) {
  padding-top: 10px;
  padding-bottom: 10px;
}

/*
 * Tabelle auf die Fläche des Containers legen.
 *
 * Naive UI gibt Zellen und Kopfzeile eine eigene Hintergrundfarbe. Die
 * Gruppen-Kopfzeilen liegen aber zwischen den Tabellen und zeigen daher die
 * Container-Farbe — sichtbar heller als die Zeilen. Mit transparenten Zellen
 * liegt alles auf derselben Fläche und der Unterschied verschwindet.
 */
:deep(.n-data-table),
:deep(.n-data-table-th),
:deep(.n-data-table-td),
:deep(.n-data-table-wrapper),
:deep(.n-data-table-base-table),
:deep(.n-data-table-table) {
  background-color: transparent;
}

/* Kopfzeile nur einmal ganz oben zeigen — die Gruppen darunter erben sie visuell. */
.flex > :not(:first-of-type) :deep(.n-data-table-thead) {
  display: none;
}
</style>
