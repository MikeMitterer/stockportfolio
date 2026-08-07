<script setup lang="ts">
import { computed, inject, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { NDivider, NSpin, NAlert } from 'naive-ui'
import KpiCard from '@/components/KpiCard.vue'
import GroupBar from '@/components/GroupBar.vue'
import PositionsTable from '@/components/PositionsTable.vue'
import { eur, eurSigned, percent } from '@/domain/formatters'
import { computeRebalancing } from '@/domain/rebalancing'
import { MOCK_PORTFOLIO, MOCK_SETTINGS } from '@/mock/portfolio'
import { useSharedQuotes } from '@/composables/useSharedQuotes'
import { STOCK_INFO_CLIENT, type StockInfoClient } from '@/api/client'

const { t } = useI18n()

const client = inject<StockInfoClient>(STOCK_INFO_CLIENT)
if (!client) throw new Error('StockInfoClient wurde nicht bereitgestellt')

const { quotes, loading, failures, loadQuotes } = useSharedQuotes(client)

// Positionen kommen in T-05 aus IndexedDB — bis dahin aus dem Mock.
const portfolio = computed(() => MOCK_PORTFOLIO)

const result = computed(() =>
  computeRebalancing(portfolio.value, quotes.value, MOCK_SETTINGS),
)

const hasQuotes = computed(() => quotes.value.size > 0)

const targetReserveHint = computed(() =>
  t('kpi.targetReserveHint', { percent: MOCK_SETTINGS.investmentReservePercent }),
)

const liquidityTone = computed<'positive' | 'warning' | 'danger'>(() => {
  const buffer = result.value.liquidity.liquidBuffer
  if (buffer >= 0) return 'positive'
  if (buffer > -50_000) return 'warning'
  return 'danger'
})

const warningsValue = computed(() =>
  failures.value.length === 0 ? t('kpi.warningsNone') : String(failures.value.length),
)

const warningsTone = computed<'positive' | 'danger'>(() =>
  failures.value.length === 0 ? 'positive' : 'danger',
)

const failureSummary = computed(() =>
  failures.value.map((failure) => `${failure.symbol}: ${failure.reason}`).join(' · '),
)

const GROUPS_COLLAPSED_KEY = 'stockportfolio.dashboard.groupsCollapsed'
const groupsCollapsed = ref<boolean>(false)

onMounted(() => {
  const stored = localStorage.getItem(GROUPS_COLLAPSED_KEY)
  if (stored === '1' || stored === '0') {
    groupsCollapsed.value = stored === '1'
  }
  void loadQuotes(portfolio.value.positions)
})

watch(groupsCollapsed, (collapsed) => {
  localStorage.setItem(GROUPS_COLLAPSED_KEY, collapsed ? '1' : '0')
})

function toggleGroups(): void {
  groupsCollapsed.value = !groupsCollapsed.value
}
</script>

<template>
  <div class="max-w-[1400px] mx-auto px-6 py-6 flex flex-col gap-6">
    <!-- Fehler-Banner bei fehlgeschlagenen Kursen -->
    <NAlert v-if="failures.length > 0" type="warning" :bordered="false" closable>
      {{ failures.length }} Kurs(e) konnten nicht geladen werden — {{ failureSummary }}
    </NAlert>

    <!-- Erst-Ladezustand -->
    <div v-if="loading && !hasQuotes" class="flex items-center justify-center py-24">
      <NSpin size="large" />
    </div>

    <template v-else>
      <!-- KPI-Row -->
      <section class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard :label="t('kpi.total')" :value="eur(result.total)" />
        <KpiCard
          :label="t('kpi.liquidBuffer')"
          :value="eurSigned(result.liquidity.liquidBuffer)"
          :hint="t('kpi.liquidBufferHint')"
          :tone="liquidityTone"
        />
        <KpiCard
          :label="t('kpi.targetReserve')"
          :value="eur(result.liquidity.targetReserveEuro)"
          :hint="targetReserveHint"
        />
        <KpiCard :label="t('kpi.warnings')" :value="warningsValue" :tone="warningsTone" />
      </section>

      <!-- Gruppen-Balken (ein-/ausklappbar) -->
      <section
        class="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden"
      >
        <button
          type="button"
          class="w-full flex items-center gap-2 px-5 py-4 text-left hover:bg-neutral-100/50 dark:hover:bg-neutral-800/40 transition-colors"
          :aria-expanded="!groupsCollapsed"
          aria-controls="dashboard-groups-panel"
          @click="toggleGroups"
        >
          <svg
            class="w-4 h-4 text-neutral-500 transition-transform"
            :class="{ '-rotate-90': groupsCollapsed }"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            aria-hidden="true"
          >
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 9l6 6 6-6" />
          </svg>
          <h2
            class="text-xs uppercase tracking-wide text-neutral-500 dark:text-neutral-400 font-medium"
          >
            Assetklassen
          </h2>
          <span v-if="groupsCollapsed" class="ml-auto text-xs text-neutral-500 tabular-nums">
            {{ result.groups.length }} Gruppen
          </span>
        </button>

        <div
          v-show="!groupsCollapsed"
          id="dashboard-groups-panel"
          class="px-5 pb-4 flex flex-col divide-y divide-neutral-200/50 dark:divide-neutral-800/50 border-t border-neutral-200/50 dark:border-neutral-800/50"
        >
          <GroupBar v-for="group in result.groups" :key="group.group" :group="group" />
        </div>
      </section>

      <!-- Positionen -->
      <section
        class="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden"
      >
        <div class="px-5 py-4 flex items-baseline justify-between">
          <h2
            class="text-xs uppercase tracking-wide text-neutral-500 dark:text-neutral-400 font-medium"
          >
            Positionen — Klick auf eine Zeile öffnet Details
          </h2>
          <div class="text-xs text-neutral-500 tabular-nums">
            Bänder: −{{ percent(MOCK_SETTINGS.bands.lowerPercent) }} / +{{
              percent(MOCK_SETTINGS.bands.upperPercent)
            }}
          </div>
        </div>
        <NDivider class="!my-0" />
        <PositionsTable :rows="result.rows" :bands="MOCK_SETTINGS.bands" :total="result.total" />
      </section>
    </template>
  </div>
</template>
