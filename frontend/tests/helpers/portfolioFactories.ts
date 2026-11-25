/**
 * Testfabriken für Kurs, Position, Einstellungen und Depot (T-136).
 *
 * Gemeinsam für die Rechen-Tests unter `tests/domain/`. Jede Fabrik liefert
 * einen vollständigen, gültigen Wert mit neutralen Vorgaben; der Test schneidet
 * ihn per `overrides` auf seinen Fall zu und nennt dabei nur, worauf es ankommt.
 */

import type { Portfolio, Position, QuoteCacheEntry, Settings } from '@/types/portfolio'

export function makeQuote(overrides: Partial<QuoteCacheEntry> = {}): QuoteCacheEntry {
  return {
    identity: { kind: 'isin_only', isin: 'IE0000000000' },
    isin: 'IE0000000000',
    symbol: 'TEST.DE',
    price: 100,
    currency: 'EUR',
    type: 'etf',
    volatility: null,
    name: null,
    ter: null,
    accumulating: null,
    fetchedAt: '2026-01-01T00:00:00.000Z',
    cached: true,
    stale: false,
    ...overrides,
  }
}

export function makePosition(overrides: Partial<Position> = {}): Position {
  return {
    id: 'p-test',
    isin: 'IE0000000000',
    symbol: 'TEST.DE',
    displayName: 'Test',
    group: 'stocks',
    kind: 'etf',
    units: 10,
    targetPercent: 50,
    enabled: true,
    ...overrides,
  }
}

/** Einstellungen mit Bändern 10/20 %, ohne Puffer und Mindestgröße, Auslöser „bands“. */
export function makeSettings(overrides: Partial<Settings> = {}): Settings {
  return {
    activePortfolioId: 'p1',
    totalRounding: 0,
    bands: { lowerPercent: 10, upperPercent: 20 },
    securityBuffer: { mode: 'absolute', value: 0 },
    minTradeSize: { mode: 'absolute', value: 0 },
    rebalancing: { trigger: 'bands', intervalMonths: 12 },
    refresh: { autoOnLoad: true, staleAfterMinutes: 60 },
    links: [],
    referenceIndex: null,
    ui: { notificationSeconds: 0, historyPeriod: 'month' },
    ...overrides,
  }
}

/** Kennung, Name und Zeitstempel eines Testdepots; Positionen setzt der Test selbst. */
export const PORTFOLIO_HEAD: Readonly<Pick<Portfolio, 'id' | 'name' | 'createdAt' | 'updatedAt'>> =
  {
    id: 'p1',
    name: 'Test',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  }
