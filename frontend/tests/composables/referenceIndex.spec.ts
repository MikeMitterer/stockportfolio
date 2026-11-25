/**
 * Referenzindex im Gesamtwert-Diagramm (T-143).
 *
 * Geprüft wird der ganze Weg mit festen Daten über ein injiziertes `fetch`:
 * Eingabe gegen Katalog und Kurs prüfen, Verlauf laden, im gezeigten
 * Zeitraum auf den Depotwert normieren. Dazu das Diagramm selbst — mit Index
 * eine benannte Linie, ohne Index das bisherige Bild, und ein Hinweis statt
 * einer falschen Linie.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/data/repository', () => import('../helpers/localRepositories'))
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { deleteDB } from 'idb'
import { computed, defineComponent } from 'vue'
import { StockInfoClient } from '@/api/stockinfo/client'
import type { InstrumentSummary } from '@/api/stockinfo/types'
import PortfolioValueChart from '@/components/PortfolioValueChart.vue'
import { resolveReferenceIndex, useReferenceIndex } from '@/composables/useReferenceIndex'
import { closeDb, DB_NAME } from '@/db/schema'
import { referenceLine, withinDays } from '@/domain/portfolioHistory'
import type { HistoryPoint } from '@/domain/sparkline'
import { useSettingsStore } from '@/stores/settings'
import type { ReferenceIndex } from '@/types/portfolio'
import instrumentsFixture from '../fixtures/stockinfo/instruments-200.json'
import quoteFixture from '../fixtures/stockinfo/quote-200.json'

const ISIN = 'IE00B4L5Y983'

/** ISO-Datum `offset` Tage vor heute. */
function daysAgo(offset: number): string {
  const today = new Date()
  const day = new Date(today.getFullYear(), today.getMonth(), today.getDate() - offset)
  return `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`
}

/** Tageswerte der letzten `count` Tage, beginnend bei `start`, je Tag um `step` steigend. */
function series(count: number, start: number, step: number): HistoryPoint[] {
  return Array.from({ length: count }, (_, index) => ({
    date: daysAgo(count - 1 - index),
    close: start + index * step,
  }))
}

/** Indexverlauf: 60 Tage, von 100 an je Tag um 1 steigend. */
const indexDaily = series(60, 100, 1).map((point) => ({ ...point, currency: 'EUR' }))

/** StockInfo mit festen Antworten; merkt sich die abgefragten Pfade. */
function fakeStockInfo(catalogue: unknown[] = instrumentsFixture.response.body) {
  const requested: string[] = []
  const fetchFn = vi.fn(async (input: RequestInfo | URL) => {
    const url = new URL(String(input))
    const path = `${url.pathname}${url.search}`
    requested.push(path)
    if (url.pathname === '/instruments') return Response.json(catalogue)
    if (url.pathname === `/quote/${ISIN}/daily`) return Response.json(indexDaily)
    if (url.pathname === `/quote/${ISIN}` || url.pathname === '/quote')
      return Response.json(quoteFixture.response.body)
    return Response.json({ detail: 'not found' }, { status: 404 })
  })
  return { client: new StockInfoClient('https://stockinfo.test', fetchFn), requested }
}

beforeEach(async () => {
  setActivePinia(createPinia())
  await closeDb()
  await deleteDB(DB_NAME)
  // jsdom kennt keinen ResizeObserver — das Diagramm misst damit seine Breite.
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe(): void {}
      disconnect(): void {}
    },
  )
})

afterEach(async () => {
  vi.unstubAllGlobals()
  await closeDb()
})

describe('Referenzindex festlegen', () => {
  it('übernimmt ein bekanntes Papier per ISIN mit Namen und Währung', async () => {
    const { client } = fakeStockInfo()
    const catalogue = await client.getInstruments()

    const result = await resolveReferenceIndex(client, catalogue, ' ie00b4l5y983 ')

    expect(result).toEqual({
      ok: true,
      value: {
        isin: ISIN,
        symbol: 'EUNL.DE',
        name: 'iShares Core MSCI World UCITS ETF',
        currency: 'EUR',
      },
    })
  })

  it('übernimmt es auch per Ticker, dann über das vollständige Symbol', async () => {
    const { client, requested } = fakeStockInfo()
    const catalogue = await client.getInstruments()

    const result = await resolveReferenceIndex(client, catalogue, 'eunl')

    expect(result).toMatchObject({ ok: true, value: { isin: null, symbol: 'EUNL.DE' } })
    expect(requested).toContain('/quote?symbol=EUNL.DE')
  })

  it('weist eine unbekannte Eingabe ab, ohne einen Kurs abzurufen', async () => {
    const { client, requested } = fakeStockInfo()
    const catalogue = await client.getInstruments()

    const result = await resolveReferenceIndex(client, catalogue, 'IE00BK5BQT80')

    expect(result).toEqual({ ok: false, reason: 'unknown', detail: 'IE00BK5BQT80' })
    expect(requested).toEqual(['/instruments'])
  })

  it('weist einen Ticker ab, der mehrere Listings trifft', async () => {
    const [xetra] = instrumentsFixture.response.body
    const amsterdam = {
      ...xetra,
      identity: { ...xetra!.identity, mic: 'XAMS' },
      symbol: 'EUNL.AS',
      listing_id: '018f3a2c-7b41-7c9e-a3d2-5f1b9c4e2a99',
    }
    const { client } = fakeStockInfo([xetra, amsterdam])
    const catalogue: InstrumentSummary[] = await client.getInstruments()

    const result = await resolveReferenceIndex(client, catalogue, 'EUNL')

    expect(result).toEqual({ ok: false, reason: 'ambiguous', detail: 'EUNL.DE, EUNL.AS' })
  })
})

describe('Referenzindex im Diagramm', () => {
  const selected: ReferenceIndex = {
    isin: ISIN,
    symbol: 'EUNL.DE',
    name: 'iShares Core MSCI World UCITS ETF',
    currency: 'EUR',
  }

  /** Bindet das Composable in eine Komponente ein — `useI18n` braucht deren Kontext. */
  function mountReference(client: StockInfoClient, baseCurrency = 'EUR') {
    const host = defineComponent({
      setup: () =>
        useReferenceIndex(
          client,
          computed(() => baseCurrency),
        ),
      render: () => null,
    })
    return mount(host).vm
  }

  it('normiert den geladenen Verlauf auf den ersten Tag des gezeigten Zeitraums', async () => {
    const { client, requested } = fakeStockInfo()
    useSettingsStore().settings.referenceIndex = selected
    const reference = mountReference(client)

    await reference.load()

    expect(requested).toEqual([`/quote/${ISIN}/daily?period=max`])
    expect(reference.note).toBeNull()

    // Depot 60 Tage lang von 10 000 an je Tag um 50 steigend; gezeigt der letzte Monat.
    const depot = withinDays(series(60, 10000, 50), 30, new Date())
    const line = referenceLine(depot, reference.reference!.points)

    // Erster gezeigter Tag ist 30 Tage zurück: Depot 10 000 + 29 · 50, Index 129.
    expect(line[0]).toEqual({ date: daysAgo(30), close: 11450 })
    expect(line.at(-1)!.date).toBe(daysAgo(0))
    // Index von 129 auf 159: dasselbe Verhältnis auf den Depotwert gerechnet.
    expect(line.at(-1)!.close).toBeCloseTo((11450 * 159) / 129, 6)
    expect(line).toHaveLength(depot.length)

    // Anderer Zeitraum, anderer Starttag: die Normierung wechselt mit.
    const week = referenceLine(
      withinDays(series(60, 10000, 50), 7, new Date()),
      reference.reference!.points,
    )
    expect(week[0]).toEqual({ date: daysAgo(7), close: 12600 })
  })

  it('zeigt einen Hinweis statt einer Linie, wenn der Index in anderer Währung notiert', async () => {
    const { client, requested } = fakeStockInfo()
    useSettingsStore().settings.referenceIndex = { ...selected, currency: 'USD' }
    const reference = mountReference(client)

    await reference.load()

    expect(requested).toEqual([])
    expect(reference.reference!.points).toEqual([])
    expect(reference.note).toContain('USD')
  })

  it('zeigt einen Hinweis, wenn StockInfo keinen Verlauf liefert', async () => {
    const { client } = fakeStockInfo()
    useSettingsStore().settings.referenceIndex = { ...selected, isin: 'IE00BK5BQT80' }
    const reference = mountReference(client)

    await reference.load()

    expect(reference.note).toContain(selected.name)
  })

  function chart(props: Record<string, unknown> = {}) {
    return mount(PortfolioValueChart, {
      props: {
        backtest: series(60, 900, 1),
        snapshots: series(10, 1000, 1),
        truthFrom: daysAgo(9),
        ...props,
      },
    })
  }

  it('zeichnet den Index als eigene, in der Legende benannte Linie', () => {
    const wrapper = chart({ reference: { name: 'FTSE All-World', points: series(60, 100, 1) } })

    expect(wrapper.find('.value-chart__line--reference').exists()).toBe(true)
    expect(wrapper.find('.value-chart__legend').text()).toContain('FTSE All-World')
  })

  it('sieht ohne Referenzindex aus wie bisher', () => {
    const wrapper = chart()

    expect(wrapper.find('.value-chart__line--reference').exists()).toBe(false)
    expect(wrapper.find('.value-chart__legend').exists()).toBe(false)
    expect(wrapper.find('.value-chart__note').exists()).toBe(false)
  })

  it('behält die Depotlinien und nennt den Grund, wenn keine Vergleichslinie möglich ist', () => {
    const wrapper = chart({
      reference: { name: 'FTSE All-World', points: [] },
      referenceNote: 'Kein Verlauf',
    })

    expect(wrapper.find('.value-chart__line--snapshot').exists()).toBe(true)
    expect(wrapper.find('.value-chart__line--reference').exists()).toBe(false)
    expect(wrapper.find('.value-chart__note').text()).toBe('Kein Verlauf')
    // Die Legende nennt nur, was zu sehen ist.
    expect(wrapper.find('.value-chart__legend').exists()).toBe(false)
  })

  it('nennt in der Legende keine Depotlinie, die aus einem einzigen Tageswert besteht', () => {
    const wrapper = chart({
      snapshots: series(1, 1000, 1),
      reference: { name: 'FTSE All-World', points: series(60, 100, 1) },
    })

    const legend = wrapper.find('.value-chart__legend').text()
    expect(legend).not.toContain('recorded')
    expect(legend).toContain('look back')
  })

  it('meldet einen Index, dessen Verlauf nicht in den gezeigten Zeitraum fällt', () => {
    const wrapper = chart({
      reference: { name: 'FTSE All-World', points: [{ date: '2001-01-02', close: 100 }] },
    })

    expect(wrapper.find('.value-chart__line--reference').exists()).toBe(false)
    expect(wrapper.find('.value-chart__note').text()).toContain('FTSE All-World')
  })
})
