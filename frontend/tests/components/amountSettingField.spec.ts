import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/data/repository', () => import('../helpers/localRepositories'))
import { createPinia, setActivePinia } from 'pinia'
import { defineComponent, h, ref } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import AmountSettingField from '@/components/AmountSettingField.vue'
import type { AmountSetting } from '@/types/portfolio'

beforeEach(() => {
  setActivePinia(createPinia())
  Object.defineProperty(HTMLElement.prototype, 'scrollTo', { configurable: true, value() {} })
  vi.stubGlobal('matchMedia', () => ({ matches: false, addEventListener() {}, removeEventListener() {} }))
})
afterEach(() => { document.body.innerHTML = ''; vi.unstubAllGlobals() })

describe('Betragseinstellung', () => {
  it('öffnet die Einheit ohne einen Klick ans Zahlenfeld weiterzureichen und rechnet um', async () => {
    const setting = ref<AmountSetting>({ mode: 'percent', value: 20 })
    const wrapper = mount(defineComponent({
      setup: () => () => h(AmountSettingField, {
        label: 'Sicherheitspuffer', setting: setting.value, total: 5000,
        zeroHint: 'Aus', onUpdate: (value: AmountSetting) => { setting.value = value },
      }),
    }), { attachTo: document.body })
    const input = wrapper.get('input').element
    const numericClick = vi.fn()
    input.addEventListener('click', numericClick)
    expect(input.labels?.[0]?.textContent?.trim()).toBe('Sicherheitspuffer')
    wrapper.get<HTMLElement>('.n-base-selection-label').element.click()
    await flushPromises()
    expect(numericClick).not.toHaveBeenCalled()
    await wrapper.get('.n-base-selection-label').trigger('keydown', { key: 'ArrowDown' })
    await wrapper.get('.n-base-selection-label').trigger('keydown', { key: 'Enter' })
    await flushPromises()
    expect(setting.value).toEqual({ mode: 'absolute', value: 1000 })
    expect(input.value).toBe('1000')
    expect(input.labels?.[0]?.textContent).toContain('Sicherheitspuffer')
    wrapper.unmount()
  })
})
