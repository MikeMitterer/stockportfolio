<script setup lang="ts">
import { computed, h, inject, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { NDataTable, type DataTableColumns } from 'naive-ui'
import DeltaBar from '@/components/DeltaBar.vue'
import InfoHint from '@/components/InfoHint.vue'
import PriceSparkline from '@/components/PriceSparkline.vue'
import SuggestionBadge from '@/components/SuggestionBadge.vue'
import PositionDrilldown from '@/components/PositionDrilldown.vue'
import PositionGroupHeader from '@/components/PositionGroupHeader.vue'
import InlineNumber from '@/components/InlineNumber.vue'
import LinkIcons from '@/components/LinkIcons.vue'
import { eur, eurCent, integer, money, percent } from '@/domain/formatters'
import type { GroupResult, PositionResult } from '@/domain/rebalancing'
import type { AssetGroup, ExternalLink, Position } from '@/types/portfolio'
import { useHistoryStore, type HistorySeries } from '@/stores/history'
import { HISTORY_PERIOD_INFO } from '@/domain/historyPeriod'
import { useSettingsStore } from '@/stores/settings'
import { STOCK_INFO_CLIENT, type StockInfoClient } from '@/api/client'

type RowKey = string | number

const props = defineProps<{
  rows: PositionResult[]
  groups: GroupResult[]
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
 * Kurzer Zeitraum: In 60 Pixeln Breite ist ein Jahr nur noch Zickzack. Welcher
 * es genau ist, entscheidet der Nutzer in den Einstellungen.
 *
 * Für „ein Tag" wird die Woche geholt und daraus nur der letzte Schritt
 * gezeigt: Zwischen zwei Schlusskursen gibt es keinen Verlauf, wohl aber eine
 * Veränderung — vom letzten Handelstag auf heute. Ein eigener Abruf dafür
 * wäre Verschwendung, die Wochendaten enthalten ihn bereits.
 */
const client = inject<StockInfoClient>(STOCK_INFO_CLIENT) ?? null
const historyStore = useHistoryStore()
const settingsStore = useSettingsStore()

const sparkPeriod = computed(() => settingsStore.settings.ui.historyPeriod)
const periodInfo = computed(() => HISTORY_PERIOD_INFO[sparkPeriod.value])
const apiPeriod = computed(() => periodInfo.value.apiPeriod)

/** Beschriftung der Spalte — der Zeitraum gehört einmal in den Kopf. */
const periodLabel = computed(() => t(`history.short.${periodInfo.value.shortKey}`))

/**
 * Punkte für eine Zeile, auf den eingestellten Zeitraum zugeschnitten.
 *
 * Nur „ein Tag" schneidet: Dort interessieren der vorige Schluss und der
 * aktuelle Kurs, nicht die Woche davor.
 */
function pointsFor(position: PositionResult['position']): HistorySeries {
  const series = historyStore.get(position, apiPeriod.value)
  const { limit } = periodInfo.value
  if (limit === 0) return series
  return { ...series, points: series.points.slice(-limit) }
}

// Nachladen, sobald die Zeilen stehen oder der Zeitraum wechselt. Der Store
// holt nur, was fehlt oder von gestern ist — meist kostet das keine Anfrage.
watch(
  [() => props.rows.map((row) => row.position.id).join(','), apiPeriod],
  () => {
    for (const row of props.rows) {
      void historyStore.ensure(client, row.position, apiPeriod.value)
    }
  },
  { immediate: true },
)

const expandedRowKeys = ref<RowKey[]>([])

const rowKey = (row: PositionResult): RowKey => row.position.id

/**
 * Klappt eine Zeile auf oder zu.
 *
 * Hängt am Symbol und am Namen, nicht nur am Pfeil links: Wer Näheres zu einem
 * Papier sucht, klickt es an — nicht ein Bedienelement daneben.
 */
function toggleRow(id: RowKey): void {
  const open = expandedRowKeys.value
  expandedRowKeys.value = open.includes(id) ? open.filter((key) => key !== id) : [...open, id]
}

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
      h('div', { class: 'cell-stack' }, [
        // Kürzel und Verweis-Symbole in einer Zeile — die Links gehören zum
        // Papier, nicht in eine eigene Spalte, die die Tabelle breiter macht.
        h('div', { class: 'cell-row' }, [
          h(
            'button',
            {
              class: 'cell-symbol cell-openable',
              type: 'button',
              title: t('table.openDetails'),
              'aria-expanded': expandedRowKeys.value.includes(row.position.id),
              onClick: (event: MouseEvent) => {
                event.stopPropagation()
                toggleRow(row.position.id)
              },
            },
            row.position.group === 'cash' ? row.position.displayName : row.position.symbol,
          ),
          // Fremde Währung sieht aus wie „inaktiv", ist aber keine
          // Entscheidung des Nutzers — deshalb eigene Farbe und eigener Text.
          row.excludedReason === 'currency'
            ? h(
                'span',
                {
                  class: 'cell-tag cell-tag--warning',
                  title: t('currency.badgeTitle', { currency: row.quote?.currency ?? '?' }),
                },
                row.quote?.currency ?? t('currency.warningTitle'),
              )
            : null,
          row.excludedReason === 'disabled'
            ? h(
                'span',
                {
                  class: 'cell-tag',
                },
                t('currency.inactive'),
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
          ? h(
              'button',
              {
                class: 'cell-name cell-openable',
                type: 'button',
                title: t('table.openDetails'),
                onClick: (event: MouseEvent) => {
                  event.stopPropagation()
                  toggleRow(row.position.id)
                },
              },
              row.position.displayName,
            )
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
            { class: 'cell-num' },
            // Fremde Währung mit ihrem eigenen Zeichen: „628,20 €" für einen
            // USD-Kurs wäre schlicht falsch.
            row.excludedReason === 'currency'
              ? money(row.quote.price, row.quote.currency)
              : eurCent(row.quote.price),
          )
        : row.position.group === 'cash'
          ? h('span', { class: 'cell-num cell-num--muted' }, '—')
          : h('span', { class: 'cell-num cell-num--missing' }, t('table.quoteMissing')),
  },
  {
    // Der Zeitraum gehört in den Kopf, nicht in jede Zeile: einmal genannt,
    // kostet er keinen Platz in den Zeilen.
    // Der Zeitraum steht in den Einstellungen — ohne Verweis sucht man ihn
    // dort, wo die Spalte ist.
    title: () =>
      h('span', { class: 'cell-head' }, [
        t('history.columnTitle', { period: periodLabel.value }),
        h(InfoHint, { text: t('hints.historyPeriod'), settingsTab: 'data' }),
      ]),
    key: 'history',
    // Schmal gehalten: Die Spalte ist eine Zugabe, keine Hauptzahl — sie darf
    // dem Delta und dem Status keinen Platz wegnehmen.
    width: 130,
    render: (row) => {
      if (row.position.group === 'cash') {
        return h('span', { class: 'cell-empty' }, '—')
      }
      const series = pointsFor(row.position)
      return h(PriceSparkline, {
        points: series.points,
        loading: series.loading,
        width: 62,
        periodLabel: periodLabel.value,
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
        { class: 'cell-num cell-num--strong' },
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
        ? h('span', { class: 'cell-num' }, percent(row.actualPercent))
        : h('span', { class: 'cell-num cell-num--muted' }, '—'),
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
    // Der Begriff ist erklärungsbedürftig: „relativ zum Ziel" ist etwas
    // anderes als „Prozentpunkte", und die Verwechslung ist naheliegend.
    title: () =>
      h('span', { class: 'cell-head' }, [
        t('table.delta'),
        h(InfoHint, { text: t('hints.delta'), anchor: 'bands', settingsTab: 'calc' }),
      ]),
    key: 'delta',
    width: 150,
    render: (row) =>
      row.isActive
        ? h(DeltaBar, {
            relativePercent: row.relativeDeltaPercent,
            suggestion: row.suggestion,
            near: row.isNearBand,
          })
        : h('span', { class: 'cell-empty' }, '—'),
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
        return h(SuggestionBadge, {
          suggestion: row.suggestion,
          near: row.isNearBand,
          belowMinTrade: row.belowMinTrade,
        })
      }
      return h(
        'span',
        {
          class:
            row.excludedReason === 'currency'
              ? 'cell-excluded cell-excluded--currency'
              : 'cell-excluded',
        },
        row.excludedReason === 'currency'
          ? t('currency.statusForeign')
          : t('currency.notCounted'),
      )
    },
  },
])
</script>

<template>
  <div class="postable">
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

<style scoped lang="scss">
.postable {
  @include stack(0);
}
</style>
