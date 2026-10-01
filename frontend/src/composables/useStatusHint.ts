import { computed, type ComputedRef } from 'vue'
import { useI18n } from 'vue-i18n'
import { percent } from '@/domain/formatters'
import { usesBands, usesCalendar } from '@/domain/schedule'
import { useSettingsStore } from '@/stores/settings'

/**
 * Erklärung der Status-Symbole mit den tatsächlich eingestellten Bändern.
 *
 * Mike, 2026-10-01: keine Beispielwerte, sondern die eigenen Grenzen. „Near“
 * (→) beginnt einen Prozentpunkt vor jeder Bandgrenze (`isNearBand`). Beim
 * reinen Kalendertermin gibt es weder Bänder noch →; dann erklärt ein eigener
 * Text nur den Termin.
 */
export function useStatusHint(): ComputedRef<string> {
  const { t } = useI18n()
  const settings = useSettingsStore()

  return computed(() => {
    const { bands, rebalancing } = settings.settings
    if (!usesBands(rebalancing.trigger)) return t('hints.statusCalendar')
    const text = t('hints.statusBands', {
      lower: `−${percent(bands.lowerPercent)}`,
      upper: `+${percent(bands.upperPercent)}`,
      nearLower: `−${percent(Math.max(bands.lowerPercent - 1, 0))}`,
      nearUpper: `+${percent(Math.max(bands.upperPercent - 1, 0))}`,
    })
    return usesCalendar(rebalancing.trigger) ? `${text} ${t('hints.statusDueDate')}` : text
  })
}
