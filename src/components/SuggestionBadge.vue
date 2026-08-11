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
 * Statusfarbe als CSS-Variable statt fester Tailwind-Klasse.
 *
 * Feste Klassen wie `text-emerald-300` waren für dunkle Flächen gedacht und
 * verschwinden im hellen Theme fast. Über die Token bekommt jedes Theme die
 * Stufe, die auf seiner Fläche trägt.
 */
const color = computed(() => {
  switch (state.value) {
    case 'buy':
    case 'sell':
      return 'rgb(var(--status-out))'
    case 'near':
      return 'rgb(var(--status-near))'
    default:
      return 'rgb(var(--status-ok))'
  }
})

const arrow = computed(() => {
  if (state.value === 'buy') return '↓'
  if (state.value === 'sell') return '↑'
  return null
})
</script>

<template>
  <!--
    Der Marker liegt absolut neben der Pille, nicht in ihr: Die Breite der
    Pille ist über alle Zeilen gleich, und genau so soll die Spalte auch
    bleiben.
  -->
  <span class="relative inline-flex items-center justify-center">
    <span
      class="inline-flex w-[4.5rem] items-center justify-center gap-1 text-xs font-medium tabular-nums"
      :class="plain ? '' : 'rounded-full border px-2 py-0.5'"
      :style="
        plain
          ? { color }
          : {
            color,
            borderColor: `color-mix(in srgb, ${color} 45%, transparent)`,
            backgroundColor: `color-mix(in srgb, ${color} 14%, transparent)`,
          }
      "
    >
      <span
        class="inline-block h-1.5 w-1.5 rounded-full"
        :style="{ backgroundColor: color }"
      ></span>
      <span v-if="arrow" class="leading-none">{{ arrow }}</span>
      <span>{{ label }}</span>
    </span>

    <NTooltip v-if="belowMinTrade" trigger="hover">
      <template #trigger>
        <span
          class="absolute -right-6 text-[9px] uppercase tracking-wide leading-none text-ink-muted"
          :aria-label="t('suggestion.belowMinTrade')"
        >
          {{ t('suggestion.belowMinTradeMark') }}
        </span>
      </template>
      {{ t('suggestion.belowMinTrade') }}
    </NTooltip>
  </span>
</template>
