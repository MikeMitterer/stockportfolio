/**
 * Unit-Tests für die Auflösung externer Verweise.
 *
 * Kernregel: Ein Meldefonds-Nachweis darf bei einer Aktie nicht erscheinen —
 * eine Aktie kann keiner sein, der Link ginge ins Leere.
 */

import { describe, expect, it } from 'vitest'
import { appliesToKind, fillTemplate, resolveKind, resolveLinks } from '@/domain/links'
import type { ExternalLink, Position } from '@/types/portfolio'

function makeLink(overrides: Partial<ExternalLink> = {}): ExternalLink {
  return {
    id: 'test',
    label: 'Test',
    urlTemplate: 'https://example.test/{isin}',
    appliesTo: [],
    enabled: true,
    ...overrides,
  }
}

function makePosition(overrides: Partial<Position> = {}): Position {
  return {
    id: 'p-1',
    isin: 'IE0000000001',
    symbol: 'AAA.DE',
    displayName: 'AAA',
    group: 'stocks',
    kind: 'etf',
    units: 10,
    targetPercent: 50,
    enabled: true,
    ...overrides,
  }
}

describe('resolveKind', () => {
  it('nimmt die auf der Position gespeicherte Gattung', () => {
    expect(resolveKind({ kind: 'stock', group: 'stocks' })).toBe('stock')
  })

  it('fällt auf die Angabe aus dem Kurs zurück', () => {
    expect(resolveKind({ kind: null, group: 'stocks' }, 'etf')).toBe('etf')
  })

  it('bevorzugt die Position gegenüber dem Kurs', () => {
    expect(resolveKind({ kind: 'stock', group: 'stocks' }, 'etf')).toBe('stock')
  })

  it('liefert null für Cash', () => {
    expect(resolveKind({ kind: null, group: 'cash' }, 'etf')).toBeNull()
  })

  it('liefert null bei unbekanntem Kurs-Typ', () => {
    expect(resolveKind({ kind: null, group: 'stocks' }, 'zertifikat')).toBeNull()
  })

  it('liefert null, wenn nichts bekannt ist', () => {
    expect(resolveKind({ kind: null, group: 'stocks' })).toBeNull()
  })
})

describe('fillTemplate', () => {
  it('setzt die ISIN ein', () => {
    expect(fillTemplate('https://x.test/{isin}', { isin: 'IE123', symbol: 'A.DE' })).toBe(
      'https://x.test/IE123',
    )
  })

  it('setzt das Symbol ein', () => {
    expect(fillTemplate('https://x.test/{symbol}', { isin: null, symbol: 'A.DE' })).toBe(
      'https://x.test/A.DE',
    )
  })

  it('ersetzt mehrfache Platzhalter', () => {
    expect(fillTemplate('{isin}/{isin}', { isin: 'IE123', symbol: 'A.DE' })).toBe('IE123/IE123')
  })

  it('liefert null, wenn die Vorlage eine ISIN braucht, aber keine da ist', () => {
    expect(fillTemplate('https://x.test/{isin}', { isin: null, symbol: 'A.DE' })).toBeNull()
  })

  it('kommt ohne Platzhalter aus', () => {
    expect(fillTemplate('https://x.test/', { isin: null, symbol: 'A.DE' })).toBe('https://x.test/')
  })
})

describe('appliesToKind', () => {
  it('leeres appliesTo gilt für alle Gattungen', () => {
    expect(appliesToKind(makeLink({ appliesTo: [] }), 'etf')).toBe(true)
    expect(appliesToKind(makeLink({ appliesTo: [] }), 'stock')).toBe(true)
    expect(appliesToKind(makeLink({ appliesTo: [] }), null)).toBe(true)
  })

  it('greift nur bei passender Gattung', () => {
    const link = makeLink({ appliesTo: ['etf'] })
    expect(appliesToKind(link, 'etf')).toBe(true)
    expect(appliesToKind(link, 'stock')).toBe(false)
  })

  it('greift nicht bei unbekannter Gattung, wenn eingeschränkt', () => {
    expect(appliesToKind(makeLink({ appliesTo: ['etf'] }), null)).toBe(false)
  })
})

describe('resolveLinks', () => {
  const oekb = makeLink({
    id: 'oekb',
    label: 'myOEKB',
    urlTemplate: 'https://my.oekb.at/…?isin={isin}',
    appliesTo: ['etf'],
  })
  const extraetfEtf = makeLink({
    id: 'extraetf-etf',
    label: 'extraETF',
    urlTemplate: 'https://extraetf.com/de/etf-profile/{isin}',
    appliesTo: ['etf'],
  })
  const extraetfStock = makeLink({
    id: 'extraetf-stock',
    label: 'extraETF',
    urlTemplate: 'https://extraetf.com/de/stock-profile/{isin}',
    appliesTo: ['stock'],
  })
  const alle = [oekb, extraetfEtf, extraetfStock]

  it('zeigt einem ETF den Meldefonds-Nachweis und das ETF-Profil', () => {
    const links = resolveLinks(makePosition({ kind: 'etf' }), alle)
    expect(links.map((link) => link.id)).toEqual(['oekb', 'extraetf-etf'])
  })

  it('zeigt einer Aktie weder Meldefonds-Nachweis noch ETF-Profil', () => {
    const links = resolveLinks(makePosition({ kind: 'stock' }), alle)
    expect(links.map((link) => link.id)).toEqual(['extraetf-stock'])
  })

  it('nutzt für eine Aktie die Aktien-Adresse', () => {
    const links = resolveLinks(makePosition({ kind: 'stock', isin: 'US0846707026' }), alle)
    expect(links[0]?.url).toBe('https://extraetf.com/de/stock-profile/US0846707026')
  })

  it('lässt abgeschaltete Verweise weg', () => {
    const links = resolveLinks(makePosition({ kind: 'etf' }), [
      { ...oekb, enabled: false },
      extraetfEtf,
    ])
    expect(links.map((link) => link.id)).toEqual(['extraetf-etf'])
  })

  it('lässt Verweise weg, deren Platzhalter nicht füllbar ist', () => {
    const links = resolveLinks(makePosition({ kind: 'etf', isin: null }), alle)
    expect(links).toHaveLength(0)
  })

  it('liefert für Cash gar nichts', () => {
    const cash = makePosition({ group: 'cash', kind: null, isin: null, symbol: 'CASH' })
    expect(resolveLinks(cash, alle)).toHaveLength(0)
  })

  it('liefert nichts bei leerer Verweisliste', () => {
    expect(resolveLinks(makePosition(), [])).toHaveLength(0)
  })

  it('zieht die Gattung aus dem Kurs, wenn die Position sie nicht kennt', () => {
    const links = resolveLinks(makePosition({ kind: null }), alle, 'stock')
    expect(links.map((link) => link.id)).toEqual(['extraetf-stock'])
  })
})
