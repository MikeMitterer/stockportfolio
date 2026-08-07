/**
 * Reine Berechnungsfunktionen für Tolerance-Band-Rebalancing.
 * 1:1 abgeleitet aus der Excel-Vorlage (Spalten K, L, R, Q, S, U, X, Y, Z, AC).
 *
 * Kein DOM, kein Reactivity, keine API — vollständig unit-testbar.
 */

import type {
  AssetGroup,
  Bands,
  Portfolio,
  Position,
  QuoteCacheEntry,
  QuoteMap,
  Settings,
  Suggestion,
} from '@/types/portfolio'

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
 * Marktwert einer Position in EUR (Excel Spalte K = G × I).
 * Für Cash: `units` ist der EUR-Betrag selbst.
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
): number {
  return portfolio.positions
    .filter((position) => position.enabled && position.group === group)
    .reduce((sum, position) => sum + marketValue(position, quoteFor(position, quotes)), 0)
}

/**
 * Gesamtsumme des Portfolios (Excel I3 = ROUND(K7+K14+K16+K19, -3)).
 * Rundung auf `settings.totalRounding` (z.B. -3 → Tausender).
 */
export function totalValue(portfolio: Portfolio, quotes: QuoteMap, rounding: number): number {
  const raw = portfolio.positions
    .filter((position) => position.enabled)
    .reduce((sum, position) => sum + marketValue(position, quoteFor(position, quotes)), 0)
  return roundToPlace(raw, rounding)
}

/** IST-% am Gesamtvermögen (Excel L = K × 100 / I3). */
export function actualPercent(marketValueEur: number, total: number): number {
  if (total === 0) return 0
  return (marketValueEur * 100) / total
}

/** Ziel-Wert einer Position in EUR (Excel R = I3 / 100 × M). */
export function targetValue(position: Position, total: number): number {
  return (total * position.targetPercent) / 100
}

/** Untere Bandgrenze in EUR (Excel Q = R − R × G22 %). */
export function lowerBand(target: number, bands: Bands): number {
  return target * (1 - bands.lowerPercent / 100)
}

/** Obere Bandgrenze in EUR (Excel S = R + R × H22 %). */
export function upperBand(target: number, bands: Bands): number {
  return target * (1 + bands.upperPercent / 100)
}

/** Vorschlag: `sell` wenn MW über Upper, `buy` wenn unter Lower, sonst `ok`. */
export function suggestion(marketValueEur: number, low: number, high: number): Suggestion {
  if (marketValueEur > high) return 'sell'
  if (marketValueEur < low) return 'buy'
  return 'ok'
}

/** Relatives Delta in % (Excel X = IF(R<>0, U × 100 / R, 100)). Positiv = übergewichtet. */
export function relativeDeltaPercent(actualEur: number, targetEur: number): number {
  if (targetEur === 0) return 0
  return ((actualEur - targetEur) * 100) / targetEur
}

/** Anzahl Stück, um die die Position vom Ziel abweicht (Excel Z = U / I × -1). */
export function unitsDelta(
  actualEur: number,
  targetEur: number,
  quote: QuoteCacheEntry | null,
): number {
  if (!quote || quote.price === 0) return 0
  return (targetEur - actualEur) / quote.price
}

/** Rundet auf 10^(-place). place=-2 → auf 100er, place=-3 → auf 1000er. */
export function roundToPlace(value: number, place: number): number {
  const factor = Math.pow(10, place)
  return Math.round(value / factor) * factor
}

/**
 * Ist die Position „nahe" der Bandgrenze (Vorwarnstufe, gelber Badge)?
 * Kriterium: relatives Delta ist innerhalb 1 %-Punkt der Bandgrenze.
 */
export function isNearBand(actualEur: number, low: number, high: number, target: number): boolean {
  if (target === 0) return false
  if (actualEur < low || actualEur > high) return false
  const upperMargin = ((high - actualEur) * 100) / target
  const lowerMargin = ((actualEur - low) * 100) / target
  return upperMargin <= 1 || lowerMargin <= 1
}

// ────────────────────────────────────────────────────────────────────────────
// Aggregator
// ────────────────────────────────────────────────────────────────────────────

export interface PositionResult {
  position: Position
  quote: QuoteCacheEntry | null
  marketValue: number
  actualPercent: number
  targetValue: number
  lowerBand: number
  upperBand: number
  suggestion: Suggestion
  unitsDelta: number
  relativeDeltaPercent: number
  isNearBand: boolean
}

export interface GroupResult {
  group: AssetGroup
  actualValue: number
  actualPercent: number
  targetPercent: number
  targetValue: number
  lowerBand: number
  upperBand: number
  suggestion: Suggestion
  deltaEuro: number
}

export interface LiquidityResult {
  liquidBuffer: number
  liquidBufferPercent: number
  targetReserveEuro: number
  sellForReserve: number
}

export interface RebalancingResult {
  total: number
  rounding: number
  groups: GroupResult[]
  rows: PositionResult[]
  liquidity: LiquidityResult
  computedAt: string
}

const GROUPS: readonly AssetGroup[] = ['stocks', 'bonds', 'metals', 'cash'] as const

/** Ziel-% der Gruppe = Summe der Ziel-% der Sub-Positionen. */
function groupTargetPercent(group: AssetGroup, portfolio: Portfolio): number {
  return portfolio.positions
    .filter((position) => position.enabled && position.group === group)
    .reduce((sum, position) => sum + position.targetPercent, 0)
}

/**
 * Hauptaggregator: liefert für ein Portfolio + Kurse + Settings alle
 * abgeleiteten Werte fürs UI.
 */
export function computeRebalancing(
  portfolio: Portfolio,
  quotes: QuoteMap,
  settings: Settings,
): RebalancingResult {
  const total = totalValue(portfolio, quotes, settings.totalRounding)
  const bands = settings.bands

  const rows: PositionResult[] = portfolio.positions
    .filter((position) => position.enabled)
    .map((position) => {
      const quote = quoteFor(position, quotes)
      const mv = marketValue(position, quote)
      const target = targetValue(position, total)
      const low = lowerBand(target, bands)
      const high = upperBand(target, bands)
      return {
        position,
        quote,
        marketValue: mv,
        actualPercent: actualPercent(mv, total),
        targetValue: target,
        lowerBand: low,
        upperBand: high,
        suggestion: suggestion(mv, low, high),
        unitsDelta: unitsDelta(mv, target, quote),
        relativeDeltaPercent: relativeDeltaPercent(mv, target),
        isNearBand: isNearBand(mv, low, high, target),
      }
    })

  const groups: GroupResult[] = GROUPS.map((group) => {
    const actualValue = groupMarketValue(group, portfolio, quotes)
    const targetPercent = groupTargetPercent(group, portfolio)
    const target = (total * targetPercent) / 100
    const low = lowerBand(target, bands)
    const high = upperBand(target, bands)
    return {
      group,
      actualValue,
      actualPercent: actualPercent(actualValue, total),
      targetPercent,
      targetValue: target,
      lowerBand: low,
      upperBand: high,
      suggestion: suggestion(actualValue, low, high),
      deltaEuro: target - actualValue,
    }
  })

  const bondsValue = groupMarketValue('bonds', portfolio, quotes)
  const cashValue = groupMarketValue('cash', portfolio, quotes)
  const liquidBuffer = bondsValue + cashValue - settings.saveAssetGrenze
  const targetReserveEuro = roundToPlace(
    (total * settings.investmentReservePercent) / 100,
    -4,
  )
  const bondsTarget = (total * groupTargetPercent('bonds', portfolio)) / 100
  const sellForReserve = roundToPlace(
    bondsTarget + cashValue - settings.saveAssetGrenze - targetReserveEuro,
    -4,
  )

  const liquidity: LiquidityResult = {
    liquidBuffer,
    liquidBufferPercent: actualPercent(liquidBuffer, total),
    targetReserveEuro,
    sellForReserve,
  }

  return {
    total,
    rounding: settings.totalRounding,
    groups,
    rows,
    liquidity,
    computedAt: new Date().toISOString(),
  }
}
