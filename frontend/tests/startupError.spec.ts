import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { installFakeStorage } from './fixtures/storage'

beforeEach(() => {
  vi.resetModules()
  delete document.documentElement.dataset.theme
  document.documentElement.style.colorScheme = ''
  document.body.innerHTML = '<div id="app"></div>'
  vi.stubGlobal('fetch', vi.fn(async (url: string) => new Response(JSON.stringify(
    url === '/api/setup/status'
      ? { required: false }
      // Der Server kennt keine StockInfo-Adresse (STOCKINFO_API_URL fehlt).
      : url === '/api/stockinfo-target'
        ? { url: null }
        : { user: { id: 'admin-1', username: 'admin', role: 'admin', active: true, mustChangePassword: false } },
  ), { status: 200, headers: { 'Content-Type': 'application/json' } })))
})

afterEach(() => {
  vi.unstubAllGlobals()
  document.body.innerHTML = ''
})

describe('Start ohne StockInfo-Adresse', () => {
  it.each([
    { theme: 'mangolila', scheme: 'dark' },
    { theme: 'paper', scheme: 'light' },
  ])('zeigt die Fehlseite mit dem gespeicherten $theme-Theme', async ({ theme, scheme }) => {
    const storage = installFakeStorage()
    storage.setItem('stockportfolio.theme', theme)
    storage.setItem('stockportfolio.locale', 'de')

    await import('@/main')
    await vi.waitFor(() => expect(document.querySelector('#app h2')?.textContent).toBe('Keine API-Adresse gesetzt'))

    expect(document.querySelector('#app h1')?.textContent).toBe('StockPortfolio')
    expect(document.querySelector('#app h2')?.textContent).toBe('Keine API-Adresse gesetzt')
    expect(document.documentElement.dataset.theme).toBe(theme)
    expect(document.documentElement.style.colorScheme).toBe(scheme)
  })
})
