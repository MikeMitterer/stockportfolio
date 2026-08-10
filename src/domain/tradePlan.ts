/**
 * Rechnung für den Rebalancing-Plan.
 *
 * Abgeleitet aus den Spalten AA–AG der Excel-Vorlage: dort trägt man je
 * Position eine Stückzahl ein und sieht, welcher Geldfluss daraus folgt und
 * wo der Anteil danach liegt.
 *
 * Reine Funktionen, kein DOM, kein Reactivity.
 */

import {
  lowerBand,
  marketValue,
  quoteFor,
  suggestion,
  targetValue,
  upperBand,
  type PositionResult,
} from './rebalancing'
import type { Bands, Portfolio, QuoteMap, Suggestion } from '@/types/portfolio'

/** Geplante Stückzahlen je Position (`+` kaufen, `−` verkaufen). */
export type TradeMap = Record<string, number>

export interface TradePlanRow {
  /** Ausgangslage der Position — Marktwert, Ziel, Bänder, aktueller Status. */
  current: PositionResult
  /** Geplante Stückzahl: positiv kaufen, negativ verkaufen. */
  tradeUnits: number
  /**
   * Geldfluss des Trades. **Negativ = Geld fließt ab** (Kauf),
   * **positiv = Geld kommt herein** (Verkauf) — wie Excel-Spalte AD.
   */
  cashFlow: number
  /** Bestand nach Ausführung. */
  unitsAfter: number
  /** Marktwert nach Ausführung. */
  marketValueAfter: number
  /** Anteil am Gesamtvermögen nach Ausführung — die Kernzahl (Excel AF). */
  percentAfter: number
  /** Ziel-Anteil in Prozent, zum Vergleich. */
  targetPercent: number
  /** Bandgrenzen als Anteil am Gesamtvermögen (Excel AE / AG). */
  lowerBandPercent: number
  upperBandPercent: number
  /** Status nach Ausführung — landet die Position im Band? */
  suggestionAfter: Suggestion
  /** Unverbindlicher Vorschlag in Stück, aus den freigemachten Mitteln (Excel AC). */
  suggestedUnits: number
}

export interface TradePlanResult {
  rows: TradePlanRow[]
  /**
   * Summe aller Geldflüsse. Null heißt: der Plan geht auf — jeder Euro, der
   * gekauft wird, kommt aus einem Verkauf oder aus Cash/Geldmarkt.
   * Negativ heißt: es fehlt Deckung.
   */
  netCashFlow: number
  /** Summe der Zuflüsse: Verkäufe und Entnahmen aus Cash/Geldmarkt. */
  proceeds: number
  /** Summe der Käufe (Abfluss, als positiver Betrag). */
  outlay: number
  /** Es wird mehr gekauft, als der Plan an Deckung hergibt. */
  underfunded: boolean
  /** Liquide Mittel (Geldmarkt + Cash) nach Ausführung des Plans. */
  liquidAfter: number
  /** Der Plan würde den Sicherheitspuffer angreifen. */
  bufferBreached: boolean
  /** Wie viel aus Cash/Geldmarkt entnommen werden darf, ohne den Puffer zu verletzen. */
  reserveAvailable: number
  /** Anteil-Summe nach Ausführung — sollte nahe 100 % liegen. */
  percentAfterSum: number
}

/**
 * Vorschlag in Stück für eine Position.
 *
 * Verteilt die im Plan freigemachten Mittel nach dem Anteil, den die
 * Position innerhalb ihrer Gruppe am Ziel hat, und rechnet ihn in Stück um
 * (Excel AC). Auf ganze Stück gerundet — Bruchteile lassen sich nicht kaufen.
 * Die **Eingabe** ist davon unberührt und nimmt jede Stückzahl an.
 *
 * @param budget       Zur Verfügung stehender Betrag.
 * @param groupShare   Anteil der Position am Gruppen-Ziel, in Prozent.
 * @param price        Kurs je Stück.
 */
export function suggestedUnitsFor(budget: number, groupShare: number, price: number): number {
  if (price <= 0 || budget <= 0) return 0
  return Math.round((budget * groupShare) / 100 / price)
}

/** Anteil einer Position am Ziel ihrer Gruppe, in Prozent. */
export function groupSharePercent(
  position: { group: string; targetPercent: number },
  portfolio: Portfolio,
): number {
  const groupTarget = portfolio.positions
    .filter((entry) => entry.enabled && entry.group === position.group)
    .reduce((sum, entry) => sum + entry.targetPercent, 0)

  if (groupTarget === 0) return 0
  return (position.targetPercent * 100) / groupTarget
}

/**
 * Rechnet den Plan durch.
 *
 * Es gibt kein abstraktes Budget: Jeder Euro, der gekauft wird, muss im Plan
 * sichtbar herkommen — aus dem Verkauf eines Papiers oder aus einer Entnahme
 * bei Cash bzw. Geldmarkt (dort als negative Stückzahl eingetragen). Der
 * Sicherheitspuffer begrenzt, wie weit Cash und Geldmarkt dabei sinken dürfen.
 *
 * @param rows           Ergebniszeilen aus `computeRebalancing` (nur aktive).
 * @param trades         Geplante Stückzahlen je Positions-ID.
 * @param total          Gesamtvermögen — Bezugsgröße für alle Prozentangaben.
 * @param bands          Toleranzbänder.
 * @param portfolio      Für die Gruppenanteile der Vorschläge.
 * @param securityBuffer Betrag, der als Sicherheit stehen bleiben soll.
 */
export function computeTradePlan(
  rows: PositionResult[],
  trades: TradeMap,
  total: number,
  bands: Bands,
  portfolio: Portfolio,
  securityBuffer: number,
): TradePlanResult {
  // Zuerst die Zuflüsse ermitteln — sie sind die Grundlage für die Vorschläge.
  const inflow = rows
    .filter((row) => row.isActive)
    .reduce((sum, row) => {
      const units = trades[row.position.id] ?? 0
      const flow = -units * priceOfRow(row)
      return flow > 0 ? sum + flow : sum
    }, 0)

  const planRows: TradePlanRow[] = rows
    .filter((row) => row.isActive)
    .map((row) => {
      const price = priceOfRow(row)
      const tradeUnits = trades[row.position.id] ?? 0

      const unitsAfter = row.position.units + tradeUnits
      const marketValueAfter = row.position.group === 'cash' ? unitsAfter : unitsAfter * price
      const percentAfter = total > 0 ? (marketValueAfter * 100) / total : 0

      const target = row.position.targetPercent

      return {
        current: row,
        tradeUnits,
        // Kauf kostet Geld (negativ), Verkauf bringt welches (positiv).
        cashFlow: -tradeUnits * price,
        unitsAfter,
        marketValueAfter,
        percentAfter,
        targetPercent: target,
        lowerBandPercent: target * (1 - bands.lowerPercent / 100),
        upperBandPercent: target * (1 + bands.upperPercent / 100),
        suggestionAfter: suggestion(
          marketValueAfter,
          lowerBand(targetValue(row.position, total), bands),
          upperBand(targetValue(row.position, total), bands),
        ),
        // Verteilt, was der Plan bislang freigemacht hat. Solange nichts
        // verkauft oder entnommen wurde, gibt es auch nichts vorzuschlagen.
        suggestedUnits: suggestedUnitsFor(
          inflow,
          groupSharePercent(row.position, portfolio),
          price,
        ),
      }
    })

  const proceeds = planRows
    .filter((row) => row.cashFlow > 0)
    .reduce((sum, row) => sum + row.cashFlow, 0)

  const outlay = planRows
    .filter((row) => row.cashFlow < 0)
    .reduce((sum, row) => sum - row.cashFlow, 0)

  // Liquide Mittel nach dem Plan — der Puffer darf nicht unterschritten werden.
  const liquidAfter = planRows
    .filter(
      (row) =>
        row.current.position.group === 'cash' || row.current.position.group === 'moneymarket',
    )
    .reduce((sum, row) => sum + row.marketValueAfter, 0)

  const liquidBefore = rows
    .filter(
      (row) => row.isActive && (row.position.group === 'cash' || row.position.group === 'moneymarket'),
    )
    .reduce((sum, row) => sum + row.marketValue, 0)

  return {
    rows: planRows,
    netCashFlow: proceeds - outlay,
    proceeds,
    outlay,
    underfunded: outlay - proceeds > 0.001,
    liquidAfter,
    bufferBreached: liquidAfter < securityBuffer - 0.001,
    reserveAvailable: Math.max(0, liquidBefore - securityBuffer),
    percentAfterSum: planRows.reduce((sum, row) => sum + row.percentAfter, 0),
  }
}

/** Kurs je Stück; Cash rechnet mit 1, weil `units` dort der Betrag ist. */
function priceOfRow(row: PositionResult): number {
  if (row.position.group === 'cash') return 1
  return row.quote?.price ?? 0
}

/** Leert den Plan. */
export function emptyTrades(): TradeMap {
  return {}
}

/**
 * Hat der Plan überhaupt Einträge?
 * Nullwerte zählen nicht — sie sind dasselbe wie „nichts geplant".
 */
export function hasTrades(trades: TradeMap): boolean {
  return Object.values(trades).some((units) => units !== 0)
}

/** Marktwert einer Position vor dem Trade — für die Anzeige. */
export function currentMarketValue(
  positionId: string,
  portfolio: Portfolio,
  quotes: QuoteMap,
): number {
  const position = portfolio.positions.find((entry) => entry.id === positionId)
  if (!position) return 0
  return marketValue(position, quoteFor(position, quotes))
}
