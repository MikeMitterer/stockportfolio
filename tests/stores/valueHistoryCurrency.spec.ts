import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { deleteDB } from 'idb'
import { closeDb, DB_NAME } from '@/db/schema'
import { useValueHistoryStore } from '@/stores/valueHistory'
import { ValueSnapshotRepository } from '@/db/repository'
import { buildBackup, parseBackup } from '@/domain/backup'
import { emptyPortfolio } from '@/db/seed'
import { defaultSettings } from '@/stores/settings'

beforeEach(async () => { await closeDb(); await deleteDB(DB_NAME); setActivePinia(createPinia()) })
afterEach(async () => { await closeDb(); await deleteDB(DB_NAME) })

describe('Währung in Tageswerten und Sicherungen', () => {
  it('mischt beim Laden keine verschiedenen Währungen', async () => {
    const store = useValueHistoryStore()
    await store.load('depot', 'USD')
    await store.record('depot', 100, 'USD', new Date('2026-09-10T12:00:00Z'))
    await new ValueSnapshotRepository().put('depot', '2026-09-09', 80, 'EUR')
    await store.load('depot', 'USD')
    expect(store.snapshots).toEqual([{ date: '2026-09-10', total: 100, currency: 'USD' }])
    await store.load('anderes', 'EUR')
    expect(store.snapshots).toEqual([])
    expect(store.backtest).toEqual([])
  })

  it('erhält Depotwährung und Geldschwellen und verwirft nicht zuordenbare Tageswerte', () => {
    const portfolio = emptyPortfolio('USA', 'USD')
    portfolio.amountSettings!.securityBuffer = { mode: 'absolute', value: 100 }
    const backup = buildBackup(portfolio, defaultSettings(portfolio.id), new Map(), 'test', '2026-09-10', [{ date: '2026-09-10', total: 200, currency: 'USD' }])
    const raw = { ...backup, valueHistory: [...backup.valueHistory, { date: '2026-09-09', total: 180, currency: 'EUR' }, { date: '2026-09-08', total: 999 }] }
    const result = parseBackup(JSON.stringify(raw))
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.backup.portfolio).toMatchObject({ baseCurrency: 'USD', amountSettings: { securityBuffer: { value: 100 } } })
    expect(result.backup.valueHistory).toEqual(backup.valueHistory)
    expect(parseBackup(JSON.stringify({ ...raw, portfolio: { ...portfolio, baseCurrency: 'ZZZ' } })).ok).toBe(false)
  })
})
