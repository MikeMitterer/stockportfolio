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

/**
 * Statusfarbe als CSS-Variable statt fester Tailwind-Klasse.
 *
 * Feste Klassen wie `text-emerald-300` waren für dunkle Flächen gedacht und
 * verschwinden im hellen Theme fast. Über die Token bekommt jedes Theme die
 * Stufe, die auf seiner Fläche trägt.
 */
const color = computed(() => {
  switch (state.value) {
    case 'buy':
    case 'sell':
      return 'rgb(var(--status-out))'
    case 'near':
      return 'rgb(var(--status-near))'
    default:
      return 'rgb(var(--status-ok))'
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
    class="inline-flex w-[4.5rem] items-center justify-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium tabular-nums"
    :style="{
      color,
      borderColor: `color-mix(in srgb, ${color} 45%, transparent)`,
      backgroundColor: `color-mix(in srgb, ${color} 14%, transparent)`,
    }"
  >
    <span
      class="inline-block h-1.5 w-1.5 rounded-full"
      :style="{ backgroundColor: color }"
    ></span>
    <span v-if="arrow" class="leading-none">{{ arrow }}</span>
    <span>{{ label }}</span>
  </span>
</template>
