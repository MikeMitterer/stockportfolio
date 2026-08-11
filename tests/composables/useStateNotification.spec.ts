/**
 * Tests für die Zustands-Meldung.
 *
 * Anlass war ein Fehler im Browser: Das Composable wertete den Textbaustein
 * schon während `setup()` aus. Verwies er auf eine Konstante, die weiter unten
 * in der Datei stand, warf das — und der Aufrufer musste seine Deklarationen
 * nach den Bedürfnissen des Composables ordnen. Diese Falle hält der erste
 * Test fest.
 */

import { describe, expect, it, vi } from 'vitest'
import { defineComponent, h, ref } from 'vue'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { useStateNotification } from '@/composables/useStateNotification'
import type { NotificationApi, NotificationReactive } from 'naive-ui'

/** Notification-API-Attrappe, die die erzeugten Meldungen sammelt. */
function fakeNotification() {
  const created: { title: string; content: string }[] = []
  const destroy = vi.fn()

  const api = {
    create: (options: { title?: string; content?: string }) => {
      created.push({ title: options.title ?? '', content: String(options.content ?? '') })
      return { destroy, content: '', meta: '' } as unknown as NotificationReactive
    },
  } as unknown as NotificationApi

  return { api, created, destroy }
}

/** Hängt das Composable in eine Komponente ein — es braucht einen Lebenszyklus. */
function mountWith(setup: () => void) {
  setActivePinia(createPinia())
  return mount(
    defineComponent({
      setup() {
        setup()
        return () => h('div')
      },
    }),
  )
}

describe('useStateNotification', () => {
  it('wertet den Text nicht schon während setup() aus', () => {
    // Der eigentliche Fehler: Ein Verweis auf eine später deklarierte
    // Konstante warf, bevor die Komponente überhaupt stand.
    const { api } = fakeNotification()

    expect(() =>
      mountWith(() => {
        const active = ref(true)
        useStateNotification(api, active, {
          title: 'Test',
          type: 'warning',
          // Greift auf etwas zu, das erst nach diesem Aufruf entsteht.
          content: () => spaeter.value,
          seconds: ref(0),
        })
        const spaeter = ref('Text von weiter unten')
      }),
    ).not.toThrow()
  })

  it('zeigt eine Meldung, wenn der Zustand schon beim Aufbau gilt', () => {
    const { api, created } = fakeNotification()

    mountWith(() => {
      useStateNotification(api, ref(true), {
        title: 'Plan nicht gedeckt',
        type: 'error',
        content: () => 'Es fehlen 100 €',
        seconds: ref(0),
      })
    })

    expect(created).toHaveLength(1)
    expect(created[0]).toEqual({ title: 'Plan nicht gedeckt', content: 'Es fehlen 100 €' })
  })

  it('zeigt nichts, solange der Zustand nicht gilt', () => {
    const { api, created } = fakeNotification()

    mountWith(() => {
      useStateNotification(api, ref(false), {
        title: 'Test',
        type: 'warning',
        content: () => 'egal',
        seconds: ref(0),
      })
    })

    expect(created).toHaveLength(0)
  })

  it('meldet sich, sobald der Zustand eintritt', async () => {
    const { api, created } = fakeNotification()
    const active = ref(false)

    mountWith(() => {
      useStateNotification(api, active, {
        title: 'Test',
        type: 'warning',
        content: () => 'jetzt',
        seconds: ref(0),
      })
    })

    active.value = true
    await new Promise((resolve) => setTimeout(resolve, 0))

    expect(created).toHaveLength(1)
  })

  it('räumt beim Verlassen der Ansicht auf', () => {
    // Sonst bliebe der Zähler laufen, nachdem niemand mehr hinsieht.
    const { api, destroy } = fakeNotification()
    const wrapper = mountWith(() => {
      useStateNotification(api, ref(true), {
        title: 'Test',
        type: 'warning',
        content: () => 'x',
        seconds: ref(0),
      })
    })

    wrapper.unmount()

    expect(destroy).toHaveBeenCalled()
  })
})
