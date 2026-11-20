<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { NButton, NIcon } from 'naive-ui'
import InfoHint from '@/components/InfoHint.vue'
import { usePortfolioCurrency } from '@/composables/usePortfolioCurrency'
import { integer } from '@/domain/formatters'
import type { TradePlanResult } from '@/domain/tradePlan'

/**
 * Kopf des Rebalancing-Plans: woher das Geld kommt, wohin es geht, was
 * bleibt (aus `RebalancingView.vue` herausgelöst, T-130).
 */
defineProps<{
  plan: TradePlanResult
  planHasEntries: boolean
  /** Liquide Zeilen, die die offene Lücke schließen könnten; leer, wenn der Plan gedeckt ist. */
  coverageOptions: { id: string; label: string; units: number }[]
}>()

const emit = defineEmits<{
  trade: [positionId: string, units: number]
  clear: []
}>()

const { t } = useI18n()
const { formatMoney, formatMoneySigned } = usePortfolioCurrency()
</script>

<template>
  <!--
  Kein abstraktes Budget — jeder eingesetzte Euro muss im Plan aus einem
  Verkauf oder einer Entnahme bei Cash/Geldmarkt stammen.
  -->
  <section class="reb__summary">
    <div class="reb__figure">
      <span class="reb__caption">{{ t('rebalancing.freed') }}</span>
      <span class="reb__value reb__value--in tabular-nums">
        {{ formatMoney(plan.proceeds) }}
      </span>
      <span class="reb__caption-hint">{{ t('rebalancing.freedHint') }}</span>
    </div>

    <div class="reb__figure">
      <span class="reb__caption">{{ t('rebalancing.spent') }}</span>
      <span class="reb__value reb__value--out tabular-nums">
        {{ formatMoney(plan.outlay) }}
      </span>
      <span class="reb__caption-hint">{{ t('rebalancing.spentHint') }}</span>
    </div>

    <div class="reb__figure">
      <span class="reb__caption">{{ t('rebalancing.balance') }}</span>
      <span class="reb__value tabular-nums" :class="{ 'reb__value--out': plan.underfunded }">
        {{ formatMoneySigned(plan.netCashFlow) }}
      </span>
      <span class="reb__caption-hint">
        <template v-if="!planHasEntries">{{ t('rebalancing.nothingPlanned') }}</template>
        <template v-else-if="plan.underfunded">{{ t('rebalancing.underfunded') }}</template>
        <template v-else-if="Math.abs(plan.netCashFlow) < 0.005">{{
          t('rebalancing.balanced')
        }}</template>
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
      <span class="reb__caption reb__caption--hinted">
        {{ t('rebalancing.coverFrom') }}
        <InfoHint :text="t('hints.coverFrom')" anchor="plan" settings-tab="calc" />
      </span>
      <div v-if="coverageOptions.length > 0" class="reb__cover-options">
        <button
          v-for="option in coverageOptions"
          :key="option.id"
          type="button"
          class="reb__cover-button tabular-nums"
          :title="
            t('rebalancing.coverTitle', { label: option.label, units: integer(option.units) })
          "
          @click="emit('trade', option.id, option.units)"
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
      <span class="reb__value tabular-nums">{{ formatMoney(plan.reserveAvailable) }}</span>
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
      <NButton size="small" quaternary :disabled="!planHasEntries" @click="emit('clear')">
        <template #icon>
          <NIcon>
            <!-- Lucide „trash“ (früher „trash-2“); Quelle und Lizenz in THIRD_PARTY_NOTICES.md. -->
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
              focusable="false"
            >
              <path d="M10 11v6" />
              <path d="M14 11v6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
              <path d="M3 6h18" />
              <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
          </NIcon>
        </template>
        {{ t('rebalancing.clearPlan') }}
      </NButton>
    </div>
  </section>
</template>

<style scoped lang="scss">
.reb {
  /* Der Kopf fasst den Plan zusammen: was frei wird, was er kostet, was bleibt. */
  &__summary {
    display: flex;
    flex-wrap: nowrap;
    align-items: flex-end;
    gap: var(--space-4) var(--space-8);
  }

  &__figure {
    @include stack(0.125rem);

    /* Feste Mindesthöhe, damit die Zeile beim Erscheinen der Knöpfe nicht springt. */
    &--cover {
      min-height: 3.75rem;
    }
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

    &--in {
      color: token(--status-ok);
    }
    &--out {
      color: token(--status-out);
    }
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

    &:hover {
      border-color: token(--accent);
    }
  }

  &__cover-empty {
    @include muted(var(--font-sm));

    padding-top: var(--space-1);
  }

  &__note {
    @include row(var(--space-3));

    margin-left: auto;
    flex-shrink: 0;
  }

  &__note-text {
    max-width: 16rem;
    font-size: 0.6875rem;
    line-height: 1.25;
    @include muted(null);

    // Mike hat für diesen Hinweis ausdrücklich die Grenze 1160 px vorgegeben.
    @media (width < 1160px) {
      display: none;
    }
  }
}
</style>
