<script setup lang="ts">
import { NTooltip } from 'naive-ui'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'

/**
 * Fragezeichen mit Kurzerklärung — für Begriffe, die nicht selbsterklärend sind.
 *
 * Erklärung dort, wo die Frage entsteht: Wer „Investitionsreserve" liest und
 * stutzt, sucht keine Hilfeseite, sondern will es an Ort und Stelle wissen.
 * Deshalb zwei, drei Sätze im Tooltip statt eines Verweises.
 *
 * Wer mehr will, kommt über „Mehr dazu" auf die Methodenseite. Die steht
 * bewusst nicht in der Hauptnavigation — sie ist zum Nachschlagen da, nicht
 * zum Durcharbeiten.
 */
const props = defineProps<{
  /** Bereits übersetzter Erklärungstext. */
  text: string
  /** Sprungmarke auf der Methodenseite; ohne sie erscheint kein Verweis. */
  anchor?: string
}>()

const { t } = useI18n()
const router = useRouter()

function openMethod(): void {
  void router.push({ path: '/method', hash: props.anchor ? `#${props.anchor}` : '' })
}
</script>

<template>
  <NTooltip trigger="hover" :style="{ maxWidth: '22rem' }">
    <template #trigger>
      <!--
        Klein und blass: Der Hinweis darf die Zahl daneben nicht überstrahlen.
        Als Knopf, nicht als Symbol — er ist mit der Tastatur erreichbar und
        führt bei Klick weiter.
      -->
      <button
        type="button"
        class="inline-flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border
               border-edge text-[9px] leading-none text-ink-muted align-middle
               transition-colors hover:border-ink-muted hover:text-ink-secondary"
        :aria-label="text"
        @click="openMethod"
      >
        ?
      </button>
    </template>

    <div class="text-sm leading-relaxed">
      {{ text }}
      <span v-if="anchor" class="mt-1 block text-xs text-accent">{{ t('method.more') }}</span>
    </div>
  </NTooltip>
</template>
