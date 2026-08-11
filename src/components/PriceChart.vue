<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { NButton, NButtonGroup, NSpin } from 'naive-ui'
import { buildSparkline } from '@/domain/sparkline'
import { eurCent, money, percentSigned } from '@/domain/formatters'
import { useHistoryStore } from '@/stores/history'
import type { Period } from '@/api/types'
import type { StockInfoClient } from '@/api/client'
import type { Position } from '@/types/portfolio'

/**
 * Kursverlauf als größeres Diagramm — für die aufgeklappte Detailansicht.
 *
 * Anders als die Linie in der Zeile darf es hier Beschriftung geben: Hoch,
 * Tief und Zeitraum. Wer eine Zeile aufklappt, will Genaueres wissen.
 *
 * Weiterhin ohne Diagramm-Bibliothek. Was hier gebraucht wird — eine Linie,
 * zwei Hilfslinien, drei Beschriftungen — ist weniger Code als die Einbindung
 * eines Pakets, und es passt sich den Theme-Farben von selbst an.
 */
const props = defineProps<{
  position: Position
  client: StockInfoClient | null
  /** Währung für die Beschriftung — die des Kurses, nicht die Basiswährung. */
  currency: string
}>()

const historyStore = useHistoryStore()

/**
 * Zeitraum, den die Detailansicht zeigt.
 *
 * 3 Monate als Vorgabe: kurz genug, um die aktuelle Bewegung zu sehen, lang
 * genug, dass ein einzelner Ausreißer nicht das ganze Bild bestimmt.
 */
const period = ref<Period>('3m')

const PERIODS: { value: Period; label: string }[] = [
  { value: '1m', label: '1M' },
  { value: '3m', label: '3M' },
  { value: '1y', label: '1J' },
  { value: 'max', label: 'Max' },
]

const WIDTH = 560
const HEIGHT = 140

const series = computed(() => historyStore.get(props.position, period.value))
const line = computed(() => buildSparkline(series.value.points, WIDTH, HEIGHT))

const stroke = computed(() =>
  line.value.rising ? 'rgb(var(--status-ok))' : 'rgb(var(--status-out))',
)

/** Betrag in der Währung des Papiers — nicht jedes notiert in Euro. */
function price(value: number): string {
  return props.currency.toUpperCase() === 'EUR' ? eurCent(value) : money(value, props.currency)
}

const firstDate = computed(() => series.value.points[0]?.date ?? '')
const lastDate = computed(() => series.value.points[series.value.points.length - 1]?.date ?? '')

function shortDate(iso: string): string {
  if (!iso) return ''
  const date = new Date(iso)
  return Number.isNaN(date.getTime()) ? iso : date.toLocaleDateString('de-AT')
}

// Beim Öffnen und bei jedem Wechsel des Zeitraums nachladen. Der Store
// entscheidet, ob das eine Anfrage kostet — meist liegt es schon da.
watch(
  [() => props.position.id, period],
  () => {
    void historyStore.ensure(props.client, props.position, period.value)
  },
  { immediate: true },
)
</script>

<template>
  <div class="flex flex-col gap-2">
    <div class="flex items-center justify-between gap-4 flex-wrap">
      <div class="flex items-baseline gap-3">
        <span class="text-sm font-medium">Kursverlauf</span>
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

    <div class="relative rounded-md bg-sunken px-2 py-2">
      <NSpin v-if="series.loading && series.points.length === 0" size="small" class="my-10 mx-auto block" />

      <svg
        v-else-if="line.path"
        :viewBox="`0 0 ${WIDTH} ${HEIGHT}`"
        class="w-full"
        :style="{ height: `${HEIGHT}px` }"
        preserveAspectRatio="none"
        role="img"
        :aria-label="`Kursverlauf ${percentSigned(line.changePercent)} über ${period}`"
      >
        <!--
          Zwei Hilfslinien: Hoch und Tief. Ein volles Gitter wäre hier Zierrat —
          die genauen Werte stehen als Text daneben.
        -->
        <line
          x1="0" y1="0.5" :x2="WIDTH" y2="0.5" stroke="rgb(var(--border-default))"
          stroke-width="1" stroke-dasharray="3 3" vector-effect="non-scaling-stroke"
        />
        <line
          x1="0" :y1="HEIGHT - 0.5" :x2="WIDTH" :y2="HEIGHT - 0.5"
          stroke="rgb(var(--border-default))" stroke-width="1" stroke-dasharray="3 3"
          vector-effect="non-scaling-stroke"
        />

        <path :d="line.areaPath" :fill="stroke" fill-opacity="0.12" />
        <path
          :d="line.path"
          fill="none"
          :stroke="stroke"
          stroke-width="1.75"
          stroke-linejoin="round"
          stroke-linecap="round"
          vector-effect="non-scaling-stroke"
        />
      </svg>

      <p v-else class="py-10 text-center text-xs text-ink-muted">
        {{ series.error ?? 'Für dieses Papier liegt kein Verlauf vor.' }}
      </p>
    </div>

    <!-- Beschriftung als Text statt im Bild: im SVG skaliert sie mit und wird schief. -->
    <div v-if="line.path" class="flex items-center justify-between text-[11px] text-ink-muted">
      <span>{{ shortDate(firstDate) }}</span>
      <span class="tabular-nums">
        Tief {{ price(line.min) }} · Hoch {{ price(line.max) }}
      </span>
      <span>{{ shortDate(lastDate) }}</span>
    </div>
  </div>
</template>
