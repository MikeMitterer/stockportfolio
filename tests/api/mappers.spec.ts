/**
 * Unit-Tests für src/api/mappers.ts — die Grenze zwischen API und Domain.
 */

import { describe, expect, it } from 'vitest'
import { cacheKeyOf, instrumentToQuoteCacheEntry, toQuoteCacheEntry } from '@/api/mappers'
import type { InstrumentSummary, QuoteResponse } from '@/api/types'

/** Vollständige Antwort wie die API sie für einen ETF liefert. */
function fullQuote(overrides: Partial<QuoteResponse> = {}): QuoteResponse {
  return {
    isin: 'IE00B3RBWM25',
    symbol: 'VGWL.DE',
    exchange: 'Xetra',
    name: 'Vanguard FTSE All-World UCITS ETF',
    type: 'etf',
    currency: 'EUR',
    price: 162.92,
    quote_time: '2026-08-07T10:35:10+00:00',
    volume: 23597,
    ter: 0.14,
    provider: 'Vanguard',
    replication: 'Physical(Optimized sampling)',
    fund_size: 23318,
    volatility: 10.31,
    accumulating: false,
    source: 'cache',
    cached: true,
    stale: false,
    fetched_at: '2026-08-07T10:51:55.777289+00:00',
    ...overrides,
  }
}

/** Minimale Antwort — nur die laut Schema erforderlichen Felder sind gesetzt. */
function minimalQuote(): QuoteResponse {
  return {
    isin: null,
    symbol: 'XYZ.DE',
    exchange: null,
    name: null,
    type: null,
    currency: null,
    price: 42,
    quote_time: '2026-08-07T10:00:00+00:00',
    volume: null,
    ter: null,
    provider: null,
    replication: null,
    fund_size: null,
    volatility: null,
    accumulating: null,
    source: null,
    cached: false,
    stale: false,
    fetched_at: '2026-08-07T10:00:00+00:00',
  }
}

describe('toQuoteCacheEntry', () => {
  it('übernimmt alle relevanten Felder einer vollständigen Antwort', () => {
    const entry = toQuoteCacheEntry(fullQuote())

    expect(entry.isin).toBe('IE00B3RBWM25')
    expect(entry.symbol).toBe('VGWL.DE')
    expect(entry.price).toBe(162.92)
    expect(entry.currency).toBe('EUR')
    expect(entry.volatility).toBe(10.31)
    expect(entry.name).toBe('Vanguard FTSE All-World UCITS ETF')
    expect(entry.ter).toBe(0.14)
    expect(entry.accumulating).toBe(false)
    expect(entry.cached).toBe(true)
    expect(entry.stale).toBe(false)
  })

  it('mappt snake_case fetched_at auf camelCase fetchedAt', () => {
    const entry = toQuoteCacheEntry(fullQuote())
    expect(entry.fetchedAt).toBe('2026-08-07T10:51:55.777289+00:00')
  })

  it('fällt bei fehlender Währung auf EUR zurück', () => {
    const entry = toQuoteCacheEntry(minimalQuote())
    expect(entry.currency).toBe('EUR')
  })

  it('behält null-Felder als null (kein Default-Wert erfunden)', () => {
    const entry = toQuoteCacheEntry(minimalQuote())
    expect(entry.isin).toBeNull()
    expect(entry.volatility).toBeNull()
    expect(entry.name).toBeNull()
    expect(entry.ter).toBeNull()
    expect(entry.accumulating).toBeNull()
  })

  it('übernimmt das stale-Flag der API unverändert', () => {
    expect(toQuoteCacheEntry(fullQuote({ stale: true })).stale).toBe(true)
  })
})

describe('instrumentToQuoteCacheEntry', () => {
  function instrument(overrides: Partial<InstrumentSummary> = {}): InstrumentSummary {
    return {
      isin: 'DE000A0S9GB0',
      symbol: '4GLD.DE',
      exchange: 'Xetra',
      name: 'Xetra-Gold',
      type: 'stock',
      currency: 'EUR',
      provider: null,
      ter: null,
      replication: null,
      fund_size: null,
      volatility: 25.02,
      accumulating: null,
      meta_fetched_at: '2026-08-07T10:53:07.341113+00:00',
      latest_price: 120.5,
      latest_quote_time: '2026-08-07T10:37:29+00:00',
      latest_currency: 'EUR',
      latest_fetched_at: '2026-08-07T10:53:07.341113+00:00',
      history_count: 11,
      ...overrides,
    }
  }

  it('mappt ein Instrument mit Kurs auf einen Cache-Eintrag', () => {
    const entry = instrumentToQuoteCacheEntry(instrument())
    expect(entry?.price).toBe(120.5)
    expect(entry?.symbol).toBe('4GLD.DE')
    expect(entry?.volatility).toBe(25.02)
  })

  it('liefert null wenn das Instrument noch keinen Kurs hat', () => {
    expect(instrumentToQuoteCacheEntry(instrument({ latest_price: null }))).toBeNull()
  })

  it('bevorzugt latest_currency vor currency', () => {
    const entry = instrumentToQuoteCacheEntry(
      instrument({ currency: 'USD', latest_currency: 'EUR' }),
    )
    expect(entry?.currency).toBe('EUR')
  })

  it('fällt auf currency zurück wenn latest_currency fehlt', () => {
    const entry = instrumentToQuoteCacheEntry(
      instrument({ currency: 'USD', latest_currency: null }),
    )
    expect(entry?.currency).toBe('USD')
  })
})

describe('cacheKeyOf', () => {
  it('nimmt ISIN wenn vorhanden', () => {
    expect(cacheKeyOf({ isin: 'IE00B3RBWM25', symbol: 'VGWL.DE' })).toBe('IE00B3RBWM25')
  })

  it('fällt auf Symbol zurück', () => {
    expect(cacheKeyOf({ isin: null, symbol: 'VGWL.DE' })).toBe('VGWL.DE')
  })
})
