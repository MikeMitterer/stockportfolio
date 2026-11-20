<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { NButton } from 'naive-ui'
import GroupActionIcon from '@/components/GroupActionIcon.vue'
import InfoHint from '@/components/InfoHint.vue'
import TargetAllocationBar from '@/components/TargetAllocationBar.vue'
import { percent, shortDate } from '@/domain/formatters'
import type { RebalancingResult } from '@/domain/rebalancing'
import { nextDueDate, usesBands } from '@/domain/schedule'
import { useSettingsStore } from '@/stores/settings'

/**
 * Kopf der Positionsliste: Titel, alle Gruppen auf- und zuklappen, Zielsumme,
 * Bänder und Termin, neue Position (aus `DashboardView.vue` herausgelöst, T-131).
 */
const props = defineProps<{
  result: RebalancingResult
  /** Kartenliste statt Tabelle — dort gibt es nichts auf- und zuzuklappen. */
  compact: boolean
  /** Laufen gerade Kursabrufe? */
  loading: boolean
}>()

const emit = defineEmits<{ collapse: []; expand: []; add: [] }>()

const { t } = useI18n()
const settingsStore = useSettingsStore()

const groupCount = computed(() => new Set(props.result.rows.map((row) => row.position.group)).size)

const bandsActive = computed(() => usesBands(settingsStore.settings.rebalancing.trigger))

/** „Termin fällig" oder „nächster Termin am …" — je nach Stand. */
const scheduleLabel = computed(() => {
  const schedule = props.result.schedule
  if (schedule.due) return t('dashboard.scheduleDue')
  return t('dashboard.scheduleNext', {
    date: shortDate(
      nextDueDate(schedule.lastRebalancedAt, settingsStore.settings.rebalancing.intervalMonths),
    ),
  })
})
</script>

<template>
  <div class="dashboard__panel-head">
    <div class="dashboard__panel-heading">
      <h2 class="dashboard__panel-title">
        {{ compact ? t('dashboard.positionsShort') : t('dashboard.positionsHeading') }}
      </h2>
      <div v-if="!compact && groupCount > 1" class="dashboard__group-actions">
        <button
          type="button"
          class="dashboard__group-action"
          :aria-label="t('table.collapseAllGroups')"
          :title="t('table.collapseAllGroups')"
          @click="emit('collapse')"
        >
          <GroupActionIcon class="dashboard__group-symbol" action="collapse" />
        </button>
        <button
          type="button"
          class="dashboard__group-action"
          :aria-label="t('table.expandAllGroups')"
          :title="t('table.expandAllGroups')"
          @click="emit('expand')"
        >
          <GroupActionIcon class="dashboard__group-symbol" action="expand" />
        </button>
      </div>
    </div>
    <div class="dashboard__panel-meta">
      <TargetAllocationBar
        v-if="!compact"
        :sum="result.targetPercentSum"
        :exceeded="result.targetsExceeded"
      />
      <div class="dashboard__bands tabular-nums">
        <!--
          Bänder nur nennen, wenn sie gelten: Im reinen Kalendermodus
          stünde hier sonst eine Grenze, nach der niemand mehr fragt.
        -->
        <template v-if="bandsActive">
          {{
            t('dashboard.bands', {
              lower: percent(settingsStore.settings.bands.lowerPercent),
              upper: percent(settingsStore.settings.bands.upperPercent),
            })
          }}
          <InfoHint
            :text="t('hints.bands')"
            anchor="bands"
            settings-tab="calc"
            class="dashboard__hint"
          />
        </template>
        <span v-if="result.schedule.active" class="dashboard__schedule">
          <span :class="{ dashboard__due: result.schedule.due }">{{ scheduleLabel }}</span>
          <InfoHint
            :text="t('hints.trigger')"
            anchor="trigger"
            settings-tab="calc"
            class="dashboard__hint"
          />
        </span>
        <span v-if="loading" class="dashboard__schedule">{{ t('common.loading') }}</span>
      </div>
      <NButton size="tiny" secondary @click="emit('add')">
        {{ t('actions.addPosition') }}
      </NButton>
    </div>
  </div>
</template>

<style scoped lang="scss">
.dashboard {
  /*
   * Die Trennlinie sitzt am Kopf, nicht als eigener Divider dazwischen.
   * Naives `NDivider` bringt 24 px Abstand nach oben und unten mit — 49 px
   * Leerfläche um einen 1 px-Strich, und das `!my-0` daran war eine
   * Tailwind-Utility, die es seit dessen Ausbau nicht mehr gibt.
   */
  &__panel-head {
    @include row(var(--space-4));

    flex-wrap: wrap;
    justify-content: space-between;
    padding: 0 0 var(--space-2);

    @include up(md) {
      padding: var(--space-4) 1.25rem;
      border-bottom: 1px solid token(--border-default);
    }
  }

  &__panel-title {
    font-size: var(--font-xs);
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.025em;
    color: token(--text-secondary);
  }

  &__panel-heading {
    @include row(var(--space-2));
  }
  &__group-actions {
    @include row(0);
  }

  &__group-action {
    display: inline-grid;
    place-items: center;
    width: 1.5rem;
    height: 1.75rem;
    padding: 0;
    color: token(--text-muted);
    cursor: pointer;

    &:hover {
      color: token(--text-primary);
    }
    &:focus-visible {
      outline: 2px solid token(--text-primary);
      outline-offset: 2px;
    }
  }

  &__group-symbol {
    display: block;
    width: 1rem;
    height: 1rem;
  }

  &__panel-meta {
    @include row(1.25rem);
  }

  &__bands {
    @include muted;
  }

  &__hint {
    margin-left: var(--space-1);
  }

  &__schedule {
    margin-left: var(--space-2);
  }

  &__due {
    color: token(--status-out);
  }
}
</style>
