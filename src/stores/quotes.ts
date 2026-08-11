/**
 * Pinia-Store für Kurse.
 *
 * Hält den Kurs-Cache im Speicher, persistiert ihn nach IndexedDB und lädt
 * ihn beim Start zurück — dadurch zeigt die App sofort die zuletzt bekannten
 * Preise, statt auf das Netzwerk zu warten.
 */

import { acceptHMRUpdate, defineStore } from 'pinia'
import { ref, shallowRef } from 'vue'
import { consola } from 'consola'
import { ApiError } from '@/api/errors'
import { toQuoteCacheEntry } from '@/api/mappers'
import { QuoteCacheRepository } from '@/db/repository'
import { quoteKey } from '@/domain/rebalancing'
import type { StockInfoClient } from '@/api/client'
import type { Position, QuoteCacheEntry, QuoteMap } from '@/types/portfolio'

/** Maximale Anzahl gleichzeitiger Kursabfragen — schont die API. */
const MAX_CONCURRENT_REQUESTS = 6

/** Fehlgeschlagene Kursabfrage einer einzelnen Position. */
export interface QuoteFailure {
  key: string
  symbol: string
  reason: string
}

export const useQuotesStore = defineStore('quotes', () => {
  const repository = new QuoteCacheRepository()

  const quotes = shallowRef<QuoteMap>(new Map())
  const loading = ref<boolean>(false)
  const failures = ref<QuoteFailure[]>([])
  const lastRefreshAt = ref<string | null>(null)

  /** Lädt den persistierten Cache — zeigt sofort Werte, bevor das Netz antwortet. */
  async function hydrate(): Promise<void> {
    const cached = await repository.loadAll()
    if (cached.size === 0) return

    quotes.value = cached
    lastRefreshAt.value = newestFetchedAt(cached)
  }

  /**
   * Lädt Kurse für alle kursrelevanten Positionen.
   * Cash wird übersprungen; ein Fehlschlag bricht die übrigen nicht ab.
   */
  async function loadQuotes(client: StockInfoClient, positions: Position[]): Promise<void> {
    const relevant = positions.filter(
      (position) => position.enabled && position.group !== 'cash',
    )
    if (relevant.length === 0) {
      quotes.value = new Map()
      failures.value = []
      lastRefreshAt.value = new Date().toISOString()
      await repository.replaceAll(quotes.value)
      return
    }

    loading.value = true
    failures.value = []

    try {
      const results = await mapWithConcurrency(relevant, MAX_CONCURRENT_REQUESTS, (position) =>
        fetchOne(client, position),
      )

      const nextQuotes: QuoteMap = new Map()
      const nextFailures: QuoteFailure[] = []

      results.forEach((result) => {
        if (result.entry) {
          nextQuotes.set(result.key, result.entry)
        } else {
          // Alten Kurs behalten, damit ein Ausfall keine Lücke reißt.
          const previous = quotes.value.get(result.key)
          if (previous) nextQuotes.set(result.key, { ...previous, stale: true })
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
      await repository.replaceAll(nextQuotes)

      if (nextFailures.length > 0) {
        consola.warn('quotes: Kurse teilweise nicht geladen', {
          failed: nextFailures.length,
          total: relevant.length,
        })
      }
    } finally {
      loading.value = false
    }
  }

  /** Lädt den Kurs einer einzelnen Position neu (Server-Refresh erzwungen). */
  async function refreshOne(client: StockInfoClient, position: Position): Promise<void> {
    if (position.group === 'cash') return

    const key = quoteKey(position)
    try {
      const response = position.isin
        ? await client.refreshByIsin(position.isin)
        : await client.getQuoteBySymbol(position.symbol)

      const entry = toQuoteCacheEntry(response)
      const next = new Map(quotes.value)
      next.set(key, entry)
      quotes.value = next
      failures.value = failures.value.filter((failure) => failure.key !== key)
      await repository.put(key, entry)
    } catch (error) {
      const reason = error instanceof ApiError ? error.detail : 'Unbekannter Fehler'
      consola.error('quotes: Einzel-Refresh fehlgeschlagen', {
        symbol: position.symbol,
        reason,
      })
      failures.value = [
        ...failures.value.filter((failure) => failure.key !== key),
        { key, symbol: position.symbol, reason },
      ]
    }
  }

  return { quotes, loading, failures, lastRefreshAt, hydrate, loadQuotes, refreshOne }
})

/** Jüngster `fetchedAt`-Zeitstempel einer Cache-Map. */
function newestFetchedAt(quotes: QuoteMap): string | null {
  let newest: string | null = null
  for (const entry of quotes.values()) {
    if (!newest || entry.fetchedAt > newest) newest = entry.fetchedAt
  }
  return newest
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

/*
 * Hot-Reload: Ohne diese Zeile behält der Browser beim Speichern die alte
 * Fassung des Stores. Neue Methoden fehlen dann — der Aufruf läuft ins Leere
 * und man sucht den Fehler im eigenen Code, obwohl nur ein Neuladen fehlt.
 */
if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useQuotesStore, import.meta.hot))
}
