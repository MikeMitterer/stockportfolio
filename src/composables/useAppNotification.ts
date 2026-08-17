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
import { useI18n } from 'vue-i18n'
import { useNotifier, type Notifier } from '@mmit/ux-foundation'
import { useSettingsStore } from '@/stores/settings'

export type { NotifyOptions as AppNotificationOptions } from '@mmit/ux-foundation'
export type AppNotifier = Notifier

/**
 * Liefert `notify` mit vorverdrahteter API, Anzeigedauer und Restzeit-Text.
 *
 * Muss in `setup()` aufgerufen werden — `useNotification`, der Store und
 * `useI18n` brauchen den Komponenten-Kontext.
 *
 * Die Beschriftung der Restzeit kommt von hier und nicht je Meldung: Sie
 * lautet in der ganzen App gleich, und das Fundament hat keinen Katalog.
 * Stünde sie an jeder Meldung, wäre eine davon irgendwann anders formuliert —
 * oder beim Übersetzen vergessen.
 */
export function useAppNotification(): AppNotifier {
  const settingsStore = useSettingsStore()
  const { t } = useI18n()

  return useNotifier(
    computed(() => settingsStore.settings.ui.notificationSeconds),
    (remaining) => t('notify.closesIn', { n: remaining }),
  )
}
