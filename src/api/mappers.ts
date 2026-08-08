/**
 * Übersetzt API-Antworten (snake_case) in Domain-Typen (camelCase).
 *
 * Diese Datei ist die Grenze zwischen API und Domain: alles, was nach
 * `src/domain/` und `src/components/` fließt, geht durch hier durch.
 */

import type { InstrumentSummary, QuoteResponse } from './types'
import type { QuoteCacheEntry } from '@/types/portfolio'

/** Mappt eine Kurs-Antwort auf den Domain-Cache-Eintrag. */
export function toQuoteCacheEntry(response: QuoteResponse): QuoteCacheEntry {
  return {
    isin: response.isin,
    symbol: response.symbol,
    price: response.price,
    currency: response.currency ?? 'EUR',
    type: response.type,
    volatility: response.volatility,
    name: response.name,
    ter: response.ter,
    accumulating: response.accumulating,
    fetchedAt: response.fetched_at,
    cached: response.cached,
    stale: response.stale,
  }
}

/**
 * Mappt einen Instruments-Katalog-Eintrag auf einen Cache-Eintrag.
 * Instrumente ohne `latest_price` liefern `null` — sie haben noch keinen Kurs.
 */
export function instrumentToQuoteCacheEntry(
  instrument: InstrumentSummary,
): QuoteCacheEntry | null {
  if (instrument.latest_price === null) return null

  return {
    isin: instrument.isin,
    symbol: instrument.symbol,
    price: instrument.latest_price,
    currency: instrument.latest_currency ?? instrument.currency ?? 'EUR',
    type: instrument.type,
    volatility: instrument.volatility,
    name: instrument.name,
    ter: instrument.ter,
    accumulating: instrument.accumulating,
    fetchedAt: instrument.latest_fetched_at ?? new Date().toISOString(),
    cached: true,
    stale: false,
  }
}

/** Cache-Key-Konvention der API-Ebene: ISIN bevorzugt, Symbol als Fallback. */
export function cacheKeyOf(entry: Pick<QuoteCacheEntry, 'isin' | 'symbol'>): string {
  return entry.isin ?? entry.symbol
}
