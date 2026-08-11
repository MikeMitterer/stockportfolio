/**
 * Anlegen des Start-Portfolios.
 *
 * Beim Erststart bekommt der Nutzer ein **leeres** Depot — fremde Bestände
 * vorzugeben wäre verwirrend, weil sie sich kaum von eigenen Daten
 * unterscheiden lassen. Wer die App erst ausprobieren will, kann über
 * `demoPortfolio()` ein ausdrücklich als Beispiel benanntes Depot laden.
 */

import { translate } from '@/i18n'
import type { Portfolio, Position } from '@/types/portfolio'

/**
 * Beispiel-Positionen — echte ISINs, damit Kurse geladen werden, aber
 * betont runde Stückzahlen, die niemand für einen echten Bestand hält.
 */
const DEMO_POSITIONS: readonly (Omit<Position, 'id' | 'displayName'> & {
  /** `null` beim Verrechnungskonto — sein Name kommt aus dem Katalog. */
  displayName: string | null
})[] = [
  {
    isin: 'IE00B3RBWM25',
    symbol: 'VGWL.DE',
    kind: 'etf',
    displayName: 'Vanguard FTSE All-World',
    group: 'stocks',
    units: 500,
    targetPercent: 45,
    enabled: true,
  },
  {
    isin: 'IE0032077012',
    symbol: 'EQQQ.DE',
    kind: 'etf',
    displayName: 'Invesco Nasdaq-100',
    group: 'stocks',
    units: 50,
    targetPercent: 15,
    enabled: true,
  },
  {
    isin: 'IE00BF4RFH31',
    symbol: 'IUSN.DE',
    kind: 'etf',
    displayName: 'iShares MSCI World Small Cap',
    group: 'stocks',
    units: 1000,
    targetPercent: 10,
    enabled: true,
  },
  {
    isin: 'IE00BCRY6557',
    symbol: 'IS3M.DE',
    kind: 'etf',
    displayName: 'iShares $ Treasury Bond 7-10yr',
    group: 'bonds',
    units: 200,
    targetPercent: 15,
    enabled: true,
  },
  {
    isin: 'DE000A0S9GB0',
    symbol: '4GLD.DE',
    kind: 'stock',
    displayName: 'Xetra-Gold',
    group: 'metals',
    units: 100,
    targetPercent: 10,
    enabled: true,
  },
  {
    isin: null,
    symbol: 'CASH',
    kind: null,
    displayName: null,
    group: 'cash',
    units: 5000,
    targetPercent: 5,
    enabled: true,
  },
] as const

/**
 * Leeres Depot mit einer Cash-Position — die gibt es genau einmal je
 * Portfolio und sie lässt sich nicht über den Instrumenten-Dialog anlegen.
 */
export function emptyPortfolio(name = translate('seed.portfolioName')): Portfolio {
  const now = new Date().toISOString()
  return {
    id: newId(),
    name,
    createdAt: now,
    updatedAt: now,
    positions: [
      {
        id: newId(),
        isin: null,
        symbol: 'CASH',
        kind: null,
        displayName: translate('seed.cashAccount'),
        group: 'cash',
        units: 0,
        targetPercent: 0,
        enabled: true,
      },
    ],
  }
}

/** Beispiel-Depot zum Ausprobieren — als solches benannt. */
export function demoPortfolio(): Portfolio {
  const now = new Date().toISOString()
  return {
    id: newId(),
    name: translate('seed.demoName'),
    createdAt: now,
    updatedAt: now,
    positions: DEMO_POSITIONS.map((position) => ({
      ...position,
      id: newId(),
      // Nur das Verrechnungskonto trägt keinen Marktnamen — es heißt in jeder
      // Sprache anders, während „Xetra-Gold" überall Xetra-Gold heißt.
      displayName: position.displayName ?? translate('seed.cashAccount'),
    })),
  }
}

/** Erzeugt eine ID — nutzt `crypto.randomUUID`, wo verfügbar. */
export function newId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `id-${Math.random().toString(36).slice(2)}-${Date.now().toString(36)}`
}
