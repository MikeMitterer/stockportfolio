import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/data/repository', () => import('../helpers/localRepositories'))
import { createPinia, setActivePinia } from 'pinia'
import { defineComponent, h } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import AppStatusBar from '@/components/AppStatusBar.vue'
import FxNotice from '@/components/FxNotice.vue'
import { usePortfolioCurrency } from '@/composables/usePortfolioCurrency'
import { usePortfolioValuation } from '@/composables/usePortfolioValuation'
import { usePortfolioStore } from '@/stores/portfolio'
import { useQuotesStore } from '@/stores/quotes'
import { STOCK_INFO_CLIENT, StockInfoClient } from '@/api/client'
import { toQuoteCacheEntry } from '@/api/mappers'
import { normalizeQuote } from '@/api/normalizers'
import { emptyPortfolio } from '@/db/seed'
import fixture from '../fixtures/stockinfo/quote-200.json'
import { translate } from '@/i18n'

beforeEach(() => setActivePinia(createPinia()))

describe('Depotwährung in der Oberfläche', () => {
  it('zeigt die Basiswährung des aktiven Depots in der Statuszeile und folgt dem Depotwechsel', async () => {
    const portfolio = usePortfolioStore()
    portfolio.portfolio = emptyPortfolio('Europa', 'EUR')
    const router = createRouter({ history: createMemoryHistory(), routes: [] })
    const wrapper = mount(AppStatusBar, { global: { plugins: [router] } })
    expect(wrapper.text()).toContain('Europa (EUR)')
    portfolio.portfolio = emptyPortfolio('Amerika', 'USD')
    await flushPromises()
    expect(wrapper.text()).toContain('Amerika (USD)')
    expect(wrapper.text()).not.toContain('Europa (EUR)')
    wrapper.unmount()
  })

  it('rechnet nach Depotwechsel um und hält Warnung samt Wiederholen sichtbar', async () => {
    const portfolio = usePortfolioStore()
    portfolio.portfolio = emptyPortfolio('Europa', 'EUR')
    portfolio.portfolio.positions.push({ id: 'asset', isin: null, symbol: 'USD-ASSET', displayName: '', kind: 'etf', group: 'stocks', units: 10, targetPercent: 100, enabled: true })
    const quote = toQuoteCacheEntry(normalizeQuote({ ...fixture.response.body, price: 100, currency: 'USD' }, 'test'))
    useQuotesStore().quotes.set('USD-ASSET', quote)
    let calls = 0
    const client = new StockInfoClient('https://fx.test', async () => {
      calls++
      return new Response(JSON.stringify({ base: 'USD', quote: 'EUR', rate: 0.8, quote_time: '2026-09-01T10:00:00Z', fetched_at: '2026-09-01T10:01:00Z', cached: true, stale: true }))
    })
    const View = defineComponent({ setup() {
      const { result, fx, retryFx } = usePortfolioValuation()
      const { formatMoney } = usePortfolioCurrency()
      return () => h('div', [h('output', formatMoney(result.value?.rows[1]?.marketValue ?? 0)), h(FxNotice, { result: result.value, loading: fx.loading, onRetry: retryFx })])
    } })
    const wrapper = mount(View, { global: { provide: { [STOCK_INFO_CLIENT as symbol]: client } } })
    await flushPromises()
    expect(wrapper.find('output').text()).toContain('800')
    expect(wrapper.text()).toContain('USD/EUR')
    expect(wrapper.text()).toContain('2026')
    const retry = wrapper.findAll('button').find(button => button.text() === translate('fx.retry'))!
    await retry.trigger('click')
    await flushPromises()
    expect(calls).toBe(2)
    portfolio.portfolio = { ...portfolio.portfolio!, id: 'usd', baseCurrency: 'USD' }
    await flushPromises()
    expect(wrapper.find('output').text()).toContain('1')
    expect(wrapper.find('output').text()).toContain('$')
    expect(wrapper.text()).not.toContain('USD/EUR')
    expect(calls).toBe(2)
    wrapper.unmount()
  })
})
