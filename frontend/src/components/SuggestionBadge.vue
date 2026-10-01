<script setup lang="ts">
import { computed } from 'vue'
import { NTooltip } from 'naive-ui'
import { useI18n } from 'vue-i18n'
import type { Suggestion } from '@/types/portfolio'

const props = defineProps<{
  suggestion: Suggestion
  near?: boolean
  /**
   * Ruhige Variante ohne Pille — für die Gruppen-Kopfzeilen.
   *
   * Dieselbe Pille im Kopf **und** in jeder Zeile darunter ergab eine Spalte
   * aus lauter gerahmten Kapseln; nichts trat mehr hervor. Der Kopf fasst nur
   * zusammen, die Zeilen sind das Handlungssignal — also bekommt der Kopf
   * bloß Punkt und Wort in der Statusfarbe.
   */
  plain?: boolean
  /**
   * Außerhalb des Bandes, aber unter dem Mindest-Handelsvolumen.
   *
   * Das Etikett bleibt „OK" — für den Betrag lohnt keine Order. Verschweigen
   * lässt sich der Grund trotzdem nicht: Sonst steht in der Zeile daneben eine
   * sichtbare Abweichung ohne Erklärung, und man sucht den Fehler in der App.
   */
  belowMinTrade?: boolean
}>()

const { t } = useI18n()

const state = computed<'ok' | 'near' | 'buy' | 'sell'>(() => {
  if (props.suggestion !== 'ok') return props.suggestion
  return props.near ? 'near' : 'ok'
})

const label = computed(() => t(`suggestion.${state.value}`))

/**
 * Statusfarbe als CSS-Variable, gesetzt am Element.
 *
 * Die Farbe hängt am Zustand und wird an drei Stellen gebraucht — Text, Rand
 * und Fläche der Pille. Als eigene Variable steht sie einmal im Template und
 * der Stil greift sie dreimal ab; drei einzelne Inline-Angaben wären dieselbe
 * Information in dreifacher Ausfertigung.
 */
const color = computed(() => {
  switch (state.value) {
    case 'buy':
    case 'sell':
      return 'var(--status-out)'
    case 'near':
      return 'var(--status-near)'
    default:
      return 'var(--status-ok)'
  }
})

const arrow = computed(() => {
  switch (state.value) {
    case 'buy': return '↓'
    case 'sell': return '↑'
    case 'near': return '→'
    default: return '✓'
  }
})
</script>

<template>
  <!--
    Der Marker liegt absolut neben der Pille, nicht in ihr: Die Breite der
    Pille ist über alle Zeilen gleich, und genau so soll die Spalte auch
    bleiben.
  -->
  <span class="badge" :style="{ '--badge-color': color }">
    <!--
      Nur Symbol und Farbe (Mike, 2026-10-01). Die Bedeutung steht als
      zugänglicher Name und Tooltip am Badge; erklärt wird sie am
      Fragezeichen im Spaltenkopf „Status“.
    -->
    <span
      class="badge__pill"
      :class="{ 'badge__pill--plain': plain }"
      role="img"
      :aria-label="label"
      :title="label"
    >
      <span class="badge__dot" aria-hidden="true"></span>
      <span class="badge__arrow" aria-hidden="true">{{ arrow }}</span>
    </span>

    <NTooltip v-if="belowMinTrade" trigger="hover">
      <template #trigger>
        <span class="badge__mark" :aria-label="t('suggestion.belowMinTrade')">
          {{ t('suggestion.belowMinTradeMark') }}
        </span>
      </template>
      {{ t('suggestion.belowMinTrade') }}
    </NTooltip>
  </span>
</template>

<style scoped lang="scss">
.badge {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;

  &__pill {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-1);
    // Platz für Punkt und Symbol; die Breite ist für alle Zustände gleich,
    // damit die Spalte nicht wandert. Ein Umbruch ist nie gewollt.
    width: 2.75rem;
    padding: 0.125rem var(--space-2);
    white-space: nowrap;
    border: 1px solid color-mix(in srgb, rgb(var(--badge-color)) 45%, transparent);
    border-radius: var(--radius-full);
    background-color: color-mix(in srgb, rgb(var(--badge-color)) 14%, transparent);
    color: rgb(var(--badge-color));
    font-size: var(--font-xs);
    font-weight: 500;
    font-variant-numeric: tabular-nums;

    // Ohne Fläche und Rahmen, aber mit demselben Kastenmaß wie die Pille:
    // So stehen Punkt und Symbol im Gruppenkopf genau über denen der Zeilen.
    &--plain {
      border-color: transparent;
      background: none;
    }
  }

  // Punkt und Pfeil dürfen nicht schrumpfen: Wird die Pille eng, drückte
  // Flexbox den Punkt sonst zu einem senkrechten Strich zusammen.
  &__dot,
  &__arrow {
    flex-shrink: 0;
  }

  &__dot {
    display: inline-block;
    width: 0.375rem;
    height: 0.375rem;
    border-radius: var(--radius-full);
    background-color: rgb(var(--badge-color));
  }

  &__arrow {
    line-height: 1;
  }

  &__mark {
    position: absolute;
    right: -1.5rem;
    font-size: 0.5625rem;
    line-height: 1;
    text-transform: uppercase;
    letter-spacing: 0.025em;
    @include muted(null);
  }
}
</style>
