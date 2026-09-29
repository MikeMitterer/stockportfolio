import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import AddPositionDialog from '@/components/AddPositionDialog.vue'
import { translate } from '@/i18n'

beforeEach(() => setActivePinia(createPinia()))
afterEach(() => { document.body.innerHTML = '' })

describe('Verrechnungskonto hinzufügen', () => {
  it('nimmt Cash ohne Wertpapierkatalog und ohne Kursprüfung auf', async () => {
    const validateInstrument = vi.fn(async () => {})
    const wrapper = mount(AddPositionDialog, { props: {
      show: true, available: [], existingKeys: [], remainingTargetPercent: 10,
      allowCash: true, validateInstrument,
    } })
    await flushPromises()
    const cashChoice = [...document.querySelectorAll('label')]
      .find(label => label.textContent?.includes(translate('seed.cashAccount')))
    expect(cashChoice).toBeDefined()
    cashChoice!.click()
    await flushPromises()
    const inputs = [...document.querySelectorAll<HTMLInputElement>('.addpos__pair input')]
    expect(inputs).toHaveLength(2)
    inputs[0]!.value = '500.25'
    inputs[0]!.dispatchEvent(new Event('input', { bubbles: true }))
    inputs[0]!.dispatchEvent(new Event('blur'))
    inputs[1]!.value = '10'
    inputs[1]!.dispatchEvent(new Event('input', { bubbles: true }))
    inputs[1]!.dispatchEvent(new Event('blur'))
    await flushPromises()
    const submit = [...document.querySelectorAll('button')]
      .find(button => button.textContent === translate('actions.addPosition'))!
    submit.click()
    await flushPromises()
    expect(wrapper.emitted('add-cash')?.[0]?.[0]).toEqual({ units: 500.25, targetPercent: 10 })
    expect(validateInstrument).not.toHaveBeenCalled()
    wrapper.unmount()
  })
})
