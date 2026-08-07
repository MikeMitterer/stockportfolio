/**
 * Composable zum Laden und Cachen von Kursen.
 *
 * Kapselt Reactive-State, Fehlerbehandlung und Concurrency-Begrenzung.
 * Komponenten sehen kein `fetch` und keinen `ApiError`.
 */

import { ref, shallowRef, type Ref } from 'vue'
import { consola } from 'consola'
import { ApiError } from '@/api/errors'
import { toQuoteCacheEntry } from '@/api/mappers'
import type { StockInfoClient } from '@/api/client'
import { quoteKey } from '@/domain/rebalancing'
import type { Position, QuoteCacheEntry, QuoteMap } from '@/types/portfolio'

/** Maximale Anzahl gleichzeitiger Kursabfragen — schont die API. */
const MAX_CONCURRENT_REQUESTS = 6

/** Fehlgeschlagene Kursabfrage einer einzelnen Position. */
export interface QuoteFailure {
  key: string
  symbol: string
  reason: string
}

export interface UseQuotesReturn {
  quotes: Ref<QuoteMap>
  loading: Ref<boolean>
  failures: Ref<QuoteFailure[]>
  lastRefreshAt: Ref<string | null>
  loadQuotes: (positions: Position[]) => Promise<void>
  refreshOne: (position: Position) => Promise<void>
}

/**
 * @param client Injizierter API-Client (DI — in Tests durch Mock ersetzbar).
 */
export function useQuotes(client: StockInfoClient): UseQuotesReturn {
  const quotes = shallowRef<QuoteMap>(new Map())
  const loading = ref<boolean>(false)
  const failures = ref<QuoteFailure[]>([])
  const lastRefreshAt = ref<string | null>(null)

  /**
   * Lädt Kurse für alle kursrelevanten Positionen.
   * Cash wird übersprungen, Fehler einzelner Papiere brechen den Rest nicht ab.
   */
  async function loadQuotes(positions: Position[]): Promise<void> {
    const relevant = positions.filter(
      (position) => position.enabled && position.group !== 'cash',
    )
    if (relevant.length === 0) {
      quotes.value = new Map()
      lastRefreshAt.value = new Date().toISOString()
      return
    }

    loading.value = true
    failures.value = []

    try {
      const results = await mapWithConcurrency(
        relevant,
        MAX_CONCURRENT_REQUESTS,
        (position) => fetchOne(client, position),
      )

      const nextQuotes: QuoteMap = new Map()
      const nextFailures: QuoteFailure[] = []

      results.forEach((result) => {
        if (result.entry) {
          nextQuotes.set(result.key, result.entry)
        } else {
          nextFailures.push({
            key: result.key,
            symbol: result.symbol,
            reason: result.reason ?? 'Unbekannter Fehler',
          })
        }
      })

      quotes.value = nextQuotes
      failures.value = nextFailures
      lastRefreshAt.value = new Date().toISOString()

      if (nextFailures.length > 0) {
        consola.warn('useQuotes: Kurse teilweise nicht geladen', {
          failed: nextFailures.length,
          total: relevant.length,
        })
      }
    } finally {
      loading.value = false
    }
  }

  /** Lädt den Kurs einer einzelnen Position neu (Server-Refresh erzwungen). */
  async function refreshOne(position: Position): Promise<void> {
    if (position.group === 'cash') return

    const key = quoteKey(position)
    try {
      const response = position.isin
        ? await client.refreshByIsin(position.isin)
        : await client.getQuoteBySymbol(position.symbol)

      const next = new Map(quotes.value)
      next.set(key, toQuoteCacheEntry(response))
      quotes.value = next
      failures.value = failures.value.filter((failure) => failure.key !== key)
    } catch (error) {
      const reason = error instanceof ApiError ? error.detail : 'Unbekannter Fehler'
      consola.error('useQuotes: Einzel-Refresh fehlgeschlagen', {
        symbol: position.symbol,
        reason,
      })
      failures.value = [
        ...failures.value.filter((failure) => failure.key !== key),
        { key, symbol: position.symbol, reason },
      ]
    }
  }

  return { quotes, loading, failures, lastRefreshAt, loadQuotes, refreshOne }
}

interface FetchOutcome {
  key: string
  symbol: string
  entry: QuoteCacheEntry | null
  reason?: string
}

/** Holt den Kurs einer Position — ISIN bevorzugt, Symbol als Fallback. */
async function fetchOne(client: StockInfoClient, position: Position): Promise<FetchOutcome> {
  const key = quoteKey(position)
  try {
    const response = position.isin
      ? await client.getQuoteByIsin(position.isin)
      : await client.getQuoteBySymbol(position.symbol)
    return { key, symbol: position.symbol, entry: toQuoteCacheEntry(response) }
  } catch (error) {
    const reason = error instanceof ApiError ? error.detail : 'Unbekannter Fehler'
    return { key, symbol: position.symbol, entry: null, reason }
  }
}

/**
 * Führt `task` über alle `items` aus, aber höchstens `limit` gleichzeitig.
 * Wirft nie — Fehler müssen im Task selbst behandelt werden.
 *
 * @param items Eingabeliste.
 * @param limit Maximale Parallelität (>= 1).
 * @param task  Auszuführende Funktion je Element.
 * @returns Ergebnisse in der Reihenfolge der Eingabe.
 */
async function mapWithConcurrency<TItem, TResult>(
  items: TItem[],
  limit: number,
  task: (item: TItem) => Promise<TResult>,
): Promise<TResult[]> {
  const results = new Array<TResult>(items.length)
  let cursor = 0

  async function worker(): Promise<void> {
    while (cursor < items.length) {
      const index = cursor
      cursor += 1
      const item = items[index]
      if (item === undefined) continue
      results[index] = await task(item)
    }
  }

  const workerCount = Math.min(Math.max(limit, 1), items.length)
  await Promise.all(Array.from({ length: workerCount }, () => worker()))

  return results
}
