import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import { createPinia } from 'pinia'
import { afterEach, describe, expect, it, vi } from 'vitest'

import AuthRoot from '@/auth/AuthRoot.vue'
import { deactivatePrivateData } from '@/data/client'

afterEach(() => { deactivatePrivateData(); vi.unstubAllGlobals() })

describe('Adresse nach der Anmeldung', () => {
  it('öffnet nach der Passwortänderung eines Nutzers das Dashboard statt des alten Pfads', async () => {
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
      if (path === '/api/stockinfo-target') return Response.json({ url: 'https://stockinfo.example' })
      if (path === '/api/auth/session') return Response.json({ error: 'unauthorized' }, { status: 401 })
      if (path === '/api/auth/login') {
        return Response.json({ user: { id: 'user-1', username: 'mike', role: 'user', active: true, mustChangePassword: true, isSetupAccount: false, legacyImported: false } })
      }
      if (path === '/api/auth/change-password') {
        return Response.json({ user: { id: 'user-1', username: 'mike', role: 'user', active: true, mustChangePassword: false, isSetupAccount: false, legacyImported: false } })
      }
      throw new Error(`Unexpected request: ${path}`)
    }))

    const wrapper = mount(AuthRoot, { global: { plugins: [createPinia(), router], stubs: { AuthenticatedApp: true } } })
    await flushPromises()
    expect(wrapper.text()).not.toContain('Tolerance-Band Rebalancing')
    const [usernameInput, passwordInput] = wrapper.findAll('input')
    await usernameInput!.setValue('mike')
    await passwordInput!.setValue('Example123!')
    await wrapper.get('[role="checkbox"]').trigger('click')
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    expect(wrapper.get('h2').text()).toMatch(/Passwort ändern|Change password/)
    await wrapper.get('input[type="password"]').setValue('NewExample123!')
    await wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(wrapper.find('authenticated-app-stub').exists()).toBe(true)
    expect(router.currentRoute.value.path).toBe('/')
    wrapper.unmount()
  })
})

describe('Hinweis zu Anlageentscheidungen beim Login', () => {
  it('meldet erst an, nachdem der Hinweis per Checkbox bestätigt wurde', async () => {
    const router = createRouter({ history: createMemoryHistory(), routes: [{ path: '/', name: 'dashboard', component: { template: '<div />' } }] })
    await router.push('/')
    await router.isReady()
    const fetcher = vi.fn(async (input: string) => {
      const path = String(input)
      if (path === '/api/setup/status') return Response.json({ required: false })
      if (path === '/api/stockinfo-target') return Response.json({ url: 'https://stockinfo.example' })
      if (path === '/api/auth/session') return Response.json({ error: 'unauthorized' }, { status: 401 })
      if (path === '/api/auth/login') {
        return Response.json({ user: { id: 'user-1', username: 'mike', role: 'user', active: true, mustChangePassword: false, isSetupAccount: false, legacyImported: false } })
      }
      throw new Error(`Unexpected request: ${path}`)
    })
    vi.stubGlobal('fetch', fetcher)
    const loginCalls = () => fetcher.mock.calls.filter(([path]) => String(path) === '/api/auth/login').length

    const wrapper = mount(AuthRoot, { global: { plugins: [createPinia(), router], stubs: { AuthenticatedApp: true } } })
    await flushPromises()
    expect(wrapper.text()).toMatch(/does not check whether a trade or a financial instrument suits you/)
    expect(wrapper.text()).toContain('I have read the notice.')
    const checkbox = wrapper.get('[role="checkbox"]')
    expect(checkbox.attributes('aria-checked')).toBe('false')
    const [usernameInput, passwordInput] = wrapper.findAll('input')
    await usernameInput!.setValue('mike')
    await passwordInput!.setValue('Example123!')

    // Ohne Haken: Knopf gesperrt, und auch Enter im Formular meldet nicht an.
    expect(wrapper.get('button[type="submit"]').attributes('disabled')).toBeDefined()
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    expect(loginCalls()).toBe(0)

    await checkbox.trigger('click')
    expect(wrapper.get('button[type="submit"]').attributes('disabled')).toBeUndefined()
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    expect(loginCalls()).toBe(1)
    expect(wrapper.find('authenticated-app-stub').exists()).toBe(true)
    wrapper.unmount()
  })
})
