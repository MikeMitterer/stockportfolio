import { describe, expect, it } from 'vitest'
import { demoPortfolio } from '@/db/seed'
import quoteFixtures from '../../scripts/fixtures/demo-quotes.json'

describe('Kurse des lokalen Beispieldepots', () => {
  it('deckt jede Marktposition mit passender Identität und einem verwendbaren Kurs ab', () => {
    const positions = demoPortfolio().positions.filter((position) => position.group !== 'cash')
    const quotes = new Map(quoteFixtures.map((quote) => [quote.identity.isin, quote]))

    expect(quotes.size).toBe(positions.length)
    for (const position of positions) {
      const quote = quotes.get(position.isin!)
      expect(quote).toMatchObject({
        symbol: position.symbol,
        name: position.displayName,
        type: position.kind,
      })
      expect(quote?.price).toBeGreaterThan(0)
      expect(quote?.currency).toBe('EUR')
    }
  })
})
