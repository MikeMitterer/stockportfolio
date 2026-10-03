import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { activatePrivateData, deactivatePrivateData, PrivateDataClient } from '@/api/data/client'
import { buildBackup } from '@/domain/backup'
import { defaultSettings } from '@/stores/settings'
import { useBackupStore } from '@/stores/backup'
import type { Portfolio } from '@/types/portfolio'

const portfolio: Portfolio = {
  id: 'restored', name: 'Wiederhergestellt', positions: [],
  createdAt: '2026-09-01T00:00:00.000Z', updatedAt: '2026-09-01T00:00:00.000Z',
}
const backup = buildBackup(portfolio, defaultSettings(portfolio.id), new Map([['IE0000000001', false]]), '0.1.0', '2026-09-30T00:00:00.000Z')

beforeEach(() => {
  setActivePinia(createPinia())
})

afterEach(() => {
  deactivatePrivateData()
})

describe('Backup-Store', () => {
  it('stellt ein Backup ausschließlich über die Konto-API wieder her', async () => {
    const fetcher = vi.fn<typeof fetch>(async (_input, init) =>
      init?.method === 'POST'
        ? Response.json({ revisions: {} })
        : Response.json({ error: 'not_found' }, { status: 404 }),
    )
    activatePrivateData(new PrivateDataClient(fetcher))

    expect(await useBackupStore().restore(backup)).toBeUndefined()

    const restoreCall = fetcher.mock.calls.find(([url]) => url === '/api/data/restore')
    expect(restoreCall).toBeDefined()
    expect(restoreCall?.[1]).toEqual(expect.objectContaining({ method: 'POST', credentials: 'same-origin' }))
    expect(JSON.parse(String(restoreCall?.[1]?.body))).toEqual(expect.objectContaining({
      portfolio, allowlist: backup.allowlist, replacedId: null,
    }))
  })

  it('verweigert die Wiederherstellung ohne aktiven Konto-Client', async () => {
    const fetcher = vi.fn<typeof fetch>()
    activatePrivateData(new PrivateDataClient(fetcher))
    const store = useBackupStore()
    deactivatePrivateData()

    await expect(store.restore(backup)).rejects.toThrow('PrivateDataClient fehlt')
    expect(fetcher).not.toHaveBeenCalled()
  })
})
