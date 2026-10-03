import { describe, expect, it } from 'vitest'
import { demoPortfolio } from '@/db/seed'
import demoDetails from '../../scripts/fixtures/demo-details.json'
import quoteFixtures from '../../scripts/fixtures/demo-quotes.json'

/*
 * `--demo-details` im Teststack zeigt genau die Instrumente aus
 * `demo-details.json`. Den Namen liefert `names` oder das Beispieldepot
 * (`demo-quotes.json`); sonst bliebe der Testfallname aus dem Skript stehen.
 */
const names = new Map<string, string>([
  ...quoteFixtures.map((quote) => [quote.symbol, quote.name] as [string, string]),
  ...Object.entries(demoDetails.names),
])
const quoteTypes = new Map<string, string>(quoteFixtures.map((quote) => [quote.symbol, quote.type]))
// Gattung der Demo-Instrumente außerhalb des Beispieldepots, wie im Skript angelegt.
const scriptTypes: [string, string][] = [['EUNL.DE', 'etf'], ['VTI', 'etf'], ['AAPL', 'stock'], ['DE0001135275', 'bond']]
for (const [symbol, type] of scriptTypes) {
  quoteTypes.set(symbol, type)
}
const instruments = Object.entries(demoDetails.instruments) as [string, Record<string, unknown>][]

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
      expect(values.volatility, symbol).toBeGreaterThan(0)
      expect(values.volatility as number).toBeLessThanOrEqual(500)
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

  it('führt TER und Fondsgröße nur bei ETFs', () => {
    for (const [symbol, values] of instruments) {
      expect(quoteTypes.has(symbol), symbol).toBe(true)
      const isEtf = quoteTypes.get(symbol) === 'etf'
      expect('ter' in values, symbol).toBe(isEtf)
      expect('fund_size' in values || 'manual_fund_size' in values, symbol).toBe(isEtf)
    }
  })
})
