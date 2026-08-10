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
    const alt: Partial<Settings> = {
      activePortfolioId: 'p1',
      securityBuffer: { mode: 'absolute', value: 5000 },
    }
    const merged = withDefaults(alt)

    expect(merged.links.length).toBeGreaterThan(0)
    expect(merged.securityBuffer).toEqual({ mode: 'absolute', value: 5000 })
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

  it('übernimmt den alten Feldnamen saveAssetGrenze als Sicherheitspuffer', () => {
    // Bis T-18 hieß das Feld so. Wer die App vorher genutzt hat, darf seinen
    // Puffer nicht verlieren.
    const alt = { activePortfolioId: 'p1', saveAssetGrenze: 42_000 } as Partial<Settings>
    expect(withDefaults(alt).securityBuffer).toEqual({ mode: 'absolute', value: 42_000 })
  })

  it('der neue Feldname hat Vorrang vor dem alten', () => {
    const beide = {
      activePortfolioId: 'p1',
      securityBuffer: { mode: 'absolute', value: 10_000 },
      saveAssetGrenze: 42_000,
    } as Partial<Settings>
    expect(withDefaults(beide).securityBuffer).toEqual({ mode: 'absolute', value: 10_000 })
  })

  it('deutet einen blanken Zahlenwert als festen Betrag', () => {
    // Bis T-20 war der Puffer eine nackte Zahl — und die war immer in Euro.
    const alt = { activePortfolioId: 'p1', securityBuffer: 7000 } as unknown as Partial<Settings>
    expect(withDefaults(alt).securityBuffer).toEqual({ mode: 'absolute', value: 7000 })
  })

  it('legt ohne gespeicherten Puffer keinen Betrag fest', () => {
    // Jede Vorgabe wäre geraten: Ein fester Betrag ist für das eine Depot die
    // Hälfte und für das nächste ein Vielfaches.
    expect(withDefaults({ activePortfolioId: 'p1' }).securityBuffer.value).toBe(0)
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
