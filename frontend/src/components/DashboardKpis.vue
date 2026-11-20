<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import KpiCard from '@/components/KpiCard.vue'
import { usePortfolioCurrency } from '@/composables/usePortfolioCurrency'
import { integer, percent } from '@/domain/formatters'
import type { RebalancingResult } from '@/domain/rebalancing'
import type { HistoryPoint } from '@/domain/sparkline'

/**
 * Kennzahlenzeile des Dashboards: Gesamtwert mit Verlauf, Investitionsreserve,
 * Sicherheitspuffer und Datenlage (aus `DashboardView.vue` herausgelöst, T-131).
 */
const props = defineProps<{
  result: RebalancingResult
  trend: HistoryPoint[]
  /** Ist das Diagramm des Wertverlaufs unter der Gesamtwert-Kachel offen? */
  expanded: boolean
  /** Positionen ohne vollständige Zahlen: Kurs fehlt oder fremde Währung. */
  incompleteCount: number
}>()

const emit = defineEmits<{ toggle: [] }>()

const { t } = useI18n()
const { baseCurrency, formatMoney, formatMoneySigned } = usePortfolioCurrency()

const liquidityTone = computed<'positive' | 'warning' | 'danger'>(() => {
  const buffer = props.result.liquidity.investmentReserve
  if (buffer >= 0) return 'positive'
  if (buffer > -50_000) return 'warning'
  return 'danger'
})

/*
 * Positiv formuliert: Der Normalfall ist „Vollständig", nicht „keine
 * Probleme". Eine Kennzahl, die im Guten eine Verneinung zeigt, liest sich wie
 * ein Mangel, den man gerade noch abgewendet hat.
 */
const dataStatusValue = computed(() =>
  props.incompleteCount === 0
    ? t('kpi.dataComplete')
    : t('kpi.dataIncomplete', { count: integer(props.incompleteCount) }),
)

const dataStatusTone = computed<'positive' | 'danger'>(() =>
  props.incompleteCount === 0 ? 'positive' : 'danger',
)
</script>

<template>
  <section class="dashboard__kpis">
    <KpiCard
      :label="t('kpi.total')"
      :value="formatMoney(result.total)"
      :hint="baseCurrency"
      :hint-explanation="t('hints.baseCurrency')"
      hint-settings-tab="data"
      :trend="trend"
      expandable
      :expanded="expanded"
      @toggle="emit('toggle')"
    />
    <KpiCard
      :label="t('kpi.investmentReserve')"
      :explanation="t('hints.investmentReserve')"
      anchor="reserve"
      settings-tab="calc"
      :value="formatMoneySigned(result.liquidity.investmentReserve)"
      :hint="t('kpi.investmentReserveHint')"
      :tone="liquidityTone"
    />
    <KpiCard
      :label="t('kpi.investmentReservePercent')"
      :explanation="t('hints.securityBuffer')"
      anchor="reserve"
      settings-tab="calc"
      :value="percent(result.liquidity.investmentReservePercent)"
      :hint="t('kpi.securityBufferHint', { buffer: formatMoney(result.liquidity.securityBuffer) })"
    />
    <!--
      Beschreibt die Datenlage, nicht die Lage zum Ziel: Ein „Below" in der
      Zeile ist ein normaler Zustand, ein fehlender Kurs eine Lücke. Ohne
      den Hinweis läse sich die Kennzahl neben fünf Below-Zeilen wie ein
      Widerspruch.
    -->
    <KpiCard
      :label="t('kpi.dataStatus')"
      :value="dataStatusValue"
      :tone="dataStatusTone"
      :explanation="t('hints.dataStatus')"
      anchor="limits"
    />
  </section>
</template>

<style scoped lang="scss">
@use '@/assets/kpi-grid' as *;

.dashboard__kpis {
  @include kpi-grid;
}
</style>
