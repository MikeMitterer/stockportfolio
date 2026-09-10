/** Offene Zusatzfelder: Anzeigedaten, keine Eingaben für Depotberechnungen. */
export type DetailScalar = number | string | boolean

export interface DetailValue {
  value: DetailScalar | null
  unit: string | null
  currency: string | null
  origin: 'provider' | 'manual' | null
  source: string | null
  asOf: string | null
  shadowed: boolean
  manualValue: DetailScalar | null
  manualCurrency: string | null
}

export interface DetailDefinition {
  name: string
  kind: 'number' | 'text' | 'boolean'
  unit: string | null
  labelEn: string
  labelDe: string
  overridable: boolean
  sources: string[]
  scopes: { source: string; instrumentTypes: string[]; identityKinds: string[] }[]
  minimum: number | null
  maximum: number | null
  currencyRequired: boolean
}

export interface FieldCatalog {
  generationId: string
  coreVersion: string
  detailsVersion: number
  definitions: DetailDefinition[]
}
