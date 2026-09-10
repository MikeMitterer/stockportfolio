/**
 * Geprüfte Client-Antworten gemäß StockInfo Core 4.3.0.
 * `isin` wird aus `identity` abgeleitet, nicht als API-Oberfeld erwartet.
 *
 * Feldnamen bleiben snake_case wie die API sie liefert — die Übersetzung
 * in Domain-Typen passiert ausschließlich in `mappers.ts`.
 */

import type { InstrumentIdentity } from '@/types/portfolio'

/** Zeitraum für History-Endpunkte. */
export type Period = '1w' | '1m' | '3m' | '1y' | 'max'

/** Instrument-Typ laut API (`stock | etf`). */
export type InstrumentType = 'stock' | 'etf'

/** Vollständige Kurs- und Metadaten-Antwort für ein Wertpapier. */
export interface QuoteResponse {
  identity: InstrumentIdentity
  isin: string | null
  symbol: string
  exchange: string | null
  name: string
  type: string
  currency: string
  price: number
  quote_time: string
  volume: number | null
  ter: number | null
  provider: string | null
  replication: string | null
  fund_size: number | null
  volatility: number | null
  accumulating: boolean | null
  source: string | null
  cached: boolean
  stale: boolean
  fetched_at: string
}

/** Eintrag aus `GET /instruments` — Katalog aller bekannten Papiere. */
export interface InstrumentSummary {
  identity: InstrumentIdentity
  listing_id: string
  manual_fields: string[]
  shadowed_fields: string[]
  isin: string | null
  symbol: string
  exchange: string | null
  name: string | null
  type: string | null
  currency: string | null
  provider: string | null
  ter: number | null
  replication: string | null
  fund_size: number | null
  volatility: number | null
  accumulating: boolean | null
  meta_fetched_at: string | null
  latest_price: number | null
  latest_quote_time: string | null
  latest_currency: string | null
  latest_fetched_at: string | null
  history_count: number
}

/** Tages-Schlusskurs (EOD). */
export interface DailyPoint {
  date: string
  close: number
  currency: string | null
}

/** Einzelner Kurspunkt aus der Intraday-History. */
export interface QuotePoint {
  price: number
  quote_time: string
  volume: number | null
  currency: string | null
  fetched_at: string
}

/** Antwort von `GET /health`. */
export interface HealthResponse {
  status: string
  version: string
}

/** Antwort von `POST /refresh` (alle Instrumente). */
export interface RefreshResult {
  total: number
  refreshed: number
}
