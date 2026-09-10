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

  it('sperrt eine Änderung auch bei Geldschwellen oder vorhandenen Tageswerten', async () => {
    const store = usePortfolioStore()
    const limits = await store.createPortfolio('Grenzen', 'EUR')
    await store.setAmountSetting('minTradeSize', { mode: 'absolute', value: 20 })
    await expect(store.setBaseCurrency(limits, 'USD')).rejects.toThrow()
    const history = await store.createPortfolio('Historie', 'USD')
    await new ValueSnapshotRepository().put(history, '2026-09-10', 100, 'USD')
    await expect(store.setBaseCurrency(history, 'EUR')).rejects.toThrow()
  })

  it('ändert nur leere Depots und etikettiert keine bestehenden Beträge um', async () => {
    const store = usePortfolioStore()
    const id = await store.createPortfolio('Leer', 'EUR')
    await store.setBaseCurrency(id, 'CAD')
    expect(store.portfolio?.baseCurrency).toBe('CAD')
    await store.updatePosition(store.positions[0]!.id, { units: 100 })
    await expect(store.setBaseCurrency(id, 'USD')).rejects.toThrow()
    expect(store.positions[0]?.units).toBe(100)
    expect(store.portfolio?.baseCurrency).toBe('CAD')
    await expect(store.createPortfolio('Ungültig', 'ZZZ')).rejects.toThrow()
    await expect(store.createPortfolio('Pence', 'GBp')).rejects.toThrow()
  })
})
