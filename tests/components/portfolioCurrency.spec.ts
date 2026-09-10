import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { defineComponent, h } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
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
      const { result, fx, loadFx } = usePortfolioValuation()
      const { formatMoney } = usePortfolioCurrency()
      return () => h('div', [h('output', formatMoney(result.value?.rows[1]?.marketValue ?? 0)), h(FxNotice, { result: result.value, loading: fx.loading, onRetry: loadFx })])
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
