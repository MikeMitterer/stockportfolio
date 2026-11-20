<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { NTooltip } from 'naive-ui'
import InfoHint from '@/components/InfoHint.vue'
import RebalancingPlanRow from '@/components/RebalancingPlanRow.vue'
import { useStatusHint } from '@/composables/useStatusHint'
import { usePortfolioCurrency } from '@/composables/usePortfolioCurrency'
import { assetColor } from '@/domain/assetColors'
import { percent, percentSigned } from '@/domain/formatters'
import { rowsByGroup } from '@/domain/positionGroups'
import type { GroupResult } from '@/domain/rebalancing'
import { TARGET_DIGITS, targetSumState, type TradePlanResult } from '@/domain/tradePlan'
import { useSettingsStore } from '@/stores/settings'
import type { AssetGroup } from '@/types/portfolio'

/**
 * Tabelle des Rebalancing-Plans nach Assetklassen mit Bilanz in der
 * Fußzeile (aus `RebalancingView.vue` herausgelöst, T-130).
 */
const props = defineProps<{
  plan: TradePlanResult
  groups: GroupResult[]
  planHasEntries: boolean
}>()

const emit = defineEmits<{
  trade: [positionId: string, units: number]
  target: [positionId: string, targetPercent: number]
}>()

const { t } = useI18n()
const statusHint = useStatusHint()
const settingsStore = useSettingsStore()
const { formatMoney, formatMoneySigned } = usePortfolioCurrency()

const groupedRows = computed(() =>
  rowsByGroup(props.groups, props.plan.rows, (row) => row.current.position.group),
)

const sumState = computed(() => targetSumState(props.plan.targetSum))
const balanced = computed(() => Math.abs(props.plan.netCashFlow) < 0.005)

function bandColor(group: AssetGroup): string {
  return `color-mix(in srgb, ${assetColor(group)} 7%, transparent)`
}
</script>

<template>
  <section class="reb__panel">
    <div class="reb__panel-head">
      <h2 class="reb__panel-title">
        {{ t('rebalancing.heading') }}
      </h2>
      <span class="reb__panel-bands tabular-nums">
        {{
          t('rebalancing.bandsLabel', {
            lower: percent(settingsStore.settings.bands.lowerPercent),
            upper: percent(settingsStore.settings.bands.upperPercent),
          })
        }}
      </span>
    </div>

    <div>
      <table class="reb__table">
        <thead>
          <tr class="reb__head">
            <th class="reb__th reb__th--left reb__th--wide">{{ t('table.position') }}</th>
            <th class="reb__th">{{ t('table.units') }}</th>
            <th class="reb__th">
              <!-- Erklärt die Bandkurse unter jedem Kurs; fokussierbar und per Tap erreichbar. -->
              <span class="reb__status-head">
                {{ t('table.price') }}
                <InfoHint
                  :text="t('rebalancing.bandPriceTooltip')"
                  anchor="bands"
                  settings-tab="calc"
                />
              </span>
            </th>
            <th class="reb__th">{{ t('table.actualPercent') }}</th>
            <th class="reb__th">{{ t('table.targetPercent') }}</th>
            <th class="reb__th">
              <NTooltip trigger="hover">
                <template #trigger>
                  <span class="reb__hinted">
                    {{ t('rebalancing.columns.delta') }}
                  </span>
                </template>
                <div class="reb__tooltip">
                  {{ t('rebalancing.deltaTooltip') }}
                  <div class="reb__tooltip-more">{{ t('rebalancing.deltaTooltipMore') }}</div>
                </div>
              </NTooltip>
            </th>
            <th class="reb__th reb__th--w24">
              <NTooltip trigger="hover">
                <template #trigger>
                  <span class="reb__hinted">{{ t('rebalancing.columns.trade') }}</span>
                </template>
                <div class="reb__tooltip">{{ t('rebalancing.tradeTooltip') }}</div>
              </NTooltip>
            </th>
            <th class="reb__th reb__th--w28">{{ t('rebalancing.columns.value') }}</th>
            <th class="reb__th reb__th--left reb__th--w38 reb__band-column">
              <NTooltip trigger="hover">
                <template #trigger>
                  <span class="reb__hinted">{{
                    t('rebalancing.columns.relativeDeviationAfter')
                  }}</span>
                </template>
                <div class="reb__tooltip">
                  {{ t('rebalancing.relativeDeviationTooltip') }}
                </div>
              </NTooltip>
            </th>
            <th class="reb__th">
              <NTooltip trigger="hover">
                <template #trigger>
                  <span class="reb__hinted">{{ t('rebalancing.columns.relativePercent') }}</span>
                </template>
                <div class="reb__tooltip">
                  {{ t('rebalancing.relativeDeviationTooltip') }}
                </div>
              </NTooltip>
            </th>
            <th class="reb__th">
              <NTooltip trigger="hover">
                <template #trigger>
                  <span class="reb__hinted">{{ t('rebalancing.columns.deviation') }}</span>
                </template>
                <div class="reb__tooltip">{{ t('rebalancing.deviationTooltip') }}</div>
              </NTooltip>
            </th>
            <th class="reb__th reb__th--center reb__th--wide reb__th--w32">
              <span class="reb__status-head">
                {{ t('table.status') }}
                <InfoHint :text="statusHint" anchor="bands" settings-tab="calc" />
              </span>
            </th>
          </tr>
        </thead>

        <tbody>
          <template v-for="entry in groupedRows" :key="entry.group.group">
            <tr :style="{ backgroundColor: bandColor(entry.group.group) }">
              <td colspan="12" class="reb__group-cell">
                <span class="reb__group">
                  <span
                    class="reb__group-dot"
                    :style="{ backgroundColor: assetColor(entry.group.group) }"
                    aria-hidden="true"
                  ></span>
                  {{ t(`groups.${entry.group.group}`) }}
                </span>
              </td>
            </tr>

            <RebalancingPlanRow
              v-for="row in entry.rows"
              :key="row.current.position.id"
              :row="row"
              @trade="(positionId, units) => emit('trade', positionId, units)"
              @target="(positionId, targetPercent) => emit('target', positionId, targetPercent)"
            />
          </template>
        </tbody>

        <!-- Bilanz des Plans -->
        <tfoot>
          <tr class="reb__foot">
            <td colspan="4" class="reb__foot-label">
              {{ t('rebalancing.footerQuestion') }}
            </td>
            <!--
            Unter „Ziel %“: Summe und Abweichung zweizeilig statt als
            Tooltip — beim Tippen in die Zielspalte soll die Antwort
            ohne Zeigen direkt darunter stehen, wie die Geldbilanz.
            -->
            <td
              class="reb__foot-value reb__foot-target tabular-nums"
              :class="{
                'reb__flow--in': sumState === 'balanced',
                'reb__flow--out': sumState !== 'balanced',
              }"
            >
              {{ percent(plan.targetSum, TARGET_DIGITS) }}
              <span class="reb__foot-deviation">
                <template v-if="sumState === 'balanced'">{{
                  t('rebalancing.footerTargetsBalanced')
                }}</template>
                <template v-else-if="sumState === 'over'">
                  {{
                    t('rebalancing.footerTargetsOver', {
                      deviation: percentSigned(plan.targetSum - 100, TARGET_DIGITS),
                    })
                  }}
                </template>
                <template v-else>
                  {{
                    t('rebalancing.footerTargetsUnder', {
                      deviation: percentSigned(plan.targetSum - 100, TARGET_DIGITS),
                    })
                  }}
                </template>
              </span>
            </td>
            <td colspan="2"></td>
            <td class="reb__foot-value tabular-nums" :class="balanced ? 'reb__flow--in' : ''">
              {{ formatMoneySigned(plan.netCashFlow) }}
            </td>
            <td class="reb__foot-note" colspan="4">
              <template v-if="!planHasEntries">{{ t('rebalancing.footerNothing') }}</template>
              <template v-else-if="balanced">
                {{ t('rebalancing.footerBalanced') }}
              </template>
              <template v-else-if="plan.netCashFlow < 0">
                {{ t('rebalancing.footerShort', { amount: formatMoney(-plan.netCashFlow) }) }}
              </template>
              <template v-else>
                {{ t('rebalancing.footerLeftOver', { amount: formatMoney(plan.netCashFlow) }) }}
              </template>
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  </section>
</template>

<style scoped lang="scss">
.reb {
  &__panel {
    overflow: hidden;
    border: 1px solid token(--border-default);
    border-radius: 0.75rem;
    background-color: token(--surface-card);
  }

  &__panel-head {
    @include row(var(--space-4), baseline);

    flex-wrap: wrap;
    justify-content: space-between;
    padding: var(--space-3) var(--space-4);

    @include up(md) {
      padding-right: 1.25rem;
      padding-left: 1.25rem;
    }
  }

  &__panel-title {
    font-size: var(--font-xs);
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.025em;
    @include muted(null);
  }

  &__panel-bands {
    @include muted;
  }

  &__table {
    width: 100%;
    font-size: var(--font-sm);
  }

  &__head {
    font-size: 0.6875rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    @include muted(null);
  }

  &__th {
    padding: 0.375rem var(--space-2);
    font-weight: 500;
    text-align: right;

    &--left {
      text-align: left;
    }
    &--center {
      text-align: center;
    }
    &--wide {
      padding-right: var(--space-4);
      padding-left: var(--space-4);
    }
    &--w24 {
      width: 6rem;
    }
    &--w28 {
      width: 7rem;
    }
    &--w32 {
      width: 8rem;
    }
    &--w38 {
      width: 9.5rem;
    }
  }

  &__band-column {
    @include below(xl) {
      display: none;
    }
  }

  &__status-head {
    display: inline-flex;
    align-items: center;
    gap: var(--space-1);
  }

  &__hinted {
    border-bottom: 1px dotted token(--text-muted);
    cursor: help;
    white-space: nowrap;
  }

  &__tooltip {
    max-width: 20rem;
    font-size: var(--font-sm);
  }

  &__tooltip-more {
    margin-top: var(--space-2);
    font-size: var(--font-xs);
  }

  &__group-cell {
    padding: var(--space-1) var(--space-4);
  }

  &__group {
    @include row;

    font-size: 0.6875rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    @include muted(null);
  }

  &__group-dot {
    display: inline-block;
    width: 0.375rem;
    height: 0.375rem;
    border-radius: var(--radius-full);
  }

  &__flow {
    &--in {
      color: token(--status-ok);
    }
    &--out {
      color: token(--status-out);
    }
  }

  &__foot {
    border-top: 1px solid token(--border-default);
  }

  &__foot-label {
    padding: var(--space-2) var(--space-4);
    font-size: var(--font-xs);
    text-align: right;
    text-transform: uppercase;
    letter-spacing: 0.025em;
    @include muted(null);
  }

  &__foot-value {
    padding: var(--space-2);
    font-weight: 600;
    text-align: right;
  }

  &__foot-target {
    vertical-align: top;
  }

  &__foot-deviation {
    display: block;
    font-size: var(--font-xs);
    font-weight: 400;
    white-space: nowrap;
  }

  &__foot-note {
    padding: var(--space-2);
    @include muted;
  }
}
</style>
