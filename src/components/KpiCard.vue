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
      return 'text-emerald-300'
    case 'warning':
      return 'text-amber-300'
    case 'danger':
      return 'text-red-300'
    default:
      return 'text-neutral-100 dark:text-neutral-100'
  }
})
</script>

<template>
  <div
    class="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-5 py-4 flex flex-col gap-1"
  >
    <div class="text-xs uppercase tracking-wide text-neutral-500 dark:text-neutral-400 font-medium">
      {{ label }}
    </div>
    <div class="text-2xl font-semibold tabular-nums" :class="toneClasses">
      {{ value }}
    </div>
    <div v-if="hint" class="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
      {{ hint }}
    </div>
  </div>
</template>
