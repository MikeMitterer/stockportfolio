<script setup lang="ts">
import { computed } from 'vue'
import { NInputNumber, NSelect } from 'naive-ui'
import { useI18n } from 'vue-i18n'
import InfoHint from '@/components/InfoHint.vue'
import { convertAmount, resolveAmount } from '@/domain/amount'
import { eur } from '@/domain/formatters'
import type { AmountSetting } from '@/types/portfolio'

/**
 * Eingabe für einen Betrag, der wahlweise in Euro oder in Prozent gilt.
 *
 * Zwei Einstellungen brauchen genau dieses Feld — Sicherheitspuffer und
 * Mindest-Handelsvolumen. Beide mit derselben Umschaltung, derselben
 * Umrechnung beim Wechsel und derselben Kontrollzeile darunter; das gehört
 * an eine Stelle, nicht zweimal ins Formular.
 *
 * Reine Darstellung: Das Speichern macht die Ansicht, die Umrechnung die
 * Domäne.
 */
const props = defineProps<{
  /** Beschriftung des Feldes. */
  label: string
  /** Aktueller Wert. */
  setting: AmountSetting
  /** Gesamtvermögen — Bezugsgröße für Prozent und Kontrollzeile. */
  total: number
  /** Erklärungstext fürs Fragezeichen; ohne ihn erscheint keines. */
  hint?: string
  /** Sprungmarke auf der Methodenseite. */
  anchor?: string
  /** Kontrollzeile bei Wert 0 — was heißt „aus"? */
  zeroHint: string
  /** Schrittweite im Euro-Modus; in Prozent ist es immer 1. */
  absoluteStep?: number
}>()

const emit = defineEmits<{
  (event: 'update', setting: AmountSetting): void
}>()

const { t } = useI18n()

const modeOptions = computed(() => [
  { label: t('settings.bufferPercent'), value: 'percent' as const },
  { label: t('settings.bufferAbsolute'), value: 'absolute' as const },
])

/** Der eingestellte Betrag in Euro — im Prozent-Modus die eigentliche Zahl. */
const euro = computed(() => resolveAmount(props.setting, props.total))

function setValue(value: number | null): void {
  if (value === null) return
  emit('update', { ...props.setting, value })
}

function setMode(mode: AmountSetting['mode']): void {
  emit('update', convertAmount(props.setting, mode, props.total))
}
</script>

<template>
  <label class="flex flex-col gap-1 text-sm">
    <span class="inline-flex items-center gap-1.5 text-ink-muted">
      {{ label }}
      <InfoHint v-if="hint" :text="hint" :anchor="anchor" />
    </span>

    <div class="flex gap-2">
      <NInputNumber
        class="flex-1"
        :value="setting.value"
        :min="0"
        :step="setting.mode === 'percent' ? 1 : (absoluteStep ?? 1000)"
        @update:value="setValue"
      />
      <NSelect
        class="w-44 shrink-0"
        :value="setting.mode"
        :options="modeOptions"
        @update:value="setMode"
      />
    </div>

    <!--
      Der Euro-Betrag als Kontrolle: Im Prozent-Modus sieht man sonst nicht,
      worüber man gerade entscheidet.
    -->
    <span class="text-xs text-ink-muted">
      <template v-if="setting.value === 0">{{ zeroHint }}</template>
      <template v-else>{{ t('settings.bufferEquals', { amount: eur(euro) }) }}</template>
    </span>
  </label>
</template>
