/**
 * Auflösen der externen Verweise zu einer Position.
 *
 * Welche Verweise gelten, hängt von der Gattung ab: ein Meldefonds-Nachweis
 * ergibt nur bei Fonds Sinn, und Profilseiten trennen Aktien von ETFs. Die
 * Vorlagen selbst stehen in den Einstellungen, nicht hier — sie sind
 * länder- und anbieterabhängig.
 */

import type { ExternalLink, InstrumentKind, Position } from '@/types/portfolio'

/** Ein aufgelöster, anklickbarer Verweis. */
export interface ResolvedLink {
  id: string
  label: string
  url: string
}

/**
 * Bestimmt die Gattung einer Position.
 *
 * Bevorzugt den auf der Position gespeicherten Wert; fällt auf die Angabe
 * aus dem Kurs zurück, damit auch ältere Positionen ohne `kind` Verweise
 * bekommen.
 *
 * @param position   Die Position.
 * @param quoteType  `type`-Feld aus dem Kurs (`etf` | `stock` | null).
 * @returns Gattung oder `null`, wenn sie sich nicht bestimmen lässt.
 */
export function resolveKind(
  position: Pick<Position, 'kind' | 'group'>,
  quoteType?: string | null,
): InstrumentKind | null {
  if (position.kind) return position.kind
  if (position.group === 'cash') return null
  if (quoteType === 'etf' || quoteType === 'stock') return quoteType
  return null
}

/**
 * Setzt eine Adressvorlage ein.
 *
 * @returns Fertige URL oder `null`, wenn ein benötigter Platzhalter fehlt.
 */
export function fillTemplate(
  template: string,
  values: { isin: string | null; symbol: string },
): string | null {
  if (template.includes('{isin}') && !values.isin) return null

  return template
    .replace(/\{isin\}/g, values.isin ?? '')
    .replace(/\{symbol\}/g, values.symbol)
}

/**
 * Gilt der Verweis für diese Gattung?
 * Ein leeres `appliesTo` heißt „für alle".
 */
export function appliesToKind(link: ExternalLink, kind: InstrumentKind | null): boolean {
  if (link.appliesTo.length === 0) return true
  if (!kind) return false
  return link.appliesTo.includes(kind)
}

/**
 * Liefert alle passenden, aktivierten Verweise zu einer Position.
 *
 * @param position Die Position (liefert ISIN, Symbol, Gattung).
 * @param links    Konfigurierte Vorlagen aus den Einstellungen.
 * @param quoteType Gattung aus dem Kurs, als Rückfallebene.
 */
export function resolveLinks(
  position: Pick<Position, 'isin' | 'symbol' | 'kind' | 'group'>,
  links: ExternalLink[],
  quoteType?: string | null,
): ResolvedLink[] {
  const kind = resolveKind(position, quoteType)

  return links
    .filter((link) => link.enabled)
    .filter((link) => appliesToKind(link, kind))
    .map((link) => {
      const url = fillTemplate(link.urlTemplate, {
        isin: position.isin,
        symbol: position.symbol,
      })
      return url ? { id: link.id, label: link.label, url } : null
    })
    .filter((link): link is ResolvedLink => link !== null)
}
