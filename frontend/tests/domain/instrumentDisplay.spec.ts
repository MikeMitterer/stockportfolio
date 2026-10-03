import { describe, expect, it } from 'vitest'
import { instrumentTypeLabelKey, terApplies } from '@/domain/instrumentDisplay'
import { i18n, translate } from '@/i18n'
import type { DetailDefinition } from '@/types/details'

function terDefinition(instrumentTypes: string[], identityKinds: string[]): DetailDefinition {
  return {
    name: 'ter', kind: 'number', unit: 'percent', labelEn: 'TER', labelDe: 'TER', overridable: true,
    sources: ['justetf'], scopes: [{ source: 'justetf', instrumentTypes, identityKinds }],
    minimum: 0, maximum: 5, currencyRequired: false,
  }
}

describe('Anzeigeregeln der Assets-Übersicht', () => {
  it('übersetzt alle Gattungen, die StockInfo kennt', () => {
    for (const type of ['stock', 'etf', 'etc', 'fund', 'bond', 'crypto']) {
      const labelKey = instrumentTypeLabelKey(type)
      expect(labelKey, type).not.toBeNull()
      expect(translate(labelKey ?? ''), type).not.toBe(labelKey)
    }
    i18n.global.locale.value = 'de'
    expect(translate(instrumentTypeLabelKey('bond') ?? '')).toBe('Anleihe')
    i18n.global.locale.value = 'en'
    expect(translate(instrumentTypeLabelKey('bond') ?? '')).toBe('Bond')
  })

  it('lässt eine unbekannte Gattung als Rohwert stehen', () => {
    expect(instrumentTypeLabelKey('future-type')).toBeNull()
  })

  it('zeigt die TER nur, wo der Feldkatalog sie deklariert', () => {
    const definitions = [terDefinition(['etf', 'etc'], ['listed'])]
    expect(terApplies('etf', 'listed', definitions)).toBe(true)
    expect(terApplies('etc', 'listed', definitions)).toBe(true)
    expect(terApplies('bond', 'isin_only', definitions)).toBe(false)
    expect(terApplies('crypto', 'pair', definitions)).toBe(false)
    expect(terApplies('etf', 'isin_only', definitions)).toBe(false)
  })

  it('behält den flachen Wert ohne Katalog oder ohne TER-Deklaration', () => {
    expect(terApplies('bond', 'isin_only', null)).toBe(true)
    expect(terApplies('bond', 'isin_only', [])).toBe(true)
  })
})
