import { defineStore } from 'pinia'
import { privateDataClient } from '@/data/client'
import type { Backup } from '@/domain/backup'
import { useInstrumentsStore } from './instruments'
import { usePortfolioStore } from './portfolio'
import { useSettingsStore } from './settings'
import { useValueHistoryStore } from './valueHistory'

export const useBackupStore = defineStore('backup', () => {
  const portfolioStore = usePortfolioStore()
  const settingsStore = useSettingsStore()
  const instrumentsStore = useInstrumentsStore()
  const valueHistoryStore = useValueHistoryStore()

  async function restore(backup: Backup): Promise<'server' | 'local'> {
    const client = privateDataClient()
    if (client) {
      await client.restoreBackup(backup, portfolioStore.portfolio?.id ?? null)
      return 'server'
    }
    await portfolioStore.replacePortfolio(backup.portfolio)
    await settingsStore.replaceAll({
      ...backup.settings,
      activePortfolioId: backup.portfolio.id,
    })
    await instrumentsStore.replaceAllowlist(new Map(Object.entries(backup.allowlist)))
    await valueHistoryStore.replaceAll(backup.portfolio.id, backup.valueHistory)
    return 'local'
  }

  return { restore }
})
