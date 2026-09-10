import type { FxMap, FxRate } from '@/types/fx'
import type { Portfolio, QuoteCacheEntry } from '@/types/portfolio'

export const ISO_CURRENCIES: readonly string[] = Intl.supportedValuesOf('currency')

export function isCurrency(value: unknown): value is string {
  return typeof value === 'string' && ISO_CURRENCIES.includes(value)
}

/** Bestehende Depots waren ausdrücklich EUR-Depots. */
export function baseCurrencyOf(portfolio: Portfolio | null): string {
  return portfolio?.baseCurrency ?? 'EUR'
}

export function fxKey(base: string, quote: string): string {
  return `${base}/${quote}`
}

/** Pence sind eine Einheit der Währung GBP, keine eigene FX-Währung. */
export function majorCurrency(currency: string): string {
  return currency === 'GBp' ? 'GBP' : currency
}

export interface ConvertedPrice {
  price: number
  /** Faktor vom unveränderten Originalkurs zum Depotpreis, einschließlich Pence. */
  rate: number
  fx: FxRate | null
}

export function convertedPrice(quote: QuoteCacheEntry | null, target: string, rates: FxMap): ConvertedPrice | null {
  if (!quote || !Number.isFinite(quote.price) || quote.price <= 0) return null
  const base = majorCurrency(quote.currency)
  const scale = quote.currency === 'GBp' ? 0.01 : 1
  if (base === target) return { price: quote.price * scale, rate: scale, fx: null }
  const fx = rates.get(fxKey(base, target))
  if (!fx || fx.base !== base || fx.quote !== target || !Number.isFinite(fx.rate) || fx.rate <= 0) return null
  const rate = scale * fx.rate
  const price = quote.price * rate
  return Number.isFinite(price) && price > 0 ? { price, rate, fx } : null
}
