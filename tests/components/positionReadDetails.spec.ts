import { beforeEach, describe, expect, it } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import PositionDrilldown from '@/components/PositionDrilldown.vue'
import PositionCard from '@/components/PositionCard.vue'
import PriceChart from '@/components/PriceChart.vue'
import { toQuoteCacheEntry } from '@/api/mappers'
import { normalizeQuote } from '@/api/normalizers'
import { computeRebalancing, type PositionResult } from '@/domain/rebalancing'
import { defaultSettings } from '@/stores/settings'
import { translate } from '@/i18n'
import type { AssetGroup, Portfolio } from '@/types/portfolio'
import quoteFixture from '../fixtures/stockinfo/quote-200.json'

beforeEach(() => setActivePinia(createPinia()))

function makeRow(group: AssetGroup = 'stocks', withQuote = true): PositionResult {
  const payload = quoteFixture.response.body
  const portfolio: Portfolio = {
    id: 'test', name: 'Test', createdAt: '', updatedAt: '',
    positions: [{
      id: 'a', isin: group === 'cash' ? null : payload.identity.isin,
      symbol: group === 'cash' ? 'CASH' : payload.symbol,
      displayName: group === 'cash' ? 'Cash' : payload.name,
      group, kind: group === 'cash' ? null : 'etf', units: 10, targetPercent: 100, enabled: true,
    }],
  }
  const quotes = new Map()
  if (withQuote && group !== 'cash') {
    quotes.set(payload.identity.isin, toQuoteCacheEntry(normalizeQuote(payload, 'test')))
  }
  const row = computeRebalancing(portfolio, quotes, defaultSettings('test')).rows[0]
  if (!row) throw new Error('Testposition fehlt')
  return row
}

function buttonWithText(wrapper: ReturnType<typeof mount>, label: string) {
  const button = wrapper.findAll('button').find(candidate => candidate.text().includes(label))
  if (!button) throw new Error(`Knopf fehlt: ${label}`)
  return button
}

describe('Positionsdetails nach Aufgabe', () => {
  it('zeigt zunächst die Bewertung und lädt den großen Kurschart erst nach Bereichswechsel', async () => {
    const wrapper = mount(PositionDrilldown, { props: { row: makeRow(), total: 1000, links: [] } })

    expect(wrapper.find('[data-position-section="portfolio"]').exists()).toBe(true)
    expect(wrapper.find('[data-position-section="asset"]').exists()).toBe(false)
    expect(wrapper.findComponent(PriceChart).exists()).toBe(false)

    await buttonWithText(wrapper, translate('drilldown.sectionHistory')).trigger('click')
    expect(wrapper.find('[data-position-section="portfolio"]').exists()).toBe(false)
    expect(wrapper.findComponent(PriceChart).exists()).toBe(true)

    await buttonWithText(wrapper, translate('drilldown.sectionAsset')).trigger('click')
    expect(wrapper.findComponent(PriceChart).exists()).toBe(false)
    expect(wrapper.find('[data-position-section="asset"]').exists()).toBe(true)
    expect(wrapper.find('[data-position-section="details"]').exists()).toBe(false)

    await buttonWithText(wrapper, translate('drilldown.sectionDetails')).trigger('click')
    expect(wrapper.find('[data-position-section="asset"]').exists()).toBe(false)
    expect(wrapper.find('[data-position-section="details"]').exists()).toBe(true)
    wrapper.unmount()
  })

  it('speichert Dialogänderungen erst mit Speichern und verwirft sie mit Abbrechen', async () => {
    const wrapper = mount(PositionDrilldown, { props: { row: makeRow(), total: 1000, links: [] } })

    expect(document.querySelector('[data-position-editor]')).toBeNull()
    await wrapper.get(`button[aria-label="${translate('drilldown.editHeading')}"]`).trigger('click')
    await flushPromises()
    const dialog = document.querySelector('[data-position-editor]')
    expect(dialog?.getAttribute('role')).toBe('dialog')
    const nameLabel = [...(dialog?.querySelectorAll('label') ?? [])].find(label => label.textContent?.includes(translate('drilldown.displayName')))
    const nameInput = nameLabel?.querySelector('input')
    if (!nameInput) throw new Error('Namensfeld fehlt')
    nameInput.value = 'Neuer Name'
    nameInput.dispatchEvent(new Event('input', { bubbles: true }))
    await flushPromises()
    expect(wrapper.emitted('update')).toBeUndefined()
    const cancelButton = [...(dialog?.querySelectorAll('button') ?? [])].find(button => button.textContent?.includes(translate('actions.cancel')))
    cancelButton?.click()
    await flushPromises()
    expect(wrapper.emitted('update')).toBeUndefined()

    await wrapper.get(`button[aria-label="${translate('drilldown.editHeading')}"]`).trigger('click')
    await flushPromises()
    const reopenedDialog = document.querySelector('[data-position-editor]')
    const reopenedName = [...(reopenedDialog?.querySelectorAll('label') ?? [])].find(label => label.textContent?.includes(translate('drilldown.displayName')))?.querySelector('input')
    expect(reopenedName?.value).not.toBe('Neuer Name')
    if (!reopenedName) throw new Error('Namensfeld fehlt')
    reopenedName.value = 'Neuer Name'
    reopenedName.dispatchEvent(new Event('input', { bubbles: true }))
    await flushPromises()
    const saveButton = [...(reopenedDialog?.querySelectorAll('button') ?? [])].find(button => button.textContent?.includes(translate('actions.save')))
    saveButton?.click()
    await flushPromises()
    expect(wrapper.emitted('update')?.length).toBe(1)
    expect(wrapper.emitted('update')?.[0]?.[1]).toMatchObject({ displayName: 'Neuer Name' })
    expect(wrapper.find('[data-position-section="portfolio"]').exists()).toBe(true)
    wrapper.unmount()
  })

  it('zeigt bei einer ISIN-only-Identität kein künstliches Symbol', async () => {
    const row = makeRow('bonds')
    if (!row.quote || !row.position.isin) throw new Error('Kurs und ISIN fehlen')
    row.quote.identity = { kind: 'isin_only', isin: row.position.isin }
    row.quote.symbol = row.position.isin
    const wrapper = mount(PositionDrilldown, { props: { row, total: 1000, links: [] } })

    await buttonWithText(wrapper, translate('drilldown.sectionAsset')).trigger('click')
    const labels = wrapper.findAll('[data-position-section="asset"] dt').map(label => label.text())
    expect(labels).toContain('ISIN')
    expect(labels).not.toContain(translate('table.symbol'))
    wrapper.unmount()
  })

  it('zeigt bei einem Listing das Symbol aus StockInfo statt eines alten Positionswerts', async () => {
    const row = makeRow()
    if (!row.quote) throw new Error('Kurs fehlt')
    row.position.symbol = 'ALT.DE'
    const wrapper = mount(PositionDrilldown, { props: { row, total: 1000, links: [] } })

    await buttonWithText(wrapper, translate('drilldown.sectionAsset')).trigger('click')
    const symbol = wrapper.findAll('[data-position-section="asset"] div').find(element => element.find('dt').exists() && element.find('dt').text() === translate('table.symbol'))
    expect(symbol?.find('dd').text()).toBe(row.quote.symbol)
    wrapper.unmount()
  })

  it('blendet für Cash den leeren Kursverlauf aus und hält Kursprobleme sichtbar', async () => {
    const cash = mount(PositionDrilldown, { props: { row: makeRow('cash'), total: 1000, links: [] } })
    expect(cash.findAll('button').some(button => button.text().includes(translate('drilldown.sectionHistory')))).toBe(false)
    cash.unmount()

    const missing = mount(PositionDrilldown, { props: { row: makeRow('stocks', false), total: 1000, links: [] } })
    expect(missing.text()).toContain(translate('currency.missingQuote'))
    await buttonWithText(missing, translate('drilldown.sectionHistory')).trigger('click')
    expect(missing.findComponent(PriceChart).exists()).toBe(false)
    missing.unmount()
  })

  it('macht alle vier Lesebereiche auch auf der Mobilkarte erreichbar', async () => {
    const row = makeRow()
    const wrapper = mount(PositionCard, { props: { row } })

    expect(wrapper.get('.poscard__title').text()).toBe(row.quote?.symbol)
    expect(wrapper.get('.poscard__title-row').text()).toContain(`| ${row.position.isin}`)
    await wrapper.get('.poscard__summary').trigger('click')
    expect(wrapper.find('[data-position-section="portfolio"]').exists()).toBe(true)
    expect(wrapper.get(`button[aria-label="${translate('drilldown.closeDetails')}"]`).attributes('aria-expanded')).toBe('true')
    await buttonWithText(wrapper, translate('drilldown.sectionAsset')).trigger('click')
    await flushPromises()
    expect(wrapper.find('[data-position-section="asset"]').exists()).toBe(true)
    await buttonWithText(wrapper, translate('drilldown.sectionDetails')).trigger('click')
    expect(wrapper.find('[data-position-section="details"]').exists()).toBe(true)
    await wrapper.get(`button[aria-label="${translate('drilldown.closeDetails')}"]`).trigger('click')
    expect(wrapper.find('[data-position-section="details"]').exists()).toBe(false)
    wrapper.unmount()
  })
})
