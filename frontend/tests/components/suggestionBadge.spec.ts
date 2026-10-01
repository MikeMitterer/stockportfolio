import { afterEach, describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

import SuggestionBadge from '@/components/SuggestionBadge.vue'
import { useLocaleStore } from '@/stores/locale'
import type { Suggestion } from '@/types/portfolio'

afterEach(() => {
  setActivePinia(createPinia())
  useLocaleStore().setLocale('de')
})

describe('Status-Badge', () => {
  // Mike, 2026-10-01: Die Badges beschreiben eine Lage, keinen Auftrag —
  // in beiden Sprachen genau Below / Above / OK. Die Werte der Logik bleiben.
  it.each(['de', 'en'] as const)('zeigt in „%s" Below, Above und OK statt Buy und Sell', (locale) => {
    setActivePinia(createPinia())
    useLocaleStore().setLocale(locale)
    const label = (suggestion: Suggestion, extra: Record<string, unknown> = {}) =>
      mount(SuggestionBadge, { props: { suggestion, ...extra } }).text()

    expect(label('buy')).toContain('Below')
    expect(label('sell')).toContain('Above')
    expect(label('ok')).toContain('OK')
    expect(label('ok', { belowMinTrade: true })).toContain('OK')
    for (const suggestion of ['buy', 'sell', 'ok'] as const) {
      expect(label(suggestion)).not.toMatch(/\b(Buy|Sell)\b/)
    }
  })
})
