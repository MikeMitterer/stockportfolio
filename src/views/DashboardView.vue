<script setup lang="ts">
import { computed, inject, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { NDivider, NSpin, NAlert, NEmpty } from 'naive-ui'
import KpiCard from '@/components/KpiCard.vue'
import GroupBar from '@/components/GroupBar.vue'
import PositionsTable from '@/components/PositionsTable.vue'
import { eur, eurSigned, percent } from '@/domain/formatters'
import { computeRebalancing } from '@/domain/rebalancing'
import { usePortfolioStore } from '@/stores/portfolio'
import { useSettingsStore } from '@/stores/settings'
import { useQuotesStore } from '@/stores/quotes'
import { STOCK_INFO_CLIENT, type StockInfoClient } from '@/api/client'
import type { Position } from '@/types/portfolio'

const { t } = useI18n()

const client = inject<StockInfoClient>(STOCK_INFO_CLIENT)
if (!client) throw new Error('StockInfoClient wurde nicht bereitgestellt')

const portfolioStore = usePortfolioStore()
const settingsStore = useSettingsStore()
const quotesStore = useQuotesStore()

const loading = computed(() => quotesStore.loading)
const failures = computed(() => quotesStore.failures)

const ready = computed(() => portfolioStore.loaded && settingsStore.loaded)
const hasPositions = computed(() => portfolioStore.positions.length > 0)

const result = computed(() => {
  const portfolio = portfolioStore.portfolio
  if (!portfolio) return null
  return computeRebalancing(portfolio, quotesStore.quotes, settingsStore.settings)
})

const targetReserveHint = computed(() =>
  t('kpi.targetReserveHint', { percent: settingsStore.settings.investmentReservePercent }),
)

const liquidityTone = computed<'positive' | 'warning' | 'danger'>(() => {
  const buffer = result.value?.liquidity.liquidBuffer ?? 0
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

// ─── Editier-Aktionen — gehen an den Store, der sofort persistiert ─────────

async function onUpdate(id: string, changes: Partial<Position>): Promise<void> {
  await portfolioStore.updatePosition(id, changes)
  // Änderungen an ISIN/Symbol würden einen neuen Kurs erfordern; Bestand,
  // Ziel und Anzeige-Felder nicht — daher kein Reload hier.
}

async function onApplyTrade(id: string, tradeUnits: number): Promise<void> {
  await portfolioStore.applyTrade(id, tradeUnits)
}

async function onRemove(id: string): Promise<void> {
  await portfolioStore.removePosition(id)
}

async function onRefreshOne(id: string): Promise<void> {
  const position = portfolioStore.positions.find((entry) => entry.id === id)
  if (position && client) await quotesStore.refreshOne(client, position)
}

// ─── Assetklassen-Block ein-/ausklappbar ──────────────────────────────────

const GROUPS_COLLAPSED_KEY = 'stockportfolio.dashboard.groupsCollapsed'
const groupsCollapsed = ref<boolean>(false)

onMounted(async () => {
  const stored = localStorage.getItem(GROUPS_COLLAPSED_KEY)
  if (stored === '1' || stored === '0') {
    groupsCollapsed.value = stored === '1'
  }

  await portfolioStore.load()
  await settingsStore.load(portfolioStore.portfolio?.id ?? '')

  // Zuerst den persistierten Cache zeigen, dann im Hintergrund aktualisieren.
  await quotesStore.hydrate()

  if (settingsStore.settings.refresh.autoOnLoad && client) {
    await quotesStore.loadQuotes(client, portfolioStore.positions)
  }
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
    <!-- Erst-Ladezustand -->
    <div v-if="!ready" class="flex items-center justify-center py-24">
      <NSpin size="large" />
    </div>

    <NEmpty v-else-if="!hasPositions" class="py-24" description="Noch keine Positionen">
      <template #extra>
        <span class="text-xs text-neutral-500">
          Der Add-Position-Dialog kommt in T-10.
        </span>
      </template>
    </NEmpty>

    <template v-else-if="result">
      <!-- Fehler-Banner bei fehlgeschlagenen Kursen -->
      <NAlert v-if="failures.length > 0" type="warning" :bordered="false" closable>
        {{ failures.length }} Kurs(e) konnten nicht geladen werden — {{ failureSummary }}
      </NAlert>

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
      <section class="border-t border-neutral-200 dark:border-neutral-800">
        <button
          type="button"
          class="w-full flex items-center gap-2 py-2.5 text-left text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors"
          :aria-expanded="!groupsCollapsed"
          aria-controls="dashboard-groups-panel"
          @click="toggleGroups"
        >
          <svg
            class="w-3.5 h-3.5 transition-transform"
            :class="{ '-rotate-90': groupsCollapsed }"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            aria-hidden="true"
          >
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 9l6 6 6-6" />
          </svg>
          <h2 class="text-xs uppercase tracking-wide font-medium">Assetklassen</h2>

          <!-- Eingeklappt: kompakte Zusammenfassung statt leerer Fläche -->
          <span
            v-if="groupsCollapsed"
            class="ml-auto flex items-center gap-3 text-xs tabular-nums"
          >
            <span
              v-for="group in result.groups"
              :key="group.group"
              class="hidden sm:inline"
              :class="group.suggestion === 'ok' ? 'text-neutral-500' : 'text-amber-500'"
            >
              {{ t(`groups.${group.group}`) }} {{ percent(group.actualPercent) }}
            </span>
          </span>
        </button>

        <div
          v-show="!groupsCollapsed"
          id="dashboard-groups-panel"
          class="pb-4 flex flex-col divide-y divide-neutral-200/50 dark:divide-neutral-800/50"
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
            Bänder: −{{ percent(settingsStore.settings.bands.lowerPercent) }} / +{{
              percent(settingsStore.settings.bands.upperPercent)
            }}
            <span v-if="loading" class="ml-2">· lädt …</span>
          </div>
        </div>
        <NDivider class="!my-0" />
        <PositionsTable
          :rows="result.rows"
          :groups="result.groups"
          :bands="settingsStore.settings.bands"
          :total="result.total"
          @update="onUpdate"
          @apply-trade="onApplyTrade"
          @remove="onRemove"
          @refresh="onRefreshOne"
        />
      </section>
    </template>
  </div>
</template>
