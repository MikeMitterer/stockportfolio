<script setup lang="ts">
import { computed } from 'vue'
import { resolveLinks } from '@/domain/links'
import type { ExternalLink, Position } from '@/types/portfolio'

/**
 * Externe Verweise als kleine Symbole für die Tabellenzeile.
 *
 * In der Zeile ist kein Platz für ausgeschriebene Namen — daher ein Kürzel
 * je Verweis, der volle Name steht im Tooltip. Im aufgeklappten Bereich
 * erscheinen dieselben Verweise ausgeschrieben.
 */
const props = defineProps<{
  position: Pick<Position, 'isin' | 'symbol' | 'kind' | 'group'>
  links: ExternalLink[]
  quoteType?: string | null
}>()

const resolved = computed(() => resolveLinks(props.position, props.links, props.quoteType))

/**
 * Kürzel aus dem Namen: erster Buchstabe je Wort, höchstens zwei Zeichen.
 * „myOEKB — Meldefonds" wird zu „mM", „extraETF" zu „e".
 */
function abbreviate(label: string): string {
  const words = label
    .split(/[\s—–-]+/)
    .map((word) => word.trim())
    .filter(Boolean)

  if (words.length === 0) return '?'
  if (words.length === 1) return (words[0] ?? '').slice(0, 2)
  return words
    .slice(0, 2)
    .map((word) => word.charAt(0))
    .join('')
}
</script>

<template>
  <div v-if="resolved.length > 0" class="flex items-center gap-1">
    <a
      v-for="link in resolved"
      :key="link.id"
      :href="link.url"
      target="_blank"
      rel="noopener noreferrer"
      :title="link.label"
      class="inline-flex items-center justify-center h-5 min-w-[1.25rem] px-1 rounded text-[10px] font-medium
             text-neutral-400 border border-neutral-700 hover:text-sky-300 hover:border-sky-500/60
             transition-colors"
      @click.stop
    >
      {{ abbreviate(link.label) }}
    </a>
  </div>
</template>
