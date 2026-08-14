<script setup lang="ts">
import { computed } from 'vue'
import { percentSigned } from '@/domain/formatters'
import type { Suggestion } from '@/types/portfolio'

/**
 * Divergierender Balken um die 0-%-Linie (= Ziel).
 * Skala ist relativ zum Ziel, hart geclippt bei ±MAX_SCALE %.
 * Faktisches Delta bleibt in der Textzahl korrekt.
 *
 * Derselbe Balken dient auf dem Dashboard dem Ist-Zustand und im Rebalancing
 * dem Zustand nach dem geplanten Trade — dort mit eigener Beschriftung. Eine
 * Abweichung soll überall gleich aussehen.
 */
const props = defineProps<{
  relativePercent: number
  /**
   * Status der Zeile — bestimmt die Farbe der Füllung.
   *
   * Vorher rechnete der Balken sich das aus den Bändern selbst aus. Dieselbe
   * Regel stand damit an zwei Stellen, und beim Kalender-Rebalancing wäre die
   * hiesige schlicht falsch: Dort gibt es kein laufendes Band, aber sehr wohl
   * einen Handlungsbedarf.
   */
  suggestion: Suggestion
  /** Knapp vor der Bandgrenze — gedämpfte Warnfarbe statt Grün. */
  near?: boolean
  compact?: boolean
  /** Ersetzt die Delta-Zahl rechts, etwa durch den Anteil am Gesamtvermögen. */
  label?: string
}>()

const MAX_SCALE = 50 // ±50 % vom Ziel = 100 % Balkenlänge

const clipped = computed(() => Math.max(-MAX_SCALE, Math.min(MAX_SCALE, props.relativePercent)))
const magnitude = computed(() => Math.abs(clipped.value) / MAX_SCALE)
const halfWidth = computed(() => `${(magnitude.value * 50).toFixed(2)}%`)
const isPositive = computed(() => clipped.value >= 0)

const state = computed<'ok' | 'near' | 'out'>(() => {
  if (props.suggestion !== 'ok') return 'out'
  return props.near ? 'near' : 'ok'
})

const fillStyle = computed(() => {
  return isPositive.value
    ? { left: '50%', width: halfWidth.value }
    : { right: '50%', width: halfWidth.value }
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
  <div class="delta" role="img" :aria-label="`Delta ${text}`">
    <div class="delta__track" :class="{ 'delta__track--compact': compact }">
      <!--
        Nur **eine** Linie: das Ziel.

        Vorher markierten zusätzlich beide Bandgrenzen ihre Kanten — zusammen
        mit der Ziel-Linie ergab das ein Strichmuster im Balken. Die Information
        war ohnehin doppelt: ob die Position im Band liegt, sagt bereits die
        Farbe der Füllung (grün, gelb, rot).

        Aus demselben Grund ist auch die Marke für „Anteil vorher" wieder weg:
        ohne geplanten Trade lag sie exakt auf der Füllkante und ergab dort mit
        der Ziel-Linie erneut ein Strichbündel. Was der Plan bewegt, steht in
        den Spalten „Kauf / Verkauf" und „Abw. Ziel".
      -->
      <div class="delta__fill" :class="`delta__fill--${state}`" :style="fillStyle"></div>

      <div class="delta__target"></div>
    </div>

    <span class="delta__value tabular-nums">{{ text }}</span>
  </div>
</template>

<style scoped lang="scss">
.delta {
  display: flex;
  align-items: center;
  gap: var(--space-2);

  &__track {
    position: relative;
    flex: 1;
    height: 1.25rem;
    overflow: hidden;
    border-radius: 0.25rem;
    background-color: token(--surface-sunken);

    &--compact { height: 1rem; }
  }

  /*
   * Statusfarben, nicht Klassenfarben: Hier geht es um „im Band / nahe /
   * draußen", nicht um die Assetklasse.
   *
   * Deckend, nicht halbdurchsichtig: Bei Teiltransparenz mischte sich die
   * Fläche darunter ein und die Farbe wirkte ausgewaschen.
   */
  &__fill {
    position: absolute;
    top: 3px;
    bottom: 3px;
    transition: all 0.15s ease;

    &--ok { background-color: token(--status-ok); }
    &--near { background-color: token(--status-near); }
    &--out { background-color: token(--status-out); }
  }

  &__target {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 50%;
    z-index: 10;
    width: 1px;
    background-color: token(--text-primary, 0.25);
  }

  &__value {
    flex-shrink: 0;
    width: 3.5rem;
    font-size: var(--font-xs);
    text-align: right;
    color: token(--text-secondary);
  }
}
</style>
