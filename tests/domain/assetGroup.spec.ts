/**
 * Unit-Tests für die Assetklassen-Heuristik.
 * Sie liefert einen Vorschlag — geprüft wird, dass die Hinweise greifen und
 * der Rückfall sinnvoll ist, nicht eine bestimmte Instrumentenliste.
 */

import { describe, expect, it } from 'vitest'
import { suggestAssetGroup } from '@/domain/assetGroup'

describe('suggestAssetGroup — Edelmetalle', () => {
  it.each([
    'Xetra-Gold',
    'WisdomTree Physical Silver',
    'Invesco Physical Palladium',
    'iShares Physical Gold ETC',
  ])('erkennt „%s" als Edelmetall', (name) => {
    expect(suggestAssetGroup(name, 'stock')).toBe('metals')
  })

  it('erkennt Metalle unabhängig von der Groß-/Kleinschreibung', () => {
    expect(suggestAssetGroup('XETRA-GOLD', 'stock')).toBe('metals')
    expect(suggestAssetGroup('silber-etc', 'etf')).toBe('metals')
  })
})

describe('suggestAssetGroup — Anleihen', () => {
  it.each([
    'iShares $ Treasury Bond 7-10yr UCITS ETF',
    'Xtrackers II Global Government Bond',
    'iShares Core € Corporate Bond',
    'Vanguard Global Aggregate Bond',
  ])('erkennt „%s" als Anleihe', (name) => {
    expect(suggestAssetGroup(name, 'etf')).toBe('bonds')
  })
})

describe('suggestAssetGroup — Rückfall', () => {
  it('schlägt bei Aktien-ETFs „stocks" vor', () => {
    expect(suggestAssetGroup('Vanguard FTSE All-World UCITS ETF', 'etf')).toBe('stocks')
  })

  it('schlägt bei Einzelaktien „stocks" vor', () => {
    expect(suggestAssetGroup('Berkshire Hathaway Inc.', 'stock')).toBe('stocks')
  })

  it('kommt mit fehlendem Namen zurecht', () => {
    expect(suggestAssetGroup(null, 'etf')).toBe('stocks')
  })

  it('kommt mit fehlendem Typ zurecht', () => {
    expect(suggestAssetGroup('Irgendein Fonds', null)).toBe('stocks')
  })

  it('schlägt nie „cash" vor — Cash wird nicht über Instrumente angelegt', () => {
    const names = ['Cash Fund', 'Geldmarkt', 'Xetra-Gold', 'Treasury Bond']
    names.forEach((name) => {
      expect(suggestAssetGroup(name, 'etf')).not.toBe('cash')
    })
  })
})

describe('suggestAssetGroup — Vorrang', () => {
  it('Metall schlägt Anleihe, wenn beide Hinweise vorkommen', () => {
    // Ein Produkt mit „Gold" und „Bond" im Namen ist eher ein Metall-Papier.
    expect(suggestAssetGroup('Gold Bond Strategy Fund', 'etf')).toBe('metals')
  })
})
