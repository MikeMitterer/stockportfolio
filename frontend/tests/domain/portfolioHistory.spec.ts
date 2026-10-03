/**
 * Unit-Tests für src/domain/portfolioHistory.ts.
 *
 * Fokus: die Zeitachse. Zwei Papiere mit unterschiedlichen Handelstagen sind
 * der Normalfall — was dabei herauskommt, entscheidet, ob die Kurve stimmt
 * oder Stufen zeigt, die es nie gab.
 */

import { describe, expect, it } from 'vitest'
import {
  buildBacktest,
  snapshotPoints,
  truthStart,
  withinDays,
  type BacktestInput,
} from '@/domain/portfolioHistory'
import type { HistoryPoint } from '@/domain/sparkline'

describe('buildBacktest', () => {
  it('rechnet Bestand mal Kurs je Tag', () => {
    const result = buildBacktest([
      {
        units: 10,
        points: [
          { date: '2026-01-01', close: 100 },
          { date: '2026-01-02', close: 110 },
        ],
      },
    ])

    expect(result).toEqual([
      { date: '2026-01-01', close: 1000 },
      { date: '2026-01-02', close: 1100 },
    ])
  })

  it('addiert Positionen ohne Kursverlauf als konstanten Betrag', () => {
    const result = buildBacktest([
      { units: 1, points: [{ date: '2026-01-01', close: 100 }] },
      { units: 5000, points: [], constantValue: 5000 },
    ])

    expect(result).toEqual([{ date: '2026-01-01', close: 5100 }])
  })

  it('beginnt erst, wenn jedes Papier notiert war', () => {
    // Das zweite Papier gibt es erst ab dem 3. — vorher fehlte sein Kurs, und
    // ihn als Null zu behandeln ergäbe eine Stufe, die es nie gab.
    const result = buildBacktest([
      {
        units: 1,
        points: [
          { date: '2026-01-01', close: 100 },
          { date: '2026-01-03', close: 100 },
        ],
      },
      { units: 1, points: [{ date: '2026-01-03', close: 50 }] },
    ])

    expect(result.map((point) => point.date)).toEqual(['2026-01-03'])
    expect(result[0]?.close).toBe(150)
  })

  it('schreibt den letzten bekannten Kurs fort', () => {
    // Zwei Börsen, unterschiedliche Feiertage: Am 2. notiert nur eines der
    // Papiere. Ohne Fortschreibung fiele die Kurve an diesem Tag ein.
    const result = buildBacktest([
      {
        units: 1,
        points: [
          { date: '2026-01-01', close: 100 },
          { date: '2026-01-02', close: 120 },
        ],
      },
      {
        units: 1,
        points: [
          { date: '2026-01-01', close: 50 },
          { date: '2026-01-03', close: 60 },
        ],
      },
    ])

    const second = result.find((point) => point.date === '2026-01-02')
    expect(second?.close).toBe(170)
  })

  it('liefert nichts, wenn kein Papier einen Kurs hat', () => {
    expect(buildBacktest([{ units: 5000, points: [], constantValue: 5000 }])).toEqual([])
  })

  it('liefert dieselben Werte wie die bisherige Suche je Tag (T-92)', () => {
    // Die frühere Fassung suchte für jeden Tag den letzten Kurs von vorn. Sie
    // dient hier als Maßstab: unterschiedliche Startdaten, Lücken, Feiertage,
    // Bruchteile von Stücken und ein fester Betrag.
    const random = seededRandom(92)
    const inputs: BacktestInput[] = Array.from({ length: 8 }, (_, index) => ({
      units: Math.round(random() * 1000) / 7,
      points: tradingDays(2018 + (index % 3), 2026, random, 0.08).map((date) => ({ date, close: 10 + random() * 500 })),
    }))
    inputs.push({ units: 3, points: [], constantValue: 1234.56 })

    expect(buildBacktest(inputs)).toEqual(previousBuildBacktest(inputs))
  })

  it('rechnet 25 Positionen mit 20 Jahren Verlauf ohne spürbare Wartezeit (T-92)', () => {
    // Vorher rund 1,2 Sekunden; das Dashboard zeigte so lange Platzhalter.
    const random = seededRandom(7)
    const inputs: BacktestInput[] = Array.from({ length: 25 }, () => ({
      units: 1,
      points: tradingDays(2006, 2026, random, 0).map((date) => ({ date, close: 100 + random() })),
    }))

    const started = performance.now()
    const result = buildBacktest(inputs)
    const elapsed = performance.now() - started

    expect(result.length).toBeGreaterThan(5000)
    expect(elapsed).toBeLessThan(250)
  })
})

/** Wiederholbare Zufallszahlen, damit ein Fehlschlag reproduzierbar bleibt. */
function seededRandom(seed: number): () => number {
  let state = seed
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296
    return state / 4294967296
  }
}

/** Werktage vom 1. Januar `fromYear` bis Jahresende `toYear`; `gapRate` lässt Tage zufällig aus. */
function tradingDays(fromYear: number, toYear: number, random: () => number, gapRate: number): string[] {
  const days: string[] = []
  for (let day = new Date(Date.UTC(fromYear, 0, 1)); day.getUTCFullYear() <= toYear; day.setUTCDate(day.getUTCDate() + 1)) {
    const weekday = day.getUTCDay()
    if (weekday !== 0 && weekday !== 6 && random() >= gapRate) days.push(day.toISOString().slice(0, 10))
  }
  return days
}

/** Die Fassung vor T-92, unverändert als Vergleichsmaßstab. */
function previousBuildBacktest(inputs: BacktestInput[]): HistoryPoint[] {
  const closeOnOrBefore = (points: HistoryPoint[], date: string): number | null => {
    let found: number | null = null
    for (const point of points) {
      if (point.date > date) break
      found = point.close
    }
    return found
  }
  const priced = inputs.filter((input) => input.points.length > 0)
  if (priced.length === 0) return []
  const start = priced
    .map((input) => input.points[0]!.date)
    .reduce((latest, date) => (date > latest ? date : latest))
  const dates = [
    ...new Set(
      priced.flatMap((input) =>
        input.points.map((point) => point.date).filter((date) => date >= start),
      ),
    ),
  ].sort()
  const constant = inputs
    .filter((input) => input.points.length === 0)
    .reduce((sum, input) => sum + (input.constantValue ?? 0), 0)
  return dates.map((date) => ({
    date,
    close:
      constant +
      priced.reduce((sum, input) => sum + input.units * (closeOnOrBefore(input.points, date) ?? 0), 0),
  }))
}

describe('snapshotPoints', () => {
  it('sortiert nach Datum', () => {
    const points = snapshotPoints([
      { date: '2026-02-01', total: 200, currency: 'EUR' },
      { date: '2026-01-01', total: 100, currency: 'EUR' },
    ])

    expect(points.map((point) => point.date)).toEqual(['2026-01-01', '2026-02-01'])
  })
})

describe('withinDays', () => {
  const points = [
    { date: '2026-01-01', close: 1 },
    { date: '2026-03-01', close: 2 },
    { date: '2026-03-25', close: 3 },
  ]

  it('behält nur die letzten Tage', () => {
    expect(withinDays(points, 30, new Date(2026, 2, 31)).map((point) => point.date)).toEqual([
      '2026-03-01',
      '2026-03-25',
    ])
  })

  it('lässt bei 0 alles stehen', () => {
    expect(withinDays(points, 0, new Date(2026, 2, 31))).toHaveLength(3)
  })
})

describe('truthStart', () => {
  it('nennt den ersten Schnappschuss', () => {
    expect(
      truthStart([
        { date: '2026-03-01', total: 2, currency: 'EUR' },
        { date: '2026-01-01', total: 1, currency: 'EUR' },
      ]),
    ).toBe('2026-01-01')
  })

  it('ist ohne Schnappschüsse leer', () => {
    expect(truthStart([])).toBeNull()
  })
})
