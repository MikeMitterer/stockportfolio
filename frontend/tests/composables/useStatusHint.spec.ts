import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/data/repository', () => import('../helpers/localRepositories'))
import { defineComponent, h } from 'vue'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { nearThresholds, useStatusHint } from '@/composables/useStatusHint'
import { isNearBand } from '@/domain/rebalancing'
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
    expect(text).toContain('zwischen −5,0 % und −4,0 %')
    expect(text).toContain('zwischen +9,0 % und +10,0 %')
    expect(text).toContain('→')
    expect(text).not.toContain('Termin')
  })

  it('nennt bei Bändern unter 1 % die Schwellen mit Vorzeichenwechsel, passend zu isNearBand', () => {
    // Befund Runde 1: Bei 0,5 % beginnt Near oben schon bei −0,5 %, unten
    // reicht es bis +0,5 %. Ein Abschneiden bei 0 verfälschte das.
    const settings = useSettingsStore()
    settings.settings.bands.lowerPercent = 0.5
    settings.settings.bands.upperPercent = 0.5
    settings.settings.rebalancing.trigger = 'bands'
    const text = hintText()
    expect(text).toContain('zwischen −0,5 % und +0,5 %')
    expect(text).toContain('sowie zwischen −0,5 % und +0,5 %')

    // Text und Logik stimmen an jeder Stelle innerhalb des Bands überein.
    const { nearLower, nearUpper } = nearThresholds(0.5, 0.5)
    const target = 1000
    for (let relative = -0.5; relative <= 0.5 + 1e-9; relative += 0.1) {
      const actual = target * (1 + relative / 100)
      const described = relative <= nearLower + 1e-9 || relative >= nearUpper - 1e-9
      expect(isNearBand(actual, target * 0.995, target * 1.005, target)).toBe(described)
    }
  })

  it('stimmt auch bei üblichen Bändern mit isNearBand überein', () => {
    const { nearLower, nearUpper } = nearThresholds(6, 15)
    expect(nearLower).toBeCloseTo(-5)
    expect(nearUpper).toBeCloseTo(14)
    const target = 1000
    for (let relative = -6; relative <= 15 + 1e-9; relative += 0.5) {
      const actual = target * (1 + relative / 100)
      const described = relative <= nearLower + 1e-9 || relative >= nearUpper - 1e-9
      expect(isNearBand(actual, target * 0.94, target * 1.15, target)).toBe(described)
    }
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
