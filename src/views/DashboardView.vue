<script setup lang="ts">
import { computed, inject, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { NDivider, NSpin, NAlert, NEmpty, NButton } from 'naive-ui'
import KpiCard from '@/components/KpiCard.vue'
import GroupBar from '@/components/GroupBar.vue'
import PositionsTable from '@/components/PositionsTable.vue'
import { eur, eurSigned, percent } from '@/domain/formatters'
import { computeRebalancing } from '@/domain/rebalancing'
import AddPositionDialog from '@/components/AddPositionDialog.vue'
import TargetAllocationBar from '@/components/TargetAllocationBar.vue'
import PositionCardList from '@/components/PositionCardList.vue'
import { useIsCompact } from '@/composables/useIsCompact'
import { usePortfolioStore } from '@/stores/portfolio'
import { useSettingsStore } from '@/stores/settings'
import { useQuotesStore } from '@/stores/quotes'
import { useInstrumentsStore } from '@/stores/instruments'
import { newId } from '@/db/seed'
import { STOCK_INFO_CLIENT, type StockInfoClient } from '@/api/client'
import type { InstrumentSummary } from '@/api/types'
import type { AssetGroup, Position } from '@/types/portfolio'

const { t } = useI18n()

const client = inject<StockInfoClient>(STOCK_INFO_CLIENT)
if (!client) throw new Error('StockInfoClient wurde nicht bereitgestellt')

const portfolioStore = usePortfolioStore()
const settingsStore = useSettingsStore()
const quotesStore = useQuotesStore()
const instrumentsStore = useInstrumentsStore()

// Unter 768 px tritt die Leseansicht an die Stelle der Tabelle.
const isCompact = useIsCompact()

const loading = computed(() => quotesStore.loading)
const failures = computed(() => quotesStore.failures)

const ready = computed(() => portfolioStore.loaded && settingsStore.loaded)
const hasHoldings = computed(() => portfolioStore.hasHoldings)

const demoLoading = ref<boolean>(false)

/** Lädt das Beispiel-Depot und holt gleich die passenden Kurse. */
async function onLoadDemo(): Promise<void> {
  demoLoading.value = true
  try {
    await portfolioStore.loadDemo()
    await settingsStore.setActivePortfolio(portfolioStore.portfolio?.id ?? '')
    if (client) await quotesStore.loadQuotes(client, portfolioStore.positions)
  } finally {
    demoLoading.value = false
  }
}

const result = computed(() => {
  const portfolio = portfolioStore.portfolio
  if (!portfolio) return null
  return computeRebalancing(portfolio, quotesStore.quotes, settingsStore.settings)
})

const liquidityTone = computed<'positive' | 'warning' | 'danger'>(() => {
  const buffer = result.value?.liquidity.investmentReserve ?? 0
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

// ─── Position hinzufügen ──────────────────────────────────────────────────

const showAddDialog = ref<boolean>(false)

/** Schlüssel der bereits enthaltenen Papiere — verhindert Dubletten. */
const existingKeys = computed(() =>
  portfolioStore.positions
    .filter((position) => position.group !== 'cash')
    .map((position) => position.isin ?? position.symbol),
)

/** Noch nicht vergebener Ziel-Anteil. */
const remainingTargetPercent = computed(() => {
  const assigned = portfolioStore.positions.reduce(
    (sum, position) => sum + position.targetPercent,
    0,
  )
  return Math.max(0, 100 - assigned)
})

async function openAddDialog(): Promise<void> {
  if (!instrumentsStore.loaded && client) await instrumentsStore.load(client)
  showAddDialog.value = true
}

async function onAddPosition(payload: {
  instrument: InstrumentSummary
  units: number
  targetPercent: number
  group: AssetGroup
}): Promise<void> {
  const { instrument, units, targetPercent, group } = payload

  await portfolioStore.addPosition({
    id: newId(),
    isin: instrument.isin,
    symbol: instrument.symbol,
    // Gattung mitschreiben — sie entscheidet später über die externen Verweise.
    kind: instrument.type === 'etf' || instrument.type === 'stock' ? instrument.type : null,
    displayName: instrument.name ?? instrument.symbol,
    group,
    units,
    targetPercent,
    enabled: true,
  })

  if (client) await quotesStore.loadQuotes(client, portfolioStore.positions)
}

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

  // Ältere Positionen kennen ihre Gattung nicht — jetzt, wo die Kurse da
  // sind, lässt sie sich ableiten und dauerhaft festhalten.
  await portfolioStore.backfillKinds(quotesStore.quotes)
})

watch(groupsCollapsed, (collapsed) => {
  localStorage.setItem(GROUPS_COLLAPSED_KEY, collapsed ? '1' : '0')
})

function toggleGroups(): void {
  groupsCollapsed.value = !groupsCollapsed.value
}
</script>

<template>
  <div class="max-w-[1400px] mx-auto px-4 md:px-6 py-4 md:py-6 flex flex-col gap-4 md:gap-6">
    <!-- Erst-Ladezustand -->
    <div v-if="!ready" class="flex items-center justify-center py-24">
      <NSpin size="large" />
    </div>

    <!--
      Leeres Depot: kein Rebalancing möglich, aber auch keine Sackgasse —
      das Beispiel-Depot lässt die App ausprobieren, ohne dass jemand
      fremde Bestände für die eigenen hält.
    -->
    <NEmpty v-else-if="!hasHoldings" class="py-24" description="Noch keine Wertpapiere im Depot">
      <template #extra>
        <div class="flex flex-col items-center gap-3">
          <p class="text-xs text-ink-muted max-w-sm text-center leading-relaxed">
            Lege deine erste Position an — oder lade ein Beispiel-Depot, um die
            App auszuprobieren.
          </p>
          <div class="flex items-center gap-2">
            <NButton size="small" type="primary" @click="openAddDialog">
              {{ t('actions.addPosition') }}
            </NButton>
            <NButton size="small" secondary :loading="demoLoading" @click="onLoadDemo">
              Beispiel-Depot laden
            </NButton>
          </div>
        </div>
      </template>
    </NEmpty>

    <template v-else-if="result">
      <!-- Fehler-Banner bei fehlgeschlagenen Kursen -->
      <NAlert v-if="failures.length > 0" type="warning" :bordered="false" closable>
        {{ failures.length }} Kurs(e) konnten nicht geladen werden — {{ failureSummary }}
      </NAlert>

      <!-- Kennzahlen -->
      <section class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard :label="t('kpi.total')" :value="eur(result.total)" />
        <KpiCard
          :label="t('kpi.investmentReserve')"
          :value="eurSigned(result.liquidity.investmentReserve)"
          :hint="t('kpi.investmentReserveHint')"
          :tone="liquidityTone"
        />
        <KpiCard
          :label="t('kpi.investmentReservePercent')"
          :value="percent(result.liquidity.investmentReservePercent)"
          :hint="t('kpi.securityBufferHint', { buffer: eur(result.liquidity.securityBuffer) })"
        />
        <KpiCard :label="t('kpi.warnings')" :value="warningsValue" :tone="warningsTone" />
      </section>

      <!--
        Gruppen-Balken (ein-/ausklappbar). Auf schmalen Bildschirmen
        ausgeblendet: die Gruppen-Trenner der Kartenliste zeigen dieselben
        Zahlen, und die Balkenzeile bräuchte hier acht Spalten Platz.
      -->
      <section class="hidden md:block border-t border-edge">
        <button
          type="button"
          class="w-full flex items-center gap-2 py-2.5 text-left text-ink-secondary hover:text-ink transition-colors"
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
              :class="group.suggestion === 'ok' ? 'text-ink-muted' : 'text-status-near'"
            >
              {{ t(`groups.${group.group}`) }} {{ percent(group.actualPercent) }}
            </span>
          </span>
        </button>

        <div
          v-show="!groupsCollapsed"
          id="dashboard-groups-panel"
          class="pb-4 flex flex-col divide-y divide-edge-subtle"
        >
          <GroupBar v-for="group in result.groups" :key="group.group" :group="group" />
        </div>
      </section>

      <!-- Positionen -->
      <section
        class="rounded-xl border border-edge bg-card overflow-hidden"
      >
        <div class="px-4 md:px-5 py-3 md:py-4 flex items-center justify-between gap-4 flex-wrap">
          <h2
            class="text-xs uppercase tracking-wide text-ink-secondary font-medium"
          >
            {{ isCompact ? 'Positionen' : 'Positionen — Bestand und Ziel sind direkt änderbar' }}
          </h2>
          <div class="flex items-center gap-5">
            <TargetAllocationBar
              v-if="!isCompact"
              :sum="result.targetPercentSum"
              :exceeded="result.targetsExceeded"
            />
            <div class="text-xs text-ink-muted tabular-nums">
              Bänder: −{{ percent(settingsStore.settings.bands.lowerPercent) }} / +{{
                percent(settingsStore.settings.bands.upperPercent)
              }}
              <span v-if="loading" class="ml-2">· lädt …</span>
            </div>
            <NButton v-if="!isCompact" size="tiny" secondary @click="openAddDialog">
              {{ t('actions.addPosition') }}
            </NButton>
          </div>
        </div>

        <NAlert v-if="result.targetsExceeded" type="error" :bordered="false" class="mx-5 mb-3">
          Die Ziel-Anteile summieren sich auf {{ percent(result.targetPercentSum) }} — mehr
          als 100 %. Solange das so ist, sind die Kauf- und Verkaufsvorschläge nicht
          schlüssig.
        </NAlert>
        <NDivider class="!my-0" />
        <PositionCardList
          v-if="isCompact"
          :rows="result.rows"
          :groups="result.groups"
          :bands="settingsStore.settings.bands"
        />

        <PositionsTable
          v-else
          :rows="result.rows"
          :groups="result.groups"
          :bands="settingsStore.settings.bands"
          :total="result.total"
          :targets-exceeded="result.targetsExceeded"
          :links="settingsStore.settings.links"
          @update="onUpdate"
          @apply-trade="onApplyTrade"
          @remove="onRemove"
          @refresh="onRefreshOne"
        />
      </section>
    </template>

    <AddPositionDialog
      v-model:show="showAddDialog"
      :available="instrumentsStore.allowedInstruments"
      :existing-keys="existingKeys"
      :remaining-target-percent="remainingTargetPercent"
      @add="onAddPosition"
    />
  </div>
</template>
