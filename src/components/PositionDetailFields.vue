<script setup lang="ts">
import { computed, inject, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { NAlert, NButton, NSpin } from 'naive-ui'
import { STOCK_INFO_CLIENT } from '@/api/client'
import { useFieldsStore } from '@/stores/fields'
import { projectDetailFields } from '@/domain/detailFields'
import type { StockInfoClient } from '@/api/client'
import type { QuoteCacheEntry } from '@/types/portfolio'

const props = withDefaults(defineProps<{
  quote: QuoteCacheEntry | null
  visibleKeys?: readonly string[]
  showHeading?: boolean
}>(), { visibleKeys: () => [], showHeading: true })

const { t, locale } = useI18n()
const fields = useFieldsStore()
const client = inject<StockInfoClient | null>(STOCK_INFO_CLIENT, null)
const rows = computed(() => projectDetailFields(props.quote, fields.catalog?.definitions ?? [], props.visibleKeys, locale.value))

watch(() => [props.quote?.symbol, props.quote?.fetchedAt], () => {
  if (client && props.quote) void fields.load(client)
}, { immediate: true })

function formatDate(value: string): string {
  const date = new Date(value)
  return Number.isFinite(date.getTime())
    ? new Intl.DateTimeFormat(locale.value, { dateStyle: 'medium', timeStyle: 'short' }).format(date)
    : value
}
</script>

<template>
  <section class="detail-fields" :aria-label="t('detailFields.title')">
    <div v-if="showHeading || fields.loading" class="detail-fields__heading">
      <h3 v-if="showHeading">{{ t('detailFields.title') }}</h3>
      <NSpin v-if="fields.loading" size="small" />
    </div>
    <NAlert v-if="fields.error" type="warning" :bordered="false">
      {{ t('detailFields.unavailable') }}
      <p>{{ fields.error }}</p>
      <NButton v-if="client" size="small" @click="fields.load(client)">{{ t('detailFields.retry') }}</NButton>
    </NAlert>
    <p v-if="quote && quote.details == null" class="detail-fields__hint">{{ t('detailFields.notLoaded') }}</p>
    <dl v-if="rows.length" class="detail-fields__grid">
      <div v-for="field in rows" :key="field.key" :data-detail-field="field.key" class="detail-fields__item">
        <dt>
          {{ field.label }}
          <small v-if="field.label !== field.key" class="detail-fields__key">{{ field.key }}</small>
        </dt>
        <dd class="detail-fields__value">{{ field.value }}</dd>
        <dd v-if="field.metadata.origin || field.metadata.source" class="detail-fields__meta">
          {{ t(field.metadata.origin === 'manual' ? 'detailFields.manual' : 'detailFields.provider') }}<template v-if="field.metadata.source">: {{ field.metadata.source }}</template>
        </dd>
        <dd v-if="field.metadata.asOf" class="detail-fields__meta">
          <time :datetime="field.metadata.asOf">{{ t('detailFields.asOf', { value: formatDate(field.metadata.asOf) }) }}</time>
        </dd>
        <dd v-if="field.metadata.shadowed" class="detail-fields__meta">{{ t('detailFields.shadowed', { value: field.manualValue }) }}</dd>
      </div>
    </dl>
    <p v-else-if="!fields.error && !fields.loading && quote?.details != null" class="detail-fields__hint">{{ t('detailFields.empty') }}</p>
  </section>
</template>

<style scoped lang="scss">
.detail-fields {
  @include stack(var(--space-3));

  &__heading {
    @include row(var(--space-2));
    h3 { margin: 0; font-size: var(--font-sm); font-weight: 600; }
  }
  &__grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 13rem), 1fr));
    gap: var(--space-4);
    margin: 0;
  }
  &__item { min-width: 0; overflow-wrap: anywhere; }
  &__key { display: block; @include muted(var(--font-xs)); }
  &__value { margin: var(--space-1) 0; font-variant-numeric: tabular-nums; }
  &__meta { margin: 0; @include muted(var(--font-xs)); }
  &__hint { margin: 0; @include muted(var(--font-xs)); }
}
</style>
