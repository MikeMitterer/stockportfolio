<script setup lang="ts">
import { computed } from 'vue'
import { NAlert, NButton } from 'naive-ui'
import { useI18n } from 'vue-i18n'
import { fxKey, majorCurrency } from '@/domain/fx'
import type { RebalancingResult } from '@/domain/rebalancing'

const props = defineProps<{ result: RebalancingResult | null; loading: boolean }>()
const emit = defineEmits<{ retry: [] }>()
const { t, locale } = useI18n()
const issues = computed(() => [...new Map((props.result?.rows ?? [])
  .filter(row => row.excludedReason === 'currency' || (row.isActive && row.fx?.stale))
  .map(row => {
    const pair = fxKey(majorCurrency(row.quote!.currency), row.baseCurrency)
    const time = row.fx ? new Intl.DateTimeFormat(locale.value, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(row.fx.quoteTime)) : ''
    return [pair, row.fx ? t('fx.stalePair', { pair, time }) : t('fx.missingPair', { pair })] as const
  })).values()])
</script>

<template>
  <NAlert v-if="issues.length" type="warning" :title="t('fx.title')" :bordered="false">
    <p v-for="issue in issues" :key="issue">{{ issue }}</p>
    <NButton size="small" :loading="loading" @click="emit('retry')">{{ t('fx.retry') }}</NButton>
  </NAlert>
</template>
