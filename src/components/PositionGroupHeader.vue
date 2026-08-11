<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { eur, eurSigned, percent } from '@/domain/formatters'
import { assetColor } from '@/domain/assetColors'
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
const color = computed(() => assetColor(props.group.group))

/**
 * Hintergrund der Kopfzeile — ein Hauch der Klassenfarbe.
 *
 * Bewusst aus derselben Farbe wie der Punkt davor statt aus einem neutralen
 * Grau: die Zeile hebt sich ab und verstärkt zugleich die Zuordnung, ohne
 * eine zweite Gestaltungssprache einzuführen. Bei 7 % bleibt es eine
 * Andeutung — kräftiger las sich die Zeile wie ein Schaltfeld.
 */
const bandColor = computed(() => `color-mix(in srgb, ${color.value} 7%, transparent)`)
</script>

<template>
  <!--
    Klickfläche über die ganze Zeile (gut bedienbar), aber optisch reagiert
    nur das Label links — eine Zeile, die auf voller Breite aufleuchtet,
    liest sich als Button statt als Gliederung.
  -->
  <button
    type="button"
    class="group w-full flex items-center gap-2.5 px-5 py-1.5 text-left text-ink-muted"
    :style="{ backgroundColor: bandColor }"
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

    <!-- Farbpunkt wie im Assetklassen-Balken oben — gleiche Klasse, gleiche Farbe -->
    <span
      class="inline-block w-1.5 h-1.5 rounded-full shrink-0"
      :style="{ backgroundColor: color }"
      aria-hidden="true"
    ></span>

    <span
      class="text-[11px] uppercase tracking-wider transition-colors group-hover:text-ink"
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
        :class="group.deltaEuro >= 0 ? 'text-status-ok/70' : 'text-status-out/70'"
      >
        {{ eurSigned(group.deltaEuro) }}
      </span>
      <span class="w-28 flex justify-center">
        <SuggestionBadge :suggestion="group.suggestion" :below-min-trade="group.belowMinTrade" plain />
      </span>
    </span>
  </button>
</template>
