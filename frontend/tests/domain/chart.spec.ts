/**
 * Tests für die Rechenteile des Kursdiagramms.
 *
 * Achsen sind zum Überschlagen da: Eine Beschriftung „163,4172" ist genau und
 * trotzdem unbrauchbar. Geprüft wird deshalb vor allem, ob die Schritte rund
 * bleiben — und ob die Randfälle keine kaputte Achse ergeben.
 */

import { describe, expect, it } from 'vitest'
import { changeFrom, extent, indexAtRatio, niceTicks, tickIndices } from '@/domain/chart'

describe('niceTicks', () => {
  it('liefert runde Schritte', () => {
    expect(niceTicks(0, 100, 4)).toEqual([0, 25, 50, 75, 100])
  })

  it('umschließt den Wertebereich', () => {
    // Sonst klebte die Linie am Rand oder liefe darüber hinaus.
    const ticks = niceTicks(152.11, 163.2, 4)

    expect(ticks[0]).toBeLessThanOrEqual(152.11)
    expect(ticks[ticks.length - 1]).toBeGreaterThanOrEqual(163.2)
  })

  it('bleibt bei einem engen Bereich fein genug', () => {
    // Kurse zwischen 160 und 165: Eine Achse in Hunderterschritten wäre eine
    // einzige Linie.
    const ticks = niceTicks(160, 165, 4)

    expect(ticks.length).toBeGreaterThanOrEqual(3)
    expect(ticks[ticks.length - 1]! - ticks[0]!).toBeLessThan(20)
  })

  it('trifft ungefähr die gewünschte Anzahl', () => {
    const ticks = niceTicks(0, 97, 4)

    expect(ticks.length).toBeGreaterThanOrEqual(3)
    expect(ticks.length).toBeLessThanOrEqual(7)
  })

  it('erzeugt keine Rundungsfehler in der Beschriftung', () => {
    // Wiederholtes Addieren von 0,1 ergäbe 0,30000000000000004 — und genau
    // das stünde dann an der Achse.
    const ticks = niceTicks(0, 0.5, 5)

    for (const tick of ticks) {
      expect(String(tick)).not.toMatch(/\d{10}/)
    }
  })

  it('zieht bei einem flachen Verlauf ein Fenster auf, statt zu versagen', () => {
    const ticks = niceTicks(100, 100, 4)

    expect(ticks.length).toBeGreaterThanOrEqual(2)
    expect(ticks[0]).toBeLessThan(100)
    expect(ticks[ticks.length - 1]).toBeGreaterThan(100)
  })

  it('kommt mit negativen Werten zurecht', () => {
    const ticks = niceTicks(-50, 50, 4)

    expect(ticks[0]).toBeLessThanOrEqual(-50)
    expect(ticks).toContain(0)
  })

  it('liefert bei unbrauchbaren Grenzen nichts', () => {
    expect(niceTicks(Number.NaN, 10)).toEqual([])
  })
})

describe('tickIndices', () => {
  it('nimmt ersten und letzten Punkt immer mit', () => {
    // Sie spannen den gezeigten Bereich auf — ohne sie weiß niemand, wovon
    // bis wohin.
    const indices = tickIndices(100, 5)

    expect(indices[0]).toBe(0)
    expect(indices[indices.length - 1]).toBe(99)
  })

  it('verteilt gleichmäßig', () => {
    expect(tickIndices(9, 5)).toEqual([0, 2, 4, 6, 8])
  })

  it('zeigt bei wenigen Punkten alle', () => {
    expect(tickIndices(3, 5)).toEqual([0, 1, 2])
  })

  it('liefert ohne Punkte nichts', () => {
    expect(tickIndices(0)).toEqual([])
  })

  it('gibt keine Position doppelt zurück', () => {
    const indices = tickIndices(6, 5)

    expect(new Set(indices).size).toBe(indices.length)
  })
})

describe('indexAtRatio', () => {
  it('findet den nächstgelegenen Punkt', () => {
    expect(indexAtRatio(0, 5)).toBe(0)
    expect(indexAtRatio(0.5, 5)).toBe(2)
    expect(indexAtRatio(1, 5)).toBe(4)
  })

  it('bleibt am Rand stehen, statt daneben zu greifen', () => {
    // Der Zeiger darf auch außerhalb des Diagramms landen.
    expect(indexAtRatio(-0.5, 5)).toBe(0)
    expect(indexAtRatio(1.5, 5)).toBe(4)
  })

  it('meldet ohne Punkte -1', () => {
    expect(indexAtRatio(0.5, 0)).toBe(-1)
  })
})

describe('changeFrom', () => {
  it('rechnet die Veränderung gegenüber dem Beginn', () => {
    expect(changeFrom(110, 100)).toBeCloseTo(10, 6)
    expect(changeFrom(90, 100)).toBeCloseTo(-10, 6)
  })

  it('bleibt bei einem Nullwert am Beginn bei 0', () => {
    // Sonst stünde Unendlich an der Achse.
    expect(changeFrom(50, 0)).toBe(0)
  })
})

describe('extent', () => {
  it('nennt kleinsten und größten Schlusskurs', () => {
    const range = extent([
      { date: 'a', close: 120 },
      { date: 'b', close: 90 },
      { date: 'c', close: 150 },
    ])

    expect(range).toEqual({ min: 90, max: 150 })
  })

  it('übergeht kaputte Werte', () => {
    const range = extent([
      { date: 'a', close: 100 },
      { date: 'b', close: Number.NaN },
    ])

    expect(range).toEqual({ min: 100, max: 100 })
  })

  it('liefert ohne brauchbare Punkte null', () => {
    expect(extent([])).toBeNull()
  })
})
