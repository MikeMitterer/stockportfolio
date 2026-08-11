/**
 * Pinia-Store für den Instrumenten-Katalog und die Auswahl-Whitelist.
 *
 * Der Katalog kommt aus der API und wird nicht persistiert (er ist
 * jederzeit neu abrufbar). Die Whitelist ist eine Nutzerentscheidung und
 * liegt in IndexedDB.
 */

import { acceptHMRUpdate, defineStore } from 'pinia'
import { computed, ref, shallowRef } from 'vue'
import { consola } from 'consola'
import { ApiError } from '@/api/errors'
import { cacheKeyOf } from '@/api/mappers'
import { AllowlistRepository } from '@/db/repository'
import type { StockInfoClient } from '@/api/client'
import type { InstrumentSummary } from '@/api/types'

export const useInstrumentsStore = defineStore('instruments', () => {
  const repository = new AllowlistRepository()

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
      const [catalogue, stored] = await Promise.all([
        client.getInstruments(),
        repository.loadAll(),
      ])
      instruments.value = catalogue
      allowlist.value = stored
      loaded.value = true
    } catch (cause) {
      error.value =
        cause instanceof ApiError ? cause.detail : 'Instrumente konnten nicht geladen werden'
      consola.error('instruments: Laden fehlgeschlagen', { reason: error.value })
    } finally {
      loading.value = false
    }
  }

  /** Schaltet die Freigabe eines Instruments um und persistiert sie. */
  async function toggleAllowed(instrument: InstrumentSummary): Promise<void> {
    const key = keyOf(instrument)
    const next = !isAllowed(instrument)

    const updated = new Map(allowlist.value)
    updated.set(key, next)
    allowlist.value = updated

    await repository.setEnabled(key, next)
  }

  return {
    instruments,
    allowlist,
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
