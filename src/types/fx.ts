/** Gerichteter Devisenkurs: eine Einheit base entspricht rate Einheiten quote. */
export interface FxRate {
  base: string
  quote: string
  rate: number
  quoteTime: string
  fetchedAt: string
  cached: boolean
  stale: boolean
  source: string | null
}

export type FxMap = ReadonlyMap<string, FxRate>
