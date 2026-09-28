import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { createMemoryHistory, createRouter, type Router } from 'vue-router'

import AppStatusBar from '@/components/AppStatusBar.vue'
import SettingsView from '@/views/SettingsView.vue'
import { useLocaleStore } from '@/stores/locale'
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
})
