import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { StockInfoClient } from '@/api/client'
import { useInstrumentTypesStore } from '@/stores/instrumentTypes'
import fixture from '../fixtures/stockinfo/instrument-types-200.json'

beforeEach(() => setActivePinia(createPinia()))

describe('Dynamischer Typkatalog pro API-Adresse', () => {
  it('lädt beim erneuten Öffnen neu und erhält keine feste Rückfallliste bei Fehlern', async () => {
    let calls = 0
    let body = fixture.response.body
    let fail = false
    const client = new StockInfoClient('https://types.test', async () => {
      calls++
      return fail ? new Response('', { status: 503 }) : new Response(JSON.stringify(body))
    })
    const store = useInstrumentTypesStore()
    await Promise.all([store.load(client), store.load(client)])
    expect(calls).toBe(1)
    expect(store.catalog?.types).toContain('future-type')
    body = { ...body, instrument_types: ['fund'], complete: false }
    await store.load(client)
    expect(store.catalog).toMatchObject({ types: ['fund'], complete: false })
    fail = true
    await store.load(client)
    expect(store.catalog).toBeNull()
    expect(store.error).toBeTruthy()
    expect(store.loading).toBe(false)
    fail = false
    body = { ...body, instrument_types: [], complete: true, sources: [] }
    await store.load(client)
    expect(store.catalog).toMatchObject({ types: [], complete: true })
    expect(store.error).toBeNull()
  })

  it('ignoriert verspätete Antworten nach einem Adresswechsel', async () => {
    let release!: (response: Response) => void
    const oldClient = new StockInfoClient('https://old.test', () => new Promise(resolve => { release = resolve }))
    const nextClient = new StockInfoClient('https://new.test', async () => new Response(JSON.stringify({ instrument_types: ['new-type'], complete: true, sources: [] })))
    const store = useInstrumentTypesStore()
    const oldRequest = store.load(oldClient)
    await store.load(nextClient)
    release(new Response(JSON.stringify(fixture.response.body)))
    await oldRequest
    expect(store.apiBaseUrl).toBe(nextClient.url)
    expect(store.catalog?.types).toEqual(['new-type'])
  })
})
