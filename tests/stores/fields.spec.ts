import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { StockInfoClient } from '@/api/client'
import { useFieldsStore } from '@/stores/fields'
import catalog from '../fixtures/stockinfo/detail-catalog.json'

beforeEach(() => setActivePinia(createPinia()))

describe('Feldkatalog nur für die Sitzung', () => {
  it('fasst parallele Anfragen zusammen und lädt beim nächsten Öffnen neu', async () => {
    let calls = 0
    let version = 1
    const client = new StockInfoClient('https://fields.test', async () => {
      calls++
      return new Response(JSON.stringify({ ...catalog, details_version: version }))
    })
    const store = useFieldsStore()
    await Promise.all([store.load(client), store.load(client)])
    expect(calls).toBe(1)
    expect(store.catalog?.detailsVersion).toBe(1)
    version = 2
    await store.load(client)
    expect(calls).toBe(2)
    expect(store.catalog?.detailsVersion).toBe(2)
  })

  it('verwirft bei Fehler nur den Feldkatalog und hält die Ursache bereit', async () => {
    const store = useFieldsStore()
    await store.load(new StockInfoClient('https://fields.test', async () => new Response(JSON.stringify(catalog))))
    await store.load(new StockInfoClient('https://fields.test', async () => new Response('', { status: 503 })))
    expect(store.catalog).toBeNull()
    expect(store.error).toBeTruthy()
    expect(store.loading).toBe(false)
  })

  it('übernimmt beim Adresswechsel keine verspätete Antwort der vorigen Instanz', async () => {
    let release!: (response: Response) => void
    const first = new StockInfoClient('https://old.test', () => new Promise(resolve => { release = resolve }))
    const second = new StockInfoClient('https://new.test', async () => new Response(JSON.stringify({ ...catalog, generation_id: 'new' })))
    const store = useFieldsStore()
    const old = store.load(first)
    await store.load(second)
    release(new Response(JSON.stringify(catalog)))
    await old
    expect(store.apiBaseUrl).toBe('https://new.test')
    expect(store.catalog?.generationId).toBe('new')
  })
})
