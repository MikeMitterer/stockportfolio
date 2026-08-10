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
import { demoPortfolio, emptyPortfolio } from '@/db/seed'
import type { InstrumentKind, Portfolio, Position } from '@/types/portfolio'

export const usePortfolioStore = defineStore('portfolio', () => {
  const repository = new PortfolioRepository()

  const portfolio = ref<Portfolio | null>(null)
  const loaded = ref<boolean>(false)

  const positions = computed<Position[]>(() => portfolio.value?.positions ?? [])

  /** Positionen außer der Cash-Zeile — für „ist das Depot leer?". */
  const hasHoldings = computed<boolean>(() =>
    positions.value.some((position) => position.group !== 'cash'),
  )

  /**
   * Lädt das Portfolio. Ist die Datenbank leer, wird ein **leeres** Depot
   * angelegt — vorgegebene Bestände ließen sich später kaum von eigenen
   * Daten unterscheiden. Zum Ausprobieren gibt es `loadDemo()`.
   *
   * @param preferredId Zuletzt aktives Portfolio (aus den Settings).
   */
  async function load(preferredId?: string): Promise<void> {
    if ((await repository.count()) === 0) {
      const fresh = emptyPortfolio()
      await repository.save(fresh)
      consola.info('portfolio: leeres Depot angelegt')
      portfolio.value = fresh
      loaded.value = true
      return
    }

    const all = await repository.findAll()
    portfolio.value = all.find((entry) => entry.id === preferredId) ?? all[0] ?? null
    loaded.value = true
  }

  /**
   * Ersetzt das aktive Depot durch das Beispiel-Depot.
   * Nur aus dem leeren Zustand heraus angeboten, damit niemand versehentlich
   * eigene Bestände überschreibt.
   */
  async function loadDemo(): Promise<void> {
    const current = portfolio.value
    const demo = demoPortfolio()

    await repository.save(demo)
    if (current) await repository.remove(current.id)

    portfolio.value = demo
    consola.info('portfolio: Beispiel-Depot geladen')
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

  /** Fügt eine Position hinzu. */
  async function addPosition(position: Position): Promise<void> {
    if (!portfolio.value) return
    portfolio.value = {
      ...portfolio.value,
      positions: [...portfolio.value.positions, position],
    }
    await persist()
  }

  /**
   * Trägt fehlende Gattungen aus den Kursen nach.
   *
   * Positionen, die vor der Einführung von `kind` angelegt wurden, kennen
   * ihre Gattung nicht — ohne sie bleiben die externen Verweise leer. Sobald
   * die Kurse da sind, lässt sie sich ableiten und dauerhaft festhalten.
   *
   * @param quotes Kurs-Cache (Key = ISIN oder Symbol).
   * @returns Anzahl der ergänzten Positionen.
   */
  async function backfillKinds(quotes: Map<string, { type: string | null }>): Promise<number> {
    if (!portfolio.value) return 0

    let changed = 0
    const next = portfolio.value.positions.map((position) => {
      if (position.kind || position.group === 'cash') return position

      const quote = quotes.get(position.isin ?? position.symbol)
      const kind: InstrumentKind | null =
        quote?.type === 'etf' || quote?.type === 'stock' ? quote.type : null
      if (!kind) return position

      changed += 1
      return { ...position, kind }
    })

    if (changed === 0) return 0

    portfolio.value = { ...portfolio.value, positions: next }
    await persist()
    consola.info('portfolio: Gattung nachgetragen', { count: changed })
    return changed
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
    hasHoldings,
    loaded,
    load,
    loadDemo,
    updatePosition,
    addPosition,
    removePosition,
    backfillKinds,
  }
})
