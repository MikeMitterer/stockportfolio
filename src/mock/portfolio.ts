/**
 * Mock-Portfolio auf Basis der Excel-Vorlage (Rebalancing-v2-Claude.xlsx).
 * Werte beim Preview-Ticket eingelesen; siehe Design-Doc §2.
 *
 * Seit T-04 kommen die **Kurse** aus der StockInfo-API — `MOCK_QUOTES` dient
 * nur noch als Fallback für Tests und Offline-Entwicklung. Die **Positionen**
 * wandern in T-05 nach IndexedDB.
 */

import type { Portfolio, QuoteCacheEntry, QuoteMap, Settings } from '@/types/portfolio'

const NOW_ISO = '2026-08-07T09:00:00.000Z'

export const MOCK_PORTFOLIO: Portfolio = {
  id: 'mock-hauptdepot',
  name: 'Hauptdepot',
  createdAt: NOW_ISO,
  updatedAt: NOW_ISO,
  positions: [
    // ─── Aktien / ETFs ───────────────────────────────────────────────────
    {
      id: 'p-vgwl',
      isin: 'IE00B3RBWM25',
      symbol: 'VGWL.DE',
      displayName: 'Vanguard FTSE All-World',
      group: 'stocks',
      units: 1217,
      targetPercent: 36,
      enabled: true,
    },
    {
      id: 'p-eqqq',
      isin: 'IE0032077012',
      symbol: 'EQQQ.DE',
      displayName: 'Invesco Nasdaq-100',
      group: 'stocks',
      units: 29,
      targetPercent: 6,
      enabled: true,
    },
    {
      id: 'p-bryn',
      isin: 'US0846707026',
      symbol: 'BRYN.DE',
      displayName: 'Berkshire Hathaway',
      group: 'stocks',
      units: 112,
      targetPercent: 9,
      enabled: true,
    },
    {
      id: 'p-cebl',
      isin: 'IE00B5L8K969',
      symbol: 'CEBL.DE',
      displayName: 'iShares MSCI Emerging Markets',
      group: 'stocks',
      units: 222,
      targetPercent: 10,
      enabled: true,
    },
    {
      id: 'p-cems',
      isin: 'IE00BQN1K901',
      symbol: 'CEMS.DE',
      displayName: 'iShares MSCI EM Small Cap',
      group: 'stocks',
      units: 277,
      targetPercent: 7,
      enabled: true,
    },
    {
      id: 'p-iusn',
      isin: 'IE00BF4RFH31',
      symbol: 'IUSN.DE',
      displayName: 'iShares MSCI World Small Cap',
      group: 'stocks',
      units: 32,
      targetPercent: 5.5,
      enabled: true,
    },

    // ─── Anleihen ────────────────────────────────────────────────────────
    {
      id: 'p-is3m',
      isin: 'IE00BCRY6557',
      symbol: 'IS3M.DE',
      displayName: 'iShares $ Treasury Bond 7-10yr',
      group: 'bonds',
      units: 74,
      targetPercent: 15,
      enabled: true,
    },

    // ─── Edelmetalle ────────────────────────────────────────────────────
    {
      id: 'p-4gld',
      isin: 'DE000A0S9GB0',
      symbol: '4GLD.DE',
      displayName: 'Xetra-Gold (Euwax Gold II)',
      group: 'metals',
      units: 4533,
      targetPercent: 11,
      enabled: true,
    },

    // ─── Cash ────────────────────────────────────────────────────────────
    {
      id: 'p-cash',
      isin: null,
      symbol: 'CASH',
      displayName: 'Verrechnungskonto',
      group: 'cash',
      units: 370,
      targetPercent: 0.5,
      enabled: true,
    },
  ],
}

/**
 * Fallback-Kurse — nachgebildet aus den cached Values im Excel.
 * Werden nur verwendet, solange die API keine echten Kurse geliefert hat.
 */
export const MOCK_QUOTES: QuoteMap = new Map<string, QuoteCacheEntry>([
  [
    'IE00B3RBWM25',
    {
      isin: 'IE00B3RBWM25',
      symbol: 'VGWL.DE',
      price: 162.42,
      currency: 'EUR',
      volatility: 12.82,
      name: 'Vanguard FTSE All-World UCITS ETF',
      ter: 0.22,
      accumulating: true,
      fetchedAt: NOW_ISO,
      cached: true,
      stale: false,
    },
  ],
  [
    'IE0032077012',
    {
      isin: 'IE0032077012',
      symbol: 'EQQQ.DE',
      price: 621.1,
      currency: 'EUR',
      volatility: 14.93,
      name: 'Invesco EQQQ Nasdaq-100 UCITS ETF',
      ter: 0.3,
      accumulating: false,
      fetchedAt: NOW_ISO,
      cached: true,
      stale: false,
    },
  ],
  [
    'US0846707026',
    {
      isin: 'US0846707026',
      symbol: 'BRYN.DE',
      price: 449.55,
      currency: 'EUR',
      volatility: 16.7,
      name: 'Berkshire Hathaway Inc. Class B',
      ter: null,
      accumulating: null,
      fetchedAt: NOW_ISO,
      cached: true,
      stale: false,
    },
  ],
  [
    'IE00B5L8K969',
    {
      isin: 'IE00B5L8K969',
      symbol: 'CEBL.DE',
      price: 253.55,
      currency: 'EUR',
      volatility: 16.29,
      name: 'iShares Core MSCI Emerging Markets IMI UCITS ETF',
      ter: 0.18,
      accumulating: true,
      fetchedAt: NOW_ISO,
      cached: true,
      stale: false,
    },
  ],
  [
    'IE00BQN1K901',
    {
      isin: 'IE00BQN1K901',
      symbol: 'CEMS.DE',
      price: 14.14,
      currency: 'EUR',
      volatility: 13.45,
      name: 'iShares MSCI EM Small Cap UCITS ETF',
      ter: 0.74,
      accumulating: false,
      fetchedAt: NOW_ISO,
      cached: true,
      stale: false,
    },
  ],
  [
    'IE00BF4RFH31',
    {
      isin: 'IE00BF4RFH31',
      symbol: 'IUSN.DE',
      price: 9.21,
      currency: 'EUR',
      volatility: 14.71,
      name: 'iShares MSCI World Small Cap UCITS ETF',
      ter: 0.35,
      accumulating: true,
      fetchedAt: NOW_ISO,
      cached: true,
      stale: false,
    },
  ],
  [
    'IE00BCRY6557',
    {
      isin: 'IE00BCRY6557',
      symbol: 'IS3M.DE',
      price: 101.1,
      currency: 'EUR',
      volatility: 0.63,
      name: 'iShares $ Treasury Bond 7-10yr UCITS ETF',
      ter: 0.07,
      accumulating: false,
      fetchedAt: NOW_ISO,
      cached: true,
      stale: false,
    },
  ],
  [
    'DE000A0S9GB0',
    {
      isin: 'DE000A0S9GB0',
      symbol: '4GLD.DE',
      price: 118.6,
      currency: 'EUR',
      volatility: 11.56,
      name: 'Xetra-Gold (Euwax Gold II)',
      ter: 0.0,
      accumulating: null,
      fetchedAt: NOW_ISO,
      cached: true,
      stale: false,
    },
  ],
])

export const MOCK_SETTINGS: Settings = {
  activePortfolioId: MOCK_PORTFOLIO.id,
  totalRounding: -3,
  bands: { lowerPercent: 6, upperPercent: 15 },
  saveAssetGrenze: 170_000,
  investmentReservePercent: 10,
  currentRebalancingBudget: 230_000,
  currency: 'EUR',
  refresh: { autoOnLoad: true, staleAfterMinutes: 60 },
  ui: {
    columns: {
      volatility: true,
      optimalUnits: true,
      groupSharePercent: false,
      deltaEuro: true,
      deltaMax: false,
      deltaPercentAbs: false,
    },
  },
}
