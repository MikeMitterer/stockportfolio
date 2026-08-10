/**
 * Unit-Tests für den Rebalancing-Plan.
 *
 * Der Ablauf, den das abbilden muss: eine Position verkaufen, den Erlös auf
 * andere verteilen, und sehen, ob man dabei in den Zielbändern landet.
 */

import { describe, expect, it } from 'vitest'
import { computeRebalancing } from '@/domain/rebalancing'
import { computeTradePlan, hasTrades } from '@/domain/tradePlan'
import type { Portfolio, Position, QuoteCacheEntry, QuoteMap, Settings } from '@/types/portfolio'

function makeQuote(overrides: Partial<QuoteCacheEntry> = {}): QuoteCacheEntry {
  return {
    isin: 'ISIN',
    symbol: 'TEST.DE',
    price: 100,
    currency: 'EUR',
    type: 'etf',
    volatility: null,
    name: null,
    ter: null,
    accumulating: null,
    fetchedAt: '2026-01-01T00:00:00.000Z',
    cached: true,
    stale: false,
    ...overrides,
  }
}

function makePosition(overrides: Partial<Position> = {}): Position {
  return {
    id: 'p-1',
    isin: 'ISIN',
    symbol: 'TEST.DE',
    displayName: 'Test',
    group: 'stocks',
    kind: 'etf',
    units: 10,
    targetPercent: 50,
    enabled: true,
    ...overrides,
  }
}

const SETTINGS: Settings = {
  activePortfolioId: 'p1',
  totalRounding: 0,
  bands: { lowerPercent: 10, upperPercent: 20 },
  securityBuffer: { mode: 'absolute', value: 0 },
  investmentReservePercent: 0,
  currentRebalancingBudget: 0,
  currency: 'EUR',
  refresh: { autoOnLoad: true, staleAfterMinutes: 60 },
  links: [],
  ui: {
    columns: {
      volatility: false,
      optimalUnits: false,
      groupSharePercent: false,
      deltaEuro: false,
      deltaMax: false,
      deltaPercentAbs: false,
    },
  },
}

/**
 * Ein Depot, bei dem sich alles im Kopf nachrechnen lässt:
 * A und B je 10 Stück à 100 € = 1.000 €, Cash 0 → Gesamt 2.000 €.
 * Ziele: A 25 %, B 75 %.
 */
function makeSetup() {
  const portfolio: Portfolio = {
    id: 'p1',
    name: 'Test',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    positions: [
      makePosition({ id: 'a', isin: 'A', symbol: 'A.DE', units: 10, targetPercent: 25 }),
      makePosition({ id: 'b', isin: 'B', symbol: 'B.DE', units: 10, targetPercent: 75 }),
    ],
  }
  const quotes: QuoteMap = new Map([
    ['A', makeQuote({ isin: 'A', price: 100 })],
    ['B', makeQuote({ isin: 'B', price: 100 })],
  ])
  const result = computeRebalancing(portfolio, quotes, SETTINGS)
  return { portfolio, quotes, result }
}

describe('computeTradePlan — Geldfluss', () => {
  it('ein Kauf lässt Geld abfließen (negativer Fluss)', () => {
    const { result } = makeSetup()
    const plan = computeTradePlan(result.rows, { a: 5 }, result.total, SETTINGS.bands, 0)

    expect(plan.rows.find((row) => row.current.position.id === 'a')?.cashFlow).toBe(-500)
  })

  it('ein Verkauf bringt Geld herein (positiver Fluss)', () => {
    const { result } = makeSetup()
    const plan = computeTradePlan(result.rows, { a: -5 }, result.total, SETTINGS.bands, 0)

    expect(plan.rows.find((row) => row.current.position.id === 'a')?.cashFlow).toBe(500)
  })

  it('trennt Erlöse und Einsatz', () => {
    const { result } = makeSetup()
    const plan = computeTradePlan(
      result.rows,
      { a: -5, b: 3 },
      result.total,
      SETTINGS.bands, 0)

    expect(plan.proceeds).toBe(500)
    expect(plan.outlay).toBe(300)
  })

  it('der Nettofluss zeigt, ob der Plan aufgeht', () => {
    const { result } = makeSetup()
    // 5 verkaufen, 5 kaufen — gleicht sich aus.
    const plan = computeTradePlan(
      result.rows,
      { a: -5, b: 5 },
      result.total,
      SETTINGS.bands, 0)

    expect(plan.netCashFlow).toBe(0)
  })

  it('ohne geplante Trades ist alles null', () => {
    const { result } = makeSetup()
    const plan = computeTradePlan(result.rows, {}, result.total, SETTINGS.bands, 0)

    expect(plan.netCashFlow).toBe(0)
    expect(plan.proceeds).toBe(0)
    expect(plan.outlay).toBe(0)
  })
})

describe('computeTradePlan — Anteil nach dem Trade', () => {
  it('zeigt den Anteil nach Ausführung', () => {
    const { result } = makeSetup()
    // A von 10 auf 15 Stück → 1.500 € von 2.000 € = 75 %
    const plan = computeTradePlan(result.rows, { a: 5 }, result.total, SETTINGS.bands, 0)

    expect(plan.rows.find((row) => row.current.position.id === 'a')?.percentAfter).toBe(75)
  })

  it('ohne Trade bleibt der Anteil unverändert', () => {
    const { result } = makeSetup()
    const plan = computeTradePlan(result.rows, {}, result.total, SETTINGS.bands, 0)

    // 1.000 € von 2.000 € = 50 %
    expect(plan.rows[0]?.percentAfter).toBe(50)
  })

  it('liefert die Bandgrenzen als Anteil zum Vergleich', () => {
    const { result } = makeSetup()
    const plan = computeTradePlan(result.rows, {}, result.total, SETTINGS.bands, 0)
    const rowA = plan.rows.find((row) => row.current.position.id === 'a')

    // Ziel 25 %, Bänder −10 % / +20 % → 22,5 % bis 30 %
    expect(rowA?.lowerBandPercent).toBeCloseTo(22.5, 6)
    expect(rowA?.upperBandPercent).toBeCloseTo(30, 6)
  })

  it('meldet, wenn die Position nach dem Trade im Band landet', () => {
    const { result } = makeSetup()
    // B von 10 auf 15 → 1.500 € = Ziel 75 % von 2.000 € → genau im Band
    const plan = computeTradePlan(result.rows, { b: 5 }, result.total, SETTINGS.bands, 0)

    expect(plan.rows.find((row) => row.current.position.id === 'b')?.suggestionAfter).toBe('ok')
  })

  it('meldet, wenn die Position nach dem Trade weiterhin daneben liegt', () => {
    const { result } = makeSetup()
    // A auf 20 Stück = 2.000 € bei Ziel 500 € → deutlich zu viel
    const plan = computeTradePlan(result.rows, { a: 10 }, result.total, SETTINGS.bands, 0)

    expect(plan.rows.find((row) => row.current.position.id === 'a')?.suggestionAfter).toBe('sell')
  })
})

describe('computeTradePlan — Abweichung vom Ziel', () => {
  /**
   * Der Fall aus der Praxis: Ziel 10 %, nach dem Rebalancing 9,5 % — nicht
   * exakt getroffen, aber innerhalb der Bänder und damit in Ordnung.
   */
  function targetSetup() {
    const portfolio: Portfolio = {
      id: 'p1',
      name: 'Test',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      positions: [
        // Ziel 10 % von 10.000 € = 1.000 €; Kurs 100 € → 10 Stück wären exakt
        makePosition({ id: 'ziel', isin: 'Z', symbol: 'Z.DE', units: 0, targetPercent: 10 }),
        makePosition({ id: 'rest', isin: 'R', symbol: 'R.DE', units: 100, targetPercent: 90 }),
      ],
    }
    const quotes: QuoteMap = new Map([
      ['Z', makeQuote({ isin: 'Z', price: 100 })],
      ['R', makeQuote({ isin: 'R', price: 100 })],
    ])
    const result = computeRebalancing(portfolio, quotes, SETTINGS)
    return { portfolio, result }
  }

  it('meldet die Abweichung in Prozentpunkten', () => {
    const { result } = targetSetup()
    // Gesamt 10.000 €. 9 Stück kaufen → 900 € = 9,0 % bei Ziel 10 % → −1,0 %-Punkte
    const plan = computeTradePlan(result.rows, { ziel: 9 }, result.total, SETTINGS.bands, 0)
    const row = plan.rows.find((entry) => entry.current.position.id === 'ziel')

    expect(row?.percentAfter).toBeCloseTo(9, 6)
    expect(row?.deviationAfter).toBeCloseTo(-1, 6)
  })

  it('meldet die Abweichung auch relativ zum Ziel', () => {
    const { result } = targetSetup()
    // −1,0 von 10 sind −10 % relativ
    const plan = computeTradePlan(result.rows, { ziel: 9 }, result.total, SETTINGS.bands, 0)
    const row = plan.rows.find((entry) => entry.current.position.id === 'ziel')

    expect(row?.relativeDeviationAfter).toBeCloseTo(-10, 6)
  })

  it('Ziel knapp verfehlt, aber im Band → gilt als in Ordnung', () => {
    const { result } = targetSetup()
    // 9,5 Stück gibt es nicht; 9 Stück = 9,0 % bei Band 9,0 % bis 12,0 %
    const plan = computeTradePlan(result.rows, { ziel: 9 }, result.total, SETTINGS.bands, 0)
    const row = plan.rows.find((entry) => entry.current.position.id === 'ziel')

    expect(row?.inBandAfter).toBe(true)
    expect(row?.suggestionAfter).toBe('ok')
    // Die Abweichung bleibt sichtbar — sie ist nur kein Fehler.
    expect(row?.deviationAfter).not.toBe(0)
  })

  it('Ziel deutlich verfehlt und außerhalb des Bandes → nicht in Ordnung', () => {
    const { result } = targetSetup()
    // 5 Stück = 500 € = 5,0 %, unteres Band liegt bei 9,0 %
    const plan = computeTradePlan(result.rows, { ziel: 5 }, result.total, SETTINGS.bands, 0)
    const row = plan.rows.find((entry) => entry.current.position.id === 'ziel')

    expect(row?.inBandAfter).toBe(false)
    expect(row?.suggestionAfter).toBe('buy')
  })

  it('Ziel exakt getroffen → Abweichung null', () => {
    const { result } = targetSetup()
    const plan = computeTradePlan(result.rows, { ziel: 10 }, result.total, SETTINGS.bands, 0)
    const row = plan.rows.find((entry) => entry.current.position.id === 'ziel')

    expect(row?.deviationAfter).toBeCloseTo(0, 6)
    expect(row?.inBandAfter).toBe(true)
  })

  it('Ziel 0 % führt nicht zu einer Division durch null', () => {
    const { portfolio } = targetSetup()
    const ohneZiel: Portfolio = {
      ...portfolio,
      positions: portfolio.positions.map((position) =>
        position.id === 'ziel' ? { ...position, targetPercent: 0 } : position,
      ),
    }
    const neu = computeRebalancing(ohneZiel, new Map([
      ['Z', makeQuote({ isin: 'Z', price: 100 })],
      ['R', makeQuote({ isin: 'R', price: 100 })],
    ]), SETTINGS)
    const plan = computeTradePlan(neu.rows, { ziel: 5 }, neu.total, SETTINGS.bands, 0)
    const row = plan.rows.find((entry) => entry.current.position.id === 'ziel')

    expect(row?.relativeDeviationAfter).toBe(0)
  })
})

describe('computeTradePlan — Deckung', () => {
  /**
   * Es gibt kein abstraktes Budget mehr. Jeder gekaufte Euro muss im Plan
   * sichtbar herkommen — aus einem Verkauf oder einer Entnahme.
   */
  it('gedeckt, wenn Verkäufe die Käufe tragen', () => {
    const { result } = makeSetup()
    const plan = computeTradePlan(
      result.rows,
      { a: -5, b: 5 },
      result.total,
      SETTINGS.bands, 0)

    expect(plan.underfunded).toBe(false)
    expect(plan.netCashFlow).toBe(0)
  })

  it('ungedeckt, wenn ohne Gegenfinanzierung gekauft wird', () => {
    const { result } = makeSetup()
    const plan = computeTradePlan(result.rows, { b: 5 }, result.total, SETTINGS.bands, 0)

    expect(plan.underfunded).toBe(true)
    expect(plan.netCashFlow).toBe(-500)
  })

  it('teilweise gedeckt bleibt ungedeckt', () => {
    const { result } = makeSetup()
    // 500 € kaufen, nur 400 € verkaufen → 100 € fehlen
    const plan = computeTradePlan(
      result.rows,
      { a: -4, b: 5 },
      result.total,
      SETTINGS.bands, 0)

    expect(plan.underfunded).toBe(true)
    expect(plan.netCashFlow).toBe(-100)
  })
})

describe('computeTradePlan — Sicherheitspuffer', () => {
  /** Depot mit Cash und Geldmarkt, damit sich Entnahmen prüfen lassen. */
  function liquidSetup() {
    const portfolio: Portfolio = {
      id: 'p1',
      name: 'Test',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      positions: [
        makePosition({ id: 'aktie', isin: 'A', symbol: 'A.DE', units: 10, targetPercent: 50 }),
        makePosition({
          id: 'cash',
          isin: null,
          symbol: 'CASH',
          group: 'cash',
          kind: null,
          units: 1_000,
          targetPercent: 50,
        }),
      ],
    }
    const quotes: QuoteMap = new Map([['A', makeQuote({ isin: 'A', price: 100 })]])
    const result = computeRebalancing(portfolio, quotes, SETTINGS)
    return { portfolio, result }
  }

  it('meldet, wie viel ohne Puffer-Verletzung entnommen werden darf', () => {
    const { result } = liquidSetup()
    // 1.000 € Cash, Puffer 400 € → 600 € entnehmbar
    const plan = computeTradePlan(result.rows, {}, result.total, SETTINGS.bands, 400)

    expect(plan.reserveAvailable).toBe(600)
  })

  it('eine Entnahme innerhalb der Reserve verletzt den Puffer nicht', () => {
    const { result } = liquidSetup()
    const plan = computeTradePlan(
      result.rows,
      { cash: -600, aktie: 6 },
      result.total,
      SETTINGS.bands, 400)

    expect(plan.liquidAfter).toBe(400)
    expect(plan.bufferBreached).toBe(false)
  })

  it('eine Entnahme über die Reserve hinaus verletzt den Puffer', () => {
    const { result } = liquidSetup()
    const plan = computeTradePlan(
      result.rows,
      { cash: -700, aktie: 7 },
      result.total,
      SETTINGS.bands, 400)

    expect(plan.liquidAfter).toBe(300)
    expect(plan.bufferBreached).toBe(true)
  })

  it('eine Entnahme aus Cash deckt einen Kauf', () => {
    const { result } = liquidSetup()
    const plan = computeTradePlan(
      result.rows,
      { cash: -500, aktie: 5 },
      result.total,
      SETTINGS.bands, 0)

    expect(plan.proceeds).toBe(500)
    expect(plan.outlay).toBe(500)
    expect(plan.underfunded).toBe(false)
  })
})

describe('hasTrades', () => {
  it('false ohne Einträge', () => {
    expect(hasTrades({})).toBe(false)
  })

  it('false, wenn alle Einträge null sind', () => {
    expect(hasTrades({ a: 0, b: 0 })).toBe(false)
  })

  it('true bei einem Kauf', () => {
    expect(hasTrades({ a: 5 })).toBe(true)
  })

  it('true bei einem Verkauf', () => {
    expect(hasTrades({ a: -5 })).toBe(true)
  })
})

describe('Ablauf aus der Praxis', () => {
  /**
   * Der Fall, den der Nutzer beschrieben hat: eine Position verkaufen, den
   * Erlös auf andere verteilen, und dabei sehen, ob man im Band landet.
   */
  it('Verkauf finanziert Zukäufe, Plan geht auf null auf', () => {
    const portfolio: Portfolio = {
      id: 'p1',
      name: 'Test',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      positions: [
        // Übergewichtet: soll abgebaut werden
        makePosition({ id: 'gross', isin: 'G', symbol: 'G.DE', units: 30, targetPercent: 40 }),
        // Untergewichtet: sollen aufgebaut werden
        makePosition({ id: 'klein1', isin: 'K1', symbol: 'K1.DE', units: 5, targetPercent: 30 }),
        makePosition({ id: 'klein2', isin: 'K2', symbol: 'K2.DE', units: 5, targetPercent: 30 }),
      ],
    }
    const quotes: QuoteMap = new Map([
      ['G', makeQuote({ isin: 'G', price: 100 })],
      ['K1', makeQuote({ isin: 'K1', price: 100 })],
      ['K2', makeQuote({ isin: 'K2', price: 100 })],
    ])
    const result = computeRebalancing(portfolio, quotes, SETTINGS)
    // Gesamt = 4.000 €. Ziele: gross 1.600, klein1 1.200, klein2 1.200.
    expect(result.total).toBe(4_000)

    // 14 Stück verkaufen (1.400 €), je 7 Stück zukaufen (je 700 €).
    const plan = computeTradePlan(
      result.rows,
      { gross: -14, klein1: 7, klein2: 7 },
      result.total,
      SETTINGS.bands, 0)

    expect(plan.proceeds).toBe(1_400)
    expect(plan.outlay).toBe(1_400)
    expect(plan.netCashFlow).toBe(0)

    // Danach: gross 1.600 €, klein1/2 je 1.200 € — genau auf Ziel.
    const nachher = Object.fromEntries(
      plan.rows.map((row) => [row.current.position.id, row.marketValueAfter]),
    )
    expect(nachher.gross).toBe(1_600)
    expect(nachher.klein1).toBe(1_200)
    expect(nachher.klein2).toBe(1_200)

    // Und alle im Band.
    expect(plan.rows.every((row) => row.suggestionAfter === 'ok')).toBe(true)
    expect(plan.percentAfterSum).toBeCloseTo(100, 6)
  })
})

describe('computeTradePlan — Delta bis zum Ziel', () => {
  it('nennt die Stückzahl, die bis zum Ziel fehlt', () => {
    // A: 1.000 € von 2.000 € (50 %), Ziel 25 % = 500 € → 500 € zu viel,
    // bei Kurs 100 also 5 Stück abbauen.
    const { result } = makeSetup()
    const plan = computeTradePlan(result.rows, {}, result.total, SETTINGS.bands, 0)

    expect(plan.rows.find((row) => row.current.position.id === 'a')?.deltaUnits).toBe(-5)
    expect(plan.rows.find((row) => row.current.position.id === 'b')?.deltaUnits).toBe(5)
  })

  it('hängt nicht am Plan — das Delta steht auch ohne eingetragene Trades da', () => {
    const { result } = makeSetup()
    const ohnePlan = computeTradePlan(result.rows, {}, result.total, SETTINGS.bands, 0)
    const mitPlan = computeTradePlan(result.rows, { a: -5 }, result.total, SETTINGS.bands, 0)

    const deltaOf = (plan: typeof ohnePlan, id: string) =>
      plan.rows.find((row) => row.current.position.id === id)?.deltaUnits

    expect(deltaOf(mitPlan, 'a')).toBe(deltaOf(ohnePlan, 'a'))
  })

  it('heben sich die Deltas in Euro auf, wenn die Ziele 100 % ergeben', () => {
    const { result } = makeSetup()
    const plan = computeTradePlan(result.rows, {}, result.total, SETTINGS.bands, 0)

    const summe = plan.rows.reduce(
      (total, row) => total + row.deltaUnits * (row.current.quote?.price ?? 0),
      0,
    )
    expect(summe).toBeCloseTo(0, 6)
  })

  it('meldet 0 statt Unendlich, wenn kein Kurs vorliegt', () => {
    const portfolio: Portfolio = {
      id: 'p1',
      name: 'Test',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      positions: [makePosition({ id: 'a', isin: 'A', targetPercent: 100 })],
    }
    const result = computeRebalancing(portfolio, new Map(), SETTINGS)
    const plan = computeTradePlan(result.rows, {}, result.total, SETTINGS.bands, 0)

    expect(plan.rows[0]?.deltaUnits).toBe(0)
  })
})

describe('computeTradePlan — probeweise Ziele', () => {
  it('rechnet Delta und Bänder gegen das probeweise Ziel', () => {
    // A steht bei 50 %; mit Probeziel 50 % ist nichts mehr zu tun.
    const { result } = makeSetup()
    const plan = computeTradePlan(result.rows, {}, result.total, SETTINGS.bands, 0, { a: 50 })
    const a = plan.rows.find((row) => row.current.position.id === 'a')

    expect(a?.deltaUnits).toBe(0)
    expect(a?.targetPercent).toBe(50)
    expect(a?.inBandAfter).toBe(true)
  })

  it('markiert nur die Zeilen, deren Ziel probeweise gesetzt wurde', () => {
    const { result } = makeSetup()
    const plan = computeTradePlan(result.rows, {}, result.total, SETTINGS.bands, 0, { a: 50 })

    expect(plan.rows.find((row) => row.current.position.id === 'a')?.targetOverridden).toBe(true)
    expect(plan.rows.find((row) => row.current.position.id === 'b')?.targetOverridden).toBe(false)
  })

  it('lässt das Ziel im Depot unangetastet', () => {
    const { result } = makeSetup()
    computeTradePlan(result.rows, {}, result.total, SETTINGS.bands, 0, { a: 50 })

    const a = result.rows.find((row) => row.position.id === 'a')
    expect(a?.position.targetPercent).toBe(25)
  })

  it('meldet über targetSum, wenn die Ziele nicht mehr 100 % ergeben', () => {
    const { result } = makeSetup()
    const plan = computeTradePlan(result.rows, {}, result.total, SETTINGS.bands, 0, { a: 50 })

    expect(plan.targetSum).toBeCloseTo(125, 6)
  })

  it('löst den Fall „Geldquelle steht auf Ziel" auf', () => {
    // Der Fall aus der Praxis: EQQQ ist unter Ziel und soll aufgestockt
    // werden. Der naheliegende Verkaufskandidat wäre FTSE (über Ziel), aber
    // das Geld soll aus dem Geldmarkt kommen — und der liegt exakt auf Ziel.
    const portfolio: Portfolio = {
      id: 'p1',
      name: 'Test',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      positions: [
        makePosition({ id: 'eqqq', isin: 'E', units: 6, targetPercent: 50 }),
        makePosition({ id: 'ftse', isin: 'F', units: 8, targetPercent: 20 }),
        makePosition({
          id: 'geldmarkt',
          isin: 'G',
          group: 'moneymarket',
          units: 6,
          targetPercent: 30,
        }),
      ],
    }
    const quotes: QuoteMap = new Map([
      ['E', makeQuote({ isin: 'E', price: 100 })],
      ['F', makeQuote({ isin: 'F', price: 100 })],
      ['G', makeQuote({ isin: 'G', price: 100 })],
    ])
    const result = computeRebalancing(portfolio, quotes, SETTINGS)

    // Gesamt 2.000 €. Geldmarkt: 600 € = 30 % — genau auf Ziel, Delta 0.
    const vorher = computeTradePlan(result.rows, {}, result.total, SETTINGS.bands, 0)
    expect(vorher.rows.find((row) => row.current.position.id === 'geldmarkt')?.deltaUnits).toBe(0)

    // EQQQ auf 1.000 € bringen (+4 Stück), bezahlt aus dem Geldmarkt.
    const trades = { eqqq: 4, geldmarkt: -4 }

    // Ohne Zielanpassung fällt der Geldmarkt auf 10 % bei Ziel 30 % — die
    // Zeile stünde dauerhaft auf „Kaufen", obwohl das so gewollt war.
    const ohneAnpassung = computeTradePlan(result.rows, trades, result.total, SETTINGS.bands, 0)
    const gmOhne = ohneAnpassung.rows.find((row) => row.current.position.id === 'geldmarkt')
    expect(gmOhne?.percentAfter).toBeCloseTo(10, 6)
    expect(gmOhne?.inBandAfter).toBe(false)

    // Mit probeweise nachgezogenen Zielen geht die Rechnung auf.
    const mitAnpassung = computeTradePlan(
      result.rows,
      trades,
      result.total,
      SETTINGS.bands,
      0,
      { eqqq: 50, ftse: 40, geldmarkt: 10 },
    )
    expect(mitAnpassung.targetSum).toBeCloseTo(100, 6)
    expect(mitAnpassung.rows.every((row) => row.inBandAfter)).toBe(true)
  })
})
