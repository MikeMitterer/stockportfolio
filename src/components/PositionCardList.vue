<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import PositionCard from '@/components/PositionCard.vue'
import { assetColor } from '@/domain/assetColors'
import { eur, percent } from '@/domain/formatters'
import type { GroupResult, PositionResult } from '@/domain/rebalancing'
import type { Bands } from '@/types/portfolio'

/**
 * Die Positionen als Karten, nach Assetklasse gegliedert — Mobilansicht.
 *
 * Nutzt dieselben `PositionResult`-Objekte wie die Tabelle; es gibt keine
 * zweite Datenquelle und keinen eigenen Router-Zweig, nur eine andere
 * Darstellung.
 */
const props = defineProps<{
  rows: PositionResult[]
  groups: GroupResult[]
  bands: Bands
}>()

const { t } = useI18n()

interface RenderedGroup {
  group: GroupResult
  rows: PositionResult[]
}

/** Nur Gruppen mit Positionen — leere Überschriften wären Rauschen. */
const renderedGroups = computed<RenderedGroup[]>(() =>
  props.groups
    .map((group) => ({
      group,
      rows: props.rows.filter((row) => row.position.group === group.group),
    }))
    .filter((entry) => entry.rows.length > 0),
)
</script>

<template>
  <div class="flex flex-col">
    <template v-for="entry in renderedGroups" :key="entry.group.group">
      <!-- Gruppen-Trenner: gleicher Farbton wie am Desktop -->
      <div
        class="flex items-baseline justify-between gap-3 px-4 py-1.5 text-[11px] uppercase tracking-wider text-ink-muted"
        :style="{ backgroundColor: `color-mix(in srgb, ${assetColor(entry.group.group)} 7%, transparent)` }"
      >
        <span class="flex items-center gap-2">
          <span
            class="inline-block w-1.5 h-1.5 rounded-full shrink-0"
            :style="{ backgroundColor: assetColor(entry.group.group) }"
            aria-hidden="true"
          ></span>
          {{ t(`groups.${entry.group.group}`) }}
        </span>
        <span class="tabular-nums">
          {{ percent(entry.group.actualPercent) }}
          <span class="opacity-60">/ {{ percent(entry.group.targetPercent) }}</span>
          <span class="ml-2 opacity-70">{{ eur(entry.group.actualValue) }}</span>
        </span>
      </div>

      <PositionCard
        v-for="row in entry.rows"
        :key="row.position.id"
        :row="row"
        :bands="bands"
      />
    </template>
  </div>
</template>
