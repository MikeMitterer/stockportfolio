import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { deleteDB } from 'idb'
import { StockInfoClient } from '@/api/client'
import { useQuotesStore } from '@/stores/quotes'
import { closeDb, DB_NAME } from '@/db/schema'
import quoteFixture from '../fixtures/stockinfo/quote-200.json'
import values from '../fixtures/stockinfo/detail-values.json'
import type { Position } from '@/types/portfolio'

const body = quoteFixture.response.body
const position: Position = { id: 'detail-test', isin: body.identity.isin, symbol: body.symbol, displayName: body.name, kind: 'etf', group: 'stocks', units: 1, targetPercent: 100, enabled: true }
beforeEach(async () => { setActivePinia(createPinia()); await closeDb(); await deleteDB(DB_NAME) })
afterEach(closeDb)

describe('Details im bestehenden Kurscache', () => {
  it.each(['load', 'single', 'batch'] as const)('erhält wirksamen Wert und Herkunft nach %s und Neuladen', async mode => {
    let details = values
    const client = new StockInfoClient('https://details.test', async () => new Response(JSON.stringify({ ...body, details })))
    const store = useQuotesStore()
    await store.loadQuotes(client, [position])
    if (mode !== 'load') {
      details = { ...values, 'risk-a.score': { ...values['risk-a.score'], value: 3 } }
      if (mode === 'single') await store.refreshOne(client, position)
      else await store.loadQuotes(client, [position], { force: true })
    }
    setActivePinia(createPinia())
    const reloaded = useQuotesStore()
    await reloaded.hydrate()
    expect(reloaded.quotes.get(position.isin!)?.details?.['risk-a.score']).toMatchObject({
      value: mode === 'load' ? 0 : 3, manualValue: 7, shadowed: true, source: 'risk-a', asOf: '2026-09-10T08:00:00Z',
    })
    expect(reloaded.quotes.get(position.isin!)?.details?.['risk-a.flag']?.value).toBe(false)
  })
})
