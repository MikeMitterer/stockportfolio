import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import { afterEach, describe, expect, it, vi } from 'vitest'

import AuthRoot from '@/auth/AuthRoot.vue'

afterEach(() => { vi.unstubAllGlobals() })

describe('Adresse nach der Anmeldung', () => {
  it('lässt bei einem Nutzer ohne Depotzugriff keinen alten Dashboard-Pfad stehen', async () => {
    const emptyPage = { template: '<div />' }
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', name: 'dashboard', component: emptyPage },
        { path: '/rebalancing', name: 'rebalancing', component: emptyPage },
      ],
    })
    await router.push('/rebalancing')
    await router.isReady()

    vi.stubGlobal('fetch', vi.fn(async (input: string) => {
      const path = String(input)
      if (path === '/api/setup/status') return Response.json({ required: false })
      if (path === '/api/auth/session') return Response.json({ error: 'unauthorized' }, { status: 401 })
      if (path === '/api/auth/login') {
        return Response.json({ user: { id: 'user-1', username: 'mike', role: 'user', active: true, mustChangePassword: true } })
      }
      if (path === '/api/auth/change-password') {
        return Response.json({ user: { id: 'user-1', username: 'mike', role: 'user', active: true, mustChangePassword: false } })
      }
      throw new Error(`Unexpected request: ${path}`)
    }))

    const wrapper = mount(AuthRoot, { global: { plugins: [router] } })
    await flushPromises()
    expect(wrapper.text()).not.toContain('Tolerance-Band Rebalancing')
    const [usernameInput, passwordInput] = wrapper.findAll('input')
    await usernameInput!.setValue('mike')
    await passwordInput!.setValue('Example123!')
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    expect(wrapper.get('h2').text()).toMatch(/Passwort ändern|Change password/)
    await wrapper.get('input[type="password"]').setValue('NewExample123!')
    await wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(wrapper.get('h2').text()).toMatch(/Depotzugriff folgt|Portfolio access is coming/)
    expect(router.currentRoute.value.path).toBe('/')
    wrapper.unmount()
  })
})
