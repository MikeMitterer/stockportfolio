/** Gemeinsame Anzeigeprojektion für Hauptspalten und Zusatzinformationen. */
import { translate } from '@/i18n'
import { money, number, percent } from './formatters'
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
  return ['ter', 'volatility'].map(name => ({
    name, kind: 'number', unit: 'percent',
    labelEn: name === 'ter' ? translate('detailFields.ter') : translate('drilldown.volatility'),
    labelDe: '', overridable: false, sources: [], scopes: [],
    minimum: null, maximum: null, currencyRequired: false,
  }))
}

function coreValue(value: number): DetailValue {
  return { value, unit: 'percent', currency: null, origin: null, source: null,
    asOf: null, shadowed: false, manualValue: null, manualCurrency: null }
}

function valueText(definition: DetailDefinition, value: DetailScalar | null, unit: string | null, currency: string | null): string {
  if (value === null) return '—'
  if (definition.kind === 'boolean') return typeof value === 'boolean' ? translate(value ? 'detailFields.yes' : 'detailFields.no') : '—'
  if (definition.kind === 'text') return typeof value === 'string' ? value : '—'
  if (typeof value !== 'number' || !Number.isFinite(value)) return '—'
  if (unit !== null && !['percent', 'ratio', 'basis_points', 'millions', 'absolute'].includes(unit)) return '—'
  if (definition.unit !== null && unit !== definition.unit) return '—'
  if ((definition.currencyRequired || unit === 'absolute') && !currency) return '—'
  const unitLabel = unit === 'absolute' ? ''
    : unit === 'ratio' ? translate('detailFields.ratio')
      : unit === 'basis_points' ? translate('detailFields.basisPoints')
        : unit === 'millions' ? translate('detailFields.millions') : unit
  if (currency) return `${money(value, currency, 2)}${unitLabel ? ` ${unitLabel}` : ''}`
  if (unit === 'percent') return percent(value, 4)
  return `${number(value)}${unitLabel ? ` ${unitLabel}` : ''}`
}

export function projectDetailFields(
  quote: QuoteCacheEntry | null,
  definitions: readonly DetailDefinition[],
  visibleKeys: readonly string[],
  locale: string,
): ProjectedDetailField[] {
  if (!quote) return []
  const visible = new Set(visibleKeys)
  const catalog = new Map(coreDefinitions().map(definition => [definition.name, definition]))
  for (const definition of definitions) catalog.set(definition.name, definition)
  const values: Record<string, DetailValue> = { ...quote.details }
  if (!Object.hasOwn(values, 'ter') && quote.ter !== null) values.ter = coreValue(quote.ter)
  if (!Object.hasOwn(values, 'volatility') && quote.volatility !== null) values.volatility = coreValue(quote.volatility)

  const fields: ProjectedDetailField[] = []
  for (const [key, metadata] of Object.entries(values)) {
    const definition = catalog.get(key)
    if (!definition || visible.has(key)) continue
    // Nur die lokalen Core-Rückfälle gelten ohne deklarierte Anwendbarkeit.
    if (definitions.includes(definition) && !definition.scopes.some(scope =>
      scope.instrumentTypes.includes(quote.type ?? '') && scope.identityKinds.includes(quote.identity.kind),
    )) continue
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
