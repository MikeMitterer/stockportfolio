<script setup lang="ts">
import { usePortfolioCurrency } from '@/composables/usePortfolioCurrency'
import { computed, inject, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'
import { NEmpty, NSpin } from 'naive-ui'
import { useAppNotification } from '@/composables/useAppNotification'
import RebalancingPlanTable from '@/components/RebalancingPlanTable.vue'
import RebalancingSummary from '@/components/RebalancingSummary.vue'
import TradeNotice from '@/components/TradeNotice.vue'
import { resolveAmount } from '@/domain/amount'
import { percent } from '@/domain/formatters'
import { positionPrimaryLabel } from '@/domain/positionIdentity'
import { usePortfolioValuation } from '@/composables/usePortfolioValuation'
import FxNotice from '@/components/FxNotice.vue'
import { computeTradePlan, hasTrades, TARGET_DIGITS, targetSumState } from '@/domain/tradePlan'
import { usePortfolioStore } from '@/stores/portfolio'
import { useTradePlanDraftStore } from '@/stores/tradePlanDraft'
import { useSettingsStore } from '@/stores/settings'
import { useQuotesStore } from '@/stores/quotes'
import { useApiStatusStore } from '@/stores/apiStatus'
import { STOCK_INFO_CLIENT, type StockInfoClient } from '@/api/stockinfo/client'

const { t } = useI18n()

const client = inject<StockInfoClient>(STOCK_INFO_CLIENT)

const portfolioStore = usePortfolioStore()
const settingsStore = useSettingsStore()
const quotesStore = useQuotesStore()
const apiStatus = useApiStatusStore()

const ready = computed(() => portfolioStore.loaded && settingsStore.loaded)
const hasHoldings = computed(() => portfolioStore.hasHoldings)

const { result, fx, retryFx } = usePortfolioValuation()

onMounted(async () => {
  if (!portfolioStore.loaded) await portfolioStore.load()
  if (!settingsStore.loaded) await settingsStore.load(portfolioStore.portfolio?.id ?? '')
  await quotesStore.hydrate()
  // Mit Schonfrist — siehe `loadQuotesIfStale` — und erst nach dem
  // Health-Check: Gegen einen toten Dienst zu laden kostet je Position eine
  // Zeitüberschreitung und meldet hinterher fehlende Kurse.
  if (settingsStore.settings.refresh.autoOnLoad && client) {
    const state = await apiStatus.ensureChecked(
      client,
      settingsStore.settings.refresh.staleAfterMinutes,
    )
    if (state !== 'offline') {
      await quotesStore.loadQuotesIfStale(
        client,
        portfolioStore.positions,
        settingsStore.settings.refresh.staleAfterMinutes,
      )
    }
  }
})

// ─── Der Plan ───────────────────────────────────────────────────────────────

/**
 * Geplante Stückzahlen und probeweise Ziele — leben nur in diesem Tab.
 *
 * Das Rebalancing ist eine Simulation. Ins Depot wandert eine Zieländerung
 * erst, wenn die Trades wirklich durch sind; das macht man dann selbst im
 * Dashboard. Bis dahin darf hier nichts am Bestand oder am Ziel hängen bleiben.
 * Der Plan liegt im Store, damit er einen Abstecher auf die Methodenseite
 * übersteht; Depotwechsel und Bestandsänderungen hält der Store selbst nach.
 */
const draft = useTradePlanDraftStore()
const { trades, targets } = storeToRefs(draft)

const plan = computed(() => {
  const portfolio = portfolioStore.portfolio
  if (!portfolio || !result.value) return null
  return computeTradePlan(
    result.value.rows,
    trades.value,
    result.value.total,
    settingsStore.settings.bands,
    result.value.liquidity.securityBuffer,
    {
      targets: targets.value,
      minTrade: resolveAmount(
        portfolioStore.portfolio?.amountSettings?.minTradeSize ??
          settingsStore.settings.minTradeSize,
        result.value.total,
      ),
      trigger: settingsStore.settings.rebalancing.trigger,
      due: result.value.schedule.due,
    },
  )
})

const planHasEntries = computed(
  () => hasTrades(trades.value) || Object.keys(targets.value).length > 0,
)

/**
 * Zielsumme weicht von 100 % ab — Meldung und Fußzeile folgen derselben
 * Regel aus `targetSumState` (T-97).
 *
 * Nie im leeren Depot: Dort ist die Summe naturgemäß 0, und eine Warnung
 * darüber wäre die erste Meldung, die ein neuer Nutzer zu sehen bekäme — für
 * einen Zustand, den er gar nicht herbeigeführt hat.
 */
const targetSumOff = computed(
  () =>
    hasHoldings.value && plan.value !== null && targetSumState(plan.value.targetSum) !== 'balanced',
)

const { clear: clearPlan } = draft

/** Bestand einer Position jetzt; der Plan merkt ihn sich beim ersten Eintrag. */
function unitsOf(positionId: string): number {
  return (
    portfolioStore.portfolio?.positions.find((position) => position.id === positionId)?.units ?? 0
  )
}

function setTrade(positionId: string, units: number): void {
  draft.setTrade(positionId, units, unitsOf(positionId))
}

function setTarget(positionId: string, targetPercent: number): void {
  draft.setTarget(positionId, targetPercent, unitsOf(positionId))
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
      label: positionPrimaryLabel(row.current),
      units: row.coverageUnits as number,
    }))
})

// ─── Meldungen ──────────────────────────────────────────────────────────────
//
// Als Toast, nicht im Seitenfluss: Über der Tabelle schoben die Meldungen sie
// beim Tippen nach unten, unter der Tabelle waren sie im kleinen Fenster
// außer Sicht. Der Toast bleibt sichtbar, solange die Ursache besteht.

/*
 * Über `useAppNotification` wie die übrigen Ansichten, nicht über
 * `useStateNotification` direkt: Anzeigedauer und Restzeit-Text stehen dort
 * einmal. Vorher lag beides hier ein zweites Mal — und die Restzeit fehlte,
 * seit das Fundament sie verlangt.
 */
const { notify } = useAppNotification()

notify(
  computed(() => plan.value?.underfunded ?? false),
  {
    title: t('rebalancing.underfundedTitle'),
    type: 'error',
    content: () =>
      t('rebalancing.underfundedBody', { amount: formatMoney(-(plan.value?.netCashFlow ?? 0)) }),
  },
)

notify(targetSumOff, {
  title: t('rebalancing.targetSumTitle'),
  type: 'warning',
  content: () =>
    t('rebalancing.targetSumBody', { sum: percent(plan.value?.targetSum ?? 0, TARGET_DIGITS) }),
})

notify(
  computed(() => plan.value?.bufferBreached ?? false),
  {
    title: t('rebalancing.bufferTitle'),
    type: 'warning',
    content: () =>
      t('rebalancing.bufferBody', {
        liquid: formatMoney(plan.value?.liquidAfter ?? 0),
        buffer: formatMoney(result.value?.liquidity.securityBuffer ?? 0),
      }),
  },
)

const { formatMoney } = usePortfolioCurrency()
</script>

<template>
  <div class="reb">
    <div class="reb__workspace" role="region" :aria-label="t('nav.rebalancing')" tabindex="0">
      <FxNotice :result="result" :loading="fx.loading" @retry="retryFx" />
      <div v-if="!ready" class="reb__loading">
        <NSpin size="large" />
      </div>

      <NEmpty v-else-if="!hasHoldings" class="reb__empty" :description="t('rebalancing.empty')" />

      <template v-else-if="plan && result">
        <RebalancingSummary
          :plan="plan"
          :plan-has-entries="planHasEntries"
          :coverage-options="coverageOptions"
          @trade="setTrade"
          @clear="clearPlan"
        />
        <RebalancingPlanTable
          :plan="plan"
          :groups="result.groups"
          :plan-has-entries="planHasEntries"
          @trade="setTrade"
          @target="setTarget"
        />
      </template>
    </div>
    <TradeNotice v-if="ready && hasHoldings && plan && result" />
  </div>
</template>

<style scoped lang="scss">
.reb {
  @include stack(0);

  @include content-frame;

  &__workspace {
    display: grid;
    grid-template-columns: minmax(890px, 1fr);
    gap: var(--space-4);
    // Mike: unter 890 px nicht weiter zusammendrücken, gemeinsam scrollen.
    min-width: 0;
    overflow-x: auto;

    @include up(md) {
      gap: var(--space-6);
    }
  }

  &__loading {
    @include row(0);

    justify-content: center;
    padding: var(--space-8) 0;
  }

  &__empty {
    padding: var(--space-8) 0;
  }
}
</style>
