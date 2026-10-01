/** Sitzungsbezogene StockInfo-Typauskunft, keine lokale Liste erlaubter Typen. */
export interface InstrumentTypeCatalog {
  types: string[]
  complete: boolean
  sources: { name: string; role: string; types: string[]; status: string }[]
}
