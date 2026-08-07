/**
 * Einmaliges Seeding beim Erststart.
 *
 * Solange es keinen Add-Position-Dialog gibt (T-10), wäre ein leeres
 * Portfolio eine Sackgasse. Deshalb legen wir die Positionen der bisherigen
 * Excel-Vorlage an — Bestände und Ziele kann der Nutzer danach frei ändern.
 *
 * Sobald T-10 steht, kann hier auf ein leeres Portfolio umgestellt werden.
 */

import type { Portfolio, Position } from '@/types/portfolio'

/** Positionen der Excel-Vorlage — ohne Kurse, die kommen aus der API. */
const SEED_POSITIONS: readonly Omit<Position, 'id'>[] = [
  {
    isin: 'IE00B3RBWM25',
    symbol: 'VGWL.DE',
    displayName: 'Vanguard FTSE All-World',
    group: 'stocks',
    units: 1217,
    targetPercent: 36,
    enabled: true,
  },
  {
    isin: 'IE0032077012',
    symbol: 'EQQQ.DE',
    displayName: 'Invesco Nasdaq-100',
    group: 'stocks',
    units: 29,
    targetPercent: 6,
    enabled: true,
  },
  {
    isin: 'US0846707026',
    symbol: 'BRYN.DE',
    displayName: 'Berkshire Hathaway',
    group: 'stocks',
    units: 112,
    targetPercent: 9,
    enabled: true,
  },
  {
    isin: 'IE00B5L8K969',
    symbol: 'CEBL.DE',
    displayName: 'iShares MSCI Emerging Markets',
    group: 'stocks',
    units: 222,
    targetPercent: 10,
    enabled: true,
  },
  {
    isin: 'IE00BQN1K901',
    symbol: 'CEMS.DE',
    displayName: 'iShares MSCI EM Small Cap',
    group: 'stocks',
    units: 277,
    targetPercent: 7,
    enabled: true,
  },
  {
    isin: 'IE00BF4RFH31',
    symbol: 'IUSN.DE',
    displayName: 'iShares MSCI World Small Cap',
    group: 'stocks',
    units: 32,
    targetPercent: 5.5,
    enabled: true,
  },
  {
    isin: 'IE00BCRY6557',
    symbol: 'IS3M.DE',
    displayName: 'iShares $ Treasury Bond 7-10yr',
    group: 'bonds',
    units: 74,
    targetPercent: 15,
    enabled: true,
  },
  {
    isin: 'DE000A0S9GB0',
    symbol: '4GLD.DE',
    displayName: 'Xetra-Gold',
    group: 'metals',
    units: 4533,
    targetPercent: 11,
    enabled: true,
  },
  {
    isin: null,
    symbol: 'CASH',
    displayName: 'Verrechnungskonto',
    group: 'cash',
    units: 370,
    targetPercent: 0.5,
    enabled: true,
  },
] as const

/** Erzeugt das Start-Portfolio mit frischen IDs und Zeitstempeln. */
export function seedPortfolio(): Portfolio {
  const now = new Date().toISOString()
  return {
    id: newId(),
    name: 'Hauptdepot',
    createdAt: now,
    updatedAt: now,
    positions: SEED_POSITIONS.map((position) => ({ ...position, id: newId() })),
  }
}

/** Erzeugt eine ID — nutzt `crypto.randomUUID`, wo verfügbar. */
export function newId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `id-${Math.random().toString(36).slice(2)}-${Date.now().toString(36)}`
}
