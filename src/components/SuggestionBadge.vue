<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Suggestion } from '@/types/portfolio'

const props = defineProps<{
  suggestion: Suggestion
  near?: boolean
}>()

const { t } = useI18n()

const state = computed<'ok' | 'near' | 'buy' | 'sell'>(() => {
  if (props.suggestion !== 'ok') return props.suggestion
  return props.near ? 'near' : 'ok'
})

const label = computed(() => t(`suggestion.${state.value}`))

const colorClasses = computed(() => {
  switch (state.value) {
    case 'buy':
      return 'bg-red-500/15 text-red-300 border-red-500/40'
    case 'sell':
      return 'bg-red-500/15 text-red-300 border-red-500/40'
    case 'near':
      return 'bg-amber-500/15 text-amber-300 border-amber-500/40'
    case 'ok':
    default:
      return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
  }
})

const dotClasses = computed(() => {
  switch (state.value) {
    case 'buy':
    case 'sell':
      return 'bg-red-400'
    case 'near':
      return 'bg-amber-400'
    case 'ok':
    default:
      return 'bg-emerald-400'
  }
})

const arrow = computed(() => {
  if (state.value === 'buy') return '↓'
  if (state.value === 'sell') return '↑'
  return null
})
</script>

<template>
  <span
    class="inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium tabular-nums"
    :class="colorClasses"
  >
    <span class="inline-block h-1.5 w-1.5 rounded-full" :class="dotClasses"></span>
    <span v-if="arrow" class="leading-none">{{ arrow }}</span>
    <span>{{ label }}</span>
  </span>
</template>
