import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { defineComponent, h } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import { NNotificationProvider } from 'naive-ui'
import { UxInlineNumber } from '@mmit/ux-foundation'
import RebalancingView from '@/views/RebalancingView.vue'
import { emptyPortfolio } from '@/db/seed'
import { usePortfolioStore } from '@/stores/portfolio'
import { useQuotesStore } from '@/stores/quotes'
import { useSettingsStore } from '@/stores/settings'
import { STOCK_INFO_CLIENT } from '@/api/client'
import { toQuoteCacheEntry } from '@/api/mappers'
import { normalizeQuote } from '@/api/normalizers'
import { i18n } from '@/i18n'
import { setFormatterLocale } from '@/domain/formatters'
import fixture from '../fixtures/stockinfo/quote-200.json'

let wrapper: VueWrapper | undefined

beforeEach(() => {
  setActivePinia(createPinia())
  i18n.global.locale.value = 'de'
  setFormatterLocale('de-DE')
})

afterEach(() => {
  wrapper?.unmount()
  vi.restoreAllMocks()
  i18n.global.locale.value = 'de'
  setFormatterLocale('de-DE')
})

/** Echtes Rechnen mit Gesamtwert 10.000 EUR; nur Cache-Hydrierung ersetzt. */
async function renderPlan(units = 95, targetPercent = 10) {
  const portfolio = usePortfolioStore()
  portfolio.portfolio = emptyPortfolio('Bandprobe', 'EUR')
  portfolio.portfolio.positions[0]!.units = 10000 - units * 10
  portfolio.portfolio.positions[0]!.targetPercent = 100 - targetPercent
  portfolio.portfolio.positions.push({
    id: 'asset', isin: null, symbol: 'TEST', displayName: 'Bandprobe-Aktie',
    kind: 'stock', group: 'stocks', units, targetPercent, enabled: true,
  })
  portfolio.loaded = true
  const settings = useSettingsStore()
  settings.loaded = true
  settings.settings.totalRounding = 0
  settings.settings.refresh.autoOnLoad = false
  const quotes = useQuotesStore()
  vi.spyOn(quotes, 'hydrate').mockResolvedValue()
  quotes.quotes.set('TEST', toQuoteCacheEntry(normalizeQuote({
    ...fixture.response.body, price: 10, currency: 'EUR',
  }, 'test')))
  const Host = defineComponent({
    setup: () => () => h(NNotificationProvider, null, { default: () => h(RebalancingView) }),
  })
  wrapper = mount(Host, {
    global: {
      plugins: [createRouter({ history: createMemoryHistory(), routes: [
        { path: '/:pathMatch(.*)*', component: { template: '<div />' } },
      ] })],
      provide: { [STOCK_INFO_CLIENT as symbol]: null },
    },
  })
  await flushPromises()
  return wrapper.findAll('tbody tr').find(row => row.text().includes('Bandprobe-Aktie'))!
}

describe('Relative Abweichung im Rebalancing', () => {
  it('trennt relative Abweichung, Anteil danach und Prozentpunkte sichtbar', async () => {
    const row = await renderPlan()
    expect(row.find('.reb__relative-value').text()).toBe('−5,0 %')
    expect(row.find('.delta__value').exists()).toBe(false)
    expect(row.find('.reb__relative-value').element.tagName).toBe('TD')
    expect(row.text()).toContain('Anteil nachher: 9,5 %')
    expect(row.findAll('td')[10]!.text()).toBe('−0,5')
    expect(wrapper!.find('thead').text()).toContain('Abw. Ziel')
    expect(row.find('.delta__fill--ok').exists()).toBe(true)
  })

  it.each([
    [93, '−7,0 %', 'out', 'negative'], [94, '−6,0 %', 'ok', 'negative'],
    [100, '+0,0 %', 'ok', 'neutral'], [105, '+5,0 %', 'ok', 'positive'],
    [115, '+15,0 %', 'ok', 'positive'], [116, '+16,0 %', 'out', 'positive'],
  ])('zeigt bei %s Stück Vorzeichenfarbe unabhängig vom Bandstatus', async (units, label, state, sign) => {
    const row = await renderPlan(Number(units))
    expect(row.find('.reb__relative-value').text()).toBe(label)
    expect(row.find(`.delta__fill--${state}`).exists()).toBe(true)
    const value = row.find('.reb__relative-value')
    expect(value.classes().includes('reb__relative-value--positive')).toBe(sign === 'positive')
    expect(value.classes().includes('reb__relative-value--negative')).toBe(sign === 'negative')
  })

  it('aktualisiert Zahl und Balken nach Trade und probeweisem Zielwechsel', async () => {
    const row = await renderPlan()
    const fields = row.findAllComponents(UxInlineNumber)
    fields[1]!.vm.$emit('commit', 10)
    await flushPromises()
    expect(row.find('.reb__relative-value').text()).toBe('+5,0 %')
    expect(row.find('.reb__relative-value--positive').exists()).toBe(true)
    expect(row.find('.reb__relative-value--negative').exists()).toBe(false)
    expect(row.text()).toContain('Anteil nachher: 10,5 %')
    fields[0]!.vm.$emit('commit', 5)
    await flushPromises()
    expect(row.find('.reb__relative-value').text()).toBe('+110,0 %')
    expect(row.find('.delta__fill--out').exists()).toBe(true)
    expect(usePortfolioStore().positions.find(position => position.id === 'asset')!.targetPercent).toBe(10)
  })

  it('kennzeichnet Ziel null ohne irreführende relative Nullabweichung', async () => {
    const row = await renderPlan(95, 0)
    expect(row.find('.reb__relative-value').text()).toBe('—')
    expect(row.find('.reb__relative-value--positive, .reb__relative-value--negative').exists()).toBe(false)
    expect(row.text()).toContain('Bei Ziel 0 % nicht definiert')
    expect(row.text()).not.toMatch(/NaN|Infinity/)
    expect(row.find('.delta__fill--out').exists()).toBe(true)
  })

  it('zeigt dieselben Werte mit englischer Beschriftung und Rundung', async () => {
    i18n.global.locale.value = 'en'
    setFormatterLocale('en-GB')
    const row = await renderPlan()
    expect(row.find('.reb__relative-value').text()).toBe('−5.0 %')
    expect(row.text()).toContain('Share after: 9.5 %')
    expect(wrapper!.find('thead').text()).toContain('Off target')
  })
})
