<script setup lang="ts">
import { computed, inject, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { UxCaret } from '@mmit/ux-foundation'
import { NButton, NDropdown } from 'naive-ui'
import { usePortfolioCurrency } from '@/composables/usePortfolioCurrency'
import { formatAge } from '@/composables/useRelativeTime'
import { useFieldsStore } from '@/stores/fields'
import { projectDetailFields, hasDetailContent } from '@/domain/detailFields'
import { resolveKind, resolveLinks } from '@/domain/links'
import { integer, money, number, percent } from '@/domain/formatters'
import { STOCK_INFO_CLIENT, type StockInfoClient } from '@/api/client'
import PositionDetailFields from '@/components/PositionDetailFields.vue'
import PriceChart from '@/components/PriceChart.vue'
import type { PositionResult } from '@/domain/rebalancing'
import type { ExternalLink } from '@/types/portfolio'

type DetailSection = 'portfolio' | 'history' | 'asset'

const props = defineProps<{
  row: PositionResult
  links?: ExternalLink[]
  visibleStockInfoFields?: readonly string[]
  quoteAgeVisible?: boolean
  linksVisible?: boolean
  historyRequest?: number
}>()

const { t, locale } = useI18n()
const fields = useFieldsStore()
const { formatMoney, formatMoneySigned } = usePortfolioCurrency()
const client = inject<StockInfoClient | null>(STOCK_INFO_CLIENT, null)
const section = ref<DetailSection>(props.row.position.group === 'cash' ? 'portfolio' : 'history')

const sectionMenuOpen = ref(false)
const isCash = computed(() => props.row.position.group === 'cash')
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

const hasAdditionalInfo = computed(() => props.row.quote && (
  fields.loading || fields.error || props.row.quote.details == null ||
  projectDetailFields(props.row.quote, fields.catalog?.definitions ?? [], props.visibleStockInfoFields ?? [], locale.value).some(hasDetailContent)
))
const showConvertedPrice = computed(() => props.row.quote && props.row.basePrice !== null && props.row.quote.currency !== props.row.baseCurrency)
const showQuoteAge = computed(() => props.row.quote && !props.quoteAgeVisible)
const showLinks = computed(() => !props.linksVisible && resolvedLinks.value.length > 0)
const sections = computed<DetailSection[]>(() => {
  const available: DetailSection[] = isCash.value ? ['portfolio'] : ['history', 'portfolio']
  if (kindLabel.value || showConvertedPrice.value || showQuoteAge.value || showLinks.value || hasAdditionalInfo.value) available.push('asset')
  return available
})
const sectionLabels: Record<DetailSection, string> = {
  history: 'drilldown.sectionHistory', portfolio: 'drilldown.sectionPortfolio',
  asset: 'drilldown.sectionAsset',
}

const sectionOptions = computed(() => sections.value.map(key => ({ key, label: t(sectionLabels[key]) })))
function selectSection(key: string | number): void {
  const selected = sections.value.find(candidate => candidate === key)
  if (selected) section.value = selected
}

watch(() => [props.row.position.id, props.row.position.group], () => {
  section.value = isCash.value ? 'portfolio' : 'history'
})
watch(() => props.historyRequest, request => {
  if (request && !isCash.value) section.value = 'history'
})
watch(sections, available => {
  if (!available.includes(section.value)) section.value = available[0] ?? 'portfolio'
})
// Der Katalog muss verfügbar sein, bevor über den Zusatzinfos-Tab entschieden wird.
watch(() => [props.row.quote?.symbol, props.row.quote?.fetchedAt], () => {
  if (client && props.row.quote) void fields.load(client)
}, { immediate: true })
</script>

<template>
  <div class="position-details">
    <div class="position-details__top">
      <nav class="position-details__nav" :aria-label="t('drilldown.sections')">
        <div class="position-details__selection">
          <NDropdown v-if="sections.length > 1" v-model:show="sectionMenuOpen" trigger="click" :options="sectionOptions" :value="section" @select="selectSection">
            <NButton text size="small" :aria-label="`${t('drilldown.sections')}: ${t(sectionLabels[section])}`" aria-haspopup="menu" :aria-expanded="sectionMenuOpen">
              <span class="position-details__selection-label">{{ t(sectionLabels[section]) }}<UxCaret :open="sectionMenuOpen" size="sm" /></span>
            </NButton>
          </NDropdown>
          <span v-else>{{ t(sectionLabels[section]) }}</span>
        </div>
        <div class="position-details__tabs">
          <div v-for="available in sections" :key="available" class="position-details__tab" :class="{ 'position-details__tab--active': section === available }">
            <NButton text size="small" type="default" :aria-pressed="section === available" @click="section = available">
              {{ t(sectionLabels[available]) }}
            </NButton>
          </div>
        </div>
      </nav>
      <slot name="toolbar" />
    </div>

    <p v-if="row.position.notes?.trim()" class="position-details__note" data-position-note>{{ row.position.notes }}</p>

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
      <dl v-if="kindLabel || showConvertedPrice || showQuoteAge" class="position-details__facts position-details__facts--asset">
        <div v-if="kindLabel"><dt>{{ t('dashboard.kind') }}</dt><dd>{{ kindLabel }}</dd></div>
        <div v-if="showConvertedPrice && row.quote && row.basePrice !== null">
          <dt>{{ t('table.price') }}</dt>
          <dd>{{ t('fx.converted', { price: money(row.basePrice, row.baseCurrency, 2), pair: `${row.quote.currency}/${row.baseCurrency}` }) }}</dd>
        </div>
        <div v-if="showQuoteAge"><dt>{{ t('dashboard.quoteAge') }}</dt><dd>{{ quoteAge }}</dd></div>
      </dl>
      <div v-if="showLinks" class="position-details__links">
        <a v-for="link in resolvedLinks" :key="link.id" :href="link.url" target="_blank" rel="noopener noreferrer">{{ link.label }} ↗</a>
      </div>
      <PositionDetailFields v-if="hasAdditionalInfo" :quote="row.quote" :visible-keys="visibleStockInfoFields" :show-heading="false" />
    </section>
  </div>
</template>

<style scoped lang="scss">
.position-details {
  @include stack(var(--space-3));
  min-width: 0;

  &__top { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: var(--space-2); }
  &__nav {
    padding: var(--space-1) var(--space-2);
    margin: calc(-1 * var(--space-1)) calc(-1 * var(--space-2));
    border-radius: var(--radius-sm);
    background: color-mix(in srgb, token(--surface-raised) 40%, token(--surface-card));
  }
  &__tabs { display: grid; grid-auto-flow: column; grid-auto-columns: max-content; gap: var(--space-4); }
  &__selection { display: none; font-size: var(--font-sm); }
  &__selection-label { @include row(var(--space-2)); }
  @include below(md) {
    &__tabs { display: none; }
    &__selection { display: block; }
  }
  &__tab {
    padding: var(--space-1) 0;
    border-bottom: 1px solid transparent;
    &--active { border-bottom-color: token(--accent); }
  }
  &__note { margin: 0; white-space: pre-wrap; overflow-wrap: anywhere; font-size: var(--font-sm); color: token(--text-secondary); }
  &__panel { @include stack(var(--space-2)); min-width: 0; }
  &__facts {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 11rem), 1fr));
    gap: var(--space-3);
    margin: 0;
    font-size: var(--font-sm);
  }
  &__facts > div { min-width: 0; overflow-wrap: anywhere; }
  &__facts--valuation > div {
    padding: var(--space-2);
    border: 1px solid color-mix(in srgb, token(--border-default) 45%, token(--border-subtle));
    border-radius: var(--radius-sm);
    background-color: color-mix(in srgb, token(--surface-raised) 40%, token(--surface-card));
  }
  &__facts--asset {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2) var(--space-4);
  }
  &__facts--asset > div { @include row(var(--space-2), baseline); flex-wrap: wrap; }
  &__facts--asset > div > dd { margin: 0; }
  dt, &__hint { @include muted(var(--font-xs)); }
  dd { margin: var(--space-1) 0 0; font-variant-numeric: tabular-nums; }
  &__ok { color: token(--status-ok); }
  &__out { color: token(--status-out); }
  &__links { @include row(var(--space-3)); margin: var(--space-3) 0; flex-wrap: wrap; }
  &__links a { color: token(--accent); text-decoration: underline; }
  &__links span { @include muted(var(--font-xs)); }
  @media (max-width: 600px) {
    &__facts--valuation { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--space-2); }
    &__facts--valuation > div:first-child { grid-column: 1 / -1; }
  }
}
</style>
