/**
 * Unit-Tests für src/domain/amount.ts.
 * Fokus: die Umrechnung beim Einheitenwechsel — sie darf den Betrag nicht
 * verändern, nur seine Ausdrucksweise.
 */

import { describe, expect, it } from 'vitest'
import { convertAmount, resolveAmount } from '@/domain/amount'

describe('resolveAmount', () => {
  it('gibt einen festen Betrag unverändert zurück', () => {
    expect(resolveAmount({ mode: 'absolute', value: 5000 }, 100000)).toBe(5000)
  })

  it('rechnet einen Anteil aufs Gesamtvermögen um', () => {
    expect(resolveAmount({ mode: 'percent', value: 5 }, 100000)).toBe(5000)
  })

  it('ergibt ohne Gesamtvermögen null', () => {
    expect(resolveAmount({ mode: 'percent', value: 5 }, 0)).toBe(0)
  })
})

describe('convertAmount', () => {
  it('lässt die Einstellung unberührt, wenn die Einheit schon stimmt', () => {
    const setting = { mode: 'percent', value: 5 } as const
    expect(convertAmount(setting, 'percent', 100000)).toBe(setting)
  })

  it('hält den Betrag beim Wechsel auf Prozent konstant', () => {
    const converted = convertAmount({ mode: 'absolute', value: 5000 }, 'percent', 100000)
    expect(converted).toEqual({ mode: 'percent', value: 5 })
    expect(resolveAmount(converted, 100000)).toBe(5000)
  })

  it('hält den Betrag beim Wechsel auf Euro konstant', () => {
    const converted = convertAmount({ mode: 'percent', value: 5 }, 'absolute', 100000)
    expect(converted).toEqual({ mode: 'absolute', value: 5000 })
  })

  it('fällt ohne Gesamtvermögen auf null zurück statt durch null zu teilen', () => {
    expect(convertAmount({ mode: 'absolute', value: 5000 }, 'percent', 0)).toEqual({
      mode: 'percent',
      value: 0,
    })
  })
})
