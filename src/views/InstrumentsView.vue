<script setup lang="ts">
import { computed, h, inject, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  NDataTable,
  NInput,
  NSelect,
  NSwitch,
  NTag,
  NSpin,
  type DataTableColumns,
} from 'naive-ui'
import { eurCent, integer, percent } from '@/domain/formatters'
import { useInstrumentsStore } from '@/stores/instruments'
import { useAppNotification } from '@/composables/useAppNotification'
import { usePortfolioStore } from '@/stores/portfolio'
import { STOCK_INFO_CLIENT, type StockInfoClient } from '@/api/client'
import type { InstrumentSummary } from '@/api/types'

const { t } = useI18n()

const client = inject<StockInfoClient>(STOCK_INFO_CLIENT)
if (!client) throw new Error('StockInfoClient wurde nicht bereitgestellt')

const instrumentsStore = useInstrumentsStore()
const portfolioStore = usePortfolioStore()

const search = ref<string>('')
const typeFilter = ref<string>('')

/** `''` statt `null` — Naive UIs Select-Optionen lassen kein null als Wert zu. */
const typeOptions = [
  { label: 'Alle Typen', value: '' },
  { label: 'ETF', value: 'etf' },
  { label: 'Aktie', value: 'stock' },
]

/** Schlüssel der Papiere, die schon im Depot liegen. */
const heldKeys = computed(
  () =>
    new Set(
      portfolioStore.positions
        .filter((position) => position.group !== 'cash')
        .map((position) => position.isin ?? position.symbol),
    ),
)

const filtered = computed<InstrumentSummary[]>(() => {
  const needle = search.value.trim().toLowerCase()
  return instrumentsStore.instruments.filter((instrument) => {
    if (typeFilter.value && instrument.type !== typeFilter.value) return false
    if (!needle) return true
    return [instrument.symbol, instrument.isin, instrument.name]
      .filter((field): field is string => typeof field === 'string')
      .some((field) => field.toLowerCase().includes(needle))
  })
})

const rowKey = (row: InstrumentSummary): string => instrumentsStore.keyOf(row)

const columns = computed<DataTableColumns<InstrumentSummary>>(() => [
  {
    title: t('table.symbol'),
    key: 'symbol',
    width: 260,
    render: (row) =>
      h('div', { class: 'flex flex-col' }, [
        h('div', { class: 'flex items-center gap-2' }, [
          h('span', { class: 'font-medium text-sm' }, row.symbol),
          heldKeys.value.has(rowKey(row))
            ? h(NTag, { size: 'tiny', type: 'success', bordered: false }, () => t('instruments.inPortfolio'))
            : null,
        ]),
        h('span', { class: 'text-xs text-ink-muted truncate' }, row.name ?? '—'),
      ]),
  },
  {
    title: 'ISIN',
    key: 'isin',
    width: 150,
    render: (row) => h('span', { class: 'tabular-nums text-xs' }, row.isin ?? '—'),
  },
  {
    title: 'Typ',
    key: 'type',
    width: 90,
    render: (row) =>
      h(NTag, { size: 'small', bordered: false }, () => (row.type === 'etf' ? t('dashboard.kindEtf') : t('dashboard.kindStock'))),
  },
  {
    title: t('table.price'),
    key: 'latest_price',
    align: 'right',
    width: 110,
    sorter: (a, b) => (a.latest_price ?? 0) - (b.latest_price ?? 0),
    render: (row) =>
      row.latest_price !== null
        ? h('span', { class: 'tabular-nums' }, eurCent(row.latest_price))
        : h('span', { class: 'tabular-nums text-ink-muted text-xs' }, 'noch keiner'),
  },
  {
    title: 'TER',
    key: 'ter',
    align: 'right',
    width: 90,
    render: (row) =>
      row.ter !== null
        ? h('span', { class: 'tabular-nums' }, percent(row.ter))
        : h('span', { class: 'text-ink-muted' }, '—'),
  },
  {
    title: t('drilldown.volatility'),
    key: 'volatility',
    align: 'right',
    width: 110,
    sorter: (a, b) => (a.volatility ?? 0) - (b.volatility ?? 0),
    render: (row) =>
      row.volatility !== null
        ? h('span', { class: 'tabular-nums' }, percent(row.volatility))
        : h('span', { class: 'text-ink-muted' }, '—'),
  },
  {
    title: 'Kurspunkte',
    key: 'history_count',
    align: 'right',
    width: 110,
    render: (row) =>
      h('span', { class: 'tabular-nums text-ink-muted' }, integer(row.history_count)),
  },
  {
    title: t('instruments.inSelection'),
    key: 'allowed',
    align: 'center',
    width: 110,
    render: (row) =>
      h(NSwitch, {
        value: instrumentsStore.isAllowed(row),
        size: 'small',
        'onUpdate:value': () => void instrumentsStore.toggleAllowed(row),
      }),
  },
])

onMounted(async () => {
  if (!portfolioStore.loaded) await portfolioStore.load()
  if (!instrumentsStore.loaded) await instrumentsStore.load(client)
})

// Meldung als Toast, wie überall sonst: Ein Kasten über der Tabelle schiebt
// sie beim Erscheinen nach unten.
const { notify } = useAppNotification()

notify(
  computed(() => instrumentsStore.error !== null),
  {
    title: t('notify.assetsFailedTitle'),
    type: 'error',
    content: () => instrumentsStore.error ?? '',
  },
)

</script>

<template>
  <div class="max-w-[1400px] mx-auto px-6 py-8">
    <div class="flex items-baseline gap-3 mb-1">
      <h1 class="text-2xl font-semibold">{{ t('views.instrumentsTitle') }}</h1>
      <span class="text-xs text-ink-muted tabular-nums">
        {{ t('instruments.countLabel', { shown: filtered.length, total: instrumentsStore.instruments.length }) }}
      </span>
    </div>
    <p class="text-sm text-ink-muted mb-5">
      {{ t('instruments.hint') }}
    </p>

    <div class="flex flex-wrap gap-3 mb-4">
      <NInput
        v-model:value="search"
        placeholder="Symbol, ISIN oder Name"
        clearable
        class="max-w-xs"
      />
      <NSelect
        v-model:value="typeFilter"
        :options="typeOptions"
        class="max-w-[10rem]"
        placeholder="Typ"
      />
    </div>

    <div v-if="instrumentsStore.loading" class="flex justify-center py-16">
      <NSpin size="large" />
    </div>

    <NDataTable
      v-else
      :columns="columns"
      :data="filtered"
      :row-key="rowKey"
      :bordered="false"
      size="small"
    />
  </div>
</template>
