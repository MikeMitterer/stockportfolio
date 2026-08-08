/**
 * Tests für den Settings-Store — Schwerpunkt: gespeicherte Einstellungen aus
 * einer älteren Fassung dürfen die App nicht stolpern lassen.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { deleteDB } from 'idb'
import { defaultLinks, defaultSettings, useSettingsStore, withDefaults } from '@/stores/settings'
import { SettingsRepository } from '@/db/repository'
import { closeDb, DB_NAME } from '@/db/schema'
import type { Settings } from '@/types/portfolio'

beforeEach(async () => {
  setActivePinia(createPinia())
  await closeDb()
  await deleteDB(DB_NAME)
})

afterEach(async () => {
  await closeDb()
})

describe('withDefaults', () => {
  it('ergänzt fehlende Verweise', () => {
    const alt = { activePortfolioId: 'p1', saveAssetGrenze: 5000 } as Partial<Settings>
    const merged = withDefaults(alt)

    expect(merged.links.length).toBeGreaterThan(0)
    expect(merged.saveAssetGrenze).toBe(5000)
  })

  it('behält vorhandene Werte bei', () => {
    const alt: Partial<Settings> = {
      activePortfolioId: 'p1',
      bands: { lowerPercent: 3, upperPercent: 7 },
    }
    expect(withDefaults(alt).bands).toEqual({ lowerPercent: 3, upperPercent: 7 })
  })

  it('überschreibt eigene Verweise nicht', () => {
    const eigene = [
      {
        id: 'meiner',
        label: 'Meiner',
        urlTemplate: 'https://x.test/{isin}',
        appliesTo: [],
        enabled: true,
      },
    ]
    expect(withDefaults({ links: eigene }).links).toEqual(eigene)
  })

  it('füllt Teilangaben in verschachtelten Feldern auf', () => {
    const merged = withDefaults({ refresh: { autoOnLoad: false } as Settings['refresh'] })
    expect(merged.refresh.autoOnLoad).toBe(false)
    expect(merged.refresh.staleAfterMinutes).toBe(60)
  })

  it('kommt mit einem völlig leeren Datensatz zurecht', () => {
    const merged = withDefaults({})
    expect(merged.bands.lowerPercent).toBe(6)
    expect(merged.links.length).toBe(defaultLinks().length)
  })
})

describe('useSettingsStore — load', () => {
  it('legt beim Erststart die Vorgaben an', async () => {
    const store = useSettingsStore()
    await store.load('p1')

    expect(store.loaded).toBe(true)
    expect(store.settings.activePortfolioId).toBe('p1')
    expect(store.settings.links.length).toBeGreaterThan(0)
  })

  it('ergänzt Verweise in einem alten Datensatz und schreibt sie zurück', async () => {
    // Datensatz ohne `links`, wie ihn eine ältere Fassung hinterlassen hätte.
    const repository = new SettingsRepository()
    const alt = defaultSettings('p1')
    delete (alt as Partial<Settings>).links
    await repository.save(alt as Settings)

    const store = useSettingsStore()
    await store.load('p1')

    expect(store.settings.links.length).toBeGreaterThan(0)
    const wiederGeladen = await repository.load()
    expect(wiederGeladen?.links.length).toBeGreaterThan(0)
  })
})

describe('useSettingsStore — Verweise', () => {
  it('speichert geänderte Verweise dauerhaft', async () => {
    const store = useSettingsStore()
    await store.load('p1')

    await store.setLinks([
      {
        id: 'nur-einer',
        label: 'Nur einer',
        urlTemplate: 'https://x.test/{isin}',
        appliesTo: ['stock'],
        enabled: true,
      },
    ])

    const gespeichert = await new SettingsRepository().load()
    expect(gespeichert?.links).toHaveLength(1)
    expect(gespeichert?.links[0]?.id).toBe('nur-einer')
  })

  it('setzt auf die Vorgaben zurück', async () => {
    const store = useSettingsStore()
    await store.load('p1')
    await store.setLinks([])

    await store.resetLinks()

    expect(store.settings.links).toEqual(defaultLinks())
  })

  it('die Vorgaben trennen ETF- und Aktien-Profile', () => {
    const links = defaultLinks()
    const etfProfil = links.find((link) => link.id === 'extraetf-etf')
    const aktienProfil = links.find((link) => link.id === 'extraetf-stock')

    expect(etfProfil?.appliesTo).toEqual(['etf'])
    expect(aktienProfil?.appliesTo).toEqual(['stock'])
    expect(etfProfil?.urlTemplate).toContain('etf-profile')
    expect(aktienProfil?.urlTemplate).toContain('stock-profile')
  })

  it('der Meldefonds-Nachweis gilt nur für Fonds', () => {
    const oekb = defaultLinks().find((link) => link.id === 'oekb-meldefonds')
    expect(oekb?.appliesTo).toEqual(['etf'])
  })
})
