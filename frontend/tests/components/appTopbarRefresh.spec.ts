/**
 * Der Aktualisieren-Knopf in der Kopfzeile zeigt, dass er arbeitet.
 *
 * Den Zustand gab es im Quotes-Store längst (`loading`), sichtbar war er nur
 * daran, dass die Altersangabe daneben zu „…" wurde — was etwas anderes sagt,
 * nämlich dass die Angabe gerade nicht stimmt.
 */

import { mount } from '@vue/test-utils'
import { ref } from 'vue'
import { createMemoryHistory, createRouter, type Router } from 'vue-router'
import { describe, expect, it } from 'vitest'

import { AUTH_LOGOUT, AUTH_USER } from '@/auth/context'
import type { PortfolioUser } from '@/auth/client'
import AppTopbar from '@/components/AppTopbar.vue'

/** Die Kopfzeile löst Adressen für ihre Menüpunkte auf und braucht dafür Routen. */
function attrappenRouter(): Router {
  const leer = { template: '<div />' }
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'dashboard', component: leer },
      { path: '/rebalancing', name: 'rebalancing', component: leer },
      { path: '/instruments', name: 'instruments', component: leer },
      { path: '/settings', name: 'settings', component: leer },
      { path: '/admin/users', name: 'admin-users', component: leer },
    ],
  })
}

async function topbar(refreshing: boolean, role: PortfolioUser['role'] = 'user') {
  const router = attrappenRouter()
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
function aktualisieren(wrapper: Awaited<ReturnType<typeof topbar>>) {
  return wrapper.find('button')
}

describe('Kopfzeile — Aktualisieren', () => {
  it('dreht und nimmt keinen Klick an, solange die Kurse geholt werden', async () => {
    const knopf = aktualisieren(await topbar(true))

    expect(knopf.classes()).toContain('n-button--loading')
    expect(knopf.attributes('disabled')).toBeDefined()
  })

  it('steht sonst normal da und meldet den Klick nach oben', async () => {
    const wrapper = await topbar(false)
    const knopf = aktualisieren(wrapper)

    expect(knopf.classes()).not.toContain('n-button--loading')
    await knopf.trigger('click')

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
