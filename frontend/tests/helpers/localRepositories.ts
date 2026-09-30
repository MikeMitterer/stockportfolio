/** Expliziter lokaler Speicher nur für Store- und Komponententests. */
import {
  AllowlistRepository,
  PortfolioRepository,
  SettingsRepository,
  ValueSnapshotRepository,
} from '@/db/repository'

export const createPortfolioRepository = (): PortfolioRepository => new PortfolioRepository()
export const createSettingsRepository = (): SettingsRepository => new SettingsRepository()
export const createAllowlistRepository = (): AllowlistRepository => new AllowlistRepository()
export const createValueSnapshotRepository = (): ValueSnapshotRepository => new ValueSnapshotRepository()
