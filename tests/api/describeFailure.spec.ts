/**
 * Tests für den Satz, den ein Fehler über sich selbst sagt.
 *
 * „Netzwerkfehler" allein lässt offen, ob die Adresse falsch ist, das Netz
 * fehlt oder der Dienst streikt. Steht eine falsche `VITE_STOCKINFO_API_URL`
 * in der `.env`, war das genau die Lage: Die Meldung bei den Papieren nannte
 * weder woher noch weshalb. Die Statusseite konnte es längst — die Fassung
 * dort war nur nicht zu erreichen.
 */

import { describe, expect, it } from 'vitest'

import { ApiError, describeFailure } from '@/api/errors'
import { translate } from '@/i18n'

describe('describeFailure', () => {
  it('nennt die Adresse, wenn gar keine Antwort kam', () => {
    const satz = describeFailure(
      new ApiError(0, 'Failed to fetch', 'https://falsch.example/instruments'),
    )

    expect(satz).toContain('https://falsch.example/instruments')
    expect(satz).toContain('Failed to fetch')
  })

  /**
   * Die Adresse allein genügt nicht: Steht sie falsch da, muss man wissen, wo
   * man sie ändert. Im Container kommt sie aus einer Umgebungsvariablen, in
   * der Entwicklung aus der `.env` — zwei sehr verschiedene Orte.
   */
  it('nennt die Herkunft der Adresse, wenn der Client sie kennt', () => {
    const ausDatei = describeFailure(
      new ApiError(0, 'Failed to fetch', 'https://falsch.example/x', 'build'),
    )
    const ausContainer = describeFailure(
      new ApiError(0, 'Failed to fetch', 'https://falsch.example/x', 'runtime'),
    )

    expect(ausDatei).toContain('VITE_STOCKINFO_API_URL')
    expect(ausDatei).toContain('.env')
    expect(ausContainer).toContain('STOCKINFO_API_URL')
  })

  /**
   * Der Container ohne gesetzte Variable — der Fall, den die erste Fassung
   * verfehlte. Dort gilt zwar der Wert aus dem Build, aber eine `.env` gibt es
   * nicht: Wer die Adresse ändern will, setzt `STOCKINFO_API_URL` am Container.
   * Der Hinweis auf die `.env` schickte ihn an einen Ort, den es nicht gibt.
   */
  it('schickt im Container nicht zur .env, wenn die Variable fehlt', () => {
    const satz = describeFailure(
      new ApiError(0, 'Failed to fetch', 'https://falsch.example/x', 'container-build'),
    )

    expect(satz).toContain('STOCKINFO_API_URL')
    expect(satz).not.toContain('.env')
  })

  it('lässt die Herkunft weg, wenn der Dienst geantwortet hat', () => {
    // Dann stimmt die Adresse ja — der Hinweis führte in die Irre.
    const satz = describeFailure(new ApiError(502, 'Upstream weg', 'https://api.example/x', 'build'))

    expect(satz).not.toContain('VITE_STOCKINFO_API_URL')
  })

  it('nennt den Statuscode, wenn der Dienst geantwortet hat', () => {
    const satz = describeFailure(new ApiError(503, 'Upstream weg', 'https://api.example/quote'))

    expect(satz).toContain('Upstream weg')
    expect(satz).toContain('503')
    // Die Adresse hilft hier nicht weiter — sie stimmt ja, der Dienst streikt.
    expect(satz).not.toContain('https://api.example/quote')
  })

  it('reicht die Nachricht eines gewöhnlichen Fehlers durch', () => {
    expect(describeFailure(new Error('kaputt'))).toBe('kaputt')
  })

  /**
   * `String(cause)` stünde bei einem fremden Wert wörtlich vor dem Nutzer —
   * „undefined", „null" oder „[object Object]", auf der Statusseite und im
   * Dialog. Ein `toBeTruthy()` hätte das nicht bemerkt.
   */
  it('nennt bei etwas, das gar kein Fehler ist, den übersetzten Rückfall', () => {
    const satz = describeFailure(undefined)

    expect(satz).not.toContain('undefined')
    expect(satz).toBe(translate('notify.unknownError'))
  })
})
