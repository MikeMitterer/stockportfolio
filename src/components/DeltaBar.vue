<script setup lang="ts">
import { computed } from 'vue'
import { percentSigned } from '@/domain/formatters'
import type { Bands } from '@/types/portfolio'

/**
 * Divergierender Balken um die 0-%-Linie (= Ziel).
 * Skala ist relativ zum Ziel, hart geclippt bei ±MAX_SCALE %.
 * Faktisches Delta bleibt in der Textzahl korrekt.
 */
const props = defineProps<{
  relativePercent: number
  bands: Bands
  compact?: boolean
}>()

const MAX_SCALE = 50 // ±50 % vom Ziel = 100 % Balkenlänge

const clipped = computed(() => Math.max(-MAX_SCALE, Math.min(MAX_SCALE, props.relativePercent)))
const magnitude = computed(() => Math.abs(clipped.value) / MAX_SCALE)
const halfWidth = computed(() => `${(magnitude.value * 50).toFixed(2)}%`)
const isPositive = computed(() => clipped.value >= 0)

const state = computed<'ok' | 'near' | 'out'>(() => {
  const delta = props.relativePercent
  const lower = -props.bands.lowerPercent
  const upper = props.bands.upperPercent
  if (delta < lower || delta > upper) return 'out'
  const nearThreshold = 1
  if (delta > upper - nearThreshold || delta < lower + nearThreshold) return 'near'
  return 'ok'
})

// Statusfarben, nicht Klassenfarben: hier geht es um „im Band / nahe / draußen",
// nicht um die Assetklasse. Die Sättigung liegt so hoch, dass der Zustand auf
// einen Blick zu sehen ist, und so tief, dass die Zahl darüber lesbar bleibt.
const fillClasses = computed(() => {
  switch (state.value) {
    case 'ok':
      return 'bg-status-ok/70'
    case 'near':
      return 'bg-status-near/70'
    case 'out':
      return 'bg-status-out/70'
  }
  return ''
})

// Band-Zonen (Toleranzbereiche) — links -lowerPercent, rechts +upperPercent
const bandLeftStyle = computed(() => {
  const width = (props.bands.lowerPercent / MAX_SCALE) * 50
  return {
    right: '50%',
    width: `${width}%`,
  }
})

const bandRightStyle = computed(() => {
  const width = (props.bands.upperPercent / MAX_SCALE) * 50
  return {
    left: '50%',
    width: `${width}%`,
  }
})

const fillStyle = computed(() => {
  return isPositive.value
    ? { left: '50%', width: halfWidth.value }
    : { right: '50%', width: halfWidth.value }
})

const label = computed(() => percentSigned(props.relativePercent))
</script>

<template>
  <div
    class="relative rounded-md overflow-hidden bg-sunken"
    :class="compact ? 'h-5' : 'h-6'"
    role="img"
    :aria-label="`Delta ${label}`"
  >
    <!-- Band-Marker (gepunktete Zonen) -->
    <div
      class="absolute top-0 bottom-0 bg-status-ok/10 border-x border-status-ok/40"
      :style="bandLeftStyle"
    ></div>
    <div
      class="absolute top-0 bottom-0 bg-status-ok/10 border-x border-status-ok/40"
      :style="bandRightStyle"
    ></div>

    <!-- Balken-Füllung -->
    <div
      class="absolute rounded-sm transition-all"
      :class="fillClasses"
      :style="{ ...fillStyle, top: '4px', bottom: '4px' }"
    ></div>

    <!-- Zentrums-Linie (Ziel) -->
    <div
      class="absolute top-0 bottom-0 w-px bg-ink/60 z-10"
      style="left: 50%"
    ></div>

    <!-- Label mittig, mit leichtem Text-Shadow für Lesbarkeit über Farben -->
    <div
      class="absolute inset-0 flex items-center justify-center text-xs font-medium tabular-nums text-ink z-20"
      style="text-shadow: 0 0 3px rgba(0, 0, 0, 0.7)"
    >
      {{ label }}
    </div>
  </div>
</template>
