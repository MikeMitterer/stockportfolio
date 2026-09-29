import { describe, expect, it } from 'vitest'
import { upgradeAssetGroups } from '@/domain/assetGroup'
import type { Portfolio, Position } from '@/types/portfolio'

function position(id: string, group: Position['group'], kind: Position['kind']): Position {
  return { id, isin: id, symbol: id, displayName: id, group, kind, units: 3, targetPercent: 25, enabled: true }
}

function portfolio(positions: Position[], assetGroupVersion?: 2): Portfolio {
  return { id: 'portfolio', name: 'Test', positions, createdAt: '', updatedAt: '', ...(assetGroupVersion ? { assetGroupVersion } : {}) }
}

describe('upgradeAssetGroups', () => {
  it('übernimmt bekannte ETFs aus der alten Sammelgruppe und bewahrt andere Gruppen', () => {
    const old = portfolio([
      position('etf', 'stocks', 'etf'),
      position('stock', 'stocks', 'stock'),
      position('bond-etf', 'bonds', 'etf'),
    ])
    const upgraded = upgradeAssetGroups(old)
    expect(upgraded.positions.map(entry => entry.group)).toEqual(['etfs', 'stocks', 'bonds'])
    expect(upgraded.positions.map(entry => entry.units)).toEqual([3, 3, 3])
    expect(upgraded.assetGroupVersion).toBe(2)
  })

  it('bewahrt eine später bewusst gewählte Aktiengruppe für einen ETF', () => {
    const current = portfolio([position('manual', 'stocks', 'etf')], 2)
    expect(upgradeAssetGroups(current)).toBe(current)
  })
})
