/**
 * Domain-Typen für Portfolio-, Positions- und Settings-Daten.
 * Referenz: docs/superpowers/specs/2026-08-06-rebalancing-webapp-design.md §5.
 */

export type AssetGroup = 'stocks' | 'bonds' | 'metals' | 'cash'

export type Suggestion = 'buy' | 'sell' | 'ok'

export interface Position {
  id: string
  isin: string | null
  symbol: string
  displayName: string
  group: AssetGroup
  units: number
  targetPercent: number
  enabled: boolean
  notes?: string
}

export interface Portfolio {
  id: string
  name: string
  positions: Position[]
  createdAt: string
  updatedAt: string
}

export interface Bands {
  lowerPercent: number
  upperPercent: number
}

export interface Settings {
  activePortfolioId: string
  totalRounding: number
  bands: Bands
  saveAssetGrenze: number
  investmentReservePercent: number
  currentRebalancingBudget: number
  currency: 'EUR'
  refresh: { autoOnLoad: boolean; staleAfterMinutes: number }
  ui: {
    columns: {
      volatility: boolean
      optimalUnits: boolean
      groupSharePercent: boolean
      deltaEuro: boolean
      deltaMax: boolean
      deltaPercentAbs: boolean
    }
  }
}

export interface QuoteCacheEntry {
  isin: string | null
  symbol: string
  price: number
  currency: string
  volatility: number | null
  name: string | null
  ter: number | null
  accumulating: boolean | null
  fetchedAt: string
  cached: boolean
  stale: boolean
}

export type QuoteMap = Map<string, QuoteCacheEntry>
