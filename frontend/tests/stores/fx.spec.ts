import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { StockInfoClient } from '@/api/client'
import { useFxStore } from '@/stores/fx'

const response = { base: 'USD', quote: 'EUR', rate: 0.8, quote_time: '2026-09-10T10:00:00Z', fetched_at: '2026-09-10T10:01:00Z', cached: true, stale: false }
beforeEach(() => setActivePinia(createPinia()))

describe('Devisenkurse in der Sitzung', () => {
  it('fasst gleichzeitige Anfragen zusammen und lädt bei Wiederholung neu', async () => {
    let calls = 0
    const client = new StockInfoClient('https://fx.test', async () => { calls++; return new Response(JSON.stringify(response)) })
    const store = useFxStore()
    await Promise.all([store.load(client, 'USD', 'EUR'), store.load(client, 'USD', 'EUR')])
    expect(calls).toBe(1)
    expect(store.rates.get('USD/EUR')?.quoteTime).toBe(response.quote_time)
    await store.load(client, 'USD', 'EUR')
    expect(calls).toBe(2)
    await store.load(client, 'EUR', 'EUR')
    expect(calls).toBe(2)
  })

  it('verwendet nach Fehler nur einen vorher gültigen Wert und markiert ihn veraltet', async () => {
    let failed = false
    const client = new StockInfoClient('https://fx.test', async () => failed ? new Response('{}', { status: 502 }) : new Response(JSON.stringify(response)))
    const store = useFxStore()
    await store.load(client, 'USD', 'EUR')
    failed = true
    await store.load(client, 'USD', 'EUR')
    expect(store.rates.get('USD/EUR')).toMatchObject({ rate: 0.8, stale: true, cached: true })
    expect(store.errors.get('USD/EUR')).toBeTruthy()
    await store.load(client, 'CAD', 'EUR')
    expect(store.rates.has('CAD/EUR')).toBe(false)
  })

  it('verwirft Werte bei neuer Adresse und ignoriert eine verspätete alte Antwort', async () => {
    let release!: (response: Response) => void
    const oldClient = new StockInfoClient('https://old.test', async () => new Promise(resolve => { release = resolve }))
    const newClient = new StockInfoClient('https://new.test', async () => new Response(JSON.stringify({ ...response, rate: 0.9 })))
    const store = useFxStore()
    const old = store.load(oldClient, 'USD', 'EUR')
    await store.load(newClient, 'USD', 'EUR')
    release(new Response(JSON.stringify(response)))
    await old
    expect(store.rates.get('USD/EUR')?.rate).toBe(0.9)
    expect(store.apiUrl).toBe('https://new.test')
  })
})
