/**
 * Unit-Tests für src/domain/rebalancing.ts.
 * Fokus: die Regel, nicht der Wert — jede Formel isoliert mit klaren
 * synthetischen Inputs, plus Edge-Cases und ein kleines konstruiertes
 * Portfolio als Aggregator-Sanity.
 */

import { describe, expect, it } from 'vitest'
import {
  actualPercent,
  computeRebalancing,
  isNearBand,
  lowerBand,
  marketValue,
  quoteFor,
  quoteKey,
  relativeDeltaPercent,
  roundToPlace,
  suggestion,
  targetPercentSum,
  targetValue,
  totalValue,
  unitsDelta,
  upperBand,
} from '@/domain/rebalancing'
import type {
  Bands,
  Portfolio,
  Position,
  QuoteCacheEntry,
  QuoteMap,
  Settings,
} from '@/types/portfolio'

// ─── Helpers zum Erzeugen minimaler Test-Inputs ─────────────────────────────

function makeQuote(overrides: Partial<QuoteCacheEntry> = {}): QuoteCacheEntry {
  return {
    isin: 'IE0000000000',
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
    id: 'p-test',
    isin: 'IE0000000000',
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

// ─── quoteKey / quoteFor ────────────────────────────────────────────────────

describe('quoteKey', () => {
  it('nimmt ISIN wenn vorhanden', () => {
    expect(quoteKey({ isin: 'IE00B3RBWM25', symbol: 'VGWL.DE' })).toBe('IE00B3RBWM25')
  })

  it('fällt auf Symbol zurück wenn ISIN null ist', () => {
    expect(quoteKey({ isin: null, symbol: 'CASH' })).toBe('CASH')
  })
})

describe('quoteFor', () => {
  it('liefert null für Cash-Positionen (Cash hat keinen Kurs)', () => {
    const quotes: QuoteMap = new Map()
    const cash = makePosition({ group: 'cash', isin: null, symbol: 'CASH' })
    expect(quoteFor(cash, quotes)).toBeNull()
  })

  it('liefert null wenn kein Kurs im Cache steht', () => {
    const quotes: QuoteMap = new Map()
    expect(quoteFor(makePosition(), quotes)).toBeNull()
  })

  it('liefert den Kurs unter dem korrekten Key', () => {
    const quote = makeQuote({ isin: 'IE00B3RBWM25' })
    const quotes: QuoteMap = new Map([['IE00B3RBWM25', quote]])
    const pos = makePosition({ isin: 'IE00B3RBWM25' })
    expect(quoteFor(pos, quotes)).toBe(quote)
  })
})

// ─── marketValue ────────────────────────────────────────────────────────────

describe('marketValue', () => {
  it('multipliziert Bestand mit Kurs', () => {
    const pos = makePosition({ units: 5 })
    const quote = makeQuote({ price: 20 })
    expect(marketValue(pos, quote)).toBe(100)
  })

  it('gibt für Cash den Bestand direkt zurück (EUR-Betrag)', () => {
    const cash = makePosition({ group: 'cash', units: 1234.5 })
    expect(marketValue(cash, null)).toBe(1234.5)
  })

  it('liefert 0 für Wertpapier ohne Kurs', () => {
    expect(marketValue(makePosition(), null)).toBe(0)
  })

  it('liefert 0 wenn Preis 0 ist', () => {
    expect(marketValue(makePosition({ units: 100 }), makeQuote({ price: 0 }))).toBe(0)
  })
})

// ─── actualPercent ──────────────────────────────────────────────────────────

describe('actualPercent', () => {
  it('gibt den Anteil in Prozent zurück', () => {
    expect(actualPercent(250, 1000)).toBe(25)
  })

  it('gibt 0 zurück wenn Total 0 ist (keine Division-by-zero)', () => {
    expect(actualPercent(500, 0)).toBe(0)
  })

  it('kann > 100 % werden wenn Position übergewichtet ist', () => {
    expect(actualPercent(1200, 1000)).toBe(120)
  })
})

// ─── targetValue ────────────────────────────────────────────────────────────

describe('targetValue', () => {
  it('rechnet Ziel-Prozent auf Ziel-EUR um', () => {
    const pos = makePosition({ targetPercent: 25 })
    expect(targetValue(pos, 400)).toBe(100)
  })

  it('liefert 0 bei Ziel-Prozent 0', () => {
    expect(targetValue(makePosition({ targetPercent: 0 }), 1000)).toBe(0)
  })
})

// ─── lowerBand / upperBand ──────────────────────────────────────────────────

describe('lowerBand', () => {
  const bands: Bands = { lowerPercent: 10, upperPercent: 20 }

  it('zieht lowerPercent vom Ziel ab', () => {
    expect(lowerBand(1000, bands)).toBe(900)
  })

  it('bei lowerPercent 0 ist Lower = Target', () => {
    expect(lowerBand(1000, { lowerPercent: 0, upperPercent: 20 })).toBe(1000)
  })
})

describe('upperBand', () => {
  const bands: Bands = { lowerPercent: 10, upperPercent: 20 }

  it('addiert upperPercent zum Ziel', () => {
    expect(upperBand(1000, bands)).toBe(1200)
  })

  it('bei upperPercent 0 ist Upper = Target', () => {
    expect(upperBand(1000, { lowerPercent: 10, upperPercent: 0 })).toBe(1000)
  })
})

// ─── suggestion ─────────────────────────────────────────────────────────────

describe('suggestion', () => {
  it('OK wenn IST zwischen Low und High liegt', () => {
    expect(suggestion(1000, 900, 1200)).toBe('ok')
  })

  it('genau auf Low = OK (nicht Kaufen)', () => {
    expect(suggestion(900, 900, 1200)).toBe('ok')
  })

  it('genau auf High = OK (nicht Verkaufen)', () => {
    expect(suggestion(1200, 900, 1200)).toBe('ok')
  })

  it('unter Low = Kaufen', () => {
    expect(suggestion(899.99, 900, 1200)).toBe('buy')
  })

  it('über High = Verkaufen', () => {
    expect(suggestion(1200.01, 900, 1200)).toBe('sell')
  })

  it('bei IST 0 mit Target > 0: Kaufen', () => {
    expect(suggestion(0, 900, 1200)).toBe('buy')
  })
})

// ─── relativeDeltaPercent ───────────────────────────────────────────────────

describe('relativeDeltaPercent', () => {
  it('positiv bei Übergewichtung', () => {
    expect(relativeDeltaPercent(120, 100)).toBe(20)
  })

  it('negativ bei Untergewichtung', () => {
    expect(relativeDeltaPercent(80, 100)).toBe(-20)
  })

  it('0 wenn IST = Ziel', () => {
    expect(relativeDeltaPercent(100, 100)).toBe(0)
  })

  it('0 wenn Ziel = 0 (keine Division-by-zero)', () => {
    expect(relativeDeltaPercent(500, 0)).toBe(0)
  })

  it('−100 % bei IST = 0 und Ziel > 0', () => {
    expect(relativeDeltaPercent(0, 100)).toBe(-100)
  })
})

// ─── unitsDelta ─────────────────────────────────────────────────────────────

describe('unitsDelta', () => {
  it('rechnet EUR-Delta in Stück um', () => {
    // Ziel 1000, IST 800, Kurs 20 → 200 EUR fehlen → 10 Stück kaufen
    expect(unitsDelta(800, 1000, makeQuote({ price: 20 }))).toBe(10)
  })

  it('liefert negative Stück bei Übergewichtung', () => {
    expect(unitsDelta(1000, 800, makeQuote({ price: 20 }))).toBe(-10)
  })

  it('liefert 0 ohne Kurs', () => {
    expect(unitsDelta(800, 1000, null)).toBe(0)
  })

  it('liefert 0 bei Preis 0 (keine Division-by-zero)', () => {
    expect(unitsDelta(800, 1000, makeQuote({ price: 0 }))).toBe(0)
  })
})

// ─── roundToPlace ───────────────────────────────────────────────────────────

describe('roundToPlace', () => {
  it('rundet auf Tausender (place = -3)', () => {
    expect(roundToPlace(872_499, -3)).toBe(872_000)
    expect(roundToPlace(872_500, -3)).toBe(873_000)
  })

  it('rundet auf Hunderter (place = -2)', () => {
    expect(roundToPlace(1249, -2)).toBe(1200)
    expect(roundToPlace(1250, -2)).toBe(1300)
  })

  it('mit place = 0 gleichbedeutend mit Math.round', () => {
    expect(roundToPlace(3.7, 0)).toBe(4)
    expect(roundToPlace(-3.7, 0)).toBe(-4)
  })

  it('rundet negative Zahlen konsistent', () => {
    expect(roundToPlace(-1250, -2)).toBe(-1200)
  })
})

// ─── isNearBand ─────────────────────────────────────────────────────────────

describe('isNearBand', () => {
  const target = 1000

  it('false außerhalb der Bänder', () => {
    expect(isNearBand(700, 900, 1200, target)).toBe(false)
    expect(isNearBand(1300, 900, 1200, target)).toBe(false)
  })

  it('true wenn IST innerhalb 1 %-Punkt unter Upper', () => {
    // 1 % von target=1000 = 10, also Upper - 10 bis Upper = near
    expect(isNearBand(1195, 900, 1200, target)).toBe(true)
  })

  it('true wenn IST innerhalb 1 %-Punkt über Lower', () => {
    expect(isNearBand(905, 900, 1200, target)).toBe(true)
  })

  it('false wenn IST komfortabel in der Mitte', () => {
    expect(isNearBand(1000, 900, 1200, target)).toBe(false)
  })

  it('false wenn Target = 0 (keine sinnvolle Prozent-Distanz)', () => {
    expect(isNearBand(50, 0, 100, 0)).toBe(false)
  })
})

// ─── totalValue ─────────────────────────────────────────────────────────────

describe('totalValue', () => {
  it('summiert Marktwerte aller aktiven Positionen und rundet auf', () => {
    const portfolio: Portfolio = {
      id: 'p1',
      name: 'Test',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      positions: [
        makePosition({ id: 'a', isin: 'A', units: 10 }), // 10 * 100 = 1000
        makePosition({ id: 'b', isin: 'B', units: 5 }), //   5 * 100 = 500
      ],
    }
    const quotes: QuoteMap = new Map([
      ['A', makeQuote({ isin: 'A', price: 100 })],
      ['B', makeQuote({ isin: 'B', price: 100 })],
    ])
    expect(totalValue(portfolio, quotes, 0)).toBe(1500)
  })

  it('ignoriert disabled Positionen', () => {
    const portfolio: Portfolio = {
      id: 'p1',
      name: 'Test',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      positions: [
        makePosition({ id: 'a', isin: 'A', units: 10, enabled: true }), // 1000
        makePosition({ id: 'b', isin: 'B', units: 5, enabled: false }), // ignored
      ],
    }
    const quotes: QuoteMap = new Map([
      ['A', makeQuote({ isin: 'A', price: 100 })],
      ['B', makeQuote({ isin: 'B', price: 100 })],
    ])
    expect(totalValue(portfolio, quotes, 0)).toBe(1000)
  })

  it('rundet mit place = -3 auf Tausender', () => {
    const portfolio: Portfolio = {
      id: 'p1',
      name: 'Test',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      positions: [makePosition({ units: 12345, isin: 'A' })],
    }
    const quotes: QuoteMap = new Map([['A', makeQuote({ isin: 'A', price: 1 })]])
    expect(totalValue(portfolio, quotes, -3)).toBe(12_000)
  })
})

// ─── targetPercentSum ───────────────────────────────────────────────────────

describe('targetPercentSum', () => {
  function portfolioWith(targets: { percent: number; enabled?: boolean }[]): Portfolio {
    return {
      id: 'p1',
      name: 'Test',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      positions: targets.map((entry, index) =>
        makePosition({
          id: `p-${index}`,
          targetPercent: entry.percent,
          enabled: entry.enabled ?? true,
        }),
      ),
    }
  }

  it('summiert die Ziel-Anteile', () => {
    expect(targetPercentSum(portfolioWith([{ percent: 60 }, { percent: 40 }]))).toBe(100)
  })

  it('zählt deaktivierte Positionen nicht mit', () => {
    const portfolio = portfolioWith([{ percent: 60 }, { percent: 40, enabled: false }])
    expect(targetPercentSum(portfolio)).toBe(60)
  })

  it('liefert 0 für ein leeres Portfolio', () => {
    expect(targetPercentSum(portfolioWith([]))).toBe(0)
  })

  it('kann über 100 laufen — das Erkennen ist Sache des Aufrufers', () => {
    expect(targetPercentSum(portfolioWith([{ percent: 80 }, { percent: 50 }]))).toBe(130)
  })
})

// ─── computeRebalancing (Aggregator-Sanity) ─────────────────────────────────

describe('computeRebalancing', () => {
  /**
   * Kleines synthetisches 3-Positionen-Portfolio, bei dem die
   * Arithmetik im Kopf nachvollziehbar bleibt:
   *
   * - Stock A: 10 Stk × 100 € = 1.000 €, Ziel 70 %
   * - Bond B:   2 Stk × 100 € =   200 €, Ziel 20 %
   * - Cash:                     100 €, Ziel 10 %
   *   → Gesamt = 1.300 € (ungerundet)
   */
  const settings: Settings = {
    activePortfolioId: 'p1',
    totalRounding: 0,
    bands: { lowerPercent: 10, upperPercent: 20 },
    saveAssetGrenze: 0,
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

  const portfolio: Portfolio = {
    id: 'p1',
    name: 'Test',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    positions: [
      makePosition({ id: 'a', isin: 'A', symbol: 'A.DE', group: 'stocks', units: 10, targetPercent: 70 }),
      makePosition({ id: 'b', isin: 'B', symbol: 'B.DE', group: 'bonds', units: 2, targetPercent: 20 }),
      makePosition({
        id: 'c',
        isin: null,
        symbol: 'CASH',
        group: 'cash',
        units: 100,
        targetPercent: 10,
      }),
    ],
  }

  const quotes: QuoteMap = new Map([
    ['A', makeQuote({ isin: 'A', price: 100 })],
    ['B', makeQuote({ isin: 'B', price: 100 })],
  ])

  it('summiert Total korrekt (Stock + Bond + Cash)', () => {
    const result = computeRebalancing(portfolio, quotes, settings)
    expect(result.total).toBe(1_300)
  })

  it('liefert eine Row pro aktiver Position', () => {
    const result = computeRebalancing(portfolio, quotes, settings)
    expect(result.rows).toHaveLength(3)
  })

  it('markiert Cash-Position mit null-Quote', () => {
    const result = computeRebalancing(portfolio, quotes, settings)
    const cashRow = result.rows.find((row) => row.position.group === 'cash')
    expect(cashRow?.quote).toBeNull()
    expect(cashRow?.marketValue).toBe(100)
  })

  it('errechnet IST-% konsistent mit dem Total', () => {
    const result = computeRebalancing(portfolio, quotes, settings)
    const stockRow = result.rows.find((row) => row.position.id === 'a')
    // 1000 / 1300 ≈ 76.92 %
    expect(stockRow?.actualPercent).toBeCloseTo(76.92, 2)
  })

  it('gibt für jede AssetGroup ein Group-Result zurück (auch wenn leer)', () => {
    const result = computeRebalancing(portfolio, quotes, settings)
    const groupNames = result.groups.map((group) => group.group)
    expect(groupNames).toEqual(['stocks', 'bonds', 'metals', 'cash'])
    const metals = result.groups.find((group) => group.group === 'metals')
    expect(metals?.actualValue).toBe(0)
    expect(metals?.targetPercent).toBe(0)
  })

  it('setzt Vorschlag der übergewichteten Gruppe auf sell', () => {
    // Stock: IST 1000, Ziel 70% * 1300 = 910, Upper = 910 * 1.2 = 1092
    // → 1000 liegt innerhalb Band → ok. Um sell zu erzwingen: mehr Stock.
    const heavyStock: Portfolio = {
      ...portfolio,
      positions: portfolio.positions.map((position) =>
        position.id === 'a' ? { ...position, units: 20 } : position,
      ),
    }
    // Total = 2000 + 200 + 100 = 2300
    // Stock-IST = 2000, Ziel 70% * 2300 = 1610, Upper = 1932
    // 2000 > 1932 → sell
    const result = computeRebalancing(heavyStock, quotes, settings)
    const stockGroup = result.groups.find((group) => group.group === 'stocks')
    expect(stockGroup?.suggestion).toBe('sell')
  })

  it('ignoriert disabled Positionen im Total UND in den Rows', () => {
    const disabled: Portfolio = {
      ...portfolio,
      positions: portfolio.positions.map((position) =>
        position.id === 'b' ? { ...position, enabled: false } : position,
      ),
    }
    const result = computeRebalancing(disabled, quotes, settings)
    expect(result.total).toBe(1_100) // 1000 Stock + 100 Cash
    expect(result.rows.map((row) => row.position.id)).toEqual(['a', 'c'])
  })

  it('Invariante: Summe aller Row-Marktwerte = Summe der Group-Werte', () => {
    const result = computeRebalancing(portfolio, quotes, settings)
    const rowSum = result.rows.reduce((sum, row) => sum + row.marketValue, 0)
    const groupSum = result.groups.reduce((sum, group) => sum + group.actualValue, 0)
    expect(rowSum).toBeCloseTo(groupSum, 6)
  })

  it('meldet die Ziel-Summe im Ergebnis', () => {
    // 70 + 20 + 10 = 100
    const result = computeRebalancing(portfolio, quotes, settings)
    expect(result.targetPercentSum).toBe(100)
    expect(result.targetsExceeded).toBe(false)
  })

  it('markiert eine Ziel-Summe über 100 % als überzogen', () => {
    const overAllocated: Portfolio = {
      ...portfolio,
      positions: portfolio.positions.map((position) =>
        position.id === 'a' ? { ...position, targetPercent: 95 } : position,
      ),
    }
    // 95 + 20 + 10 = 125
    const result = computeRebalancing(overAllocated, quotes, settings)
    expect(result.targetPercentSum).toBe(125)
    expect(result.targetsExceeded).toBe(true)
  })

  it('eine Ziel-Summe unter 100 % gilt nicht als überzogen', () => {
    const underAllocated: Portfolio = {
      ...portfolio,
      positions: portfolio.positions.map((position) =>
        position.id === 'a' ? { ...position, targetPercent: 50 } : position,
      ),
    }
    const result = computeRebalancing(underAllocated, quotes, settings)
    expect(result.targetPercentSum).toBe(80)
    expect(result.targetsExceeded).toBe(false)
  })

  it('duldet Rundungsreste knapp über 100 %', () => {
    // 33.34 * 3 = 100.02 — das ist kein Konfigurationsfehler.
    const rounded: Portfolio = {
      ...portfolio,
      positions: portfolio.positions.map((position) => ({ ...position, targetPercent: 33.34 })),
    }
    const result = computeRebalancing(rounded, quotes, settings)
    expect(result.targetPercentSum).toBeCloseTo(100.02, 2)
    expect(result.targetsExceeded).toBe(true)
  })

  it('deaktivierte Positionen zählen nicht in die Ziel-Summe', () => {
    const withDisabled: Portfolio = {
      ...portfolio,
      positions: portfolio.positions.map((position) =>
        position.id === 'a' ? { ...position, enabled: false } : position,
      ),
    }
    const result = computeRebalancing(withDisabled, quotes, settings)
    expect(result.targetPercentSum).toBe(30)
  })

  it('leeres Portfolio → Total 0, keine Rows, alle Groups leer', () => {
    const empty: Portfolio = { ...portfolio, positions: [] }
    const result = computeRebalancing(empty, quotes, settings)
    expect(result.total).toBe(0)
    expect(result.rows).toHaveLength(0)
    result.groups.forEach((group) => {
      expect(group.actualValue).toBe(0)
      expect(group.targetPercent).toBe(0)
    })
  })
})
