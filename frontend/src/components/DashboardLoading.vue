<script setup lang="ts">
import { useI18n } from 'vue-i18n'

/**
 * Platzhalter des Dashboards, bis Depot und Bewertung geladen sind; hält den
 * Aufbau stabil (aus `DashboardView.vue` herausgelöst, T-131).
 */
const { t } = useI18n()
</script>

<template>
  <div class="dashboard__loading" role="status" :aria-label="t('dashboard.loading')">
    <div class="dashboard__loading-kpis" aria-hidden="true">
      <div v-for="index in 4" :key="index" class="dashboard__loading-kpi">
        <span class="dashboard__loading-line dashboard__loading-line--short" />
        <span class="dashboard__loading-line dashboard__loading-line--value" />
      </div>
    </div>
    <div class="dashboard__loading-table" aria-hidden="true">
      <span class="dashboard__loading-line dashboard__loading-line--short" />
      <span v-for="index in 4" :key="index" class="dashboard__loading-line" />
    </div>
    <span class="dashboard__loading-caption">{{ t('dashboard.loading') }}</span>
  </div>
</template>

<style scoped lang="scss">
@use '@/assets/kpi-grid' as *;

.dashboard {
  &__loading {
    @include stack(var(--space-4));
  }

  &__loading-kpis {
    @include kpi-grid;
  }

  &__loading-kpi,
  &__loading-table {
    @include stack(var(--space-4));

    padding: var(--space-4);
    border: 1px solid token(--border-subtle);
    border-radius: var(--radius-sm);
  }

  &__loading-kpi {
    min-height: 7rem;
  }
  &__loading-table {
    min-height: 16rem;
  }

  &__loading-line {
    display: block;
    width: 100%;
    height: 0.75rem;
    border-radius: var(--radius-sm);
    background-color: token(--border-subtle);

    &--short {
      width: 35%;
    }
    &--value {
      width: 65%;
      height: 1.5rem;
    }
  }

  &__loading-caption {
    color: token(--text-secondary);
    font-size: var(--font-sm);
  }
}
</style>
