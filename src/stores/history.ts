/**
 * Pinia-Store für den Kursverlauf.
 *
 * Holt Tagesschlusskurse und legt sie in IndexedDB ab. Der Verlauf ändert
 * sich einmal täglich — ohne Zwischenspeicher liefe bei jedem Seitenaufbau
 * eine Anfrage je Position, für Zahlen, die sich seit gestern nicht bewegt
 * haben.
 *
 * Geladen wird nur auf Anforderung: Die Zeile fragt ihren kurzen Verlauf an,
 * die Detailansicht ihren langen. Alles im Voraus zu holen hieße, Anfragen
 * für Ansichten zu stellen, die niemand öffnet.
 */

import { acceptHMRUpdate, defineStore } from 'pinia'
import { ref } from 'vue'
import { consola } from 'consola'
import { ApiError } from '@/api/errors'
import { HistoryRepository } from '@/db/repository'
import type { StockInfoClient } from '@/api/client'
import type { Period } from '@/api/types'
import type { HistoryPoint } from '@/domain/sparkline'
import type { Position } from '@/types/portfolio'

/** Zustand einer Verlaufsabfrage. */
export interface HistorySeries {
  points: HistoryPoint[]
  loading: boolean
  /** Grund, falls nichts geladen werden konnte. */
  error: string | null
  fetchedAt: string | null
}

const EMPTY: HistorySeries = { points: [], loading: false, error: null, fetchedAt: null }

/** Schlüssel im Zwischenspeicher — Papier und Zeitraum. */
export function historyKey(position: Position, period: Period): string {
  return `${position.isin ?? position.symbol}::${period}`
}

/**
 * Ist der gespeicherte Verlauf von heute?
 *
 * Tagesschlusskurse ändern sich einmal täglich; ein Datumsvergleich genügt
 * und erspart eine Alters-Regel, die niemand einstellen will.
 */
export function isFromToday(fetchedAt: string, now: Date): boolean {
  return fetchedAt.slice(0, 10) === now.toISOString().slice(0, 10)
}

export const useHistoryStore = defineStore('history', () => {
  const repository = new HistoryRepository()

  const series = ref<Map<string, HistorySeries>>(new Map())

  /** Verlauf zu einer Position und einem Zeitraum; nie `undefined`. */
  function get(position: Position, period: Period): HistorySeries {
    return series.value.get(historyKey(position, period)) ?? EMPTY
  }

  function set(key: string, value: HistorySeries): void {
    const next = new Map(series.value)
    next.set(key, value)
    series.value = next
  }

  /**
   * Stellt sicher, dass der Verlauf vorliegt.
   *
   * Reihenfolge: was schon im Speicher liegt, dann der Zwischenspeicher aus
   * IndexedDB, erst zuletzt die API.
   *
   * @param client   API-Client.
   * @param position Position, deren Verlauf gebraucht wird.
   * @param period   Zeitraum.
   */
  async function ensure(
    client: StockInfoClient | null,
    position: Position,
    period: Period,
  ): Promise<void> {
    // Cash hat keinen Kurs und damit keinen Verlauf.
    if (position.group === 'cash') return

    const key = historyKey(position, period)
    const current = series.value.get(key)
    if (current?.loading) return
    if (current && current.points.length > 0 && current.fetchedAt) {
      if (isFromToday(current.fetchedAt, new Date())) return
    }

    const stored = await repository.load(key)
    if (stored && isFromToday(stored.fetchedAt, new Date())) {
      set(key, {
        points: stored.points,
        loading: false,
        error: null,
        fetchedAt: stored.fetchedAt,
      })
      return
    }

    if (!client) return

    set(key, { points: stored?.points ?? [], loading: true, error: null, fetchedAt: null })

    try {
      // ISIN wenn vorhanden, sonst das Symbol — manche Papiere haben keine.
      const raw = position.isin
        ? await client.getDailyHistory(position.isin, period)
        : await client.getDailyHistoryBySymbol(position.symbol, period)

      const points: HistoryPoint[] = raw
        .filter((point) => Number.isFinite(point.close))
        .map((point) => ({ date: point.date, close: point.close }))

      const fetchedAt = new Date().toISOString()
      set(key, { points, loading: false, error: null, fetchedAt })
      await repository.put({
        key,
        isin: position.isin ?? position.symbol,
        period,
        points,
        fetchedAt,
      })
    } catch (cause) {
      const reason =
        cause instanceof ApiError ? cause.detail : 'Kursverlauf konnte nicht geladen werden'
      // Ein fehlender Verlauf ist kein Drama — die Zeile zeigt dann eben keine
      // Linie. Deshalb nur ins Protokoll, keine Meldung an den Nutzer.
      consola.warn('history: Laden fehlgeschlagen', { key, reason })
      set(key, {
        points: stored?.points ?? [],
        loading: false,
        error: reason,
        fetchedAt: stored?.fetchedAt ?? null,
      })
    }
  }

  /** Verwirft alles — für „Kurse neu laden". */
  async function clear(): Promise<void> {
    series.value = new Map()
    await repository.clear()
  }

  return { series, get, ensure, clear }
})

/*
 * Hot-Reload: Ohne diese Zeile behält der Browser beim Speichern die alte
 * Fassung des Stores. Neue Methoden fehlen dann — der Aufruf läuft ins Leere
 * und man sucht den Fehler im eigenen Code, obwohl nur ein Neuladen fehlt.
 */
if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useHistoryStore, import.meta.hot))
}
