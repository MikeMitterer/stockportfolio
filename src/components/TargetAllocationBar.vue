<script setup lang="ts">
import { computed } from 'vue'
import { percent } from '@/domain/formatters'

/**
 * Zeigt, wie viel des Depots bereits per Ziel-Anteil verplant ist.
 * Über 100 % widersprechen sich die Ziele — dann schlägt der Balken auf Rot um.
 */
const props = defineProps<{
  sum: number
  exceeded: boolean
}>()

/** Anteil der Balkenbreite; über 100 % gedeckelt, die Zahl bleibt wahr. */
const fillWidth = computed(() => `${Math.min(100, props.sum)}%`)

/** Der Teil über 100 % — als eigener Streifen am Ende sichtbar gemacht. */
const overflowWidth = computed(() =>
  props.exceeded ? `${Math.min(100, props.sum - 100)}%` : '0%',
)

const isComplete = computed(() => !props.exceeded && Math.abs(props.sum - 100) < 0.01)

const fillClass = computed(() => {
  if (props.exceeded) return 'bg-red-500/70'
  if (isComplete.value) return 'bg-emerald-500/60'
  return 'bg-sky-500/50'
})

const labelClass = computed(() => {
  if (props.exceeded) return 'text-red-400'
  if (isComplete.value) return 'text-emerald-400'
  return 'text-neutral-500'
})
</script>

<template>
  <div class="flex items-center gap-3">
    <span class="text-xs text-neutral-500 shrink-0">Ziel-Verteilung</span>

    <div class="relative h-1.5 w-32 rounded-full bg-neutral-800/70 overflow-hidden shrink-0">
      <div class="absolute inset-y-0 left-0 rounded-full" :class="fillClass" :style="{ width: fillWidth }"></div>
      <!-- Überhang: sitzt am rechten Rand, damit „zu viel" sichtbar bleibt -->
      <div
        v-if="exceeded"
        class="absolute inset-y-0 right-0 bg-red-400/90"
        :style="{ width: overflowWidth }"
      ></div>
    </div>

    <span class="text-xs tabular-nums shrink-0" :class="labelClass">
      {{ percent(sum) }}
      <span v-if="exceeded" class="ml-1">· über 100 %</span>
    </span>
  </div>
</template>
