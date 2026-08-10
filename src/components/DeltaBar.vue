<script setup lang="ts">
import { computed } from 'vue'
import { percentSigned } from '@/domain/formatters'
import type { Bands } from '@/types/portfolio'

/**
 * Divergierender Balken um die 0-%-Linie (= Ziel).
 * Skala ist relativ zum Ziel, hart geclippt bei ±MAX_SCALE %.
 * Faktisches Delta bleibt in der Textzahl korrekt.
 *
 * Derselbe Balken dient auf dem Dashboard dem Ist-Zustand und im Rebalancing
 * dem Zustand nach dem geplanten Trade — dort mit `before` als zweiter Marke
 * und einer eigenen Beschriftung. Eine Abweichung soll überall gleich aussehen.
 */
const props = defineProps<{
  relativePercent: number
  bands: Bands
  compact?: boolean
  /**
   * Ausgangslage als blasse Marke, ebenfalls relativ zum Ziel.
   * Nur im Rebalancing gesetzt — dort zeigt sie, was der Plan bewegt.
   */
  before?: number | null
  /** Ersetzt die Delta-Zahl rechts, etwa durch den Anteil am Gesamtvermögen. */
  label?: string
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

const fillStyle = computed(() => {
  return isPositive.value
    ? { left: '50%', width: halfWidth.value }
    : { right: '50%', width: halfWidth.value }
})

/** Position der Ausgangs-Marke auf derselben Skala; Mitte = Ziel. */
const beforeStyle = computed(() => {
  const value = Math.max(-MAX_SCALE, Math.min(MAX_SCALE, props.before ?? 0))
  return { left: `${(50 + (value / MAX_SCALE) * 50).toFixed(2)}%` }
})

const text = computed(() => props.label ?? percentSigned(props.relativePercent))
</script>

<template>
  <!--
    Zahl **neben** dem Balken, nicht darauf.
    Bei einem divergierenden Balken läuft die Füllkante genau durch die Mitte —
    dort stand die Beschriftung und wurde von ihr zerschnitten. Schatten oder
    Ringe kaschierten das nur und wirkten schmutzig. Nebeneinander ist beides
    ungestört: der Balken zeigt Richtung und Ausmaß, die Zahl den Wert.
  -->
  <div class="flex items-center gap-2" role="img" :aria-label="`Delta ${text}`">
    <div
      class="relative flex-1 rounded-sm overflow-hidden bg-sunken"
      :class="compact ? 'h-4' : 'h-5'"
    >
      <!--
        Nur **eine** Linie: das Ziel.

        Vorher markierten zusätzlich beide Bandgrenzen ihre Kanten — zusammen
        mit der Ziel-Linie ergab das ein Strichmuster im Balken. Die Information
        war ohnehin doppelt: ob die Position im Band liegt, sagt bereits die
        Farbe der Füllung (grün, gelb, rot).
      -->
      <div
        class="absolute transition-all"
        :class="fillClasses"
        :style="{ ...fillStyle, top: '3px', bottom: '3px' }"
      ></div>

      <div class="absolute top-0 bottom-0 w-px bg-ink/25 z-10" style="left: 50%"></div>

      <div
        v-if="before !== null && before !== undefined"
        class="absolute top-0 bottom-0 w-px border-l border-dashed border-ink/40 z-10"
        :style="beforeStyle"
      ></div>
    </div>

    <span class="w-14 shrink-0 text-right text-xs tabular-nums text-ink-secondary">
      {{ text }}
    </span>
  </div>
</template>
