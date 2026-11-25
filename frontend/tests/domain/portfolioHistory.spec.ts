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
  referenceLine,
  snapshotPoints,
  truthStart,
  withinDays,
  type BacktestInput,
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

  it('trägt Kurse über Lücken und den Startrand fort, auch bei Bruchteilen (T-92, T-128)', () => {
    // A notiert am Starttag nicht: Sein Kurs vom 2. gilt am 3. weiter. Danach
    // wechseln die Handelstage ab, und jeder Tag nimmt je Papier den letzten
    // Kurs davor. Erwartet sind von Hand gerechnete Werte, kein Nachbau.
    const result = buildBacktest([
      {
        units: 0.5,
        points: [
          { date: '2026-01-01', close: 100 },
          { date: '2026-01-02', close: 110 },
          { date: '2026-01-05', close: 130 },
        ],
      },
      {
        units: 2,
        points: [
          { date: '2026-01-03', close: 10 },
          { date: '2026-01-04', close: 12 },
          { date: '2026-01-06', close: 15 },
        ],
      },
      { units: 3, points: [], constantValue: 7 },
    ])

    expect(result).toEqual([
      { date: '2026-01-03', close: 82 },
      { date: '2026-01-04', close: 86 },
      { date: '2026-01-05', close: 96 },
      { date: '2026-01-06', close: 102 },
    ])
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
function tradingDays(
  fromYear: number,
  toYear: number,
  random: () => number,
  gapRate: number,
): string[] {
  const days: string[] = []
  for (
    let day = new Date(Date.UTC(fromYear, 0, 1));
    day.getUTCFullYear() <= toYear;
    day.setUTCDate(day.getUTCDate() + 1)
  ) {
    const weekday = day.getUTCDay()
    if (weekday !== 0 && weekday !== 6 && random() >= gapRate)
      days.push(day.toISOString().slice(0, 10))
  }
  return days
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

describe('referenceLine', () => {
  const depot = [
    { date: '2026-03-02', close: 10000 },
    { date: '2026-03-03', close: 10200 },
    { date: '2026-03-04', close: 9900 },
  ]

  it('beginnt am ersten gezeigten Tag beim Depotwert und folgt dem Index prozentual', () => {
    const index = [
      { date: '2026-03-01', close: 90 },
      { date: '2026-03-02', close: 100 },
      { date: '2026-03-03', close: 110 },
      { date: '2026-03-04', close: 105 },
    ]

    expect(referenceLine(depot, index)).toEqual([
      { date: '2026-03-02', close: 10000 },
      { date: '2026-03-03', close: 11000 },
      { date: '2026-03-04', close: 10500 },
    ])
  })

  it('nimmt am Starttag den letzten Indexkurs davor, wenn der Index dort nicht notiert', () => {
    // Börsenfeiertag des Index: Ohne Fortschreibung begänne die Linie einen Tag
    // später auf einer anderen Höhe als das Depot.
    const index = [
      { date: '2026-03-01', close: 50 },
      { date: '2026-03-03', close: 55 },
    ]

    expect(referenceLine(depot, index)).toEqual([
      { date: '2026-03-02', close: 10000 },
      { date: '2026-03-03', close: 11000 },
    ])
  })

  it('setzt erst ein, wo der Index beginnt, auf der Höhe des Depots an diesem Tag', () => {
    const index = [
      { date: '2026-03-03', close: 20 },
      { date: '2026-03-04', close: 21 },
    ]

    expect(referenceLine(depot, index)).toEqual([
      { date: '2026-03-03', close: 10200 },
      { date: '2026-03-04', close: 10710 },
    ])
  })

  it('bleibt leer ohne Überschneidung, ohne Index oder mit einem Kurs von null', () => {
    expect(referenceLine(depot, [{ date: '2026-04-01', close: 100 }])).toEqual([])
    expect(referenceLine(depot, [])).toEqual([])
    expect(referenceLine([], [{ date: '2026-03-02', close: 100 }])).toEqual([])
    expect(referenceLine(depot, [{ date: '2026-03-02', close: 0 }])).toEqual([])
  })

  it('bleibt leer, wenn der Index vor dem gezeigten Zeitraum endet', () => {
    // Sonst bliebe ein einzelner Startpunkt ohne Linie — und kein Hinweis.
    expect(referenceLine(depot, [{ date: '2026-01-02', close: 100 }])).toEqual([])
  })
})
