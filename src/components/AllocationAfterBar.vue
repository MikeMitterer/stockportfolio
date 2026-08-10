<script setup lang="ts">
import { computed } from 'vue'
import { percent } from '@/domain/formatters'

/**
 * Zeigt, wo der Anteil einer Position **nach** dem geplanten Trade liegt —
 * im Verhältnis zu Ziel und Toleranzband.
 *
 * Anders als der Delta-Balken auf dem Dashboard ist die Skala hier absolut
 * (Anteil am Gesamtvermögen), nicht relativ zum Ziel: beim Planen vergleicht
 * man Positionen untereinander, da muss dieselbe Länge dasselbe bedeuten.
 */
const props = defineProps<{
  percentAfter: number
  targetPercent: number
  lowerBandPercent: number
  upperBandPercent: number
  /** Anteil vor dem Trade — als blasse Marke, damit die Änderung sichtbar ist. */
  percentBefore: number
}>()

/** Obere Skalengrenze: etwas Luft über dem größten vorkommenden Wert. */
const scaleMax = computed(() =>
  Math.max(
    props.upperBandPercent,
    props.percentAfter,
    props.percentBefore,
    props.targetPercent,
    1,
  ) * 1.15,
)

const toPercent = (value: number): string => `${Math.max(0, (value / scaleMax.value) * 100)}%`

const bandStyle = computed(() => ({
  left: toPercent(props.lowerBandPercent),
  width: toPercent(props.upperBandPercent - props.lowerBandPercent),
}))

const fillStyle = computed(() => ({ width: toPercent(props.percentAfter) }))
const beforeStyle = computed(() => ({ left: toPercent(props.percentBefore) }))
const targetStyle = computed(() => ({ left: toPercent(props.targetPercent) }))

const isInBand = computed(
  () =>
    props.percentAfter >= props.lowerBandPercent && props.percentAfter <= props.upperBandPercent,
)

const fillClass = computed(() => (isInBand.value ? 'bg-status-ok' : 'bg-status-out'))
</script>

<template>
  <div class="flex items-center gap-2">
    <div
      class="relative flex-1 h-4 rounded-sm overflow-hidden bg-sunken"
      role="img"
      :aria-label="`Anteil nach dem Trade ${percent(percentAfter)}, Ziel ${percent(targetPercent)}`"
    >
      <!-- Toleranzband als Zone -->
      <div class="absolute top-0 bottom-0 bg-status-ok/15" :style="bandStyle"></div>

      <!-- Anteil nach dem Trade -->
      <div
        class="absolute transition-all"
        :class="fillClass"
        :style="{ ...fillStyle, left: 0, top: '2px', bottom: '2px' }"
      ></div>

      <!-- Ziel-Marke -->
      <div class="absolute top-0 bottom-0 w-px bg-ink/50 z-10" :style="targetStyle"></div>

      <!-- Anteil vorher — nur als feiner Strich, zeigt die Bewegung -->
      <div
        class="absolute top-0 bottom-0 w-px border-l border-dashed border-ink/40 z-10"
        :style="beforeStyle"
      ></div>
    </div>

    <span class="w-14 shrink-0 text-right text-xs tabular-nums text-ink-secondary">
      {{ percent(percentAfter) }}
    </span>
  </div>
</template>
