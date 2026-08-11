/**
 * Beträge, die wahlweise als Euro-Summe oder als Anteil am Depot gelten.
 *
 * Zwei Einstellungen brauchen genau das — der Sicherheitspuffer und das
 * Mindest-Handelsvolumen — und beide mit derselben Bedeutung: Ein fester
 * Betrag bleibt fest, ein Prozentsatz wächst mit dem Depot. Deshalb steht die
 * Umrechnung hier einmal und nicht zweimal in der Oberfläche.
 */

import type { AmountSetting } from '@/types/portfolio'

/**
 * Rechnet die Einstellung in einen Euro-Betrag um.
 *
 * @param setting Betrag mit Einheit.
 * @param total   Gesamtvermögen — Bezugsgröße im Prozent-Modus.
 */
export function resolveAmount(setting: AmountSetting, total: number): number {
  return setting.mode === 'percent' ? (total * setting.value) / 100 : setting.value
}

/**
 * Wechselt die Einheit und rechnet den Wert mit.
 *
 * Die Zahl unverändert stehen zu lassen wäre falsch: Aus 170.000 € würden
 * 170.000 % — ein Wert, den niemand gemeint hat. Umgerechnet bleibt der Betrag
 * im Moment des Wechsels derselbe und skaliert ab dann mit dem Depot.
 *
 * @param setting Bisherige Einstellung.
 * @param mode    Gewünschte Einheit.
 * @param total   Gesamtvermögen.
 * @returns Einstellung in der neuen Einheit; unverändert, wenn sie schon passt.
 */
export function convertAmount(
  setting: AmountSetting,
  mode: AmountSetting['mode'],
  total: number,
): AmountSetting {
  if (setting.mode === mode) return setting

  const euro = resolveAmount(setting, total)
  const value =
    mode === 'percent'
      ? // Ohne Gesamtvermögen gibt es keinen Bezug — dann lieber zurück auf
        // null als eine Division durch null.
        total > 0
        ? Number(((euro * 100) / total).toFixed(2))
        : 0
      : Math.round(euro)

  return { mode, value }
}
