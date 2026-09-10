import { beforeEach, describe, expect, it } from 'vitest'
import { flushPromises, mount, shallowMount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { NButton, NInputNumber, NSelect } from 'naive-ui'
import PositionDrilldown from '@/components/PositionDrilldown.vue'
import PositionCard from '@/components/PositionCard.vue'
import PriceChart from '@/components/PriceChart.vue'
import AddPositionDialog from '@/components/AddPositionDialog.vue'
import { StockInfoClient } from '@/api/client'
import { ApiError } from '@/api/errors'
import { toQuoteCacheEntry } from '@/api/mappers'
import { computeRebalancing } from '@/domain/rebalancing'
import { defaultSettings } from '@/stores/settings'
import { useQuotesStore } from '@/stores/quotes'
import { money } from '@/domain/formatters'
import { translate } from '@/i18n'
import type { Portfolio } from '@/types/portfolio'
import quoteFixture from '../fixtures/stockinfo/quote-200.json'
import catalogFixture from '../fixtures/stockinfo/instruments-200.json'

beforeEach(() => setActivePinia(createPinia()))

const payload = quoteFixture.response.body
const portfolio: Portfolio = {
  id: 'test', name: 'Test', createdAt: '', updatedAt: '',
  positions: [{ id: 'a', isin: payload.identity.isin, symbol: payload.symbol, displayName: payload.name,
    group: 'stocks', kind: 'etf', units: 10, targetPercent: 100, enabled: true }],
}

async function rowFor(currency: string | null) {
  const quotes = new Map()
  if (currency) {
    const client = new StockInfoClient('https://contract.test', async () => new Response(JSON.stringify({ ...payload, currency })))
    quotes.set(payload.identity.isin, toQuoteCacheEntry(await client.getQuoteBySymbol(payload.symbol)))
  }
  return computeRebalancing(portfolio, quotes, defaultSettings('test')).rows[0]!
}

describe('Kursvertrag in der Oberfläche', () => {
  it('unterscheidet bei gleichem Symbol die gewählten Börsenlistings', async () => {
    const raw = catalogFixture.response.body[0]!
    const listings = ['XNAS', 'XNYS'].map(mic => ({
      ...raw, listing_id: `dual-${mic}`, symbol: 'DUAL', name: mic,
      identity: { kind: 'listed', ticker: 'DUAL', mic },
    }))
    const client = new StockInfoClient('https://contract.test', async () => new Response(JSON.stringify(listings)))
    const available = await client.getInstruments()
    let checked = ''
    const wrapper = shallowMount(AddPositionDialog, {
      props: {
        show: true, available, existingKeys: [], remainingTargetPercent: 100,
        validateInstrument: async instrument => { checked = instrument.listing_id },
      },
      global: { renderStubDefaultSlot: true, stubs: { Card: { template: '<div><slot /><slot name="footer" /></div>' } } },
    })
    const select = wrapper.findComponent(NSelect)
    expect(select.props('options')).toEqual([
      expect.objectContaining({ value: 'dual-XNAS', label: expect.stringContaining('XNAS') }),
      expect.objectContaining({ value: 'dual-XNYS', label: expect.stringContaining('XNYS') }),
    ])
    select.vm.$emit('update:value', 'dual-XNYS')
    wrapper.findComponent(NInputNumber).vm.$emit('update:value', 2)
    await wrapper.vm.$nextTick()
    wrapper.findAllComponents(NButton).find(b => b.props('type') === 'primary')!.vm.$emit('click')
    await flushPromises()
    expect(checked).toBe('dual-XNYS')
    expect(wrapper.emitted('add')?.[0]?.[0]).toMatchObject({ instrument: { identity: { mic: 'XNYS' } } })
    wrapper.unmount()
  })

  it('zeigt den konkreten Fehlergrund dauerhaft in Detailansicht und Mobilkarte', async () => {
    const row = await rowFor(null)
    const reason = 'Symbol DUAL ist mehrdeutig'
    useQuotesStore().failures = [{ key: payload.identity.isin, symbol: payload.symbol, reason }]
    for (const component of [PositionDrilldown, PositionCard]) {
      const wrapper = mount(component, { props: { row, total: 0, links: [] } })
      expect(wrapper.text()).toContain(reason)
      wrapper.unmount()
    }
  })

  it('kennzeichnet weiterverwendete alte Kurse sichtbar auch ohne gespeicherten Fehlertext', async () => {
    const row = await rowFor('EUR')
    row.quote!.stale = true
    const wrapper = mount(PositionDrilldown, { props: { row, total: 0, links: [] } })
    expect(wrapper.text()).toContain(translate('errors.staleQuote'))
    wrapper.unmount()
  })

  it('zeigt ohne Kurs einen Hinweis und kein als EUR beschriftetes Diagramm', async () => {
    const row = await rowFor(null)
    const wrapper = mount(PositionDrilldown, { props: { row, total: 0, links: [] } })
    expect(wrapper.findComponent(PriceChart).exists()).toBe(false)
    expect(wrapper.text()).toContain(translate('currency.missingQuote'))
    wrapper.unmount()
    const card = mount(PositionCard, { props: { row } })
    expect(card.text()).toContain(translate('currency.missingQuote'))
    card.unmount()
  })

  it.each(['USD', 'GBp'])('erhält Originalwährung %s im Detail und auf Mobilkarten', async (currency) => {
    const row = await rowFor(currency)
    const wrapper = mount(PositionDrilldown, { props: { row, total: 0, links: [] } })
    expect(wrapper.findComponent(PriceChart).props('currency')).toBe(currency)
    const facts = wrapper.find('.drill__facts').text()
    expect(facts).toContain(currency === 'GBp' ? 'GBp' : '$')
    // Ohne Umrechnung gibt es weder Euro-Ziele noch einen Euro-Fehlbetrag.
    expect(facts).not.toContain('€')
    wrapper.unmount()
    const card = mount(PositionCard, { props: { row } })
    expect(card.find('.poscard__line--base').text()).not.toContain('€')
    expect(card.text()).toContain(currency === 'GBp' ? 'GBp' : '$')
    card.unmount()
  })

  it('benennt Pence beim Formatieren nicht in Pfund um', () => {
    expect(money(1234, 'GBp')).toContain('GBp')
    expect(money(1234, 'GBp')).not.toContain('£')
  })

  it.each([true, false])('wählt normalisierte Katalogeinträge aus und sperrt Dubletten (ISIN: %s)', async (withIsin) => {
    const raw = catalogFixture.response.body[0]!
    const identity = withIsin ? raw.identity : { kind: 'listed', ticker: 'EUNL', mic: 'XETR' }
    const client = new StockInfoClient('https://contract.test', async () => new Response(JSON.stringify([{ ...raw, identity, latest_currency: 'USD' }])))
    const available = await client.getInstruments()
    const key = withIsin ? raw.identity.isin : raw.symbol
    const wrapper = shallowMount(AddPositionDialog, {
      props: { show: true, available, existingKeys: [], remainingTargetPercent: 100, validateInstrument: async () => {} },
      global: {
        renderStubDefaultSlot: true,
        stubs: { Card: { template: '<div><slot /><slot name="footer" /></div>' } },
      },
    })
    const select = wrapper.findComponent(NSelect)
    expect(select.props('options')).toEqual([expect.objectContaining({ value: raw.listing_id })])
    select.vm.$emit('update:value', raw.listing_id)
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.addpos__facts').text()).toContain('$')
    wrapper.findComponent(NInputNumber).vm.$emit('update:value', 10)
    await wrapper.vm.$nextTick()
    const submit = wrapper.findAllComponents(NButton).find((button) => button.props('type') === 'primary')!
    submit.vm.$emit('click')
    await flushPromises()
    const event = wrapper.emitted('add')?.[0]?.[0]
    expect(event).toMatchObject({ instrument: { isin: withIsin ? raw.identity.isin : null, identity }, units: 10 })
    await wrapper.setProps({ existingKeys: [key] })
    expect(wrapper.findComponent(NSelect).exists()).toBe(false)
    expect(wrapper.text()).toContain(translate('addPosition.allInPortfolio'))
    wrapper.unmount()
  })

  it('nimmt bei fehlgeschlagener Kursprüfung nichts auf und lässt den Dialog mit Grund offen', async () => {
    const raw = catalogFixture.response.body[0]!
    const client = new StockInfoClient('https://contract.test', async () => new Response(JSON.stringify([raw])))
    const available = await client.getInstruments()
    const reason = 'Symbol DUAL ist mehrdeutig'
    const wrapper = shallowMount(AddPositionDialog, {
      props: {
        show: true, available, existingKeys: [], remainingTargetPercent: 100,
        validateInstrument: async () => { throw new ApiError(409, reason, 'https://contract.test/quote') },
      },
      global: { renderStubDefaultSlot: true, stubs: { Card: { template: '<div><slot /><slot name="footer" /></div>' } } },
    })
    wrapper.findComponent(NSelect).vm.$emit('update:value', raw.listing_id)
    await wrapper.vm.$nextTick()
    wrapper.findComponent(NInputNumber).vm.$emit('update:value', 10)
    await wrapper.vm.$nextTick()
    wrapper.findAllComponents(NButton).find(b => b.props('type') === 'primary')!.vm.$emit('click')
    await flushPromises()
    expect(wrapper.emitted('add')).toBeUndefined()
    expect(wrapper.emitted('update:show')).toBeUndefined()
    expect(wrapper.text()).toContain(reason)
    wrapper.unmount()
  })
})
