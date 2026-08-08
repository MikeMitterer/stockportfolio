/**
 * Naive-UI-Overrides aus den Theme-Token.
 *
 * Naive UI kennt unsere CSS-Variablen nicht und bringt eigene Farben mit.
 * Ohne diese Brücke liefen Tabelle, Dialoge und Eingabefelder farblich
 * neben dem Rest her. Die Werte werden zur Laufzeit aus den gesetzten
 * Variablen gelesen — es gibt also nur **eine** Quelle je Theme.
 */

import type { GlobalThemeOverrides } from 'naive-ui'

/**
 * Liest eine CSS-Variable und macht daraus eine gültige Farbangabe.
 *
 * Die Tokens stehen als RGB-Tripel (`23 23 23`), damit Tailwinds
 * Deckkraft-Zusätze greifen. Naive UI erwartet dagegen eine fertige Farbe.
 *
 * @param name  Variablenname inklusive `--`.
 * @param alpha Optionale Deckkraft zwischen 0 und 1.
 */
function token(name: string, alpha?: number): string {
  const triple = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  if (!triple) return 'transparent'

  // Naive UIs Farbparser (seemly) kennt die moderne Schreibweise mit
  // Leerzeichen nicht — `rgb(42 120 214)` wirft dort einen Fehler und reißt
  // das Rendern der Tabelle mit. Deshalb die alte Form mit Kommas.
  const parts = triple.split(/[\s,]+/).filter(Boolean)
  if (parts.length < 3) return 'transparent'

  const [r, g, b] = parts
  return alpha === undefined ? `rgb(${r}, ${g}, ${b})` : `rgba(${r}, ${g}, ${b}, ${alpha})`
}

/**
 * Baut die Overrides für das gerade aktive Theme.
 * Muss aufgerufen werden, **nachdem** `data-theme` gesetzt wurde.
 */
export function buildNaiveOverrides(): GlobalThemeOverrides {
  const surfaceCard = token('--surface-card')
  const surfaceRaised = token('--surface-raised')
  const textPrimary = token('--text-primary')
  const textSecondary = token('--text-secondary')
  const border = token('--border-default')
  const accent = token('--accent')

  return {
    common: {
      primaryColor: accent,
      primaryColorHover: accent,
      primaryColorPressed: accent,
      textColorBase: textPrimary,
      textColor1: textPrimary,
      textColor2: textSecondary,
      textColor3: token('--text-muted'),
      borderColor: border,
      dividerColor: token('--border-subtle'),
      cardColor: surfaceCard,
      modalColor: surfaceRaised,
      popoverColor: surfaceRaised,
      bodyColor: token('--surface-page'),
      inputColor: surfaceRaised,
      errorColor: token('--status-out'),
      successColor: token('--status-ok'),
      warningColor: token('--status-near'),
    },
    DataTable: {
      thColor: 'transparent',
      tdColor: 'transparent',
      thTextColor: textSecondary,
      tdTextColor: textPrimary,
      borderColor: token('--border-subtle'),
      // Zeilen-Hover: dezent, damit die Zahlen lesbar bleiben.
      tdColorHover: surfaceRaised,
    },
    Card: {
      color: surfaceCard,
      borderColor: border,
    },
    Input: {
      color: surfaceRaised,
      border: `1px solid ${border}`,
    },
  }
}
