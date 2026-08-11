/**
 * Pinia-Store für das aktive Portfolio.
 *
 * Hält die Positionen im Speicher und schreibt jede Änderung sofort nach
 * IndexedDB — es gibt keinen „Speichern"-Knopf.
 */

import { acceptHMRUpdate, defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { consola } from 'consola'
import { AllowlistRepository, PortfolioRepository } from '@/db/repository'
import { demoPortfolio, emptyPortfolio } from '@/db/seed'
import type { InstrumentKind, Portfolio, Position } from '@/types/portfolio'

/** Kopf-Daten eines Depots für die Verwaltungsliste. */
export interface PortfolioSummary {
  id: string
  name: string
  positionCount: number
  updatedAt: string
}

export const usePortfolioStore = defineStore('portfolio', () => {
  const repository = new PortfolioRepository()
  const allowlistRepository = new AllowlistRepository()

  const portfolio = ref<Portfolio | null>(null)
  const loaded = ref<boolean>(false)

  /**
   * Alle vorhandenen Depots — nur Kopf-Daten für die Verwaltung.
   *
   * Bewusst getrennt vom aktiven Depot: Die Liste wird selten gebraucht, das
   * aktive Depot dauernd. Sie vollständig im Speicher zu halten hieße, jede
   * Positionsänderung an zwei Stellen nachzuziehen.
   */
  const all = ref<PortfolioSummary[]>([])

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
      await refreshList()
      return
    }

    const entries = await repository.findAll()
    portfolio.value = entries.find((entry) => entry.id === preferredId) ?? entries[0] ?? null
    loaded.value = true
    await refreshList()
  }

  // ─── Verwaltung mehrerer Depots ───────────────────────────────────────────

  /**
   * Legt ein weiteres Depot an und macht es zum aktiven.
   *
   * @param name Anzeigename; leer fällt auf „Neues Depot" zurück.
   * @returns Die Kennung des neuen Depots — der Aufrufer muss sie in den
   *          Einstellungen als aktiv vermerken.
   */
  async function createPortfolio(name: string): Promise<string> {
    const fresh = emptyPortfolio(name.trim() || 'Neues Depot')
    await repository.save(fresh)
    portfolio.value = fresh
    await refreshList()
    consola.info('portfolio: Depot angelegt', { id: fresh.id, name: fresh.name })
    return fresh.id
  }

  /** Wechselt das aktive Depot. */
  async function switchTo(id: string): Promise<void> {
    const next = await repository.findById(id)
    if (!next) {
      consola.warn('portfolio: Wechsel auf unbekanntes Depot', { id })
      return
    }
    portfolio.value = next
  }

  /** Benennt ein Depot um — auch eines, das gerade nicht aktiv ist. */
  async function renamePortfolio(id: string, name: string): Promise<void> {
    const trimmed = name.trim()
    if (trimmed === '') return

    const target = id === portfolio.value?.id ? portfolio.value : await repository.findById(id)
    if (!target) return

    const renamed = { ...target, name: trimmed, updatedAt: new Date().toISOString() }
    await repository.save(renamed)
    if (id === portfolio.value?.id) portfolio.value = renamed
    await refreshList()
  }

  /**
   * Löscht ein Depot endgültig.
   *
   * Das letzte bleibt stehen: Ohne Depot hätte die App keinen Zustand, in dem
   * sie sinnvoll wäre — sie legte beim nächsten Start ohnehin ein leeres an,
   * nur dass die Einstellungen dann auf eine Kennung zeigten, die es nicht
   * mehr gibt.
   *
   * @returns Die Kennung des danach aktiven Depots, oder `null` wenn nichts
   *          geschah.
   */
  async function deletePortfolio(id: string): Promise<string | null> {
    if (all.value.length <= 1) {
      consola.warn('portfolio: Letztes Depot bleibt bestehen', { id })
      return null
    }

    await repository.remove(id)
    // Die Whitelist gehört zum Depot — ohne dieses Aufräumen bliebe sie für
    // immer liegen, sichtbar nie wieder.
    await allowlistRepository.removeForPortfolio(id)
    await refreshList()

    // Wer das aktive Depot löscht, landet beim nächsten in der Liste.
    if (id === portfolio.value?.id) {
      const next = all.value[0]
      if (next) await switchTo(next.id)
    }

    consola.info('portfolio: Depot gelöscht', { id })
    return portfolio.value?.id ?? null
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
    if (current) {
      await repository.remove(current.id)
      await allowlistRepository.removeForPortfolio(current.id)
    }

    portfolio.value = demo
    await refreshList()
    consola.info('portfolio: Beispiel-Depot geladen')
  }

  /**
   * Hält fest, wann dieses Depot zuletzt ausgeglichen wurde.
   *
   * Bewusst von Hand: Die App weiß nicht, ob eine Order tatsächlich
   * ausgeführt wurde — das weiß nur, wer sie aufgegeben hat.
   *
   * @param date ISO-Datum, oder `null` um den Vermerk zu löschen.
   */
  async function markRebalanced(date: string | null): Promise<void> {
    if (!portfolio.value) return

    portfolio.value = {
      ...portfolio.value,
      lastRebalancedAt: date,
      updatedAt: new Date().toISOString(),
    }
    await persist()
  }

  /** Schreibt den aktuellen Stand durch. */
  async function persist(): Promise<void> {
    if (!portfolio.value) return
    await repository.save(portfolio.value)
    await refreshList()
  }

  /**
   * Liest die Liste aller Depots neu.
   *
   * Nach jeder Änderung, damit Positionszahl und Datum in der Verwaltung
   * stimmen — eine veraltete Liste wäre schlimmer als keine, weil man ihr
   * ansieht, dass sie sich nicht bewegt.
   */
  async function refreshList(): Promise<void> {
    const entries = await repository.findAll()
    all.value = entries
      .map((entry) => ({
        id: entry.id,
        name: entry.name,
        positionCount: entry.positions.length,
        updatedAt: entry.updatedAt,
      }))
      .sort((a, b) => a.name.localeCompare(b.name, 'de'))
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

  /**
   * Ersetzt das aktive Depot durch ein eingelesenes.
   *
   * Das bisherige wird entfernt, nicht danebengelegt: Zwei Depots mit
   * derselben Kennung ließen sich nicht auseinanderhalten, und die App zeigt
   * ohnehin immer nur eines. Aufrufer müssen vorher fragen — hier gibt es
   * kein Zurück.
   *
   * @param next Das einzuspielende Depot.
   */
  async function replacePortfolio(next: Portfolio): Promise<void> {
    const current = portfolio.value

    await repository.save(next)
    if (current && current.id !== next.id) {
      await repository.remove(current.id)
      await allowlistRepository.removeForPortfolio(current.id)
    }

    portfolio.value = next
    await refreshList()
    consola.info('portfolio: Depot ersetzt', { id: next.id, positions: next.positions.length })
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
    all,
    loaded,
    load,
    refreshList,
    createPortfolio,
    switchTo,
    renamePortfolio,
    deletePortfolio,
    loadDemo,
    updatePosition,
    addPosition,
    removePosition,
    replacePortfolio,
    backfillKinds,
    markRebalanced,
  }
})

/*
 * Hot-Reload: Ohne diese Zeile behält der Browser beim Speichern die alte
 * Fassung des Stores. Neue Methoden fehlen dann — der Aufruf läuft ins Leere
 * und man sucht den Fehler im eigenen Code, obwohl nur ein Neuladen fehlt.
 */
if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(usePortfolioStore, import.meta.hot))
}
