/** StockInfo hält den dauerhaften FX-Cache; hier liegen die benötigten Sitzungskurse. */
import { acceptHMRUpdate, defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { describeFailure } from '@/api/errors'
import { toFxRate } from '@/api/mappers'
import { fxKey } from '@/domain/fx'
import type { StockInfoClient } from '@/api/client'
import type { FxRate } from '@/types/fx'

export const useFxStore = defineStore('fx', () => {
  const rates = ref(new Map<string, FxRate>())
  const errors = ref(new Map<string, string>())
  const apiUrl = ref<string | null>(null)
  const pendingCount = ref(0)
  const loading = computed(() => pendingCount.value > 0)
  const pending = new Map<string, Promise<void>>()
  let generation = 0

  function load(client: StockInfoClient, base: string, quote: string): Promise<void> {
    if (apiUrl.value !== client.url) {
      generation++
      apiUrl.value = client.url
      rates.value.clear()
      errors.value.clear()
      pending.clear()
      pendingCount.value = 0
    }
    if (base === quote) return Promise.resolve()
    const key = fxKey(base, quote)
    const existing = pending.get(key)
    if (existing) return existing
    const current = generation
    pendingCount.value++
    const request = (async () => {
      try {
        const response = await client.getFx(base, quote)
        if (current !== generation) return
        rates.value.set(key, toFxRate(response))
        errors.value.delete(key)
      } catch (cause) {
        if (current !== generation) return
        errors.value.set(key, describeFailure(cause))
        const previous = rates.value.get(key)
        if (previous) rates.value.set(key, { ...previous, stale: true, cached: true })
      } finally {
        if (current === generation) {
          pending.delete(key)
          pendingCount.value--
        }
      }
    })()
    pending.set(key, request)
    return request
  }

  return { rates, errors, apiUrl, loading, load }
})

if (import.meta.hot) import.meta.hot.accept(acceptHMRUpdate(useFxStore, import.meta.hot))
