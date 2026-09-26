import { beforeEach, describe, expect, it } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import PositionDrilldown from '@/components/PositionDrilldown.vue'
import { useFieldsStore } from '@/stores/fields'
import PositionCard from '@/components/PositionCard.vue'
import PriceChart from '@/components/PriceChart.vue'
import { STOCK_INFO_CLIENT, StockInfoClient } from '@/api/client'
import { toQuoteCacheEntry } from '@/api/mappers'
import { normalizeQuote } from '@/api/normalizers'
import { computeRebalancing, type PositionResult } from '@/domain/rebalancing'
import { defaultSettings } from '@/stores/settings'
import { translate } from '@/i18n'
import type { AssetGroup, Portfolio } from '@/types/portfolio'
import catalogFixture from '../fixtures/stockinfo/detail-catalog.json'
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
  it('zeigt Notizen unter der Button-Leiste als Text und entfernt leere Notizen', async () => {
    const row = makeRow()
    row.position.notes = 'Langfristig halten\n<img src=x onerror=alert(1)>'
    const wrapper = mount(PositionDrilldown, { props: { row, total: 1000, links: [] } })
    const note = wrapper.get('[data-position-note]')
    expect(note.text()).toBe(row.position.notes)
    expect(note.find('img').exists()).toBe(false)
    expect(wrapper.get('.position-details__top').element.nextElementSibling).toBe(note.element)
    await wrapper.setProps({ row: { ...row, position: { ...row.position, notes: '  ' } } })
    expect(wrapper.find('[data-position-note]').exists()).toBe(false)
    wrapper.unmount()
  })

  it('versteckt leere Zusatzinfos und wählt beim Wegfall eines Tabs den Kursverlauf', async () => {
    const row = makeRow()
    if (!row.quote) throw new Error('Kurs fehlt')
    row.position.kind = null
    row.quote = { ...row.quote, type: null, details: {}, ter: 0, volatility: null }
    const wrapper = mount(PositionDrilldown, { props: { row, total: 1000, links: [] } })
    await buttonWithText(wrapper, translate('drilldown.sectionAsset')).trigger('click')
    expect(wrapper.text()).toContain('0,0 %')
    await wrapper.setProps({ row: { ...row, quote: { ...row.quote, ter: null } } })
    expect(wrapper.findAll('button').some(button => button.text() === translate('drilldown.sectionAsset'))).toBe(false)
    expect(wrapper.find('[data-position-section="history"]').exists()).toBe(true)
    useFieldsStore().error = 'Katalog nicht erreichbar'
    await flushPromises()
    await buttonWithText(wrapper, translate('drilldown.sectionAsset')).trigger('click')
    expect(wrapper.text()).toContain('Katalog nicht erreichbar')
    wrapper.unmount()
  })

  it('lädt den Katalog ohne Tab-Klick und erhält Nein als einzigen Zusatzwert', async () => {
    const row = makeRow()
    if (!row.quote) throw new Error('Kurs fehlt')
    row.quote = { ...row.quote, ter: null, volatility: null, details: {
      'risk-a.flag': { value: false, unit: null, currency: null, origin: null, source: null,
        asOf: null, shadowed: false, manualValue: null, manualCurrency: null },
    } }
    let finishCatalog: ((response: Response) => void) | undefined
    const client = new StockInfoClient('https://details.test', async input => {
      if (String(input).endsWith('/fields')) return new Promise<Response>(resolve => { finishCatalog = resolve })
      return new Response('[]')
    })
    const wrapper = mount(PositionDrilldown, {
      props: { row, total: 1000, links: [] }, global: { provide: { [STOCK_INFO_CLIENT]: client } },
    })
    expect(finishCatalog).toBeDefined()
    await buttonWithText(wrapper, translate('drilldown.sectionAsset')).trigger('click')
    expect(useFieldsStore().loading).toBe(true)
    finishCatalog?.(new Response(JSON.stringify(catalogFixture)))
    await flushPromises()
    expect(wrapper.get('[data-detail-field="risk-a.flag"]').text()).toContain(translate('detailFields.no'))
    await wrapper.setProps({ visibleStockInfoFields: ['risk-a.flag'] })
    expect(wrapper.find('[data-detail-field="risk-a.flag"]').exists()).toBe(false)
    expect(wrapper.find('[data-position-section="asset"]').exists()).toBe(true)
    wrapper.unmount()
  })

  it('wechselt den Bereich über die kompakte Auswahl', async () => {
    const wrapper = mount(PositionDrilldown, { props: { row: makeRow(), total: 1000, links: [] } })
    const trigger = wrapper.get('.position-details__selection button')
    await trigger.trigger('click')
    await flushPromises()
    expect(trigger.attributes('aria-expanded')).toBe('true')
    const option = [...document.querySelectorAll('.n-dropdown-option-body')].find(element => element.textContent === translate('drilldown.sectionPortfolio'))
    if (!(option instanceof HTMLElement)) throw new Error('Bewertung fehlt in der Bereichsauswahl')
    option.click()
    await flushPromises()
    expect(wrapper.find('[data-position-section="portfolio"]').exists()).toBe(true)
    expect(trigger.text()).toBe(translate('drilldown.sectionPortfolio'))
    expect(trigger.attributes('aria-expanded')).toBe('false')
    wrapper.unmount()
  })

  it('zeigt zuerst den Kursverlauf und wechselt gemeinsam zwischen gültigen Bereichen', async () => {
    const wrapper = mount(PositionDrilldown, { props: { row: makeRow(), total: 1000, links: [] } })

    expect(wrapper.find('.position-details__tabs button').text()).toBe(translate('drilldown.sectionHistory'))
    expect(wrapper.findComponent(PriceChart).exists()).toBe(true)
    await buttonWithText(wrapper, translate('drilldown.sectionPortfolio')).trigger('click')
    expect(wrapper.find('[data-position-section="portfolio"]').exists()).toBe(true)

    await buttonWithText(wrapper, translate('drilldown.sectionAsset')).trigger('click')
    expect(wrapper.findComponent(PriceChart).exists()).toBe(false)
    expect(wrapper.find('[data-position-section="asset"]').exists()).toBe(true)
    expect(wrapper.findAll('.position-details__tabs button').map(button => button.text())).toEqual([
      translate('drilldown.sectionHistory'), translate('drilldown.sectionPortfolio'), translate('drilldown.sectionAsset'),
    ])
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
    expect(wrapper.find('[data-position-section="history"]').exists()).toBe(true)
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
    expect(labels).not.toContain('ISIN')
    expect(labels).not.toContain(translate('table.symbol'))
    wrapper.unmount()
  })

  it('wiederholt bei einem Listing weder Symbol noch Kursstand aus der Hauptansicht', async () => {
    const row = makeRow()
    if (!row.quote) throw new Error('Kurs fehlt')
    row.position.symbol = 'ALT.DE'
    const wrapper = mount(PositionDrilldown, { props: { row, total: 1000, links: [] } })

    await buttonWithText(wrapper, translate('drilldown.sectionAsset')).trigger('click')
    const symbol = wrapper.findAll('[data-position-section="asset"] div').find(element => element.find('dt').exists() && element.find('dt').text() === translate('table.symbol'))
    expect(symbol).toBeUndefined()
    expect(wrapper.findAll('[data-position-section="asset"] dt').map(label => label.text())).not.toContain(translate('dashboard.quoteAge'))
    wrapper.unmount()
  })

  it('blendet für Cash den leeren Kursverlauf aus und hält Kursprobleme sichtbar', async () => {
    const cash = mount(PositionDrilldown, { props: { row: makeRow('cash'), total: 1000, links: [] } })
    expect(cash.findAll('button').some(button => button.text().includes(translate('drilldown.sectionHistory')))).toBe(false)
    expect(cash.findAll('.position-details__tabs button').map(button => button.text())).toEqual([translate('drilldown.sectionPortfolio')])
    cash.unmount()

    const missing = mount(PositionDrilldown, { props: { row: makeRow('stocks', false), total: 1000, links: [] } })
    expect(missing.text()).toContain(translate('currency.missingQuote'))
    await buttonWithText(missing, translate('drilldown.sectionHistory')).trigger('click')
    expect(missing.findComponent(PriceChart).exists()).toBe(false)
    missing.unmount()
  })

  it('zeigt mobil die drei Bereiche und ergänzt den dort fehlenden Kursstand', async () => {
    const row = makeRow()
    row.position.notes = 'Mobile Notiz'
    const wrapper = mount(PositionCard, { props: { row } })

    expect(wrapper.get('.poscard__title').text()).toBe(row.quote?.symbol)
    expect(wrapper.get('.poscard__title-row').text()).toContain(`| ${row.position.isin}`)
    await wrapper.get('.poscard__summary').trigger('click')
    expect(wrapper.find('[data-position-section="history"]').exists()).toBe(true)
    expect(wrapper.get('[data-position-note]').text()).toBe('Mobile Notiz')
    expect(wrapper.get(`button[aria-label="${translate('drilldown.closeDetails')}"]`).attributes('aria-expanded')).toBe('true')
    await buttonWithText(wrapper, translate('drilldown.sectionAsset')).trigger('click')
    await flushPromises()
    expect(wrapper.find('[data-position-section="asset"]').exists()).toBe(true)
    expect(wrapper.find('[data-position-section="asset"]').text()).toContain(translate('dashboard.quoteAge'))
    await wrapper.get(`button[aria-label="${translate('drilldown.closeDetails')}"]`).trigger('click')
    expect(wrapper.find('[data-position-section="asset"]').exists()).toBe(false)
    wrapper.unmount()
  })
})
