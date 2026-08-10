/**
 * Farbzuordnung der Assetklassen.
 *
 * Die Farbe trägt hier Bedeutung, sie schmückt nicht: dieselbe Klasse hat in
 * Balken, Kopfzeilen und Kennzahlen denselben Farbton, sodass sich die
 * Verteilung ohne Lesen erfassen lässt.
 *
 * Die vier Töne stammen aus einer geprüften kategorialen Palette und wurden in
 * dieser Reihenfolge gegen Farbfehlsichtigkeit validiert (Nachbarpaare, beide
 * Modi: schlechtestes ΔE 8,4 dunkel / 9,1 hell bei Ziel ≥ 8; Normalsicht 19,3
 * bzw. 19,6 bei Grenze ≥ 15).
 *
 * **Die Reihenfolge ist Teil der Prüfung.** Aqua neben Magenta fiel mit ΔE 1,6
 * durch — die jetzige Anordnung trennt sie. Wer die Zuordnung ändert, muss
 * erneut validieren.
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
  bonds: 'rgb(var(--asset-bonds))',
  metals: 'rgb(var(--asset-metals))',
  moneymarket: 'rgb(var(--asset-moneymarket))',
  cash: 'rgb(var(--asset-cash))',
}

/** Liefert die CSS-Variable zur Assetklasse. */
export function assetColor(group: AssetGroup): string {
  return ASSET_COLOR_VAR[group]
}
