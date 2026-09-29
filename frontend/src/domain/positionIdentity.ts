import { resolveKind } from './links'
import type { PositionResult } from './rebalancing'

/** Aktuelle StockInfo-Angabe hat Vorrang; Typkennungen sind ein offener Vertrag. */
export function positionType(row: PositionResult): string | null {
  return resolveKind(row.position, row.quote?.type)
}

/** StockInfo kennzeichnet reine ISIN-Assets ausdrücklich über die Identität. */
export function positionSymbol(row: PositionResult): string | null {
  if (row.position.group === 'cash') return null
  if (row.quote) return row.quote.identity.kind === 'isin_only' ? null : row.quote.symbol

  const symbol = row.position.symbol.trim()
  return symbol && symbol.toUpperCase() !== row.position.isin?.trim().toUpperCase()
    ? symbol
    : null
}

export function positionIsin(row: PositionResult): string | null {
  return row.quote?.isin ?? row.position.isin
}

/** Für die Hauptzeile bleibt bei Assets ohne Ticker die ISIN die Kennung. */
export function positionPrimaryLabel(row: PositionResult): string {
  return positionSymbol(row) ?? positionIsin(row) ?? row.position.displayName
}
