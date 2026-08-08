/**
 * Ableitung der Assetklasse aus den API-Metadaten eines Instruments.
 *
 * Die StockInfo-API unterscheidet nur `etf` und `stock`; unsere Gruppen sind
 * feiner. Diese Heuristik liefert einen **Vorschlag** für den
 * Hinzufügen-Dialog — die letzte Entscheidung trifft der Nutzer.
 */

import type { AssetGroup } from '@/types/portfolio'

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
 * @param type API-Typ (`etf` | `stock` | null).
 * @returns Vorgeschlagene Gruppe; `stocks`, wenn nichts Genaueres erkennbar ist.
 */
export function suggestAssetGroup(name: string | null, type: string | null): AssetGroup {
  const haystack = (name ?? '').toLowerCase()

  if (METAL_HINTS.some((hint) => haystack.includes(hint))) return 'metals'
  if (BOND_HINTS.some((hint) => haystack.includes(hint))) return 'bonds'

  // Ohne Namenshinweis bleibt nur der Typ — beides landet bei Aktien/ETFs.
  void type
  return 'stocks'
}
