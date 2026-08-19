import { onScopeDispose, ref, watch, type Ref } from 'vue'

/**
 * Vorgabe für die Mindestdauer.
 *
 * Kurz genug, dass niemand wartet, lang genug, dass das Auge es mitbekommt —
 * unterhalb von rund einem Drittel einer Sekunde liest sich ein erscheinender
 * und sofort verschwindender Spinner als Zucken, nicht als Rückmeldung.
 */
export const MIN_VISIBLE_MS = 400

/**
 * Hält einen Zustand mindestens so lange, wie er zu sehen sein soll.
 *
 * Anlass ist der Aktualisieren-Knopf in der Kopfzeile: Der globale Abruf liest
 * den Cache des Dienstes und ist nach Millisekunden fertig — der Spinner
 * blitzte auf, ohne dass ihn jemand wahrnahm, und der Knopf wirkte tot.
 *
 * Bewusst nicht im Store: Dort steht, ob tatsächlich etwas läuft. Ob eine
 * Anzeige dem Auge noch einen Moment länger standhält, ist eine Frage der
 * Oberfläche und geht die Wahrheit über den Ladezustand nichts an.
 *
 * Das Gegenstück wäre, den Spinner erst nach einer Weile zu zeigen — das
 * vermeidet Flackern, ist hier aber falsch: Nach einem eigenen Klick will man
 * eine Bestätigung sehen, nicht nichts.
 *
 * @param source Der tatsächliche Zustand.
 * @param ms Wie lange er mindestens sichtbar bleibt, sobald er einschaltet.
 * @returns Derselbe Zustand, nur nicht kürzer als `ms`.
 */
export function useMinimumDuration(source: Ref<boolean>, ms = MIN_VISIBLE_MS): Ref<boolean> {
  const held = ref<boolean>(source.value)

  let timer: ReturnType<typeof setTimeout> | null = null
  // Ist die Frist des laufenden Durchgangs schon um?
  let expired = true

  function clear(): void {
    if (timer === null) return
    clearTimeout(timer)
    timer = null
  }

  watch(source, (active) => {
    if (active) {
      // Erneutes Anspringen setzt die Frist neu — sonst erbt ein zweiter
      // Abruf die Restzeit des ersten und wird zu kurz gezeigt.
      clear()
      expired = false
      held.value = true
      timer = setTimeout(() => {
        timer = null
        expired = true
        if (!source.value) held.value = false
      }, ms)
      return
    }

    // Läuft die Frist noch, schaltet der Timer ab, nicht dieser Zweig.
    if (expired) held.value = false
  })

  onScopeDispose(clear)

  return held
}
