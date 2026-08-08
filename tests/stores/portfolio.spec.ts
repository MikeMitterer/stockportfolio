/**
 * Unit-Tests für den Portfolio-Store — inkl. Persistenz gegen `fake-indexeddb`.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { deleteDB } from 'idb'
import { usePortfolioStore } from '@/stores/portfolio'
import { PortfolioRepository } from '@/db/repository'
import { closeDb, DB_NAME } from '@/db/schema'
import { newId } from '@/db/seed'
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
    id: newId(),
    isin: 'IE0000000001',
    symbol: 'AAA.DE',
    displayName: 'AAA',
    group: 'stocks',
    kind: 'etf',
    units: 100,
    targetPercent: 50,
    enabled: true,
    ...overrides,
  }
}

describe('usePortfolioStore — load', () => {
  it('legt beim Erststart ein leeres Depot an — ohne fremde Bestände', async () => {
    const store = usePortfolioStore()
    await store.load()

    expect(store.loaded).toBe(true)
    expect(store.portfolio).not.toBeNull()
    expect(store.hasHoldings).toBe(false)
  })

  it('das leere Depot enthält genau eine Cash-Position', async () => {
    const store = usePortfolioStore()
    await store.load()

    const cash = store.positions.filter((position) => position.group === 'cash')
    expect(cash).toHaveLength(1)
    expect(cash[0]?.units).toBe(0)
  })

  it('legt nur einmal an — der zweite Start lädt das gespeicherte Depot', async () => {
    const first = usePortfolioStore()
    await first.load()
    const createdId = first.portfolio?.id

    setActivePinia(createPinia())
    const second = usePortfolioStore()
    await second.load()

    expect(second.portfolio?.id).toBe(createdId)
    expect(await new PortfolioRepository().count()).toBe(1)
  })

  it('behält Änderungen über einen Neustart hinweg', async () => {
    const first = usePortfolioStore()
    await first.load()
    await first.addPosition(makePosition({ id: 'keep-me', units: 100 }))
    await first.updatePosition('keep-me', { units: 4242 })

    setActivePinia(createPinia())
    const second = usePortfolioStore()
    await second.load()

    expect(second.positions.find((p) => p.id === 'keep-me')?.units).toBe(4242)
  })

  it('loadDemo ersetzt das leere Depot durch das Beispiel-Depot', async () => {
    const store = usePortfolioStore()
    await store.load()
    expect(store.hasHoldings).toBe(false)

    await store.loadDemo()

    expect(store.hasHoldings).toBe(true)
    expect(store.portfolio?.name).toBe('Beispiel-Depot')
  })

  it('loadDemo lässt kein verwaistes Depot zurück', async () => {
    const store = usePortfolioStore()
    await store.load()
    await store.loadDemo()

    expect(await new PortfolioRepository().count()).toBe(1)
  })

  it('das Beispiel-Depot überlebt einen Neustart', async () => {
    const first = usePortfolioStore()
    await first.load()
    await first.loadDemo()
    const demoId = first.portfolio?.id

    setActivePinia(createPinia())
    const second = usePortfolioStore()
    await second.load(demoId)

    expect(second.portfolio?.name).toBe('Beispiel-Depot')
    expect(second.hasHoldings).toBe(true)
  })

  it('bevorzugt das übergebene Portfolio, wenn mehrere existieren', async () => {
    const repository = new PortfolioRepository()
    const now = '2026-01-01T00:00:00.000Z'
    await repository.save({ id: 'a', name: 'A', createdAt: now, updatedAt: now, positions: [] })
    await repository.save({ id: 'b', name: 'B', createdAt: now, updatedAt: now, positions: [] })

    const store = usePortfolioStore()
    await store.load('b')

    expect(store.portfolio?.id).toBe('b')
  })
})

describe('usePortfolioStore — updatePosition', () => {
  it('ändert nur das angegebene Feld', async () => {
    const store = usePortfolioStore()
    await store.load()
    const position = store.positions[0]
    expect(position).toBeDefined()
    const originalTarget = position?.targetPercent

    await store.updatePosition(position?.id as string, { units: 999 })

    const updated = store.positions.find((p) => p.id === position?.id)
    expect(updated?.units).toBe(999)
    expect(updated?.targetPercent).toBe(originalTarget)
  })

  it('lässt die ID unveränderlich', async () => {
    const store = usePortfolioStore()
    await store.load()
    const originalId = store.positions[0]?.id as string

    await store.updatePosition(originalId, { id: 'gehackt' } as Partial<Position>)

    expect(store.positions.some((p) => p.id === originalId)).toBe(true)
    expect(store.positions.some((p) => p.id === 'gehackt')).toBe(false)
  })

  it('ignoriert eine unbekannte ID, ohne zu werfen', async () => {
    const store = usePortfolioStore()
    await store.load()
    const before = store.positions.length

    await expect(store.updatePosition('gibt-es-nicht', { units: 1 })).resolves.toBeUndefined()
    expect(store.positions).toHaveLength(before)
  })

  it('deaktiviert eine Position, ohne sie zu löschen', async () => {
    const store = usePortfolioStore()
    await store.load()
    const id = store.positions[0]?.id as string
    const before = store.positions.length

    await store.updatePosition(id, { enabled: false })

    expect(store.positions).toHaveLength(before)
    expect(store.positions.find((p) => p.id === id)?.enabled).toBe(false)
  })
})

describe('usePortfolioStore — applyTrade', () => {
  it('addiert einen Kauf auf den Bestand', async () => {
    const store = usePortfolioStore()
    await store.load()
    await store.addPosition(makePosition({ id: 'trade-me', units: 100 }))

    await store.applyTrade('trade-me', 25)

    expect(store.positions.find((p) => p.id === 'trade-me')?.units).toBe(125)
  })

  it('zieht einen Verkauf ab', async () => {
    const store = usePortfolioStore()
    await store.load()
    await store.addPosition(makePosition({ id: 'trade-me', units: 100 }))

    await store.applyTrade('trade-me', -30)

    expect(store.positions.find((p) => p.id === 'trade-me')?.units).toBe(70)
  })

  it('lässt den Bestand nicht negativ werden', async () => {
    const store = usePortfolioStore()
    await store.load()
    await store.addPosition(makePosition({ id: 'trade-me', units: 10 }))

    await store.applyTrade('trade-me', -999)

    expect(store.positions.find((p) => p.id === 'trade-me')?.units).toBe(0)
  })

  it('persistiert den neuen Bestand', async () => {
    const store = usePortfolioStore()
    await store.load()
    await store.addPosition(makePosition({ id: 'trade-me', units: 100 }))
    await store.applyTrade('trade-me', 50)

    const stored = await new PortfolioRepository().findById(store.portfolio?.id as string)

    expect(stored?.positions.find((p) => p.id === 'trade-me')?.units).toBe(150)
  })

  it('ignoriert eine unbekannte ID', async () => {
    const store = usePortfolioStore()
    await store.load()

    await expect(store.applyTrade('gibt-es-nicht', 10)).resolves.toBeUndefined()
  })
})

describe('usePortfolioStore — backfillKinds', () => {
  /**
   * Der Fall aus der Praxis: Positionen wurden angelegt, bevor es das Feld
   * `kind` gab. Ohne Gattung blieben ihre externen Verweise leer.
   */
  it('trägt die Gattung aus den Kursen nach', async () => {
    const store = usePortfolioStore()
    await store.load()
    await store.addPosition(makePosition({ id: 'alt', isin: 'IE111', kind: null }))

    const ergaenzt = await store.backfillKinds(new Map([['IE111', { type: 'etf' }]]))

    expect(ergaenzt).toBe(1)
    expect(store.positions.find((p) => p.id === 'alt')?.kind).toBe('etf')
  })

  it('erkennt auch Aktien', async () => {
    const store = usePortfolioStore()
    await store.load()
    await store.addPosition(makePosition({ id: 'aktie', isin: 'US084', kind: null }))

    await store.backfillKinds(new Map([['US084', { type: 'stock' }]]))

    expect(store.positions.find((p) => p.id === 'aktie')?.kind).toBe('stock')
  })

  it('überschreibt eine bereits bekannte Gattung nicht', async () => {
    const store = usePortfolioStore()
    await store.load()
    await store.addPosition(makePosition({ id: 'bekannt', isin: 'IE111', kind: 'stock' }))

    const ergaenzt = await store.backfillKinds(new Map([['IE111', { type: 'etf' }]]))

    expect(ergaenzt).toBe(0)
    expect(store.positions.find((p) => p.id === 'bekannt')?.kind).toBe('stock')
  })

  it('lässt Cash unangetastet', async () => {
    const store = usePortfolioStore()
    await store.load()

    await store.backfillKinds(new Map([['CASH', { type: 'etf' }]]))

    expect(store.positions.find((p) => p.group === 'cash')?.kind).toBeNull()
  })

  it('ignoriert unbekannte Typen aus der API', async () => {
    const store = usePortfolioStore()
    await store.load()
    await store.addPosition(makePosition({ id: 'seltsam', isin: 'XX1', kind: null }))

    const ergaenzt = await store.backfillKinds(new Map([['XX1', { type: 'zertifikat' }]]))

    expect(ergaenzt).toBe(0)
    expect(store.positions.find((p) => p.id === 'seltsam')?.kind).toBeNull()
  })

  it('kommt ohne passenden Kurs zurecht', async () => {
    const store = usePortfolioStore()
    await store.load()
    await store.addPosition(makePosition({ id: 'ohne', isin: 'IE999', kind: null }))

    expect(await store.backfillKinds(new Map())).toBe(0)
  })

  it('die nachgetragene Gattung überlebt einen Neustart', async () => {
    const first = usePortfolioStore()
    await first.load()
    await first.addPosition(makePosition({ id: 'alt', isin: 'IE111', kind: null }))
    await first.backfillKinds(new Map([['IE111', { type: 'etf' }]]))

    setActivePinia(createPinia())
    const second = usePortfolioStore()
    await second.load()

    expect(second.positions.find((p) => p.id === 'alt')?.kind).toBe('etf')
  })
})

describe('usePortfolioStore — add/remove', () => {
  it('fügt eine Position hinzu', async () => {
    const store = usePortfolioStore()
    await store.load()
    const before = store.positions.length

    await store.addPosition(makePosition({ symbol: 'NEU.DE' }))

    expect(store.positions).toHaveLength(before + 1)
    expect(store.positions.some((p) => p.symbol === 'NEU.DE')).toBe(true)
  })

  it('entfernt eine Position endgültig', async () => {
    const store = usePortfolioStore()
    await store.load()
    const id = store.positions[0]?.id as string
    const before = store.positions.length

    await store.removePosition(id)

    expect(store.positions).toHaveLength(before - 1)
    expect(store.positions.some((p) => p.id === id)).toBe(false)
  })

  it('persistiert das Entfernen', async () => {
    const store = usePortfolioStore()
    await store.load()
    const id = store.positions[0]?.id as string
    await store.removePosition(id)

    const stored = await new PortfolioRepository().findById(store.portfolio?.id as string)

    expect(stored?.positions.some((p) => p.id === id)).toBe(false)
  })
})
