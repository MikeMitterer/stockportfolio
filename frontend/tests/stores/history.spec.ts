/**
 * Tests für den Verlaufs-Store.
 *
 * Der Punkt ist das Nachladen: Tagesschlusskurse ändern sich einmal täglich,
 * also darf die App sie nicht bei jedem Seitenaufbau neu holen.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { deleteDB } from 'idb'
import { historyKey, isFromToday, useHistoryStore } from '@/stores/history'
import { closeDb, DB_NAME } from '@/db/schema'
import { ApiError } from '@/api/errors'
import type { StockInfoClient } from '@/api/client'
import type { Position } from '@/types/portfolio'

beforeEach(async () => {
  setActivePinia(createPinia())
  await closeDb()
  await deleteDB(DB_NAME)
})

afterEach(async () => {
  await closeDb()
})

function makePosition(overrides: Partial<Position> = {}): Position {
  return {
    id: 'p-1',
    isin: 'IE00B3RBWM25',
    symbol: 'VGWL.DE',
    displayName: 'Vanguard FTSE All-World',
    group: 'stocks',
    kind: 'etf',
    units: 100,
    targetPercent: 50,
    enabled: true,
    ...overrides,
  }
}

/** Client, der Tagesschlusskurse liefert und die Aufrufe zählt. */
function mockClient() {
  const byIsin = vi.fn(async () => [
    { date: '2026-08-01', close: 100, currency: 'EUR' },
    { date: '2026-08-02', close: 110, currency: 'EUR' },
  ])
  const bySymbol = vi.fn(async () => [
    { date: '2026-08-01', close: 50, currency: 'EUR' },
    { date: '2026-08-02', close: 55, currency: 'EUR' },
  ])
  return {
    client: { getDailyHistory: byIsin, getDailyHistoryBySymbol: bySymbol } as unknown as StockInfoClient,
    byIsin,
    bySymbol,
  }
}

describe('historyKey', () => {
  it('trennt nach Papier und Zeitraum', () => {
    // Sonst überschriebe der Ein-Monats-Verlauf den Jahresverlauf.
    expect(historyKey(makePosition(), '1m')).not.toBe(historyKey(makePosition(), '1y'))
  })

  it('nimmt das Symbol, wenn keine ISIN vorliegt', () => {
    expect(historyKey(makePosition({ isin: null }), '1m')).toBe('VGWL.DE::1m')
  })
})

describe('isFromToday', () => {
  it('erkennt denselben Tag', () => {
    expect(isFromToday('2026-08-11T06:00:00.000Z', new Date('2026-08-11T22:00:00.000Z'))).toBe(true)
  })

  it('erkennt den Vortag', () => {
    expect(isFromToday('2026-08-10T23:59:00.000Z', new Date('2026-08-11T00:01:00.000Z'))).toBe(false)
  })
})

describe('useHistoryStore', () => {
  it('liefert für Unbekanntes eine leere Reihe statt undefined', () => {
    const store = useHistoryStore()

    expect(store.get(makePosition(), '1m').points).toEqual([])
  })

  it('holt den Verlauf und legt ihn ab', async () => {
    const store = useHistoryStore()
    const { client } = mockClient()

    await store.ensure(client, makePosition(), '1m')

    expect(store.get(makePosition(), '1m').points).toHaveLength(2)
  })

  it('holt denselben Verlauf kein zweites Mal', async () => {
    // Der eigentliche Zweck: sechs Positionen sollen nicht bei jedem
    // Seitenaufbau sechs Anfragen auslösen.
    const store = useHistoryStore()
    const { client, byIsin } = mockClient()

    await store.ensure(client, makePosition(), '1m')
    await store.ensure(client, makePosition(), '1m')

    expect(byIsin).toHaveBeenCalledTimes(1)
  })

  it('nimmt den Zwischenspeicher, wenn der Store leer ist', async () => {
    const { client, byIsin } = mockClient()
    const first = useHistoryStore()
    await first.ensure(client, makePosition(), '1m')

    // Wie nach einem Neuladen der Seite: Store weg, IndexedDB bleibt.
    setActivePinia(createPinia())
    const second = useHistoryStore()
    await second.ensure(client, makePosition(), '1m')

    expect(byIsin).toHaveBeenCalledTimes(1)
    expect(second.get(makePosition(), '1m').points).toHaveLength(2)
  })

  it('fragt je Zeitraum getrennt', async () => {
    const store = useHistoryStore()
    const { client, byIsin } = mockClient()

    await store.ensure(client, makePosition(), '1m')
    await store.ensure(client, makePosition(), '1y')

    expect(byIsin).toHaveBeenCalledTimes(2)
  })

  it('nimmt das Symbol, wenn keine ISIN vorliegt', async () => {
    const store = useHistoryStore()
    const { client, byIsin, bySymbol } = mockClient()

    await store.ensure(client, makePosition({ isin: null }), '1m')

    expect(bySymbol).toHaveBeenCalledTimes(1)
    expect(byIsin).not.toHaveBeenCalled()
  })

  it('fragt für Cash gar nicht erst', async () => {
    // Ein Verrechnungskonto hat keinen Kurs und damit keinen Verlauf.
    const store = useHistoryStore()
    const { client, byIsin, bySymbol } = mockClient()

    await store.ensure(client, makePosition({ group: 'cash', isin: null }), '1m')

    expect(byIsin).not.toHaveBeenCalled()
    expect(bySymbol).not.toHaveBeenCalled()
  })

  it('überlebt einen Fehler, ohne die Zeile zu sprengen', async () => {
    // Ein fehlender Verlauf ist kein Drama — die Zeile zeigt dann keine Linie.
    const store = useHistoryStore()
    const client = {
      getDailyHistory: vi.fn(async () => {
        throw new ApiError(404, 'Kein Verlauf', 'https://example.test')
      }),
    } as unknown as StockInfoClient

    await store.ensure(client, makePosition(), '1m')
    const series = store.get(makePosition(), '1m')

    expect(series.points).toEqual([])
    expect(series.error).toContain('Kein Verlauf')
    expect(series.loading).toBe(false)
  })

  it('kommt ohne Client zurecht', async () => {
    const store = useHistoryStore()

    await expect(store.ensure(null, makePosition(), '1m')).resolves.toBeUndefined()
  })

  it('wirft beim Leeren alles weg', async () => {
    const store = useHistoryStore()
    const { client, byIsin } = mockClient()
    await store.ensure(client, makePosition(), '1m')

    await store.clear()
    await store.ensure(client, makePosition(), '1m')

    expect(byIsin).toHaveBeenCalledTimes(2)
  })
})
