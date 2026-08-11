/**
 * Termine für das Kalender-Rebalancing.
 *
 * Reine Datumsrechnung, kein DOM, kein Reactivity. Die Gegenwart kommt als
 * Parameter herein — sonst ließe sich nichts davon prüfen, ohne die Uhr des
 * Rechners zu stellen.
 */

import type { RebalancingTrigger } from '@/types/portfolio'

/** Alle Auslöser in der Reihenfolge, in der sie zur Wahl stehen. */
export const REBALANCING_TRIGGERS = [
  'bands',
  'calendar',
  'both',
] as const satisfies readonly RebalancingTrigger[]

/** Gilt in diesem Modus das laufende Band? */
export function usesBands(trigger: RebalancingTrigger): boolean {
  return trigger === 'bands' || trigger === 'both'
}

/** Gibt es in diesem Modus einen Termin? */
export function usesCalendar(trigger: RebalancingTrigger): boolean {
  return trigger === 'calendar' || trigger === 'both'
}

/**
 * Datum plus Monate, ohne über den Monatsletzten zu rutschen.
 *
 * `setMonth` allein würde aus dem 31. Januar plus einem Monat den 3. März
 * machen — der Februar hat den Tag nicht. Erwartet wird der 28./29.
 *
 * @param date   Ausgangsdatum.
 * @param months Anzahl Monate.
 */
export function addMonths(date: Date, months: number): Date {
  const day = date.getDate()
  const shifted = new Date(date.getTime())
  shifted.setDate(1)
  shifted.setMonth(shifted.getMonth() + months)

  const lastDayOfMonth = new Date(shifted.getFullYear(), shifted.getMonth() + 1, 0).getDate()
  shifted.setDate(Math.min(day, lastDayOfMonth))
  return shifted
}

/**
 * Nächster fälliger Termin.
 *
 * @param lastRebalancedAt ISO-Datum des letzten Ausgleichs; `null`/leer heißt: noch nie.
 * @param intervalMonths   Abstand in Monaten.
 * @returns Termin, oder `null`, wenn noch nie ausgeglichen wurde — dann gibt
 *          es keinen berechenbaren Termin, sondern nur „überfällig".
 */
export function nextDueDate(
  lastRebalancedAt: string | null | undefined,
  intervalMonths: number,
): Date | null {
  if (!lastRebalancedAt) return null

  const last = new Date(lastRebalancedAt)
  if (Number.isNaN(last.getTime())) return null

  return addMonths(last, Math.max(1, intervalMonths))
}

/**
 * Ist der Termin erreicht?
 *
 * Ohne bisherigen Ausgleich lautet die Antwort ja: Wer die Einstellung
 * einschaltet, will wissen, wo er steht — nicht erst in einem Jahr.
 *
 * @param lastRebalancedAt ISO-Datum des letzten Ausgleichs.
 * @param intervalMonths   Abstand in Monaten.
 * @param now              Gegenwart.
 */
export function isDue(
  lastRebalancedAt: string | null | undefined,
  intervalMonths: number,
  now: Date,
): boolean {
  const due = nextDueDate(lastRebalancedAt, intervalMonths)
  if (!due) return true
  // Auf den Tag genau, nicht auf die Sekunde: Am Termin selbst ist fällig.
  return startOfDay(now).getTime() >= startOfDay(due).getTime()
}

/**
 * Tage bis zum Termin; negativ, wenn er vorbei ist.
 *
 * @returns `null`, wenn es keinen berechenbaren Termin gibt.
 */
export function daysUntilDue(
  lastRebalancedAt: string | null | undefined,
  intervalMonths: number,
  now: Date,
): number | null {
  const due = nextDueDate(lastRebalancedAt, intervalMonths)
  if (!due) return null

  const millisPerDay = 24 * 60 * 60 * 1000
  return Math.round((startOfDay(due).getTime() - startOfDay(now).getTime()) / millisPerDay)
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}
