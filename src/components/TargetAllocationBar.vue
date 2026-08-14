<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { percent } from '@/domain/formatters'

const { t } = useI18n()

/**
 * Zeigt, wie viel des Depots bereits per Ziel-Anteil verplant ist.
 * Über 100 % widersprechen sich die Ziele — dann schlägt der Balken auf Rot um.
 */
const props = defineProps<{
  sum: number
  exceeded: boolean
}>()

/** Anteil der Balkenbreite; über 100 % gedeckelt, die Zahl bleibt wahr. */
const fillWidth = computed(() => `${Math.min(100, props.sum)}%`)

/** Der Teil über 100 % — als eigener Streifen am Ende sichtbar gemacht. */
const overflowWidth = computed(() =>
  props.exceeded ? `${Math.min(100, props.sum - 100)}%` : '0%',
)

const isComplete = computed(() => !props.exceeded && Math.abs(props.sum - 100) < 0.01)

/** Zustand der Verteilung — trägt Farbe für Balken und Zahl. */
const state = computed<'exceeded' | 'complete' | 'open'>(() => {
  if (props.exceeded) return 'exceeded'
  return isComplete.value ? 'complete' : 'open'
})
</script>

<template>
  <div class="allocation">
    <span class="allocation__label">{{ t('dashboard.targetDistribution') }}</span>

    <div class="allocation__track">
      <div
        class="allocation__fill"
        :class="`allocation__fill--${state}`"
        :style="{ width: fillWidth }"
      ></div>
      <!-- Überhang: sitzt am rechten Rand, damit „zu viel" sichtbar bleibt -->
      <div
        v-if="exceeded"
        class="allocation__overflow"
        :style="{ width: overflowWidth }"
      ></div>
    </div>

    <span class="allocation__value tabular-nums" :class="`allocation__value--${state}`">
      {{ percent(sum) }}
      <span v-if="exceeded" class="allocation__over">{{ t('common.overHundred') }}</span>
    </span>
  </div>
</template>

<style scoped lang="scss">
.allocation {
  display: flex;
  align-items: center;
  gap: var(--space-3);

  &__label {
    flex-shrink: 0;
    font-size: var(--font-xs);
    color: token(--text-muted);
  }

  &__track {
    position: relative;
    flex-shrink: 0;
    width: 8rem;
    height: 0.375rem;
    overflow: hidden;
    border-radius: var(--radius-full);
    background-color: token(--surface-sunken);
  }

  &__fill {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    border-radius: var(--radius-full);

    &--exceeded { background-color: token(--status-out, 0.7); }
    &--complete { background-color: token(--status-ok, 0.6); }
    &--open { background-color: token(--accent, 0.5); }
  }

  &__overflow {
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    background-color: token(--status-out, 0.9);
  }

  &__value {
    flex-shrink: 0;
    font-size: var(--font-xs);

    &--exceeded { color: token(--status-out); }
    &--complete { color: token(--status-ok); }
    &--open { color: token(--text-muted); }
  }

  &__over {
    margin-left: var(--space-1);
  }
}
</style>
