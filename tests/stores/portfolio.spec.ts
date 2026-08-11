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
import { translate } from '@/i18n'
import type { Portfolio, Position } from '@/types/portfolio'

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
    expect(store.portfolio?.name).toBe(translate('seed.demoName'))
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

    expect(second.portfolio?.name).toBe(translate('seed.demoName'))
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

describe('usePortfolioStore — replacePortfolio', () => {
  function makeImported(id: string, positions: Position[]): Portfolio {
    const now = '2026-08-10T18:00:00.000Z'
    return { id, name: 'Eingespielt', createdAt: now, updatedAt: now, positions }
  }

  it('übernimmt das eingespielte Depot', async () => {
    const store = usePortfolioStore()
    await store.load()

    await store.replacePortfolio(makeImported('neu', [makePosition({ id: 'x', units: 42 })]))

    expect(store.portfolio?.name).toBe('Eingespielt')
    expect(store.positions.find((p) => p.id === 'x')?.units).toBe(42)
  })

  it('lässt kein verwaistes Depot zurück', async () => {
    // Zwei Depots nebeneinander ließen sich in der Oberfläche nicht
    // auseinanderhalten — sie zeigt immer nur eines.
    const store = usePortfolioStore()
    await store.load()

    await store.replacePortfolio(makeImported('neu', []))

    expect(await new PortfolioRepository().count()).toBe(1)
  })

  it('überlebt einen Neustart', async () => {
    const first = usePortfolioStore()
    await first.load()
    await first.replacePortfolio(makeImported('neu', [makePosition({ id: 'x' })]))

    setActivePinia(createPinia())
    const second = usePortfolioStore()
    await second.load('neu')

    expect(second.portfolio?.name).toBe('Eingespielt')
  })

  it('kommt mit gleicher Kennung zurecht, statt das eigene Depot zu löschen', async () => {
    const store = usePortfolioStore()
    await store.load()
    const sameId = store.portfolio?.id as string

    await store.replacePortfolio(makeImported(sameId, [makePosition({ id: 'x', units: 7 })]))

    expect(await new PortfolioRepository().count()).toBe(1)
    expect(store.positions.find((p) => p.id === 'x')?.units).toBe(7)
  })
})

describe('usePortfolioStore — mehrere Depots', () => {
  it('führt die Liste aller Depots mit', async () => {
    const store = usePortfolioStore()
    await store.load()

    expect(store.all).toHaveLength(1)
    expect(store.all[0]?.name).toBe(translate('seed.portfolioName'))
  })

  it('legt ein weiteres Depot an und macht es zum aktiven', async () => {
    const store = usePortfolioStore()
    await store.load()

    const id = await store.createPortfolio('Kinderdepot')

    expect(store.all).toHaveLength(2)
    expect(store.portfolio?.id).toBe(id)
    expect(store.portfolio?.name).toBe('Kinderdepot')
  })

  it('gibt einem namenlosen Depot einen Namen', async () => {
    // Eine leere Zeile in der Liste wäre nicht wiederzuerkennen.
    const store = usePortfolioStore()
    await store.load()

    await store.createPortfolio('   ')

    expect(store.portfolio?.name).toBe('Neues Depot')
  })

  it('wechselt zwischen Depots, ohne Bestände zu vermischen', async () => {
    const store = usePortfolioStore()
    await store.load()
    const ersteId = store.portfolio?.id as string
    await store.addPosition(makePosition({ id: 'nur-im-ersten' }))

    const zweiteId = await store.createPortfolio('Zweites')
    expect(store.positions.some((p) => p.id === 'nur-im-ersten')).toBe(false)

    await store.switchTo(ersteId)
    expect(store.positions.some((p) => p.id === 'nur-im-ersten')).toBe(true)

    await store.switchTo(zweiteId)
    expect(store.positions.some((p) => p.id === 'nur-im-ersten')).toBe(false)
  })

  it('ignoriert einen Wechsel auf eine unbekannte Kennung', async () => {
    const store = usePortfolioStore()
    await store.load()
    const id = store.portfolio?.id

    await store.switchTo('gibt-es-nicht')

    expect(store.portfolio?.id).toBe(id)
  })

  it('benennt auch ein Depot um, das gerade nicht aktiv ist', async () => {
    const store = usePortfolioStore()
    await store.load()
    const ersteId = store.portfolio?.id as string
    await store.createPortfolio('Zweites')

    await store.renamePortfolio(ersteId, 'Umbenannt')

    expect(store.all.find((entry) => entry.id === ersteId)?.name).toBe('Umbenannt')
    expect(store.portfolio?.name).toBe('Zweites')
  })

  it('lehnt einen leeren Namen ab, statt ihn zu übernehmen', async () => {
    const store = usePortfolioStore()
    await store.load()
    const id = store.portfolio?.id as string

    await store.renamePortfolio(id, '   ')

    expect(store.portfolio?.name).toBe(translate('seed.portfolioName'))
  })

  it('löscht ein Depot und lässt das aktive in Ruhe', async () => {
    const store = usePortfolioStore()
    await store.load()
    const ersteId = store.portfolio?.id as string
    const zweiteId = await store.createPortfolio('Zweites')

    await store.deletePortfolio(ersteId)

    expect(store.all).toHaveLength(1)
    expect(store.portfolio?.id).toBe(zweiteId)
  })

  it('wechselt weiter, wenn man das aktive Depot löscht', async () => {
    const store = usePortfolioStore()
    await store.load()
    const ersteId = store.portfolio?.id as string
    const zweiteId = await store.createPortfolio('Zweites')

    const nextActive = await store.deletePortfolio(zweiteId)

    expect(nextActive).toBe(ersteId)
    expect(store.portfolio?.id).toBe(ersteId)
  })

  it('lässt das letzte Depot stehen', async () => {
    // Ohne Depot hätte die App keinen Zustand, in dem sie sinnvoll wäre — und
    // die Einstellungen zeigten auf eine Kennung, die es nicht mehr gibt.
    const store = usePortfolioStore()
    await store.load()
    const id = store.portfolio?.id as string

    const result = await store.deletePortfolio(id)

    expect(result).toBeNull()
    expect(store.all).toHaveLength(1)
    expect(await new PortfolioRepository().count()).toBe(1)
  })

  it('zieht die Positionszahl in der Liste nach', async () => {
    // Eine veraltete Liste wäre schlimmer als keine — man sieht ihr an, dass
    // sie sich nicht bewegt, und traut ihr dann nirgends mehr.
    const store = usePortfolioStore()
    await store.load()
    const id = store.portfolio?.id as string
    const vorher = store.all.find((entry) => entry.id === id)?.positionCount ?? 0

    await store.addPosition(makePosition({ id: 'neu' }))

    expect(store.all.find((entry) => entry.id === id)?.positionCount).toBe(vorher + 1)
  })
})
