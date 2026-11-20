/**
 * Bewertung je Position und Depot: Kurs zur Position finden, Marktwert und
 * Summen in der Depotwährung (aus `rebalancing.ts` herausgelöst, T-130).
 *
 * Kein DOM, kein Reactivity, keine API — vollständig unit-testbar.
 */

import { baseCurrencyOf, convertedPrice } from './fx'
import type { FxMap } from '@/types/fx'
import type { AssetGroup, Portfolio, Position, QuoteCacheEntry, QuoteMap } from '@/types/portfolio'

/** Cache-Key-Konvention: ISIN bevorzugt, Symbol als Fallback. */
export function quoteKey(position: Pick<Position, 'isin' | 'symbol'>): string {
  return position.isin ?? position.symbol
}

/** Kurs zu einer Position aus der QuoteMap holen (kann `null` sein für Cash). */
export function quoteFor(position: Position, quotes: QuoteMap): QuoteCacheEntry | null {
  if (position.group === 'cash') return null
  return quotes.get(quoteKey(position)) ?? null
}

/**
 * Marktwert einer Position in ihrer Kurswährung (Excel Spalte K = G × I).
 * Für Cash: `units` ist der Betrag in der Depotwährung.
 * Für Wertpapiere: `units × Kurs`. Kein Kurs → 0 (mit Warning).
 */
export function marketValue(position: Position, quote: QuoteCacheEntry | null): number {
  if (position.group === 'cash') return position.units
  if (!quote) return 0
  return position.units * quote.price
}

/** Marktwert-Summe aller aktiven Positionen einer Gruppe. */
export function groupMarketValue(
  group: AssetGroup,
  portfolio: Portfolio,
  quotes: QuoteMap,
  baseCurrency = baseCurrencyOf(portfolio),
  rates: FxMap = new Map(),
): number {
  return portfolio.positions
    .filter(
      (position) => position.group === group && countsIn(position, quotes, baseCurrency, rates),
    )
    .reduce((sum, position) => sum + baseValue(position, quotes, baseCurrency, rates), 0)
}

/**
 * Gesamtsumme des Portfolios (Excel I3 = ROUND(K7+K14+K16+K19, -3)).
 * Rundung auf `settings.totalRounding` (z.B. -3 → Tausender).
 */
export function totalValue(
  portfolio: Portfolio,
  quotes: QuoteMap,
  rounding: number,
  baseCurrency = baseCurrencyOf(portfolio),
  rates: FxMap = new Map(),
): number {
  const raw = portfolio.positions
    .filter((position) => countsIn(position, quotes, baseCurrency, rates))
    .reduce((sum, position) => sum + baseValue(position, quotes, baseCurrency, rates), 0)
  return roundToPlace(raw, rounding)
}

/** Notierungswährung und Depotwährung sind unabhängig; GBp ist eine Einheit von GBP. */
export function hasForeignCurrency(quote: QuoteCacheEntry | null, baseCurrency: string): boolean {
  return !!quote && quote.currency.toUpperCase() !== baseCurrency.toUpperCase()
}

/** Nur vollständige Bewertungen zählen; ausgeschlossene Zeilen bleiben sichtbar. */
function countsIn(
  position: Position,
  quotes: QuoteMap,
  baseCurrency: string,
  rates: FxMap,
): boolean {
  return (
    position.enabled &&
    (position.group === 'cash' ||
      convertedPrice(quoteFor(position, quotes), baseCurrency, rates) !== null)
  )
}

/** Wert einer Position in der Depotwährung; Cash zählt mit seinem Betrag, ohne Umrechnungskurs 0. */
function baseValue(
  position: Position,
  quotes: QuoteMap,
  baseCurrency: string,
  rates: FxMap,
): number {
  if (position.group === 'cash') return position.units
  return (
    position.units * (convertedPrice(quoteFor(position, quotes), baseCurrency, rates)?.price ?? 0)
  )
}

/**
 * Rundet analog zu Excel `ROUND(value, place)`:
 * - place = 0 → auf Ganze
 * - place = -2 → auf 100er
 * - place = -3 → auf 1000er
 * - place = 2 → auf 2 Nachkommastellen
 */
export function roundToPlace(value: number, place: number): number {
  const factor = Math.pow(10, -place)
  return Math.round(value / factor) * factor
}
