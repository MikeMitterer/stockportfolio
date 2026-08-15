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
} from '@/domain/portfolioHistory'

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
})

describe('snapshotPoints', () => {
  it('sortiert nach Datum', () => {
    const points = snapshotPoints([
      { date: '2026-02-01', total: 200 },
      { date: '2026-01-01', total: 100 },
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
        { date: '2026-03-01', total: 2 },
        { date: '2026-01-01', total: 1 },
      ]),
    ).toBe('2026-01-01')
  })

  it('ist ohne Schnappschüsse leer', () => {
    expect(truthStart([])).toBeNull()
  })
})
