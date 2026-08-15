<script setup lang="ts">
import InfoHint from '@/components/InfoHint.vue'
import PriceSparkline from '@/components/PriceSparkline.vue'
import type { HistoryPoint } from '@/domain/sparkline'

defineProps<{
  label: string
  value: string
  hint?: string
  tone?: 'default' | 'positive' | 'warning' | 'danger'
  /** Kurzerklärung des Begriffs; ohne sie erscheint kein Fragezeichen. */
  explanation?: string
  /** Sprungmarke auf der Methodenseite. */
  anchor?: string
  /** Reiter in den Einstellungen, in dem der zugehörige Wert steht. */
  settingsTab?: string
  /**
   * Kleine Verlaufslinie neben der Zahl.
   *
   * Der Überblick soll auf einen Blick beantworten, wohin es geht — die Zahlen
   * dazu stehen im aufgeklappten Diagramm, nicht hier.
   */
  trend?: HistoryPoint[]
  /** Macht die Karte anklickbar; zeigt einen Pfeil an. */
  expandable?: boolean
  /** Zustand des Pfeils. */
  expanded?: boolean
}>()

const emit = defineEmits<{
  (event: 'toggle'): void
}>()
</script>

<template>
  <!--
    Bewusst flach: keine Karte mit Rahmen und Fläche, nur eine Spalte mit
    feiner Trennlinie. Vier gerahmte Kästen nehmen für vier Zahlen zu viel
    Platz und Aufmerksamkeit weg von der Tabelle darunter.

    Zwei Zeilen statt drei: Die Erläuterung steht neben der Zahl, nicht
    darunter. Sie ist ohnehin nur Beiwerk und muss keine eigene Zeile Höhe
    kosten — der Kopfbereich stand sonst über der Tabelle wie ein Block.
  -->
  <component
    :is="expandable ? 'button' : 'div'"
    class="kpi"
    :class="{ 'kpi--expandable': expandable }"
    :type="expandable ? 'button' : undefined"
    :aria-expanded="expandable ? expanded : undefined"
    @click="expandable && emit('toggle')"
  >
    <div class="kpi__label">
      {{ label }}
      <InfoHint
        v-if="explanation"
        :text="explanation"
        :anchor="anchor"
        :settings-tab="settingsTab"
      />
    </div>

    <div class="kpi__row">
      <span class="kpi__value tabular-nums" :class="`kpi__value--${tone ?? 'default'}`">
        {{ value }}
      </span>
      <span v-if="hint" class="kpi__hint" :title="hint">{{ hint }}</span>

      <PriceSparkline
        v-if="trend && trend.length > 1"
        class="kpi__trend"
        :points="trend"
        :width="64"
        :height="18"
      />

      <svg
        v-if="expandable"
        class="kpi__chevron"
        :class="{ 'kpi__chevron--open': expanded }"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2.5"
        aria-hidden="true"
      >
        <path stroke-linecap="round" stroke-linejoin="round" d="M6 9l6 6 6-6" />
      </svg>
    </div>
  </component>
</template>

<style scoped lang="scss">
.kpi {
  @include stack(0.125rem);
  /*
   * Untereinander gestapelt trennt eine Linie unten, nebeneinander eine
   * links. Bliebe es bei der linken, ergäben die gestapelten Kennzahlen auf
   * dem Telefon eine durchgehende Leiste am Rand, die nichts trennt.
   */
  padding: 0.375rem 0 var(--space-3);
  border-bottom: 1px solid token(--border-default);

  &:last-child {
    padding-bottom: 0;
    border-bottom: 0;
  }

  @include up(md) {
    padding: 0.375rem var(--space-4);
    border-bottom: 0;
    border-left: 1px solid token(--border-default);

    &:first-child {
      padding-left: 0;
      border-left: 0;
    }

    &:last-child {
      padding-bottom: 0.375rem;
    }
  }

  &__label {
    @include row(var(--space-1));
    font-size: 0.6875rem;
    line-height: 1.25;
    text-transform: uppercase;
    letter-spacing: 0.025em;
    @include muted(null);
  }

  &__row {
    @include row(var(--space-2), baseline);
    min-width: 0;
  }

  &__value {
    font-size: var(--font-base);
    font-weight: 600;
    line-height: 1.25;
    /* „+€ 5.000" darf nicht zwischen Vorzeichen und Betrag umbrechen. */
    white-space: nowrap;

    &--default { color: token(--text-primary); }
    &--positive { color: token(--status-ok); }
    &--warning { color: token(--status-near); }
    &--danger { color: token(--status-out); }
  }

  &--expandable {
    width: 100%;
    text-align: left;
    cursor: pointer;

    &:hover .kpi__chevron { opacity: 1; }
  }

  &__trend { flex-shrink: 0; }

  &__chevron {
    flex-shrink: 0;
    width: 0.75rem;
    height: 0.75rem;
    opacity: 0.4;
    transition: transform 0.15s ease, opacity 0.15s ease;

    &--open { transform: rotate(180deg); }
  }

  &__hint {
    overflow: hidden;
    font-size: 0.6875rem;
    line-height: 1.25;
    @include muted(null);
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}
</style>
