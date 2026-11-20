/**
 * Kursverlauf für die Zeilen der Positionstabelle (aus `PositionsTable.vue`
 * herausgelöst, T-131).
 *
 * Kurzer Zeitraum: In 60 Pixeln Breite ist ein Jahr nur noch Zickzack. Welcher
 * es genau ist, entscheidet der Nutzer in den Einstellungen.
 *
 * Für „ein Tag" wird die Woche geholt und daraus nur der letzte Schritt
 * gezeigt: Zwischen zwei Schlusskursen gibt es keinen Verlauf, wohl aber eine
 * Veränderung — vom letzten Handelstag auf heute. Ein eigener Abruf dafür
 * wäre Verschwendung, die Wochendaten enthalten ihn bereits.
 */
import { computed, inject, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { STOCK_INFO_CLIENT, type StockInfoClient } from '@/api/stockinfo/client'
import { HISTORY_PERIOD_INFO } from '@/domain/historyPeriod'
import type { PositionResult } from '@/domain/rebalancing'
import { useHistoryStore, type HistorySeries } from '@/stores/history'
import { useSettingsStore } from '@/stores/settings'

export function usePositionSparklines(rows: () => PositionResult[]) {
  const { t } = useI18n()
  const client = inject<StockInfoClient>(STOCK_INFO_CLIENT) ?? null
  const historyStore = useHistoryStore()
  const settingsStore = useSettingsStore()

  const periodInfo = computed(() => HISTORY_PERIOD_INFO[settingsStore.settings.ui.historyPeriod])
  const apiPeriod = computed(() => periodInfo.value.apiPeriod)

  /** Beschriftung der Spalte — der Zeitraum gehört einmal in den Kopf. */
  const periodLabel = computed(() => t(`history.short.${periodInfo.value.shortKey}`))

  /**
   * Punkte für eine Zeile, auf den eingestellten Zeitraum zugeschnitten.
   *
   * Nur „ein Tag" schneidet: Dort interessieren der vorige Schluss und der
   * aktuelle Kurs, nicht die Woche davor.
   */
  function pointsFor(position: PositionResult['position']): HistorySeries {
    const series = historyStore.get(position, apiPeriod.value)
    const { limit } = periodInfo.value
    if (limit === 0) return series
    return { ...series, points: series.points.slice(-limit) }
  }

  // Nachladen, sobald die Zeilen stehen oder der Zeitraum wechselt. Der Store
  // holt nur, was fehlt oder von gestern ist — meist kostet das keine Anfrage.
  watch(
    [
      () =>
        rows()
          .map((row) => row.position.id)
          .join(','),
      apiPeriod,
    ],
    () => {
      for (const row of rows()) {
        void historyStore.ensure(client, row.position, apiPeriod.value)
      }
    },
    { immediate: true },
  )

  return { periodLabel, pointsFor }
}
