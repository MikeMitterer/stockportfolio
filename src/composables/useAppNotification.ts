/**
 * Meldungen der App — einheitlich als Toast.
 *
 * Nur noch die Verdrahtung: Das Verhalten (Zustand statt Ereignis, Zähler,
 * Weggeklicktes bleibt weg) liegt im Fundament. Hier bleibt, was das Paket
 * nicht wissen kann — aus welcher Einstellung die Anzeigedauer kommt.
 *
 * Was hier hineingehört: Aussagen über den **Zustand der Daten** — Kurse
 * fehlen, eine Position notiert fremd, die Ziele ergeben nicht 100 %. Was
 * nicht: Hinweise im Formular selbst. Eine Warnung zum Feld, in das man gerade
 * tippt, gehört neben das Feld und nicht in die Ecke des Fensters.
 */

import { computed } from 'vue'
import { useNotifier, type Notifier } from '@mikemitterer/ux-foundation'
import { useSettingsStore } from '@/stores/settings'

export type { NotifyOptions as AppNotificationOptions } from '@mikemitterer/ux-foundation'
export type AppNotifier = Notifier

/**
 * Liefert `notify` mit vorverdrahteter API und Zähler aus den Einstellungen.
 *
 * Muss in `setup()` aufgerufen werden — `useNotification` und der Store
 * brauchen den Komponenten-Kontext.
 */
export function useAppNotification(): AppNotifier {
  const settingsStore = useSettingsStore()
  return useNotifier(computed(() => settingsStore.settings.ui.notificationSeconds))
}
