/** Anzeigeregeln der Assets-Übersicht für StockInfos flache Instrumentfelder. */
import type { DetailDefinition } from '@/types/details'

/** Übersetzungsschlüssel der Gattungen, die StockInfo kennt (`QuoteResponse.type`). */
const TYPE_LABEL_KEYS: Record<string, string> = {
  stock: 'dashboard.kindStock',
  etf: 'dashboard.kindEtf',
  etc: 'dashboard.kindEtc',
  fund: 'dashboard.kindFund',
  bond: 'dashboard.kindBond',
  crypto: 'dashboard.kindCrypto',
}

/**
 * Übersetzungsschlüssel einer Gattung oder `null` für eine unbekannte.
 *
 * Eine neue Gattung aus StockInfo erscheint dann unverändert als Rohwert,
 * statt zu verschwinden.
 */
export function instrumentTypeLabelKey(type: string): string | null {
  return TYPE_LABEL_KEYS[type] ?? null
}

/**
 * Gilt die TER für diese Gattung und Identitätsart?
 *
 * Wie in StockInfo zählt die Deklaration im Feldkatalog: Ein flacher Altwert
 * an einer Gattung, für die keine Quelle `ter` deklariert, wird nicht gezeigt.
 * Ohne Katalog oder ohne `ter`-Deklaration bleibt der flache Wert sichtbar,
 * wie beim Rückfall in den Zusatzinformationen.
 */
export function terApplies(
  type: string,
  identityKind: string,
  definitions: readonly DetailDefinition[] | null,
): boolean {
  const ter = definitions?.find((definition) => definition.name === 'ter')
  if (!ter) return true
  return ter.scopes.some(
    (scope) => scope.instrumentTypes.includes(type) && scope.identityKinds.includes(identityKind),
  )
}
