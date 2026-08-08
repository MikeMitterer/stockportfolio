<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { eur, eurSigned, percent } from '@/domain/formatters'
import SuggestionBadge from '@/components/SuggestionBadge.vue'
import type { GroupResult } from '@/domain/rebalancing'

const props = defineProps<{
  group: GroupResult
}>()

const { t } = useI18n()

const groupLabel = computed(() => t(`groups.${props.group.group}`))
const barMax = computed(() => Math.max(props.group.actualPercent, props.group.targetPercent, 1))
const actualStyle = computed(() => ({
  width: `${(props.group.actualPercent / barMax.value) * 100}%`,
}))
const targetPosition = computed(() => ({
  left: `${(props.group.targetPercent / barMax.value) * 100}%`,
}))
</script>

<template>
  <div class="flex items-center gap-4 py-2">
    <div class="w-32 shrink-0 text-sm font-medium">{{ groupLabel }}</div>

    <div class="relative flex-1 h-6 rounded-md bg-neutral-800/70 overflow-hidden">
      <!-- IST-Balken — gleiche Behandlung wie in DeltaBar: 4px eingerückt, rounded-sm -->
      <div
        class="absolute left-1 rounded-sm bg-sky-500/70 transition-all"
        :style="{ ...actualStyle, top: '4px', bottom: '4px' }"
      ></div>
      <!-- Ziel-Marker -->
      <div
        class="absolute top-0 bottom-0 w-0.5 bg-neutral-100 z-10"
        :style="targetPosition"
        :title="`Ziel: ${percent(group.targetPercent)}`"
      ></div>
    </div>

    <div class="w-24 text-right tabular-nums text-sm">{{ percent(group.actualPercent) }}</div>
    <div class="w-24 text-right tabular-nums text-xs text-neutral-500">
      / {{ percent(group.targetPercent) }}
    </div>
    <div class="w-32 text-right tabular-nums text-xs text-neutral-400">
      {{ eur(group.actualValue) }}
    </div>
    <div class="w-32 text-right tabular-nums text-xs">
      <span :class="group.deltaEuro >= 0 ? 'text-emerald-400' : 'text-red-400'">
        {{ eurSigned(group.deltaEuro) }}
      </span>
    </div>
    <div class="w-24 flex justify-end">
      <SuggestionBadge :suggestion="group.suggestion" />
    </div>
  </div>
</template>
