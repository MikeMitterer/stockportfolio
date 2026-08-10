/**
 * Erkennt schmale Bildschirme.
 *
 * Zentral statt in jeder Komponente: so gibt es genau **einen**
 * Umschaltpunkt. Tailwinds `md` liegt ebenfalls bei 768 px — Ansicht und
 * Layout-Klassen kippen damit gemeinsam.
 */

import { onMounted, onUnmounted, readonly, ref, type Ref } from 'vue'

/** Unterhalb dieser Breite gilt die Leseansicht. Entspricht Tailwinds `md`. */
export const COMPACT_BREAKPOINT_PX = 768

/**
 * Liefert `true`, solange das Fenster schmaler als der Umschaltpunkt ist.
 * Reagiert auf Größenänderungen und Drehen des Geräts.
 */
export function useIsCompact(): Readonly<Ref<boolean>> {
  const isCompact = ref<boolean>(false)

  let query: MediaQueryList | null = null

  function update(event: MediaQueryList | MediaQueryListEvent): void {
    isCompact.value = event.matches
  }

  onMounted(() => {
    query = window.matchMedia(`(max-width: ${COMPACT_BREAKPOINT_PX - 1}px)`)
    update(query)
    query.addEventListener('change', update)
  })

  onUnmounted(() => {
    query?.removeEventListener('change', update)
  })

  return readonly(isCompact)
}
