/**
 * Neue Position aus dem StockInfo-Katalog: Dialog öffnen, Instrument prüfen,
 * Position anlegen (aus `DashboardView.vue` herausgelöst, T-131).
 */
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { StockInfoClient } from '@/api/stockinfo/client'
import type { InstrumentSummary } from '@/api/stockinfo/types'
import { newId } from '@/db/seed'
import { useInstrumentsStore } from '@/stores/instruments'
import { usePortfolioStore } from '@/stores/portfolio'
import { useQuotesStore } from '@/stores/quotes'
import type { AssetGroup } from '@/types/portfolio'

export function useAddPosition(client: StockInfoClient | undefined) {
  const { t } = useI18n()
  const portfolioStore = usePortfolioStore()
  const quotesStore = useQuotesStore()
  const instrumentsStore = useInstrumentsStore()

  const showAddDialog = ref<boolean>(false)

  /** Schlüssel der bereits enthaltenen Papiere — verhindert Dubletten. */
  const existingKeys = computed(() =>
    portfolioStore.positions
      .filter((position) => position.group !== 'cash')
      .map((position) => position.isin ?? position.symbol),
  )

  /** Noch nicht vergebener Ziel-Anteil. */
  const remainingTargetPercent = computed(() => {
    const assigned = portfolioStore.positions.reduce(
      (sum, position) => sum + position.targetPercent,
      0,
    )
    return Math.max(0, 100 - assigned)
  })

  async function openAddDialog(): Promise<void> {
    showAddDialog.value = true
    if (!instrumentsStore.loaded && client) await instrumentsStore.load(client)
  }

  async function validateNewInstrument(instrument: InstrumentSummary): Promise<void> {
    if (!client) throw new Error(t('notify.noClient'))
    await quotesStore.loadOne(client, instrument)
  }

  async function onAddPosition(payload: {
    instrument: InstrumentSummary
    units: number
    targetPercent: number
    group: AssetGroup
  }): Promise<void> {
    const { instrument, units, targetPercent, group } = payload

    await portfolioStore.addPosition({
      id: newId(),
      isin: instrument.isin,
      symbol: instrument.symbol,
      // Gattung mitschreiben — sie entscheidet später über die externen Verweise.
      kind: quotesStore.quotes.get(instrument.isin ?? instrument.symbol)?.type ?? instrument.type,
      displayName: instrument.name ?? instrument.symbol,
      group,
      units,
      targetPercent,
      enabled: true,
    })
  }

  return {
    showAddDialog,
    existingKeys,
    remainingTargetPercent,
    openAddDialog,
    validateNewInstrument,
    onAddPosition,
  }
}
