<script setup lang="ts">
import { computed } from 'vue'

/**
 * Längerer Katalogtext mit Absätzen und Hervorhebungen.
 *
 * Leerzeilen trennen Absätze, `**…**` markiert fett. Gerendert wird über
 * Textknoten statt `v-html`: Der Katalog bleibt Text, und nichts darin wird
 * als HTML ausgeführt.
 */
const props = defineProps<{
  /** Bereits übersetzter Text. */
  text: string
}>()

interface Part {
  text: string
  strong: boolean
}

const paragraphs = computed<Part[][]>(() =>
  props.text.split(/\n\s*\n/).map((paragraph) =>
    paragraph
      .split(/\*\*(.+?)\*\*/)
      .map((text, index) => ({ text, strong: index % 2 === 1 }))
      .filter((part) => part.text !== ''),
  ),
)
</script>

<template>
  <p v-for="(parts, index) in paragraphs" :key="index" class="emphasized">
    <template v-for="(part, partIndex) in parts" :key="partIndex">
      <strong v-if="part.strong">{{ part.text }}</strong>
      <template v-else>{{ part.text }}</template>
    </template>
  </p>
</template>

<style scoped lang="scss">
.emphasized {
  margin: 0;

  & + & { margin-top: var(--space-2); }

  strong { font-weight: 600; color: token(--text-primary); }
}
</style>
