/**
 * Der Knopf „Kurs neu laden" zeigt, dass er arbeitet.
 *
 * Bis dahin gab es beim Anstoßen keinerlei Rückmeldung — man klickte und
 * wartete darauf, dass sich irgendwo eine Zahl ändert. Der Zustand kommt als
 * Prop herein; wer ihn füllt, ist der Quotes-Store (dort getestet).
 */

import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'

import PositionDrilldown from '@/components/PositionDrilldown.vue'
import type { PositionResult } from '@/domain/rebalancing'

function makeRow(): PositionResult {
  return {
    position: {
      id: 'a',
      isin: 'IE0000000001',
      symbol: 'AAA.DE',
      displayName: 'Papier A',
      group: 'stocks',
      kind: 'etf',
      units: 10,
      targetPercent: 50,
      enabled: true,
    },
    quote: null,
    basePrice: null, baseCurrency: 'EUR', originalMarketValue: 0, fx: null,
    marketValue: 1000,
    actualPercent: 50,
    targetValue: 1000,
    lowerBand: 900,
    upperBand: 1100,
    suggestion: 'ok',
    unitsDelta: 0,
    relativeDeltaPercent: 0,
    isNearBand: false,
    isActive: true,
    excludedReason: null,
    belowMinTrade: false,
  }
}

function drilldown(refreshing: boolean) {
  return mount(PositionDrilldown, {
    props: { row: makeRow(), total: 2000, links: [], refreshing },
  })
}

/** Der erste Knopf im Aktionsblock ist „Kurs neu laden". */
function refreshButton(wrapper: ReturnType<typeof drilldown>) {
  return wrapper.find('.drill__actions button')
}

beforeEach(() => setActivePinia(createPinia()))

describe('Drilldown — Kurs neu laden', () => {
  it('dreht und nimmt keinen Klick an, solange der Kurs geholt wird', () => {
    const button = refreshButton(drilldown(true))

    expect(button.classes()).toContain('n-button--loading')
    expect(button.attributes('disabled')).toBeDefined()
  })

  it('steht sonst normal da', () => {
    const button = refreshButton(drilldown(false))

    expect(button.classes()).not.toContain('n-button--loading')
    expect(button.attributes('disabled')).toBeUndefined()
  })
})
