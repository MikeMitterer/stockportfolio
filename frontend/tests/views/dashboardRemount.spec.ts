import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/data/repository', () => import('../helpers/localRepositories'))
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { defineComponent, h } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import { NDialogProvider, NMessageProvider, NNotificationProvider } from 'naive-ui'
import DashboardView from '@/views/DashboardView.vue'
import { emptyPortfolio } from '@/db/seed'
import { usePortfolioStore } from '@/stores/portfolio'
import { useQuotesStore } from '@/stores/quotes'
import { useSettingsStore } from '@/stores/settings'
import { STOCK_INFO_CLIENT, StockInfoClient } from '@/api/client'
import { toQuoteCacheEntry } from '@/api/mappers'
import { normalizeQuote } from '@/api/normalizers'
import { i18n } from '@/i18n'
import { setFormatterLocale } from '@/domain/formatters'
import fixture from '../fixtures/stockinfo/quote-200.json'

const fxBody = { base: 'USD', quote: 'EUR', rate: 0.8, quote_time: '2026-10-01T10:00:00Z', fetched_at: '2026-10-01T10:01:00Z', cached: true, stale: false }

let wrappers: VueWrapper[] = []
let requests: string[] = []
/** Kursabrufe bleiben offen, solange der Test sie nicht freigibt. */
let holdQuotes = false

beforeEach(() => {
  setActivePinia(createPinia())
  i18n.global.locale.value = 'de'
  setFormatterLocale('de-DE')
  requests = []
  holdQuotes = false
})

afterEach(() => {
  for (const wrapper of wrappers) wrapper.unmount()
  wrappers = []
  vi.restoreAllMocks()
})

function createClient(): StockInfoClient {
  return new StockInfoClient('https://stockinfo.test', async (input) => {
    const url = new URL(String(input))
    requests.push(url.pathname)
    if (url.pathname === '/health') return Response.json({ status: 'ok', version: 'test' })
    if (url.pathname === '/fx') return Response.json(fxBody)
    if (url.pathname.startsWith('/quote') && !url.pathname.endsWith('/daily')) {
      if (holdQuotes) return new Promise<Response>(() => {})
      return Response.json({ ...fixture.response.body, symbol: 'USDX', price: 10, currency: 'USD' })
    }
    return Response.json([])
  })
}

/** Ein geladenes Depot mit einer USD-Position und gecachtem Kurs. */
function prepareLoadedState(fetchedAt: string) {
  const portfolio = usePortfolioStore()
  portfolio.portfolio = emptyPortfolio('Wechselprobe', 'EUR')
  portfolio.portfolio.positions.push({
    id: 'usd', isin: null, symbol: 'USDX', displayName: 'Dollar-Aktie',
    kind: 'stock', group: 'stocks', units: 10, targetPercent: 50, enabled: true,
  })
  portfolio.loaded = true
  const settings = useSettingsStore()
  settings.loaded = true
  settings.settings.refresh = { autoOnLoad: true, staleAfterMinutes: 60 }
  const quotes = useQuotesStore()
  vi.spyOn(quotes, 'hydrate').mockResolvedValue()
  const entry = toQuoteCacheEntry(normalizeQuote({ ...fixture.response.body, symbol: 'USDX', price: 10, currency: 'USD' }, 'test'))
  quotes.quotes.set('USDX', { ...entry, fetchedAt })
  quotes.lastRefreshAt = fetchedAt
  return { portfolio, settings }
}

function mountDashboard(client: StockInfoClient): VueWrapper {
  const Host = defineComponent({
    setup: () => () => h(NMessageProvider, null, {
      default: () => h(NDialogProvider, null, {
        default: () => h(NNotificationProvider, null, { default: () => h(DashboardView) }),
      }),
    }),
  })
  const wrapper = mount(Host, {
    global: {
      plugins: [createRouter({ history: createMemoryHistory(), routes: [
        { path: '/:pathMatch(.*)*', component: { template: '<div />' } },
      ] })],
      provide: { [STOCK_INFO_CLIENT as symbol]: client },
    },
  })
  wrappers.push(wrapper)
  return wrapper
}

describe('Dashboard beim Ansichtswechsel', () => {
  it('lädt Depot, Einstellungen, Kurse und Devisenkurs beim erneuten Aufbau nicht neu', async () => {
    const { portfolio, settings } = prepareLoadedState(new Date().toISOString())
    const portfolioLoad = vi.spyOn(portfolio, 'load')
    const settingsLoad = vi.spyOn(settings, 'load')
    const client = createClient()

    mountDashboard(client).unmount()
    wrappers = []
    await flushPromises()
    const fxAfterFirst = requests.filter(path => path === '/fx').length
    expect(fxAfterFirst).toBe(1)

    requests = []
    const second = mountDashboard(client)
    await flushPromises()

    expect(portfolioLoad).not.toHaveBeenCalled()
    expect(settingsLoad).not.toHaveBeenCalled()
    expect(requests.filter(path => path === '/fx' || path.startsWith('/quote') && !path.endsWith('/daily'))).toEqual([])
    expect(second.text()).toContain('Dollar-Aktie')
  })

  it('zeigt die Tabelle mit gecachten Kursen, während die Aktualisierung nach der Schonfrist läuft', async () => {
    prepareLoadedState(new Date(Date.now() - 2 * 60 * 60_000).toISOString())
    holdQuotes = true

    const wrapper = mountDashboard(createClient())
    await flushPromises()

    expect(requests.some(path => path.startsWith('/quote') && !path.endsWith('/daily'))).toBe(true)
    expect(wrapper.text()).toContain('Dollar-Aktie')
  })

  it('zeigt die Tabelle, während ein einzelner fehlender Kurs nachgeladen wird', async () => {
    const { portfolio } = prepareLoadedState(new Date().toISOString())
    portfolio.portfolio!.positions.push({
      id: 'new', isin: null, symbol: 'NEUX', displayName: 'Neue Aktie',
      kind: 'stock', group: 'stocks', units: 1, targetPercent: 0, enabled: true,
    })
    holdQuotes = true

    const wrapper = mountDashboard(createClient())
    await flushPromises()

    expect(requests.filter(path => path === '/quote')).toEqual(['/quote'])
    expect(wrapper.text()).toContain('Dollar-Aktie')
    expect(wrapper.text()).toContain('Neue Aktie')
  })
})
