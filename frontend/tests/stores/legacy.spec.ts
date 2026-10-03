import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { deleteDB } from 'idb'
import { activatePrivateData, deactivatePrivateData, PrivateDataClient } from '@/api/data/client'
import { AllowlistRepository, PortfolioRepository, SettingsRepository, ValueSnapshotRepository } from '@/db/repository'
import { closeDb, DB_NAME } from '@/db/schema'
import { useLegacyStore } from '@/stores/legacy'
import { defaultSettings } from '@/stores/settings'
import type { Portfolio } from '@/types/portfolio'

const portfolio: Portfolio = {
  id: 'legacy-portfolio', name: 'Altbestand', positions: [],
  createdAt: '2026-09-01T00:00:00.000Z', updatedAt: '2026-09-01T00:00:00.000Z',
}

async function seedLegacy(): Promise<void> {
  await new PortfolioRepository().save(portfolio)
  await new SettingsRepository().save(defaultSettings(portfolio.id))
  await new AllowlistRepository().setEnabled(portfolio.id, 'IE0000000001', false)
  await new ValueSnapshotRepository().put(portfolio.id, '2026-09-29', 1234, 'EUR')
}

beforeEach(async () => {
  deactivatePrivateData()
  await closeDb()
  await deleteDB(DB_NAME)
  setActivePinia(createPinia())
})

afterEach(async () => {
  deactivatePrivateData()
  await closeDb()
})

describe('Altbestand-Store', () => {
  it('liest den besitzerlosen Bestand und exportiert ein Depot als Backup', async () => {
    await seedLegacy()
    const store = useLegacyStore()

    expect(await store.inspect()).toBe(true)
    expect(store.legacyData?.portfolios).toHaveLength(1)
    const exported = store.exportAt(0)
    expect(exported?.backup.portfolio.id).toBe(portfolio.id)
    expect(exported?.backup.allowlist).toEqual({ IE0000000001: false })
    expect(exported?.backup.valueHistory).toEqual([{ date: '2026-09-29', total: 1234, currency: 'EUR' }])
    expect(exported?.backup.settings.activePortfolioId).toBe(portfolio.id)
    expect(exported?.fileName).toMatch(/^stockportfolio-altbestand-\d{4}-\d{2}-\d{2}\.json$/)
    expect(store.exportAt(1)).toBeNull()

    store.clearPreview()
    expect(store.legacyData).toBeNull()
    expect(await new PortfolioRepository().count()).toBe(1)
  })

  it('importiert über die Konto-API und leert den Altbestand erst nach Erfolg', async () => {
    await seedLegacy()
    const store = useLegacyStore()
    await store.inspect()
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(Response.json({ revisions: {} }))
    activatePrivateData(new PrivateDataClient(fetcher))

    await store.importToSetupAccount()

    expect(fetcher).toHaveBeenCalledWith('/api/data/legacy-import', expect.objectContaining({
      method: 'POST', credentials: 'same-origin',
    }))
    const payload = JSON.parse(String(fetcher.mock.calls[0]?.[1]?.body))
    expect(payload.portfolios[0].portfolio.id).toBe(portfolio.id)
    expect(await new PortfolioRepository().count()).toBe(0)
    expect(await new SettingsRepository().load()).toBeNull()
    expect(store.legacyData).toBeNull()
    expect(await store.inspect()).toBe(false)
  })

  it('behält den Altbestand bei fehlgeschlagenem Import', async () => {
    await seedLegacy()
    const store = useLegacyStore()
    await store.inspect()
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(Response.json({ error: 'conflict' }, { status: 409 }))
    activatePrivateData(new PrivateDataClient(fetcher))

    await expect(store.importToSetupAccount()).rejects.toThrow('conflict')
    expect(await new PortfolioRepository().count()).toBe(1)
    expect(store.legacyData?.portfolios).toHaveLength(1)
  })

  it('verwirft private Browserdaten und entfernt die Vorschau', async () => {
    await seedLegacy()
    const store = useLegacyStore()
    await store.inspect()

    await store.discard()

    expect(await new PortfolioRepository().count()).toBe(0)
    expect(await new SettingsRepository().load()).toBeNull()
    expect(await new AllowlistRepository().loadAll(portfolio.id)).toEqual(new Map())
    expect(await new ValueSnapshotRepository().findByPortfolio(portfolio.id)).toEqual([])
    expect(store.legacyData).toBeNull()
  })
})
