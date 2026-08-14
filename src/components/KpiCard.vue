<script setup lang="ts">
import InfoHint from '@/components/InfoHint.vue'

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
  <div class="kpi">
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
    </div>
  </div>
</template>

<style scoped lang="scss">
.kpi {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
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
    display: flex;
    align-items: center;
    gap: var(--space-1);
    font-size: 0.6875rem;
    line-height: 1.25;
    text-transform: uppercase;
    letter-spacing: 0.025em;
    color: token(--text-muted);
  }

  &__row {
    display: flex;
    align-items: baseline;
    gap: var(--space-2);
    min-width: 0;
  }

  &__value {
    font-size: var(--font-base);
    font-weight: 600;
    line-height: 1.25;

    &--default { color: token(--text-primary); }
    &--positive { color: token(--status-ok); }
    &--warning { color: token(--status-near); }
    &--danger { color: token(--status-out); }
  }

  &__hint {
    overflow: hidden;
    font-size: 0.6875rem;
    line-height: 1.25;
    color: token(--text-muted);
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}
</style>
