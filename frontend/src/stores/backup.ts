import { defineStore } from 'pinia'
import { privateDataClient } from '@/api/data/client'
import type { Backup } from '@/domain/backup'
import { usePortfolioStore } from './portfolio'

export const useBackupStore = defineStore('backup', () => {
  const portfolioStore = usePortfolioStore()

  async function restore(backup: Backup): Promise<void> {
    const client = privateDataClient()
    if (!client) throw new Error('PrivateDataClient fehlt')
    await client.restoreBackup(backup, portfolioStore.portfolio?.id ?? null)
  }

  return { restore }
})
