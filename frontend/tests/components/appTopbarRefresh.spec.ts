/**
 * Der Aktualisieren-Knopf ist während des Abrufs gesperrt. Den Fortschritt
 * zeigt die Leiste am oberen Seitenrand.
 */

import { mount } from '@vue/test-utils'
import { ref } from 'vue'
import { createMemoryHistory, createRouter, type Router } from 'vue-router'
import { describe, expect, it } from 'vitest'

import { AUTH_LOGOUT, AUTH_USER } from '@/auth/context'
import type { PortfolioUser } from '@/auth/client'
import AppTopbar from '@/components/AppTopbar.vue'

/** Die Kopfzeile löst Adressen für ihre Menüpunkte auf und braucht dafür Routen. */
function mockRouter(): Router {
  const empty = { template: '<div />' }
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'dashboard', component: empty },
      { path: '/rebalancing', name: 'rebalancing', component: empty },
      { path: '/instruments', name: 'instruments', component: empty },
      { path: '/settings', name: 'settings', component: empty },
      { path: '/admin/users', name: 'admin-users', component: empty },
    ],
  })
}

async function topbar(refreshing: boolean, role: PortfolioUser['role'] = 'user') {
  const router = mockRouter()
  await router.push('/')
  await router.isReady()

  return mount(AppTopbar, {
    global: {
      plugins: [router],
      provide: {
        [AUTH_USER as symbol]: ref<PortfolioUser>({
          id: 'user-1', username: 'mike', role, active: true, mustChangePassword: false,
          isSetupAccount: false, legacyImported: false,
        }),
        [AUTH_LOGOUT as symbol]: async () => {},
      },
    },
    props: { refreshing },
  })
}

/** Aktualisieren steht vor dem Konto-Menü. */
function refreshButton(wrapper: Awaited<ReturnType<typeof topbar>>) {
  return wrapper.find('button')
}

describe('Kopfzeile — Aktualisieren', () => {
  it('zeigt keinen Spinner und nimmt während des Kursabrufs keinen Klick an', async () => {
    const button = refreshButton(await topbar(true))

    expect(button.classes()).not.toContain('n-button--loading')
    expect(button.attributes('disabled')).toBeDefined()
  })

  it('steht sonst normal da und meldet den Klick nach oben', async () => {
    const wrapper = await topbar(false)
    const button = refreshButton(wrapper)

    expect(button.classes()).not.toContain('n-button--loading')
    await button.trigger('click')

    expect(wrapper.emitted('refresh')).toHaveLength(1)
  })
})

describe('Kopfzeile — Konto', () => {
  it('zeigt den Namen und den direkten Verwaltungszugang nur für Admins', async () => {
    const userTopbar = await topbar(false)
    expect(userTopbar.get('button[aria-label*="mike"]').text()).toContain('mike')
    expect(userTopbar.find('a[href="/admin/users"]').exists()).toBe(false)

    const adminTopbar = await topbar(false, 'admin')
    expect(adminTopbar.get('button[aria-label*="mike"]').text()).toContain('mike')
    expect(adminTopbar.get('a[href="/admin/users"]').text()).toBeTruthy()
  })
})
