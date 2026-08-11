/**
 * Pinia-Store für den Instrumenten-Katalog und die Auswahl-Whitelist.
 *
 * Der Katalog kommt aus der API und wird nicht persistiert (er ist
 * jederzeit neu abrufbar). Die Whitelist ist eine Nutzerentscheidung und
 * liegt in IndexedDB — **je Depot**: Welche Papiere für ein Kinderdepot in
 * Frage kommen, ist eine andere Menge als beim eigenen.
 */

import { acceptHMRUpdate, defineStore } from 'pinia'
import { computed, ref, shallowRef, watch } from 'vue'
import { consola } from 'consola'
import { translate } from '@/i18n'
import { ApiError } from '@/api/errors'
import { cacheKeyOf } from '@/api/mappers'
import { AllowlistRepository } from '@/db/repository'
import { usePortfolioStore } from '@/stores/portfolio'
import type { StockInfoClient } from '@/api/client'
import type { InstrumentSummary } from '@/api/types'

export const useInstrumentsStore = defineStore('instruments', () => {
  const repository = new AllowlistRepository()
  const portfolioStore = usePortfolioStore()

  /**
   * Depot, zu dem die geladene Whitelist gehört.
   *
   * Gemerkt, um nach einem Wechsel nicht mit der Liste des vorigen Depots
   * weiterzuarbeiten — die Freigaben sähen dann richtig aus und wären falsch.
   */
  const allowlistFor = ref<string | null>(null)

  const instruments = shallowRef<InstrumentSummary[]>([])
  const allowlist = ref<Map<string, boolean>>(new Map())
  const loading = ref<boolean>(false)
  const error = ref<string | null>(null)
  const loaded = ref<boolean>(false)

  /** Schlüssel eines Instruments — ISIN bevorzugt, Symbol als Fallback. */
  function keyOf(instrument: InstrumentSummary): string {
    return cacheKeyOf(instrument)
  }

  /**
   * Ist das Instrument für die Auswahl freigegeben?
   *
   * Ohne Eintrag gilt „freigegeben": ein leerer Allowlist-Store bedeutet
   * „noch nichts ausgeblendet", nicht „nichts erlaubt".
   */
  function isAllowed(instrument: InstrumentSummary): boolean {
    return allowlist.value.get(keyOf(instrument)) ?? true
  }

  /** Alle für die Auswahl freigegebenen Instrumente. */
  const allowedInstruments = computed<InstrumentSummary[]>(() =>
    instruments.value.filter((instrument) => isAllowed(instrument)),
  )

  /** Lädt Katalog und Whitelist. */
  async function load(client: StockInfoClient): Promise<void> {
    loading.value = true
    error.value = null

    try {
      const portfolioId = portfolioStore.portfolio?.id ?? ''
      const [catalogue, stored] = await Promise.all([
        client.getInstruments(),
        repository.loadAll(portfolioId),
      ])
      instruments.value = catalogue
      allowlist.value = stored
      allowlistFor.value = portfolioId
      loaded.value = true
    } catch (cause) {
      error.value =
        cause instanceof ApiError ? cause.detail : translate('notify.assetsFailed')
      consola.error('instruments: Laden fehlgeschlagen', { reason: error.value })
    } finally {
      loading.value = false
    }
  }

  /** Schaltet die Freigabe eines Instruments um und persistiert sie. */
  async function toggleAllowed(instrument: InstrumentSummary): Promise<void> {
    const portfolioId = portfolioStore.portfolio?.id
    if (!portfolioId) return

    const key = keyOf(instrument)
    const next = !isAllowed(instrument)

    const updated = new Map(allowlist.value)
    updated.set(key, next)
    allowlist.value = updated

    await repository.setEnabled(portfolioId, key, next)
  }

  /**
   * Ersetzt die Whitelist — für das Einspielen einer Sicherung.
   *
   * @param entries Neue Whitelist (Key → freigegeben).
   */
  async function replaceAllowlist(entries: Map<string, boolean>): Promise<void> {
    const portfolioId = portfolioStore.portfolio?.id
    if (!portfolioId) return

    allowlist.value = new Map(entries)
    allowlistFor.value = portfolioId
    await repository.replaceAll(portfolioId, entries)
    consola.info('instruments: Whitelist ersetzt', { portfolioId, count: entries.size })
  }

  /**
   * Lädt nur die Whitelist, ohne den Katalog.
   *
   * Die Sicherung lässt sich auch dann einspielen, wenn die Assets-Seite in
   * dieser Sitzung nie geöffnet wurde — dann steht der Katalog noch nicht,
   * die Whitelist aber sehr wohl.
   */
  async function hydrateAllowlist(): Promise<void> {
    const portfolioId = portfolioStore.portfolio?.id ?? ''
    allowlist.value = await repository.loadAll(portfolioId)
    allowlistFor.value = portfolioId
  }

  /*
   * Depot-Wechsel: Die Whitelist gehört zum Depot und muss mitwechseln.
   * Ohne das zeigte die Assets-Seite die Freigaben des vorigen Depots — sie
   * sähen richtig aus und wären falsch.
   */
  watch(
    () => portfolioStore.portfolio?.id,
    async (portfolioId) => {
      if (!portfolioId || portfolioId === allowlistFor.value) return
      await hydrateAllowlist()
    },
  )

  return {
    instruments,
    allowlist,
    allowlistFor,
    hydrateAllowlist,
    replaceAllowlist,
    allowedInstruments,
    loading,
    error,
    loaded,
    load,
    isAllowed,
    toggleAllowed,
    keyOf,
  }
})

/*
 * Hot-Reload: Ohne diese Zeile behält der Browser beim Speichern die alte
 * Fassung des Stores. Neue Methoden fehlen dann — der Aufruf läuft ins Leere
 * und man sucht den Fehler im eigenen Code, obwohl nur ein Neuladen fehlt.
 */
if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useInstrumentsStore, import.meta.hot))
}
