import { beforeEach, describe, expect, it, vi } from 'vitest'
vi.mock('@/data/repository', () => import('../helpers/localRepositories'))
import { effectScope, nextTick } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import { useTradePlanDraftSync } from '@/composables/useTradePlanDraftSync'
import { usePortfolioStore } from '@/stores/portfolio'
import { useTradePlanDraftStore } from '@/stores/tradePlanDraft'
import type { Portfolio, Position } from '@/types/portfolio'

function position(id: string, units: number): Position {
  return {
    id, isin: null, symbol: `${id}.DE`, displayName: id, group: 'stocks', kind: 'etf',
    units, targetPercent: 50, enabled: true,
  }
}

function depot(id: string, positions: Position[]): Portfolio {
  return { id, name: id, positions, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' }
}

/** Setzt das gewählte Depot so, wie es Laden, Wechsel oder eine Bestandsänderung tun. */
async function show(portfolio: Portfolio | null): Promise<void> {
  usePortfolioStore().portfolio = portfolio
  await nextTick()
}

/** Startet die Verdrahtung wie App.vue und gibt den Plan zurück. */
async function startWith(portfolio: Portfolio) {
  await show(portfolio)
  effectScope().run(() => useTradePlanDraftSync())
  return useTradePlanDraftStore()
}

beforeEach(() => setActivePinia(createPinia()))

describe('Rebalancing-Plan in Arbeit', () => {
  it('behält den Plan auf dem Rückweg von einer anderen Seite', async () => {
    const draft = await startWith(depot('A', [position('p1', 10)]))
    draft.setTrade('p1', -5, 10)
    draft.setTarget('p1', 12, 10)

    // Die Ansicht wird neu aufgebaut; Depot und Bestand sind unverändert.
    await show(depot('A', [position('p1', 10)]))

    expect(draft.trades).toEqual({ p1: -5 })
    expect(draft.targets).toEqual({ p1: 12 })
  })

  it('verwirft den Eintrag einer Position, deren Bestand sich geändert hat', async () => {
    const draft = await startWith(depot('A', [position('p1', 10), position('p2', 4)]))
    draft.setTrade('p1', -5, 10)
    draft.setTrade('p2', 2, 4)

    // Im Dashboard wird p1 von 10 auf 2 Stück gesetzt; p2 bleibt.
    await show(depot('A', [position('p1', 2), position('p2', 4)]))

    expect(draft.trades).toEqual({ p2: 2 })
  })

  it('leert den Plan beim Depotwechsel, auch ohne geöffnete Rebalancing-Ansicht (A → B → A)', async () => {
    const draft = await startWith(depot('A', [position('p1', 10)]))
    draft.setTrade('p1', -5, 10)

    await show(depot('B', [position('q1', 3)]))
    await show(depot('A', [position('p1', 10)]))

    expect(draft.trades).toEqual({})
    expect(draft.targets).toEqual({})
  })

  it('leert den Plan bei der Abmeldung', async () => {
    const draft = await startWith(depot('A', [position('p1', 10)]))
    draft.setTrade('p1', -5, 10)

    draft.useFor(null)

    expect(draft.trades).toEqual({})
  })
})
