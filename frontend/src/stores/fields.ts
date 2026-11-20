/** Felddefinitionen gehören zur Sitzung und zur jeweiligen API-Adresse. */
import { acceptHMRUpdate, defineStore } from 'pinia'
import { toFieldCatalog } from '@/api/stockinfo/mappers'
import { useSessionCatalog } from '@/stores/sessionCatalog'

export const useFieldsStore = defineStore('fields', () =>
  useSessionCatalog(async (client) => toFieldCatalog(await client.getFields()), {
    keepWhileReloading: true,
  }),
)

if (import.meta.hot) import.meta.hot.accept(acceptHMRUpdate(useFieldsStore, import.meta.hot))
