/**
 * Wertverlauf des Depots — Schnappschüsse und Rückblick.
 *
 * Zwei Quellen mit unterschiedlicher Verlässlichkeit, deshalb getrennt
 * gehalten: Der **Rückblick** rechnet den heutigen Bestand gegen alte Kurse
 * und ist damit eine Annahme; die **Schnappschüsse** halten fest, was
 * tatsächlich dastand, beginnen aber leer.
 *
 * Geschrieben wird höchstens einmal je Tag und Depot. Öfter brächte nichts —
 * der Verlauf hat die Auflösung eines Tages, weil die Kurse sie haben.
 */

import { acceptHMRUpdate, defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { consola } from 'consola'
import { ValueSnapshotRepository } from '@/db/repository'
import {
  buildBacktest,
  snapshotPoints,
  truthStart,
  type BacktestInput,
  type ValueSnapshot,
} from '@/domain/portfolioHistory'
import type { HistoryPoint } from '@/domain/sparkline'

/** Tagesdatum als `YYYY-MM-DD` in der Zeitzone des Rechners. */
export function isoDay(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

export const useValueHistoryStore = defineStore('valueHistory', () => {
  const repository = new ValueSnapshotRepository()

  const snapshots = ref<ValueSnapshot[]>([])
  const backtest = ref<HistoryPoint[]>([])
  const loaded = ref<boolean>(false)

  /** Ab wann die Angabe echt ist — davor ist sie gerechnet. */
  const truthFrom = computed(() => truthStart(snapshots.value))

  const snapshotLine = computed(() => snapshotPoints(snapshots.value))

  /** Lädt die Tageswerte eines Depots. */
  async function load(portfolioId: string): Promise<void> {
    if (!portfolioId) return

    const entries = await repository.findByPortfolio(portfolioId)
    snapshots.value = entries.map((entry) => ({ date: entry.date, total: entry.total }))
    loaded.value = true
  }

  /**
   * Hält den heutigen Gesamtwert fest.
   *
   * Nur wenn er sinnvoll ist: Ohne geladene Kurse steht dort eine 0, und die
   * wäre als Tageswert schlicht falsch.
   *
   * @param portfolioId Depot.
   * @param total       Gesamtwert in der Basiswährung.
   * @param now         Gegenwart — als Parameter, damit es prüfbar bleibt.
   */
  async function record(portfolioId: string, total: number, now = new Date()): Promise<void> {
    if (!portfolioId || total <= 0) return

    const date = isoDay(now)
    try {
      await repository.put(portfolioId, date, total)
      const others = snapshots.value.filter((entry) => entry.date !== date)
      snapshots.value = [...others, { date, total }].sort((a, b) => a.date.localeCompare(b.date))
    } catch (cause) {
      // Ein fehlender Tageswert ist kein Drama — die Kurve hat dann eine Lücke.
      consola.warn('valueHistory: Tageswert nicht gespeichert', { date, cause })
    }
  }

  /** Rechnet den Rückblick neu; `inputs` kommen aus dem Dashboard. */
  function computeBacktest(inputs: BacktestInput[]): void {
    backtest.value = buildBacktest(inputs)
  }

  /**
   * Ersetzt die Tageswerte eines Depots — beim Einspielen einer Sicherung.
   *
   * Erst löschen, dann schreiben: Ein Zusammenführen mit dem, was gerade da
   * ist, ergäbe eine Kurve aus zwei Depots.
   */
  async function replaceAll(portfolioId: string, entries: ValueSnapshot[]): Promise<void> {
    if (!portfolioId) return

    await repository.clearPortfolio(portfolioId)
    for (const entry of entries) {
      await repository.put(portfolioId, entry.date, entry.total)
    }
    snapshots.value = [...entries].sort((a, b) => a.date.localeCompare(b.date))
  }

  /** Verwirft die Tageswerte eines gelöschten Depots. */
  async function forget(portfolioId: string): Promise<void> {
    await repository.clearPortfolio(portfolioId)
    snapshots.value = []
  }

  return {
    snapshots,
    snapshotLine,
    backtest,
    loaded,
    truthFrom,
    load,
    record,
    computeBacktest,
    replaceAll,
    forget,
  }
})

/*
 * Hot-Reload: Ohne diese Zeile behält der Browser beim Speichern die alte
 * Fassung des Stores.
 */
if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useValueHistoryStore, import.meta.hot))
}
