import { beforeEach, describe, expect, it } from 'vitest'
import { StockInfoClient } from '@/api/client'
import { toFieldCatalog, toQuoteCacheEntry } from '@/api/mappers'
import { projectDetailFields } from '@/domain/detailFields'
import { setFormatterLocale } from '@/domain/formatters'
import { translate } from '@/i18n'
import quoteFixture from '../fixtures/stockinfo/quote-200.json'
import catalogFixture from '../fixtures/stockinfo/detail-catalog.json'
import values from '../fixtures/stockinfo/detail-values.json'

beforeEach(() => setFormatterLocale('de-AT'))
async function sample() {
  const client = new StockInfoClient('https://details.test', async input => new Response(JSON.stringify(
    String(input).endsWith('/fields') ? catalogFixture : { ...quoteFixture.response.body, details: values },
  )))
  return { quote: toQuoteCacheEntry(await client.getQuoteBySymbol('EUNL.DE')), catalog: toFieldCatalog(await client.getFields()) }
}

describe('Zusatzfelder als reine Anzeigeprojektion', () => {
  it('erhält kleine Prozentwerte und rechnet deklarierte Maßstäbe nicht um', async () => {
    const { quote, catalog } = await sample()
    const entry = quote.details!['risk-a.score']!
    entry.value = 0.19
    expect(projectDetailFields(quote, catalog.definitions, [], 'de').find(row => row.key === 'risk-a.score')?.value).toBe('0,19 %')
    for (const [unit, value, expected] of [['ratio', 0.0019, '0,0019'], ['basis_points', 19, '19'], ['millions', 1.25, '1,25']] as const) {
      entry.unit = unit
      catalog.definitions.find(field => field.name === 'risk-a.score')!.unit = unit
      entry.value = value
      expect(projectDetailFields(quote, catalog.definitions, [], 'de').find(row => row.key === 'risk-a.score')?.value).toContain(expected)
    }
  })

  it('zeigt unbekannte oder widersprüchliche Einheiten nicht als gültige Kennzahl', async () => {
    const { quote, catalog } = await sample()
    const entry = quote.details!['risk-a.score']!
    for (const unit of ['unknown-scale', 'basis_points']) {
      entry.unit = unit
      expect(projectDetailFields(quote, catalog.definitions, [], 'de').find(row => row.key === 'risk-a.score')?.value).toBe('—')
    }
    catalog.definitions.find(field => field.name === 'risk-a.score')!.unit = 'unknown-scale'
    entry.unit = 'unknown-scale'
    expect(projectDetailFields(quote, catalog.definitions, [], 'de').find(row => row.key === 'risk-a.score')?.value).toBe('—')
    expect(projectDetailFields(quote, catalog.definitions, [], 'de').find(row => row.key === 'risk-a.flag')?.value).toBe(translate('detailFields.no'))
  })

  it('erhält null, 0 und false sowie den Prozentmaßstab und die Währung am Wert', async () => {
    const { quote, catalog } = await sample()
    const rows = projectDetailFields(quote, catalog.definitions, [], 'de')
    expect(rows.find(row => row.key === 'risk-a.score')?.value).toBe('0,0 %')
    expect(rows.find(row => row.key === 'risk-b.score')?.value).toBe('—')
    expect(rows.find(row => row.key === 'risk-a.flag')?.value).toBe(translate('detailFields.no'))
    expect(rows.find(row => row.key === 'risk-a.amount')?.value).toContain('$')
    expect(rows.find(row => row.key === 'risk-a.amount')?.value).not.toContain('€')
    expect(rows.find(row => row.key === 'risk-a.amount')?.value).not.toContain('absolute')
    expect(quote.details?.['risk-a.amount']?.value).toBe(100)
    expect(quote.currency).toBe('EUR')
  })

  it('gleicht vollständige Feldnamen statt gleiche Beschriftungen ab', async () => {
    const { quote, catalog } = await sample()
    const rows = projectDetailFields(quote, catalog.definitions, ['risk-a.score'], 'de')
    expect(rows.some(row => row.key === 'risk-a.score')).toBe(false)
    expect(rows.find(row => row.key === 'risk-b.score')?.label).toBe('Risikoscore')
    expect(projectDetailFields(quote, catalog.definitions, [], 'de').filter(row => row.label === 'Risikoscore')).toHaveLength(2)
  })

  it('zeigt den wirksamen Wert und hält den verdeckten manuellen Wert separat', async () => {
    const { quote, catalog } = await sample()
    const row = projectDetailFields(quote, catalog.definitions, [], 'de').find(row => row.key === 'risk-a.score')!
    expect(row.value).toBe('0,0 %')
    expect(row.manualValue).toBe('7,0 %')
    expect(row.metadata).toMatchObject({ origin: 'provider', source: 'risk-a', shadowed: true })
  })

  it('benutzt englisches Label und danach Feldname; nicht anwendbare oder undefinierte Felder fehlen', async () => {
    const { quote, catalog } = await sample()
    let rows = projectDetailFields(quote, catalog.definitions, [], 'de')
    expect(rows.find(row => row.key === 'risk-a.note')?.label).toBe('Comment')
    catalog.definitions.find(field => field.name === 'risk-a.note')!.labelEn = ''
    rows = projectDetailFields(quote, catalog.definitions, [], 'de')
    expect(rows.find(row => row.key === 'risk-a.note')?.label).toBe('risk-a.note')
    expect(projectDetailFields({ ...quote, type: 'bond' }, catalog.definitions, [], 'de').some(row => row.key.startsWith('risk-'))).toBe(false)
    expect(projectDetailFields({ ...quote, identity: { kind: 'isin_only', isin: 'DE0001135275' } }, catalog.definitions, [], 'de').some(row => row.key.startsWith('risk-'))).toBe(false)
    expect(projectDetailFields(quote, [], [], 'de').some(row => row.key.startsWith('risk-'))).toBe(false)
  })

  it('ersetzt bei einem Betrag keine fehlende Wertwährung durch die Kurswährung', async () => {
    const { quote, catalog } = await sample()
    quote.details!['risk-a.amount']!.currency = null
    expect(projectDetailFields(quote, catalog.definitions, [], 'de').find(row => row.key === 'risk-a.amount')?.value).toBe('—')
  })

  it('verwendet für TER und Volatilität dieselbe Liste und vermeidet Dubletten', async () => {
    const { quote, catalog } = await sample()
    quote.ter = 0
    const rows = projectDetailFields(quote, catalog.definitions, [], 'de')
    expect(rows.filter(row => row.key === 'ter')).toHaveLength(1)
    expect(rows.find(row => row.key === 'ter')?.value).toBe('0,0 %')
    expect(projectDetailFields(quote, [], ['ter', 'volatility'], 'de')).toEqual([])
  })
})
