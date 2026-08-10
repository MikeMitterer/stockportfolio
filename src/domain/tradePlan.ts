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
  upperBand,
  type PositionResult,
} from './rebalancing'
import type { Bands, Portfolio, QuoteMap, Suggestion } from '@/types/portfolio'

/** Geplante Stückzahlen je Position (`+` kaufen, `−` verkaufen). */
export type TradeMap = Record<string, number>

/**
 * Probeweise Ziel-Anteile je Position, **nur für die Simulation**.
 *
 * Wer eine Position als Geldquelle nutzt, obwohl sie auf Ziel steht, ändert
 * damit seine Aufteilung — ohne angepasstes Ziel zeigt die Zeile hinterher
 * dauerhaft „Kaufen". Hier lässt sich das durchspielen; das echte Ziel im
 * Depot bleibt unberührt, bis die Trades tatsächlich ausgeführt sind.
 */
export type TargetMap = Record<string, number>

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
  /** Ziel-Anteil in Prozent, zum Vergleich — ggf. der probeweise gesetzte. */
  targetPercent: number
  /** Ist `targetPercent` ein Probewert und nicht das Ziel aus dem Depot? */
  targetOverridden: boolean
  /** Bandgrenzen als Anteil am Gesamtvermögen (Excel AE / AG). */
  lowerBandPercent: number
  upperBandPercent: number
  /** Status nach Ausführung — landet die Position im Band? */
  suggestionAfter: Suggestion
  /**
   * Abweichung vom Ziel nach dem Trade, in **Prozentpunkten**.
   * Ziel 10 %, danach 9,5 % → −0,5.
   */
  deviationAfter: number
  /**
   * Dieselbe Abweichung **relativ zum Ziel**, in Prozent.
   * Darauf sind die Toleranzbänder definiert: −0,5 von 10 sind −5 %.
   */
  relativeDeviationAfter: number
  /**
   * Liegt der Anteil nach dem Trade im Band?
   *
   * Das Ziel muss nicht exakt getroffen werden — innerhalb der Bänder ist
   * der Zustand in Ordnung, auch wenn eine Abweichung bleibt.
   */
  inBandAfter: boolean
  /**
   * Stückzahl, die zum Ziel fehlt (`+`) oder zu viel ist (`−`).
   *
   * Anders als ein Vorschlag aus einem Budget hängt das von nichts ab außer
   * Bestand, Kurs und Ziel — die Zahl steht also von Anfang an da.
   *
   * Nützliche Eigenschaft: Summieren sich die Ziel-Anteile auf 100 %, heben
   * sich die Deltas in Euro gegenseitig auf. Wer allen Deltas folgt, bekommt
   * einen Plan, der von selbst aufgeht.
   */
  deltaUnits: number
  /**
   * Stückzahl, die der Plan bei **dieser** Position insgesamt hätte, wenn sie
   * die offene Deckungslücke schließen soll. `null` heißt: kommt nicht in
   * Frage — entweder ist der Plan gedeckt, die Position ist nicht liquide,
   * oder der Bestand reicht nicht mehr.
   *
   * Gedacht für den Fall „ich kaufe zwei Papiere für 100.000 € nach — wie
   * viele Stück Geldmarkt muss ich dafür verkaufen?". Der Vorschlag steht in
   * jeder liquiden Zeile und bezieht sich stets auf die **aktuell** offene
   * Lücke: Deckt der Geldmarkt sie nicht ganz ab, zeigt Cash danach den Rest.
   */
  coverageUnits: number | null
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
  /** Summe der (ggf. probeweisen) Ziel-Anteile — muss weiterhin 100 % ergeben. */
  targetSum: number
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
 * @param securityBuffer Betrag, der als Sicherheit stehen bleiben soll.
 * @param targetOverrides Probeweise Ziele; leer heißt: Ziele aus dem Depot.
 */
export function computeTradePlan(
  rows: PositionResult[],
  trades: TradeMap,
  total: number,
  bands: Bands,
  securityBuffer: number,
  targetOverrides: TargetMap = {},
): TradePlanResult {
  const planRows: Omit<TradePlanRow, 'coverageUnits'>[] = rows
    .filter((row) => row.isActive)
    .map((row) => {
      const price = priceOfRow(row)
      const tradeUnits = trades[row.position.id] ?? 0

      const unitsAfter = row.position.units + tradeUnits
      const marketValueAfter = row.position.group === 'cash' ? unitsAfter : unitsAfter * price
      const percentAfter = total > 0 ? (marketValueAfter * 100) / total : 0

      const override = targetOverrides[row.position.id]
      const target = override ?? row.position.targetPercent
      const targetEur = (target * total) / 100
      const lowerPct = target * (1 - bands.lowerPercent / 100)
      const upperPct = target * (1 + bands.upperPercent / 100)

      return {
        current: row,
        tradeUnits,
        // Kauf kostet Geld (negativ), Verkauf bringt welches (positiv).
        cashFlow: -tradeUnits * price,
        unitsAfter,
        marketValueAfter,
        percentAfter,
        targetPercent: target,
        targetOverridden: override !== undefined,
        lowerBandPercent: lowerPct,
        upperBandPercent: upperPct,
        suggestionAfter: suggestion(
          marketValueAfter,
          lowerBand(targetEur, bands),
          upperBand(targetEur, bands),
        ),
        deviationAfter: percentAfter - target,
        relativeDeviationAfter: target === 0 ? 0 : ((percentAfter - target) * 100) / target,
        inBandAfter: percentAfter >= lowerPct && percentAfter <= upperPct,
        deltaUnits: price > 0 ? Math.round((targetEur - row.marketValue) / price) : 0,
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

  // Deckungsvorschläge erst jetzt: Sie hängen an der Lücke des **ganzen**
  // Plans, die vor der letzten Zeile noch nicht feststeht.
  const shortfall = outlay - proceeds
  const rowsWithCoverage = planRows.map((row) => ({
    ...row,
    coverageUnits: coverageUnitsFor(row, shortfall),
  }))

  return {
    rows: rowsWithCoverage,
    netCashFlow: proceeds - outlay,
    proceeds,
    outlay,
    underfunded: outlay - proceeds > 0.001,
    liquidAfter,
    bufferBreached: liquidAfter < securityBuffer - 0.001,
    reserveAvailable: Math.max(0, liquidBefore - securityBuffer),
    percentAfterSum: planRows.reduce((sum, row) => sum + row.percentAfter, 0),
    targetSum: planRows.reduce((sum, row) => sum + row.targetPercent, 0),
  }
}

/**
 * Was diese Zeile insgesamt verkaufen müsste, um die Lücke zu schließen.
 *
 * Aufgerundet: Eine halbe Anteilsscheine gibt es nicht, und abgerundet bliebe
 * die Lücke offen. Begrenzt durch den Bestand — mehr als vorhanden lässt sich
 * nicht verkaufen; den Rest muss dann eine andere Zeile tragen.
 */
function coverageUnitsFor(
  row: Omit<TradePlanRow, 'coverageUnits'>,
  shortfall: number,
): number | null {
  const group = row.current.position.group
  if (group !== 'cash' && group !== 'moneymarket') return null
  if (shortfall <= 0.001) return null

  const price = priceOfRow(row.current)
  if (price <= 0) return null

  // Was nach den bereits geplanten Trades noch dasteht.
  const available = row.unitsAfter
  if (available <= 0) return null

  const needed = group === 'cash' ? shortfall : Math.ceil(shortfall / price)
  const taken = Math.min(needed, available)

  return row.tradeUnits - taken
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

/** Verwirft alle probeweisen Ziele. */
export function emptyTargets(): TargetMap {
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
