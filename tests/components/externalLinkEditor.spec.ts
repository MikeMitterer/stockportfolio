import { afterEach, describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import ExternalLinkEditor from '@/components/ExternalLinkEditor.vue'
import { i18n, type AppLocale } from '@/i18n'
import type { ExternalLink } from '@/types/portfolio'

const originalLocale = i18n.global.locale.value
afterEach(() => { i18n.global.locale.value = originalLocale })

describe('Externe Verweise hinzufügen', () => {
  it.each<[AppLocale, string, string]>([
    ['de', 'Verweis hinzufügen', 'Neuer Verweis'],
    ['en', 'Add link', 'New link'],
  ])('vergibt in %s eine übersetzte Bezeichnung', async (locale, action, label) => {
    i18n.global.locale.value = locale
    const wrapper = mount(ExternalLinkEditor, { props: { links: [] } })
    try {
      const button = wrapper.findAll('button').find(candidate => candidate.text() === action)
      expect(button).toBeDefined()
      await button!.trigger('click')
      const links = wrapper.emitted('update')?.[0]?.[0] as ExternalLink[]
      expect(links).toHaveLength(1)
      expect(links[0]?.label).toBe(label)
      await wrapper.setProps({ links })
      expect(wrapper.get('input').element.value).toBe(label)
    } finally {
      wrapper.unmount()
    }
  })
})
