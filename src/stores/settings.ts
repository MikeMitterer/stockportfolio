/**
 * Pinia-Store für die Einstellungen (Bänder, Kennzahlen, Anzeige).
 * Jede Änderung wird direkt nach IndexedDB durchgeschrieben.
 */

import { defineStore } from 'pinia'
import { ref } from 'vue'
import { consola } from 'consola'
import { SettingsRepository } from '@/db/repository'
import type { Bands, Settings } from '@/types/portfolio'

/** Vorgaben beim Erststart — entsprechen der Excel-Vorlage. */
export function defaultSettings(activePortfolioId: string): Settings {
  return {
    activePortfolioId,
    totalRounding: -3,
    bands: { lowerPercent: 6, upperPercent: 15 },
    saveAssetGrenze: 170_000,
    investmentReservePercent: 10,
    currentRebalancingBudget: 230_000,
    currency: 'EUR',
    refresh: { autoOnLoad: true, staleAfterMinutes: 60 },
    ui: {
      columns: {
        volatility: true,
        optimalUnits: true,
        groupSharePercent: false,
        deltaEuro: true,
        deltaMax: false,
        deltaPercentAbs: false,
      },
    },
  }
}

export const useSettingsStore = defineStore('settings', () => {
  const repository = new SettingsRepository()

  const settings = ref<Settings>(defaultSettings(''))
  const loaded = ref<boolean>(false)

  /** Lädt die Einstellungen; legt beim Erststart die Vorgaben an. */
  async function load(fallbackPortfolioId: string): Promise<void> {
    const stored = await repository.load()
    if (stored) {
      settings.value = stored
    } else {
      settings.value = defaultSettings(fallbackPortfolioId)
      await repository.save(settings.value)
      consola.info('settings: Vorgaben angelegt')
    }
    loaded.value = true
  }

  /** Übernimmt einzelne Felder und schreibt sie durch. */
  async function patch(changes: Partial<Settings>): Promise<void> {
    settings.value = { ...settings.value, ...changes }
    await repository.save(settings.value)
  }

  /** Setzt die Toleranzbänder. */
  async function setBands(bands: Bands): Promise<void> {
    await patch({ bands })
  }

  /** Wechselt das aktive Portfolio. */
  async function setActivePortfolio(portfolioId: string): Promise<void> {
    await patch({ activePortfolioId: portfolioId })
  }

  return { settings, loaded, load, patch, setBands, setActivePortfolio }
})
