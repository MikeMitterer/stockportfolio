import { afterEach, describe, expect, it, vi } from 'vitest'
import { activatePrivateData, deactivatePrivateData, PrivateDataClient } from '@/api/data/client'
import {
  createAllowlistRepository,
  createPortfolioRepository,
  createSettingsRepository,
  createValueSnapshotRepository,
} from '@/data/repository'

afterEach(() => {
  deactivatePrivateData()
})

describe('private Repository-Wahl', () => {
  it('schreibt ohne aktiven Datenclient auch in Tests nicht in den Altbestand', () => {
    deactivatePrivateData()
    expect(() => createPortfolioRepository()).toThrow('PrivateDataClient fehlt')
    expect(() => createSettingsRepository()).toThrow('PrivateDataClient fehlt')
    expect(() => createAllowlistRepository()).toThrow('PrivateDataClient fehlt')
    expect(() => createValueSnapshotRepository()).toThrow('PrivateDataClient fehlt')
  })

  it('legt mit aktivem Datenclient ausschließlich Server-Repositories an', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(Response.json({ resources: [] }))
    activatePrivateData(new PrivateDataClient(fetcher))
    expect(await createPortfolioRepository().findAll()).toEqual([])
    expect(fetcher).toHaveBeenCalledWith('/api/data/portfolio', expect.objectContaining({ method: 'GET' }))
  })
})
