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
 * Aktuelle StockInfo-Angaben gehen vor der gespeicherten Kopie. Fehlt ein Kurs,
 * bleibt der zuletzt bekannte Typ erhalten. Cash hat keinen Asset-Typ.
 *
 * @param position Die Position mit gespeichertem Typ.
 * @param quoteType Aktuelle offene Typkennung aus dem Kurs.
 * @returns Typkennung oder null, wenn sie sich nicht bestimmen lässt.
 */
export function resolveKind(
  position: Pick<Position, 'kind' | 'group'>,
  quoteType?: string | null,
): InstrumentKind | null {
  if (position.group === 'cash') return null
  return quoteType?.trim() || position.kind?.trim() || null
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
 * @param quoteType Aktueller Typ aus StockInfo, hat Vorrang vor der gespeicherten Kopie.
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
    .filter((link) => !link.appliesToGroups?.length || link.appliesToGroups.includes(position.group))
    .map((link) => {
      const url = fillTemplate(link.urlTemplate, {
        isin: position.isin,
        symbol: position.symbol,
      })
      return url ? { id: link.id, label: link.label, url } : null
    })
    .filter((link): link is ResolvedLink => link !== null)
}
