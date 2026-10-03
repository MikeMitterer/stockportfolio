import { defineStore } from 'pinia'
import { shallowRef } from 'vue'
import { privateDataClient } from '@/api/data/client'
import { clearLegacyData, readLegacyData, type LegacyData } from '@/db/legacy'
import { backupFileName, buildBackup, type Backup } from '@/domain/backup'
import { defaultSettings } from './settings'

export const useLegacyStore = defineStore('legacy', () => {
  const legacyData = shallowRef<LegacyData | null>(null)

  async function inspect(): Promise<boolean> {
    const current = await readLegacyData()
    legacyData.value = current.portfolios.length > 0 ? current : null
    return legacyData.value !== null
  }

  function clearPreview(): void {
    legacyData.value = null
  }

  async function importToSetupAccount(): Promise<void> {
    const client = privateDataClient()
    if (!client || !legacyData.value) throw new Error('Altbestand oder Konto-API fehlt')
    await client.importLegacy(legacyData.value.portfolios, legacyData.value.settings)
    await clearLegacyData()
    clearPreview()
  }

  async function discard(): Promise<void> {
    await clearLegacyData()
    clearPreview()
  }

  function exportAt(index: number): { backup: Backup; fileName: string } | null {
    const entry = legacyData.value?.portfolios[index]
    if (!entry) return null
    const exportedAt = new Date().toISOString()
    const settings = {
      ...(legacyData.value?.settings ?? defaultSettings(entry.portfolio.id)),
      activePortfolioId: entry.portfolio.id,
    }
    return {
      backup: buildBackup(
        entry.portfolio,
        settings,
        new Map(Object.entries(entry.allowlist)),
        __APP_VERSION__,
        exportedAt,
        entry.snapshots.map(({ date, total, currency }) => ({ date, total, currency })),
      ),
      fileName: backupFileName(entry.portfolio.name, exportedAt),
    }
  }

  return { legacyData, inspect, clearPreview, importToSetupAccount, discard, exportAt }
})
