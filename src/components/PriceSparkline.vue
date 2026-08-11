<script setup lang="ts">
import { computed } from 'vue'
import { buildSparkline, type HistoryPoint } from '@/domain/sparkline'
import { percentSigned } from '@/domain/formatters'

/**
 * Kursverlauf als kleine Linie — für die Tabellenzeile.
 *
 * Beantwortet eine Frage, die keine Zahl beantwortet: Kommt der Kurs gerade
 * von oben oder von unten? Ein Delta sagt, wie weit die Position vom Ziel
 * entfernt ist, aber nicht, wohin sie sich bewegt.
 *
 * Bewusst ohne Achsen, Gitter und Beschriftung. Auf 90 × 24 Pixel wäre das
 * unlesbar, und die genauen Werte stehen ohnehin in den Spalten daneben.
 */
const props = withDefaults(
  defineProps<{
    points: HistoryPoint[]
    loading?: boolean
    width?: number
    height?: number
    /** Zeitraum im Klartext — erscheint beim Überfahren. */
    periodLabel?: string
  }>(),
  { loading: false, width: 90, height: 24, periodLabel: '' },
)

const line = computed(() => buildSparkline(props.points, props.width, props.height))

/**
 * Farbe nach Richtung, nicht nach Status.
 *
 * Grün und Rot heißen hier „gestiegen" und „gefallen" — nicht „gut" und
 * „schlecht". Für den Handlungsbedarf gibt es die Statusspalte.
 */
const stroke = computed(() => (line.value.rising ? 'rgb(var(--status-ok))' : 'rgb(var(--status-out))'))

const label = computed(() => percentSigned(line.value.changePercent))
</script>

<template>
  <div class="flex items-center gap-2">
    <svg
      v-if="line.path"
      :width="width"
      :height="height"
      :viewBox="`0 0 ${width} ${height}`"
      preserveAspectRatio="none"
      role="img"
      :aria-label="`Kursverlauf ${periodLabel}: ${label}`"
      :title="periodLabel ? `${periodLabel}: ${label}` : label"
      class="shrink-0 overflow-visible"
    >
      <!-- Fläche nur angedeutet: Sie gibt der Linie Halt, ohne sie zu erschlagen. -->
      <path :d="line.areaPath" :fill="stroke" fill-opacity="0.12" />
      <path
        :d="line.path"
        fill="none"
        :stroke="stroke"
        stroke-width="1.5"
        stroke-linejoin="round"
        stroke-linecap="round"
        vector-effect="non-scaling-stroke"
      />
    </svg>

    <!--
      Platzhalter mit denselben Maßen: Ohne ihn springt die Spaltenbreite,
      sobald die ersten Verläufe eintreffen.
    -->
    <span
      v-else
      class="shrink-0 inline-block"
      :style="{ width: `${width}px`, height: `${height}px` }"
      :title="loading ? 'Kursverlauf wird geladen' : 'Kein Kursverlauf verfügbar'"
    ></span>

    <span
      v-if="line.path"
      class="text-[11px] tabular-nums w-14 text-right"
      :class="line.rising ? 'text-status-ok' : 'text-status-out'"
    >
      {{ label }}
    </span>
    <span v-else class="text-[11px] text-ink-muted w-14 text-right">
      {{ loading ? '…' : '—' }}
    </span>
  </div>
</template>
