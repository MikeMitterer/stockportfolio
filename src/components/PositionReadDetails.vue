<script setup lang="ts">
import { computed, inject, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { NButton } from 'naive-ui'
import { usePortfolioCurrency } from '@/composables/usePortfolioCurrency'
import { formatAge } from '@/composables/useRelativeTime'
import { resolveKind, resolveLinks } from '@/domain/links'
import { positionIsin, positionSymbol } from '@/domain/positionIdentity'
import { integer, money, number, percent } from '@/domain/formatters'
import { STOCK_INFO_CLIENT, type StockInfoClient } from '@/api/client'
import PositionDetailFields from '@/components/PositionDetailFields.vue'
import PriceChart from '@/components/PriceChart.vue'
import type { PositionResult } from '@/domain/rebalancing'
import type { ExternalLink } from '@/types/portfolio'

type DetailSection = 'portfolio' | 'history' | 'asset' | 'details'

const props = defineProps<{
  row: PositionResult
  links?: ExternalLink[]
  visibleStockInfoFields?: readonly string[]
}>()

const { t } = useI18n()
const { formatMoney, formatMoneySigned } = usePortfolioCurrency()
const client = inject<StockInfoClient | null>(STOCK_INFO_CLIENT, null)
const section = ref<DetailSection>('portfolio')

const isCash = computed(() => props.row.position.group === 'cash')
const stockInfoSymbol = computed(() => positionSymbol(props.row))
const stockInfoIsin = computed(() => positionIsin(props.row))
const resolvedLinks = computed(() => resolveLinks(props.row.position, props.links ?? [], props.row.quote?.type))
const kind = computed(() => resolveKind(props.row.position, props.row.quote?.type))
const kindLabel = computed(() => {
  if (kind.value === 'etf') return t('dashboard.kindEtf')
  if (kind.value === 'stock') return t('dashboard.kindStock')
  return null
})
const optimalUnits = computed(() =>
  props.row.basePrice && props.row.basePrice > 0
    ? Math.round(props.row.targetValue / props.row.basePrice)
    : null,
)
const deltaAmount = computed(() => props.row.targetValue - props.row.marketValue)
const quoteAge = computed(() => formatAge(props.row.quote?.fetchedAt ?? null))

watch(() => [props.row.position.id, props.row.position.group], () => {
  section.value = 'portfolio'
})
</script>

<template>
  <div class="position-details">
    <div class="position-details__top">
      <nav class="position-details__nav" :aria-label="t('drilldown.sections')">
        <div class="position-details__tabs">
          <NButton size="small" block :type="section === 'portfolio' ? 'primary' : 'default'" :aria-pressed="section === 'portfolio'" @click="section = 'portfolio'">
            {{ t('drilldown.sectionPortfolio') }}
          </NButton>
          <NButton v-if="!isCash" size="small" block :type="section === 'history' ? 'primary' : 'default'" :aria-pressed="section === 'history'" @click="section = 'history'">
            {{ t('drilldown.sectionHistory') }}
          </NButton>
          <NButton size="small" block :type="section === 'asset' ? 'primary' : 'default'" :aria-pressed="section === 'asset'" @click="section = 'asset'">
            {{ t('drilldown.sectionAsset') }}
          </NButton>
          <NButton v-if="row.quote" size="small" block :type="section === 'details' ? 'primary' : 'default'" :aria-pressed="section === 'details'" @click="section = 'details'">
            {{ t('drilldown.sectionDetails') }}
          </NButton>
        </div>
      </nav>
      <slot name="toolbar" />
    </div>

    <section v-if="section === 'portfolio'" class="position-details__panel" data-position-section="portfolio" :aria-label="t('drilldown.sectionPortfolio')">
      <dl class="position-details__facts position-details__facts--valuation">
        <div>
          <dt>{{ t('table.marketValue') }}</dt>
          <dd>{{ row.basePrice !== null ? money(row.marketValue, row.baseCurrency) : row.quote ? money(row.originalMarketValue, row.quote.currency) : isCash ? formatMoney(row.marketValue) : '—' }}</dd>
        </div>
        <template v-if="row.isActive">
          <div><dt>{{ t('table.actualPercent') }}</dt><dd>{{ percent(row.actualPercent) }}</dd></div>
          <div><dt>{{ t('table.targetPercent') }}</dt><dd>{{ percent(row.position.targetPercent) }}</dd></div>
          <div><dt>{{ t('dashboard.targetValue') }}</dt><dd>{{ formatMoney(row.targetValue) }}</dd></div>
          <div><dt>{{ t('drilldown.deltaEuro') }}</dt><dd :class="row.suggestion === 'ok' ? 'position-details__ok' : 'position-details__out'">{{ formatMoneySigned(deltaAmount) }}</dd></div>
          <div><dt>{{ t('drilldown.lowerBand') }}</dt><dd>{{ formatMoney(row.lowerBand) }}</dd></div>
          <div><dt>{{ t('drilldown.upperBand') }}</dt><dd>{{ formatMoney(row.upperBand) }}</dd></div>
          <div v-if="optimalUnits !== null"><dt>{{ t('drilldown.optimalUnits') }}</dt><dd>{{ integer(optimalUnits) }}</dd></div>
          <div><dt>{{ t('dashboard.unitsDelta') }}</dt><dd>{{ number(row.unitsDelta) }}</dd></div>
        </template>
      </dl>
    </section>

    <section v-else-if="section === 'history'" class="position-details__panel" data-position-section="history" :aria-label="t('drilldown.sectionHistory')">
      <PriceChart v-if="row.quote" :position="row.position" :client="client" :currency="row.quote.currency" />
      <p v-else>{{ t('currency.missingQuote') }}</p>
    </section>

    <section v-else-if="section === 'asset'" class="position-details__panel" data-position-section="asset" :aria-label="t('drilldown.sectionAsset')">
      <dl class="position-details__facts position-details__facts--asset">
        <div v-if="stockInfoIsin"><dt>ISIN</dt><dd>{{ stockInfoIsin }}</dd></div>
        <div v-if="stockInfoSymbol"><dt>{{ t('table.symbol') }}</dt><dd>{{ stockInfoSymbol }}</dd></div>
        <div v-if="kindLabel"><dt>{{ t('dashboard.kind') }}</dt><dd>{{ kindLabel }}</dd></div>
        <div v-if="row.quote">
          <dt>{{ t('table.price') }}</dt>
          <dd>{{ money(row.quote.price, row.quote.currency, 2) }}</dd>
          <dd v-if="row.basePrice !== null && row.quote.currency !== row.baseCurrency" class="position-details__hint">
            {{ t('fx.converted', { price: money(row.basePrice, row.baseCurrency, 2), pair: `${row.quote.currency}/${row.baseCurrency}` }) }}
          </dd>
        </div>
        <div v-if="row.quote"><dt>{{ t('dashboard.quoteAge') }}</dt><dd>{{ quoteAge }}</dd></div>
      </dl>
      <p v-if="!isCash && !row.quote">{{ t('currency.missingQuote') }}</p>
      <div class="position-details__links">
        <a v-for="link in resolvedLinks" :key="link.id" :href="link.url" target="_blank" rel="noopener noreferrer">{{ link.label }} ↗</a>
        <span v-if="resolvedLinks.length === 0">{{ t('dashboard.noMatchingLinks') }}</span>
      </div>
    </section>

    <div v-else class="position-details__panel" data-position-section="details">
      <PositionDetailFields :quote="row.quote" :visible-keys="visibleStockInfoFields" :show-heading="false" />
    </div>
  </div>
</template>

<style scoped lang="scss">
.position-details {
  @include stack(var(--space-3));
  min-width: 0;

  &__top { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: var(--space-2); }
  &__tabs { display: grid; grid-template-columns: repeat(4, max-content); gap: var(--space-2); }
  &__panel { min-width: 0; }
  &__facts {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 11rem), 1fr));
    gap: var(--space-3);
    margin: 0;
    font-size: var(--font-sm);
  }
  &__facts > div { min-width: 0; overflow-wrap: anywhere; }
  &__facts--valuation > div {
    padding: var(--space-3);
    border: 1px solid color-mix(in srgb, token(--border-default) 45%, token(--border-subtle));
    border-radius: var(--radius-sm);
    background-color: color-mix(in srgb, token(--surface-raised) 40%, token(--surface-card));
  }
  &__facts--asset {
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 14rem), 1fr));
    gap: var(--space-2);
  }
  &__facts--asset > div {
    padding: var(--space-3);
    border: 1px solid color-mix(in srgb, token(--border-default) 45%, token(--border-subtle));
    border-radius: var(--radius-sm);
    background-color: color-mix(in srgb, token(--surface-raised) 40%, token(--surface-card));
  }
  dt, &__hint { @include muted(var(--font-xs)); }
  dd { margin: var(--space-1) 0 0; font-variant-numeric: tabular-nums; }
  &__ok { color: token(--status-ok); }
  &__out { color: token(--status-out); }
  &__links { @include row(var(--space-3)); margin: var(--space-3) 0; flex-wrap: wrap; }
  &__links a { color: token(--accent); text-decoration: underline; }
  &__links span { @include muted(var(--font-xs)); }
  @media (max-width: 600px) {
    &__tabs { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); }
    &__facts--valuation { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--space-2); }
    &__facts--valuation > div:first-child { grid-column: 1 / -1; }
  }
}
</style>
