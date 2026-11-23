import { afterEach, describe, expect, it } from 'vitest'
import { StockInfoClient } from '@/api/stockinfo/client'
import type { AppLocale } from '@/i18n'
import { i18n } from '@/i18n'
import { de } from '@/i18n/de'
import { en } from '@/i18n/en'

/**
 * StockInfos Fehlerkennungen (T-117) mit Beispielwerten für jeden Platzhalter.
 * Die Liste ist zugleich der Vertrag: Kennt der Katalog eine Kennung, die hier
 * fehlt, oder umgekehrt, scheitert der erste Test.
 */
const CODES: Record<string, Record<string, string>> = {
  quote_unavailable: { identifier: 'DE000TEST001' },
  instrument_not_found: { identifier: 'DE000TEST001' },
  unsupported_instrument_type: { symbol: 'EUNL.DE', instrument_type: 'warrant' },
  quote_currency_mismatch: { symbol: 'EUNL.DE', expected: 'EUR', delivered: 'USD' },
  identity_conflict: { kind: 'listed', ticker: 'AAPL', mic: 'XNAS', isin: 'US0378331005' },
  symbol_ambiguous: { symbol: 'DUAL' },
  invalid_isin_format: { isin: 'DE00' },
  invalid_symbol_format: { symbol: '??' },
  daily_series_not_found: { identifier: 'DE000TEST001' },
  daily_source_unavailable: { identifier: 'DE000TEST001' },
  fx_pair_not_found: { base: 'USD', quote: 'EUR' },
  fx_source_unavailable: { base: 'USD', quote: 'EUR' },
  invalid_currency_code: { base: 'US', quote: 'EURO' },
  identifier_empty: {},
  identifier_unknown_form: { identifier: 'foo bar' },
  exchange_not_covered: { mic: 'XTKS' },
  ambiguous_exchange_suffix: {},
  symbol_without_exchange_suffix: {},
  unknown_exchange_suffix: {},
  non_canonical_ticker: {},
  migration_pending: {},
  startup_running: {},
  startup_failed: {},
  contract_unavailable: {},
  // Kennungen von Wegen, die StockPortfolio heute nicht aufruft (T-138).
  invalid_timestamp: { name: 'from', value: 'gestern' },
  time_range_reversed: { from: '2026-11-02T00:00:00Z', to: '2026-11-01T00:00:00Z' },
  isin_or_symbol_required: {},
  refresh_in_progress: {},
  instrument_not_stored: { identifier: 'DE000TEST001' },
  listing_not_found: {},
  isin_taken: { isin: 'DE000TEST001' },
  detail_number_required: { field: 'ter' },
  detail_below_minimum: { field: 'ter', minimum: '0' },
  detail_above_maximum: { field: 'ter', maximum: '100' },
  detail_boolean_required: { field: 'distributing' },
  detail_text_required: { field: 'provider', max_length: '200' },
  detail_currency_code_required: { field: 'fund_currency' },
  detail_currency_required: { field: 'fund_size' },
  detail_currency_not_allowed: { field: 'ter' },
  detail_not_declared: { field: 'coupon' },
  detail_not_editable: { field: 'volatility' },
  migration_not_pending: {},
  backup_not_found: { name: 'stockinfo-2026-11-01.db' },
  backup_incompatible: { name: 'stockinfo-2026-11-01.db' },
  backup_schema_too_new: { name: 'stockinfo-2026-11-01.db' },
  restore_failed: { name: 'stockinfo-2026-11-01.db' },
  provenance_mismatch: { stamped: 'profile-a', running: 'profile-b' },
}

/** Liefert die Fehlermeldung, die der Client aus einer StockInfo-Antwort bildet. */
async function detailFor(body: unknown, status = 404): Promise<string> {
  const client = new StockInfoClient(
    'https://errors.test',
    async () => new Response(JSON.stringify(body), { status }),
  )
  const failure = await client.getQuoteBySymbol('EUNL.DE').catch((error: unknown) => error)
  return (failure as { detail: string }).detail
}

function useLocale(locale: AppLocale) {
  i18n.global.locale.value = locale
}

afterEach(() => useLocale('en'))

describe('StockInfo-Fehlerkennungen', () => {
  it('haben je Kennung einen Satz im Katalog, nicht mehr und nicht weniger', () => {
    const catalogued = Object.keys(en.errors.reason)
      .filter((code) => code !== 'unknown')
      .sort()
    expect(catalogued).toEqual(Object.keys(CODES).sort())
    expect(Object.keys(de.errors.reason).sort()).toEqual(Object.keys(en.errors.reason).sort())
  })

  for (const locale of ['de', 'en'] as const) {
    it.each(Object.entries(CODES))(
      `übersetzt %s auf ${locale} und setzt die Werte ein`,
      async (code, params) => {
        useLocale(locale)
        const detail = await detailFor({ code, params })
        expect(detail).not.toContain('{')
        expect(detail).not.toBe(code)
        for (const value of Object.values(params).filter((value) => value !== 'listed')) {
          expect(detail).toContain(value)
        }
      },
    )
  }

  it('spricht die gewählte Sprache', async () => {
    useLocale('de')
    expect(
      await detailFor({ code: 'fx_pair_not_found', params: { base: 'USD', quote: 'EUR' } }),
    ).toBe('Keine der in StockInfo eingerichteten Quellen führt den Kurs USD/EUR.')
    useLocale('en')
    expect(
      await detailFor({ code: 'fx_pair_not_found', params: { base: 'USD', quote: 'EUR' } }),
    ).toBe('None of the sources configured in StockInfo carries the rate USD/EUR.')
  })

  it('nennt bei einer unbekannten Kennung die Kennung in einem allgemeinen Satz', async () => {
    useLocale('de')
    expect(await detailFor({ code: 'brand_new_reason', params: { x: '1' } })).toBe(
      'StockInfo meldet einen Fehler, den StockPortfolio nicht kennt: brand_new_reason.',
    )
  })

  it('zeigt einen Satz im alten Format weiter an', async () => {
    expect(await detailFor({ detail: 'Vertragsartefakt nicht lesbar' }, 503)).toBe(
      'Vertragsartefakt nicht lesbar',
    )
  })

  it('übersetzt die Kennung im detail eines 503 während Migration oder Start', async () => {
    useLocale('de')
    expect(await detailFor({ detail: 'migration_pending', migration: '/migration' }, 503)).toBe(
      'StockInfo wartet auf eine Datenmigration und beantwortet bis dahin keine Abfragen.',
    )
  })

  it('nennt eine unbekannte Kennung im detail eines 503 im allgemeinen Satz, nicht roh', async () => {
    useLocale('de')
    expect(await detailFor({ detail: 'maintenance_running' }, 503)).toBe(
      'StockInfo meldet einen Fehler, den StockPortfolio nicht kennt: maintenance_running.',
    )
    useLocale('en')
    expect(await detailFor({ detail: 'maintenance_running' }, 503)).toBe(
      'StockInfo reports an error that StockPortfolio does not know: maintenance_running.',
    )
    // Ein Satz im alten Format bleibt unverändert, auch ein einzelnes Wort.
    expect(await detailFor({ detail: 'Not Found' }, 404)).toBe('Not Found')
    expect(await detailFor({ detail: 'Vertragsartefakt nicht lesbar' }, 503)).toBe(
      'Vertragsartefakt nicht lesbar',
    )
  })

  it.each([
    { detail: [{ loc: ['query', 'isin'], msg: 'field required' }] },
    { detail: { reason: 'x' } },
    { code: 'quote_unavailable', params: { identifier: { nested: true } } },
  ])('zeigt nie JSON oder [object Object] (%j)', async (body) => {
    const detail = await detailFor(body, 422)
    expect(detail).not.toContain('[object Object]')
    expect(detail).not.toMatch(/[{}[\]]/)
  })
})
