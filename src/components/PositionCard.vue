<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import DeltaBar from '@/components/DeltaBar.vue'
import SuggestionBadge from '@/components/SuggestionBadge.vue'
import { assetColor } from '@/domain/assetColors'
import { eur, eurCent, integer, percent } from '@/domain/formatters'
import type { PositionResult } from '@/domain/rebalancing'
import type { Bands } from '@/types/portfolio'

/**
 * Eine Position als Karte — die Mobilansicht.
 *
 * Bewusst nur zum Lesen: Rebalancing ist eine Tätigkeit, für die man sich
 * hinsetzt, und das bleibt am Desktop. Unterwegs zählt eine Frage — ist
 * etwas aus dem Band gelaufen? Deshalb Basisdaten, Delta und Status, aber
 * keine Eingabefelder und kein Trade-Simulator.
 */
const props = defineProps<{
  row: PositionResult
  bands: Bands
}>()

const { t } = useI18n()

const isCash = computed(() => props.row.position.group === 'cash')
const color = computed(() => assetColor(props.row.position.group))

const title = computed(() =>
  isCash.value ? props.row.position.displayName : props.row.position.symbol,
)
</script>

<template>
  <article
    class="border-b border-edge-subtle px-4 py-3 flex flex-col gap-2"
    :class="{ 'opacity-55': !row.isActive }"
  >
    <!-- Kopf: Papier und Status -->
    <div class="flex items-start justify-between gap-3">
      <div class="min-w-0 flex items-center gap-2">
        <span
          class="inline-block w-1.5 h-1.5 rounded-full shrink-0"
          :style="{ backgroundColor: color }"
          aria-hidden="true"
        ></span>
        <div class="min-w-0">
          <div class="flex items-center gap-2">
            <span class="font-medium text-sm">{{ title }}</span>
            <span
              v-if="!row.isActive"
              class="text-[10px] uppercase tracking-wide px-1.5 py-px rounded border border-edge text-ink-muted shrink-0"
            >
              inaktiv
            </span>
          </div>
          <div v-if="!isCash" class="text-xs text-ink-muted truncate">
            {{ row.position.displayName }}
          </div>
        </div>
      </div>

      <SuggestionBadge
        v-if="row.isActive"
        :suggestion="row.suggestion"
        :near="row.isNearBand"
        class="shrink-0"
      />
      <span v-else class="text-xs text-ink-muted shrink-0">zählt nicht mit</span>
    </div>

    <!-- Basisdaten -->
    <div class="flex items-baseline justify-between gap-3 text-sm">
      <span class="text-ink-muted text-xs tabular-nums">
        <template v-if="!isCash">
          {{ integer(row.position.units) }} Stk
          <template v-if="row.quote"> · {{ eurCent(row.quote.price) }}</template>
        </template>
        <template v-else>Verrechnungskonto</template>
      </span>
      <span class="tabular-nums font-medium">{{ eur(row.marketValue) }}</span>
    </div>

    <!-- IST gegen Ziel -->
    <div v-if="row.isActive" class="flex items-baseline justify-between gap-3 text-xs">
      <span class="text-ink-muted">{{ t('table.actualPercent') }} / {{ t('table.targetPercent') }}</span>
      <span class="tabular-nums">
        {{ percent(row.actualPercent) }}
        <span class="text-ink-muted">/ {{ percent(row.position.targetPercent) }}</span>
      </span>
    </div>

    <!-- Delta über die volle Breite -->
    <DeltaBar
      v-if="row.isActive"
      :relative-percent="row.relativeDeltaPercent"
      :bands="bands"
      compact
    />
  </article>
</template>
