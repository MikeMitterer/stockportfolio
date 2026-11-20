/** Gemeinsame Anzeigeprojektion für Hauptspalten und Zusatzinformationen. */
import { translate } from '@/i18n'
import { money, moneyAmount, number, percent } from './formatters'
import type { DetailDefinition, DetailScalar, DetailValue } from '@/types/details'
import type { QuoteCacheEntry } from '@/types/portfolio'

export interface ProjectedDetailField {
  key: string
  label: string
  value: string
  manualValue: string
  metadata: DetailValue
}

/** Nur die schon vorher angezeigten Core-Zusatzwerte brauchen einen Rückfall. */
function coreDefinitions(): DetailDefinition[] {
  return ['ter', 'volatility'].map((name) => ({
    name,
    kind: 'number',
    unit: 'percent',
    labelEn: name === 'ter' ? translate('detailFields.ter') : translate('drilldown.volatility'),
    labelDe: '',
    overridable: false,
    sources: [],
    scopes: [],
    minimum: null,
    maximum: null,
    currencyRequired: false,
  }))
}

function coreValue(value: number): DetailValue {
  return {
    value,
    unit: 'percent',
    currency: null,
    origin: null,
    source: null,
    asOf: null,
    shadowed: false,
    manualValue: null,
    manualCurrency: null,
  }
}

/** Einheiten, die die Anzeige kennt; unbekannte zeigen „—“ statt einer falschen Zahl. */
const KNOWN_UNITS = ['percent', 'ratio', 'basis_points', 'millions', 'absolute']

/** Beschriftung hinter der Zahl; Prozent und Beträge tragen ihre Einheit selbst. */
function unitLabelOf(unit: string | null): string | null {
  if (unit === 'absolute') return ''
  if (unit === 'ratio') return translate('detailFields.ratio')
  if (unit === 'basis_points') return translate('detailFields.basisPoints')
  if (unit === 'millions') return translate('detailFields.millions')
  return unit
}

/** Zahl mit Einheit und Währung; `null`, wenn Einheit oder Währung nicht zur Deklaration passen. */
function numberText(
  definition: DetailDefinition,
  value: number,
  unit: string | null,
  currency: string | null,
): string | null {
  if (unit !== null && !KNOWN_UNITS.includes(unit)) return null
  if (definition.unit !== null && unit !== definition.unit) return null
  if ((definition.currencyRequired || unit === 'absolute') && !currency) return null
  // Wie StockInfo (T-88): „129.791,00 Mio. EUR“ — Zahl, Maßstab, Währungscode.
  if (unit === 'millions' && currency) {
    return translate('detailFields.amountMillions', {
      amount: moneyAmount(value, currency, 2),
      currency: currency.toUpperCase(),
    })
  }
  const unitLabel = unitLabelOf(unit)
  const suffix = unitLabel ? ` ${unitLabel}` : ''
  if (currency) return `${money(value, currency, 2)}${suffix}`
  if (unit === 'percent') return percent(value, 4)
  return `${number(value)}${suffix}`
}

function valueText(
  definition: DetailDefinition,
  value: DetailScalar | null,
  unit: string | null,
  currency: string | null,
): string {
  if (value === null) return '—'
  if (definition.kind === 'boolean')
    return typeof value === 'boolean'
      ? translate(value ? 'detailFields.yes' : 'detailFields.no')
      : '—'
  if (definition.kind === 'text') return typeof value === 'string' ? value : '—'
  if (typeof value !== 'number' || !Number.isFinite(value)) return '—'
  return numberText(definition, value, unit, currency) ?? '—'
}

/** Detailwerte der Quote, ergänzt um TER und Volatilität aus den Kernfeldern, wo StockInfo sie nicht als Detail liefert. */
function valuesWithCoreFallback(quote: QuoteCacheEntry): Record<string, DetailValue> {
  const values: Record<string, DetailValue> = { ...quote.details }
  if (!Object.hasOwn(values, 'ter') && quote.ter !== null) values.ter = coreValue(quote.ter)
  if (!Object.hasOwn(values, 'volatility') && quote.volatility !== null)
    values.volatility = coreValue(quote.volatility)
  return values
}

/** Gilt die Deklaration für Gattung und Identitätsart dieser Quote? */
function appliesTo(definition: DetailDefinition, quote: QuoteCacheEntry): boolean {
  return definition.scopes.some(
    (scope) =>
      scope.instrumentTypes.includes(quote.type ?? '') &&
      scope.identityKinds.includes(quote.identity.kind),
  )
}

export function projectDetailFields(
  quote: QuoteCacheEntry | null,
  definitions: readonly DetailDefinition[],
  visibleKeys: readonly string[],
  locale: string,
): ProjectedDetailField[] {
  if (!quote) return []
  const visible = new Set(visibleKeys)
  const catalog = new Map(coreDefinitions().map((definition) => [definition.name, definition]))
  for (const definition of definitions) catalog.set(definition.name, definition)
  const values = valuesWithCoreFallback(quote)

  const fields: ProjectedDetailField[] = []
  for (const [key, metadata] of Object.entries(values)) {
    const definition = catalog.get(key)
    if (!definition || visible.has(key)) continue
    // Nur die lokalen Core-Rückfälle gelten ohne deklarierte Anwendbarkeit.
    if (definitions.includes(definition) && !appliesTo(definition, quote)) continue
    const unit = metadata.unit ?? definition.unit
    fields.push({
      key,
      label: (locale.startsWith('de') ? definition.labelDe : '') || definition.labelEn || key,
      value: valueText(definition, metadata.value, unit, metadata.currency),
      manualValue: valueText(definition, metadata.manualValue, unit, metadata.manualCurrency),
      metadata,
    })
  }
  return fields
}

/** Null ohne Herkunft ist leer; Nullwerte mit Quellenhinweis bleiben erklärbar. */
export function hasDetailContent(field: ProjectedDetailField): boolean {
  return (
    (field.value !== '—' && field.value.trim() !== '') ||
    field.metadata.origin !== null ||
    field.metadata.source !== null ||
    field.metadata.asOf !== null ||
    field.metadata.shadowed
  )
}
