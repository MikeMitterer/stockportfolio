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
  // Mike, 2026-10-01: Die Badges zeigen nur Symbol und Farbe, keinen Text:
  // ↓ unter Ziel, ↑ über Ziel, ✓ OK, → knapp an der Grenze. Die Bedeutung
  // steht als zugänglicher Name und Tooltip am Badge.
  it.each([
    ['de', 'Unter Ziel', 'Über Ziel'],
    ['en', 'Below', 'Above'],
  ] as const)('zeigt in „%s" nur Symbole und benennt sie zugänglich', (locale, below, above) => {
    setActivePinia(createPinia())
    useLocaleStore().setLocale(locale)
    const badge = (suggestion: Suggestion, extra: Record<string, unknown> = {}) =>
      mount(SuggestionBadge, { props: { suggestion, ...extra } }).get('.badge__pill')

    expect(badge('buy').text()).toBe('↓')
    expect(badge('buy').attributes('aria-label')).toBe(below)
    expect(badge('sell').text()).toBe('↑')
    expect(badge('sell').attributes('aria-label')).toBe(above)
    expect(badge('ok').text()).toBe('✓')
    expect(badge('ok').attributes('aria-label')).toBe('OK')
    expect(badge('ok', { near: true }).text()).toBe('→')
    expect(badge('ok', { belowMinTrade: true }).text()).toBe('✓')
    for (const suggestion of ['buy', 'sell', 'ok'] as const) {
      expect(badge(suggestion).text()).not.toMatch(/[A-Za-zÄÖÜäöü]/)
      expect(badge(suggestion).attributes('title')).toBe(badge(suggestion).attributes('aria-label'))
    }
  })
})
