/**
 * Unit-Tests für src/domain/schedule.ts.
 *
 * Fokus: die Datumsrechnung. Monatsenden und Schaltjahre sind die Stellen,
 * an denen naive Implementierungen kippen — genau die stehen hier.
 */

import { describe, expect, it } from 'vitest'
import {
  addMonths,
  daysUntilDue,
  isDue,
  nextDueDate,
  usesBands,
  usesCalendar,
} from '@/domain/schedule'

describe('usesBands / usesCalendar', () => {
  it('trennt die drei Auslöser sauber', () => {
    expect([usesBands('bands'), usesCalendar('bands')]).toEqual([true, false])
    expect([usesBands('calendar'), usesCalendar('calendar')]).toEqual([false, true])
    expect([usesBands('both'), usesCalendar('both')]).toEqual([true, true])
  })
})

describe('addMonths', () => {
  it('zählt Monate im Normalfall schlicht hoch', () => {
    expect(addMonths(new Date(2026, 0, 15), 12)).toEqual(new Date(2027, 0, 15))
  })

  it('rutscht nicht über den Monatsletzten hinaus', () => {
    // 31. Januar + 1 Monat ist der 28. Februar, nicht der 3. März.
    expect(addMonths(new Date(2026, 0, 31), 1)).toEqual(new Date(2026, 1, 28))
  })

  it('kennt den Schalttag', () => {
    expect(addMonths(new Date(2024, 0, 31), 1)).toEqual(new Date(2024, 1, 29))
  })

  it('geht über den Jahreswechsel', () => {
    expect(addMonths(new Date(2026, 10, 30), 3)).toEqual(new Date(2027, 1, 28))
  })
})

describe('nextDueDate', () => {
  it('rechnet den Abstand auf den letzten Ausgleich', () => {
    expect(nextDueDate('2026-03-01T00:00:00.000Z', 12)?.getFullYear()).toBe(2027)
  })

  it('kennt ohne bisherigen Ausgleich keinen Termin', () => {
    expect(nextDueDate(null, 12)).toBeNull()
    expect(nextDueDate(undefined, 12)).toBeNull()
  })

  it('verwirft unlesbare Datumsangaben, statt daraus zu rechnen', () => {
    expect(nextDueDate('übermorgen', 12)).toBeNull()
  })

  it('lässt keinen Abstand unter einem Monat zu', () => {
    const zero = nextDueDate('2026-03-01T00:00:00.000Z', 0)
    const one = nextDueDate('2026-03-01T00:00:00.000Z', 1)
    expect(zero).toEqual(one)
  })
})

describe('isDue', () => {
  const last = '2026-01-15T00:00:00.000Z'

  it('ist vor dem Termin nicht fällig', () => {
    expect(isDue(last, 12, new Date(2026, 11, 31))).toBe(false)
  })

  it('ist am Termin selbst fällig', () => {
    expect(isDue(last, 12, new Date(2027, 0, 15))).toBe(true)
  })

  it('bleibt danach fällig', () => {
    expect(isDue(last, 12, new Date(2028, 5, 1))).toBe(true)
  })

  it('gilt ohne bisherigen Ausgleich als fällig', () => {
    // Wer die Einstellung einschaltet, will wissen, wo er steht — nicht erst
    // in einem Jahr.
    expect(isDue(null, 12, new Date(2026, 0, 1))).toBe(true)
  })

  it('vergleicht auf den Tag, nicht auf die Sekunde', () => {
    // Der Termin liegt um Mitternacht; am selben Tag um 23 Uhr ist er erreicht.
    expect(isDue(last, 12, new Date(2027, 0, 15, 23, 59))).toBe(true)
  })
})

describe('daysUntilDue', () => {
  it('zählt die Tage bis zum Termin', () => {
    expect(daysUntilDue('2026-01-15T00:00:00.000Z', 12, new Date(2027, 0, 5))).toBe(10)
  })

  it('wird negativ, sobald der Termin vorbei ist', () => {
    expect(daysUntilDue('2026-01-15T00:00:00.000Z', 12, new Date(2027, 0, 25))).toBe(-10)
  })

  it('liefert ohne Termin nichts, statt null Tage zu behaupten', () => {
    expect(daysUntilDue(null, 12, new Date(2026, 0, 1))).toBeNull()
  })
})
