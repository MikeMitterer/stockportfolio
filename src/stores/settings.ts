/**
 * Pinia-Store für die Einstellungen (Bänder, Kennzahlen, Anzeige).
 * Jede Änderung wird direkt nach IndexedDB durchgeschrieben.
 */

import { defineStore } from 'pinia'
import { ref } from 'vue'
import { consola } from 'consola'
import { SettingsRepository } from '@/db/repository'
import type { Bands, ExternalLink, Settings } from '@/types/portfolio'

/**
 * Voreingestellte externe Verweise.
 *
 * Bewusst als Daten und nicht im Code verdrahtet: Der Meldefonds-Nachweis der
 * ÖKB gilt nur für Österreich und wäre für andere Länder sinnlos; extraETF
 * trennt Aktien und Fonds in verschiedene Adressen. Wer will, ändert, ergänzt
 * oder deaktiviert das in den Einstellungen.
 */
export function defaultLinks(): ExternalLink[] {
  return [
    {
      id: 'extraetf-etf',
      label: 'extraETF',
      urlTemplate: 'https://extraetf.com/de/etf-profile/{isin}',
      appliesTo: ['etf'],
      enabled: true,
    },
    {
      id: 'extraetf-stock',
      label: 'extraETF',
      urlTemplate: 'https://extraetf.com/de/stock-profile/{isin}',
      appliesTo: ['stock'],
      enabled: true,
    },
    {
      id: 'oekb-meldefonds',
      label: 'myOEKB — Meldefonds',
      urlTemplate:
        'https://my.oekb.at/kapitalmarkt-services/kms-output/fonds-info/sd/af/f?isin={isin}',
      // Nur Fonds: eine Aktie kann kein Meldefonds sein.
      appliesTo: ['etf'],
      enabled: true,
    },
  ]
}

/** Vorgaben beim Erststart. */
export function defaultSettings(activePortfolioId: string): Settings {
  return {
    activePortfolioId,
    totalRounding: -3,
    bands: { lowerPercent: 6, upperPercent: 15 },
    securityBuffer: 170_000,
    investmentReservePercent: 10,
    currentRebalancingBudget: 230_000,
    currency: 'EUR',
    refresh: { autoOnLoad: true, staleAfterMinutes: 60 },
    links: defaultLinks(),
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

/**
 * Ergänzt fehlende Felder aus den Vorgaben.
 *
 * Gespeicherte Einstellungen stammen womöglich aus einer älteren Fassung und
 * kennen neu hinzugekommene Felder nicht. Ohne diese Auffrischung stünde die
 * Oberfläche vor `undefined`.
 */
export function withDefaults(stored: Partial<Settings>): Settings {
  const base = defaultSettings(stored.activePortfolioId ?? '')

  // `saveAssetGrenze` hieß bis T-18 so; den Wert übernehmen, damit niemand
  // seinen Puffer verliert.
  const legacyBuffer = (stored as { saveAssetGrenze?: number }).saveAssetGrenze

  return {
    ...base,
    ...stored,
    bands: { ...base.bands, ...stored.bands },
    refresh: { ...base.refresh, ...stored.refresh },
    securityBuffer: stored.securityBuffer ?? legacyBuffer ?? base.securityBuffer,
    links: stored.links?.length ? stored.links : base.links,
    ui: { columns: { ...base.ui.columns, ...stored.ui?.columns } },
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
      // Ältere Datensätze kennen neuere Felder nicht — auffrischen und, falls
      // dabei etwas ergänzt wurde, gleich zurückschreiben.
      const merged = withDefaults(stored)
      settings.value = merged
      if (!stored.links?.length) {
        await repository.save(merged)
        consola.info('settings: fehlende Felder ergänzt')
      }
    } else {
      settings.value = defaultSettings(fallbackPortfolioId)
      await repository.save(settings.value)
      consola.info('settings: Vorgaben angelegt')
    }
    loaded.value = true
  }

  /** Ersetzt die Liste der externen Verweise. */
  async function setLinks(links: ExternalLink[]): Promise<void> {
    await patch({ links })
  }

  /** Setzt die Verweise auf die Vorgaben zurück. */
  async function resetLinks(): Promise<void> {
    await patch({ links: defaultLinks() })
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

  return {
    settings,
    loaded,
    load,
    patch,
    setBands,
    setActivePortfolio,
    setLinks,
    resetLinks,
  }
})
