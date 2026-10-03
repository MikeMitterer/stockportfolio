/**
 * Tests für den Satz, den ein Fehler über sich selbst sagt.
 *
 * „Netzwerkfehler" allein lässt offen, ob die Adresse falsch ist, das Netz
 * fehlt oder der Dienst streikt. Stand früher eine falsche StockInfo-Adresse
 * in der Konfiguration, war das genau die Lage: Die Meldung bei den Papieren nannte
 * weder woher noch weshalb. Die Statusseite konnte es längst — die Fassung
 * dort war nur nicht zu erreichen.
 */

import { describe, expect, it } from 'vitest'

import { ApiError, describeFailure } from '@/api/stockinfo/errors'
import { translate } from '@/i18n'

describe('describeFailure', () => {
  it('nennt die Adresse, wenn gar keine Antwort kam', () => {
    const satz = describeFailure(
      new ApiError(0, 'Failed to fetch', 'https://falsch.example/instruments'),
    )

    expect(satz).toContain('https://falsch.example/instruments')
    expect(satz).toContain('Failed to fetch')
  })

  it('nennt bei ausbleibender Antwort die angefragte Adresse ohne Herkunftsangabe', () => {
    const satz = describeFailure(new ApiError(0, 'Failed to fetch', '/api/stockinfo/health'))
    expect(satz).toContain('/api/stockinfo/health')
    expect(satz).not.toContain('STOCKINFO_API_URL')
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
