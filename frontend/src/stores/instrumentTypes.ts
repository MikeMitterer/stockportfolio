/** Typdeklarationen gehören zur Sitzung und zur jeweiligen API-Adresse. */
import { acceptHMRUpdate, defineStore } from 'pinia'
import { toInstrumentTypeCatalog } from '@/api/stockinfo/mappers'
import { useSessionCatalog } from '@/stores/sessionCatalog'

export const useInstrumentTypesStore = defineStore('instrumentTypes', () =>
  useSessionCatalog(async (client) => toInstrumentTypeCatalog(await client.getInstrumentTypes()), {
    keepWhileReloading: false,
  }),
)

if (import.meta.hot)
  import.meta.hot.accept(acceptHMRUpdate(useInstrumentTypesStore, import.meta.hot))
