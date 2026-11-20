/**
 * Kursabfragen an StockInfo: welcher Endpunkt für eine Position gilt und wie
 * viele Abfragen gleichzeitig laufen dürfen.
 *
 * Getrennt vom Kurs-Store, der entscheidet, *wann* abgefragt wird und was mit
 * den Ergebnissen geschieht (T-133).
 */

import type { StockInfoClient } from './client'
import type { QuoteResponse } from './types'
import type { Position } from '@/types/portfolio'

/** Maximale Anzahl gleichzeitiger Kursabfragen — schont die API. */
export const MAX_CONCURRENT_REQUESTS = 6

/**
 * Wählt den Endpunkt für eine Position.
 *
 * Zwei Achsen: ISIN oder Symbol — und ob die TTL des Dienstes gilt. Ohne
 * `force` liefert er innerhalb von sechs Stunden den Kurs aus seinem eigenen
 * Speicher; mit `force` beschafft er ihn live.
 */
export function requestQuote(
  client: StockInfoClient,
  position: Pick<Position, 'isin' | 'symbol'>,
  force: boolean,
): Promise<QuoteResponse> {
  if (position.isin) {
    return force ? client.refreshByIsin(position.isin) : client.getQuoteByIsin(position.isin)
  }
  return force ? client.refreshBySymbol(position.symbol) : client.getQuoteBySymbol(position.symbol)
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
export async function mapWithConcurrency<TItem, TResult>(
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
