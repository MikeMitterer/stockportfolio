/**
 * Tests für die Altersangabe der Kurse.
 *
 * Der Punkt ist das Nachführen: „vor 2 Min" steht in Kopf- und Statuszeile
 * und stimmt eine Minute später nicht mehr. Ohne eigenen Takt bliebe die
 * Angabe stehen, bis irgendetwas anderes ein Neuzeichnen auslöst — und das
 * kann Stunden dauern, weil die Seite ansonsten ruhig ist. Der Nutzer liest
 * dann eine Zahl, die er für aktuell hält.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick, ref } from 'vue'
import { mount } from '@vue/test-utils'
import { formatAge, useRelativeTime } from '@/composables/useRelativeTime'

const JETZT = Date.parse('2026-08-16T12:00:00Z')

/** Hängt das Composable in eine Komponente ein — der Takt braucht einen Lebenszyklus. */
function mountWithAge(isoTimestamp: string | null) {
  return mount(
    defineComponent({
      setup() {
        const label = useRelativeTime(ref(isoTimestamp))
        return () => h('div', label.value)
      },
    }),
  )
}

describe('formatAge', () => {
  it('formuliert das Alter in der Sprache der App', () => {
    expect(formatAge('2026-08-16T11:59:50Z', JETZT)).toBe('just now')
    expect(formatAge('2026-08-16T11:48:00Z', JETZT)).toBe('12 min ago')
    expect(formatAge('2026-08-16T09:00:00Z', JETZT)).toBe('3 h ago')
    expect(formatAge(null, JETZT)).toBe('never')
  })
})

describe('useRelativeTime', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(JETZT)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('zeigt das Alter beim Einhängen', async () => {
    const wrapper = mountWithAge('2026-08-16T11:58:00Z')
    await nextTick()
    expect(wrapper.text()).toBe('2 min ago')
  })

  it('zieht die Angabe nach, während die Seite ruhig bleibt', async () => {
    const wrapper = mountWithAge('2026-08-16T11:58:00Z')
    await nextTick()

    // Nichts passiert — nur die Zeit vergeht.
    vi.advanceTimersByTime(3 * 60_000)
    await nextTick()

    expect(wrapper.text()).toBe('5 min ago')
  })

  it('lässt keinen Takt zurück, wenn die Komponente verschwindet', async () => {
    const wrapper = mountWithAge('2026-08-16T11:58:00Z')
    await nextTick()
    wrapper.unmount()

    expect(vi.getTimerCount()).toBe(0)
  })
})
