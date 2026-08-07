/**
 * Unit-Tests für src/api/client.ts.
 * Kein echtes Netzwerk — `fetch` wird injiziert.
 */

import { describe, expect, it, vi } from 'vitest'
import { StockInfoClient } from '@/api/client'
import { ApiError } from '@/api/errors'

/** Baut eine fetch-Attrappe, die eine JSON-Antwort liefert. */
function jsonFetch(body: unknown, status = 200): typeof globalThis.fetch {
  return vi.fn(async () =>
    new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    }),
  ) as unknown as typeof globalThis.fetch
}

describe('StockInfoClient — URL-Bildung', () => {
  it('entfernt trailing slashes aus der Base-URL', async () => {
    const spy = jsonFetch({ status: 'ok', version: '0.5.0' })
    const client = new StockInfoClient('https://example.test///', spy)

    await client.health()

    expect(spy).toHaveBeenCalledWith('https://example.test/health', expect.anything())
  })

  it('encodiert die ISIN im Pfad', async () => {
    const spy = jsonFetch({})
    const client = new StockInfoClient('https://example.test', spy)

    await client.getQuoteByIsin('IE00B3RBWM25')

    expect(spy).toHaveBeenCalledWith(
      'https://example.test/quote/IE00B3RBWM25',
      expect.anything(),
    )
  })

  it('übergibt das Symbol als Query-Parameter', async () => {
    const spy = jsonFetch({})
    const client = new StockInfoClient('https://example.test', spy)

    await client.getQuoteBySymbol('VGWL.DE')

    expect(spy).toHaveBeenCalledWith(
      'https://example.test/quote?symbol=VGWL.DE',
      expect.anything(),
    )
  })

  it('setzt den period-Parameter für die Tages-History', async () => {
    const spy = jsonFetch([])
    const client = new StockInfoClient('https://example.test', spy)

    await client.getDailyHistory('IE00B3RBWM25', '1y')

    expect(spy).toHaveBeenCalledWith(
      'https://example.test/quote/IE00B3RBWM25/daily?period=1y',
      expect.anything(),
    )
  })

  it('nutzt POST für refreshByIsin', async () => {
    const spy = jsonFetch({})
    const client = new StockInfoClient('https://example.test', spy)

    await client.refreshByIsin('IE00B3RBWM25')

    expect(spy).toHaveBeenCalledWith(
      'https://example.test/refresh/IE00B3RBWM25',
      expect.objectContaining({ method: 'POST' }),
    )
  })
})

describe('StockInfoClient — Fehlerbehandlung', () => {
  it('wirft ApiError mit detail-Feld bei HTTP 404', async () => {
    const fetchFn = jsonFetch({ detail: 'Keine Auflösung für ISIN XX0000000000' }, 404)
    const client = new StockInfoClient('https://example.test', fetchFn)

    const error = await client.getQuoteByIsin('XX0000000000').catch((e: unknown) => e)

    expect(error).toBeInstanceOf(ApiError)
    expect((error as ApiError).status).toBe(404)
    expect((error as ApiError).detail).toBe('Keine Auflösung für ISIN XX0000000000')
    expect((error as ApiError).isNotFound).toBe(true)
  })

  it('wirft ApiError mit status 0 bei Netzwerkfehler', async () => {
    const fetchFn = vi.fn(async () => {
      throw new TypeError('Failed to fetch')
    }) as unknown as typeof globalThis.fetch
    const client = new StockInfoClient('https://example.test', fetchFn)

    const error = await client.health().catch((e: unknown) => e)

    expect(error).toBeInstanceOf(ApiError)
    expect((error as ApiError).status).toBe(0)
    expect((error as ApiError).isNetworkError).toBe(true)
    expect((error as ApiError).detail).toBe('Failed to fetch')
  })

  it('fällt auf den Statustext zurück wenn der Fehler-Body kein JSON ist', async () => {
    const fetchFn = vi.fn(
      async () => new Response('<html>Bad Gateway</html>', { status: 502, statusText: 'Bad Gateway' }),
    ) as unknown as typeof globalThis.fetch
    const client = new StockInfoClient('https://example.test', fetchFn)

    const error = await client.health().catch((e: unknown) => e)

    expect((error as ApiError).status).toBe(502)
    expect((error as ApiError).detail).toBe('Bad Gateway')
  })

  it('nimmt die URL in den Fehler auf', async () => {
    const fetchFn = jsonFetch({ detail: 'nope' }, 500)
    const client = new StockInfoClient('https://example.test', fetchFn)

    const error = await client.getInstruments().catch((e: unknown) => e)

    expect((error as ApiError).url).toBe('https://example.test/instruments')
  })
})

describe('StockInfoClient — Erfolgsfall', () => {
  it('gibt den deserialisierten Body zurück', async () => {
    const payload = { status: 'ok', version: '0.5.0' }
    const client = new StockInfoClient('https://example.test', jsonFetch(payload))

    await expect(client.health()).resolves.toEqual(payload)
  })

  it('liefert Arrays für Listen-Endpunkte', async () => {
    const payload = [{ symbol: 'A.DE' }, { symbol: 'B.DE' }]
    const client = new StockInfoClient('https://example.test', jsonFetch(payload))

    await expect(client.getInstruments()).resolves.toHaveLength(2)
  })
})
