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
  <div class="instruments">
    <div class="instruments__head">
      <h1 class="instruments__title">{{ t('views.instrumentsTitle') }}</h1>
      <span class="instruments__count tabular-nums">
        {{ t('instruments.countLabel', { shown: filtered.length, total: instrumentsStore.instruments.length }) }}
      </span>
    </div>
    <p class="instruments__intro">
      {{ t('instruments.hint') }}
    </p>

    <div class="instruments__filters">
      <NInput
        v-model:value="search"
        placeholder="Symbol, ISIN oder Name"
        clearable
        class="instruments__search"
      />
      <NSelect
        v-model:value="typeFilter"
        :options="typeOptions"
        class="instruments__select"
        placeholder="Typ"
      />
    </div>

    <div v-if="instrumentsStore.loading" class="instruments__loading">
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

<style scoped lang="scss">
.instruments {
  max-width: 1400px;
  margin: 0 auto;
  padding: var(--space-8) var(--space-6);

  &__head {
    @include row(var(--space-3), baseline);
    margin-bottom: var(--space-1);
  }

  &__title {
    font-size: 1.5rem;
    font-weight: 600;
  }

  &__count {
    @include muted(var(--font-xs));
  }

  &__intro {
    margin-bottom: 1.25rem;
    @include muted(var(--font-sm));
  }

  &__filters {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-3);
    margin-bottom: var(--space-4);
  }

  &__search { max-width: 20rem; }
  &__select { max-width: 10rem; }

  &__loading {
    display: flex;
    justify-content: center;
    padding: var(--space-8) 0;
  }
}
</style>
