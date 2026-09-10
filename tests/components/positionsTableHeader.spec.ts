/**
 * Wächter: Die Spaltenkopfzeile steht genau einmal — und an einer *sichtbaren*
 * Tabelle.
 *
 * Jede Gruppe rendert eine eigene `NDataTable`, gezeigt wird die Kopfzeile aber
 * nur an der obersten; die darunter erben sie visuell. Ausgewählt wurde sie
 * einmal per `:first-of-type` — nach Stellung im Dokument also. Eingeklappte
 * Gruppen bleiben aber per `v-show` im Dokument stehen. Wer die oberste Gruppe
 * zuklappte, gab die Kopfzeile damit an eine unsichtbare Tabelle ab, und die
 * ganze Ansicht stand ohne Spaltennamen da — über einen Reload hinweg, weil der
 * eingeklappte Zustand im `localStorage` liegt.
 *
 * Der Test greift an der Klasse an, nicht am gerechneten Stil: jsdom wertet die
 * scoped Regel `display: none` nicht aus. Er prüft also, dass die Auswahl der
 * kopftragenden Tabelle der Sichtbarkeit folgt — genau die Logik, die damals
 * falsch war.
 */

import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory, createRouter, type Router } from 'vue-router'
import { beforeEach, describe, expect, it } from 'vitest'

import PositionsTable from '@/components/PositionsTable.vue'
import type { GroupResult, PositionResult } from '@/domain/rebalancing'
import type { AssetGroup, Position } from '@/types/portfolio'
import { installFakeStorage } from '../fixtures/storage'

const COLLAPSED_KEY = 'stockportfolio.table.collapsedGroups'

/** Reihenfolge der Gruppen im Test — die erste ist die kritische. */
const GROUPS: AssetGroup[] = ['stocks', 'bonds', 'metals']

function position(group: AssetGroup): Position {
  return {
    id: `pos-${group}`,
    isin: null,
    symbol: group.toUpperCase(),
    displayName: `Papier ${group}`,
    group,
    kind: null,
    units: 10,
    targetPercent: 33,
    enabled: true,
  }
}

function row(group: AssetGroup): PositionResult {
  return {
    position: position(group),
    quote: null,
    basePrice: null, baseCurrency: 'EUR', originalMarketValue: 0, fx: null,
    marketValue: 1000,
    actualPercent: 33,
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

function group(group: AssetGroup): GroupResult {
  return {
    group,
    actualValue: 1000,
    actualPercent: 33,
    targetPercent: 33,
    targetValue: 1000,
    lowerBand: 900,
    upperBand: 1100,
    suggestion: 'ok',
    deltaEuro: 0,
  }
}

/**
 * Router-Attrappe: `InfoHint` in der Tabelle löst den Verweis auf die
 * Methodenseite auf und wirft ohne Router. Wohin er zeigt, prüft dieser Test
 * nicht — er muss nur auflösbar sein.
 */
function stubRouter(): Router {
  return createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/:pathMatch(.*)*', component: { template: '<div />' } }],
  })
}

function table() {
  return mount(PositionsTable, {
    global: { plugins: [stubRouter()] },
    props: {
      rows: GROUPS.map(row),
      groups: GROUPS.map(group),
      total: 3000,
      targetsExceeded: false,
      links: [],
    },
  })
}

/** Die Tabellen in Dokumentreihenfolge, je mit Sichtbarkeit und Kopfzeile. */
function tables(wrapper: ReturnType<typeof table>) {
  return wrapper.findAll('.postable__table').map((table) => ({
    visible: (table.element as HTMLElement).style.display !== 'none',
    hasHeader: !table.classes('postable__table--headless'),
  }))
}

describe('Spaltenkopfzeile der Positionstabelle', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    installFakeStorage()
  })

  it('steht genau einmal, wenn alle Gruppen offen sind', () => {
    const state = tables(table())

    expect(state).toHaveLength(GROUPS.length)
    expect(state.filter((t) => t.hasHeader)).toHaveLength(1)
    expect(state[0]?.hasHeader).toBe(true)
  })

  it('wandert zur ersten sichtbaren Tabelle, wenn die oberste Gruppe eingeklappt ist', async () => {
    const wrapper = table()

    // Der Gruppenkopf ist die Schaltfläche zum Ein- und Ausklappen.
    await wrapper.findAll('button.groupheader')[0]?.trigger('click')

    const state = tables(wrapper)
    const withHeader = state.filter((t) => t.hasHeader)

    expect(state[0]?.visible).toBe(false)
    expect(withHeader).toHaveLength(1)
    // Der eigentliche Regressionskern: keine unsichtbare Tabelle trägt sie.
    expect(withHeader[0]?.visible).toBe(true)
    expect(state[1]?.hasHeader).toBe(true)
  })

  it('lässt keine Kopfzeile übrig, wenn alle Gruppen eingeklappt sind', async () => {
    const wrapper = table()

    for (const header of wrapper.findAll('button.groupheader')) {
      await header.trigger('click')
    }

    const state = tables(wrapper)

    expect(state.every((t) => !t.visible)).toBe(true)
    expect(state.filter((t) => t.hasHeader)).toHaveLength(0)
  })

  it('holt die Kopfzeile zurück, sobald eine Gruppe wieder aufgeht', async () => {
    const wrapper = table()
    const headers = wrapper.findAll('button.groupheader')

    for (const header of headers) await header.trigger('click')
    await headers[1]?.trigger('click')

    const state = tables(wrapper)
    const withHeader = state.filter((t) => t.hasHeader)

    expect(withHeader).toHaveLength(1)
    expect(state[1]?.hasHeader).toBe(true)
  })

  it('nimmt den eingeklappten Zustand aus dem Speicher — auch beim ersten Aufbau', () => {
    localStorage.setItem(COLLAPSED_KEY, JSON.stringify([GROUPS[0]]))

    const state = tables(table())

    expect(state[0]?.visible).toBe(false)
    expect(state[0]?.hasHeader).toBe(false)
    expect(state[1]?.hasHeader).toBe(true)
  })
})
