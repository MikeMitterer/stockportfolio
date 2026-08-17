/**
 * Formuliert das Alter eines Zeitstempels — „gerade eben", „vor 12 Min".
 *
 * Die Rechnung liegt im Fundament (`minutesSince`, `useMinutesSince`), hier
 * bleibt nur die Formulierung. Das ist die Trennlinie: Wie viele Minuten
 * vergangen sind, ist überall dasselbe; wie man das sagt, weiß nur der
 * Katalog dieser App.
 */

import { computed, type ComputedRef, type Ref } from 'vue'
import { minutesSince, useMinutesSince } from '@mmit/ux-foundation'
import { translate } from '@/i18n'

export { minutesSince }

/**
 * Macht aus einer Minutenzahl den Satz — der gemeinsame Kern beider Fassungen.
 *
 * @param minutes Vergangene Minuten; `null` wenn kein Zeitstempel vorliegt.
 */
function phraseAge(minutes: number | null): string {
  if (minutes === null) return translate('refresh.never')
  if (minutes < 1) return translate('refresh.justNow')
  if (minutes < 60) {
    return translate('refresh.ago', { value: translate('refresh.minutesShort', { n: minutes }) })
  }
  const hours = Math.floor(minutes / 60)
  return translate('refresh.ago', { value: translate('refresh.hoursShort', { n: hours }) })
}

/** Menschenlesbare Kurzform: „gerade eben", „vor 12 Min", „vor 3 Std". */
export function formatAge(isoTimestamp: string | null, now: number = Date.now()): string {
  return phraseAge(minutesSince(isoTimestamp, now))
}

/**
 * Reaktive Variante für Templates — führt sich minütlich selbst nach.
 *
 * Der Takt ist der Punkt: Die Angabe steht in Kopf- und Statuszeile, während
 * die Seite sonst ruhig ist. Ohne ihn bliebe „vor 2 Min" stehen, bis
 * irgendetwas anderes ein Neuzeichnen auslöst — der Nutzer läse eine Zahl,
 * die er für aktuell hält.
 */
export function useRelativeTime(isoTimestamp: Ref<string | null>): ComputedRef<string> {
  const minutes = useMinutesSince(isoTimestamp)
  return computed(() => phraseAge(minutes.value))
}
