import { AllowlistRepository, PortfolioRepository, SettingsRepository, ValueSnapshotRepository } from './repository'
import { getDb } from './schema'
import type { Portfolio, Settings } from '@/types/portfolio'
import type { ValueSnapshotEntry } from './schema'

export interface LegacyPortfolioData {
  portfolio: Portfolio
  allowlist: Record<string, boolean>
  snapshots: ValueSnapshotEntry[]
}

export interface LegacyData {
  portfolios: LegacyPortfolioData[]
  settings: Settings | null
}

/** Nur das serverseitig berechtigte Setup-Konto darf diese Funktion aufrufen. */
export async function readLegacyData(): Promise<LegacyData> {
  const portfolios = await new PortfolioRepository().findAll()
  const allowlists = new AllowlistRepository()
  const snapshots = new ValueSnapshotRepository()
  return {
    portfolios: await Promise.all(portfolios.map(async (portfolio) => ({
      portfolio,
      allowlist: Object.fromEntries(await allowlists.loadAll(portfolio.id)),
      snapshots: await snapshots.findByPortfolio(portfolio.id),
    }))),
    settings: await new SettingsRepository().load(),
  }
}

/** Entfernt nur den besitzerlosen Altbestand; Markt-Caches werden getrennt behandelt. */
export async function clearLegacyData(): Promise<void> {
  const database = await getDb()
  const transaction = database.transaction(['portfolios', 'settings', 'instrumentAllowlist', 'valueSnapshots'], 'readwrite')
  await Promise.all([
    transaction.objectStore('portfolios').clear(),
    transaction.objectStore('settings').clear(),
    transaction.objectStore('instrumentAllowlist').clear(),
    transaction.objectStore('valueSnapshots').clear(),
  ])
  await transaction.done
}
