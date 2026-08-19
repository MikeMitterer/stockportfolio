/**
 * Unit-Tests für den Quotes-Store.
 * API-Client gemockt, IndexedDB über `fake-indexeddb`.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { deleteDB } from 'idb'
import { useQuotesStore } from '@/stores/quotes'
import { QuoteCacheRepository } from '@/db/repository'
import { closeDb, DB_NAME } from '@/db/schema'
import { ApiError } from '@/api/errors'
import type { StockInfoClient } from '@/api/client'
import type { QuoteResponse } from '@/api/types'
import type { Position } from '@/types/portfolio'

beforeEach(async () => {
  setActivePinia(createPinia())
  await closeDb()
  await deleteDB(DB_NAME)
})

afterEach(async () => {
  await closeDb()
})

function makeQuoteResponse(symbol: string, price: number, isin: string | null): QuoteResponse {
  return {
    isin,
    symbol,
    exchange: 'Xetra',
    name: `${symbol} Fonds`,
    type: 'etf',
    currency: 'EUR',
    price,
    quote_time: '2026-08-07T10:00:00+00:00',
    volume: null,
    ter: null,
    provider: null,
    replication: null,
    fund_size: null,
    volatility: null,
    accumulating: null,
    source: 'cache',
    cached: true,
    stale: false,
    fetched_at: '2026-08-07T10:00:00+00:00',
  }
}

function makePosition(overrides: Partial<Position> = {}): Position {
  return {
    id: 'p-1',
    isin: 'IE0000000001',
    symbol: 'AAA.DE',
    displayName: 'AAA',
    group: 'stocks',
    kind: 'etf',
    units: 10,
    targetPercent: 50,
    enabled: true,
    ...overrides,
  }
}

function mockClient(overrides: Partial<StockInfoClient> = {}): StockInfoClient {
  return {
    getQuoteByIsin: vi.fn(async (isin: string) => makeQuoteResponse('AAA.DE', 100, isin)),
    getQuoteBySymbol: vi.fn(async (symbol: string) => makeQuoteResponse(symbol, 200, null)),
    refreshByIsin: vi.fn(async (isin: string) => makeQuoteResponse('AAA.DE', 999, isin)),
    ...overrides,
  } as unknown as StockInfoClient
}

describe('useQuotesStore — loadQuotes', () => {
  it('lädt Kurse für alle aktiven Wertpapier-Positionen', async () => {
    const store = useQuotesStore()
    await store.loadQuotes(mockClient(), [
      makePosition({ id: 'a', isin: 'IE0000000001' }),
      makePosition({ id: 'b', isin: 'IE0000000002' }),
    ])

    expect(store.quotes.size).toBe(2)
    expect(store.quotes.get('IE0000000001')?.price).toBe(100)
  })

  it('überspringt Cash-Positionen', async () => {
    const client = mockClient()
    const store = useQuotesStore()

    await store.loadQuotes(client, [
      makePosition({ id: 'a' }),
      makePosition({ id: 'cash', isin: null, symbol: 'CASH', group: 'cash' }),
    ])

    expect(store.quotes.size).toBe(1)
    expect(client.getQuoteBySymbol).not.toHaveBeenCalled()
  })

  it('überspringt deaktivierte Positionen', async () => {
    const client = mockClient()
    const store = useQuotesStore()

    await store.loadQuotes(client, [
      makePosition({ id: 'a', isin: 'IE0000000001' }),
      makePosition({ id: 'b', isin: 'IE0000000002', enabled: false }),
    ])

    expect(store.quotes.size).toBe(1)
    expect(client.getQuoteByIsin).toHaveBeenCalledTimes(1)
  })

  it('nutzt getQuoteBySymbol für Positionen ohne ISIN', async () => {
    const client = mockClient()
    const store = useQuotesStore()

    await store.loadQuotes(client, [makePosition({ isin: null, symbol: 'NOISIN.DE' })])

    expect(client.getQuoteBySymbol).toHaveBeenCalledWith('NOISIN.DE')
    expect(store.quotes.get('NOISIN.DE')?.price).toBe(200)
  })

  it('ein fehlgeschlagener Kurs bricht die anderen nicht ab', async () => {
    const client = mockClient({
      getQuoteByIsin: vi.fn(async (isin: string) => {
        if (isin === 'BAD') throw new ApiError(404, 'Keine Auflösung für ISIN BAD', '/quote/BAD')
        return makeQuoteResponse('AAA.DE', 100, isin)
      }) as unknown as StockInfoClient['getQuoteByIsin'],
    })
    const store = useQuotesStore()

    await store.loadQuotes(client, [
      makePosition({ id: 'a', isin: 'IE0000000001' }),
      makePosition({ id: 'b', isin: 'BAD', symbol: 'BAD.DE' }),
      makePosition({ id: 'c', isin: 'IE0000000003' }),
    ])

    expect(store.quotes.size).toBe(2)
    expect(store.failures).toHaveLength(1)
    expect(store.failures[0]?.symbol).toBe('BAD.DE')
  })

  it('behält den alten Kurs und markiert ihn stale, wenn ein Refresh scheitert', async () => {
    let shouldFail = false
    const client = mockClient({
      getQuoteByIsin: vi.fn(async (isin: string) => {
        if (shouldFail) throw new ApiError(503, 'weg', '/quote')
        return makeQuoteResponse('AAA.DE', 100, isin)
      }) as unknown as StockInfoClient['getQuoteByIsin'],
    })
    const store = useQuotesStore()
    const position = makePosition()

    await store.loadQuotes(client, [position])
    expect(store.quotes.get('IE0000000001')?.stale).toBe(false)

    shouldFail = true
    await store.loadQuotes(client, [position])

    const entry = store.quotes.get('IE0000000001')
    expect(entry?.price).toBe(100)
    expect(entry?.stale).toBe(true)
    expect(store.failures).toHaveLength(1)
  })

  it('begrenzt die Parallelität auf 6 gleichzeitige Anfragen', async () => {
    let active = 0
    let peak = 0
    const client = mockClient({
      getQuoteByIsin: vi.fn(async (isin: string) => {
        active += 1
        peak = Math.max(peak, active)
        await new Promise((resolve) => setTimeout(resolve, 1))
        active -= 1
        return makeQuoteResponse('AAA.DE', 100, isin)
      }) as unknown as StockInfoClient['getQuoteByIsin'],
    })
    const store = useQuotesStore()

    const positions = Array.from({ length: 20 }, (_, index) =>
      makePosition({ id: `p-${index}`, isin: `ISIN${index}` }),
    )
    await store.loadQuotes(client, positions)

    expect(peak).toBeLessThanOrEqual(6)
    expect(client.getQuoteByIsin).toHaveBeenCalledTimes(20)
  })

  it('setzt loading während des Ladens und danach zurück', async () => {
    const store = useQuotesStore()
    expect(store.loading).toBe(false)

    const pending = store.loadQuotes(mockClient(), [makePosition()])
    expect(store.loading).toBe(true)

    await pending
    expect(store.loading).toBe(false)
  })

  it('leere Positionsliste führt zu leerem Cache ohne API-Aufruf', async () => {
    const client = mockClient()
    const store = useQuotesStore()

    await store.loadQuotes(client, [])

    expect(store.quotes.size).toBe(0)
    expect(client.getQuoteByIsin).not.toHaveBeenCalled()
  })
})

describe('useQuotesStore — Persistenz', () => {
  it('schreibt geladene Kurse nach IndexedDB', async () => {
    const store = useQuotesStore()
    await store.loadQuotes(mockClient(), [makePosition()])

    const persisted = await new QuoteCacheRepository().loadAll()

    expect(persisted.get('IE0000000001')?.price).toBe(100)
  })

  it('hydrate lädt den persistierten Cache zurück', async () => {
    const first = useQuotesStore()
    await first.loadQuotes(mockClient(), [makePosition()])

    setActivePinia(createPinia())
    const second = useQuotesStore()
    expect(second.quotes.size).toBe(0)

    await second.hydrate()

    expect(second.quotes.get('IE0000000001')?.price).toBe(100)
    expect(second.lastRefreshAt).not.toBeNull()
  })

  it('hydrate ohne gespeicherte Kurse ändert nichts', async () => {
    const store = useQuotesStore()
    await store.hydrate()

    expect(store.quotes.size).toBe(0)
    expect(store.lastRefreshAt).toBeNull()
  })
})

describe('useQuotesStore — refreshOne', () => {
  it('aktualisiert nur den Kurs der angegebenen Position', async () => {
    const client = mockClient()
    const store = useQuotesStore()
    const positionA = makePosition({ id: 'a', isin: 'IE0000000001' })

    await store.loadQuotes(client, [positionA, makePosition({ id: 'b', isin: 'IE0000000002' })])
    await store.refreshOne(client, positionA)

    expect(store.quotes.get('IE0000000001')?.price).toBe(999)
    expect(store.quotes.get('IE0000000002')?.price).toBe(100)
  })

  it('tut nichts bei Cash-Positionen', async () => {
    const client = mockClient()
    const store = useQuotesStore()

    await store.refreshOne(client, makePosition({ isin: null, symbol: 'CASH', group: 'cash' }))

    expect(client.refreshByIsin).not.toHaveBeenCalled()
  })

  it('vermerkt einen Fehlschlag in failures', async () => {
    const client = mockClient({
      refreshByIsin: vi.fn(async () => {
        throw new ApiError(503, 'Upstream weg', '/refresh')
      }) as unknown as StockInfoClient['refreshByIsin'],
    })
    const store = useQuotesStore()

    await store.refreshOne(client, makePosition({ symbol: 'AAA.DE' }))

    expect(store.failures).toHaveLength(1)
    expect(store.failures[0]?.reason).toBe('Upstream weg')
  })

  it('persistiert den aktualisierten Kurs', async () => {
    const client = mockClient()
    const store = useQuotesStore()
    const position = makePosition()

    await store.loadQuotes(client, [position])
    await store.refreshOne(client, position)

    const persisted = await new QuoteCacheRepository().loadAll()
    expect(persisted.get('IE0000000001')?.price).toBe(999)
  })

  /**
   * Der Ladezustand je Position — daran hängt der Spinner am Knopf im
   * Drilldown. Wichtig ist beides: dass er während des Abrufs steht und dass
   * er danach verschwindet, auch wenn der Abruf schiefgeht. Ein Knopf, der
   * nach einem Fehler ewig dreht, ist schlimmer als gar keine Anzeige.
   */
  it('merkt sich die Position, solange ihr Kurs geholt wird', async () => {
    const position = makePosition({ id: 'a' })
    let währendDesAbrufs: string[] = []

    const client = mockClient({
      refreshByIsin: vi.fn(async () => {
        währendDesAbrufs = [...useQuotesStore().refreshing]
        return makeQuoteResponse('AAA.DE', 999, 'IE0000000001')
      }) as unknown as StockInfoClient['refreshByIsin'],
    })
    const store = useQuotesStore()

    await store.refreshOne(client, position)

    expect(währendDesAbrufs).toEqual(['a'])
    expect([...store.refreshing]).toEqual([])
  })

  it('gibt die Position auch nach einem Fehlschlag wieder frei', async () => {
    const client = mockClient({
      refreshByIsin: vi.fn(async () => {
        throw new ApiError(503, 'Upstream weg', '/refresh')
      }) as unknown as StockInfoClient['refreshByIsin'],
    })
    const store = useQuotesStore()

    await store.refreshOne(client, makePosition({ id: 'a' }))

    expect([...store.refreshing]).toEqual([])
  })

  it('lässt Cash-Positionen gar nicht erst als ladend gelten', async () => {
    const client = mockClient()
    const store = useQuotesStore()

    await store.refreshOne(client, makePosition({ id: 'c', isin: null, group: 'cash' }))

    expect([...store.refreshing]).toEqual([])
  })
})
