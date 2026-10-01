import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import { NConfigProvider, NInput, NInputNumber } from 'naive-ui'
import { naiveLocales } from '@/i18n/naiveLocale'

/** Hängt ein Feld unter dem App-Sprachpaket ein und liefert den sichtbaren Platzhalter. */
function placeholderOf(locale: 'de' | 'en', field: unknown): string | null {
  const Host = defineComponent({
    setup: () => () => h(NConfigProvider, { locale: naiveLocales[locale] }, { default: () => field }),
  })
  const wrapper = mount(Host)
  const value = wrapper.find('input').attributes('placeholder') ?? null
  wrapper.unmount()
  return value
}

describe('Naive-Sprachpaket der App', () => {
  it.each(['de', 'en'] as const)('zeigt in %s keinen Standard-Platzhalter', (locale) => {
    expect(placeholderOf(locale, h(NInput))).toBe('')
    expect(placeholderOf(locale, h(NInputNumber))).toBe('')
  })

  it('lässt einen ausdrücklich gesetzten Platzhalter stehen', () => {
    expect(placeholderOf('en', h(NInput, { placeholder: 'jane' }))).toBe('jane')
  })

  it('behält die übrigen Texte des Grundpakets', () => {
    expect(naiveLocales.de.name).toBe('de-DE')
    expect(naiveLocales.en.Popconfirm.positiveText).toBe('Confirm')
  })
})
