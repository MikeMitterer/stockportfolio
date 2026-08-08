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
  <!--
    Klickfläche über die ganze Zeile (gut bedienbar), aber optisch reagiert
    nur das Label links — eine Zeile, die auf voller Breite aufleuchtet,
    liest sich als Button statt als Gliederung.
  -->
  <button
    type="button"
    class="group w-full flex items-center gap-2.5 px-5 py-1.5 text-left text-neutral-500 dark:text-neutral-500"
    :aria-expanded="!collapsed"
    @click="emit('toggle')"
  >
    <svg
      class="w-3 h-3 shrink-0 transition-all opacity-50 group-hover:opacity-100"
      :class="{ '-rotate-90': collapsed }"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2.5"
      aria-hidden="true"
    >
      <path stroke-linecap="round" stroke-linejoin="round" d="M6 9l6 6 6-6" />
    </svg>

    <span
      class="text-[11px] uppercase tracking-wider transition-colors group-hover:text-neutral-700 dark:group-hover:text-neutral-300"
    >
      {{ label }}
      <span class="tabular-nums opacity-50">{{ positionCount }}</span>
    </span>

    <span class="ml-auto flex items-center gap-5 text-[11px] tabular-nums opacity-80">
      <span class="hidden md:inline">{{ eur(group.actualValue) }}</span>
      <span>
        {{ percent(group.actualPercent) }}
        <span class="opacity-60">/ {{ percent(group.targetPercent) }}</span>
      </span>
      <span
        class="hidden sm:inline w-24 text-right"
        :class="group.deltaEuro >= 0 ? 'text-emerald-600/60' : 'text-red-400/70'"
      >
        {{ eurSigned(group.deltaEuro) }}
      </span>
      <SuggestionBadge :suggestion="group.suggestion" />
    </span>
  </button>
</template>
