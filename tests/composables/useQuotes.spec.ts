/**
 * Unit-Tests für src/composables/useQuotes.ts.
 * Der API-Client wird gemockt — kein Netzwerk, kein Vue-Mounting nötig.
 */

import { describe, expect, it, vi } from 'vitest'
import { useQuotes } from '@/composables/useQuotes'
import { ApiError } from '@/api/errors'
import type { StockInfoClient } from '@/api/client'
import type { QuoteResponse } from '@/api/types'
import type { Position } from '@/types/portfolio'

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
    units: 10,
    targetPercent: 50,
    enabled: true,
    ...overrides,
  }
}

/** Minimaler Client-Mock — nur die von useQuotes genutzten Methoden. */
function mockClient(overrides: Partial<StockInfoClient> = {}): StockInfoClient {
  return {
    getQuoteByIsin: vi.fn(async (isin: string) =>
      makeQuoteResponse('AAA.DE', 100, isin),
    ),
    getQuoteBySymbol: vi.fn(async (symbol: string) => makeQuoteResponse(symbol, 200, null)),
    refreshByIsin: vi.fn(async (isin: string) => makeQuoteResponse('AAA.DE', 999, isin)),
    ...overrides,
  } as unknown as StockInfoClient
}

describe('useQuotes — loadQuotes', () => {
  it('lädt Kurse für alle aktiven Wertpapier-Positionen', async () => {
    const client = mockClient()
    const { quotes, loadQuotes } = useQuotes(client)

    await loadQuotes([
      makePosition({ id: 'a', isin: 'IE0000000001' }),
      makePosition({ id: 'b', isin: 'IE0000000002' }),
    ])

    expect(quotes.value.size).toBe(2)
    expect(quotes.value.get('IE0000000001')?.price).toBe(100)
  })

  it('überspringt Cash-Positionen (kein Kurs nötig)', async () => {
    const client = mockClient()
    const { quotes, loadQuotes } = useQuotes(client)

    await loadQuotes([
      makePosition({ id: 'a', isin: 'IE0000000001' }),
      makePosition({ id: 'cash', isin: null, symbol: 'CASH', group: 'cash' }),
    ])

    expect(quotes.value.size).toBe(1)
    expect(client.getQuoteBySymbol).not.toHaveBeenCalled()
  })

  it('überspringt deaktivierte Positionen', async () => {
    const client = mockClient()
    const { quotes, loadQuotes } = useQuotes(client)

    await loadQuotes([
      makePosition({ id: 'a', isin: 'IE0000000001' }),
      makePosition({ id: 'b', isin: 'IE0000000002', enabled: false }),
    ])

    expect(quotes.value.size).toBe(1)
    expect(client.getQuoteByIsin).toHaveBeenCalledTimes(1)
  })

  it('nutzt getQuoteBySymbol für Positionen ohne ISIN', async () => {
    const client = mockClient()
    const { quotes, loadQuotes } = useQuotes(client)

    await loadQuotes([makePosition({ isin: null, symbol: 'NOISIN.DE' })])

    expect(client.getQuoteBySymbol).toHaveBeenCalledWith('NOISIN.DE')
    expect(quotes.value.get('NOISIN.DE')?.price).toBe(200)
  })

  it('ein fehlgeschlagener Kurs bricht die anderen nicht ab', async () => {
    const client = mockClient({
      getQuoteByIsin: vi.fn(async (isin: string) => {
        if (isin === 'BAD') {
          throw new ApiError(404, 'Keine Auflösung für ISIN BAD', '/quote/BAD')
        }
        return makeQuoteResponse('AAA.DE', 100, isin)
      }) as unknown as StockInfoClient['getQuoteByIsin'],
    })
    const { quotes, failures, loadQuotes } = useQuotes(client)

    await loadQuotes([
      makePosition({ id: 'a', isin: 'IE0000000001' }),
      makePosition({ id: 'b', isin: 'BAD', symbol: 'BAD.DE' }),
      makePosition({ id: 'c', isin: 'IE0000000003' }),
    ])

    expect(quotes.value.size).toBe(2)
    expect(failures.value).toHaveLength(1)
    expect(failures.value[0]?.symbol).toBe('BAD.DE')
    expect(failures.value[0]?.reason).toBe('Keine Auflösung für ISIN BAD')
  })

  it('setzt lastRefreshAt nach erfolgreichem Laden', async () => {
    const { lastRefreshAt, loadQuotes } = useQuotes(mockClient())
    expect(lastRefreshAt.value).toBeNull()

    await loadQuotes([makePosition()])

    expect(lastRefreshAt.value).not.toBeNull()
  })

  it('setzt loading während des Ladens und danach zurück', async () => {
    const { loading, loadQuotes } = useQuotes(mockClient())
    expect(loading.value).toBe(false)

    const pending = loadQuotes([makePosition()])
    expect(loading.value).toBe(true)

    await pending
    expect(loading.value).toBe(false)
  })

  it('leert alte Fehler bei einem neuen Ladevorgang', async () => {
    let shouldFail = true
    const client = mockClient({
      getQuoteByIsin: vi.fn(async (isin: string) => {
        if (shouldFail) throw new ApiError(500, 'kaputt', '/quote')
        return makeQuoteResponse('AAA.DE', 100, isin)
      }) as unknown as StockInfoClient['getQuoteByIsin'],
    })
    const { failures, loadQuotes } = useQuotes(client)

    await loadQuotes([makePosition()])
    expect(failures.value).toHaveLength(1)

    shouldFail = false
    await loadQuotes([makePosition()])
    expect(failures.value).toHaveLength(0)
  })

  it('leere Positionsliste führt zu leerem Cache ohne API-Aufruf', async () => {
    const client = mockClient()
    const { quotes, loadQuotes } = useQuotes(client)

    await loadQuotes([])

    expect(quotes.value.size).toBe(0)
    expect(client.getQuoteByIsin).not.toHaveBeenCalled()
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
    const { loadQuotes } = useQuotes(client)

    const positions = Array.from({ length: 20 }, (_, index) =>
      makePosition({ id: `p-${index}`, isin: `ISIN${index}` }),
    )
    await loadQuotes(positions)

    expect(peak).toBeLessThanOrEqual(6)
    expect(client.getQuoteByIsin).toHaveBeenCalledTimes(20)
  })
})

describe('useQuotes — refreshOne', () => {
  it('aktualisiert nur den Kurs der angegebenen Position', async () => {
    const client = mockClient()
    const { quotes, loadQuotes, refreshOne } = useQuotes(client)

    const positionA = makePosition({ id: 'a', isin: 'IE0000000001' })
    await loadQuotes([positionA, makePosition({ id: 'b', isin: 'IE0000000002' })])
    expect(quotes.value.get('IE0000000001')?.price).toBe(100)

    await refreshOne(positionA)

    expect(quotes.value.get('IE0000000001')?.price).toBe(999)
    expect(quotes.value.get('IE0000000002')?.price).toBe(100)
  })

  it('tut nichts bei Cash-Positionen', async () => {
    const client = mockClient()
    const { refreshOne } = useQuotes(client)

    await refreshOne(makePosition({ isin: null, symbol: 'CASH', group: 'cash' }))

    expect(client.refreshByIsin).not.toHaveBeenCalled()
    expect(client.getQuoteBySymbol).not.toHaveBeenCalled()
  })

  it('vermerkt einen Fehlschlag in failures', async () => {
    const client = mockClient({
      refreshByIsin: vi.fn(async () => {
        throw new ApiError(503, 'Upstream weg', '/refresh')
      }) as unknown as StockInfoClient['refreshByIsin'],
    })
    const { failures, refreshOne } = useQuotes(client)

    await refreshOne(makePosition({ symbol: 'AAA.DE' }))

    expect(failures.value).toHaveLength(1)
    expect(failures.value[0]?.reason).toBe('Upstream weg')
  })

  it('entfernt einen alten Fehler wenn der Refresh gelingt', async () => {
    let shouldFail = true
    const client = mockClient({
      getQuoteByIsin: vi.fn(async () => {
        throw new ApiError(500, 'kaputt', '/quote')
      }) as unknown as StockInfoClient['getQuoteByIsin'],
      refreshByIsin: vi.fn(async (isin: string) => {
        if (shouldFail) throw new ApiError(500, 'immer noch kaputt', '/refresh')
        return makeQuoteResponse('AAA.DE', 500, isin)
      }) as unknown as StockInfoClient['refreshByIsin'],
    })
    const { failures, loadQuotes, refreshOne } = useQuotes(client)

    const position = makePosition()
    await loadQuotes([position])
    expect(failures.value).toHaveLength(1)

    shouldFail = false
    await refreshOne(position)

    expect(failures.value).toHaveLength(0)
  })
})
