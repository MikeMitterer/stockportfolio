import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { createMemoryHistory, createRouter, type Router } from 'vue-router'
import { NSelect } from 'naive-ui'

import AppStatusBar from '@/components/AppStatusBar.vue'
import SettingsView from '@/views/SettingsView.vue'
import { useLocaleStore } from '@/stores/locale'
import { useThemeStore } from '@/stores/theme'
import { STOCK_INFO_CLIENT } from '@/api/client'

beforeEach(() => {
  setActivePinia(createPinia())
  useLocaleStore().setLocale('de')
})

let activeWrapper: VueWrapper | null = null

afterEach(() => {
  activeWrapper?.unmount()
  activeWrapper = null
})

function testRouter(): Router {
  return createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/settings', name: 'settings', component: SettingsView }],
  })
}

describe('Hinweise zu Daten und Nutzung', () => {
  it('führt aus der Statuszeile direkt zum About-Reiter', async () => {
    const router = testRouter()
    await router.push('/settings')
    const wrapper = mount(AppStatusBar, {
      global: { plugins: [router], provide: { [STOCK_INFO_CLIENT as symbol]: null } },
    })
    activeWrapper = wrapper

    const aboutLink = wrapper.get('a.status__about[href$="/settings?tab=about"]')
    expect(aboutLink.text()).toBe('Über StockPortfolio')
    const originLink = wrapper.get('a.ux-statusbar__origin')
    const repositoryLink = wrapper.get('a[href="https://github.com/MikeMitterer/stockportfolio"]')
    expect(originLink.element.compareDocumentPosition(aboutLink.element) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(aboutLink.element.compareDocumentPosition(repositoryLink.element) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(wrapper.find('a[href="./legal.html"]').exists()).toBe(false)
  })

  it('zeigt im deutschen About-Reiter den Hinweis und die deutsche Lizenz', async () => {
    const router = testRouter()
    await router.push('/settings?tab=about')
    const wrapper = mount(SettingsView, {
      global: { plugins: [router], provide: { [STOCK_INFO_CLIENT as symbol]: null } },
    })
    activeWrapper = wrapper
    await flushPromises()

    expect(wrapper.find('.n-tabs-nav').text()).toContain('About')
    expect(wrapper.find('.n-tabs-nav').text()).not.toContain('Über')
    expect(wrapper.text()).toContain('Daten können fehlen, veraltet oder fehlerhaft sein')
    expect(wrapper.find('a[href="./LICENSE.de.txt"]').exists()).toBe(true)
    expect(wrapper.find('a[href="./LICENSING.md"]').exists()).toBe(true)
    expect(wrapper.find('a[href="./legal.html"]').exists()).toBe(true)
    expect(wrapper.find('a[href="https://www.mangolila.at/impressum/haftungsausschluss-disclaimer-finanzinhalte/"]').exists()).toBe(true)
  })

  it('öffnet auf Englisch den englischen Lizenztext', async () => {
    useLocaleStore().setLocale('en')
    const router = testRouter()
    await router.push('/settings?tab=about')
    const wrapper = mount(SettingsView, {
      global: { plugins: [router], provide: { [STOCK_INFO_CLIENT as symbol]: null } },
    })
    activeWrapper = wrapper
    await flushPromises()

    expect(wrapper.text()).toContain('Data may be missing, outdated or incorrect')
    expect(wrapper.find('a[href="./LICENSE.txt"]').exists()).toBe(true)
    expect(wrapper.find('a[href="./LICENSE.de.txt"]').exists()).toBe(false)
  })

  it('zeigt Anbieteranschrift und das zum Theme passende Original-Logo', async () => {
    const router = testRouter()
    await router.push('/settings?tab=about')
    const themeStore = useThemeStore()
    themeStore.setTheme('mangolila')
    const wrapper = mount(SettingsView, {
      global: { plugins: [router], provide: { [STOCK_INFO_CLIENT as symbol]: null } },
    })
    activeWrapper = wrapper
    await flushPromises()

    const provider = wrapper.get('address')
    expect(provider.text()).toContain('MangoLila GmbH')
    expect(provider.text()).toContain('Dorfstraße 112')
    expect(provider.text()).toContain('6363 Westendorf')
    expect(provider.text()).toContain('Österreich')
    expect(wrapper.get('a[href="https://www.mangolila.at/"]').text()).toBeTruthy()
    expect(wrapper.find('img[src="/mangolila-logo-dark.png"]').exists()).toBe(true)

    themeStore.setTheme('paper')
    await flushPromises()
    expect(wrapper.find('img[src="/mangolila-logo-light.png"]').exists()).toBe(true)
  })

  it('hält bei kompakter Bereichswahl den About-Reiter in der Adresse aktiv', async () => {
    const router = testRouter()
    await router.push('/settings?tab=about')
    const wrapper = mount(SettingsView, {
      global: { plugins: [router], provide: { [STOCK_INFO_CLIENT as symbol]: null } },
    })
    activeWrapper = wrapper
    await flushPromises()

    const selection = wrapper.getComponent(NSelect)
    expect(selection.props('value')).toBe('about')
    selection.vm.$emit('update:value', 'theme')
    await flushPromises()
    expect(router.currentRoute.value.query.tab).toBe('theme')
    expect(selection.props('value')).toBe('theme')
  })
})
