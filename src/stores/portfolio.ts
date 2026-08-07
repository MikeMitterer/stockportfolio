/**
 * Pinia-Store für das aktive Portfolio.
 *
 * Hält die Positionen im Speicher und schreibt jede Änderung sofort nach
 * IndexedDB — es gibt keinen „Speichern"-Knopf.
 */

import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { consola } from 'consola'
import { PortfolioRepository } from '@/db/repository'
import { seedPortfolio } from '@/db/seed'
import type { Portfolio, Position } from '@/types/portfolio'

export const usePortfolioStore = defineStore('portfolio', () => {
  const repository = new PortfolioRepository()

  const portfolio = ref<Portfolio | null>(null)
  const loaded = ref<boolean>(false)

  const positions = computed<Position[]>(() => portfolio.value?.positions ?? [])

  /**
   * Lädt das Portfolio. Ist die Datenbank leer, wird einmalig die
   * Excel-Vorlage geseedet — sonst wäre die App ohne Add-Dialog (T-10)
   * nicht benutzbar.
   *
   * @param preferredId Zuletzt aktives Portfolio (aus den Settings).
   */
  async function load(preferredId?: string): Promise<void> {
    if ((await repository.count()) === 0) {
      const seeded = seedPortfolio()
      await repository.save(seeded)
      consola.info('portfolio: Vorlage geseedet', { positions: seeded.positions.length })
      portfolio.value = seeded
      loaded.value = true
      return
    }

    const all = await repository.findAll()
    portfolio.value = all.find((entry) => entry.id === preferredId) ?? all[0] ?? null
    loaded.value = true
  }

  /** Schreibt den aktuellen Stand durch. */
  async function persist(): Promise<void> {
    if (!portfolio.value) return
    await repository.save(portfolio.value)
  }

  /**
   * Ändert Felder einer Position und persistiert.
   *
   * @param id      ID der Position.
   * @param changes Zu überschreibende Felder.
   */
  async function updatePosition(id: string, changes: Partial<Position>): Promise<void> {
    if (!portfolio.value) return

    const index = portfolio.value.positions.findIndex((position) => position.id === id)
    if (index === -1) {
      consola.warn('portfolio: updatePosition für unbekannte ID', { id })
      return
    }

    const current = portfolio.value.positions[index]
    if (!current) return

    const next = [...portfolio.value.positions]
    next[index] = { ...current, ...changes, id: current.id }
    portfolio.value = { ...portfolio.value, positions: next }
    await persist()
  }

  /**
   * Bucht einen Trade auf den Bestand.
   *
   * @param id         ID der Position.
   * @param tradeUnits Positiv = Kauf, negativ = Verkauf.
   */
  async function applyTrade(id: string, tradeUnits: number): Promise<void> {
    const position = positions.value.find((entry) => entry.id === id)
    if (!position) return

    const nextUnits = position.units + tradeUnits
    await updatePosition(id, { units: Math.max(0, nextUnits) })
  }

  /** Fügt eine Position hinzu. */
  async function addPosition(position: Position): Promise<void> {
    if (!portfolio.value) return
    portfolio.value = {
      ...portfolio.value,
      positions: [...portfolio.value.positions, position],
    }
    await persist()
  }

  /** Entfernt eine Position endgültig. */
  async function removePosition(id: string): Promise<void> {
    if (!portfolio.value) return
    portfolio.value = {
      ...portfolio.value,
      positions: portfolio.value.positions.filter((position) => position.id !== id),
    }
    await persist()
  }

  return {
    portfolio,
    positions,
    loaded,
    load,
    updatePosition,
    applyTrade,
    addPosition,
    removePosition,
  }
})
