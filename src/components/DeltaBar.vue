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
// nicht um die Assetklasse.
//
// Deckend, nicht halbdurchsichtig: bei Teiltransparenz mischte sich die Fläche
// darunter ein und die Farbe wirkte ausgewaschen.
const fillClasses = computed(() => {
  switch (state.value) {
    case 'ok':
      return 'bg-status-ok'
    case 'near':
      return 'bg-status-near'
    case 'out':
      return 'bg-status-out'
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
  <!--
    Zahl **neben** dem Balken, nicht darauf.
    Bei einem divergierenden Balken läuft die Füllkante genau durch die Mitte —
    dort stand die Beschriftung und wurde von ihr zerschnitten. Schatten oder
    Ringe kaschierten das nur und wirkten schmutzig. Nebeneinander ist beides
    ungestört: der Balken zeigt Richtung und Ausmaß, die Zahl den Wert.
  -->
  <div class="flex items-center gap-2" role="img" :aria-label="`Delta ${label}`">
    <div
      class="relative flex-1 overflow-hidden bg-sunken"
      :class="compact ? 'h-4' : 'h-5'"
    >
      <!-- Bandgrenzen als Striche, ohne Flächenton -->
      <div class="absolute top-0 bottom-0 border-x border-ink/20" :style="bandLeftStyle"></div>
      <div class="absolute top-0 bottom-0 border-x border-ink/20" :style="bandRightStyle"></div>

      <!-- Balken-Füllung -->
      <div
        class="absolute transition-all"
        :class="fillClasses"
        :style="{ ...fillStyle, top: '3px', bottom: '3px' }"
      ></div>

      <!-- Zentrums-Linie (Ziel) — nur ein Hauch, sie soll den Balken nicht teilen -->
      <div class="absolute top-0 bottom-0 w-px bg-ink/25 z-10" style="left: 50%"></div>
    </div>

    <span class="w-14 shrink-0 text-right text-xs tabular-nums text-ink-secondary">
      {{ label }}
    </span>
  </div>
</template>
