<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { buildSparkline, type HistoryPoint } from '@/domain/sparkline'
import { percentSigned } from '@/domain/formatters'

const { t } = useI18n()

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
  <div class="spark">
    <svg
      v-if="line.path"
      :width="width"
      :height="height"
      :viewBox="`0 0 ${width} ${height}`"
      preserveAspectRatio="none"
      role="img"
      :aria-label="`Kursverlauf ${periodLabel}: ${label}`"
      :title="periodLabel ? `${periodLabel}: ${label}` : label"
      class="spark__chart"
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
      class="spark__placeholder"
      :style="{ width: `${width}px`, height: `${height}px` }"
      :title="loading ? t('status.quotesLoading') : t('history.none')"
    ></span>

    <span
      v-if="line.path"
      class="spark__value tabular-nums"
      :class="line.rising ? 'spark__value--rising' : 'spark__value--falling'"
    >
      {{ label }}
    </span>
    <span v-else class="spark__value spark__value--empty">
      {{ loading ? '…' : '—' }}
    </span>
  </div>
</template>

<style scoped lang="scss">
.spark {
  @include row(var(--space-2));

  &__chart {
    flex-shrink: 0;
    overflow: visible;
  }

  /*
   * Platzhalter mit denselben Maßen: Ohne ihn springt die Spaltenbreite,
   * sobald die ersten Verläufe eintreffen.
   */
  &__placeholder {
    display: inline-block;
    flex-shrink: 0;
  }

  &__value {
    width: 3.5rem;
    font-size: 0.6875rem;
    text-align: right;

    &--rising { color: token(--status-ok); }
    &--falling { color: token(--status-out); }
    &--empty { @include muted(null); }
  }
}
</style>
