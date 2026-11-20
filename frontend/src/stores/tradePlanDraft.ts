/**
 * Der Rebalancing-Plan in Arbeit: geplante Stückzahlen und probeweise Ziele.
 *
 * Lebt nur im Speicher dieses Tabs, nicht im Depot. Hier statt in der Ansicht,
 * damit ein Abstecher auf die Methodenseite (etwa über ein „?“ in der
 * Handelstabelle) die Eingaben nicht verwirft. Gehört zu genau einem Depot;
 * ein anderes Depot beginnt mit einem leeren Plan. Die Abmeldung leert ihn
 * (AuthRoot), ein Neuladen der Seite ebenso.
 */
import { acceptHMRUpdate, defineStore } from 'pinia'
import { ref } from 'vue'
import type { TargetMap, TradeMap } from '@/domain/tradePlan'

export const useTradePlanDraftStore = defineStore('tradePlanDraft', () => {
  const trades = ref<TradeMap>({})
  const targets = ref<TargetMap>({})
  const portfolioId = ref<string | null>(null)

  /** Bindet den Plan an ein Depot; gehörte er zu einem anderen, beginnt er leer. */
  function useFor(id: string | null): void {
    if (portfolioId.value === id) return
    portfolioId.value = id
    clear()
  }

  function setTrade(positionId: string, units: number): void {
    trades.value = { ...trades.value, [positionId]: units }
  }

  function setTarget(positionId: string, targetPercent: number): void {
    targets.value = { ...targets.value, [positionId]: targetPercent }
  }

  function clear(): void {
    trades.value = {}
    targets.value = {}
  }

  return { trades, targets, portfolioId, useFor, setTrade, setTarget, clear }
})

if (import.meta.hot) import.meta.hot.accept(acceptHMRUpdate(useTradePlanDraftStore, import.meta.hot))
