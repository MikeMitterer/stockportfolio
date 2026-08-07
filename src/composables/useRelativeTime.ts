/**
 * Formatiert einen ISO-Zeitstempel als relative Angabe („vor 3 Min.").
 * Reine Anzeige-Logik, kein State.
 */

import { computed, type ComputedRef, type Ref } from 'vue'
import { translate } from '@/i18n'

/** Minuten seit dem Zeitstempel; `null` wenn kein Zeitstempel vorliegt. */
export function minutesSince(isoTimestamp: string | null, now: number = Date.now()): number | null {
  if (!isoTimestamp) return null
  const then = Date.parse(isoTimestamp)
  if (Number.isNaN(then)) return null
  return Math.max(0, Math.floor((now - then) / 60_000))
}

/** Menschenlesbare Kurzform: „gerade eben", „vor 12 Min", „vor 3 Std". */
export function formatAge(isoTimestamp: string | null, now: number = Date.now()): string {
  const minutes = minutesSince(isoTimestamp, now)
  if (minutes === null) return translate('refresh.never')
  if (minutes < 1) return translate('refresh.justNow')
  if (minutes < 60) {
    return translate('refresh.ago', { value: translate('refresh.minutesShort', { n: minutes }) })
  }
  const hours = Math.floor(minutes / 60)
  return translate('refresh.ago', { value: translate('refresh.hoursShort', { n: hours }) })
}

/** Reaktive Variante für Templates. */
export function useRelativeTime(isoTimestamp: Ref<string | null>): ComputedRef<string> {
  return computed(() => formatAge(isoTimestamp.value))
}
