<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import DeltaBar from '@/components/DeltaBar.vue'
import SuggestionBadge from '@/components/SuggestionBadge.vue'
import { assetColor } from '@/domain/assetColors'
import { eur, eurCent, integer, percent } from '@/domain/formatters'
import type { PositionResult } from '@/domain/rebalancing'

/**
 * Eine Position als Karte — die Mobilansicht.
 *
 * Bewusst nur zum Lesen: Rebalancing ist eine Tätigkeit, für die man sich
 * hinsetzt, und das bleibt am Desktop. Unterwegs zählt eine Frage — ist
 * etwas aus dem Band gelaufen? Deshalb Basisdaten, Delta und Status, aber
 * keine Eingabefelder und kein Trade-Simulator.
 */
const props = defineProps<{
  row: PositionResult
}>()

const { t } = useI18n()

const isCash = computed(() => props.row.position.group === 'cash')
const color = computed(() => assetColor(props.row.position.group))

const title = computed(() =>
  isCash.value ? props.row.position.displayName : props.row.position.symbol,
)
</script>

<template>
  <article class="poscard" :class="{ 'poscard--inactive': !row.isActive }">
    <!-- Kopf: Papier und Status -->
    <div class="poscard__head">
      <div class="poscard__ident">
        <span
          class="poscard__dot"
          :style="{ backgroundColor: color }"
          aria-hidden="true"
        ></span>
        <div class="poscard__names">
          <div class="poscard__title-row">
            <span class="poscard__title">{{ title }}</span>
            <span v-if="!row.isActive" class="poscard__tag">{{ t('currency.inactive') }}</span>
          </div>
          <div v-if="!isCash" class="poscard__subtitle">{{ row.position.displayName }}</div>
        </div>
      </div>

      <SuggestionBadge
        v-if="row.isActive"
        :suggestion="row.suggestion"
        :near="row.isNearBand"
        :below-min-trade="row.belowMinTrade"
        class="poscard__badge"
      />
      <span v-else class="poscard__excluded">{{ t('currency.notCounted') }}</span>
    </div>

    <!-- Basisdaten -->
    <div class="poscard__line poscard__line--base">
      <span class="poscard__meta tabular-nums">
        <template v-if="!isCash">
          {{ t('common.units', { count: integer(row.position.units) }) }}
          <template v-if="row.quote"> · {{ eurCent(row.quote.price) }}</template>
        </template>
        <template v-else>{{ row.position.displayName }}</template>
      </span>
      <span class="poscard__value tabular-nums">{{ eur(row.marketValue) }}</span>
    </div>

    <!-- IST gegen Ziel -->
    <div v-if="row.isActive" class="poscard__line">
      <span class="poscard__muted">
        {{ t('table.actualPercent') }} / {{ t('table.targetPercent') }}
      </span>
      <span class="tabular-nums">
        {{ percent(row.actualPercent) }}
        <span class="poscard__muted">/ {{ percent(row.position.targetPercent) }}</span>
      </span>
    </div>

    <!-- Delta über die volle Breite -->
    <DeltaBar
      v-if="row.isActive"
      :relative-percent="row.relativeDeltaPercent"
      :suggestion="row.suggestion"
      :near="row.isNearBand"
      compact
    />
  </article>
</template>

<style scoped lang="scss">
.poscard {
  @include stack(var(--space-2));
  padding: var(--space-3) var(--space-4);
  border-bottom: 1px solid token(--border-subtle);

  &--inactive { opacity: 0.55; }

  &__head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--space-3);
  }

  &__ident {
    @include row(var(--space-2));
    min-width: 0;
  }

  &__dot {
    display: inline-block;
    flex-shrink: 0;
    width: 0.375rem;
    height: 0.375rem;
    border-radius: var(--radius-full);
  }

  &__names { min-width: 0; }

  &__title-row {
    @include row(var(--space-2));
  }

  &__title {
    font-size: var(--font-sm);
    font-weight: 500;
  }

  &__tag {
    flex-shrink: 0;
    padding: 1px 0.375rem;
    border: 1px solid token(--border-default);
    border-radius: 0.25rem;
    font-size: 0.625rem;
    text-transform: uppercase;
    letter-spacing: 0.025em;
    @include muted(null);
  }

  &__subtitle {
    overflow: hidden;
    @include muted(var(--font-xs));
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__badge { flex-shrink: 0; }

  &__excluded {
    flex-shrink: 0;
    @include muted(var(--font-xs));
  }

  &__line {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: var(--space-3);
    font-size: var(--font-xs);

    &--base { font-size: var(--font-sm); }
  }

  &__meta {
    @include muted(var(--font-xs));
  }

  &__value { font-weight: 500; }

  &__muted { @include muted(null); }
}
</style>
