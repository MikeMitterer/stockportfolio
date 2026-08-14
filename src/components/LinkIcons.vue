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
  <div v-if="resolved.length > 0" class="linkicons">
    <a
      v-for="link in resolved"
      :key="link.id"
      :href="link.url"
      target="_blank"
      rel="noopener noreferrer"
      :title="link.label"
      class="linkicons__item"
      @click.stop
    >
      {{ abbreviate(link.label) }}
    </a>
  </div>
</template>

<style scoped lang="scss">
.linkicons {
  display: flex;
  align-items: center;
  gap: var(--space-1);

  &__item {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 1.25rem;
    height: 1.25rem;
    padding: 0 var(--space-1);
    border-radius: 0.25rem;
    border: 1px solid token(--border-default);
    font-size: 0.625rem;
    font-weight: 500;
    color: token(--text-muted);
    transition: color 0.15s ease, border-color 0.15s ease;

    &:hover {
      border-color: token(--accent, 0.6);
      color: token(--accent);
    }
  }
}
</style>
