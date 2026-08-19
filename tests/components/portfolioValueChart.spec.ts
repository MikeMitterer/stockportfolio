/**
 * Der Ausschnitt „Echt" zeigt nur, was tatsächlich dastand.
 *
 * Die übrigen Zeiträume zeigen zwei Linien: kräftig die festgehaltenen
 * Tageswerte, blass-gestrichelt den Rückblick, der den *heutigen* Bestand gegen
 * alte Kurse rechnet. In „Echt" fällt der Rückblick weg — dort geht es genau um
 * die gemessene Reihe.
 *
 * Der Knopf ist gesperrt, solange weniger als zwei Tageswerte vorliegen: Aus
 * einem einzigen entsteht keine Linie, und ein Knopf, der ins Leere führt, ist
 * schlimmer als einer, der sagt warum er nicht geht.
 */

import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import PortfolioValueChart from '@/components/PortfolioValueChart.vue'
import type { HistoryPoint } from '@/domain/sparkline'

/** Fortlaufende Tageswerte, rückwärts ab heute. */
function reihe(tage: number, start = 1000): HistoryPoint[] {
  const heute = new Date()
  return Array.from({ length: tage }, (_, index) => {
    const tag = new Date(heute.getFullYear(), heute.getMonth(), heute.getDate() - (tage - 1 - index))
    const iso = `${tag.getFullYear()}-${String(tag.getMonth() + 1).padStart(2, '0')}-${String(tag.getDate()).padStart(2, '0')}`
    return { date: iso, close: start + index }
  })
}

function diagramm(snapshots: HistoryPoint[]) {
  return mount(PortfolioValueChart, {
    props: {
      backtest: reihe(60, 900),
      snapshots,
      truthFrom: snapshots[0]?.date ?? null,
    },
  })
}

beforeEach(() => {
  // jsdom kennt keinen ResizeObserver — die Komponente misst damit ihre Breite.
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe(): void {}
      disconnect(): void {}
    },
  )
})

afterEach(() => vi.unstubAllGlobals())

describe('Wertverlauf — Ausschnitt „Echt"', () => {
  it('zeigt in den übrigen Zeiträumen beide Linien', () => {
    const wrapper = diagramm(reihe(10))

    expect(wrapper.find('.value-chart__line--snapshot').exists()).toBe(true)
    expect(wrapper.find('.value-chart__line--backtest').exists()).toBe(true)
  })

  it('lässt den Rückblick weg, sobald „Echt" gewählt ist', async () => {
    const wrapper = diagramm(reihe(10))

    await wrapper.find('.value-chart__real button').trigger('click')

    expect(wrapper.find('.value-chart__line--snapshot').exists()).toBe(true)
    expect(wrapper.find('.value-chart__line--backtest').exists()).toBe(false)
  })

  it('sperrt den Knopf, solange kein einziger Tageswert vorliegt', () => {
    const wrapper = diagramm([])

    expect(wrapper.find('.value-chart__real button').attributes('disabled')).toBeDefined()
  })

  it('sperrt ihn auch bei einem einzigen Tageswert — daraus wird keine Linie', () => {
    const wrapper = diagramm(reihe(1))

    expect(wrapper.find('.value-chart__real button').attributes('disabled')).toBeDefined()
  })

  it('gibt ihn ab dem zweiten Tageswert frei', () => {
    const wrapper = diagramm(reihe(2))

    expect(wrapper.find('.value-chart__real button').attributes('disabled')).toBeUndefined()
  })
})
