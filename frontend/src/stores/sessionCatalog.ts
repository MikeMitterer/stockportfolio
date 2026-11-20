/**
 * Gemeinsamer Ladeablauf für StockInfo-Kataloge, die zur Sitzung und zur
 * jeweiligen API-Adresse gehören (Felddefinitionen, Instrumenttypen; T-128).
 * Läuft innerhalb einer Store-Definition und liefert deren Zustand samt `load`.
 */
import { ref, shallowRef, type Ref, type ShallowRef } from 'vue'
import { describeFailure } from '@/api/stockinfo/errors'
import type { StockInfoClient } from '@/api/stockinfo/client'

export interface SessionCatalogOptions {
  /** Bisherigen Katalog beim Neuladen von derselben Adresse stehen lassen statt leeren. */
  keepWhileReloading: boolean
}

export interface SessionCatalog<T> {
  catalog: ShallowRef<T | null>
  apiBaseUrl: Ref<string | null>
  error: Ref<string | null>
  loading: Ref<boolean>
  load: (client: StockInfoClient) => Promise<void>
}

export function useSessionCatalog<T>(
  fetchCatalog: (client: StockInfoClient) => Promise<T>,
  options: SessionCatalogOptions,
): SessionCatalog<T> {
  const catalog = shallowRef<T | null>(null)
  const apiBaseUrl = ref<string | null>(null)
  const error = ref<string | null>(null)
  const loading = ref(false)
  let sequence = 0
  let pending: { url: string; promise: Promise<void> } | null = null

  /** Pro Öffnen neu laden; gleichzeitig geöffnete Ansichten teilen den Abruf. */
  function load(client: StockInfoClient): Promise<void> {
    if (pending?.url === client.url) return pending.promise
    const current = ++sequence
    if (!options.keepWhileReloading || apiBaseUrl.value !== client.url) catalog.value = null
    apiBaseUrl.value = client.url
    loading.value = true
    error.value = null
    const promise = (async () => {
      try {
        const loaded = await fetchCatalog(client)
        if (current === sequence) catalog.value = loaded
      } catch (cause) {
        if (current === sequence) {
          catalog.value = null
          error.value = describeFailure(cause)
        }
      } finally {
        if (current === sequence) {
          loading.value = false
          pending = null
        }
      }
    })()
    pending = { url: client.url, promise }
    return promise
  }

  return { catalog, apiBaseUrl, error, loading, load }
}
