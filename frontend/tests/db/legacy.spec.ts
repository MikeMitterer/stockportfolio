import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { deleteDB } from 'idb'
import { clearLegacyData, readLegacyData } from '@/db/legacy'
import { PortfolioRepository, QuoteCacheRepository, SettingsRepository } from '@/db/repository'
import { closeDb, DB_NAME } from '@/db/schema'
import { defaultSettings } from '@/stores/settings'
import type { Portfolio } from '@/types/portfolio'

beforeEach(async () => {
  await closeDb()
  await deleteDB(DB_NAME)
})

afterEach(async () => { await closeDb() })

describe('besitzerloser Browserbestand', () => {
  it('liest Depot und Einstellungen und verwirft nur private Altbestandsdaten', async () => {
    const portfolio: Portfolio = {
      id: 'old-portfolio', name: 'Alt', positions: [],
      createdAt: '2026-09-01T00:00:00.000Z', updatedAt: '2026-09-01T00:00:00.000Z',
    }
    await new PortfolioRepository().save(portfolio)
    await new SettingsRepository().save(defaultSettings(portfolio.id))
    await new QuoteCacheRepository().put('IE0000000001', {
      identity: { kind: 'isin_only', isin: 'IE0000000001' },
      isin: 'IE0000000001', symbol: 'OLD', price: 100, currency: 'EUR',
      type: null, volatility: null, name: null, ter: null, accumulating: null,
      fetchedAt: '2026-09-01T00:00:00.000Z', cached: true, stale: false,
    })

    const legacy = await readLegacyData()
    expect(legacy.portfolios.map((entry) => entry.portfolio.id)).toEqual(['old-portfolio'])
    expect(legacy.settings?.activePortfolioId).toBe('old-portfolio')

    await clearLegacyData()
    expect(await new PortfolioRepository().count()).toBe(0)
    expect(await new SettingsRepository().load()).toBeNull()
    expect((await new QuoteCacheRepository().loadAll()).has('IE0000000001')).toBe(true)
  })
})
