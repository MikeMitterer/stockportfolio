/**
 * Zeigt einen Toast, solange ein Zustand anhält.
 *
 * Toasts sind eigentlich für Ereignisse gedacht: einmal aufblitzen, dann weg.
 * Die Meldungen im Rebalancing sind aber Zustände — „der Plan ist nicht
 * gedeckt" bleibt wahr, bis man etwas ändert. Eine Einblendung, die nach fünf
 * Sekunden verschwindet, wäre also gelogen; eine Meldung im Fluss der Seite
 * verschiebt dafür beim Tippen die Tabelle.
 *
 * Deshalb hier beides: Der Toast erscheint, wenn der Zustand eintritt, bleibt
 * offen, solange er anhält, und verschwindet von selbst, sobald die Ursache
 * behoben ist. Wegklicken geht jederzeit — er kommt dann erst wieder, wenn der
 * Zustand zwischendurch weg war.
 */

import { onUnmounted, watch, type Ref } from 'vue'
import type { NotificationApi, NotificationReactive } from 'naive-ui'

export interface StateNotificationOptions {
  /** Überschrift des Toasts. */
  title: string
  /** Fließtext — wird bei jeder Änderung neu ausgewertet. */
  content: () => string
  type: 'error' | 'warning' | 'info'
}

/**
 * @param notification Naive-UI-API aus `useNotification()`.
 * @param active       Zustand; `true` zeigt den Toast.
 * @param options      Aussehen und Text.
 */
export function useStateNotification(
  notification: NotificationApi,
  active: Ref<boolean>,
  options: StateNotificationOptions,
): void {
  let handle: NotificationReactive | null = null

  /** Der Nutzer hat weggeklickt — nicht sofort wieder aufpoppen. */
  let dismissed = false

  function close(): void {
    handle?.destroy()
    handle = null
  }

  watch(
    [active, options.content],
    ([isActive, text]) => {
      if (!isActive) {
        close()
        dismissed = false
        return
      }

      if (handle) {
        // Nur den Text nachziehen — ein neuer Toast für dieselbe Ursache
        // würde bei jedem Tastendruck erneut aufspringen.
        handle.content = text
        return
      }

      if (dismissed) return

      handle = notification.create({
        title: options.title,
        content: text,
        type: options.type,
        // Fehler verschwinden nicht von selbst: Wer sie übersieht, plant
        // mit einer Zahl, die nicht aufgeht.
        duration: undefined,
        closable: true,
        onClose: () => {
          dismissed = true
          handle = null
        },
      })
    },
    { immediate: true },
  )

  onUnmounted(close)
}
