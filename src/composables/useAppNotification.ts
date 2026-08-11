/**
 * Meldungen der App — einheitlich als Toast.
 *
 * Nimmt `useStateNotification` die Wiederholung ab: den Zugriff auf die
 * Naive-UI-API und den Zähler aus den Einstellungen. Ohne das stünde in jeder
 * Ansicht dieselbe Verdrahtung, und eine davon wäre irgendwann anders.
 *
 * Was hier hineingehört: Aussagen über den **Zustand der Daten** — Kurse
 * fehlen, eine Position notiert fremd, die Ziele ergeben nicht 100 %. Was
 * nicht: Hinweise im Formular selbst. Eine Warnung zum Feld, in das man gerade
 * tippt, gehört neben das Feld und nicht in die Ecke des Fensters.
 */

import { computed, type Ref } from 'vue'
import { useNotification } from 'naive-ui'
import { useSettingsStore } from '@/stores/settings'
import { useStateNotification } from '@/composables/useStateNotification'

export interface AppNotificationOptions {
  title: string
  content: () => string
  type: 'error' | 'warning' | 'info'
}

export interface AppNotifier {
  /**
   * Zeigt eine Meldung, solange `active` gilt.
   *
   * @param active  Zustand, der die Meldung auslöst.
   * @param options Titel, Text und Art.
   */
  notify: (active: Ref<boolean>, options: AppNotificationOptions) => void
}

/**
 * Liefert `notify` mit vorverdrahteter API und Zähler aus den Einstellungen.
 *
 * Muss in `setup()` aufgerufen werden — `useNotification` und der Store
 * brauchen den Komponenten-Kontext.
 */
export function useAppNotification(): AppNotifier {
  const notification = useNotification()
  const settingsStore = useSettingsStore()

  const seconds = computed(() => settingsStore.settings.ui.notificationSeconds)

  return {
    notify(active, options) {
      useStateNotification(notification, active, { ...options, seconds })
    },
  }
}
