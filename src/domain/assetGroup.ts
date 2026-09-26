/**
 * Ableitung der Assetklasse aus den API-Metadaten eines Instruments.
 *
 * StockInfo liefert offene Typkennungen; Depotgruppen sind eine eigene
 * Zuordnung. Diese Heuristik liefert einen **Vorschlag** für den
 * Hinzufügen-Dialog — die letzte Entscheidung trifft der Nutzer.
 */

import type { AssetGroup, Portfolio } from '@/types/portfolio'

/**
 * Namensbestandteile, die auf geldmarktnahe Papiere hindeuten.
 * Werden **vor** den Anleihe-Hinweisen geprüft: „Ultrashort Bond" ist beides,
 * gehört aber zum Geldmarkt.
 */
const MONEY_MARKET_HINTS = [
  'ultrashort',
  'ultra short',
  'money market',
  'geldmarkt',
  'overnight',
  't-bill',
  'treasury bill',
  'floating rate',
] as const

/** Namensbestandteile, die auf eine Anleihe hindeuten. */
const BOND_HINTS = [
  'bond',
  'treasury',
  'anleihe',
  'govt',
  'government',
  'aggregate',
  'gilt',
  'bund',
  'corporate',
] as const

/** Namensbestandteile, die auf Edelmetalle hindeuten. */
const METAL_HINTS = [
  'gold',
  'silver',
  'silber',
  'platin',
  'platinum',
  'palladium',
  'bullion',
  'metal',
] as const

/**
 * Schlägt eine Assetklasse vor.
 *
 * @param name Anzeigename des Instruments (kann `null` sein).
 * @param type Offene API-Typkennung oder null.
 * @returns Vorgeschlagene Gruppe; `stocks` bei unbekanntem Typ.
 */
export function suggestAssetGroup(name: string | null, type: string | null): AssetGroup {
  const haystack = (name ?? '').toLowerCase()

  if (METAL_HINTS.some((hint) => haystack.includes(hint))) return 'metals'
  if (MONEY_MARKET_HINTS.some((hint) => haystack.includes(hint))) return 'moneymarket'
  if (BOND_HINTS.some((hint) => haystack.includes(hint))) return 'bonds'

  return type === 'etf' ? 'etfs' : 'stocks'
}

/**
 * Trennt die alte Sammelgruppe genau einmal. Ein später manuell auf „Aktien“
 * gesetzter ETF bleibt dank der Versionsmarke dort.
 */
export function upgradeAssetGroups(portfolio: Portfolio): Portfolio {
  if (portfolio.assetGroupVersion === 2) return portfolio
  return {
    ...portfolio,
    assetGroupVersion: 2,
    positions: portfolio.positions.map(position =>
      position.group === 'stocks' && position.kind === 'etf'
        ? { ...position, group: 'etfs' }
        : position,
    ),
  }
}
