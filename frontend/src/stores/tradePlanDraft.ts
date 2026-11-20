/**
 * Der Rebalancing-Plan in Arbeit: geplante Stückzahlen und probeweise Ziele.
 *
 * Lebt nur im Speicher dieses Tabs, nicht im Depot. Hier statt in der Ansicht,
 * damit ein Abstecher auf die Methodenseite (etwa über ein „?“ in der
 * Handelstabelle) die Eingaben nicht verwirft. Gültig bleibt er nur, solange
 * seine Grundlage gilt:
 *
 * - Er gehört zu genau einem Depot (`useFor`). App.vue meldet jeden
 *   Depotwechsel, gleich in welcher Ansicht er geschieht; die Abmeldung leert
 *   ihn über AuthRoot, ein Neuladen der Seite ohnehin.
 * - Je Position merkt er sich den Bestand beim ersten Eintrag. Ändert sich der
 *   Bestand danach (etwa im Dashboard), fällt der Eintrag dieser Position weg
 *   (`dropStale`, ebenfalls aus App.vue) — sonst rechnete die Simulation etwa
 *   einen Verkauf von fünf Stück gegen einen Bestand von zwei.
 *
 * Bewusst ohne Abhängigkeit zu anderen Stores: AuthRoot legt ihn schon vor der
 * Anmeldung an, wenn es noch keine privaten Depotdaten gibt.
 */
import { acceptHMRUpdate, defineStore } from 'pinia'
import { ref } from 'vue'
import type { TargetMap, TradeMap } from '@/domain/tradePlan'

/** Bestand je Positions-ID, wie ihn das gewählte Depot gerade führt. */
export type UnitsById = Record<string, number>

export const useTradePlanDraftStore = defineStore('tradePlanDraft', () => {
  const trades = ref<TradeMap>({})
  const targets = ref<TargetMap>({})
  /** Bestand je Position beim ersten Eintrag in den Plan. */
  const basis = ref<UnitsById>({})
  const portfolioId = ref<string | null>(null)

  /** Bindet den Plan an ein Depot; gehörte er zu einem anderen, beginnt er leer. */
  function useFor(id: string | null): void {
    if (portfolioId.value === id) return
    portfolioId.value = id
    clear()
  }

  function remember(positionId: string, currentUnits: number): void {
    if (positionId in basis.value) return
    basis.value = { ...basis.value, [positionId]: currentUnits }
  }

  /** Plant eine Stückzahl; `currentUnits` ist der Bestand der Position jetzt. */
  function setTrade(positionId: string, units: number, currentUnits: number): void {
    remember(positionId, currentUnits)
    trades.value = { ...trades.value, [positionId]: units }
  }

  /** Setzt ein Probeziel; `currentUnits` ist der Bestand der Position jetzt. */
  function setTarget(positionId: string, targetPercent: number, currentUnits: number): void {
    remember(positionId, currentUnits)
    targets.value = { ...targets.value, [positionId]: targetPercent }
  }

  function clear(): void {
    trades.value = {}
    targets.value = {}
    basis.value = {}
  }

  /** Entfernt die Einträge der Positionen, deren Bestand nicht mehr dem beim Eintrag entspricht. */
  function dropStale(current: UnitsById): void {
    const stale = Object.keys(basis.value).filter((id) => current[id] !== basis.value[id])
    if (stale.length === 0) return
    const keep = <T>(entries: Record<string, T>) =>
      Object.fromEntries(Object.entries(entries).filter(([id]) => !stale.includes(id)))
    trades.value = keep(trades.value)
    targets.value = keep(targets.value)
    basis.value = keep(basis.value)
  }

  return { trades, targets, portfolioId, useFor, setTrade, setTarget, clear, dropStale }
})

if (import.meta.hot) import.meta.hot.accept(acceptHMRUpdate(useTradePlanDraftStore, import.meta.hot))
