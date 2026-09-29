import { describe, expect, it } from 'vitest'
import { StockInfoClient } from '@/api/client'
import { ApiError } from '@/api/errors'
import { translate } from '@/i18n'
import { cacheKeyOf, instrumentToQuoteCacheEntry, toQuoteCacheEntry } from '@/api/mappers'
import quoteFixture from '../fixtures/stockinfo/quote-200.json'
import catalogFixture from '../fixtures/stockinfo/instruments-200.json'

const quote = quoteFixture.response.body
const instrument = catalogFixture.response.body[0]!

function clientFor(body: unknown, status = 200): StockInfoClient {
  return new StockInfoClient('https://contract.test', async () =>
    new Response(JSON.stringify(body), { status }),
  )
}

const identities = [
  { identity: quote.identity, isin: quote.identity.isin },
  { identity: { kind: 'listed', ticker: 'EUNL', mic: 'XETR' }, isin: null },
  { identity: { kind: 'pair', base: 'BTC', quote_currency: 'EUR' }, isin: null },
  { identity: { kind: 'isin_only', isin: 'DE000TEST001' }, isin: 'DE000TEST001' },
]

describe('StockInfo — gemeinsame Vertragsgrenze', () => {
  it.each(identities)('normalisiert $identity für alle vier Kurswege', async ({ identity, isin }) => {
    const payload = { ...quote, identity, isin: 'FALSCHES-OBERFELD' }
    const client = clientFor(payload)
    const responses = await Promise.all([
      client.getQuoteByIsin(isin ?? 'DE000TEST001'),
      client.getQuoteBySymbol(quote.symbol),
      client.refreshByIsin(isin ?? 'DE000TEST001'),
      client.refreshBySymbol(quote.symbol),
    ])
    for (const response of responses) {
      const cached = toQuoteCacheEntry(response)
      expect(cached.isin).toBe(isin)
      expect(cached.identity).toEqual(identity)
      expect(cacheKeyOf(cached)).toBe(isin ?? quote.symbol)
    }
  })

  it.each(identities)('normalisiert $identity vor Übergabe des Katalogs an Verbraucher', async ({ identity, isin }) => {
    const [entry] = await clientFor([{ ...instrument, identity }]).getInstruments()
    expect(entry?.isin).toBe(isin)
    expect(entry?.identity).toEqual(identity)
    expect(entry?.listing_id).toBe(instrument.listing_id)
    expect(cacheKeyOf(entry!)).toBe(isin ?? instrument.symbol)
    expect(instrumentToQuoteCacheEntry(entry!)?.identity).toEqual(identity)
  })

  it.each(['identity', 'symbol', 'name', 'type', 'price', 'currency', 'quote_time', 'fetched_at', 'cached', 'stale'])(
    'weist Quote ohne Pflichtfeld %s ab', async (field) => {
      const payload: Record<string, unknown> = { ...quote }
      delete payload[field]
      await expect(clientFor(payload).getQuoteBySymbol(quote.symbol)).rejects.toMatchObject({
        status: 200, detail: expect.stringContaining(field),
      })
    },
  )

  it.each([null, '', 'eur', 'EURO', 'EUR ', 'ZZZ', 42])('rät keine Kurswährung für %s', async (currency) => {
    await expect(clientFor({ ...quote, currency }).refreshBySymbol(quote.symbol)).rejects.toBeInstanceOf(ApiError)
  })

  it.each([null, '', 'eur', 'ZZZ'])('ersetzt fehlende Katalog-Kurswährung %s nicht durch Instrumentwährung', async (latest_currency) => {
    await expect(clientFor([{ ...instrument, currency: 'USD', latest_currency }]).getInstruments())
      .rejects.toMatchObject({ detail: expect.stringContaining('latest_currency') })
  })

  it.each(['identity', 'symbol', 'listing_id', 'name', 'type', 'history_count', 'manual_fields', 'shadowed_fields'])(
    'weist Katalog ohne Pflichtfeld %s ab', async (field) => {
      const payload: Record<string, unknown> = { ...instrument }
      delete payload[field]
      await expect(clientFor([payload]).getInstruments()).rejects.toBeInstanceOf(ApiError)
    },
  )

  it('erhält Pence exakt und akzeptiert offene Instrumenttypen sowie additive Felder', async () => {
    const response = await clientFor({ ...quote, currency: 'GBp', type: 'future-type', extra: 7 }).getQuoteBySymbol(quote.symbol)
    expect(toQuoteCacheEntry(response)).toMatchObject({ currency: 'GBp', type: 'future-type' })
  })

  it('akzeptiert einen Katalogeintrag ohne vorhandenen Kurs', async () => {
    const [entry] = await clientFor([{ ...instrument, latest_price: null, latest_currency: null }]).getInstruments()
    expect(entry?.isin).toBe(instrument.identity.isin)
    expect(instrumentToQuoteCacheEntry(entry!)).toBeNull()
  })

  it.each([
    { identity: { kind: 'future-kind' } },
    { identity: { kind: 'listed', ticker: 'X' } },
    { identity: { kind: 'pair', base: 'BTC' } },
    { identity: { kind: 'isin_only', isin: '' } },
    { price: '128.7' },
    { price: null },
    { quote_time: 'gestern' },
    { fetched_at: '2026-08-21T12:00:00' },
    { cached: 'false' },
    { stale: true, cached: false },
  ])('weist ungültige Kernwerte %j ab', async (changes) => {
    await expect(clientFor({ ...quote, ...changes }).getQuoteBySymbol(quote.symbol)).rejects.toBeInstanceOf(ApiError)
  })

  it('erhält eine mehrdeutige Symbolantwort als 409 mit Fehlercode', async () => {
    await expect(clientFor({ code: 'ambiguous_symbol', params: { symbol: 'EUNL' } }, 409).getQuoteBySymbol('EUNL'))
      .rejects.toMatchObject({ status: 409, detail: expect.stringContaining('ambiguous_symbol') })
  })

  it('erklärt StockInfos echten Mehrdeutigkeitscode verständlich', async () => {
    await expect(clientFor({ code: 'symbol_ambiguous', params: { symbol: 'DUAL' } }, 409).getQuoteBySymbol('DUAL'))
      .rejects.toMatchObject({ status: 409, detail: translate('errors.ambiguousSymbol', { symbol: 'DUAL' }) })
  })
})
