/**
 * Unit-Tests für src/domain/formatters.ts — DE-Locale-Formatter.
 * Prüft Verhalten, nicht Referenz-Werte aus einer Datei.
 */

import { describe, expect, it } from 'vitest'
import { counted, eur, eurCent, eurSigned, integer, money, number, percent, percentInt, percentSigned, pluralize } from '@/domain/formatters'

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

describe('money', () => {
  it('setzt das Zeichen der angegebenen Währung', () => {
    // Der Grund für die Funktion: „31.410 €" für einen USD-Betrag ist
    // schlimmer als gar keine Angabe.
    expect(money(31410, 'USD')).toContain('$')
    expect(money(31410, 'USD')).not.toContain('€')
  })

  it('nimmt den Code in beliebiger Schreibweise', () => {
    expect(money(100, 'usd')).toBe(money(100, 'USD'))
  })

  it('fällt bei unbekanntem Code auf Zahl plus Kürzel zurück', () => {
    // Lieber eine schlichte Anzeige als eine Ausnahme mitten in der Tabelle.
    expect(money(1234, 'XYZZY')).toContain('XYZZY')
    expect(money(1234, 'XYZZY')).toContain('1.234')
  })

  it('rundet auf ganze Einheiten, wie die Euro-Anzeige', () => {
    expect(money(1234.56, 'USD')).not.toContain(',56')
  })
})

describe('counted / pluralize', () => {
  it('setzt Zahl und Form zusammen', () => {
    expect(counted(1, 'Position')).toBe('1 Position')
    expect(counted(3, 'Position')).toBe('3 Positionen')
  })

  it('bildet den Plural ohne Angabe mit „en"', () => {
    expect(counted(0, 'Position')).toBe('0 Positionen')
  })

  it('nimmt einen abweichenden Plural entgegen', () => {
    // Nicht jedes Wort geht auf „en": „Assets", „Kurse".
    expect(counted(2, 'Asset', 'Assets')).toBe('2 Assets')
    expect(counted(2, 'Kurs', 'Kurse')).toBe('2 Kurse')
  })

  it('trennt bei großen Zahlen wie sonst auch', () => {
    expect(counted(1234, 'Position')).toBe('1.234 Positionen')
  })

  it('liefert mit pluralize nur die Form', () => {
    // Für Sätze, in denen die Zahl an anderer Stelle steht.
    expect(pluralize(1, 'zählt', 'zählen')).toBe('zählt')
    expect(pluralize(2, 'zählt', 'zählen')).toBe('zählen')
  })
})
