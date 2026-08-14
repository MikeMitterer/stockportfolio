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
    class="groupheader"
    :style="{ backgroundColor: bandColor }"
    :aria-expanded="!collapsed"
    @click="emit('toggle')"
  >
    <svg
      class="groupheader__chevron"
      :class="{ 'groupheader__chevron--collapsed': collapsed }"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2.5"
      aria-hidden="true"
    >
      <path stroke-linecap="round" stroke-linejoin="round" d="M6 9l6 6 6-6" />
    </svg>

    <!-- Farbpunkt wie im Assetklassen-Balken oben — gleiche Klasse, gleiche Farbe -->
    <span class="groupheader__dot" :style="{ backgroundColor: color }" aria-hidden="true"></span>

    <span class="groupheader__label">
      {{ label }}
      <span class="groupheader__count tabular-nums">{{ positionCount }}</span>
    </span>

    <span class="groupheader__figures tabular-nums">
      <span class="groupheader__value">{{ eur(group.actualValue) }}</span>
      <span>
        {{ percent(group.actualPercent) }}
        <span class="groupheader__target">/ {{ percent(group.targetPercent) }}</span>
      </span>
      <span
        class="groupheader__delta"
        :class="group.deltaEuro >= 0 ? 'groupheader__delta--up' : 'groupheader__delta--down'"
      >
        {{ eurSigned(group.deltaEuro) }}
      </span>
      <span class="groupheader__status">
        <SuggestionBadge :suggestion="group.suggestion" :below-min-trade="group.belowMinTrade" plain />
      </span>
    </span>
  </button>
</template>

<style scoped lang="scss">
.groupheader {
  @include row(0.625rem);
  width: 100%;
  padding: 0.375rem 1.25rem;
  text-align: left;
  @include muted(null);

  &:hover {
    .groupheader__chevron { opacity: 1; }
    .groupheader__label { color: token(--text-primary); }
  }

  &__chevron {
    flex-shrink: 0;
    width: 0.75rem;
    height: 0.75rem;
    opacity: 0.5;
    transition: all 0.15s ease;

    &--collapsed { transform: rotate(-90deg); }
  }

  &__dot {
    display: inline-block;
    flex-shrink: 0;
    width: 0.375rem;
    height: 0.375rem;
    border-radius: var(--radius-full);
  }

  &__label {
    font-size: 0.6875rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    transition: color 0.15s ease;
  }

  &__count { opacity: 0.5; }

  &__figures {
    @include row(1.25rem);
    margin-left: auto;
    font-size: 0.6875rem;
    opacity: 0.8;
  }

  &__value {
    display: none;

    @include up(md) { display: inline; }
  }

  &__target { opacity: 0.6; }

  &__delta {
    display: none;
    width: 6rem;
    text-align: right;

    @include up(sm) { display: inline; }

    &--up { color: token(--status-ok, 0.7); }
    &--down { color: token(--status-out, 0.7); }
  }

  &__status {
    display: flex;
    justify-content: center;
    width: 7rem;
  }
}
</style>
