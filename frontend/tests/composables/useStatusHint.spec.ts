import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/data/repository', () => import('../helpers/localRepositories'))
import { defineComponent, h } from 'vue'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { useStatusHint } from '@/composables/useStatusHint'
import { useSettingsStore } from '@/stores/settings'
import { useLocaleStore } from '@/stores/locale'

beforeEach(() => {
  setActivePinia(createPinia())
  useLocaleStore().setLocale('de')
})

/** `useI18n` braucht eine Komponente; diese zeigt nur den Text. */
function hintText(): string {
  const Probe = defineComponent({
    setup() {
      const hint = useStatusHint()
      return () => h('span', hint.value)
    },
  })
  return mount(Probe).text()
}

describe('Erklärung der Status-Symbole', () => {
  // Mike, 2026-10-01: Das Popup erklärt mit den eingestellten Bändern statt
  // mit Beispieldaten.
  it('nennt die eingestellten Bänder und die daraus folgenden Near-Schwellen', () => {
    const settings = useSettingsStore()
    settings.settings.bands.lowerPercent = 5
    settings.settings.bands.upperPercent = 10
    settings.settings.rebalancing.trigger = 'bands'
    const text = hintText()
    expect(text).toContain('−5,0 %')
    expect(text).toContain('+10,0 %')
    expect(text).toContain('−4,0 %')
    expect(text).toContain('+9,0 %')
    expect(text).toContain('→')
    expect(text).not.toContain('Termin')
  })

  it('ergänzt bei Bändern und Termin den Satz zum fälligen Termin', () => {
    const settings = useSettingsStore()
    settings.settings.rebalancing.trigger = 'both'
    expect(hintText()).toContain('An einem fälligen Termin zählt jede Abweichung')
  })

  it('spricht beim reinen Kalendertermin weder von Bändern noch von Near', () => {
    const settings = useSettingsStore()
    settings.settings.rebalancing.trigger = 'calendar'
    const text = hintText()
    expect(text).not.toMatch(/Band|→/)
    expect(text).toContain('Termin')
  })
})
