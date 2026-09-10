import { describe, expect, it } from 'vitest'
import { StockInfoClient } from '@/api/client'
import { instrumentToQuoteCacheEntry, toQuoteCacheEntry, toFieldCatalog } from '@/api/mappers'
import quoteFixture from '../fixtures/stockinfo/quote-200.json'
import instrumentFixture from '../fixtures/stockinfo/instruments-200.json'
import catalog from '../fixtures/stockinfo/detail-catalog.json'
import values from '../fixtures/stockinfo/detail-values.json'

const quote = quoteFixture.response.body

function clientFor(body: unknown): StockInfoClient {
  return new StockInfoClient('https://details.test', async () => new Response(JSON.stringify(body)))
}

describe('Offener Detailvertrag an der bestehenden API-Grenze', () => {
  it.each(['getQuoteByIsin', 'getQuoteBySymbol', 'refreshByIsin', 'refreshBySymbol'] as const)(
    'erhält Werte und Herkunft bei %s', async method => {
      const response = await clientFor({ ...quote, details: values })[method](quote.symbol)
      expect(response.details).toEqual(values)
      const cached = toQuoteCacheEntry(response)
      expect(cached.details?.['risk-a.score']).toMatchObject({ value: 0, manualValue: 7, shadowed: true, asOf: '2026-09-10T08:00:00Z' })
      expect(cached.details?.['risk-a.flag']?.value).toBe(false)
      expect(cached.details?.['risk-b.score']?.value).toBeNull()
      expect(cached.details?.['risk-a.amount']?.currency).toBe('USD')
    },
  )

  it('erhält dieselben Details im Katalogmapper', async () => {
    const [instrument] = await clientFor([{ ...instrumentFixture.response.body[0], details: values }]).getInstruments()
    expect(instrumentToQuoteCacheEntry(instrument!)?.details?.['risk-a.score']?.manualValue).toBe(7)
  })

  it('unterscheidet einen fehlenden Detailblock von einer geladenen leeren Map', async () => {
    expect(toQuoteCacheEntry(await clientFor(quote).getQuoteBySymbol(quote.symbol)).details).toBeNull()
    expect(toQuoteCacheEntry(await clientFor({ ...quote, details: {} }).getQuoteBySymbol(quote.symbol)).details).toEqual({})
  })

  it('lässt unbekannte Namen zu und verwirft ungültige Zusatzwerte ohne den Core zu verwerfen', async () => {
    const response = await clientFor({ ...quote, details: {
      ...values, 'unknown.score': { value: 5 }, 'bad.object': { value: { unsafe: 1 } }, 'bad.array': [],
    } }).getQuoteBySymbol(quote.symbol)
    expect(response.price).toBe(quote.price)
    expect(response.details?.['unknown.score']?.value).toBe(5)
    expect(response.details?.['bad.object']).toBeUndefined()
    expect(response.details?.['bad.array']).toBeUndefined()
  })

  it('liest den Feldkatalog samt Versionen und mappt Labels, Einheit und Anwendbarkeit', async () => {
    let requested = ''
    const client = new StockInfoClient('https://details.test', async input => {
      requested = String(input)
      return new Response(JSON.stringify(catalog))
    })
    const response = await client.getFields()
    expect(requested).toBe('https://details.test/fields')
    const result = toFieldCatalog(response)
    expect(result).toMatchObject({ generationId: catalog.generation_id, coreVersion: '4.3.0', detailsVersion: 1 })
    expect(result.definitions[0]).toMatchObject({ name: 'risk-a.score', kind: 'number', labelDe: 'Risikoscore', unit: 'percent', scopes: [{ source: 'risk-a', instrumentTypes: ['etf', 'stock'], identityKinds: ['listed'] }] })
  })

  it.each(['generation_id', 'core_version', 'details_version', 'details'])('weist fehlendes Katalogfeld %s ab', async field => {
    const body: Record<string, unknown> = { ...catalog }
    delete body[field]
    await expect(clientFor(body).getFields()).rejects.toMatchObject({ detail: expect.stringContaining(field) })
  })

  it('ignoriert nicht unterstützte Definitionen ohne eine falsche Betragsdarstellung zu erlauben', async () => {
    const definition = catalog.details[0]!
    const response = await clientFor({ ...catalog, details: [
      ...catalog.details,
      { ...definition, name: 'future.field', kind: 'object' },
      { ...definition, name: 'bad.currency', currency_required: 'true' },
      { ...definition, name: 'bad.unit', unit: {} },
    ] }).getFields()
    expect(response.details).toHaveLength(catalog.details.length)
  })
})
