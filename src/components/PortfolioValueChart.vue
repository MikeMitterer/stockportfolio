<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, useTemplateRef } from 'vue'
import { useI18n } from 'vue-i18n'
import { NButton, NButtonGroup, NTooltip } from 'naive-ui'
import { useIsCompact } from '@mmit/ux-foundation'
import { eur, percentSigned, shortDate } from '@/domain/formatters'
import { changeFrom, extent, indexAtRatio, niceTicks, tickIndices } from '@/domain/chart'
import { withinDays } from '@/domain/portfolioHistory'
import type { HistoryPoint } from '@/domain/sparkline'

/**
 * Wertverlauf des Depots — die ausführliche Ansicht.
 *
 * Zwei Linien mit unterschiedlichem Gewicht: Die **Schnappschüsse** sind das,
 * was tatsächlich dastand, und stehen kräftig; der **Rückblick** rechnet den
 * heutigen Bestand gegen alte Kurse und steht blass dahinter. Ohne diesen
 * Unterschied sähe eine gerechnete Kurve so verlässlich aus wie eine gemessene.
 */
const props = defineProps<{
  /** Gerechnet aus heutigem Bestand und alten Kursen. */
  backtest: HistoryPoint[]
  /** Tatsächlich festgehaltene Tageswerte. */
  snapshots: HistoryPoint[]
  /** Ab wann die Angabe echt ist, ISO-Datum. */
  truthFrom: string | null
  /** Solange die Kurse geholt werden — „lädt" ist nicht „gibt es nicht". */
  loading?: boolean
}>()

const { t } = useI18n()

/** Auf dem Telefon gibt es kein Überfahren — dort öffnet die Erklärung per Tipp. */
const isCompact = useIsCompact()

const HEIGHT = 200

/**
 * Rand um die Zeichenfläche — er trägt die Achsenbeschriftungen.
 *
 * Die Zahlen sind gerechnet, nicht geschätzt, denn beide Achsen klebten einmal
 * am Rand: Links steht der Betrag rechtsbündig vor der Achse, `€ 1.234.567` sind
 * bei 10 px rund 66 px plus Abstand. Unten steht ein Datum in `dateStyle:
 * 'medium'` — auf Deutsch „18. Aug. 2026", rund 70 px breit. Dessen Überstand
 * fängt nicht der Rand ab, sondern der Anker an den Enden (siehe `zeitAnker`),
 * sonst wäre rechts die halbe Datumsbreite verschenkt.
 */
const MARGIN = { top: 12, right: 16, bottom: 26, left: 80 }

/** Abstand der Betragsbeschriftung zur senkrechten Achse. */
const LABEL_GAP = 10

type PeriodId = 'm1' | 'm3' | 'y1' | 'max' | 'real'

/** Länge des Ausschnitts in Tagen; 0 heißt „alles, was da ist". */
const PERIOD_DAYS: Record<PeriodId, number> = { m1: 30, m3: 90, y1: 365, max: 0, real: 0 }

/**
 * Die vier Längen der Reihe nach. „Echt" steht nicht darin: Es ist kein
 * Längenmaß, sondern eine Auswahl der Quelle, und steht deshalb abgesetzt
 * hinter der Gruppe.
 */
const PERIODS = computed<{ id: PeriodId; label: string }[]>(() => [
  { id: 'm1', label: t('history.short.m1') },
  { id: 'm3', label: t('history.short.m3') },
  { id: 'y1', label: t('history.short.y1') },
  { id: 'max', label: t('history.short.max') },
])

const selected = ref<PeriodId>('m3')

const days = computed(() => PERIOD_DAYS[selected.value])

/**
 * Nur die gemessene Reihe — der gerechnete Rückblick bleibt außen vor.
 *
 * Genau darum geht es in diesem Ausschnitt: zu sehen, was tatsächlich dastand.
 * Die gestrichelte Linie daneben rechnet den *heutigen* Bestand gegen alte
 * Kurse und würde die Frage wieder verwässern.
 */
const onlyMeasured = computed(() => selected.value === 'real')

/**
 * Aus einem einzigen Tageswert entsteht keine Linie — dann bleibt der Knopf
 * gesperrt und sagt beim Überfahren, warum.
 */
const realAvailable = computed(() => props.snapshots.length >= 2)

const container = useTemplateRef<HTMLElement>('container')
const width = ref<number>(720)

let observer: ResizeObserver | null = null

onMounted(() => {
  if (!container.value) return
  observer = new ResizeObserver((entries) => {
    const measured = entries[0]?.contentRect.width ?? 0
    if (measured > 0) width.value = Math.round(measured)
  })
  observer.observe(container.value)
})

onUnmounted(() => observer?.disconnect())

const plotWidth = computed(() => Math.max(1, width.value - MARGIN.left - MARGIN.right))
const plotHeight = HEIGHT - MARGIN.top - MARGIN.bottom

const shownBacktest = computed(() =>
  onlyMeasured.value ? [] : withinDays(props.backtest, days.value, new Date()),
)
const shownSnapshots = computed(() => withinDays(props.snapshots, days.value, new Date()))

/** Die Achse folgt der längeren Reihe — meist dem Rückblick. */
const axisPoints = computed(() =>
  shownBacktest.value.length >= shownSnapshots.value.length
    ? shownBacktest.value
    : shownSnapshots.value,
)

const bounds = computed(() => extent([...shownBacktest.value, ...shownSnapshots.value]))

const ticks = computed(() => (bounds.value ? niceTicks(bounds.value.min, bounds.value.max, 4) : []))

/** Rechnet einen Wert auf die senkrechte Achse. */
function y(value: number): number {
  const list = ticks.value
  if (list.length === 0) return MARGIN.top + plotHeight / 2
  const min = list[0]!
  const max = list[list.length - 1]!
  const span = max - min || 1
  return MARGIN.top + plotHeight - ((value - min) / span) * plotHeight
}

/** Rechnet ein Datum auf die waagrechte Achse. */
function x(date: string): number {
  const list = axisPoints.value
  if (list.length <= 1) return MARGIN.left
  const first = list[0]!.date
  const last = list[list.length - 1]!.date
  const span = Date.parse(last) - Date.parse(first) || 1
  return MARGIN.left + ((Date.parse(date) - Date.parse(first)) / span) * plotWidth.value
}

function path(points: HistoryPoint[]): string {
  if (points.length === 0) return ''
  return points
    .map((point, index) => `${index === 0 ? 'M' : 'L'}${x(point.date).toFixed(1)} ${y(point.close).toFixed(1)}`)
    .join(' ')
}

const backtestPath = computed(() => path(shownBacktest.value))
const snapshotPath = computed(() => path(shownSnapshots.value))

const timeTicks = computed(() =>
  tickIndices(axisPoints.value.length, 5).map((index) => axisPoints.value[index]!),
)

/**
 * Ausrichtung einer Datumsbeschriftung.
 *
 * Mittig ist richtig — außer an den Enden: Der erste Tick sitzt auf der
 * senkrechten Achse, der letzte am rechten Ende der Zeichenfläche. Mittig
 * ausgerichtet ragte dort jeweils die halbe Datumsbreite hinaus, rechts also
 * sichtbar über den Rand.
 */
function zeitAnker(index: number, anzahl: number): 'start' | 'middle' | 'end' {
  if (index === 0) return 'start'
  if (index === anzahl - 1) return 'end'
  return 'middle'
}

/** Veränderung über den gezeigten Zeitraum — die Zahl über dem Diagramm. */
const change = computed(() => {
  const list = shownSnapshots.value.length > 1 ? shownSnapshots.value : shownBacktest.value
  if (list.length < 2) return null
  return changeFrom(list[list.length - 1]!.close, list[0]!.close)
})

/**
 * Die Bildunterschrift erklärt, was zu sehen ist — also je Ausschnitt anders.
 *
 * Sonst stünde unter „Echt" eine Erklärung für zwei Linien, von denen dort nur
 * eine steht. Das Datum kommt aus `truthFrom`; fehlt es, tut es der erste
 * gezeigte Tageswert.
 */
const caption = computed(() => {
  if (onlyMeasured.value) {
    const from = props.truthFrom ?? shownSnapshots.value[0]?.date ?? null
    return t('valueHistory.captionReal', { date: shortDate(from) })
  }
  return props.truthFrom
    ? t('valueHistory.captionFrom', { date: shortDate(props.truthFrom) })
    : t('valueHistory.captionBacktestOnly')
})

// ─── Zeiger ─────────────────────────────────────────────────────────────────

const hovered = ref<number | null>(null)

const hoveredPoint = computed(() => {
  if (hovered.value === null) return null
  const point = axisPoints.value[hovered.value]
  if (!point) return null
  const first = axisPoints.value[0]!.close
  return { ...point, change: changeFrom(point.close, first) }
})

function onMove(event: MouseEvent): void {
  const box = (event.currentTarget as SVGElement).getBoundingClientRect()
  const ratio = (event.clientX - box.left - MARGIN.left) / plotWidth.value
  hovered.value = indexAtRatio(ratio, axisPoints.value.length)
}

const tooltipStyle = computed(() => {
  if (hovered.value === null || !hoveredPoint.value) return {}
  const left = x(hoveredPoint.value.date)
  // Am rechten Rand nach innen kippen, sonst steht der Kasten außerhalb.
  const flip = left > width.value - 140
  return { left: `${flip ? left - 12 : left + 12}px`, top: '8px', transform: flip ? 'translateX(-100%)' : '' }
})
</script>

<template>
  <div class="value-chart">
    <div class="value-chart__head">
      <span v-if="change !== null" class="value-chart__change tabular-nums" :class="change >= 0 ? 'value-chart__change--rising' : 'value-chart__change--falling'">
        {{ percentSigned(change) }}
      </span>

      <NButtonGroup size="tiny">
        <NButton
          v-for="entry in PERIODS"
          :key="entry.id"
          :type="entry.id === selected ? 'primary' : 'default'"
          :secondary="entry.id !== selected"
          @click="selected = entry.id"
        >
          {{ entry.label }}
        </NButton>
      </NButtonGroup>

      <!--
        Abgesetzt von der Gruppe: „Echt" wählt die Quelle, nicht die Länge. Der
        gesperrte Fall braucht zudem einen Rahmen um den Knopf — ein `disabled`
        nimmt keine Mausereignisse an, das Popup hinge sonst an nichts.
      -->
      <span class="value-chart__real">
        <NTooltip v-if="!realAvailable" :trigger="isCompact ? 'click' : 'hover'">
          <template #trigger>
            <span class="value-chart__lock" tabindex="0">
              <NButton size="tiny" secondary disabled>
                {{ t('valueHistory.periodReal') }}
              </NButton>
            </span>
          </template>
          {{ t('valueHistory.periodRealDisabled') }}
        </NTooltip>

        <NButton
          v-else
          size="tiny"
          :type="onlyMeasured ? 'primary' : 'default'"
          :secondary="!onlyMeasured"
          @click="selected = 'real'"
        >
          {{ t('valueHistory.periodReal') }}
        </NButton>
      </span>
    </div>

    <div ref="container" class="value-chart__canvas">
      <svg
        v-if="backtestPath || snapshotPath"
        :width="width"
        :height="HEIGHT"
        class="value-chart__svg"
        role="img"
        :aria-label="t('valueHistory.heading')"
        @mousemove="onMove"
        @mouseleave="hovered = null"
      >
        <g v-for="tick in ticks" :key="tick">
          <line
            :x1="MARGIN.left"
            :x2="MARGIN.left + plotWidth"
            :y1="y(tick)"
            :y2="y(tick)"
            class="value-chart__grid"
          />
          <text
            :x="MARGIN.left - LABEL_GAP"
            :y="y(tick) + 3"
            text-anchor="end"
            class="value-chart__axis"
          >
            {{ eur(tick) }}
          </text>
        </g>

        <text
          v-for="(point, index) in timeTicks"
          :key="point.date"
          :x="x(point.date)"
          :y="HEIGHT - 8"
          :text-anchor="zeitAnker(index, timeTicks.length)"
          class="value-chart__axis"
        >
          {{ shortDate(point.date) }}
        </text>

        <!-- Gerechnet: blass, damit sie nicht wie eine Messung aussieht. -->
        <path v-if="backtestPath" :d="backtestPath" class="value-chart__line value-chart__line--backtest" />
        <!-- Gemessen: kräftig. -->
        <path v-if="snapshotPath" :d="snapshotPath" class="value-chart__line value-chart__line--snapshot" />

        <line
          v-if="hoveredPoint"
          :x1="x(hoveredPoint.date)"
          :x2="x(hoveredPoint.date)"
          :y1="MARGIN.top"
          :y2="MARGIN.top + plotHeight"
          class="value-chart__cursor"
        />
      </svg>

      <p v-else class="value-chart__empty">
        {{ loading ? t('status.quotesLoading') : t('valueHistory.empty') }}
      </p>

      <div v-if="hoveredPoint" class="value-chart__tip" :style="tooltipStyle">
        <div class="value-chart__tip-date">{{ shortDate(hoveredPoint.date) }}</div>
        <div class="value-chart__tip-value tabular-nums">{{ eur(hoveredPoint.close) }}</div>
        <div
          class="value-chart__tip-change tabular-nums"
          :class="hoveredPoint.change >= 0 ? 'value-chart__change--rising' : 'value-chart__change--falling'"
        >
          {{ percentSigned(hoveredPoint.change) }}
        </div>
      </div>
    </div>

    <p class="value-chart__caption">{{ caption }}</p>
  </div>
</template>

<style scoped lang="scss">
.value-chart {
  @include stack;

  &__head {
    @include row(var(--space-3));

    justify-content: flex-end;
  }

  /* Nur Lage: Der Rahmen um den gesperrten Knopf soll ihn nicht umbrechen. */
  &__real,
  &__lock {
    display: inline-flex;
  }

  &__change {
    margin-right: auto;
    font-size: var(--font-sm);

    @include trend;
  }

  &__canvas {
    position: relative;
    width: 100%;
    border-radius: var(--radius-sm);
    background-color: token(--surface-sunken);
  }

  &__svg {
    display: block;
    user-select: none;
  }

  &__grid {
    stroke: token(--border-subtle);
    stroke-width: 1;
  }

  &__axis {
    fill: token(--text-muted);
    font-size: 10px;
  }

  &__line {
    fill: none;
    stroke-linecap: round;
    stroke-linejoin: round;

    &--backtest {
      stroke: token(--text-muted, 0.55);
      stroke-width: 1.25;
      stroke-dasharray: 3 3;
    }

    &--snapshot {
      stroke: token(--accent);
      stroke-width: 2;
    }
  }

  &__cursor {
    stroke: token(--text-muted, 0.5);
    stroke-width: 1;
  }

  &__empty {
    padding: var(--space-8) 0;
    text-align: center;

    @include muted;
  }

  &__tip {
    position: absolute;
    z-index: 10;
    padding: 0.375rem 0.625rem;
    border: 1px solid token(--border-default);
    border-radius: var(--radius-sm);
    background-color: token(--surface-card);
    white-space: nowrap;
    pointer-events: none;
  }

  &__tip-date,
  &__tip-change {
    font-size: 0.6875rem;
  }

  &__tip-date { @include muted(null); }

  &__tip-value {
    font-size: var(--font-sm);
    font-weight: 500;
  }

  &__caption {
    @include muted(0.6875rem);
  }
}
</style>
