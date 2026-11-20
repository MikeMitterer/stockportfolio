<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { UxInlineNumber } from '@mmit/ux-foundation'
import DeltaBar from '@/components/DeltaBar.vue'
import SuggestionBadge from '@/components/SuggestionBadge.vue'
import { usePortfolioCurrency } from '@/composables/usePortfolioCurrency'
import { decimalSigned, integer, percent, percentSigned } from '@/domain/formatters'
import { positionIsin, positionPrimaryLabel, positionSymbol } from '@/domain/positionIdentity'
import { TARGET_DIGITS, type TradePlanRow } from '@/domain/tradePlan'

/**
 * Eine Position im Rebalancing-Plan: Bestand, Kurs mit Bandkursen, Ziel,
 * geplante Stückzahl und der Zustand danach (aus `RebalancingView.vue`
 * herausgelöst, T-130). Eingaben gehen als Ereignis an die Ansicht, die den
 * Planentwurf hält.
 */
const props = defineProps<{ row: TradePlanRow }>()

const emit = defineEmits<{
  trade: [positionId: string, units: number]
  target: [positionId: string, targetPercent: number]
}>()

const { t } = useI18n()
const { formatMoneyCents, formatMoneySigned } = usePortfolioCurrency()

const positionId = computed(() => props.row.current.position.id)

/** Kurs je Stück in der Depotwährung; Cash hat keinen. */
const price = computed(() =>
  props.row.current.position.group === 'cash' ? null : props.row.current.basePrice,
)

/** Bandkurs in der Formatierung der Kursspalte; ohne Kurs an der Grenze „—“. */
function bandPriceLabel(bandPrice: number | null): string {
  return bandPrice === null ? '—' : formatMoneyCents(bandPrice)
}

const cashFlowClass = computed(() => {
  if (props.row.cashFlow > 0) return 'reb__flow--in'
  if (props.row.cashFlow < 0) return 'reb__flow--out'
  return 'reb__muted'
})
</script>

<template>
  <tr class="reb__row">
    <td class="reb__td reb__td--wide">
      <div class="reb__symbol">
        {{ positionPrimaryLabel(row.current) }}
        <span v-if="positionSymbol(row.current) && positionIsin(row.current)" class="reb__isin"
          ><span aria-hidden="true">|</span> {{ positionIsin(row.current) }}</span
        >
      </div>
      <div v-if="row.current.position.group !== 'cash'" class="reb__name">
        {{ row.current.position.displayName }}
      </div>
    </td>

    <td class="reb__td reb__td--num tabular-nums">
      {{ integer(row.current.position.units) }}
    </td>

    <td class="reb__td reb__td--num reb__td--secondary tabular-nums">
      {{ price !== null ? formatMoneyCents(price) : '—' }}
      <!--
      Bandkurse unter dem Kurs: Wo stehe ich im Korridor, ohne
      Blicksprung. Rot ist nur eine Grenze, die der Anteil nach dem
      Plan tatsächlich verlassen hat; die Erklärung steht im Spaltenkopf.
      -->
      <div v-if="price !== null" class="reb__band-prices">
        <span
          class="reb__band-price"
          :class="{ 'reb__band-price--out': row.bandBreachAfter === 'lower' }"
        >
          {{ t('rebalancing.bandPriceLower', { price: bandPriceLabel(row.lowerBandPrice) }) }}
        </span>
        <span
          class="reb__band-price"
          :class="{ 'reb__band-price--out': row.bandBreachAfter === 'upper' }"
        >
          {{ t('rebalancing.bandPriceUpper', { price: bandPriceLabel(row.upperBandPrice) }) }}
        </span>
      </div>
    </td>

    <td class="reb__td reb__td--num reb__td--secondary reb__td--percent tabular-nums">
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
              ? t('rebalancing.targetProbe', {
                  target: percent(row.current.position.targetPercent),
                })
              : ''
          "
          aria-hidden="true"
        ></span>
        <UxInlineNumber
          :edit-label="t('common.edit')"
          :clear-label="t('common.clear')"
          class="reb__grow"
          :value="row.targetPercent"
          :display="percent(row.targetPercent, TARGET_DIGITS)"
          :precision="TARGET_DIGITS"
          :min="0"
          :max="100"
          @commit="
            (targetPercent: number | null) =>
              targetPercent !== null && emit('target', positionId, targetPercent)
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
        @click="emit('trade', positionId, row.deltaUnits)"
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
        @commit="(units: number | null) => units !== null && emit('trade', positionId, units)"
      />
    </td>

    <td class="reb__td reb__td--num tabular-nums" :class="cashFlowClass">
      {{ row.cashFlow === 0 ? '—' : formatMoneySigned(row.cashFlow) }}
    </td>

    <td class="reb__td reb__band-column">
      <!-- Balken und Zahl beziehen sich auf denselben simulierten Zustand. -->
      <DeltaBar
        :relative-percent="row.relativeDeviationAfter"
        :suggestion="row.suggestionAfter"
        :label="row.targetPercent === 0 ? '—' : undefined"
        hide-value
        compact
      />
      <div class="reb__share-after">
        {{ t('rebalancing.shareAfterLabel', { share: percent(row.percentAfter) }) }}
      </div>
      <div v-if="row.targetPercent === 0" class="reb__share-after">
        {{ t('rebalancing.relativeUndefined') }}
      </div>
    </td>
    <td
      class="reb__td reb__td--num reb__relative-value tabular-nums"
      :class="{
        'reb__relative-value--positive': row.targetPercent !== 0 && row.relativeDeviationAfter > 0,
        'reb__relative-value--negative': row.targetPercent !== 0 && row.relativeDeviationAfter < 0,
      }"
      :title="row.targetPercent === 0 ? t('rebalancing.relativeUndefined') : undefined"
    >
      {{ row.targetPercent === 0 ? '—' : percentSigned(row.relativeDeviationAfter) }}
    </td>

    <!--
    Abweichung vom Ziel nach dem Trade in Prozentpunkten (Ziel 10 %, danach
    9,5 % ergibt −0,5; Einheit im Spaltenkopf). Das Ziel muss nicht exakt
    getroffen werden — solange der Anteil im Band liegt, ist der Zustand in
    Ordnung, deshalb hier gedämpft statt rot.
    -->
    <td
      class="reb__td reb__td--num tabular-nums"
      :class="row.inBandAfter ? 'reb__muted' : 'reb__flow--out'"
    >
      {{
        row.tradeUnits === 0 && row.deviationAfter === 0 ? '—' : decimalSigned(row.deviationAfter)
      }}
    </td>

    <td class="reb__td reb__td--wide reb__td--center">
      <SuggestionBadge
        :suggestion="row.suggestionAfter"
        :below-min-trade="row.belowMinTradeAfter"
      />
    </td>
  </tr>
</template>

<style scoped lang="scss">
.reb {
  &__row {
    border-top: 1px solid token(--border-subtle);
  }

  &__td {
    padding: var(--space-1) var(--space-2);

    &--num {
      text-align: right;
    }
    &--center {
      text-align: center;
    }
    &--wide {
      padding-right: var(--space-4);
      padding-left: var(--space-4);
    }
    &--secondary {
      color: token(--text-secondary);
    }
    &--percent {
      white-space: nowrap;
    }
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

  &__isin {
    @include muted(var(--font-xs));
    font-variant-numeric: tabular-nums;
  }

  &__band-prices {
    margin-top: var(--space-1);
    white-space: nowrap;
    @include muted(0.6875rem);
  }

  &__band-price {
    // Trenner zwischen unterer und oberer Grenze: „↓ 241,20 · ↑ 290,10“.
    & + &::before {
      content: '·';
      margin: 0 0.3em;
      color: token(--text-muted);
    }

    &--out {
      color: token(--status-out);
    }
  }

  &__band-column {
    @include below(xl) {
      display: none;
    }
  }

  &__share-after {
    margin-top: var(--space-1);
    white-space: nowrap;
    @include muted(0.6875rem);
  }

  &__relative-value {
    white-space: nowrap;
    color: token(--text-secondary);

    &--positive {
      color: token(--status-ok);
    }
    &--negative {
      color: token(--status-out);
    }
  }

  &__target {
    @include row(var(--space-1));
  }

  /* Der Punkt markiert ein probeweise geändertes Ziel. */
  &__override {
    flex-shrink: 0;
    width: 0.375rem;
    height: 0.375rem;
    border-radius: var(--radius-full);
    background-color: transparent;

    &--on {
      background-color: token(--accent);
    }
  }

  &__grow {
    flex: 1;
  }

  &__delta {
    font-size: var(--font-xs);
    text-decoration: underline dotted;

    &--up {
      color: token(--status-ok);
    }
    &--down {
      color: token(--status-out);
    }
  }

  &__muted {
    @include muted(null);
  }

  &__flow {
    &--in {
      color: token(--status-ok);
    }
    &--out {
      color: token(--status-out);
    }
  }
}
</style>
