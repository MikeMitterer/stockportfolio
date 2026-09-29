<script setup lang="ts">
import { usePortfolioCurrency } from '@/composables/usePortfolioCurrency'
import { computed, ref } from 'vue'
import { NButton } from 'naive-ui'
import { UxCaret } from '@mmit/ux-foundation'
import { useI18n } from 'vue-i18n'
import DeltaBar from '@/components/DeltaBar.vue'
import SuggestionBadge from '@/components/SuggestionBadge.vue'
import PositionReadDetails from '@/components/PositionReadDetails.vue'
import AssetTypeHint from '@/components/AssetTypeHint.vue'
import { assetColor } from '@/domain/assetColors'
import { positionIsin, positionPrimaryLabel, positionSymbol, positionType } from '@/domain/positionIdentity'
import { useQuoteIssue } from '@/composables/useQuoteIssue'
import { integer, money, percent } from '@/domain/formatters'
import type { PositionResult } from '@/domain/rebalancing'
import type { ExternalLink } from '@/types/portfolio'

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
  links?: ExternalLink[]
}>()

const { t } = useI18n()
const quoteIssue = useQuoteIssue()
const detailsOpen = ref(false)

const isCash = computed(() => props.row.position.group === 'cash')
const color = computed(() => assetColor(props.row.position.group))

const title = computed(() => positionPrimaryLabel(props.row))
const isin = computed(() => positionSymbol(props.row) ? positionIsin(props.row) : null)
const { formatMoney } = usePortfolioCurrency()

function toggleDetails(): void {
  detailsOpen.value = !detailsOpen.value
}
</script>

<template>
  <article class="poscard" :class="{ 'poscard--inactive': !row.isActive }">
    <p v-if="quoteIssue(row)" role="status">{{ quoteIssue(row) }}</p>
    <div class="poscard__summary" @click="toggleDetails">
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
              <span v-if="isin" class="poscard__isin"><span aria-hidden="true">|</span> {{ isin }}</span>
              <span v-if="!row.isActive" class="poscard__tag">{{ row.excludedReason === 'missing-quote' ? t('currency.missingQuote') : row.excludedReason === 'currency' ? row.quote?.currency : t('currency.inactive') }}</span>
            </div>
            <div v-if="!isCash" class="poscard__name-row">
              <span class="poscard__subtitle">{{ row.position.displayName }}</span>
              <AssetTypeHint :type="positionType(row)" :label="t('links.appliesToKind')" />
            </div>
          </div>
        </div>

        <div class="poscard__head-actions">
          <SuggestionBadge
            v-if="row.isActive"
            :suggestion="row.suggestion"
            :near="row.isNearBand"
            :below-min-trade="row.belowMinTrade"
            class="poscard__badge"
          />
          <span v-else class="poscard__excluded">{{ t('currency.notCounted') }}</span>
          <NButton size="small" quaternary circle :aria-label="t(detailsOpen ? 'drilldown.closeDetails' : 'drilldown.openDetails')" :aria-expanded="detailsOpen" @click.stop="toggleDetails">
            <UxCaret :open="detailsOpen" motion="turn" size="sm" />
          </NButton>
        </div>
      </div>

      <!-- Basisdaten -->
      <div class="poscard__line poscard__line--base">
        <span class="poscard__meta tabular-nums">
          <template v-if="!isCash">
            {{ t('common.units', { count: integer(row.position.units) }) }}
            <template v-if="row.quote"> · {{ money(row.quote.price, row.quote.currency, 2) }}</template>
          </template>
          <template v-else>{{ row.position.displayName }}</template>
        </span>
        <span class="poscard__value tabular-nums">{{ row.basePrice !== null ? money(row.marketValue, row.baseCurrency) : row.quote ? money(row.originalMarketValue, row.quote.currency) : isCash ? formatMoney(row.marketValue) : '—' }}</span>
      </div>

      <!-- Ziel gegen IST -->
      <div v-if="row.isActive" class="poscard__line">
        <span class="poscard__muted">
          {{ t('table.targetPercent') }} / {{ t('table.actualPercent') }}
        </span>
        <span class="tabular-nums">
          {{ percent(row.position.targetPercent) }}
          <span class="poscard__muted">/ {{ percent(row.actualPercent) }}</span>
        </span>
      </div>

      <!-- Abweichung als kompakte Zahlenzeile -->
      <div v-if="row.isActive" class="poscard__line">
        <span class="poscard__muted">{{ t('table.delta') }}</span>
        <DeltaBar
          :relative-percent="row.relativeDeltaPercent"
          :suggestion="row.suggestion"
          :near="row.isNearBand"
          compact
          narrow
        />
      </div>
    </div>
    <PositionReadDetails v-if="detailsOpen" :row="row" :links="links" />
  </article>
</template>

<style scoped lang="scss">
.poscard {
  @include stack(var(--space-2));
  padding: var(--space-3) var(--space-4);
  border: 1px solid token(--border-subtle);
  border-radius: var(--radius-sm);
  background-color: token(--surface-card);

  &--inactive { opacity: 0.55; }

  &__summary { @include stack(var(--space-2)); cursor: pointer; }

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
    flex-wrap: wrap;
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
    text-transform: none;
    letter-spacing: 0.025em;
    @include muted(null);
  }

  &__subtitle {
    min-width: 0;
    overflow: hidden;
    @include muted(var(--font-xs));
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__name-row { display: flex; align-items: baseline; gap: var(--space-2); min-width: 0; }

  &__isin { @include muted(var(--font-xs)); font-variant-numeric: tabular-nums; }

  &__badge { flex-shrink: 0; }
  &__head-actions { @include row(var(--space-1)); flex-shrink: 0; }

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
