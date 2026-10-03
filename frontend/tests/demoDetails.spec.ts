import { describe, expect, it } from 'vitest'
import { demoPortfolio } from '@/db/seed'
import { parseBackup } from '@/domain/backup'
import demoDetails from '../../scripts/fixtures/demo-details.json'
import quoteFixtures from '../../scripts/fixtures/demo-quotes.json'
import demoBackup from './fixtures/browser/demo-details.backup.json'

/*
 * `--demo-details` im Teststack zeigt genau die Instrumente aus
 * `demo-details.json`, mit Gattung und Detailwerten aus derselben Datei. Den
 * Namen liefert `names` oder das Beispieldepot (`demo-quotes.json`); sonst
 * bliebe der Testfallname aus dem Skript stehen.
 */
const names = new Map<string, string>([
  ...quoteFixtures.map((quote) => [quote.symbol, quote.name] as [string, string]),
  ...Object.entries(demoDetails.names),
])
const instruments = Object.entries(demoDetails.instruments) as [string, Record<string, unknown>][]
// Gattungen aus StockInfos `QuoteResponse.type`.
const stockInfoTypes = ['stock', 'etf', 'etc', 'fund', 'crypto', 'bond']

describe('Lesbare Demodaten des Teststacks', () => {
  it('gibt jedem Instrument einen echten, eindeutigen Namen', () => {
    const shown = instruments.map(([symbol]) => names.get(symbol))
    for (const [index, name] of shown.entries()) {
      expect(name, instruments[index]?.[0]).toBeTruthy()
      expect(name).not.toMatch(/^T\d+\b/)
    }
    expect(new Set(shown).size).toBe(shown.length)
  })

  it('deckt jede Marktposition des Beispieldepots ab', () => {
    const symbols = new Set(instruments.map(([symbol]) => symbol))
    for (const position of demoPortfolio().positions.filter((entry) => entry.group !== 'cash')) {
      expect(symbols.has(position.symbol!), position.symbol).toBe(true)
    }
  })

  it('hält die Werte in den Grenzen von StockInfos Feldkatalog', () => {
    for (const [symbol, values] of instruments) {
      // StockInfo berechnet die Volatilität für Listings, nicht für reine
      // ISINs; deren Symbol ist im Testserver die ISIN selbst.
      const isinOnly = /^[A-Z]{2}[A-Z0-9]{9}\d$/.test(symbol)
      expect(values.volatility !== undefined, symbol).toBe(!isinOnly)
      if (values.volatility !== undefined) {
        expect(values.volatility as number, symbol).toBeGreaterThan(0)
        expect(values.volatility as number, symbol).toBeLessThanOrEqual(500)
      }
      if (values.ter !== undefined) {
        expect(values.ter as number, symbol).toBeGreaterThanOrEqual(0)
        expect(values.ter as number, symbol).toBeLessThanOrEqual(5)
      }
      // Fondsgröße in Millionen: unter 2.000.000 (2 Billionen).
      const fundSize = (values.fund_size ?? (values.manual_fund_size as { value: number } | undefined)?.value) as
        | number
        | undefined
      if (fundSize !== undefined) {
        expect(fundSize, symbol).toBeGreaterThan(0)
        expect(fundSize, symbol).toBeLessThan(2_000_000)
      }
    }
  })

  it('nennt für jedes Instrument eine Gattung, die StockInfo kennt', () => {
    for (const [symbol, values] of instruments) {
      expect(stockInfoTypes, symbol).toContain(values.type)
    }
  })

  it('baut das Backup-Testdepot nur aus Demo-Instrumenten mit gleicher Gattung', () => {
    const result = parseBackup(JSON.stringify(demoBackup))
    expect(result.ok).toBe(true)
    if (!result.ok) return
    const positions = result.backup.portfolio.positions.filter((position) => position.group !== 'cash')
    expect(positions.length).toBeGreaterThan(0)
    for (const position of positions) {
      const values = demoDetails.instruments[position.symbol as keyof typeof demoDetails.instruments]
      expect(values, position.symbol).toBeDefined()
      expect(position.kind, position.symbol).toBe(values?.type)
    }
    // Jedes Instrument mit Detailwerten steht im Depot; das Prüfskript sieht sie nur dort.
    const held = new Set(positions.map((position) => position.symbol))
    for (const [symbol, values] of instruments) {
      const hasDetails = Object.keys(values).some((name) => name !== 'type')
      expect(held.has(symbol), symbol).toBe(hasDetails)
    }
  })

  it('führt TER und Fondsgröße nur bei ETF und ETC, wie justETF sie deklariert', () => {
    for (const [symbol, values] of instruments) {
      const isFund = values.type === 'etf' || values.type === 'etc'
      expect('ter' in values, symbol).toBe(isFund)
      expect('fund_size' in values || 'manual_fund_size' in values, symbol).toBe(isFund)
    }
  })
})
