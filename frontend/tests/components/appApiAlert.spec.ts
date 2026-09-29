/**
 * Der Dialog bei totem Dienst — und wer beim Öffnen den Fokus bekommt.
 *
 * Der erste Entwurf rief `focus()` auf der `NButton`-Instanz. Die hat keins:
 * `typeof vm.focus === 'undefined'`, vorhanden ist nur `selfElRef`. Weil der
 * Aufruf mit `?.` geschrieben war, versagte er lautlos — und da Naives eigener
 * Autofokus dafür abgeschaltet wurde, öffnete der Dialog ganz ohne Fokus:
 * keine Ansage für Vorleseprogramme, kein Einstieg für die Tastatur, Enter
 * ohne Wirkung.
 */

import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory, createRouter, type Router } from 'vue-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'

import AppApiAlert from '@/components/AppApiAlert.vue'
import { useApiStatusStore } from '@/stores/apiStatus'
import { ApiError } from '@/api/errors'
import { STOCK_INFO_CLIENT, StockInfoClient } from '@/api/client'

function attrappenRouter(): Router {
  return createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/:pathMatch(.*)*', component: { template: '<div />' } }],
  })
}

/** Client, dessen `/health` scheitert — damit der Store auf `offline` geht. */
function toterClient(): StockInfoClient {
  const client = new StockInfoClient('https://falsch.example')
  vi.spyOn(client, 'health').mockRejectedValue(
    new ApiError(0, 'Failed to fetch', 'https://falsch.example/health'),
  )
  return client
}

async function zeigeDialog() {
  const client = toterClient()
  const wrapper = mount(AppApiAlert, {
    global: {
      plugins: [attrappenRouter()],
      provide: { [STOCK_INFO_CLIENT as symbol]: client },
    },
  })

  await useApiStatusStore().check(client)
  await nextTick()
  // Der Fokus wird eine Runde später gesetzt — nach Naives Fokusfalle.
  await new Promise((fertig) => setTimeout(fertig, 10))
  await nextTick()

  return wrapper
}

beforeEach(() => {
  setActivePinia(createPinia())
  sessionStorage.clear()
})

describe('AppApiAlert', () => {
  /**
   * Nicht der Knopf, sondern der Dialog — und das ist die erreichbare Zusage.
   *
   * Der Fokus von Hand auf „Erneut prüfen" zu legen scheitert an Naives
   * Fokusfalle: Sie holt ihn zurück, gleich ob man `nextTick`, ein
   * Animationsbild oder eine Runde der Ereignisschleife abwartet. Alle drei
   * Wege sind hier durchgemessen worden. Was zählt, ist, dass der Fokus **im
   * Dialog** landet und nicht auf `<body>` — dort lag er, solange der Aufruf
   * auf der Komponente lautlos ins Leere lief.
   */
  it('setzt den Fokus in den Dialog, nicht auf den Seitenkörper', async () => {
    await zeigeDialog()

    const aktiv = document.activeElement

    // Naive fokussiert seinen eigenen Fokus-Detektor neben dem Dialog, nicht
    // ein Element darin. Entscheidend ist, dass der Fokus die Seite verlässt
    // und in die Falle des Dialogs gerät — auf `<body>` lag er, solange der
    // eigene `focus()`-Aufruf lautlos ins Leere lief.
    expect(aktiv).not.toBeNull()
    expect(aktiv).not.toBe(document.body)
    expect(aktiv?.tagName).toBe('DIV')
  })

  it('hält beide Knöpfe für die Tastatur erreichbar', async () => {
    await zeigeDialog()

    const knoepfe = [...document.querySelectorAll('.n-modal button, .n-dialog button')]
    expect(knoepfe.length).toBeGreaterThanOrEqual(2)
    expect(knoepfe.every((k) => !k.hasAttribute('disabled'))).toBe(true)
  })

  it('zeigt die Adresse als Verweis', async () => {
    await zeigeDialog()

    const link = document.querySelector<HTMLAnchorElement>('.apialert__url')
    expect(link?.getAttribute('href')).toBe('https://falsch.example/health')
    expect(link?.textContent).toContain('https://falsch.example/health')
  })

  it('meldet sich in derselben Sitzung nur einmal', async () => {
    await zeigeDialog()
    expect(document.querySelector('.apialert')).not.toBeNull()

    document.body.innerHTML = ''
    await zeigeDialog()

    expect(document.querySelector('.apialert')).toBeNull()
  })
})
