import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useTradePlanDraftStore } from '@/stores/tradePlanDraft'

beforeEach(() => setActivePinia(createPinia()))

describe('Rebalancing-Plan in Arbeit', () => {
  it('behält den Plan, solange dasselbe Depot gewählt bleibt', () => {
    const draft = useTradePlanDraftStore()
    draft.useFor('depot-a')
    draft.setTrade('position-1', 5)
    draft.setTarget('position-1', 12)

    // Die Ansicht bindet sich nach einem Abstecher erneut an dasselbe Depot.
    draft.useFor('depot-a')

    expect(draft.trades).toEqual({ 'position-1': 5 })
    expect(draft.targets).toEqual({ 'position-1': 12 })
  })

  it.each([
    { name: 'ein anderes Depot', next: 'depot-b' },
    { name: 'die Abmeldung', next: null },
  ])('beginnt für $name mit einem leeren Plan', ({ next }) => {
    const draft = useTradePlanDraftStore()
    draft.useFor('depot-a')
    draft.setTrade('position-1', 5)
    draft.setTarget('position-1', 12)

    draft.useFor(next)

    expect(draft.trades).toEqual({})
    expect(draft.targets).toEqual({})
  })
})
