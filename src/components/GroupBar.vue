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
  <div class="flex items-center gap-4 py-2">
    <!-- Farbpunkt + Name: die Farbe wiederholt sich in Balken und Tabelle -->
    <div class="w-36 shrink-0 flex items-center gap-2">
      <span
        class="inline-block w-2 h-2 rounded-full shrink-0"
        :style="{ backgroundColor: color }"
        aria-hidden="true"
      ></span>
      <span class="text-sm font-medium">{{ groupLabel }}</span>
    </div>

    <div class="relative flex-1 h-6 rounded-md bg-neutral-800/70 overflow-hidden">
      <div class="absolute rounded-sm transition-all" :style="{ ...actualStyle, top: '4px', bottom: '4px', left: '4px' }"></div>
      <!-- Ziel-Marke -->
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
