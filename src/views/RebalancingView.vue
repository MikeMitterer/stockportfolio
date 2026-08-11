<script setup lang="ts">
import { computed, inject, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { NButton, NEmpty, NSpin, NTooltip, useNotification } from 'naive-ui'
import DeltaBar from '@/components/DeltaBar.vue'
import InlineNumber from '@/components/InlineNumber.vue'
import SuggestionBadge from '@/components/SuggestionBadge.vue'
import { assetColor } from '@/domain/assetColors'
import { eur, eurCent, eurSigned, integer, percent, percentSigned } from '@/domain/formatters'
import { computeRebalancing, type GroupResult } from '@/domain/rebalancing'
import {
  computeTradePlan,
  hasTrades,
  type TargetMap,
  type TradeMap,
} from '@/domain/tradePlan'
import { usePortfolioStore } from '@/stores/portfolio'
import { useSettingsStore } from '@/stores/settings'
import { useQuotesStore } from '@/stores/quotes'
import { useStateNotification } from '@/composables/useStateNotification'
import { STOCK_INFO_CLIENT, type StockInfoClient } from '@/api/client'
import type { AssetGroup } from '@/types/portfolio'

const { t } = useI18n()

const client = inject<StockInfoClient>(STOCK_INFO_CLIENT)

const portfolioStore = usePortfolioStore()
const settingsStore = useSettingsStore()
const quotesStore = useQuotesStore()

const ready = computed(() => portfolioStore.loaded && settingsStore.loaded)
const hasHoldings = computed(() => portfolioStore.hasHoldings)

const result = computed(() => {
  const portfolio = portfolioStore.portfolio
  if (!portfolio) return null
  return computeRebalancing(portfolio, quotesStore.quotes, settingsStore.settings)
})

onMounted(async () => {
  if (!portfolioStore.loaded) await portfolioStore.load()
  if (!settingsStore.loaded) await settingsStore.load(portfolioStore.portfolio?.id ?? '')
  await quotesStore.hydrate()
  if (settingsStore.settings.refresh.autoOnLoad && client) {
    await quotesStore.loadQuotes(client, portfolioStore.positions)
  }
})

// ─── Der Plan ───────────────────────────────────────────────────────────────

const trades = ref<TradeMap>({})

/**
 * Probeweise Ziele — leben nur in diesem Tab.
 *
 * Das Rebalancing ist eine Simulation. Ins Depot wandert eine Zieländerung
 * erst, wenn die Trades wirklich durch sind; das macht man dann selbst im
 * Dashboard. Bis dahin darf hier nichts am Bestand oder am Ziel hängen bleiben.
 */
const targets = ref<TargetMap>({})

const plan = computed(() => {
  const portfolio = portfolioStore.portfolio
  if (!portfolio || !result.value) return null
  return computeTradePlan(
    result.value.rows,
    trades.value,
    result.value.total,
    settingsStore.settings.bands,
    result.value.liquidity.securityBuffer,
    targets.value,
  )
})

const planHasEntries = computed(
  () => hasTrades(trades.value) || Object.keys(targets.value).length > 0,
)

/** Weichen die probeweisen Ziele in Summe von 100 % ab? */
/**
 * Weichen die Ziele in Summe von 100 % ab?
 *
 * Nicht im leeren Depot: Dort ist die Summe naturgemäß 0, und eine Warnung
 * darüber wäre die erste Meldung, die ein neuer Nutzer zu sehen bekäme — für
 * einen Zustand, den er gar nicht herbeigeführt hat.
 */
const targetSumOff = computed(
  () => hasHoldings.value && plan.value !== null && Math.abs(plan.value.targetSum - 100) > 0.01,
)

function setTrade(positionId: string, units: number): void {
  trades.value = { ...trades.value, [positionId]: units }
}

function setTarget(positionId: string, targetPercent: number): void {
  targets.value = { ...targets.value, [positionId]: targetPercent }
}

function clearPlan(): void {
  trades.value = {}
  targets.value = {}
}

/**
 * Liquide Zeilen, die die offene Lücke schließen könnten.
 *
 * Leer, sobald der Plan gedeckt ist — dann gibt es nichts zu entscheiden.
 */
const coverageOptions = computed<{ id: string; label: string; units: number }[]>(() => {
  if (!plan.value) return []
  return plan.value.rows
    .filter((row) => row.coverageUnits !== null)
    .map((row) => ({
      id: row.current.position.id,
      label:
        row.current.position.group === 'cash'
          ? row.current.position.displayName
          : row.current.position.symbol,
      units: row.coverageUnits as number,
    }))
})

// ─── Meldungen ──────────────────────────────────────────────────────────────
//
// Als Toast, nicht im Seitenfluss: Über der Tabelle schoben die Meldungen sie
// beim Tippen nach unten, unter der Tabelle waren sie im kleinen Fenster
// außer Sicht. Der Toast bleibt sichtbar, solange die Ursache besteht.

const notification = useNotification()

/** Zähler aus den Einstellungen; 0 lässt Meldungen stehen. */
const notificationSeconds = computed(() => settingsStore.settings.ui.notificationSeconds)

useStateNotification(
  notification,
  computed(() => plan.value?.underfunded ?? false),
  {
    title: t('rebalancing.underfundedTitle'),
    type: 'error',
    seconds: notificationSeconds,
    content: () =>
      t('rebalancing.underfundedBody', { amount: eur(-(plan.value?.netCashFlow ?? 0)) }),
  },
)

useStateNotification(notification, targetSumOff, {
  title: t('rebalancing.targetSumTitle'),
  type: 'warning',
  seconds: notificationSeconds,
  content: () => t('rebalancing.targetSumBody', { sum: percent(plan.value?.targetSum ?? 0) }),
})

useStateNotification(
  notification,
  computed(() => plan.value?.bufferBreached ?? false),
  {
    title: t('rebalancing.bufferTitle'),
    type: 'warning',
    seconds: notificationSeconds,
    content: () =>
      t('rebalancing.bufferBody', {
        liquid: eur(plan.value?.liquidAfter ?? 0),
        buffer: eur(result.value?.liquidity.securityBuffer ?? 0),
      }),
  },
)

// ─── Gliederung nach Assetklasse ────────────────────────────────────────────

interface RenderedGroup {
  group: GroupResult
  rows: NonNullable<typeof plan.value>['rows']
}

const groupedRows = computed<RenderedGroup[]>(() => {
  const currentPlan = plan.value
  const currentResult = result.value
  if (!currentPlan || !currentResult) return []

  return currentResult.groups
    .map((group) => ({
      group,
      rows: currentPlan.rows.filter((row) => row.current.position.group === group.group),
    }))
    .filter((entry) => entry.rows.length > 0)
})

function bandColor(group: AssetGroup): string {
  return `color-mix(in srgb, ${assetColor(group)} 7%, transparent)`
}

/**
 * Abweichung vom Ziel, für die Anzeige: „Ziel 10 %, danach 9,5 %" → „−0,5 %".
 *
 * Gemeint sind Prozentpunkte, aber der Zusatz „%-P" stand als Fachkürzel in
 * jeder Zeile, ohne etwas zu klären — die Spaltenüberschrift sagt es bereits.
 */
function deviationLabel(row: NonNullable<typeof plan.value>['rows'][number]): string {
  return percentSigned(row.deviationAfter)
}

/** Kurs je Stück — für die Anzeige in der Zeile. */
function priceOf(row: NonNullable<typeof plan.value>['rows'][number]): number | null {
  if (row.current.position.group === 'cash') return null
  return row.current.quote?.price ?? null
}
</script>

<template>
  <div class="max-w-[1400px] mx-auto px-4 md:px-6 py-4 md:py-6 flex flex-col gap-4 md:gap-6">
    <div v-if="!ready" class="flex items-center justify-center py-24">
      <NSpin size="large" />
    </div>

    <NEmpty
      v-else-if="!hasHoldings"
      class="py-24"
      :description="t('rebalancing.empty')"
    />

    <template v-else-if="plan && result">
      <!--
        Kopf: woher kommt das Geld, wohin geht es.
        Kein abstraktes Budget — jeder eingesetzte Euro muss im Plan aus einem
        Verkauf oder einer Entnahme bei Cash/Geldmarkt stammen.
      -->
      <section class="flex flex-wrap items-end gap-x-8 gap-y-4">
        <div class="flex flex-col gap-0.5">
          <span class="text-[11px] uppercase tracking-wide text-ink-muted">{{ t('rebalancing.freed') }}</span>
          <span class="text-lg font-semibold tabular-nums text-status-ok">
            {{ eur(plan.proceeds) }}
          </span>
          <span class="text-[11px] text-ink-muted">{{ t('rebalancing.freedHint') }}</span>
        </div>

        <div class="flex flex-col gap-0.5">
          <span class="text-[11px] uppercase tracking-wide text-ink-muted">{{ t('rebalancing.spent') }}</span>
          <span class="text-lg font-semibold tabular-nums text-status-out">
            {{ eur(plan.outlay) }}
          </span>
          <span class="text-[11px] text-ink-muted">{{ t('rebalancing.spentHint') }}</span>
        </div>

        <div class="flex flex-col gap-0.5">
          <span class="text-[11px] uppercase tracking-wide text-ink-muted">{{ t('rebalancing.balance') }}</span>
          <span
            class="text-lg font-semibold tabular-nums"
            :class="plan.underfunded ? 'text-status-out' : 'text-ink'"
          >
            {{ eurSigned(plan.netCashFlow) }}
          </span>
          <span class="text-[11px] text-ink-muted">
            <template v-if="!planHasEntries">{{ t('rebalancing.nothingPlanned') }}</template>
            <template v-else-if="plan.underfunded">{{ t('rebalancing.underfunded') }}</template>
            <template v-else-if="Math.abs(plan.netCashFlow) < 0.005">{{ t('rebalancing.balanced') }}</template>
            <template v-else>{{ t('rebalancing.leftOver') }}</template>
          </span>
        </div>

        <!--
          Die Deckungsvorschläge gehören zum Plan als Ganzem, nicht in die
          einzelne Zeile: In der Zelle wuchs die Zeile um den Knopf und schrumpfte
          beim Anklicken wieder — die Tabelle sprang bei jeder Eingabe. Hier
          stehen sie neben der Lücke, die sie schließen sollen, und die feste
          Höhe verhindert auch beim Erscheinen jeden Versatz.
        -->
        <div class="flex flex-col gap-0.5 min-h-[3.75rem]">
          <span class="text-[11px] uppercase tracking-wide text-ink-muted">{{ t('rebalancing.coverFrom') }}</span>
          <div v-if="coverageOptions.length > 0" class="flex flex-wrap items-center gap-1.5 pt-0.5">
            <button
              v-for="option in coverageOptions"
              :key="option.id"
              type="button"
              class="rounded-full border border-edge px-2 py-0.5 text-xs tabular-nums
                     text-accent transition-colors hover:border-accent"
              :title="t('rebalancing.coverTitle', { label: option.label, units: integer(option.units) })"
              @click="setTrade(option.id, option.units)"
            >
              {{ option.label }} {{ integer(option.units) }}
            </button>
          </div>
          <span v-else class="text-sm text-ink-muted pt-1">
            {{ planHasEntries ? t('rebalancing.coverNothing') : t('common.none') }}
          </span>
          <span class="text-[11px] text-ink-muted">{{ t('rebalancing.coverHint') }}</span>
        </div>

        <div class="flex flex-col gap-0.5">
          <span class="text-[11px] uppercase tracking-wide text-ink-muted">
            {{ t('rebalancing.reserve') }}
          </span>
          <span class="text-lg font-semibold tabular-nums">{{ eur(plan.reserveAvailable) }}</span>
          <span class="text-[11px] text-ink-muted">
            {{ t('rebalancing.reserveHint') }}
          </span>
        </div>

        <div class="ml-auto flex items-center gap-3">
          <!--
            Der Plan bucht bewusst nichts. Er dient dem Durchrechnen; die
            Aufträge gibt der Nutzer bei seiner Bank auf und pflegt die
            Bestände danach im Dashboard nach.
          -->
          <span class="text-[11px] text-ink-muted max-w-[16rem] leading-tight">
            {{ t('rebalancing.simulationNote') }}
          </span>
          <NButton size="small" quaternary :disabled="!planHasEntries" @click="clearPlan">
            {{ t('rebalancing.clearPlan') }}
          </NButton>
        </div>
      </section>

      <!-- ─── Der Plan ─────────────────────────────────────────────────── -->
      <section class="rounded-xl border border-edge bg-card overflow-hidden">
        <div class="px-4 md:px-5 py-3 flex items-baseline justify-between gap-4 flex-wrap">
          <h2 class="text-xs uppercase tracking-wide text-ink-muted font-medium">
            {{ t('rebalancing.heading') }}
          </h2>
          <span class="text-xs text-ink-muted tabular-nums">
            {{
              t('rebalancing.bandsLabel', {
                lower: percent(settingsStore.settings.bands.lowerPercent),
                upper: percent(settingsStore.settings.bands.upperPercent),
              })
            }}
          </span>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="text-[11px] uppercase tracking-wide text-ink-muted">
                <th class="text-left font-medium px-4 py-1.5">{{ t('table.symbol') }}</th>
                <th class="text-right font-medium px-2 py-1.5">{{ t('table.units') }}</th>
                <th class="text-right font-medium px-2 py-1.5">{{ t('table.price') }}</th>
                <th class="text-right font-medium px-2 py-1.5">{{ t('table.actualPercent') }}</th>
                <th class="text-right font-medium px-2 py-1.5">{{ t('table.targetPercent') }}</th>
                <th class="text-right font-medium px-2 py-1.5">
                  <NTooltip trigger="hover">
                    <template #trigger>
                      <span class="border-b border-dotted border-ink-muted cursor-help">
                        {{ t('rebalancing.columns.delta') }}
                      </span>
                    </template>
                    <div class="max-w-xs text-sm">
                      {{ t('rebalancing.deltaTooltip') }}
                      <div class="mt-2 text-xs">{{ t('rebalancing.deltaTooltipMore') }}</div>
                    </div>
                  </NTooltip>
                </th>
                <th class="text-right font-medium px-2 py-1.5 w-32">{{ t('rebalancing.columns.trade') }}</th>
                <th class="text-right font-medium px-2 py-1.5 w-28">{{ t('rebalancing.columns.value') }}</th>
                <th class="text-left font-medium px-2 py-1.5 w-56">
                  {{ t('rebalancing.columns.shareAfter') }}
                </th>
                <th class="text-right font-medium px-2 py-1.5">{{ t('rebalancing.columns.deviation') }}</th>
                <th class="text-center font-medium px-4 py-1.5 w-32">{{ t('table.status') }}</th>
              </tr>
            </thead>

            <tbody>
              <template v-for="entry in groupedRows" :key="entry.group.group">
                <tr :style="{ backgroundColor: bandColor(entry.group.group) }">
                  <td colspan="11" class="px-4 py-1">
                    <span class="flex items-center gap-2 text-[11px] uppercase tracking-wider text-ink-muted">
                      <span
                        class="inline-block w-1.5 h-1.5 rounded-full"
                        :style="{ backgroundColor: assetColor(entry.group.group) }"
                        aria-hidden="true"
                      ></span>
                      {{ t(`groups.${entry.group.group}`) }}
                    </span>
                  </td>
                </tr>

                <tr
                  v-for="row in entry.rows"
                  :key="row.current.position.id"
                  class="border-t border-edge-subtle"
                >
                  <td class="px-4 py-1">
                    <div class="font-medium leading-tight">
                      {{
                        row.current.position.group === 'cash'
                          ? row.current.position.displayName
                          : row.current.position.symbol
                      }}
                    </div>
                    <div
                      v-if="row.current.position.group !== 'cash'"
                      class="text-xs text-ink-muted truncate max-w-[14rem]"
                    >
                      {{ row.current.position.displayName }}
                    </div>
                  </td>

                  <td class="px-2 py-1 text-right tabular-nums">
                    {{ integer(row.current.position.units) }}
                  </td>

                  <td class="px-2 py-1 text-right tabular-nums text-ink-secondary">
                    {{ priceOf(row) !== null ? eurCent(priceOf(row)!) : '—' }}
                  </td>

                  <td class="px-2 py-1 text-right tabular-nums text-ink-secondary">
                    {{ percent(row.current.actualPercent) }}
                  </td>

                  <!--
                    Ziel probeweise änderbar — nur in dieser Simulation.
                    Wer eine Position als Geldquelle nutzt, obwohl sie auf Ziel
                    steht, ändert damit seine Aufteilung; ohne angepasstes Ziel
                    stünde die Zeile hinterher dauerhaft auf „Kaufen". Der
                    Punkt markiert den Probewert.
                  -->
                  <td class="px-2 py-1">
                    <div class="flex items-center gap-1">
                      <span
                        class="w-1.5 h-1.5 rounded-full shrink-0"
                        :class="row.targetOverridden ? 'bg-accent' : 'bg-transparent'"
                        :title="
                          row.targetOverridden
                            ? `Probeweise geändert — im Depot steht ${percent(
                              row.current.position.targetPercent,
                            )}`
                            : ''
                        "
                        aria-hidden="true"
                      ></span>
                      <InlineNumber
                        class="flex-1"
                        :value="row.targetPercent"
                        :display="percent(row.targetPercent)"
                        :precision="2"
                        :min="0"
                        :max="100"
                        @commit="
                          (targetPercent: number) =>
                            setTarget(row.current.position.id, targetPercent)
                        "
                      />
                    </div>
                  </td>

                  <!-- Delta bis zum Ziel — per Klick übernehmbar -->
                  <td class="px-2 py-1 text-right">
                    <button
                      v-if="row.deltaUnits !== 0"
                      type="button"
                      class="tabular-nums text-xs underline decoration-dotted"
                      :class="row.deltaUnits > 0 ? 'text-status-ok' : 'text-status-out'"
                      :title="t('rebalancing.adoptDelta')"
                      @click="setTrade(row.current.position.id, row.deltaUnits)"
                    >
                      {{ row.deltaUnits > 0 ? '+' : '' }}{{ integer(row.deltaUnits) }}
                    </button>
                    <span v-else class="text-ink-muted text-xs">—</span>
                  </td>

                  <!-- Die Eingabe -->
                  <td class="px-2 py-1">
                    <InlineNumber
                      :value="row.tradeUnits"
                      :display="row.tradeUnits === 0 ? '—' : integer(row.tradeUnits)"
                      :precision="row.current.position.group === 'cash' ? 2 : 0"
                      :min="-row.current.position.units"
                      :empty-value="0"
                      @commit="(units: number) => setTrade(row.current.position.id, units)"
                    />
                  </td>

                  <td
                    class="px-2 py-1 text-right tabular-nums"
                    :class="
                      row.cashFlow > 0
                        ? 'text-status-ok'
                        : row.cashFlow < 0
                          ? 'text-status-out'
                          : 'text-ink-muted'
                    "
                  >
                    {{ row.cashFlow === 0 ? '—' : eurSigned(row.cashFlow) }}
                  </td>

                  <td class="px-2 py-1">
                    <!--
                      Derselbe Balken wie auf dem Dashboard: Mitte ist das
                      Ziel, statt des Deltas steht der Anteil am Gesamtvermögen
                      daneben.
                    -->
                    <DeltaBar
                      :relative-percent="row.relativeDeviationAfter"
                      :bands="settingsStore.settings.bands"
                      :label="percent(row.percentAfter)"
                      compact
                    />
                  </td>

                  <!--
                    Abweichung vom Ziel nach dem Trade. Das Ziel muss nicht
                    exakt getroffen werden — solange der Anteil im Band liegt,
                    ist der Zustand in Ordnung, deshalb hier gedämpft statt rot.
                  -->
                  <td
                    class="px-2 py-1 text-right tabular-nums"
                    :class="row.inBandAfter ? 'text-ink-muted' : 'text-status-out'"
                    :title="`${percentSigned(row.relativeDeviationAfter)} relativ zum Ziel`"
                  >
                    {{ row.tradeUnits === 0 && row.deviationAfter === 0 ? '—' : deviationLabel(row) }}
                  </td>

                  <td class="px-4 py-1 text-center">
                    <SuggestionBadge :suggestion="row.suggestionAfter" />
                  </td>
                </tr>
              </template>
            </tbody>

            <!-- Bilanz des Plans -->
            <tfoot>
              <tr class="border-t border-edge">
                <td colspan="7" class="px-4 py-2 text-right text-xs uppercase tracking-wide text-ink-muted">
                  {{ t('rebalancing.footerQuestion') }}
                </td>
                <td
                  class="px-2 py-2 text-right tabular-nums font-semibold"
                  :class="
                    Math.abs(plan.netCashFlow) < 0.005 ? 'text-status-ok' : 'text-ink'
                  "
                >
                  {{ eurSigned(plan.netCashFlow) }}
                </td>
                <td class="px-2 py-2 text-xs text-ink-muted" colspan="3">
                  <template v-if="!planHasEntries">{{ t('rebalancing.footerNothing') }}</template>
                  <template v-else-if="Math.abs(plan.netCashFlow) < 0.005">
                    {{ t('rebalancing.footerBalanced') }}
                  </template>
                  <template v-else-if="plan.netCashFlow < 0">
                    {{ t('rebalancing.footerShort', { amount: eur(-plan.netCashFlow) }) }}
                  </template>
                  <template v-else>
                    {{ t('rebalancing.footerLeftOver', { amount: eur(plan.netCashFlow) }) }}
                  </template>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </section>
    </template>
  </div>
</template>
