import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { deleteDB } from 'idb'
import { closeDb, DB_NAME } from '@/db/schema'
import { usePortfolioStore } from '@/stores/portfolio'
import { useSettingsStore } from '@/stores/settings'
import { ValueSnapshotRepository } from '@/db/repository'

beforeEach(async () => { await closeDb(); await deleteDB(DB_NAME); setActivePinia(createPinia()) })
afterEach(async () => { await closeDb(); await deleteDB(DB_NAME) })

describe('Basiswährung je Depot', () => {
  it('erhält Wahl und Geldschwellen bei Depotwechsel und Neuladen', async () => {
    const store = usePortfolioStore()
    const usd = await store.createPortfolio('USA', 'USD')
    await store.setAmountSetting('securityBuffer', { mode: 'absolute', value: 300 })
    const eur = await store.createPortfolio('Europa', 'EUR')
    expect(store.portfolio?.baseCurrency).toBe('EUR')
    expect(store.portfolio?.amountSettings?.securityBuffer.value).toBe(0)
    await store.switchTo(usd)
    expect(store.portfolio?.baseCurrency).toBe('USD')
    expect(store.portfolio?.amountSettings?.securityBuffer.value).toBe(300)
    await useSettingsStore().setActivePortfolio(usd)
    setActivePinia(createPinia())
    const reloaded = usePortfolioStore()
    await reloaded.load()
    expect(reloaded.portfolio?.baseCurrency).toBe('USD')
    await reloaded.switchTo(eur)
    expect(reloaded.portfolio?.baseCurrency).toBe('EUR')
  })

  it('rechnet Cash und absolute Grenzen um, erhält Stückzahlen und Prozentgrenzen', async () => {
    const store = usePortfolioStore()
    const id = await store.createPortfolio('Bestehend', 'EUR')
    await store.updatePosition(store.positions[0]!.id, { units: 100 })
    await store.addPosition({ id: 'stock', isin: null, symbol: 'VTI', displayName: 'Test', group: 'stocks', kind: 'etf', units: 10, targetPercent: 50, enabled: true })
    await store.setAmountSetting('securityBuffer', { mode: 'percent', value: 5 })
    await store.setAmountSetting('minTradeSize', { mode: 'absolute', value: 20 })
    await new ValueSnapshotRepository().put(id, '2026-09-10', 100, 'EUR')
    const rate = { base: 'EUR', quote: 'USD', rate: 1.25, quoteTime: '2026-09-10T10:00:00Z', fetchedAt: '2026-09-10T10:01:00Z', cached: true, stale: true, source: null }
    await store.setBaseCurrency(id, 'USD', rate)
    expect(store.portfolio).toMatchObject({ baseCurrency: 'USD', amountSettings: { securityBuffer: { mode: 'percent', value: 5 }, minTradeSize: { mode: 'absolute', value: 25 } } })
    expect(store.positions[0]?.units).toBe(125)
    expect(store.positions[1]?.units).toBe(10)
    const before = structuredClone(JSON.parse(JSON.stringify(store.portfolio)))
    await expect(store.setBaseCurrency(id, 'GBP')).rejects.toThrow()
    await expect(store.setBaseCurrency(id, 'GBP', { ...rate, rate: 0 })).rejects.toThrow()
    await expect(store.setBaseCurrency(id, 'GBP', rate)).rejects.toThrow()
    expect(store.portfolio).toEqual(before)
    await store.setAmountSetting('securityBuffer', { mode: 'absolute', value: 50 })
    await store.setBaseCurrency(id, 'EUR', { ...rate, base: 'USD', quote: 'EUR', rate: 0.8 })
    expect(store.portfolio?.amountSettings).toEqual({ securityBuffer: { mode: 'absolute', value: 40 }, minTradeSize: { mode: 'absolute', value: 20 } })
    expect(store.positions[0]?.units).toBe(100)
    expect(store.positions[1]?.units).toBe(10)
  })

  it('ändert ein Depot ohne gespeicherte Geldbeträge ohne unnötigen Devisenkurs', async () => {
    const store = usePortfolioStore()
    const id = await store.createPortfolio('Leer', 'EUR')
    await store.setBaseCurrency(id, 'CAD')
    expect(store.portfolio?.baseCurrency).toBe('CAD')
    await expect(store.createPortfolio('Ungültig', 'ZZZ')).rejects.toThrow()
    await expect(store.createPortfolio('Pence', 'GBp')).rejects.toThrow()
  })
})
