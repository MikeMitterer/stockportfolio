<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { NButton, NButtonGroup, NSpin } from 'naive-ui'
import { buildSparkline } from '@/domain/sparkline'
import { changeFrom, extent, indexAtRatio, niceTicks, tickIndices } from '@/domain/chart'
import { eurCent, formatterLocale, money, percentSigned } from '@/domain/formatters'
import { useHistoryStore } from '@/stores/history'
import type { Period } from '@/api/types'
import type { StockInfoClient } from '@/api/client'
import type { Position } from '@/types/portfolio'

/**
 * Kursverlauf als Diagramm — für die aufgeklappte Detailansicht.
 *
 * Anders als die Linie in der Tabellenzeile hat es Achsen: links die Kurse,
 * rechts dieselben Linien als Veränderung seit Beginn des Zeitraums. Das sind
 * nicht zwei Datenreihen, sondern zwei Lesarten derselben — mancher denkt in
 * Kursen, mancher in Prozent, und beide sollen nicht rechnen müssen.
 *
 * Weiterhin ohne Diagramm-Bibliothek. Eine Linie, ein paar Striche und ein
 * Zeiger sind weniger Code als die Einbindung eines Pakets, und die
 * Theme-Farben gelten von selbst.
 */
const props = defineProps<{
  position: Position
  client: StockInfoClient | null
  /** Währung für die Beschriftung — die des Kurses, nicht die Basiswährung. */
  currency: string
}>()

const { t } = useI18n()

const historyStore = useHistoryStore()

/**
 * Zeitraum, den die Detailansicht zeigt.
 *
 * 3 Monate als Vorgabe: kurz genug, um die aktuelle Bewegung zu sehen, lang
 * genug, dass ein einzelner Ausreißer nicht das ganze Bild bestimmt.
 */
const period = ref<Period>('3m')

const PERIODS = computed<{ value: Period; label: string }[]>(() => [
  { value: '1m', label: t('history.short.m1') },
  { value: '3m', label: t('history.short.m3') },
  { value: '1y', label: t('history.short.y1') },
  { value: 'max', label: t('history.short.max') },
])

/**
 * Ränder für die Beschriftung.
 *
 * Links breiter als rechts: Dort stehen Kurse mit Währungszeichen, rechts nur
 * Prozentwerte.
 */
const MARGIN = { top: 8, right: 54, bottom: 22, left: 62 }
const HEIGHT = 200

/**
 * Gezeichnet wird in echten Pixeln, nicht in einem gedehnten Koordinatensystem.
 *
 * Ein `viewBox` mit `preserveAspectRatio="none"` würde die Beschriftung
 * mitverzerren — Text wäre je nach Fensterbreite gestaucht oder in die Länge
 * gezogen. Deshalb misst die Komponente ihre Breite und rechnet damit.
 */
const container = ref<HTMLElement | null>(null)
const width = ref<number>(640)

let observer: ResizeObserver | null = null

onMounted(() => {
  if (!container.value || typeof ResizeObserver === 'undefined') return
  observer = new ResizeObserver((entries) => {
    const measured = entries[0]?.contentRect.width ?? 0
    if (measured > 0) width.value = Math.round(measured)
  })
  observer.observe(container.value)
})

onBeforeUnmount(() => {
  observer?.disconnect()
  observer = null
})

const plotWidth = computed(() => Math.max(80, width.value - MARGIN.left - MARGIN.right))
const plotHeight = HEIGHT - MARGIN.top - MARGIN.bottom

// ─── Daten ──────────────────────────────────────────────────────────────────

const series = computed(() => historyStore.get(props.position, period.value))
const points = computed(() => series.value.points)

/** Achsenteilung — sie legt auch den Wertebereich der Linie fest. */
const ticks = computed(() => {
  const range = extent(points.value)
  if (!range) return []
  return niceTicks(range.min, range.max, 4)
})

const domain = computed(() => {
  const list = ticks.value
  if (list.length < 2) return undefined
  return { min: list[0] as number, max: list[list.length - 1] as number }
})

const line = computed(() =>
  buildSparkline(points.value, plotWidth.value, plotHeight, domain.value),
)

const stroke = computed(() =>
  line.value.rising ? 'rgb(var(--status-ok))' : 'rgb(var(--status-out))',
)

/** Erster Kurs des Zeitraums — Bezugspunkt der rechten Achse. */
const first = computed(() => points.value[0]?.close ?? 0)

/** Y-Position eines Wertes im Diagramm. */
function yOf(value: number): number {
  const scale = domain.value
  if (!scale || scale.max === scale.min) return plotHeight / 2
  return plotHeight - ((value - scale.min) / (scale.max - scale.min)) * plotHeight
}

/** X-Position eines Punktes. */
function xOf(index: number): number {
  const count = points.value.length
  if (count <= 1) return 0
  return (index * plotWidth.value) / (count - 1)
}

// ─── Zeitachse ──────────────────────────────────────────────────────────────

const xTicks = computed(() =>
  tickIndices(points.value.length, 5).map((index) => ({
    index,
    x: xOf(index),
    label: axisDate(points.value[index]?.date ?? ''),
  })),
)

/**
 * Datum für die Achse — Auflösung nach Zeitraum.
 *
 * Bei einem Jahr steht der Tag nur im Weg; bei einem Monat ist der Monat
 * allein zu grob.
 */
function axisDate(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  const long = period.value === '1y' || period.value === 'max'
  return long
    ? date.toLocaleDateString(formatterLocale(), { month: 'short', year: '2-digit' })
    : date.toLocaleDateString(formatterLocale(), { day: '2-digit', month: '2-digit' })
}

/** Betrag in der Währung des Papiers — nicht jedes notiert in Euro. */
function price(value: number): string {
  return props.currency.toUpperCase() === 'EUR' ? eurCent(value) : money(value, props.currency)
}

/** Achsenbeschriftung: knapper als in der Tabelle, sonst wird die Achse breit. */
function axisPrice(value: number): string {
  return value.toLocaleString(formatterLocale(), { maximumFractionDigits: value >= 100 ? 0 : 2 })
}

// ─── Zeiger ─────────────────────────────────────────────────────────────────

/** Index unter dem Mauszeiger; `-1` heißt: Maus ist weg. */
const hovered = ref<number>(-1)

const hoveredPoint = computed(() => {
  const index = hovered.value
  if (index < 0) return null
  const point = points.value[index]
  if (!point) return null
  return {
    index,
    date: point.date,
    close: point.close,
    change: changeFrom(point.close, first.value),
    x: xOf(index),
    y: yOf(point.close),
  }
})

function onMove(event: MouseEvent): void {
  const rect = (event.currentTarget as SVGElement).getBoundingClientRect()
  const ratio = (event.clientX - rect.left - MARGIN.left) / plotWidth.value
  hovered.value = indexAtRatio(ratio, points.value.length)
}

function onLeave(): void {
  hovered.value = -1
}

function fullDate(iso: string): string {
  const date = new Date(iso)
  return Number.isNaN(date.getTime()) ? iso : date.toLocaleDateString(formatterLocale())
}

/**
 * Der Kasten wandert mit, kippt aber am rechten Rand nach links — sonst
 * stünde er außerhalb des Diagramms.
 */
const tooltipStyle = computed(() => {
  const point = hoveredPoint.value
  if (!point) return {}
  const flip = point.x > plotWidth.value * 0.6
  return {
    left: `${MARGIN.left + point.x + (flip ? -12 : 12)}px`,
    top: `${MARGIN.top + point.y}px`,
    transform: flip ? 'translate(-100%, -50%)' : 'translate(0, -50%)',
  }
})

// Beim Öffnen und bei jedem Wechsel des Zeitraums nachladen. Der Store
// entscheidet, ob das eine Anfrage kostet — meist liegt es schon da.
watch(
  [() => props.position.id, period],
  () => {
    hovered.value = -1
    void historyStore.ensure(props.client, props.position, period.value)
  },
  { immediate: true },
)
</script>

<template>
  <div class="flex flex-col gap-2">
    <div class="flex items-center justify-between gap-4 flex-wrap">
      <div class="flex items-baseline gap-3">
        <span class="text-sm font-medium">{{ t('history.heading') }}</span>
        <span
          v-if="line.path"
          class="text-sm tabular-nums"
          :class="line.rising ? 'text-status-ok' : 'text-status-out'"
        >
          {{ percentSigned(line.changePercent) }}
        </span>
      </div>

      <NButtonGroup size="tiny">
        <NButton
          v-for="entry in PERIODS"
          :key="entry.value"
          :type="entry.value === period ? 'primary' : 'default'"
          :secondary="entry.value !== period"
          @click="period = entry.value"
        >
          {{ entry.label }}
        </NButton>
      </NButtonGroup>
    </div>

    <div ref="container" class="relative w-full rounded-md bg-sunken">
      <NSpin
        v-if="series.loading && points.length === 0"
        size="small"
        class="my-16 mx-auto block"
      />

      <svg
        v-else-if="line.path"
        :width="width"
        :height="HEIGHT"
        class="block select-none"
        role="img"
        :aria-label="`Kursverlauf ${percentSigned(line.changePercent)}`"
        @mousemove="onMove"
        @mouseleave="onLeave"
      >
        <!-- Waagrechte Hilfslinien, eine je Achsenstrich. -->
        <g v-for="tick in ticks" :key="tick">
          <line
            :x1="MARGIN.left"
            :x2="MARGIN.left + plotWidth"
            :y1="MARGIN.top + yOf(tick)"
            :y2="MARGIN.top + yOf(tick)"
            stroke="rgb(var(--border-subtle))"
            stroke-width="1"
          />
          <!-- Links der Kurs … -->
          <text
            :x="MARGIN.left - 8"
            :y="MARGIN.top + yOf(tick)"
            text-anchor="end"
            dominant-baseline="middle"
            class="fill-ink-muted"
            style="font-size: 10px"
          >
            {{ axisPrice(tick) }}
          </text>
          <!-- … rechts dieselbe Linie als Veränderung seit Beginn. -->
          <text
            :x="MARGIN.left + plotWidth + 8"
            :y="MARGIN.top + yOf(tick)"
            text-anchor="start"
            dominant-baseline="middle"
            class="fill-ink-muted"
            style="font-size: 10px"
          >
            {{ percentSigned(changeFrom(tick, first)) }}
          </text>
        </g>

        <!-- Zeitachse -->
        <g v-for="tick in xTicks" :key="`x-${tick.index}`">
          <line
            :x1="MARGIN.left + tick.x"
            :x2="MARGIN.left + tick.x"
            :y1="MARGIN.top + plotHeight"
            :y2="MARGIN.top + plotHeight + 4"
            stroke="rgb(var(--border-default))"
            stroke-width="1"
          />
          <text
            :x="MARGIN.left + tick.x"
            :y="HEIGHT - 6"
            text-anchor="middle"
            class="fill-ink-muted"
            style="font-size: 10px"
          >
            {{ tick.label }}
          </text>
        </g>

        <g :transform="`translate(${MARGIN.left}, ${MARGIN.top})`">
          <path :d="line.areaPath" :fill="stroke" fill-opacity="0.12" />
          <path
            :d="line.path"
            fill="none"
            :stroke="stroke"
            stroke-width="1.75"
            stroke-linejoin="round"
            stroke-linecap="round"
          />

          <!-- Zeiger: senkrechte Linie und Punkt auf der Kurve. -->
          <template v-if="hoveredPoint">
            <line
              :x1="hoveredPoint.x"
              :x2="hoveredPoint.x"
              y1="0"
              :y2="plotHeight"
              stroke="rgb(var(--text-muted))"
              stroke-width="1"
              stroke-dasharray="3 3"
            />
            <circle
              :cx="hoveredPoint.x"
              :cy="hoveredPoint.y"
              r="3.5"
              :fill="stroke"
              stroke="rgb(var(--surface-sunken))"
              stroke-width="1.5"
            />
          </template>
        </g>
      </svg>

      <p v-else class="py-16 text-center text-xs text-ink-muted">
        {{ series.error ?? t('history.none') }}
      </p>

      <!--
        Der Kasten als HTML, nicht im SVG: Dort müsste jede Zeile einzeln
        positioniert werden, und ein Hintergrund hinter Text gäbe es nicht
        ohne zusätzliches Rechteck.
      -->
      <div
        v-if="hoveredPoint"
        class="pointer-events-none absolute z-10 rounded-md border border-edge bg-card px-2.5 py-1.5
               shadow-lg whitespace-nowrap"
        :style="tooltipStyle"
      >
        <div class="text-[11px] text-ink-muted">{{ fullDate(hoveredPoint.date) }}</div>
        <div class="text-sm font-medium tabular-nums">{{ price(hoveredPoint.close) }}</div>
        <div
          class="text-[11px] tabular-nums"
          :class="hoveredPoint.change >= 0 ? 'text-status-ok' : 'text-status-out'"
        >
          {{ t('history.sinceStart', { value: percentSigned(hoveredPoint.change) }) }}
        </div>
      </div>
    </div>

    <p v-if="line.path" class="text-[11px] text-ink-muted">
      {{ t('history.axisHint', { date: fullDate(points[0]?.date ?? '') }) }}
    </p>
  </div>
</template>
