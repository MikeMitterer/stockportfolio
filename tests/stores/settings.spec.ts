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
    const stored: Partial<Settings> = {
      activePortfolioId: 'p1',
      securityBuffer: { mode: 'absolute', value: 5000 },
    }
    const merged = withDefaults(stored)

    expect(merged.links.length).toBeGreaterThan(0)
    expect(merged.securityBuffer).toEqual({ mode: 'absolute', value: 5000 })
  })

  it('behält vorhandene Werte bei', () => {
    const stored: Partial<Settings> = {
      activePortfolioId: 'p1',
      bands: { lowerPercent: 3, upperPercent: 7 },
    }
    expect(withDefaults(stored).bands).toEqual({ lowerPercent: 3, upperPercent: 7 })
  })

  it('überschreibt eigene Verweise nicht', () => {
    const customLinks = [
      {
        id: 'meiner',
        label: 'Meiner',
        urlTemplate: 'https://x.test/{isin}',
        appliesTo: [],
        enabled: true,
      },
    ]
    expect(withDefaults({ links: customLinks }).links).toEqual(customLinks)
  })

  it('füllt Teilangaben in verschachtelten Feldern auf', () => {
    const merged = withDefaults({ refresh: { autoOnLoad: false } as Settings['refresh'] })
    expect(merged.refresh.autoOnLoad).toBe(false)
    expect(merged.refresh.staleAfterMinutes).toBe(60)
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
    const stored = defaultSettings('p1')
    delete (stored as Partial<Settings>).links
    await repository.save(stored as Settings)

    const store = useSettingsStore()
    await store.load('p1')

    expect(store.settings.links.length).toBeGreaterThan(0)
    const reloaded = await repository.load()
    expect(reloaded?.links.length).toBeGreaterThan(0)
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

    const saved = await new SettingsRepository().load()
    expect(saved?.links).toHaveLength(1)
    expect(saved?.links[0]?.id).toBe('nur-einer')
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
    const etfProfile = links.find((link) => link.id === 'extraetf-etf')
    const stockProfile = links.find((link) => link.id === 'extraetf-stock')

    expect(etfProfile?.appliesTo).toEqual(['etf'])
    expect(stockProfile?.appliesTo).toEqual(['stock'])
    expect(etfProfile?.urlTemplate).toContain('etf-profile')
    expect(stockProfile?.urlTemplate).toContain('stock-profile')
  })

  it('der Meldefonds-Nachweis gilt nur für Fonds', () => {
    const oekb = defaultLinks().find((link) => link.id === 'oekb-meldefonds')
    expect(oekb?.appliesTo).toEqual(['etf'])
  })
})

describe('withDefaults — Meldungs-Zähler', () => {
  it('gibt neuen Datensätzen einen Zähler', () => {
    expect(withDefaults({ activePortfolioId: 'p1' }).ui.notificationSeconds).toBeGreaterThan(0)
  })

  it('behält eine gespeicherte 0 — Meldungen sollen dann stehen bleiben', () => {
    // 0 ist ein gültiger Wert, kein „nicht gesetzt". Ein `||`-Rückfall hätte
    // ihn stillschweigend überschrieben.
    const stored: Partial<Settings> = {
      activePortfolioId: 'p1',
      ui: { notificationSeconds: 0, historyPeriod: 'month' },
    }
    expect(withDefaults(stored).ui.notificationSeconds).toBe(0)
  })

  it('ergänzt den Zähler bei Einstellungen aus einer älteren Fassung', () => {
    // Solche Datensätze kennen den Zähler noch nicht.
    const stored = { activePortfolioId: 'p1', ui: {} } as unknown as Partial<Settings>
    expect(withDefaults(stored).ui.notificationSeconds).toBe(
      defaultSettings('p1').ui.notificationSeconds,
    )
  })
})

describe('useSettingsStore — replaceAll', () => {
  it('übernimmt eingespielte Einstellungen', async () => {
    const store = useSettingsStore()
    await store.load('p1')

    await store.replaceAll({
      ...defaultSettings('p1'),
      bands: { lowerPercent: 3, upperPercent: 9 },
    })

    expect(store.settings.bands).toEqual({ lowerPercent: 3, upperPercent: 9 })
  })

  it('ergänzt Felder, die eine ältere Sicherung noch nicht kannte', async () => {
    // Sonst scheitert das Einspielen daran, dass die App inzwischen ein Feld
    // mehr hat — und der Nutzer steht vor undefined.
    const store = useSettingsStore()
    await store.load('p1')

    await store.replaceAll({ activePortfolioId: 'p1' } as Partial<Settings>)

    expect(store.settings.links.length).toBeGreaterThan(0)
    expect(store.settings.ui.notificationSeconds).toBeGreaterThan(0)
    expect(store.settings.securityBuffer.mode).toBeDefined()
  })

  it('persistiert die Übernahme', async () => {
    const store = useSettingsStore()
    await store.load('p1')
    await store.replaceAll({ ...defaultSettings('p1'), totalRounding: 0 })

    const stored = await new SettingsRepository().load()

    expect(stored?.totalRounding).toBe(0)
  })
})

describe('withDefaults — Zeitraum der Verlaufslinie', () => {
  it('gibt neuen Datensätzen einen Zeitraum', () => {
    expect(withDefaults({ activePortfolioId: 'p1' }).ui.historyPeriod).toBe('month')
  })

  it('behält eine gespeicherte Wahl', () => {
    const stored = {
      activePortfolioId: 'p1',
      ui: { notificationSeconds: 8, historyPeriod: 'day' },
    } as unknown as Partial<Settings>

    expect(withDefaults(stored).ui.historyPeriod).toBe('day')
  })

  it('ergänzt ihn bei Einstellungen aus einer älteren Fassung', () => {
    // Solche Datensätze kennen nur den Meldungs-Zähler.
    const stored = {
      activePortfolioId: 'p1',
      ui: { notificationSeconds: 8 },
    } as unknown as Partial<Settings>

    expect(withDefaults(stored).ui.historyPeriod).toBe('month')
  })
})

/**
 * Die beiden Felder unter `refresh` steuern das automatische Laden. Sie standen
 * lange nur im Modell; seit sie eine Oberfläche haben, müssen sie einzeln
 * änderbar sein, ohne das jeweils andere zu verlieren — der klassische Fehler
 * beim Zusammenführen verschachtelter Einstellungen.
 */
describe('Einstellungen zum Aktualisieren', () => {
  it('ändert die Frist, ohne den Schalter zu verlieren', async () => {
    const store = useSettingsStore()
    await store.load('p1')

    await store.patch({ refresh: { ...store.settings.refresh, staleAfterMinutes: 15 } })

    expect(store.settings.refresh.staleAfterMinutes).toBe(15)
    expect(store.settings.refresh.autoOnLoad).toBe(true)
  })

  it('ändert den Schalter, ohne die Frist zu verlieren', async () => {
    const store = useSettingsStore()
    await store.load('p1')

    await store.patch({ refresh: { ...store.settings.refresh, autoOnLoad: false } })

    expect(store.settings.refresh.autoOnLoad).toBe(false)
    expect(store.settings.refresh.staleAfterMinutes).toBe(60)
  })

  it('hält beides über einen Neustart hinweg', async () => {
    const store = useSettingsStore()
    await store.load('p1')
    await store.patch({ refresh: { autoOnLoad: false, staleAfterMinutes: 15 } })

    const reloaded = await new SettingsRepository().load()

    expect(reloaded?.refresh).toEqual({ autoOnLoad: false, staleAfterMinutes: 15 })
  })
})
