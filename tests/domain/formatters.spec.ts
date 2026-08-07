/**
 * Unit-Tests für src/domain/formatters.ts — DE-Locale-Formatter.
 * Prüft Verhalten, nicht Referenz-Werte aus einer Datei.
 */

import { describe, expect, it } from 'vitest'
import {
  eur,
  eurCent,
  eurSigned,
  integer,
  number,
  percent,
  percentInt,
  percentSigned,
} from '@/domain/formatters'

// Non-breaking-space (U+00A0) — Intl fügt ihn vor „€" ein.
// String-Vergleiche machen wir daher meist über includes/regex.

describe('eur', () => {
  it('rendert ganze Beträge ohne Nachkommastellen', () => {
    expect(eur(1234)).toMatch(/^1\.234\s€$/)
  })

  it('rundet Bruchbeträge', () => {
    expect(eur(1234.56)).toMatch(/^1\.235\s€$/)
  })

  it('rendert 0 als „0 €"', () => {
    expect(eur(0)).toMatch(/^0\s€$/)
  })

  it('rendert negative Beträge mit Minus', () => {
    expect(eur(-1234)).toMatch(/^-1\.234\s€$/)
  })
})

describe('eurCent', () => {
  it('rendert immer zwei Nachkommastellen', () => {
    expect(eurCent(162.4)).toMatch(/^162,40\s€$/)
    expect(eurCent(0)).toMatch(/^0,00\s€$/)
  })
})

describe('eurSigned', () => {
  it('setzt „+" vor positive Werte', () => {
    expect(eurSigned(1000)).toMatch(/^\+1\.000\s€$/)
  })

  it('setzt „−" (Unicode-Minus) vor negative Werte', () => {
    expect(eurSigned(-1000)).toMatch(/^−1\.000\s€$/)
  })

  it('setzt „+" auch vor 0', () => {
    expect(eurSigned(0)).toMatch(/^\+0\s€$/)
  })
})

describe('percent', () => {
  it('rendert mit einer Nachkommastelle und Suffix', () => {
    expect(percent(15.05)).toBe('15,1 %')
  })

  it('rendert 0 als „0,0 %"', () => {
    expect(percent(0)).toBe('0,0 %')
  })

  it('behält Vorzeichen bei negativen Prozenten', () => {
    expect(percent(-12.34)).toBe('-12,3 %')
  })
})

describe('percentInt', () => {
  it('rendert ohne Nachkommastelle', () => {
    expect(percentInt(15.7)).toBe('16 %')
    expect(percentInt(0)).toBe('0 %')
  })
})

describe('percentSigned', () => {
  it('setzt „+" vor positive Werte', () => {
    expect(percentSigned(5.3)).toBe('+5,3 %')
  })

  it('setzt Unicode-Minus vor negative Werte', () => {
    expect(percentSigned(-7.8)).toBe('−7,8 %')
  })

  it('setzt „+" vor 0', () => {
    expect(percentSigned(0)).toBe('+0,0 %')
  })
})

describe('integer', () => {
  it('nutzt Punkt als Tausendertrenner (DE-Locale)', () => {
    expect(integer(1234567)).toBe('1.234.567')
  })

  it('rundet Bruchzahlen', () => {
    expect(integer(1234.7)).toBe('1.235')
  })
})

describe('number', () => {
  it('kann bis 4 Nachkommastellen zeigen', () => {
    expect(number(3.14159)).toBe('3,1416')
  })

  it('gibt ganze Zahlen ohne Komma zurück', () => {
    expect(number(42)).toBe('42')
  })
})
