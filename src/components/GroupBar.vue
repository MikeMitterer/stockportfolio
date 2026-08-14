<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { eur, eurSigned, percent } from '@/domain/formatters'
import { assetColor } from '@/domain/assetColors'
import SuggestionBadge from '@/components/SuggestionBadge.vue'
import type { GroupResult } from '@/domain/rebalancing'

const props = defineProps<{
  group: GroupResult
}>()

const { t } = useI18n()

const groupLabel = computed(() => t(`groups.${props.group.group}`))
const color = computed(() => assetColor(props.group.group))

const barMax = computed(() => Math.max(props.group.actualPercent, props.group.targetPercent, 1))

const actualStyle = computed(() => ({
  width: `${(props.group.actualPercent / barMax.value) * 100}%`,
  backgroundColor: color.value,
}))

const targetPosition = computed(() => ({
  left: `${(props.group.targetPercent / barMax.value) * 100}%`,
}))
</script>

<template>
  <div class="groupbar">
    <!-- Farbpunkt + Name: die Farbe wiederholt sich in Balken und Tabelle -->
    <div class="groupbar__name">
      <span class="groupbar__dot" :style="{ backgroundColor: color }" aria-hidden="true"></span>
      <span class="groupbar__label">{{ groupLabel }}</span>
    </div>

    <div class="groupbar__track">
      <div class="groupbar__fill" :style="actualStyle"></div>
      <!-- Ziel-Marke -->
      <div
        class="groupbar__target"
        :style="targetPosition"
        :title="`Ziel: ${percent(group.targetPercent)}`"
      ></div>
    </div>

    <div class="groupbar__actual tabular-nums">{{ percent(group.actualPercent) }}</div>
    <div class="groupbar__goal tabular-nums">/ {{ percent(group.targetPercent) }}</div>
    <div class="groupbar__value tabular-nums">{{ eur(group.actualValue) }}</div>
    <div class="groupbar__delta tabular-nums">
      <span :class="group.deltaEuro >= 0 ? 'groupbar__up' : 'groupbar__down'">
        {{ eurSigned(group.deltaEuro) }}
      </span>
    </div>
    <div class="groupbar__status">
      <SuggestionBadge :suggestion="group.suggestion" :below-min-trade="group.belowMinTrade" />
    </div>
  </div>
</template>

<style scoped lang="scss">
.groupbar {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-2) 0;

  &__name {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    gap: var(--space-2);
    width: 9rem;
  }

  &__dot {
    display: inline-block;
    flex-shrink: 0;
    width: 0.5rem;
    height: 0.5rem;
    border-radius: var(--radius-full);
  }

  &__label {
    font-size: var(--font-sm);
    font-weight: 500;
  }

  &__track {
    position: relative;
    flex: 1;
    height: 1.5rem;
    overflow: hidden;
    border-radius: var(--radius-sm);
    background-color: token(--surface-sunken);
  }

  &__fill {
    position: absolute;
    top: 4px;
    bottom: 4px;
    left: 4px;
    border-radius: 0.25rem;
    transition: all 0.15s ease;
  }

  /* Die Ziel-Marke steht über der Füllung, sonst verschwindet sie darin. */
  &__target {
    position: absolute;
    top: 0;
    bottom: 0;
    z-index: 10;
    width: 2px;
    background-color: token(--text-primary);
  }

  &__actual {
    width: 6rem;
    font-size: var(--font-sm);
    text-align: right;
  }

  &__goal,
  &__value,
  &__delta {
    font-size: var(--font-xs);
    text-align: right;
  }

  &__goal {
    width: 6rem;
    color: token(--text-muted);
  }

  &__value {
    width: 8rem;
    color: token(--text-muted);
  }

  &__delta { width: 8rem; }

  &__up { color: token(--status-ok); }
  &__down { color: token(--status-out); }

  &__status {
    display: flex;
    justify-content: flex-start;
    width: 7rem;
  }
}
</style>
