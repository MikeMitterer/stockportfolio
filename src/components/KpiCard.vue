<script setup lang="ts">
import { computed } from 'vue'
import InfoHint from '@/components/InfoHint.vue'

const props = defineProps<{
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

const toneClasses = computed(() => {
  switch (props.tone) {
    case 'positive':
      return 'text-status-ok'
    case 'warning':
      return 'text-status-near'
    case 'danger':
      return 'text-status-out'
    default:
      return 'text-ink'
  }
})
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
  <div class="flex flex-col gap-0.5 px-4 py-1.5 border-l border-edge first:border-l-0 first:pl-0">
    <div
      class="flex items-center gap-1 text-[11px] uppercase tracking-wide text-ink-muted leading-tight"
    >
      {{ label }}
      <InfoHint
        v-if="explanation"
        :text="explanation"
        :anchor="anchor"
        :settings-tab="settingsTab"
      />
    </div>
    <div class="flex items-baseline gap-2 min-w-0">
      <span class="text-base font-semibold tabular-nums leading-tight" :class="toneClasses">
        {{ value }}
      </span>
      <span v-if="hint" class="text-[11px] text-ink-muted leading-tight truncate" :title="hint">
        {{ hint }}
      </span>
    </div>
  </div>
</template>
