/**
 * Farbzuordnung der Assetklassen.
 *
 * Die Farbe trägt hier Bedeutung, sie schmückt nicht: dieselbe Klasse hat in
 * Balken, Kopfzeilen und Kennzahlen denselben Farbton, sodass sich die
 * Verteilung ohne Lesen erfassen lässt.
 *
 * Die vorhandenen fünf Assettöne kommen aus dem Fundament. Für ETFs wird der
 * dort vorhandene Akzentton verwendet; so entsteht hier kein lokales
 * Theme-Token. Die Gruppennamen bleiben immer sichtbar und tragen die
 * Unterscheidung unabhängig von der Farbe.
 *
 * Im Hellmodus liegen drei Töne unter 3:1 Kontrast zur Fläche. Das ist
 * zulässig, weil jeder Balken seinen Namen ausgeschrieben daneben trägt —
 * Farbe ist Zweitkodierung, nie das einzige Erkennungsmerkmal.
 */

import type { AssetGroup } from '@/types/portfolio'

export interface AssetColor {
  /** Vollton für Balkenfüllungen. */
  base: string
  /** Gedämpfte Variante für Flächen hinter Text. */
  soft: string
}

/** Farbton je Assetklasse — als CSS-Variablen gesetzt, siehe `style.css`. */
export const ASSET_COLOR_VAR: Record<AssetGroup, string> = {
  stocks: 'rgb(var(--asset-stocks))',
  etfs: 'rgb(var(--accent))',
  bonds: 'rgb(var(--asset-bonds))',
  metals: 'rgb(var(--asset-metals))',
  moneymarket: 'rgb(var(--asset-moneymarket))',
  cash: 'rgb(var(--asset-cash))',
}

/** Liefert die CSS-Variable zur Assetklasse. */
export function assetColor(group: AssetGroup): string {
  return ASSET_COLOR_VAR[group]
}
