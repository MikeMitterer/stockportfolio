/** Felddefinitionen gehören zur Sitzung und zur jeweiligen API-Adresse. */
import { acceptHMRUpdate, defineStore } from 'pinia'
import { ref, shallowRef } from 'vue'
import { describeFailure } from '@/api/errors'
import { toFieldCatalog } from '@/api/mappers'
import type { StockInfoClient } from '@/api/client'
import type { FieldCatalog } from '@/types/details'

export const useFieldsStore = defineStore('fields', () => {
  const catalog = shallowRef<FieldCatalog | null>(null)
  const apiBaseUrl = ref<string | null>(null)
  const error = ref<string | null>(null)
  const loading = ref(false)
  let sequence = 0
  let pending: { url: string; promise: Promise<void> } | null = null

  /** Pro Öffnen neu laden; gleichzeitig geöffnete Ansichten teilen den Abruf. */
  function load(client: StockInfoClient): Promise<void> {
    if (pending?.url === client.url) return pending.promise
    const current = ++sequence
    if (apiBaseUrl.value !== client.url) catalog.value = null
    apiBaseUrl.value = client.url
    loading.value = true
    error.value = null
    const promise = (async () => {
      try {
        const response = await client.getFields()
        if (current === sequence) catalog.value = toFieldCatalog(response)
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
})

if (import.meta.hot) import.meta.hot.accept(acceptHMRUpdate(useFieldsStore, import.meta.hot))
