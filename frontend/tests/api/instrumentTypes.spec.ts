import { describe, expect, it } from 'vitest'
import { StockInfoClient } from '@/api/client'
import complete from '../fixtures/stockinfo/instrument-types-200.json'
import empty from '../fixtures/stockinfo/instrument-types-200-empty.json'
import incomplete from '../fixtures/stockinfo/instrument-types-200-incomplete.json'

describe('REST-Typkatalog', () => {
  it.each([complete, empty, incomplete])('erhält vollständige, leere und unvollständige Kataloge', async fixture => {
    let requested = ''
    const client = new StockInfoClient('https://types.test', async input => {
      requested = String(input)
      return new Response(JSON.stringify({ ...fixture.response.body, additive: true }))
    })
    expect(await client.getInstrumentTypes()).toEqual(fixture.response.body)
    expect(requested).toBe('https://types.test/instrument-types')
  })

  it.each([
    { instrument_types: ['stock', 42], complete: true, sources: [] },
    { instrument_types: [''], complete: true, sources: [] },
    { instrument_types: [], complete: 'yes', sources: [] },
    { instrument_types: [], complete: true },
  ])('weist ungültige Kataloge zurück statt feste Typen einzusetzen', async body => {
    const client = new StockInfoClient('https://types.test', async () => new Response(JSON.stringify(body)))
    await expect(client.getInstrumentTypes()).rejects.toThrow()
  })
})
