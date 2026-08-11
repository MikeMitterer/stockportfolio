/**
 * Unit-Tests für den Instruments-Store.
 * API gemockt, Whitelist gegen `fake-indexeddb`.
 *
 * Die Whitelist hängt am aktiven Depot — ohne eines gibt es nichts
 * freizugeben. Die Tests laden deshalb zuerst ein Depot.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { deleteDB } from 'idb'
import { useInstrumentsStore } from '@/stores/instruments'
import { usePortfolioStore } from '@/stores/portfolio'
import { AllowlistRepository } from '@/db/repository'
import { closeDb, DB_NAME } from '@/db/schema'
import { ApiError } from '@/api/errors'
import type { StockInfoClient } from '@/api/client'
import type { InstrumentSummary } from '@/api/types'

beforeEach(async () => {
  setActivePinia(createPinia())
  await closeDb()
  await deleteDB(DB_NAME)
})

/** Legt ein Depot an — die Whitelist braucht eines, an dem sie hängt. */
async function withPortfolio(): Promise<string> {
  const portfolios = usePortfolioStore()
  await portfolios.load()
  return portfolios.portfolio?.id as string
}

afterEach(async () => {
  await closeDb()
})

function makeInstrument(overrides: Partial<InstrumentSummary> = {}): InstrumentSummary {
  return {
    isin: 'IE0000000001',
    symbol: 'AAA.DE',
    exchange: 'Xetra',
    name: 'Test ETF',
    type: 'etf',
    currency: 'EUR',
    provider: 'iShares',
    ter: 0.2,
    replication: null,
    fund_size: null,
    volatility: 12.5,
    accumulating: true,
    meta_fetched_at: '2026-08-08T10:00:00Z',
    latest_price: 100,
    latest_quote_time: '2026-08-08T10:00:00Z',
    latest_currency: 'EUR',
    latest_fetched_at: '2026-08-08T10:00:00Z',
    history_count: 10,
    ...overrides,
  }
}

function mockClient(instruments: InstrumentSummary[]): StockInfoClient {
  return {
    getInstruments: vi.fn(async () => instruments),
  } as unknown as StockInfoClient
}

describe('useInstrumentsStore — load', () => {
  it('lädt den Katalog', async () => {
    const store = useInstrumentsStore()
    await store.load(mockClient([makeInstrument(), makeInstrument({ isin: 'IE0000000002' })]))

    expect(store.instruments).toHaveLength(2)
    expect(store.loaded).toBe(true)
    expect(store.error).toBeNull()
  })

  it('meldet einen API-Fehler, ohne zu werfen', async () => {
    const client = {
      getInstruments: vi.fn(async () => {
        throw new ApiError(503, 'Katalog nicht erreichbar', '/instruments')
      }),
    } as unknown as StockInfoClient
    const store = useInstrumentsStore()

    await expect(store.load(client)).resolves.toBeUndefined()

    expect(store.error).toBe('Katalog nicht erreichbar')
    expect(store.instruments).toHaveLength(0)
    expect(store.loading).toBe(false)
  })
})

describe('useInstrumentsStore — Whitelist', () => {
  it('ohne Eintrag gilt ein Instrument als freigegeben', async () => {
    const store = useInstrumentsStore()
    const instrument = makeInstrument()
    await store.load(mockClient([instrument]))

    expect(store.isAllowed(instrument)).toBe(true)
    expect(store.allowedInstruments).toHaveLength(1)
  })

  it('Umschalten sperrt das Instrument', async () => {
    await withPortfolio()
    const store = useInstrumentsStore()
    const instrument = makeInstrument()
    await store.load(mockClient([instrument]))

    await store.toggleAllowed(instrument)

    expect(store.isAllowed(instrument)).toBe(false)
    expect(store.allowedInstruments).toHaveLength(0)
  })

  it('zweimal Umschalten gibt wieder frei', async () => {
    const store = useInstrumentsStore()
    const instrument = makeInstrument()
    await store.load(mockClient([instrument]))

    await store.toggleAllowed(instrument)
    await store.toggleAllowed(instrument)

    expect(store.isAllowed(instrument)).toBe(true)
  })

  it('die Sperre wird persistiert — unter der Kennung des Depots', async () => {
    const depotId = await withPortfolio()
    const store = useInstrumentsStore()
    const instrument = makeInstrument()
    await store.load(mockClient([instrument]))
    await store.toggleAllowed(instrument)

    const stored = await new AllowlistRepository().loadAll(depotId)

    expect(stored.get('IE0000000001')).toBe(false)
  })

  it('die Sperre überlebt einen Neustart', async () => {
    const instrument = makeInstrument()
    const depotId = await withPortfolio()
    const first = useInstrumentsStore()
    await first.load(mockClient([instrument]))
    await first.toggleAllowed(instrument)

    // Wie beim echten Neustart: Erst das Depot laden, dann den Katalog — die
    // Whitelist hängt am Depot und wäre ohne es leer.
    setActivePinia(createPinia())
    await usePortfolioStore().load(depotId)
    const second = useInstrumentsStore()
    await second.load(mockClient([instrument]))

    expect(second.isAllowed(instrument)).toBe(false)
  })

  it('wechselt die Whitelist mit dem Depot', async () => {
    // Der Kern der Sache: Die Freigaben des vorigen Depots sähen richtig aus
    // und wären falsch.
    const instrument = makeInstrument()
    const portfolios = usePortfolioStore()
    await portfolios.load()

    const store = useInstrumentsStore()
    await store.load(mockClient([instrument]))
    await store.toggleAllowed(instrument)
    expect(store.isAllowed(instrument)).toBe(false)

    await portfolios.createPortfolio('Zweites')
    await store.hydrateAllowlist()

    expect(store.isAllowed(instrument)).toBe(true)
  })

  it('hält die Sperre je Depot getrennt', async () => {
    const instrument = makeInstrument()
    const portfolios = usePortfolioStore()
    await portfolios.load()
    const erstesId = portfolios.portfolio?.id as string

    const store = useInstrumentsStore()
    await store.load(mockClient([instrument]))
    await store.toggleAllowed(instrument)

    await portfolios.createPortfolio('Zweites')
    await store.hydrateAllowlist()
    expect(store.isAllowed(instrument)).toBe(true)

    await portfolios.switchTo(erstesId)
    await store.hydrateAllowlist()
    expect(store.isAllowed(instrument)).toBe(false)
  })

  it('sperrt nur das angegebene Instrument', async () => {
    await withPortfolio()
    const store = useInstrumentsStore()
    const first = makeInstrument({ isin: 'IE0000000001' })
    const second = makeInstrument({ isin: 'IE0000000002' })
    await store.load(mockClient([first, second]))

    await store.toggleAllowed(first)

    expect(store.isAllowed(first)).toBe(false)
    expect(store.isAllowed(second)).toBe(true)
  })

  it('nutzt das Symbol als Schlüssel, wenn keine ISIN vorliegt', async () => {
    const depotId = await withPortfolio()
    const store = useInstrumentsStore()
    const instrument = makeInstrument({ isin: null, symbol: 'NOISIN.DE' })
    await store.load(mockClient([instrument]))

    await store.toggleAllowed(instrument)

    const stored = await new AllowlistRepository().loadAll(depotId)
    expect(stored.get('NOISIN.DE')).toBe(false)
  })
})
