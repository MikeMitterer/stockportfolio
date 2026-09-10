import { describe, expect, it } from 'vitest'
import { StockInfoClient } from '@/api/client'

const response = { base: 'USD', quote: 'EUR', rate: 0.8, quote_time: '2026-09-10T10:00:00Z', fetched_at: '2026-09-10T10:01:00Z', cached: true, stale: false }

describe('FX-Vertrag an der Clientgrenze', () => {
  it('fragt das gerichtete Paar ab und übernimmt optionale Herkunft', async () => {
    let requested = ''
    const client = new StockInfoClient('https://fx.test', async input => {
      requested = String(input)
      return new Response(JSON.stringify({ ...response, source: 'test-source' }))
    })
    expect(await client.getFx('USD', 'EUR')).toMatchObject({ base: 'USD', quote: 'EUR', rate: 0.8, source: 'test-source' })
    expect(requested).toBe('https://fx.test/fx?base=USD&quote=EUR')
  })

  it.each(['base', 'quote', 'rate', 'quote_time', 'fetched_at', 'cached', 'stale'])('verlangt das Pflichtfeld %s', async field => {
    const invalid: Record<string, unknown> = { ...response }
    delete invalid[field]
    const client = new StockInfoClient('https://fx.test', async () => new Response(JSON.stringify(invalid)))
    await expect(client.getFx('USD', 'EUR')).rejects.toThrow()
  })

  it.each([{ rate: 0 }, { rate: -1 }, { rate: '0.8' }, { rate: null }, { base: 'EUR', quote: 'USD' }, { base: 'GBp' }, { quote_time: '2026-09-10' }, { cached: false, stale: true }])('verwirft eine unbrauchbare Antwort %j', async changes => {
    const client = new StockInfoClient('https://fx.test', async () => new Response(JSON.stringify({ ...response, ...changes })))
    await expect(client.getFx('USD', 'EUR')).rejects.toThrow()
  })

  it('akzeptiert fehlende Herkunft und zusätzliche Angaben', async () => {
    const client = new StockInfoClient('https://fx.test', async () => new Response(JSON.stringify({ ...response, future: true })))
    expect(await client.getFx('USD', 'EUR')).toMatchObject({ rate: 0.8, source: null })
  })
})
