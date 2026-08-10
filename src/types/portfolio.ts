/**
 * Domain-Typen für Portfolio-, Positions- und Settings-Daten.
 * Referenz: docs/superpowers/specs/2026-08-06-rebalancing-webapp-design.md §5.
 */

/**
 * Assetklassen.
 *
 * `moneymarket` steht für geldmarktnahe Papiere (z.B. Ultrashort-Bond-ETFs).
 * Sie zählen zusammen mit Cash zur verfügbaren Liquidität und damit zur
 * Investitionsreserve — Laufzeit-Anleihen (`bonds`) tun das nicht.
 */
export type AssetGroup = 'stocks' | 'bonds' | 'metals' | 'moneymarket' | 'cash'

export type Suggestion = 'buy' | 'sell' | 'ok'

/**
 * Gattung des Papiers.
 *
 * Entscheidet, welche externen Verweise gelten: ein Meldefonds-Nachweis
 * ergibt nur bei Fonds Sinn — eine Aktie kann keiner sein. Auch Profilseiten
 * wie extraETF trennen ihre Adressen danach.
 */
export type InstrumentKind = 'etf' | 'stock'

export interface Position {
  id: string
  isin: string | null
  symbol: string
  displayName: string
  group: AssetGroup
  /** Gattung laut API; `null` bei Cash oder solange unbekannt. */
  kind: InstrumentKind | null
  units: number
  targetPercent: number
  enabled: boolean
  notes?: string
}

export interface Portfolio {
  id: string
  name: string
  positions: Position[]
  createdAt: string
  updatedAt: string
}

export interface Bands {
  lowerPercent: number
  upperPercent: number
}

/**
 * Verweis auf eine externe Seite zu einem Papier.
 *
 * Konfigurierbar, weil solche Quellen weder allgemeingültig noch stabil sind:
 * der Meldefonds-Nachweis der ÖKB gilt nur für Österreich, und Anbieter
 * ändern ihre Adressen. Statt das im Code festzuschreiben, pflegt der Nutzer
 * seine eigenen Verweise.
 *
 * Im `urlTemplate` werden `{isin}` und `{symbol}` ersetzt.
 */
export interface ExternalLink {
  id: string
  label: string
  urlTemplate: string
  /** Für welche Gattungen der Verweis gilt — leer heißt „für alle". */
  appliesTo: InstrumentKind[]
  enabled: boolean
}

export interface Settings {
  activePortfolioId: string
  totalRounding: number
  bands: Bands
  /** Betrag, der als Sicherheit unangetastet bleiben soll. */
  securityBuffer: number
  investmentReservePercent: number
  currentRebalancingBudget: number
  currency: 'EUR'
  refresh: { autoOnLoad: boolean; staleAfterMinutes: number }
  links: ExternalLink[]
  ui: {
    columns: {
      volatility: boolean
      optimalUnits: boolean
      groupSharePercent: boolean
      deltaEuro: boolean
      deltaMax: boolean
      deltaPercentAbs: boolean
    }
  }
}

export interface QuoteCacheEntry {
  isin: string | null
  symbol: string
  price: number
  currency: string
  /** Gattung laut API (`etf` | `stock`) — Rückfall für Positionen ohne `kind`. */
  type: string | null
  volatility: number | null
  name: string | null
  ter: number | null
  accumulating: boolean | null
  fetchedAt: string
  cached: boolean
  stale: boolean
}

export type QuoteMap = Map<string, QuoteCacheEntry>
