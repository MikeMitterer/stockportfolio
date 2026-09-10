/** Gemeinsame Laufzeitprüfung für Quote, Refresh und Instrumentkatalog. */
import { ApiError } from './errors'
import { translate } from '@/i18n'
import type { DetailDefinitionResponse, DetailValueResponse, FieldsResponse, FxResponse, InstrumentSummary, QuoteResponse } from './types'
import type { DetailScalar } from '@/types/details'
import type { InstrumentIdentity } from '@/types/portfolio'

const currencies = new Set<string>(Intl.supportedValuesOf('currency'))

/** Das Antwortpaar muss genau zur angefragten Umrechnung gehören. */
export function normalizeFx(input: unknown, base: string, quote: string, url: string): FxResponse {
  const data = object(input, 'fx', url)
  if (!currencies.has(base) || !currencies.has(quote) || data.base !== base || data.quote !== quote) invalid('fx.base/quote', url)
  const rate = finiteNumber(data.rate, 'fx.rate', url)
  if (rate <= 0) invalid('fx.rate', url)
  const cached = boolean(data.cached, 'fx.cached', url)
  const stale = boolean(data.stale, 'fx.stale', url)
  if (stale && !cached) invalid('fx.stale/cached', url)
  return { base, quote, rate, cached, stale, source: optionalText(data.source),
    quote_time: timestamp(data.quote_time, 'fx.quote_time', url), fetched_at: timestamp(data.fetched_at, 'fx.fetched_at', url) }
}

function invalid(field: string, url: string): never {
  throw new ApiError(200, translate('errors.invalidResponse', { field }), url)
}

function object(value: unknown, field: string, url: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) invalid(field, url)
  return value as Record<string, unknown>
}

function text(value: unknown, field: string, url: string): string {
  if (typeof value !== 'string' || !value.trim()) invalid(field, url)
  return value
}

function finiteNumber(value: unknown, field: string, url: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) invalid(field, url)
  return value
}

function boolean(value: unknown, field: string, url: string): boolean {
  if (typeof value !== 'boolean') invalid(field, url)
  return value
}

function timestamp(value: unknown, field: string, url: string): string {
  const result = text(value, field, url)
  if (!/T.*(?:Z|[+-]\d{2}:\d{2})$/.test(result) || !Number.isFinite(Date.parse(result))) invalid(field, url)
  return result
}

/** ISO-Währung prüfen; Pence sind ausdrücklich eine eigene Notierungseinheit. */
export function requireCurrency(value: unknown, field: string, url: string): string {
  if (typeof value !== 'string' || (value !== 'GBp' && !currencies.has(value))) invalid(field, url)
  return value
}

function identityOf(value: unknown, url: string): InstrumentIdentity {
  const data = object(value, 'identity', url)
  switch (data.kind) {
    case 'listed': {
      const identity: InstrumentIdentity = {
        kind: 'listed',
        ticker: text(data.ticker, 'identity.ticker', url),
        mic: text(data.mic, 'identity.mic', url),
      }
      if (data.isin !== undefined) identity.isin = data.isin === null ? null : text(data.isin, 'identity.isin', url)
      return identity
    }
    case 'pair':
      return {
        kind: 'pair',
        base: text(data.base, 'identity.base', url),
        quote_currency: requireCurrency(data.quote_currency, 'identity.quote_currency', url),
      }
    case 'isin_only':
      return { kind: 'isin_only', isin: text(data.isin, 'identity.isin', url) }
    default:
      throw new ApiError(200, translate('errors.unsupportedIdentity', { kind: String(data.kind) }), url)
  }
}

/** Optionale Metadaten dürfen fehlen; falsch typisierte Werte werden nicht gerechnet. */
function optionalNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function optionalText(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value : null
}

function metadata(data: Record<string, unknown>, url: string) {
  const identity = identityOf(data.identity, url)
  return {
    identity,
    details: normalizeDetails(data.details),
    isin: identity.kind === 'pair' ? null : identity.isin ?? null,
    symbol: text(data.symbol, 'symbol', url),
    name: text(data.name, 'name', url),
    type: text(data.type, 'type', url),
    exchange: optionalText(data.exchange),
    source: optionalText(data.source),
    provider: optionalText(data.provider),
    replication: optionalText(data.replication),
    fund_size: optionalNumber(data.fund_size),
    ter: optionalNumber(data.ter),
    volatility: optionalNumber(data.volatility),
    accumulating: typeof data.accumulating === 'boolean' ? data.accumulating : null,
  }
}

export function normalizeQuote(input: unknown, url: string): QuoteResponse {
  const data = object(input, 'response', url)
  const cached = boolean(data.cached, 'cached', url)
  const stale = boolean(data.stale, 'stale', url)
  if (stale && !cached) invalid('stale/cached', url)
  return {
    ...metadata(data, url),
    price: finiteNumber(data.price, 'price', url),
    currency: requireCurrency(data.currency, 'currency', url),
    quote_time: timestamp(data.quote_time, 'quote_time', url),
    fetched_at: timestamp(data.fetched_at, 'fetched_at', url),
    cached,
    stale,
    volume: optionalNumber(data.volume),
  }
}

function stringList(value: unknown, field: string, url: string): string[] {
  if (!Array.isArray(value) || !value.every((item): item is string => typeof item === 'string')) invalid(field, url)
  return value
}

function normalizeInstrument(input: unknown, url: string): InstrumentSummary {
  const data = object(input, 'instrument', url)
  const price = data.latest_price == null ? null : finiteNumber(data.latest_price, 'latest_price', url)
  const historyCount = finiteNumber(data.history_count, 'history_count', url)
  if (!Number.isInteger(historyCount) || historyCount < 0) invalid('history_count', url)
  return {
    ...metadata(data, url),
    listing_id: text(data.listing_id, 'listing_id', url),
    manual_fields: stringList(data.manual_fields, 'manual_fields', url),
    shadowed_fields: stringList(data.shadowed_fields, 'shadowed_fields', url),
    history_count: historyCount,
    currency: optionalText(data.currency),
    latest_price: price,
    latest_currency: price === null ? optionalText(data.latest_currency) : requireCurrency(data.latest_currency, 'latest_currency', url),
    latest_quote_time: data.latest_quote_time == null ? null : timestamp(data.latest_quote_time, 'latest_quote_time', url),
    latest_fetched_at: data.latest_fetched_at == null ? null : timestamp(data.latest_fetched_at, 'latest_fetched_at', url),
    meta_fetched_at: data.meta_fetched_at == null ? null : timestamp(data.meta_fetched_at, 'meta_fetched_at', url),
  }
}

export function normalizeInstruments(input: unknown, url: string): InstrumentSummary[] {
  if (!Array.isArray(input)) invalid('instruments', url)
  return input.map((entry) => normalizeInstrument(entry, url))
}

function isScalar(value: unknown): value is DetailScalar | null {
  return value === null || typeof value === 'string' || typeof value === 'boolean'
    || (typeof value === 'number' && Number.isFinite(value))
}

function optionalCurrency(value: unknown): string | null {
  return typeof value === 'string' && (value === 'GBp' || currencies.has(value)) ? value : null
}

/** Zusatzwerte dürfen den bereits geprüften Kern nicht unbrauchbar machen. */
function normalizeDetails(input: unknown): Record<string, DetailValueResponse> | null {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return null
  const entries: [string, DetailValueResponse][] = []
  for (const [key, raw] of Object.entries(input)) {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw) || !('value' in raw) || !isScalar(raw.value)) continue
    const data = raw as Record<string, unknown>
    entries.push([key, {
      value: raw.value,
      unit: optionalText(data.unit), currency: optionalCurrency(data.currency),
      origin: data.origin === 'provider' || data.origin === 'manual' ? data.origin : null,
      source: optionalText(data.source), as_of: optionalText(data.as_of),
      shadowed: data.shadowed === true,
      manual_value: isScalar(data.manual_value) ? data.manual_value : null,
      manual_currency: optionalCurrency(data.manual_currency),
    }])
  }
  return Object.fromEntries(entries)
}

/** Unbekannte oder ungültige Detaildefinitionen betreffen nur dieses Zusatzfeld. */
function normalizeDefinition(input: unknown, url: string): DetailDefinitionResponse | null {
  try {
    const data = object(input, 'details.definition', url)
    if (data.kind !== 'number' && data.kind !== 'text' && data.kind !== 'boolean') return null
    if (data.currency_required !== undefined && typeof data.currency_required !== 'boolean') return null
    if (data.unit != null && typeof data.unit !== 'string') return null
    if (!Array.isArray(data.scopes)) return null
    return {
      name: text(data.name, 'details.name', url), kind: data.kind,
      unit: optionalText(data.unit), label_en: optionalText(data.label_en) ?? '', label_de: optionalText(data.label_de) ?? '',
      overridable: data.overridable === true,
      currency_required: data.currency_required === true,
      sources: stringList(data.sources, 'details.sources', url),
      minimum: optionalNumber(data.minimum), maximum: optionalNumber(data.maximum),
      scopes: data.scopes.map(inputScope => {
        const scope = object(inputScope, 'details.scopes', url)
        return {
          source: text(scope.source, 'details.scopes.source', url),
          instrument_types: stringList(scope.instrument_types, 'details.scopes.instrument_types', url),
          identity_kinds: stringList(scope.identity_kinds, 'details.scopes.identity_kinds', url),
        }
      }),
    }
  } catch (cause) {
    if (cause instanceof ApiError) return null
    throw cause
  }
}

export function normalizeFields(input: unknown, url: string): FieldsResponse {
  const data = object(input, 'fields', url)
  const version = finiteNumber(data.details_version, 'details_version', url)
  if (!Number.isInteger(version) || version < 0) invalid('details_version', url)
  if (!Array.isArray(data.details)) invalid('details', url)
  const details = data.details.map(entry => normalizeDefinition(entry, url)).filter((entry): entry is DetailDefinitionResponse => entry !== null)
  if (new Set(details.map(entry => entry.name)).size !== details.length) invalid('details.name', url)
  return {
    generation_id: text(data.generation_id, 'generation_id', url),
    core_version: text(data.core_version, 'core_version', url),
    details_version: version,
    details,
  }
}
