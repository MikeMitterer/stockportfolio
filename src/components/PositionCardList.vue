<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import PositionCard from '@/components/PositionCard.vue'
import { assetColor } from '@/domain/assetColors'
import { eur, percent } from '@/domain/formatters'
import type { GroupResult, PositionResult } from '@/domain/rebalancing'

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
  <div class="cardlist">
    <template v-for="entry in renderedGroups" :key="entry.group.group">
      <!-- Gruppen-Trenner: gleicher Farbton wie am Desktop -->
      <div
        class="cardlist__group"
        :style="{ '--group-color': assetColor(entry.group.group) }"
      >
        <span class="cardlist__name">
          <span class="cardlist__dot" aria-hidden="true"></span>
          {{ t(`groups.${entry.group.group}`) }}
        </span>
        <span class="tabular-nums">
          {{ percent(entry.group.actualPercent) }}
          <span class="cardlist__target">/ {{ percent(entry.group.targetPercent) }}</span>
          <span class="cardlist__value">{{ eur(entry.group.actualValue) }}</span>
        </span>
      </div>

      <PositionCard
        v-for="row in entry.rows"
        :key="row.position.id"
        :row="row"
      />
    </template>
  </div>
</template>

<style scoped lang="scss">
.cardlist {
  display: flex;
  flex-direction: column;

  /*
   * Die Assetfarbe kennzeichnet den Bereich, sie füllt ihn nicht: 7 % Anteil
   * reichen, um die Gruppe zu erkennen, ohne mit dem Inhalt zu konkurrieren.
   */
  &__group {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: var(--space-3);
    padding: 0.375rem var(--space-4);
    background-color: color-mix(in srgb, var(--group-color) 7%, transparent);
    font-size: 0.6875rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    @include muted(null);
  }

  &__name {
    @include row(var(--space-2));
  }

  &__dot {
    display: inline-block;
    flex-shrink: 0;
    width: 0.375rem;
    height: 0.375rem;
    border-radius: var(--radius-full);
    background-color: var(--group-color);
  }

  &__target { opacity: 0.6; }

  &__value {
    margin-left: var(--space-2);
    opacity: 0.7;
  }
}
</style>
