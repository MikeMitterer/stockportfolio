import { computed, type ComputedRef } from 'vue'
import { useI18n } from 'vue-i18n'
import { percentSigned } from '@/domain/formatters'
import { usesBands, usesCalendar } from '@/domain/schedule'
import { useSettingsStore } from '@/stores/settings'

/**
 * Near-Schwellen als relative Abweichung vom Ziel, in Prozent.
 *
 * `isNearBand` meldet „Near“, wenn der Wert noch im Band liegt und höchstens
 * einen Prozentpunkt (bezogen auf das Ziel) von einer Bandgrenze entfernt ist.
 * Unten reicht Near also von `−lower` bis `1 − lower`, oben von `upper − 1`
 * bis `+upper`. Bei Bändern unter 1 % wechseln diese Schwellen das Vorzeichen;
 * sie dürfen deshalb nicht bei 0 abgeschnitten werden.
 */
export function nearThresholds(lowerPercent: number, upperPercent: number): { nearLower: number; nearUpper: number } {
  return { nearLower: 1 - lowerPercent, nearUpper: upperPercent - 1 }
}

/**
 * Erklärung der Status-Symbole mit den tatsächlich eingestellten Bändern.
 *
 * Mike, 2026-10-01: keine Beispielwerte, sondern die eigenen Grenzen. Beim
 * reinen Kalendertermin gibt es weder Bänder noch →; dann erklärt ein eigener
 * Text nur den Termin.
 */
export function useStatusHint(): ComputedRef<string> {
  const { t } = useI18n()
  const settings = useSettingsStore()

  return computed(() => {
    const { bands, rebalancing } = settings.settings
    if (!usesBands(rebalancing.trigger)) return t('hints.statusCalendar')
    const { nearLower, nearUpper } = nearThresholds(bands.lowerPercent, bands.upperPercent)
    const text = t('hints.statusBands', {
      lower: percentSigned(-bands.lowerPercent),
      upper: percentSigned(bands.upperPercent),
      nearLower: percentSigned(nearLower),
      nearUpper: percentSigned(nearUpper),
    })
    return usesCalendar(rebalancing.trigger) ? `${text} ${t('hints.statusDueDate')}` : text
  })
}
