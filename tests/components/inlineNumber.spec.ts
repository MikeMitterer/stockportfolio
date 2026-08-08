/**
 * Tests für InlineNumber — die Zahl, die direkt in der Tabellenzeile
 * editierbar ist.
 *
 * Der Auslöser für diese Tests: `<input type="number">` lässt Vues `v-model`
 * den Wert selbsttätig in eine **Zahl** umwandeln. Der ursprüngliche Code rief
 * `.replace()` darauf auf, warf eine TypeError und verschluckte damit jede
 * Eingabe — die Zelle sprang kommentarlos auf den alten Wert zurück.
 */

import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import InlineNumber from '@/components/InlineNumber.vue'

/** Öffnet den Editor und liefert das Eingabefeld. */
async function openEditor(wrapper: ReturnType<typeof mount>) {
  await wrapper.find('button').trigger('click')
  return wrapper.find('input')
}

function makeWrapper(props: Record<string, unknown> = {}) {
  return mount(InlineNumber, {
    props: { value: 10, display: '10,0 %', min: 0, max: 100, ...props },
  })
}

describe('InlineNumber — Anzeige', () => {
  it('zeigt im Ruhezustand den formatierten Text', () => {
    expect(makeWrapper().text()).toBe('10,0 %')
  })

  it('zeigt kein Eingabefeld, solange nicht editiert wird', () => {
    expect(makeWrapper().find('input').exists()).toBe(false)
  })

  it('öffnet bei Klick ein Eingabefeld mit dem Rohwert', async () => {
    const wrapper = makeWrapper()
    const input = await openEditor(wrapper)
    expect(input.exists()).toBe(true)
    expect((input.element as HTMLInputElement).value).toBe('10')
  })

  it('öffnet nichts, wenn deaktiviert', async () => {
    const wrapper = makeWrapper({ disabled: true })
    await wrapper.find('button').trigger('click')
    expect(wrapper.find('input').exists()).toBe(false)
  })
})

describe('InlineNumber — Übernehmen', () => {
  it('meldet den neuen Wert beim Verlassen des Feldes', async () => {
    const wrapper = makeWrapper()
    const input = await openEditor(wrapper)

    await input.setValue('42')
    await input.trigger('blur')

    expect(wrapper.emitted('commit')?.[0]).toEqual([42])
  })

  it('meldet den neuen Wert bei Enter', async () => {
    const wrapper = makeWrapper()
    const input = await openEditor(wrapper)

    await input.setValue('42')
    await input.trigger('keydown', { key: 'Enter' })

    expect(wrapper.emitted('commit')?.[0]).toEqual([42])
  })

  it('verkraftet einen Zahlwert aus v-model ohne zu werfen', async () => {
    // Der eigentliche Fehlerfall: type="number" liefert eine Zahl, keinen String.
    const wrapper = makeWrapper()
    const input = await openEditor(wrapper)

    await input.setValue(42)
    await input.trigger('blur')

    expect(wrapper.emitted('commit')?.[0]).toEqual([42])
  })

  it('übernimmt Nachkommastellen', async () => {
    const wrapper = makeWrapper()
    const input = await openEditor(wrapper)

    await input.setValue('12.5')
    await input.trigger('blur')

    expect(wrapper.emitted('commit')?.[0]).toEqual([12.5])
  })

  it('schließt das Feld nach dem Übernehmen', async () => {
    const wrapper = makeWrapper()
    const input = await openEditor(wrapper)
    await input.setValue('42')
    await input.trigger('blur')

    expect(wrapper.find('input').exists()).toBe(false)
  })
})

describe('InlineNumber — Grenzen und Sonderfälle', () => {
  it('meldet nichts, wenn der Wert unverändert bleibt', async () => {
    const wrapper = makeWrapper()
    const input = await openEditor(wrapper)

    await input.setValue('10')
    await input.trigger('blur')

    expect(wrapper.emitted('commit')).toBeUndefined()
  })

  it('deckelt nach oben auf max', async () => {
    const wrapper = makeWrapper()
    const input = await openEditor(wrapper)

    await input.setValue('150')
    await input.trigger('blur')

    expect(wrapper.emitted('commit')?.[0]).toEqual([100])
  })

  it('deckelt nach unten auf min', async () => {
    const wrapper = makeWrapper()
    const input = await openEditor(wrapper)

    await input.setValue('-20')
    await input.trigger('blur')

    expect(wrapper.emitted('commit')?.[0]).toEqual([0])
  })

  it('verwirft die Eingabe bei Escape', async () => {
    const wrapper = makeWrapper()
    const input = await openEditor(wrapper)

    await input.setValue('42')
    await input.trigger('keydown', { key: 'Escape' })

    expect(wrapper.emitted('commit')).toBeUndefined()
    expect(wrapper.find('input').exists()).toBe(false)
  })

  it('meldet nichts bei unlesbarer Eingabe', async () => {
    // Ein `type="number"`-Feld verwirft solchen Text und liefert einen leeren
    // Wert — der darf nicht als 0 durchgehen.
    const wrapper = makeWrapper()
    const input = await openEditor(wrapper)

    await input.setValue('keine Zahl')
    await input.trigger('blur')

    expect(wrapper.emitted('commit')).toBeUndefined()
  })

  it('setzt den Wert nicht auf 0, wenn das Feld geleert wird', async () => {
    const wrapper = makeWrapper()
    const input = await openEditor(wrapper)

    await input.setValue('')
    await input.trigger('blur')

    expect(wrapper.emitted('commit')).toBeUndefined()
  })

  it('meldet nur einmal, wenn nach Enter noch ein blur folgt', async () => {
    const wrapper = makeWrapper()
    const input = await openEditor(wrapper)

    await input.setValue('42')
    await input.trigger('keydown', { key: 'Enter' })
    await input.trigger('blur')

    expect(wrapper.emitted('commit')).toHaveLength(1)
  })
})
