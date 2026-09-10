import { beforeEach, describe, expect, it } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'
import { h, ref } from 'vue'
import { NConfigProvider } from 'naive-ui'
import PositionDetailFields from '@/components/PositionDetailFields.vue'
import PositionsTable from '@/components/PositionsTable.vue'
import PositionCard from '@/components/PositionCard.vue'
import { STOCK_INFO_CLIENT, StockInfoClient } from '@/api/client'
import { toFieldCatalog, toQuoteCacheEntry } from '@/api/mappers'
import { computeRebalancing } from '@/domain/rebalancing'
import { defaultSettings } from '@/stores/settings'
import { useFieldsStore } from '@/stores/fields'
import { translate } from '@/i18n'
import quoteFixture from '../fixtures/stockinfo/quote-200.json'
import catalogFixture from '../fixtures/stockinfo/detail-catalog.json'
import values from '../fixtures/stockinfo/detail-values.json'

beforeEach(() => setActivePinia(createPinia()))
async function sample() {
  const body = quoteFixture.response.body
  const client = new StockInfoClient('https://details.test', async input => new Response(JSON.stringify(
    String(input).endsWith('/fields') ? catalogFixture : String(input).includes('/daily') ? [] : { ...body, details: values },
  )))
  const quote = toQuoteCacheEntry(await client.getQuoteByIsin(body.identity.isin))
  useFieldsStore().catalog = toFieldCatalog(await client.getFields())
  const result = computeRebalancing({ id: 'test', name: 'Test', createdAt: '', updatedAt: '', positions: [{
    id: 'a', isin: body.identity.isin, symbol: body.symbol, displayName: body.name, group: 'stocks', kind: 'etf', units: 1, targetPercent: 100, enabled: true,
  }] }, new Map([[body.identity.isin, quote]]), defaultSettings('test'))
  return { quote, client, result }
}

describe('Zusatzinformationen in der echten Detailansicht', () => {
  it('öffnet dieselben Zusatzinformationen auf einer Mobilkarte', async () => {
    const { result } = await sample()
    const wrapper = mount(PositionCard, { props: { row: result.rows[0]! } })
    expect(wrapper.find('[data-detail-field="risk-a.score"]').exists()).toBe(false)
    const button = wrapper.findAll('button').find(button => button.text() === translate('detailFields.title'))!
    expect(button).toBeDefined()
    await button.trigger('click')
    expect(wrapper.find('[data-detail-field="risk-a.score"]').exists()).toBe(true)
    wrapper.unmount()
  })
  it('rendert Werte als Text, mit getrennten Feldnamen und Herkunft', async () => {
    const { quote } = await sample()
    const wrapper = mount(PositionDetailFields, { props: { quote } })
    expect(wrapper.findAll('[data-detail-field]').length).toBe(7)
    expect(wrapper.text()).toContain('risk-a.score')
    expect(wrapper.text()).toContain('risk-b.score')
    expect(wrapper.text()).toContain(values['risk-a.note'].value)
    expect(wrapper.find('img').exists()).toBe(false)
    expect(wrapper.find('[data-detail-field="risk-a.score"]').text()).toContain('risk-a')
    expect(wrapper.find('[data-detail-field="risk-a.score"]').text()).toContain('7')
    wrapper.unmount()
  })

  it('behält bei fehlendem Katalog die bekannten Core-Zusatzwerte und einen Hinweis', async () => {
    const { quote } = await sample()
    useFieldsStore().catalog = null
    useFieldsStore().error = '503'
    const wrapper = mount(PositionDetailFields, { props: { quote } })
    expect(wrapper.text()).toContain(translate('detailFields.unavailable'))
    expect(wrapper.find('[data-detail-field="ter"]').exists()).toBe(true)
    expect(wrapper.find('[data-detail-field="risk-a.score"]').exists()).toBe(false)
    wrapper.unmount()
  })

  it('unterscheidet noch nicht geladene Detailwerte von einem leeren geladenen Block', async () => {
    const { quote } = await sample()
    const wrapper = mount(PositionDetailFields, { props: { quote: { ...quote, details: null } } })
    expect(wrapper.text()).toContain(translate('detailFields.notLoaded'))
    await wrapper.setProps({ quote: { ...quote, details: {} } })
    expect(wrapper.text()).not.toContain(translate('detailFields.notLoaded'))
    wrapper.unmount()
  })

  it('leitet Ausschlüsse aus dynamischen Hauptspalten ab und hebt sie beim Entfernen auf', async () => {
    const { client, result } = await sample()
    const detailColumns = ref<string[]>([])
    const wrapper = mount(NConfigProvider, {
      slots: { default: () => h(PositionsTable, { rows: result.rows, groups: result.groups, total: result.total, targetsExceeded: false, links: [], detailColumns: detailColumns.value }) },
      global: {
        provide: { [STOCK_INFO_CLIENT]: client },
        plugins: [createRouter({ history: createMemoryHistory(), routes: ['/', '/method', '/settings'].map(path => ({ path, component: { render: () => null } })) })],
      },
    })
    await wrapper.find('button.cell-symbol').trigger('click')
    await flushPromises()
    expect(wrapper.find('[data-detail-field="risk-a.score"]').exists()).toBe(true)
    detailColumns.value = ['risk-a.score', 'ter']
    await flushPromises()
    expect(wrapper.find('[data-main-field="risk-a.score"]').exists()).toBe(true)
    expect(wrapper.find('[data-detail-field="risk-a.score"]').exists()).toBe(false)
    expect(wrapper.find('[data-detail-field="risk-b.score"]').exists()).toBe(true)
    expect(wrapper.find('[data-detail-field="ter"]').exists()).toBe(false)
    detailColumns.value = []
    await flushPromises()
    expect(wrapper.find('[data-detail-field="risk-a.score"]').exists()).toBe(true)
    expect(wrapper.findAll('[data-detail-field="ter"]').length).toBe(1)
    wrapper.unmount()
  })
})
