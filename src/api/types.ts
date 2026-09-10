/**
 * Geprüfte Client-Antworten gemäß StockInfo Core 4.3.0.
 * `isin` wird aus `identity` abgeleitet, nicht als API-Oberfeld erwartet.
 *
 * Feldnamen bleiben snake_case wie die API sie liefert — die Übersetzung
 * in Domain-Typen passiert ausschließlich in `mappers.ts`.
 */

import type { InstrumentIdentity } from '@/types/portfolio'
import type { DetailScalar } from '@/types/details'

export interface DetailValueResponse {
  value: DetailScalar | null
  unit: string | null
  currency: string | null
  origin: 'provider' | 'manual' | null
  source: string | null
  as_of: string | null
  shadowed: boolean
  manual_value: DetailScalar | null
  manual_currency: string | null
}

export interface DetailDefinitionResponse {
  name: string
  kind: 'number' | 'text' | 'boolean'
  unit: string | null
  label_en: string
  label_de: string
  overridable: boolean
  sources: string[]
  scopes: { source: string; instrument_types: string[]; identity_kinds: string[] }[]
  minimum: number | null
  maximum: number | null
  currency_required: boolean
}

/** Für die Detailanzeige benötigter Teil von GET /fields. */
export interface FieldsResponse {
  generation_id: string
  core_version: string
  details_version: number
  details: DetailDefinitionResponse[]
}

/** Zeitraum für History-Endpunkte. */
export type Period = '1w' | '1m' | '3m' | '1y' | 'max'

/** Instrument-Typ laut API (`stock | etf`). */
export type InstrumentType = 'stock' | 'etf'

/** Vollständige Kurs- und Metadaten-Antwort für ein Wertpapier. */
export interface QuoteResponse {
  details?: Record<string, DetailValueResponse> | null
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
  details?: Record<string, DetailValueResponse> | null
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
/** Devisenkurs gemäß StockInfo Core 4.3.0. */
export interface FxResponse {
  base: string
  quote: string
  rate: number
  quote_time: string
  fetched_at: string
  cached: boolean
  stale: boolean
  source: string | null
}
