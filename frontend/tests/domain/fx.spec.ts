import { describe, expect, it } from 'vitest'
import { convertedPrice, fxKey } from '@/domain/fx'
import { computeRebalancing } from '@/domain/rebalancing'
import { computeTradePlan } from '@/domain/tradePlan'
import { emptyPortfolio } from '@/db/seed'
import { defaultSettings } from '@/stores/settings'
import { toQuoteCacheEntry } from '@/api/mappers'
import { normalizeQuote } from '@/api/normalizers'
import fixture from '../fixtures/stockinfo/quote-200.json'
import type { FxRate } from '@/types/fx'

const rate: FxRate = { base: 'USD', quote: 'EUR', rate: 0.8, quoteTime: '2026-09-10T10:00:00Z', fetchedAt: '2026-09-10T10:01:00Z', cached: true, stale: false, source: null }
function quote(currency = 'USD', price = 100) {
  return toQuoteCacheEntry(normalizeQuote({ ...fixture.response.body, currency, price }, 'test'))
}

describe('Umrechnung in die Depotwährung', () => {
  it('multipliziert in der angefragten Richtung und erhält den Originalkurs', () => {
    const original = quote()
    expect(convertedPrice(original, 'EUR', new Map([[fxKey('USD', 'EUR'), rate]]))).toMatchObject({ price: 80, rate: 0.8 })
    expect(original.price).toBe(100)
    expect(original.currency).toBe('USD')
    expect(convertedPrice(original, 'USD', new Map())).toMatchObject({ price: 100, rate: 1 })
    expect(convertedPrice(original, 'CAD', new Map())).toBeNull()
  })

  it('behandelt unbrauchbare Originalkurse mit und ohne FX gleich', () => {
    for (const price of [0, -1, NaN, Infinity]) {
      const invalid = { ...quote(), price }
      expect(convertedPrice(invalid, 'USD', new Map())).toBeNull()
      expect(convertedPrice(invalid, 'EUR', new Map([[fxKey('USD', 'EUR'), rate]]))).toBeNull()
    }
  })

  it('behandelt Pence als Hundertstel GBP, auch ohne FX-Abruf', () => {
    expect(convertedPrice(quote('GBp', 1250), 'GBP', new Map())).toMatchObject({ price: 12.5, rate: 0.01 })
    const sterling = { ...rate, base: 'GBP', rate: 1.2 }
    expect(convertedPrice(quote('GBp', 1250), 'EUR', new Map([[fxKey('GBP', 'EUR'), sterling]]))).toMatchObject({ price: 15, rate: 0.012 })
  })

  it('verwendet alte gültige Kurse gekennzeichnet und ignoriert ungültige Raten', () => {
    expect(convertedPrice(quote(), 'EUR', new Map([[fxKey('USD', 'EUR'), { ...rate, stale: true }]]))?.fx?.stale).toBe(true)
    for (const invalid of [0, -1, NaN, Infinity]) expect(convertedPrice(quote(), 'EUR', new Map([[fxKey('USD', 'EUR'), { ...rate, rate: invalid }]]))).toBeNull()
  })

  it('verwendet denselben umgerechneten Stückpreis für Summen, Stückvorschlag und Handel', () => {
    const portfolio = emptyPortfolio('EUR-Depot', 'EUR')
    portfolio.positions = [{ id: 'asset', isin: null, symbol: 'USD-ASSET', displayName: '', kind: 'etf', group: 'stocks', units: 10, targetPercent: 50, enabled: true }, { ...portfolio.positions[0]!, units: 800, targetPercent: 50 }]
    const settings = { ...defaultSettings(portfolio.id), totalRounding: 0 }
    const quotes = new Map([['USD-ASSET', quote()]])
    const rates = new Map([[fxKey('USD', 'EUR'), rate]])
    const result = computeRebalancing(portfolio, quotes, settings, new Date(), rates)
    expect(result.total).toBe(1600)
    expect(result.rows[0]).toMatchObject({ marketValue: 800, basePrice: 80, unitsDelta: 0, isActive: true })
    const plan = computeTradePlan(result.rows, { asset: 2 }, result.total, settings.bands, 0)
    expect(plan.outlay).toBe(160)
    expect(plan.rows[0]?.marketValueAfter).toBe(960)
    const usd = computeRebalancing({ ...portfolio, baseCurrency: 'USD' }, quotes, settings)
    expect(usd.rows[0]?.marketValue).toBe(1000)
    const cad = computeRebalancing({ ...portfolio, baseCurrency: 'CAD' }, quotes, settings, new Date(), new Map([[fxKey('USD', 'CAD'), { ...rate, quote: 'CAD', rate: 1.4 }]]))
    expect(cad.total).toBe(2200)
    expect(cad.rows[0]?.marketValue).toBe(1400)
    expect(cad.groups.find(group => group.group === 'stocks')?.actualValue).toBe(1400)
    expect(cad.liquidity.liquidAssets).toBe(800)
    const missing = computeRebalancing(portfolio, quotes, settings)
    expect(missing.total).toBe(800)
    expect(missing.rows[0]).toMatchObject({ isActive: false, excludedReason: 'currency', unitsDelta: 0 })
    expect(computeTradePlan(missing.rows, { asset: 2 }, missing.total, settings.bands, 0).outlay).toBe(0)
  })
})
