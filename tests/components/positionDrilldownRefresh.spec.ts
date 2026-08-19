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

function zeile(): PositionResult {
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
    props: { row: zeile(), total: 2000, links: [], refreshing },
  })
}

/** Der erste Knopf im Aktionsblock ist „Kurs neu laden". */
function ladeKnopf(wrapper: ReturnType<typeof drilldown>) {
  return wrapper.find('.drill__actions button')
}

beforeEach(() => setActivePinia(createPinia()))

describe('Drilldown — Kurs neu laden', () => {
  it('dreht und nimmt keinen Klick an, solange der Kurs geholt wird', () => {
    const knopf = ladeKnopf(drilldown(true))

    expect(knopf.classes()).toContain('n-button--loading')
    expect(knopf.attributes('disabled')).toBeDefined()
  })

  it('steht sonst normal da', () => {
    const knopf = ladeKnopf(drilldown(false))

    expect(knopf.classes()).not.toContain('n-button--loading')
    expect(knopf.attributes('disabled')).toBeUndefined()
  })
})
