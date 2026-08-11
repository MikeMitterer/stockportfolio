/**
 * Unit-Tests für die Repositories — laufen gegen `fake-indexeddb`.
 * Prüft Verhalten (CRUD, Rundlauf, Isolation), keine Referenz-Datensätze.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { deleteDB } from 'idb'
import {
  AllowlistRepository,
  PortfolioRepository,
  QuoteCacheRepository,
  SettingsRepository,
} from '@/db/repository'
import { closeDb, DB_NAME } from '@/db/schema'
import { defaultSettings } from '@/stores/settings'
import { demoPortfolio, newId } from '@/db/seed'
import type { Portfolio, QuoteCacheEntry } from '@/types/portfolio'

beforeEach(async () => {
  await closeDb()
  await deleteDB(DB_NAME)
})

afterEach(async () => {
  await closeDb()
})

function makePortfolio(overrides: Partial<Portfolio> = {}): Portfolio {
  const now = '2026-01-01T00:00:00.000Z'
  return {
    id: newId(),
    name: 'Test',
    createdAt: now,
    updatedAt: now,
    positions: [],
    ...overrides,
  }
}

function makeQuote(overrides: Partial<QuoteCacheEntry> = {}): QuoteCacheEntry {
  return {
    isin: 'IE0000000001',
    symbol: 'AAA.DE',
    price: 100,
    currency: 'EUR',
    type: 'etf',
    volatility: null,
    name: null,
    ter: null,
    accumulating: null,
    fetchedAt: '2026-01-01T00:00:00.000Z',
    cached: true,
    stale: false,
    ...overrides,
  }
}

describe('PortfolioRepository', () => {
  it('startet mit einer leeren Datenbank', async () => {
    const repository = new PortfolioRepository()
    expect(await repository.count()).toBe(0)
    expect(await repository.findAll()).toEqual([])
  })

  it('speichert ein Portfolio und liest es zurück', async () => {
    const repository = new PortfolioRepository()
    const portfolio = makePortfolio({ name: 'Hauptdepot' })

    await repository.save(portfolio)
    const loaded = await repository.findById(portfolio.id)

    expect(loaded?.name).toBe('Hauptdepot')
    expect(await repository.count()).toBe(1)
  })

  it('setzt updatedAt beim Speichern neu', async () => {
    const repository = new PortfolioRepository()
    const portfolio = makePortfolio({ updatedAt: '2020-01-01T00:00:00.000Z' })

    await repository.save(portfolio)
    const loaded = await repository.findById(portfolio.id)

    expect(loaded?.updatedAt).not.toBe('2020-01-01T00:00:00.000Z')
  })

  it('überschreibt beim erneuten Speichern statt zu duplizieren', async () => {
    const repository = new PortfolioRepository()
    const portfolio = makePortfolio({ name: 'Alt' })

    await repository.save(portfolio)
    await repository.save({ ...portfolio, name: 'Neu' })

    expect(await repository.count()).toBe(1)
    expect((await repository.findById(portfolio.id))?.name).toBe('Neu')
  })

  it('liefert null für eine unbekannte ID', async () => {
    const repository = new PortfolioRepository()
    expect(await repository.findById('gibt-es-nicht')).toBeNull()
  })

  it('löscht ein Portfolio', async () => {
    const repository = new PortfolioRepository()
    const portfolio = makePortfolio()

    await repository.save(portfolio)
    await repository.remove(portfolio.id)

    expect(await repository.count()).toBe(0)
  })

  it('erhält verschachtelte Positionen beim Rundlauf', async () => {
    const repository = new PortfolioRepository()
    const portfolio = demoPortfolio()

    await repository.save(portfolio)
    const loaded = await repository.findById(portfolio.id)

    expect(loaded?.positions).toHaveLength(portfolio.positions.length)
    expect(loaded?.positions[0]?.symbol).toBe(portfolio.positions[0]?.symbol)
  })
})

describe('SettingsRepository', () => {
  it('liefert null bevor etwas gespeichert wurde', async () => {
    expect(await new SettingsRepository().load()).toBeNull()
  })

  it('speichert und liest die Einstellungen', async () => {
    const repository = new SettingsRepository()
    const settings = defaultSettings('p-1')

    await repository.save(settings)
    const loaded = await repository.load()

    expect(loaded?.bands.lowerPercent).toBe(6)
    expect(loaded?.activePortfolioId).toBe('p-1')
  })

  it('legt den internen Schlüssel nicht ins Ergebnis', async () => {
    const repository = new SettingsRepository()
    await repository.save(defaultSettings('p-1'))

    const loaded = await repository.load()

    expect(loaded).not.toHaveProperty('key')
  })

  it('überschreibt statt einen zweiten Datensatz anzulegen', async () => {
    const repository = new SettingsRepository()

    await repository.save(defaultSettings('p-1'))
    await repository.save({ ...defaultSettings('p-2'), securityBuffer: { mode: 'absolute', value: 999 } })

    const loaded = await repository.load()
    expect(loaded?.activePortfolioId).toBe('p-2')
    expect(loaded?.securityBuffer).toEqual({ mode: 'absolute', value: 999 })
  })
})

describe('QuoteCacheRepository', () => {
  it('liefert eine leere Map bevor etwas gespeichert wurde', async () => {
    expect((await new QuoteCacheRepository().loadAll()).size).toBe(0)
  })

  it('schreibt und liest eine Map', async () => {
    const repository = new QuoteCacheRepository()
    const quotes = new Map([
      ['IE0000000001', makeQuote({ price: 100 })],
      ['IE0000000002', makeQuote({ isin: 'IE0000000002', price: 200 })],
    ])

    await repository.replaceAll(quotes)
    const loaded = await repository.loadAll()

    expect(loaded.size).toBe(2)
    expect(loaded.get('IE0000000002')?.price).toBe(200)
  })

  it('ersetzt den alten Inhalt vollständig', async () => {
    const repository = new QuoteCacheRepository()

    await repository.replaceAll(new Map([['ALT', makeQuote()]]))
    await repository.replaceAll(new Map([['NEU', makeQuote()]]))

    const loaded = await repository.loadAll()
    expect(loaded.has('ALT')).toBe(false)
    expect(loaded.has('NEU')).toBe(true)
  })

  it('schreibt einen einzelnen Kurs ohne die anderen zu verlieren', async () => {
    const repository = new QuoteCacheRepository()
    await repository.replaceAll(new Map([['A', makeQuote({ price: 100 })]]))

    await repository.put('B', makeQuote({ price: 200 }))

    const loaded = await repository.loadAll()
    expect(loaded.size).toBe(2)
    expect(loaded.get('A')?.price).toBe(100)
  })

  it('legt den internen Schlüssel nicht in die Einträge', async () => {
    const repository = new QuoteCacheRepository()
    await repository.put('A', makeQuote())

    const entry = (await repository.loadAll()).get('A')

    expect(entry).not.toHaveProperty('key')
  })
})

describe('AllowlistRepository — je Depot', () => {
  it('hält die Whitelists zweier Depots auseinander', async () => {
    // Der eigentliche Punkt: Welche Papiere für ein Kinderdepot in Frage
    // kommen, ist eine andere Menge als beim eigenen.
    const repository = new AllowlistRepository()

    await repository.setEnabled('depot-a', 'ISIN1', false)
    await repository.setEnabled('depot-b', 'ISIN2', false)

    const a = await repository.loadAll('depot-a')
    const b = await repository.loadAll('depot-b')

    expect([...a.keys()]).toEqual(['ISIN1'])
    expect([...b.keys()]).toEqual(['ISIN2'])
  })

  it('lässt denselben Schlüssel in zwei Depots unterschiedlich stehen', async () => {
    const repository = new AllowlistRepository()

    await repository.setEnabled('depot-a', 'ISIN1', false)
    await repository.setEnabled('depot-b', 'ISIN1', true)

    expect((await repository.loadAll('depot-a')).get('ISIN1')).toBe(false)
    expect((await repository.loadAll('depot-b')).get('ISIN1')).toBe(true)
  })

  it('liefert für ein unbekanntes Depot eine leere Liste', async () => {
    const repository = new AllowlistRepository()
    await repository.setEnabled('depot-a', 'ISIN1', false)

    expect((await repository.loadAll('gibt-es-nicht')).size).toBe(0)
  })

  it('zählt nur die Einträge des gefragten Depots', async () => {
    const repository = new AllowlistRepository()
    await repository.setEnabled('depot-a', 'ISIN1', false)
    await repository.setEnabled('depot-a', 'ISIN2', false)
    await repository.setEnabled('depot-b', 'ISIN3', false)

    expect(await repository.count('depot-a')).toBe(2)
    expect(await repository.count('depot-b')).toBe(1)
  })

  it('ersetzt die Liste eines Depots, ohne andere anzufassen', async () => {
    const repository = new AllowlistRepository()
    await repository.setEnabled('depot-a', 'alt', false)
    await repository.setEnabled('depot-b', 'fremd', false)

    await repository.replaceAll('depot-a', new Map([['neu', false]]))

    const a = await repository.loadAll('depot-a')
    expect(a.has('alt')).toBe(false)
    expect(a.get('neu')).toBe(false)
    expect((await repository.loadAll('depot-b')).get('fremd')).toBe(false)
  })

  it('leert die Liste, wenn die Sicherung keine enthält', async () => {
    const repository = new AllowlistRepository()
    await repository.setEnabled('depot-a', 'alt', false)

    await repository.replaceAll('depot-a', new Map())

    expect(await repository.count('depot-a')).toBe(0)
  })

  it('räumt die Whitelist eines gelöschten Depots weg', async () => {
    // Ohne das bliebe sie für immer liegen — sichtbar nie wieder, weil es
    // das Depot nicht mehr gibt.
    const repository = new AllowlistRepository()
    await repository.setEnabled('depot-a', 'ISIN1', false)
    await repository.setEnabled('depot-b', 'ISIN2', false)

    await repository.removeForPortfolio('depot-a')

    expect(await repository.count('depot-a')).toBe(0)
    expect(await repository.count('depot-b')).toBe(1)
  })
})
