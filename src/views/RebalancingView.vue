<script setup lang="ts">
import { computed, inject, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { NButton, NEmpty, NSpin, NTooltip, useNotification } from 'naive-ui'
import DeltaBar from '@/components/DeltaBar.vue'
import InfoHint from '@/components/InfoHint.vue'
import { UxInlineNumber } from '@mikemitterer/ux-foundation'
import SuggestionBadge from '@/components/SuggestionBadge.vue'
import { resolveAmount } from '@/domain/amount'
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
import { useStateNotification } from '@mikemitterer/ux-foundation'
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
    {
      targets: targets.value,
      minTrade: resolveAmount(settingsStore.settings.minTradeSize, result.value.total),
      trigger: settingsStore.settings.rebalancing.trigger,
      due: result.value.schedule.due,
    },
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
  <div class="reb">
    <div v-if="!ready" class="reb__loading">
      <NSpin size="large" />
    </div>

    <NEmpty
      v-else-if="!hasHoldings"
      class="reb__empty"
      :description="t('rebalancing.empty')"
    />

    <template v-else-if="plan && result">
      <!--
        Kopf: woher kommt das Geld, wohin geht es.
        Kein abstraktes Budget — jeder eingesetzte Euro muss im Plan aus einem
        Verkauf oder einer Entnahme bei Cash/Geldmarkt stammen.
      -->
      <section class="reb__summary">
        <div class="reb__figure">
          <span class="reb__caption">{{ t('rebalancing.freed') }}</span>
          <span class="reb__value reb__value--in tabular-nums">
            {{ eur(plan.proceeds) }}
          </span>
          <span class="reb__caption-hint">{{ t('rebalancing.freedHint') }}</span>
        </div>

        <div class="reb__figure">
          <span class="reb__caption">{{ t('rebalancing.spent') }}</span>
          <span class="reb__value reb__value--out tabular-nums">
            {{ eur(plan.outlay) }}
          </span>
          <span class="reb__caption-hint">{{ t('rebalancing.spentHint') }}</span>
        </div>

        <div class="reb__figure">
          <span class="reb__caption">{{ t('rebalancing.balance') }}</span>
          <span
            class="reb__value tabular-nums"
            :class="{ 'reb__value--out': plan.underfunded }"
          >
            {{ eurSigned(plan.netCashFlow) }}
          </span>
          <span class="reb__caption-hint">
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
        <div class="reb__figure reb__figure--cover">
          <span
            class="reb__caption reb__caption--hinted"
          >
            {{ t('rebalancing.coverFrom') }}
            <InfoHint :text="t('hints.coverFrom')" anchor="plan" settings-tab="calc" />
          </span>
          <div v-if="coverageOptions.length > 0" class="reb__cover-options">
            <button
              v-for="option in coverageOptions"
              :key="option.id"
              type="button"
              class="reb__cover-button tabular-nums"
              :title="t('rebalancing.coverTitle', { label: option.label, units: integer(option.units) })"
              @click="setTrade(option.id, option.units)"
            >
              {{ option.label }} {{ integer(option.units) }}
            </button>
          </div>
          <span v-else class="reb__cover-empty">
            {{ planHasEntries ? t('rebalancing.coverNothing') : t('common.none') }}
          </span>
          <span class="reb__caption-hint">{{ t('rebalancing.coverHint') }}</span>
        </div>

        <div class="reb__figure">
          <span class="reb__caption">
            {{ t('rebalancing.reserve') }}
          </span>
          <span class="reb__value tabular-nums">{{ eur(plan.reserveAvailable) }}</span>
          <span class="reb__caption-hint">
            {{ t('rebalancing.reserveHint') }}
          </span>
        </div>

        <div class="reb__note">
          <!--
            Der Plan bucht bewusst nichts. Er dient dem Durchrechnen; die
            Aufträge gibt der Nutzer bei seiner Bank auf und pflegt die
            Bestände danach im Dashboard nach.
          -->
          <span class="reb__note-text">
            {{ t('rebalancing.simulationNote') }}
          </span>
          <NButton size="small" quaternary :disabled="!planHasEntries" @click="clearPlan">
            {{ t('rebalancing.clearPlan') }}
          </NButton>
        </div>
      </section>

      <!-- ─── Der Plan ─────────────────────────────────────────────────── -->
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

        <div class="reb__scroll">
          <table class="reb__table">
            <thead>
              <tr class="reb__head">
                <th class="reb__th reb__th--left reb__th--wide">{{ t('table.symbol') }}</th>
                <th class="reb__th">{{ t('table.units') }}</th>
                <th class="reb__th">{{ t('table.price') }}</th>
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
                <th class="reb__th reb__th--w32">{{ t('rebalancing.columns.trade') }}</th>
                <th class="reb__th reb__th--w28">{{ t('rebalancing.columns.value') }}</th>
                <th class="reb__th reb__th--left reb__th--w56">
                  {{ t('rebalancing.columns.shareAfter') }}
                </th>
                <th class="reb__th">{{ t('rebalancing.columns.deviation') }}</th>
                <th class="reb__th reb__th--center reb__th--wide reb__th--w32">{{ t('table.status') }}</th>
              </tr>
            </thead>

            <tbody>
              <template v-for="entry in groupedRows" :key="entry.group.group">
                <tr :style="{ backgroundColor: bandColor(entry.group.group) }">
                  <td colspan="11" class="reb__td reb__td--wide">
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

                <tr
                  v-for="row in entry.rows"
                  :key="row.current.position.id"
                  class="reb__row"
                >
                  <td class="reb__td reb__td--wide">
                    <div class="reb__symbol">
                      {{
                        row.current.position.group === 'cash'
                          ? row.current.position.displayName
                          : row.current.position.symbol
                      }}
                    </div>
                    <div
                      v-if="row.current.position.group !== 'cash'"
                      class="reb__name"
                    >
                      {{ row.current.position.displayName }}
                    </div>
                  </td>

                  <td class="reb__td reb__td--num tabular-nums">
                    {{ integer(row.current.position.units) }}
                  </td>

                  <td class="reb__td reb__td--num reb__td--secondary tabular-nums">
                    {{ priceOf(row) !== null ? eurCent(priceOf(row)!) : '—' }}
                  </td>

                  <td class="reb__td reb__td--num reb__td--secondary tabular-nums">
                    {{ percent(row.current.actualPercent) }}
                  </td>

                  <!--
                    Ziel probeweise änderbar — nur in dieser Simulation.
                    Wer eine Position als Geldquelle nutzt, obwohl sie auf Ziel
                    steht, ändert damit seine Aufteilung; ohne angepasstes Ziel
                    stünde die Zeile hinterher dauerhaft auf „Kaufen". Der
                    Punkt markiert den Probewert.
                  -->
                  <td class="reb__td">
                    <div class="reb__target">
                      <span
                        class="reb__override"
                        :class="{ 'reb__override--on': row.targetOverridden }"
                        :title="
                          row.targetOverridden
                            ? `Probeweise geändert — im Depot steht ${percent(
                              row.current.position.targetPercent,
                            )}`
                            : ''
                        "
                        aria-hidden="true"
                      ></span>
                      <UxInlineNumber
                        :edit-label="t('common.edit')"
                        :clear-label="t('common.clear')"
                        class="reb__grow"
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
                  <td class="reb__td reb__td--num">
                    <button
                      v-if="row.deltaUnits !== 0"
                      type="button"
                      class="reb__delta tabular-nums"
                      :class="row.deltaUnits > 0 ? 'reb__delta--up' : 'reb__delta--down'"
                      :title="t('rebalancing.adoptDelta')"
                      @click="setTrade(row.current.position.id, row.deltaUnits)"
                    >
                      {{ row.deltaUnits > 0 ? '+' : '' }}{{ integer(row.deltaUnits) }}
                    </button>
                    <span v-else class="reb__muted">—</span>
                  </td>

                  <!-- Die Eingabe -->
                  <td class="reb__td">
                    <UxInlineNumber
                        :edit-label="t('common.edit')"
                        :clear-label="t('common.clear')"
                      :value="row.tradeUnits"
                      :display="row.tradeUnits === 0 ? '—' : integer(row.tradeUnits)"
                      :precision="row.current.position.group === 'cash' ? 2 : 0"
                      :min="-row.current.position.units"
                      :empty-value="0"
                      @commit="(units: number) => setTrade(row.current.position.id, units)"
                    />
                  </td>

                  <td
                    class="reb__td reb__td--num tabular-nums"
                    :class="
                      row.cashFlow > 0
                        ? 'reb__flow--in'
                        : row.cashFlow < 0
                          ? 'reb__flow--out'
                          : 'reb__muted'
                    "
                  >
                    {{ row.cashFlow === 0 ? '—' : eurSigned(row.cashFlow) }}
                  </td>

                  <td class="reb__td">
                    <!--
                      Derselbe Balken wie auf dem Dashboard: Mitte ist das
                      Ziel, statt des Deltas steht der Anteil am Gesamtvermögen
                      daneben.
                    -->
                    <DeltaBar
                      :relative-percent="row.relativeDeviationAfter"
                      :suggestion="row.suggestionAfter"
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
                    class="reb__td reb__td--num tabular-nums"
                    :class="row.inBandAfter ? 'reb__muted' : 'reb__flow--out'"
                    :title="`${percentSigned(row.relativeDeviationAfter)} relativ zum Ziel`"
                  >
                    {{ row.tradeUnits === 0 && row.deviationAfter === 0 ? '—' : deviationLabel(row) }}
                  </td>

                  <td class="reb__td reb__td--wide reb__td--center">
                    <SuggestionBadge
                      :suggestion="row.suggestionAfter"
                      :below-min-trade="row.belowMinTradeAfter"
                    />
                  </td>
                </tr>
              </template>
            </tbody>

            <!-- Bilanz des Plans -->
            <tfoot>
              <tr class="reb__foot">
                <td colspan="7" class="reb__foot-label">
                  {{ t('rebalancing.footerQuestion') }}
                </td>
                <td
                  class="reb__foot-value tabular-nums"
                  :class="
                    Math.abs(plan.netCashFlow) < 0.005 ? 'reb__flow--in' : ''
                  "
                >
                  {{ eurSigned(plan.netCashFlow) }}
                </td>
                <td class="reb__foot-note" colspan="3">
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

<style scoped lang="scss">
.reb {
  @include stack(var(--space-4));

  @include content-frame;

  @include up(md) { gap: var(--space-6); }

  &__loading {
    @include row(0);

    justify-content: center;
    padding: var(--space-8) 0;
  }

  &__empty { padding: var(--space-8) 0; }

  /* Der Kopf fasst den Plan zusammen: was frei wird, was er kostet, was bleibt. */
  &__summary {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    gap: var(--space-4) var(--space-8);
  }

  &__figure {
    @include stack(0.125rem);

    /* Feste Mindesthöhe, damit die Zeile beim Erscheinen der Knöpfe nicht springt. */
    &--cover { min-height: 3.75rem; }
  }

  &__caption {
    font-size: 0.6875rem;
    text-transform: uppercase;
    letter-spacing: 0.025em;
    @include muted(null);

    &--hinted {
      display: inline-flex;
      align-items: center;
      gap: var(--space-1);
    }
  }

  &__caption-hint {
    font-size: 0.6875rem;
    @include muted(null);
  }

  &__value {
    font-size: var(--font-lg);
    font-weight: 600;

    &--in { color: token(--status-ok); }
    &--out { color: token(--status-out); }
  }

  &__cover-options {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.375rem;
    padding-top: 0.125rem;
  }

  &__cover-button {
    padding: 0.125rem var(--space-2);
    border: 1px solid token(--border-default);
    border-radius: var(--radius-full);
    font-size: var(--font-xs);
    color: token(--accent);
    transition: border-color 0.15s ease;

    &:hover { border-color: token(--accent); }
  }

  &__cover-empty {
    @include muted(var(--font-sm));

    padding-top: var(--space-1);
  }

  &__note {
    @include row(var(--space-3));

    margin-left: auto;
  }

  &__note-text {
    max-width: 16rem;
    font-size: 0.6875rem;
    line-height: 1.25;
    @include muted(null);
  }

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

    @include up(md) { padding-right: 1.25rem; padding-left: 1.25rem; }
  }

  &__panel-title {
    font-size: var(--font-xs);
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.025em;
    @include muted(null);
  }

  &__panel-bands { @include muted; }

  /*
   * Die Stückzahlen brauchen alle Spalten nebeneinander — Kurs gegen Ziel
   * gegen Delta. Deshalb hier ausnahmsweise seitliches Rollen statt einer
   * Kartenliste; die Eingabe wäre einzeln untereinander sinnlos.
   */
  &__scroll { overflow-x: auto; }

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

    &--left { text-align: left; }
    &--center { text-align: center; }
    &--wide { padding-right: var(--space-4); padding-left: var(--space-4); }
    &--w28 { width: 7rem; }
    &--w32 { width: 8rem; }
    &--w56 { width: 14rem; }
  }

  &__hinted {
    border-bottom: 1px dotted token(--text-muted);
    cursor: help;
  }

  &__tooltip {
    max-width: 20rem;
    font-size: var(--font-sm);
  }

  &__tooltip-more {
    margin-top: var(--space-2);
    font-size: var(--font-xs);
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

  &__row { border-top: 1px solid token(--border-subtle); }

  &__td {
    padding: var(--space-1) var(--space-2);

    &--num { text-align: right; }
    &--center { text-align: center; }
    &--wide { padding-right: var(--space-4); padding-left: var(--space-4); }
    &--secondary { color: token(--text-secondary); }
  }

  &__symbol {
    font-weight: 500;
    line-height: 1.25;
  }

  &__name {
    @include truncate;
    @include muted;

    max-width: 14rem;
  }

  &__target { @include row(var(--space-1)); }

  /* Der Punkt markiert ein probeweise geändertes Ziel. */
  &__override {
    flex-shrink: 0;
    width: 0.375rem;
    height: 0.375rem;
    border-radius: var(--radius-full);
    background-color: transparent;

    &--on { background-color: token(--accent); }
  }

  &__grow { flex: 1; }

  &__delta {
    font-size: var(--font-xs);
    text-decoration: underline dotted;

    &--up { color: token(--status-ok); }
    &--down { color: token(--status-out); }
  }

  &__muted { @include muted(null); }

  &__flow {
    &--in { color: token(--status-ok); }
    &--out { color: token(--status-out); }
  }

  &__foot { border-top: 1px solid token(--border-default); }

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

  &__foot-note {
    padding: var(--space-2);
    @include muted;
  }
}
</style>
