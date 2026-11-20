<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { safeStorage, UxCaret } from '@mmit/ux-foundation'
import GroupBar from '@/components/GroupBar.vue'
import { percent } from '@/domain/formatters'
import type { GroupResult } from '@/domain/rebalancing'

/**
 * Assetklassen-Balken über der Positionstabelle, ein- und ausklappbar; der
 * Zustand bleibt im Browser gespeichert (aus `DashboardView.vue`
 * herausgelöst, T-131).
 */
const props = defineProps<{ groups: GroupResult[] }>()

const { t } = useI18n()

/** Gruppen ohne Bestand und ohne Ziel wären leere Balken. */
const visibleGroups = computed(() =>
  props.groups.filter((group) => group.actualPercent !== 0 || group.targetPercent !== 0),
)

const GROUPS_COLLAPSED_KEY = 'stockportfolio.dashboard.groupsCollapsed'

/*
 * Über `safeStorage`, nicht direkt: Vorher stand hier ein blankes
 * `localStorage.getItem`. Im privaten Modus wirft schon der Zugriff — und
 * weil die Zeile vor dem Laden des Depots stand, blieb die ganze Ansicht
 * leer. Wegen eines eingeklappten Blocks.
 */
const groupsCollapsed = ref<boolean>(safeStorage.read(GROUPS_COLLAPSED_KEY) === '1')

watch(groupsCollapsed, (collapsed) => {
  safeStorage.write(GROUPS_COLLAPSED_KEY, collapsed ? '1' : '0')
})
</script>

<template>
  <!--
    Auf schmalen Bildschirmen ausgeblendet: die Gruppen-Trenner der
    Kartenliste zeigen dieselben Zahlen, und die Balkenzeile bräuchte hier
    acht Spalten Platz.
  -->
  <section class="dashboard__groups">
    <button
      type="button"
      class="dashboard__groups-toggle"
      :aria-expanded="!groupsCollapsed"
      aria-controls="dashboard-groups-panel"
      @click="groupsCollapsed = !groupsCollapsed"
    >
      <!-- `turn` wie im Gruppenkopf darunter — dieselbe Aussage, dieselbe Bewegung. -->
      <UxCaret :open="!groupsCollapsed" motion="turn" />
      <h2 class="dashboard__section-title">
        {{ t('dashboard.assetClasses') }}
      </h2>

      <!-- Eingeklappt: kompakte Zusammenfassung statt leerer Fläche -->
      <span v-if="groupsCollapsed" class="dashboard__summary tabular-nums">
        <span
          v-for="group in visibleGroups"
          :key="group.group"
          class="dashboard__summary-item"
          :class="
            group.suggestion === 'ok'
              ? 'dashboard__summary-item--ok'
              : 'dashboard__summary-item--flagged'
          "
        >
          {{ t(`groups.${group.group}`) }} {{ percent(group.actualPercent) }}
        </span>
      </span>
    </button>

    <div v-show="!groupsCollapsed" id="dashboard-groups-panel" class="dashboard__group-list">
      <GroupBar v-for="group in visibleGroups" :key="group.group" :group="group" />
    </div>
  </section>
</template>

<style scoped lang="scss">
.dashboard {
  &__groups {
    display: none;
    border-top: 1px solid token(--border-default);

    @include up(md) {
      display: block;
    }
  }

  &__groups-toggle {
    @include row;

    width: 100%;
    padding: 0.625rem 0;
    text-align: left;
    color: token(--text-secondary);
    transition: color 0.15s ease;

    &:hover {
      color: token(--text-primary);
    }
  }

  &__section-title {
    font-size: var(--font-xs);
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.025em;
  }

  &__summary {
    @include row(var(--space-3));

    margin-left: auto;
    font-size: var(--font-xs);
  }

  &__summary-item {
    display: none;

    @include up(sm) {
      display: inline;
    }

    &--ok {
      @include muted(null);
    }
    &--flagged {
      color: token(--status-near);
    }
  }

  &__group-list {
    @include stack(0);

    padding-bottom: var(--space-4);

    > * + * {
      border-top: 1px solid token(--border-subtle);
    }
  }
}
</style>
