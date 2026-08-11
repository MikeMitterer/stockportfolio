/**
 * Zeigt einen Toast, solange ein Zustand anhält.
 *
 * Toasts sind eigentlich für Ereignisse gedacht: einmal aufblitzen, dann weg.
 * Die Meldungen im Rebalancing sind aber Zustände — „der Plan ist nicht
 * gedeckt" bleibt wahr, bis man etwas ändert. Eine Einblendung, die nach fünf
 * Sekunden verschwindet, wäre also gelogen; eine Meldung im Fluss der Seite
 * verschiebt dafür beim Tippen die Tabelle.
 *
 * Deshalb hier beides: Der Toast erscheint, wenn der Zustand eintritt, und
 * verschwindet von selbst, sobald die Ursache behoben ist. Zusätzlich läuft
 * ein Zähler, nach dem er sich ausblendet, auch wenn der Zustand noch besteht
 * — sonst steht er einem beim Tippen dauerhaft im Weg. Wer ihn lieber stehen
 * hat, stellt den Zähler auf 0.
 *
 * Ausgeblendet heißt nicht erledigt: Der Zustand steht weiterhin im Kopf der
 * Seite („nicht gedeckt"), und sobald er zwischendurch weg war und wiederkehrt,
 * meldet sich der Toast erneut.
 */

import { onMounted, onUnmounted, watch, type Ref } from 'vue'
import type { NotificationApi, NotificationReactive } from 'naive-ui'

export interface StateNotificationOptions {
  /** Überschrift des Toasts. */
  title: string
  /** Fließtext — wird bei jeder Änderung neu ausgewertet. */
  content: () => string
  type: 'error' | 'warning' | 'info'
  /**
   * Sekunden bis zum selbsttätigen Ausblenden; `0` lässt den Toast stehen.
   * Als Ref, damit eine Änderung in den Einstellungen sofort greift.
   */
  seconds: Ref<number>
}

/**
 * @param notification Naive-UI-API aus `useNotification()`.
 * @param active       Zustand; `true` zeigt den Toast.
 * @param options      Aussehen, Text und Zähler.
 */
export function useStateNotification(
  notification: NotificationApi,
  active: Ref<boolean>,
  options: StateNotificationOptions,
): void {
  let handle: NotificationReactive | null = null
  let ticker: ReturnType<typeof setInterval> | null = null

  /** Der Toast ist weg — nicht sofort wieder aufpoppen. */
  let dismissed = false

  function stopTicker(): void {
    if (ticker !== null) clearInterval(ticker)
    ticker = null
  }

  function close(): void {
    stopTicker()
    handle?.destroy()
    handle = null
  }

  /** Zählt sichtbar herunter und blendet am Ende aus. */
  function startTicker(): void {
    stopTicker()
    const total = Math.round(options.seconds.value)
    if (total <= 0) return

    let remaining = total
    const show = (): void => {
      if (handle) handle.meta = `schließt in ${remaining} s`
    }
    show()

    ticker = setInterval(() => {
      remaining -= 1
      if (remaining <= 0) {
        // Wie ein Wegklicken: Der Zustand bleibt, die Meldung geht.
        dismissed = true
        close()
        return
      }
      show()
    }, 1000)
  }

  /*
   * Erst nach dem Aufbau der Komponente beobachten.
   *
   * `options.content` steht in den Quellen des Watchers und würde mit
   * `immediate` schon während `setup()` ausgeführt. Verweist der Text auf eine
   * Konstante, die weiter unten in der Datei steht, wirft das — und der
   * Aufrufer muss seine Deklarationen nach den Bedürfnissen dieses
   * Composables ordnen. Das ist eine Falle, die früher oder später jeder
   * hineintappt; ein Toast ein Bild später fällt dagegen niemandem auf.
   */
  onMounted(() => {
    watch(
      [active, options.content, options.seconds],
      ([isActive, text]) => {
        if (!isActive) {
          close()
          dismissed = false
          return
        }

        if (handle) {
          // Nur den Text nachziehen — ein neuer Toast für dieselbe Ursache
          // würde bei jedem Tastendruck erneut aufspringen. Der Zähler läuft
          // dabei weiter, sonst ließe er sich durch Tippen endlos verlängern.
          handle.content = text
          return
        }

        if (dismissed) return

        handle = notification.create({
          title: options.title,
          content: text,
          type: options.type,
          // Kein `duration`: Der Zähler unten macht das sichtbar und lässt sich
          // in den Einstellungen abschalten.
          closable: true,
          onClose: () => {
            dismissed = true
            stopTicker()
            handle = null
          },
        })
        startTicker()
      },
      { immediate: true },
    )
  })

  onUnmounted(close)
}
