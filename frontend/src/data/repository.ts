import type { ValueSnapshotEntry } from '@/db/schema'
import type { Portfolio, Settings } from '@/types/portfolio'
import { PrivateDataClient, privateDataClient } from './client'
import {
  AllowlistRepository,
  PortfolioRepository,
  SettingsRepository,
  ValueSnapshotRepository,
} from '@/db/repository'

function activeClient(): PrivateDataClient {
  const client = privateDataClient()
  if (!client) throw new Error('PrivateDataClient fehlt')
  return client
}

class ServerPortfolioRepository {
  async findAll(): Promise<Portfolio[]> {
    return (await activeClient().list<Portfolio>('portfolio')).map((entry) => entry.value)
  }

  async findById(id: string): Promise<Portfolio | null> {
    return (await activeClient().get<Portfolio>('portfolio', id))?.value ?? null
  }

  async save(portfolio: Portfolio): Promise<void> {
    await activeClient().save('portfolio', portfolio.id, { ...portfolio, updatedAt: new Date().toISOString() })
  }

  async remove(id: string): Promise<void> {
    await activeClient().remove('portfolio', id)
  }

  async count(): Promise<number> {
    return (await activeClient().list('portfolio')).length
  }
}

class ServerSettingsRepository {
  async load(): Promise<Settings | null> {
    return (await activeClient().get<Settings>('settings', 'current'))?.value ?? null
  }

  async save(settings: Settings): Promise<void> {
    await activeClient().save('settings', 'current', settings)
  }
}

class ServerAllowlistRepository {
  async loadAll(portfolioId: string): Promise<Map<string, boolean>> {
    const resource = await activeClient().get<Record<string, boolean>>('allowlist', portfolioId)
    return new Map(Object.entries(resource?.value ?? {}))
  }

  async setEnabled(portfolioId: string, key: string, enabled: boolean): Promise<void> {
    await activeClient().update<Record<string, boolean>>('allowlist', portfolioId, (current) => ({ ...current, [key]: enabled }))
  }

  async replaceAll(portfolioId: string, entries: Map<string, boolean>): Promise<void> {
    await activeClient().save('allowlist', portfolioId, Object.fromEntries(entries))
  }

  async removeForPortfolio(portfolioId: string): Promise<void> {
    await activeClient().remove('allowlist', portfolioId)
  }

  async count(portfolioId: string): Promise<number> {
    return (await this.loadAll(portfolioId)).size
  }
}

class ServerValueSnapshotRepository {
  async findByPortfolio(portfolioId: string): Promise<ValueSnapshotEntry[]> {
    const resource = await activeClient().get<ValueSnapshotEntry[]>('snapshots', portfolioId)
    return [...(resource?.value ?? [])].sort((first, second) => first.date.localeCompare(second.date))
  }

  async put(portfolioId: string, date: string, total: number, currency: string): Promise<void> {
    await activeClient().update<ValueSnapshotEntry[]>('snapshots', portfolioId, (current) => {
      const entries = current ?? []
      const next = entries.filter((entry) => entry.date !== date || entry.currency !== currency)
      return [...next, { key: `${portfolioId}::${currency}::${date}`, portfolioId, date, total, currency }]
    })
  }

  async clearPortfolio(portfolioId: string): Promise<void> {
    await activeClient().remove('snapshots', portfolioId)
  }
}

export function createPortfolioRepository(): PortfolioRepository | ServerPortfolioRepository {
  return privateDataClient() ? new ServerPortfolioRepository() : new PortfolioRepository()
}

export function createSettingsRepository(): SettingsRepository | ServerSettingsRepository {
  return privateDataClient() ? new ServerSettingsRepository() : new SettingsRepository()
}

export function createAllowlistRepository(): AllowlistRepository | ServerAllowlistRepository {
  return privateDataClient() ? new ServerAllowlistRepository() : new AllowlistRepository()
}

export function createValueSnapshotRepository(): ValueSnapshotRepository | ServerValueSnapshotRepository {
  return privateDataClient() ? new ServerValueSnapshotRepository() : new ValueSnapshotRepository()
}
