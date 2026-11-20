import { watch } from 'vue'
import { usePortfolioStore } from '@/stores/portfolio'
import { useTradePlanDraftStore } from '@/stores/tradePlanDraft'

/**
 * Hält den Rebalancing-Plan in Arbeit an Depot und Beständen: ein Depotwechsel
 * leert ihn, eine geänderte Stückzahl verwirft den Eintrag dieser Position.
 * Läuft in App.vue, damit es gleich ist, in welcher Ansicht der Wechsel oder die
 * Änderung geschieht.
 */
export function useTradePlanDraftSync(): void {
  const portfolioStore = usePortfolioStore()
  const draft = useTradePlanDraftStore()

  watch(
    () => portfolioStore.portfolio?.id ?? null,
    (id) => draft.useFor(id),
    { immediate: true },
  )
  watch(
    () =>
      Object.fromEntries(
        (portfolioStore.portfolio?.positions ?? []).map((position) => [
          position.id,
          position.units,
        ]),
      ),
    (units) => draft.dropStale(units),
    { deep: true },
  )
}
