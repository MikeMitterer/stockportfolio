/**
 * Zeiträume des Kursverlaufs — an einer Stelle.
 *
 * Drei Dinge gehören zu jedem Zeitraum: der Wert, den die API kennt, die
 * kurze Beschriftung für Spalte und Schalter, und ob er überhaupt eine Linie
 * ergibt. Verteilt auf Komponente, Einstellungen und Katalog wäre das dreimal
 * dieselbe Zuordnung — und eine davon wäre irgendwann anders.
 */

import type { Period } from '@/api/types'
import type { HistoryPeriod } from '@/types/portfolio'

export interface HistoryPeriodInfo {
  id: HistoryPeriod
  /** Zeitraum, den die API dafür liefert. */
  apiPeriod: Period
  /** Schlüssel der kurzen Beschriftung unter `history.short`. */
  shortKey: string
  /**
   * Wie viele Punkte gezeigt werden; `0` heißt alle.
   *
   * „Ein Tag" schneidet auf die letzten beiden Schlusskurse: Dazwischen gibt
   * es keinen Verlauf, wohl aber eine Veränderung — vom letzten Handelstag auf
   * heute. Ein eigener Abruf dafür wäre Verschwendung, die Wochendaten
   * enthalten ihn bereits.
   */
  limit: number
}

export const HISTORY_PERIODS = ['day', 'week', 'month'] as const

export const HISTORY_PERIOD_INFO: Record<HistoryPeriod, HistoryPeriodInfo> = {
  day: { id: 'day', apiPeriod: '1w', shortKey: 'd1', limit: 2 },
  week: { id: 'week', apiPeriod: '1w', shortKey: 'w1', limit: 0 },
  month: { id: 'month', apiPeriod: '1m', shortKey: 'm1', limit: 0 },
}
