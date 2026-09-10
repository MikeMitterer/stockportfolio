import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { deleteDB, openDB } from 'idb'
import { StockInfoClient } from '@/api/client'
import { useQuotesStore } from '@/stores/quotes'
import { QuoteCacheRepository } from '@/db/repository'
import { closeDb, DB_NAME, getDb } from '@/db/schema'
import { computeRebalancing } from '@/domain/rebalancing'
import { defaultSettings } from '@/stores/settings'
import type { Portfolio, Position } from '@/types/portfolio'
import fixture from '../fixtures/stockinfo/quote-200.json'

const payload = fixture.response.body
const position: Position = {
  id: 'contract-position', isin: payload.identity.isin, symbol: payload.symbol,
  displayName: payload.name, group: 'stocks', kind: 'etf', units: 10,
  targetPercent: 50, enabled: true,
}

beforeEach(async () => {
  setActivePinia(createPinia())
  await closeDb()
  await deleteDB(DB_NAME)
})
afterEach(closeDb)

describe('Vertragsgrenze bis Store und Persistenz', () => {
  it('prüft einen neuen Kandidaten vor Aufnahme und übernimmt ausschließlich gültige Kurse', async () => {
    let body: unknown = { ...payload, currency: null }
    const client = new StockInfoClient('https://contract.test', async () => new Response(JSON.stringify(body)))
    const store = useQuotesStore()
    await expect(store.loadOne(client, position)).rejects.toMatchObject({ detail: expect.stringContaining('currency') })
    expect(store.quotes.size).toBe(0)
    expect((await new QuoteCacheRepository().loadAll()).size).toBe(0)
    body = payload
    await store.loadOne(client, position)
    expect(store.quotes.get(position.isin!)).toMatchObject({ price: payload.price, identity: payload.identity })
  })
  it.each(['single', 'batch'] as const)('markiert alten Kurs bei ungültigem %s-Refresh auch nach Neuladen veraltet', async (mode) => {
    let body: unknown = payload
    const client = new StockInfoClient('https://contract.test', async () => new Response(JSON.stringify(body)))
    const store = useQuotesStore()
    await store.loadQuotes(client, [position])
    body = { ...payload, currency: null, price: 999 }
    if (mode === 'single') await store.refreshOne(client, position)
    else await store.loadQuotes(client, [position], { force: true })
    expect(store.failures[0]?.reason).toContain('currency')
    expect(store.quotes.get(position.isin!)).toMatchObject({ price: payload.price, stale: true, cached: true })
    setActivePinia(createPinia())
    const reloaded = useQuotesStore()
    await reloaded.hydrate()
    expect(reloaded.quotes.get(position.isin!)).toMatchObject({
      price: payload.price, stale: true, cached: true, identity: payload.identity,
    })
  })

  it('schließt die sichtbare Position ohne gültigen Kurs auch von Handelsvorschlägen aus', async () => {
    const client = new StockInfoClient('https://contract.test', async () => new Response(JSON.stringify({ ...payload, currency: null })))
    const store = useQuotesStore()
    await store.loadQuotes(client, [position])
    expect(store.quotes.size).toBe(0)
    expect((await new QuoteCacheRepository().loadAll()).size).toBe(0)
    expect(store.failures[0]?.reason).toContain('currency')
    const portfolio: Portfolio = {
      id: 'depot', name: 'Test', createdAt: '', updatedAt: '',
      positions: [position, { ...position, id: 'cash', isin: null, symbol: 'CASH', group: 'cash', units: 1000 }],
    }
    const result = computeRebalancing(portfolio, store.quotes, defaultSettings(portfolio.id))
    expect(result.total).toBe(1000)
    expect(result.rows[0]).toMatchObject({
      position, isActive: false, excludedReason: 'missing-quote', suggestion: 'ok',
      marketValue: 0, targetValue: 0, unitsDelta: 0,
    })
  })

  it('baut den alten Kurscache neu auf und erhält das bestehende Depot', async () => {
    const previous = await openDB(DB_NAME, 4, {
      upgrade(db) {
        db.createObjectStore('quoteCache', { keyPath: 'key' })
        db.createObjectStore('portfolios', { keyPath: 'id' })
      },
    })
    await previous.put('quoteCache', { key: 'OLD', price: 100, currency: 'EUR' })
    await previous.put('portfolios', { id: 'keep', name: 'Vorhandenes Depot' })
    previous.close()
    const current = await getDb()
    expect(await current.count('quoteCache')).toBe(0)
    expect(await current.get('portfolios', 'keep')).toMatchObject({ name: 'Vorhandenes Depot' })
  })
})
