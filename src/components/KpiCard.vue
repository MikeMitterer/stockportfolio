<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  label: string
  value: string
  hint?: string
  tone?: 'default' | 'positive' | 'warning' | 'danger'
}>()

const toneClasses = computed(() => {
  switch (props.tone) {
    case 'positive':
      return 'text-emerald-400'
    case 'warning':
      return 'text-amber-400'
    case 'danger':
      return 'text-red-400'
    default:
      return 'text-neutral-900 dark:text-neutral-100'
  }
})
</script>

<template>
  <!--
    Bewusst flach: keine Karte mit Rahmen und Fläche, nur eine Spalte mit
    feiner Trennlinie. Vier gerahmte Kästen nehmen für vier Zahlen zu viel
    Platz und Aufmerksamkeit weg von der Tabelle darunter.
  -->
  <div class="flex flex-col gap-0.5 px-4 py-2 border-l border-neutral-200 dark:border-neutral-800 first:border-l-0 first:pl-0">
    <div class="text-[11px] uppercase tracking-wide text-neutral-500 dark:text-neutral-500">
      {{ label }}
    </div>
    <div class="text-lg font-semibold tabular-nums leading-tight" :class="toneClasses">
      {{ value }}
    </div>
    <div v-if="hint" class="text-[11px] text-neutral-500 dark:text-neutral-600 leading-tight">
      {{ hint }}
    </div>
  </div>
</template>
