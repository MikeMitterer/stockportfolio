<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { eur, eurSigned, percent } from '@/domain/formatters'
import SuggestionBadge from '@/components/SuggestionBadge.vue'
import type { GroupResult } from '@/domain/rebalancing'

const props = defineProps<{
  group: GroupResult
  positionCount: number
  collapsed: boolean
}>()

const emit = defineEmits<{
  (event: 'toggle'): void
}>()

const { t } = useI18n()

const label = computed(() => t(`groups.${props.group.group}`))
</script>

<template>
  <button
    type="button"
    class="w-full flex items-center gap-3 px-5 py-2.5 text-left bg-neutral-100/60 dark:bg-neutral-800/40 hover:bg-neutral-100 dark:hover:bg-neutral-800/70 transition-colors"
    :aria-expanded="!collapsed"
    @click="emit('toggle')"
  >
    <svg
      class="w-3.5 h-3.5 shrink-0 text-neutral-500 transition-transform"
      :class="{ '-rotate-90': collapsed }"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      aria-hidden="true"
    >
      <path stroke-linecap="round" stroke-linejoin="round" d="M6 9l6 6 6-6" />
    </svg>

    <span class="text-sm font-medium">{{ label }}</span>
    <span class="text-xs text-neutral-500 tabular-nums">
      {{ positionCount }}
    </span>

    <span class="ml-auto flex items-center gap-5 text-xs tabular-nums">
      <span class="text-neutral-500 hidden md:inline">{{ eur(group.actualValue) }}</span>
      <span>
        {{ percent(group.actualPercent) }}
        <span class="text-neutral-500">/ {{ percent(group.targetPercent) }}</span>
      </span>
      <span
        class="hidden sm:inline w-24 text-right"
        :class="group.deltaEuro >= 0 ? 'text-emerald-500' : 'text-red-400'"
      >
        {{ eurSigned(group.deltaEuro) }}
      </span>
      <SuggestionBadge :suggestion="group.suggestion" />
    </span>
  </button>
</template>
