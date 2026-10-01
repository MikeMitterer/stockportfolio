/**
 * Tests für die Mindestanzeigedauer.
 *
 * Anlass war der Aktualisieren-Knopf in der Kopfzeile: Der globale Abruf liest
 * den Cache des Dienstes und ist nach Millisekunden fertig, der Spinner blitzte
 * also auf, ohne dass ihn jemand sah. Ein Knopf, der auf einen Klick sichtbar
 * gar nicht reagiert, wirkt tot.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick, ref, type Ref } from 'vue'
import { mount } from '@vue/test-utils'

import { useMinimumDuration } from '@/composables/useMinimumDuration'

const DAUER = 400

/** Hängt das Composable in eine Komponente ein — der Timer braucht einen Lebenszyklus. */
function mountWith(quelle: Ref<boolean>) {
  let gehalten!: Ref<boolean>

  const wrapper = mount(
    defineComponent({
      setup() {
        gehalten = useMinimumDuration(quelle, DAUER)
        return () => h('div')
      },
    }),
  )

  return { wrapper, gehalten: () => gehalten.value }
}

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

describe('useMinimumDuration', () => {
  it('schaltet sofort ein', async () => {
    const quelle = ref(false)
    const { gehalten } = mountWith(quelle)

    quelle.value = true
    await nextTick()

    expect(gehalten()).toBe(true)
  })

  it('hält den Zustand, wenn die Quelle zu früh abschaltet', async () => {
    const quelle = ref(false)
    const { gehalten } = mountWith(quelle)

    quelle.value = true
    await nextTick()
    quelle.value = false
    await nextTick()

    expect(gehalten()).toBe(true)

    vi.advanceTimersByTime(DAUER)
    await nextTick()

    expect(gehalten()).toBe(false)
  })

  it('schaltet sofort ab, wenn die Mindestdauer schon vorbei ist', async () => {
    const quelle = ref(false)
    const { gehalten } = mountWith(quelle)

    quelle.value = true
    await nextTick()
    vi.advanceTimersByTime(DAUER + 100)
    await nextTick()

    expect(gehalten()).toBe(true)

    quelle.value = false
    await nextTick()

    expect(gehalten()).toBe(false)
  })

  it('beginnt die Frist neu, wenn die Quelle erneut anspringt', async () => {
    const quelle = ref(false)
    const { gehalten } = mountWith(quelle)

    quelle.value = true
    await nextTick()
    vi.advanceTimersByTime(300)

    // Zweiter Abruf, bevor der erste seine Frist abgelaufen hat.
    quelle.value = false
    await nextTick()
    quelle.value = true
    await nextTick()

    vi.advanceTimersByTime(300)
    quelle.value = false
    await nextTick()

    // Die alte Frist wäre längst um — die neue noch nicht.
    expect(gehalten()).toBe(true)

    vi.advanceTimersByTime(100)
    await nextTick()

    expect(gehalten()).toBe(false)
  })

  it('räumt seinen Timer beim Abbau weg', async () => {
    const quelle = ref(false)
    const { wrapper, gehalten } = mountWith(quelle)

    quelle.value = true
    await nextTick()
    wrapper.unmount()

    expect(vi.getTimerCount()).toBe(0)
    expect(gehalten()).toBe(true)
  })
})
