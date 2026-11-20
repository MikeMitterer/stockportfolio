/**
 * Wertverlauf des Dashboards: Rückblick aus dem heutigen Bestand gegen
 * historische Kurse, gemessene Tageswerte und die kleine Linie in der
 * Gesamtwert-Kachel (aus `DashboardView.vue` herausgelöst, T-131).
 *
 * Überblick oben, Einzelheiten auf Klick: In der Kachel steht eine kleine
 * Linie, das ausführliche Diagramm klappt darunter auf. Dauerhaft sichtbar
 * würde es die Tabelle nach unten drücken — und die ist der Grund, warum
 * jemand das Dashboard öffnet.
 */
import { computed, ref, watch, type ComputedRef, type Ref } from 'vue'
import type { StockInfoClient } from '@/api/stockinfo/client'
import { baseCurrencyOf, majorCurrency } from '@/domain/fx'
import { withinDays, type BacktestInput } from '@/domain/portfolioHistory'
import type { RebalancingResult } from '@/domain/rebalancing'
import { useHistoryStore } from '@/stores/history'
import { usePortfolioStore } from '@/stores/portfolio'
import { useValueHistoryStore } from '@/stores/valueHistory'

/**
 * Zeitraum, den der Rückblick lädt.
 *
 * Der längste, den die API kennt: Das Diagramm schneidet daraus zu, statt je
 * Schaltfläche eine eigene Abfrage zu stellen.
 */
const BACKTEST_PERIOD = 'max' as const

/**
 * Fenster der kleinen Linie in der Kachel — dasselbe wie die Vorgabe des
 * Diagramms.
 *
 * Über „max" stünde dort ein Prozentwert von mehreren hundert Prozent neben
 * dem Gesamtwert. Das läse sich wie eine Wertentwicklung, ist aber der
 * Rückblick: der heutige Bestand, gegen Kurse von vor Jahren gerechnet.
 */
const TREND_DAYS = 90

export function useDashboardValueHistory(options: {
  client: StockInfoClient | null
  result: ComputedRef<RebalancingResult | null>
  /** Laufen gerade Wechselkurse? Solange ist die Summe kein Tageswert. */
  fxLoading: () => boolean
  /** Erst nach dem ersten Aufbau lädt ein Depotwechsel den Verlauf neu. */
  ready: Ref<boolean>
}) {
  const { client, result, fxLoading, ready } = options
  const portfolioStore = usePortfolioStore()
  const historyStore = useHistoryStore()
  const valueHistory = useValueHistoryStore()

  /** Gemessene Werte, solange es genug davon gibt; sonst der Rückblick. */
  const trendPoints = computed(() => {
    const source =
      valueHistory.snapshotLine.length > 1 ? valueHistory.snapshotLine : valueHistory.backtest
    return withinDays(source, TREND_DAYS, new Date())
  })
  const loading = ref<boolean>(false)

  /** Ohne historische Wechselkurse lässt sich ein Depot mit Fremdwährung nicht zurückrechnen. */
  const needsHistoricalFx = computed(() =>
    (result.value?.rows ?? []).some(
      (row) =>
        row.position.enabled && row.quote && majorCurrency(row.quote.currency) !== row.baseCurrency,
    ),
  )
  const completeValuation = computed(
    () => !!result.value && result.value.rows.every((row) => !row.position.enabled || row.isActive),
  )

  /** Bestände mit ihrem Kursverlauf — Grundlage des Rückblicks. */
  const backtestInputs = computed<BacktestInput[]>(() =>
    needsHistoricalFx.value || !completeValuation.value
      ? []
      : (result.value?.rows ?? [])
          .filter((row) => row.isActive)
          .map((row) => ({
            units: row.position.units,
            points: historyStore.get(row.position, BACKTEST_PERIOD).points.map((point) => ({
              ...point,
              close: row.quote?.currency === 'GBp' ? point.close / 100 : point.close,
            })),
            constantValue: row.marketValue,
          })),
  )

  /** Unvollständige Summen sind keine Tageswerte des ganzen Depots. */
  async function recordCurrentValue(): Promise<void> {
    const portfolio = portfolioStore.portfolio
    if (!portfolio || !valueHistory.loaded || fxLoading() || !completeValuation.value) return
    await valueHistory.record(portfolio.id, result.value?.total ?? 0, baseCurrencyOf(portfolio))
  }

  /**
   * Holt den langen Verlauf für alle Positionen und rechnet den Rückblick.
   *
   * Ein Zeitraum reicht: Das Diagramm schneidet daraus zu, statt für jede
   * Schaltfläche neu zu laden.
   */
  async function load(): Promise<void> {
    const portfolio = portfolioStore.portfolio
    if (!portfolio) return

    loading.value = true
    try {
      await valueHistory.ensure(portfolio.id, baseCurrencyOf(portfolio))

      await Promise.all(
        portfolioStore.positions
          .filter((position) => position.enabled)
          .map((position) => historyStore.ensure(client, position, BACKTEST_PERIOD)),
      )

      if (portfolioStore.portfolio?.id !== portfolio.id) return
      valueHistory.computeBacktest(backtestInputs.value)
      await recordCurrentValue()
    } finally {
      loading.value = false
    }
  }

  // Der Tageswert wird festgehalten, sobald die Kurse stehen — einmal je Tag.
  watch(
    () => [result.value, fxLoading()],
    () => {
      valueHistory.computeBacktest(backtestInputs.value)
      void recordCurrentValue()
    },
  )
  // Einzelne Quellen: Ein neu geladenes, gleiches Depot stößt nichts an (T-83).
  watch([() => portfolioStore.portfolio?.id, () => portfolioStore.portfolio?.baseCurrency], () => {
    if (ready.value) void load()
  })

  return { valueHistory, trendPoints, loading, needsHistoricalFx, load }
}
