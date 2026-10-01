import { afterEach, describe, expect, it } from 'vitest'
import { NSelect } from 'naive-ui'
import { mount } from '@vue/test-utils'
import ExternalLinkEditor from '@/components/ExternalLinkEditor.vue'
import { i18n, type AppLocale } from '@/i18n'
import type { ExternalLink } from '@/types/portfolio'

const originalLocale = i18n.global.locale.value
afterEach(() => { i18n.global.locale.value = originalLocale })

describe('Externe Links hinzufügen', () => {
  it.each<[AppLocale, string, string]>([
    ['de', 'Link hinzufügen', 'Neuer Link'],
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


describe('Dynamische Typauswahl', () => {
  it.each<AppLocale>(['de', 'en'])('erhält gespeicherte Filter bei Katalogwechsel, Leerstand und Fehler in %s', async locale => {
    i18n.global.locale.value = locale
    const links: ExternalLink[] = [
      { id: 'saved', label: 'Saved', urlTemplate: 'https://example.test/{symbol}', appliesTo: ['retired-type'], appliesToGroups: ['bonds'], enabled: true },
      { id: 'all', label: 'All', urlTemplate: 'https://example.test/{symbol}', appliesTo: [], enabled: true },
    ]
    const wrapper = mount(ExternalLinkEditor, { props: {
      links, typeCatalog: { types: ['etc', 'fund', 'crypto', 'future-type'], complete: true, sources: [] },
    } })
    try {
      const selects = wrapper.findAllComponents(NSelect)
      expect(selects[0]!.props('options')!.map(option => option.value)).toEqual(['etc', 'fund', 'crypto', 'future-type', 'retired-type'])
      expect(selects[2]!.props('options')!.map(option => option.value)).not.toContain('retired-type')
      expect(selects[0]!.props('options')!.at(-1)?.label).toBe(i18n.global.t('links.typeNotOffered', { type: 'retired-type' }))
      selects[0]!.vm.$emit('update:value', ['fund', 'future-type'])
      expect((wrapper.emitted('update')?.[0]?.[0] as ExternalLink[])[0]).toMatchObject({ appliesTo: ['fund', 'future-type'], appliesToGroups: ['bonds'] })
      await wrapper.setProps({ typeCatalog: { types: [], complete: false, sources: [] } })
      expect(wrapper.text()).toContain(i18n.global.t('links.typesIncomplete'))
      await wrapper.setProps({ typeCatalog: { types: [], complete: true, sources: [] } })
      expect(wrapper.text()).toContain(i18n.global.t('links.typesEmpty'))
      expect(selects[0]!.props('value')).toEqual(['retired-type'])
      await wrapper.setProps({ typeCatalog: null, typesError: '503' })
      expect(wrapper.text()).toContain(i18n.global.t('links.typesFailed', { reason: '503' }))
      expect(selects[2]!.props('options')).toEqual([])
      expect(selects[0]!.props('value')).toEqual(['retired-type'])
      expect(wrapper.emitted('update')).toHaveLength(1)
      const reload = wrapper.findAll('button').find(button => button.text() === i18n.global.t('links.reloadTypes'))!
      await reload.trigger('click')
      expect(wrapper.emitted('reload-types')).toHaveLength(1)
    } finally { wrapper.unmount() }
  })
})
