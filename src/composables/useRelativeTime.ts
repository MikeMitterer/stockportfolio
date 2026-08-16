/**
 * Formuliert das Alter eines Zeitstempels — „gerade eben", „vor 12 Min".
 *
 * Die Rechnung liegt im Fundament (`minutesSince`), hier bleibt nur die
 * Formulierung. Das ist die Trennlinie: Wie viele Minuten vergangen sind, ist
 * überall dasselbe; wie man das sagt, weiß nur der Katalog dieser App.
 */

import { computed, type ComputedRef, type Ref } from 'vue'
import { minutesSince } from '@mikemitterer/ux-foundation'
import { translate } from '@/i18n'

export { minutesSince }

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
